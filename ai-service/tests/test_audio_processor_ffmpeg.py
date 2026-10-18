import asyncio
import base64
import hashlib
import io
import json
import re
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

try:
    import pytest
except ImportError:
    import unittest
    raise unittest.SkipTest("pytest is not installed; run these tests in the Docker/CI environment with pytest.")
from fastapi import HTTPException

from app.services import audio_processor as audio_module
from app.services.audio_processor import AudioProcessor


pytestmark = pytest.mark.skipif(
    shutil.which("ffmpeg") is None, reason="FFmpeg is not installed",
)
TONE_DURATION_SECONDS = 2.0
DURATION_TOLERANCE_SECONDS = 0.1
COMMAND_TIMEOUT_SECONDS = 30


def run_command(arguments: list[str]) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        arguments, capture_output=True, text=True, timeout=COMMAND_TIMEOUT_SECONDS,
        check=False,
    )
    assert result.returncode == 0, (
        f"Command failed ({result.returncode}): {arguments!r}\n{result.stderr}"
    )
    return result


@pytest.fixture
def encoders() -> set[str]:
    result = run_command(["ffmpeg", "-hide_banner", "-encoders"])
    return set(re.findall(r"^\s*A\S{5}\s+(\S+)", result.stdout, re.MULTILINE))


def choose_encoder(encoders: set[str], candidates: tuple[str, ...]) -> str:
    for candidate in candidates:
        if candidate in encoders:
            return candidate
    pytest.fail(f"No required audio encoder is available; expected one of {candidates!r}")


def generate_tone(path: Path, encoder: str, container: str) -> Path:
    arguments = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=2",
        "-ac", "2", "-c:a", encoder,
    ]
    if encoder != "pcm_s16le":
        arguments.extend(["-b:a", "64k"])
    arguments.extend(["-f", container, str(path)])
    run_command(arguments)
    assert path.stat().st_size > 0
    return path


@pytest.fixture
def opus_webm(tmp_path: Path, encoders: set[str]) -> Path:
    encoder = choose_encoder(encoders, ("libopus",))
    return generate_tone(tmp_path / "tone-opus.webm", encoder, "webm")


