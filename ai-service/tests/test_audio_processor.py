import asyncio
import base64
import io
import tempfile
import wave
from pathlib import Path
from unittest.mock import AsyncMock, Mock

import httpx
try:
    import pytest
except ImportError:
    import unittest
    raise unittest.SkipTest("pytest is not installed; run these tests in the Docker/CI environment with pytest.")
from fastapi import HTTPException

from app.services import audio_processor as audio_module
from app.services.audio_processor import AudioProcessor


def make_wav(rate: int = 16000, channels: int = 1, width: int = 2,
             frames: int = 8) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as output:
        output.setframerate(rate)
        output.setnchannels(channels)
        output.setsampwidth(width)
        output.writeframes(b"\x00" * frames * channels * width)
    return buffer.getvalue()


class FakeStderr:
    def __init__(self, data: bytes, events: list[str], released: asyncio.Event) -> None:
        self.data = data
        self.events = events
        self.released = released

    async def read(self, size: int) -> bytes:
        await self.released.wait()
        chunk = self.data[:size]
        self.data = self.data[size:]
        if not chunk:
            self.events.append("stderr_finished")
        return chunk


class FakeProcess:
    def __init__(self, events: list[str], returncode: int | None = 0,
                 diagnostics: bytes = b"") -> None:
        self.events = events
        self.returncode = returncode
        self.started = asyncio.Event()
        self.finished = asyncio.Event()
        if returncode is not None:
            self.finished.set()
        self.stderr = FakeStderr(diagnostics, events, self.finished)

    async def wait(self) -> int:
        self.started.set()
        await self.finished.wait()
        self.events.append("reaped")
        assert self.returncode is not None
        return self.returncode

    def kill(self) -> None:
        self.events.append("killed")
        self.returncode = -9
        self.finished.set()