@pytest.fixture
def converter_directories(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> list[Path]:
    directories: list[Path] = []

    def temporary_directory(prefix: str) -> tempfile.TemporaryDirectory:
        directory = tempfile.TemporaryDirectory(prefix=prefix, dir=tmp_path)
        directories.append(Path(directory.name))
        return directory

    monkeypatch.setattr(audio_module, "TemporaryDirectory", temporary_directory)
    return directories


def assert_directories_removed(directories: list[Path], expected: int = 1) -> None:
    assert len(directories) == expected
    assert all(not directory.exists() for directory in directories)


def assert_wave_format(wav_bytes: bytes) -> None:
    with wave.open(io.BytesIO(wav_bytes), "rb") as audio:
        assert audio.getframerate() == 16000
        assert audio.getnchannels() == 1
        assert audio.getsampwidth() == 2
        assert audio.getcomptype() == "NONE"
        frame_count = audio.getnframes()
        assert frame_count > 0
        assert frame_count / audio.getframerate() == pytest.approx(
            TONE_DURATION_SECONDS, abs=DURATION_TOLERANCE_SECONDS,
        )
        assert len(audio.readframes(frame_count + 1)) == frame_count * 2


def test_webm_converts_to_pcm_wav(
    opus_webm: Path, converter_directories: list[Path],
) -> None:
    result = asyncio.run(AudioProcessor.convert_to_wav(opus_webm.read_bytes()))
    assert_wave_format(result)
    assert_directories_removed(converter_directories)


def test_base64_without_mime_converts_to_wav(
    opus_webm: Path, converter_directories: list[Path],
) -> None:
    encoded = base64.b64encode(opus_webm.read_bytes()).decode("ascii")
    wav_bytes, mime_type = asyncio.run(AudioProcessor.get_audio_bytes(audio_base64=encoded))
    assert mime_type == "audio/wav"
    assert_wave_format(wav_bytes)
    assert_directories_removed(converter_directories)


@pytest.mark.skipif(shutil.which("ffprobe") is None, reason="FFprobe is not installed")
def test_ffprobe_confirms_pcm_codec_and_duration(opus_webm: Path, tmp_path: Path) -> None:
    wav_bytes = asyncio.run(AudioProcessor.convert_to_wav(opus_webm.read_bytes()))
    assert_wave_format(wav_bytes)
    output = tmp_path / "normalized.wav"
    output.write_bytes(wav_bytes)
    result = run_command([
        "ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
        "stream=codec_name,sample_fmt,sample_rate,channels,bits_per_sample,duration",
        "-of", "json", str(output),
    ])
    streams = json.loads(result.stdout)["streams"]
    assert len(streams) == 1
    stream = streams[0]
    assert stream["codec_name"] == "pcm_s16le"
    assert stream["sample_fmt"] == "s16"
    assert int(stream["sample_rate"]) == 16000
    assert stream["channels"] == 1
    assert stream["bits_per_sample"] == 16
    assert float(stream["duration"]) == pytest.approx(
        TONE_DURATION_SECONDS, abs=DURATION_TOLERANCE_SECONDS,
    )


@pytest.mark.parametrize("container,candidates", [
    ("mp3", ("libmp3lame", "libshine")),
    ("ogg", ("libvorbis", "libopus")),
    ("wav", ("pcm_s16le",)),
])
def test_other_formats_use_same_converter(
    tmp_path: Path, encoders: set[str], converter_directories: list[Path],
    container: str, candidates: tuple[str, ...],
) -> None:
    encoder = choose_encoder(encoders, candidates)
    source = generate_tone(tmp_path / f"tone.{container}", encoder, container)
    result = asyncio.run(AudioProcessor.convert_to_wav(source.read_bytes()))
    assert_wave_format(result)
    assert_directories_removed(converter_directories)


def test_empty_file_returns_400_before_conversion(
    tmp_path: Path, converter_directories: list[Path],
) -> None:
    source = tmp_path / "empty.webm"
    source.touch()
    encoded = base64.b64encode(source.read_bytes()).decode("ascii")
    with pytest.raises(HTTPException) as error:
        asyncio.run(AudioProcessor.get_audio_bytes(audio_base64=f"data:audio/webm;base64,{encoded}"))
    assert error.value.status_code == 400
    assert_directories_removed(converter_directories, expected=0)


def test_corrupt_bytes_return_422_without_partial_output(
    converter_directories: list[Path],
) -> None:
    with pytest.raises(HTTPException) as error:
        asyncio.run(AudioProcessor.convert_to_wav(b"This is deliberately invalid media data."))
    assert error.value.status_code == 422
    assert_directories_removed(converter_directories)


def test_video_without_audio_returns_422_without_partial_output(
    tmp_path: Path, converter_directories: list[Path],
) -> None:
    source = tmp_path / "video-only.mkv"
    run_command([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-f", "lavfi", "-i", "color=c=black:s=16x16:r=1:d=2",
        "-an", "-c:v", "ffv1", "-f", "matroska", str(source),
    ])
    with pytest.raises(HTTPException) as error:
        asyncio.run(AudioProcessor.convert_to_wav(source.read_bytes()))
    assert error.value.status_code == 422
    assert_directories_removed(converter_directories)


def test_filtergraph_has_one_explicit_resampler(opus_webm: Path, tmp_path: Path) -> None:
    output = tmp_path / "filtergraph.wav"
    arguments = AudioProcessor._ffmpeg_arguments(opus_webm, output)
    arguments[arguments.index("-loglevel") + 1] = "debug"
    result = run_command(arguments)
    log = result.stderr
    parsed_filters = set(re.findall(r"\[(Parsed_\w+_\d+) @ [^\]]+\]", log))
    assert parsed_filters == {"Parsed_aresample_0"}, log
    assert "auto_aresample" not in log.lower(), log
    resample_steps = [
        line for line in log.splitlines()
        if "[Parsed_aresample_0 @ " in line and " -> " in line and "ch:" in line
    ]
    assert len(resample_steps) == 1, log
    output_parameters = resample_steps[0].split(" -> ", 1)[1]
    assert "ch:1 " in output_parameters, log
    assert "fmt:s16 " in output_parameters, log
    assert "r:16000Hz" in output_parameters, log
    filter_nodes = set(re.findall(
        r"\[((?:Parsed_|auto_|graph_|format_|trim_|abuffer|buffersink)[\w]+) @ [^\]]+\]",
        log,
    ))
    unexpected_nodes = {
        node for node in filter_nodes
        if node != "Parsed_aresample_0"
        and re.fullmatch(r"graph_\d+_in_\d+_\d+|format_out_\d+_\d+", node) is None
    }
    assert not unexpected_nodes, log
    assert_wave_format(output.read_bytes())


def test_conversion_preserves_input_hash(
    opus_webm: Path, converter_directories: list[Path],
) -> None:
    input_bytes = opus_webm.read_bytes()
    original_hash = hashlib.sha256(input_bytes).digest()
    result = asyncio.run(AudioProcessor.convert_to_wav(input_bytes))
    assert_wave_format(result)
    assert hashlib.sha256(input_bytes).digest() == original_hash
    assert hashlib.sha256(opus_webm.read_bytes()).digest() == original_hash
    assert_directories_removed(converter_directories)