@pytest.fixture
def conversion_environment(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> dict:
    events: list[str] = []
    directories: list[Path] = []

    class TrackedDirectory:
        def __init__(self, prefix: str) -> None:
            self.directory = tempfile.TemporaryDirectory(prefix=prefix, dir=tmp_path)
            self.name = self.directory.name
            directories.append(Path(self.name))

        def cleanup(self) -> None:
            events.append("cleanup")
            self.directory.cleanup()

    spawn = AsyncMock()
    monkeypatch.setattr(audio_module, "TemporaryDirectory", TrackedDirectory)
    monkeypatch.setattr(audio_module.asyncio, "create_subprocess_exec", spawn)
    return {"events": events, "directories": directories, "spawn": spawn}


def configure_process(environment: dict, returncode: int | None = 0,
                      diagnostics: bytes = b"", output: bytes | None = None) -> FakeProcess:
    process = FakeProcess(environment["events"], returncode, diagnostics)

    async def spawn(*arguments: str, **kwargs: object) -> FakeProcess:
        input_path = Path(arguments[arguments.index("-i") + 1])
        assert input_path.read_bytes()
        if returncode == 0:
            Path(arguments[-1]).write_bytes(make_wav() if output is None else output)
        return process

    environment["spawn"].side_effect = spawn
    return process


def assert_cleaned(environment: dict, has_process: bool = True) -> None:
    assert len(environment["directories"]) == 1
    assert not environment["directories"][0].exists()
    events = environment["events"]
    assert events.count("cleanup") == 1
    if has_process:
        assert events.index("reaped") < events.index("cleanup")
        assert events.index("stderr_finished") < events.index("cleanup")


@pytest.mark.parametrize("prefix", ["", "data:audio/webm;codecs=opus;base64,",
                                   "data:audio/mpeg;base64,"])
def test_base64_converts_once_independent_of_mime(
    monkeypatch: pytest.MonkeyPatch, prefix: str,
) -> None:
    raw_bytes = b"source bytes at the converter boundary"
    wav_bytes = make_wav()
    converter = AsyncMock(return_value=wav_bytes)
    monkeypatch.setattr(AudioProcessor, "convert_to_wav", converter)
    result = asyncio.run(AudioProcessor.get_audio_bytes(
        audio_base64=prefix + base64.b64encode(raw_bytes).decode("ascii"),
    ))
    assert result == (wav_bytes, "audio/wav")
    converter.assert_awaited_once_with(raw_bytes)


def test_url_download_converts_once(monkeypatch: pytest.MonkeyPatch) -> None:
    raw_bytes = b"downloaded converter input"
    wav_bytes = make_wav()
    converter = AsyncMock(return_value=wav_bytes)
    get = AsyncMock(return_value=httpx.Response(200, content=raw_bytes))
    client = AsyncMock()
    client.__aenter__.return_value.get = get
    factory = Mock(return_value=client)
    monkeypatch.setattr(audio_module.httpx, "AsyncClient", factory)
    monkeypatch.setattr(AudioProcessor, "convert_to_wav", converter)
    assert asyncio.run(AudioProcessor.get_audio_bytes(
        audio_url="https://storage.example/audio",
    )) == (wav_bytes, "audio/wav")
    factory.assert_called_once_with(timeout=30.0)
    get.assert_awaited_once_with("https://storage.example/audio")
    converter.assert_awaited_once_with(raw_bytes)


def test_base64_takes_priority_over_url(monkeypatch: pytest.MonkeyPatch) -> None:
    converter = AsyncMock(return_value=make_wav())
    download = AsyncMock()
    monkeypatch.setattr(AudioProcessor, "convert_to_wav", converter)
    monkeypatch.setattr(AudioProcessor, "_download_audio", download)
    asyncio.run(AudioProcessor.get_audio_bytes(
        audio_url="https://storage.example/audio", audio_base64="YQ==",
    ))
    converter.assert_awaited_once_with(b"a")
    download.assert_not_awaited()


def test_wav_input_still_converts_once(monkeypatch: pytest.MonkeyPatch) -> None:
    wav_bytes = make_wav()
    converter = AsyncMock(return_value=wav_bytes)
    monkeypatch.setattr(AudioProcessor, "convert_to_wav", converter)
    result = asyncio.run(AudioProcessor.get_audio_bytes(
        audio_base64=base64.b64encode(wav_bytes).decode("ascii"),
    ))
    assert result == (wav_bytes, "audio/wav")
    converter.assert_awaited_once_with(wav_bytes)


@pytest.mark.parametrize("encoded", ["not base64!", "YQ==\n", "", "data:audio/webm;base64,", None])
def test_invalid_or_missing_base64_returns_400(
    monkeypatch: pytest.MonkeyPatch, encoded: str | None,
) -> None:
    converter = AsyncMock()
    monkeypatch.setattr(AudioProcessor, "convert_to_wav", converter)
    with pytest.raises(HTTPException) as error:
        asyncio.run(AudioProcessor.get_audio_bytes(audio_base64=encoded))
    assert error.value.status_code == 400
    converter.assert_not_awaited()


def test_empty_url_bytes_returns_400(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(AudioProcessor, "_download_audio", AsyncMock(return_value=b""))
    converter = AsyncMock()
    monkeypatch.setattr(AudioProcessor, "convert_to_wav", converter)
    with pytest.raises(HTTPException) as error:
        asyncio.run(AudioProcessor.get_audio_bytes(audio_url="https://storage.example/audio"))
    assert error.value.status_code == 400
    converter.assert_not_awaited()


def test_base64_length_limit_precedes_decode(monkeypatch: pytest.MonkeyPatch) -> None:
    decode = Mock(side_effect=AssertionError("Oversized input must not be decoded"))
    converter = AsyncMock()
    monkeypatch.setattr(audio_module.base64, "b64decode", decode)
    monkeypatch.setattr(AudioProcessor, "convert_to_wav", converter)
    with pytest.raises(HTTPException) as error:
        asyncio.run(AudioProcessor.get_audio_bytes(
            audio_base64="A" * (audio_module.MAX_BASE64_LENGTH + 1),
        ))
    assert error.value.status_code == 413
    assert "25 MiB" in error.value.detail
    decode.assert_not_called()
    converter.assert_not_awaited()


@pytest.mark.parametrize("source", ["base64", "url"])
def test_actual_input_bytes_limit_returns_413(
    monkeypatch: pytest.MonkeyPatch, source: str,
) -> None:
    assert audio_module.MAX_INPUT_SIZE_BYTES == 25 * 1024 * 1024
    raw_bytes = b"a" * (25 * 1024 * 1024 + 1)
    converter = AsyncMock()
    monkeypatch.setattr(AudioProcessor, "convert_to_wav", converter)
    if source == "base64":
        encoded = base64.b64encode(raw_bytes).decode("ascii")
        assert len(encoded) <= audio_module.MAX_BASE64_LENGTH
        arguments = {"audio_base64": encoded}
    else:
        monkeypatch.setattr(AudioProcessor, "_download_audio", AsyncMock(return_value=raw_bytes))
        arguments = {"audio_url": "https://storage.example/audio"}
    with pytest.raises(HTTPException) as error:
        asyncio.run(AudioProcessor.get_audio_bytes(**arguments))
    assert error.value.status_code == 413
    assert "25 MiB" in error.value.detail
    converter.assert_not_awaited()


def test_ffmpeg_arguments_and_success_cleanup(conversion_environment: dict) -> None:
    async def scenario() -> None:
        configure_process(conversion_environment)
        assert await AudioProcessor.convert_to_wav(make_wav()) == make_wav()

    asyncio.run(scenario())
    directory = conversion_environment["directories"][0]
    conversion_environment["spawn"].assert_awaited_once_with(
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-xerror", "-noauto_conversion_filters", "-filter_threads", "1",
        "-protocol_whitelist", "file", "-threads", "1", "-i", str(directory / "input.bin"),
        "-map", "0:a:0", "-vn", "-sn", "-dn", "-af",
        "aresample=resampler=swr:osr=16000:osf=s16:ochl=mono:dither_method=0:async=0",
        "-c:a", "pcm_s16le", "-threads:a", "1", "-map_metadata", "-1",
        "-map_chapters", "-1", "-fs", "10485761", "-f", "wav", str(directory / "output.wav"),
        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
    )
    assert_cleaned(conversion_environment)


def test_missing_ffmpeg_returns_500_and_cleans_directory(conversion_environment: dict) -> None:
    conversion_environment["spawn"].side_effect = FileNotFoundError("private executable path")
    with pytest.raises(HTTPException) as error:
        asyncio.run(AudioProcessor.convert_to_wav(b"converter input"))
    assert error.value.status_code == 500
    assert error.value.detail == "Dịch vụ chuyển đổi âm thanh chưa sẵn sàng: không tìm thấy FFmpeg."
    conversion_environment["spawn"].assert_awaited_once()
    assert_cleaned(conversion_environment, has_process=False)


@pytest.mark.parametrize("returncode,diagnostics,status_code", [
    (1, b"Invalid data found when processing input", 422),
    (1, (
        b"Stream map '' matches no streams.\n"
        b"To ignore this, add a trailing '?' to the map.\n"
        b"Failed to set value '0:a:0' for option 'map': Invalid argument\n"
        b"Error parsing options for output file /private/input/output.wav.\n"
        b"Error opening output files: Invalid argument\n"
    ), 422),
    (1, b"Unrecognized option 'noauto_conversion_filters'", 500),
    (-15, b"terminated externally", 500),
])
def test_process_failure_status_without_retry_and_cleanup(
    conversion_environment: dict, returncode: int, diagnostics: bytes, status_code: int,
) -> None:
    async def scenario() -> None:
        configure_process(conversion_environment, returncode, diagnostics)
        with pytest.raises(HTTPException) as error:
            await AudioProcessor.convert_to_wav(b"converter input")
        assert error.value.status_code == status_code
        assert diagnostics.decode() not in error.value.detail
        assert str(conversion_environment["directories"][0]) not in error.value.detail
        if status_code == 422:
            assert error.value.detail == (
                "Không thể giải mã âm thanh: dữ liệu bị hỏng hoặc định dạng/codec không được hỗ trợ."
            )
        elif returncode == 1:
            assert error.value.detail == audio_module.CONFIGURATION_ERROR_MESSAGE

    asyncio.run(scenario())
    conversion_environment["spawn"].assert_awaited_once()
    assert_cleaned(conversion_environment)


@pytest.mark.parametrize("diagnostics", [
    b"Error opening output file /private/output.wav.\nError opening output files: No such file or directory",
    b"Error opening output /private/output.wav: Permission denied",
    b"Error writing output: No space left on device",
])
def test_system_output_errors_remain_500(
    conversion_environment: dict, diagnostics: bytes,
) -> None:
    async def scenario() -> None:
        configure_process(conversion_environment, returncode=1, diagnostics=diagnostics)
        with pytest.raises(HTTPException) as error:
            await AudioProcessor.convert_to_wav(b"converter input")
        assert error.value.status_code == 500
        assert error.value.detail == audio_module.INTERNAL_ERROR_MESSAGE

    asyncio.run(scenario())
    conversion_environment["spawn"].assert_awaited_once()
    assert_cleaned(conversion_environment)


def test_timeout_kills_reaps_drains_before_cleanup(
    conversion_environment: dict, monkeypatch: pytest.MonkeyPatch,
) -> None:
    assert audio_module.CONVERSION_TIMEOUT_SECONDS == 30
    monkeypatch.setattr(audio_module, "CONVERSION_TIMEOUT_SECONDS", 0)

    async def scenario() -> None:
        configure_process(conversion_environment, returncode=None, diagnostics=b"pending diagnostics")
        with pytest.raises(HTTPException) as error:
            await AudioProcessor.convert_to_wav(b"converter input")
        assert error.value.status_code == 504
        assert error.value.detail == "Chuyển đổi âm thanh vượt quá thời gian cho phép."

    asyncio.run(scenario())
    events = conversion_environment["events"]
    assert events.count("killed") == 1
    assert events.index("killed") < events.index("reaped")
    assert events.index("killed") < events.index("stderr_finished")
    assert_cleaned(conversion_environment)


def test_cancellation_propagates_after_kill_reap_drain_and_cleanup(
    conversion_environment: dict,
) -> None:
    async def scenario() -> None:
        process = configure_process(conversion_environment, returncode=None)
        conversion = asyncio.create_task(AudioProcessor.convert_to_wav(b"converter input"))
        await asyncio.wait_for(process.started.wait(), timeout=2)
        conversion.cancel()
        with pytest.raises(asyncio.CancelledError):
            await asyncio.wait_for(conversion, timeout=2)

    asyncio.run(scenario())
    events = conversion_environment["events"]
    assert events.count("killed") == 1
    assert events.index("killed") < events.index("reaped")
    assert events.index("killed") < events.index("stderr_finished")
    assert_cleaned(conversion_environment)


def test_oversized_wav_rejected_before_read(
    conversion_environment: dict, monkeypatch: pytest.MonkeyPatch,
) -> None:
    original_read = Path.read_bytes

    def guarded_read(path: Path) -> bytes:
        assert path.name != "output.wav", "Oversized WAV must not be read"
        return original_read(path)

    async def scenario() -> None:
        process = FakeProcess(conversion_environment["events"])

        async def spawn(*arguments: str, **kwargs: object) -> FakeProcess:
            with Path(arguments[-1]).open("wb") as output:
                output.truncate(10 * 1024 * 1024 + 1)
            return process

        conversion_environment["spawn"].side_effect = spawn
        monkeypatch.setattr(Path, "read_bytes", guarded_read)
        with pytest.raises(HTTPException) as error:
            await AudioProcessor.convert_to_wav(b"converter input")
        assert error.value.status_code == 413
        assert "10 MiB" in error.value.detail

    asyncio.run(scenario())
    assert_cleaned(conversion_environment)


@pytest.mark.parametrize("invalid_wav", [
    make_wav(rate=8000), make_wav(channels=2), make_wav(width=1),
    make_wav(frames=0), make_wav()[:-2],
], ids=["wrong_rate", "wrong_channels", "wrong_width", "no_frames", "truncated_data"])
def test_invalid_wav_returns_500_and_cleans_directory(
    conversion_environment: dict, invalid_wav: bytes,
) -> None:
    async def scenario() -> None:
        configure_process(conversion_environment, output=invalid_wav)
        with pytest.raises(HTTPException) as error:
            await AudioProcessor.convert_to_wav(b"converter input")
        assert error.value.status_code == 500
        assert error.value.detail == audio_module.INTERNAL_ERROR_MESSAGE

    asyncio.run(scenario())
    assert_cleaned(conversion_environment)


def test_stderr_is_fully_drained_but_retained_bytes_are_bounded() -> None:
    async def scenario() -> None:
        events: list[str] = []
        released = asyncio.Event()
        released.set()
        diagnostics = bytes(range(256)) * 200
        stream = FakeStderr(diagnostics, events, released)
        retained = await AudioProcessor._read_stderr(stream)
        assert audio_module.MAX_STDERR_BYTES == 16 * 1024
        assert len(retained) == 16 * 1024
        assert retained == diagnostics[-16 * 1024:]
        assert stream.data == b""
        assert events == ["stderr_finished"]

    asyncio.run(scenario())
