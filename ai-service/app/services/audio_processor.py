import asyncio
import base64
import binascii
import io
import logging
import wave
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Optional, Tuple, TypeVar

import httpx
from fastapi import HTTPException, status


MAX_INPUT_SIZE_BYTES = 25 * 1024 * 1024
MAX_BASE64_LENGTH = ((MAX_INPUT_SIZE_BYTES + 2) // 3) * 4
MAX_WAV_SIZE_BYTES = 10 * 1024 * 1024
FFMPEG_OUTPUT_LIMIT_BYTES = MAX_WAV_SIZE_BYTES + 1
CONVERSION_TIMEOUT_SECONDS = 30
STORAGE_TIMEOUT_SECONDS = 30.0
MAX_STDERR_BYTES = 16 * 1024
STDERR_CHUNK_SIZE_BYTES = 4096
WAV_SAMPLE_RATE_HZ = 16000
WAV_CHANNELS = 1
WAV_SAMPLE_WIDTH_BYTES = 2
WAV_COMPRESSION_TYPE = "NONE"
WAV_MIME_TYPE = "audio/wav"
FFMPEG_THREADS = 1
FFMPEG_AUDIO_FILTER = (
    f"aresample=resampler=swr:osr={WAV_SAMPLE_RATE_HZ}:osf=s16:ochl=mono:"
    "dither_method=0:async=0"
)
INTERNAL_ERROR_MESSAGE = "Lỗi nội bộ khi xử lý chuyển đổi âm thanh."
CONFIGURATION_ERROR_MESSAGE = (
    "Dịch vụ chuyển đổi âm thanh chưa sẵn sàng: cấu hình FFmpeg không tương thích."
)
FFMPEG_CONFIGURATION_ERRORS = (
    b"unrecognized option",
    b"option not found",
    b"error splitting the argument list",
    b"error applying option",
    b"error setting option",
    b"no such filter",
    b"unknown encoder",
    b"encoder not found",
)
FFMPEG_SYSTEM_ERRORS = (
    b"permission denied",
    b"no space left on device",
    b"read-only file system",
    b"input/output error",
    b"too many open files",
    b"cannot allocate memory",
    b"error opening output file ",
    b"error writing",
    b"error muxing",
    b"error submitting a packet to the muxer",
    b"error while opening encoder",
)

logger = logging.getLogger("ai_service.audio_processor")
TaskResult = TypeVar("TaskResult")


class AudioProcessor:
    """Ingest audio and normalize it once to PCM WAV for analysis."""

    @classmethod
    async def get_audio_bytes(
        cls,
        audio_url: Optional[str] = None,
        audio_base64: Optional[str] = None,
    ) -> Tuple[bytes, str]:
        if audio_base64:
            raw_bytes = cls._decode_base64(audio_base64)
        elif audio_url:
            raw_bytes = await cls._download_audio(audio_url)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yêu cầu phải cung cấp ít nhất một trong hai: audioUrl hoặc audioBase64.",
            )

        if not raw_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dữ liệu âm thanh rỗng (0 bytes).",
            )
        if len(raw_bytes) > MAX_INPUT_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Dung lượng tệp âm thanh vượt quá giới hạn 25 MiB.",
            )

        wav_bytes = await cls.convert_to_wav(raw_bytes)
        return wav_bytes, WAV_MIME_TYPE

    @staticmethod
    def _decode_base64(audio_base64: str) -> bytes:
        encoded_audio = audio_base64
        if "," in encoded_audio:
            _, encoded_audio = encoded_audio.split(",", 1)
        if len(encoded_audio) > MAX_BASE64_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Dung lượng tệp âm thanh vượt quá giới hạn 25 MiB.",
            )
        try:
            return base64.b64decode(encoded_audio, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dữ liệu base64 âm thanh không hợp lệ.",
            ) from exc

    @staticmethod
    async def _download_audio(audio_url: str) -> bytes:
        async with httpx.AsyncClient(timeout=STORAGE_TIMEOUT_SECONDS) as client:
            try:
                response = await client.get(audio_url)
                if response.status_code != status.HTTP_200_OK:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Không thể tải tệp âm thanh từ URL. Mã phản hồi: {response.status_code}",
                    )
                return response.content
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Lỗi kết nối khi tải tệp âm thanh từ storage: {str(exc)}",
                ) from exc

    @classmethod
    async def convert_to_wav(cls, audio_bytes: bytes) -> bytes:
        """Convert audio to validated 16 kHz, mono, 16-bit PCM WAV bytes."""
        try:
            temporary_directory = TemporaryDirectory(prefix="be39-audio-")
            try:
                input_path = Path(temporary_directory.name) / "input.bin"
                output_path = Path(temporary_directory.name) / "output.wav"
                write_task = asyncio.create_task(
                    asyncio.to_thread(input_path.write_bytes, audio_bytes)
                )
                await cls._await_completion(write_task)
                await cls._run_ffmpeg(input_path, output_path)
                read_task = asyncio.create_task(
                    asyncio.to_thread(cls._read_wav_output, output_path)
                )
                return await cls._await_completion(read_task)
            finally:
                cleanup_task = asyncio.create_task(
                    asyncio.to_thread(temporary_directory.cleanup)
                )
                await cls._await_completion(cleanup_task)
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Internal audio conversion failure: %s", type(exc).__name__)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=INTERNAL_ERROR_MESSAGE,
            ) from exc

    @staticmethod
    def _ffmpeg_arguments(input_path: Path, output_path: Path) -> list[str]:
        return [
            "ffmpeg",
            "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
            "-xerror", "-noauto_conversion_filters",
            "-filter_threads", str(FFMPEG_THREADS),
            "-protocol_whitelist", "file",
            "-threads", str(FFMPEG_THREADS),
            "-i", str(input_path),
            "-map", "0:a:0", "-vn", "-sn", "-dn",
            "-af", FFMPEG_AUDIO_FILTER,
            "-c:a", "pcm_s16le", "-threads:a", str(FFMPEG_THREADS),
            "-map_metadata", "-1", "-map_chapters", "-1",
            "-fs", str(FFMPEG_OUTPUT_LIMIT_BYTES),
            "-f", "wav", str(output_path),
        ]

    @classmethod
    async def _run_ffmpeg(cls, input_path: Path, output_path: Path) -> None:
        process: Optional[asyncio.subprocess.Process] = None
        stderr_task: Optional[asyncio.Task[bytes]] = None
        arguments = cls._ffmpeg_arguments(input_path, output_path)
        spawn_task = asyncio.create_task(
            asyncio.create_subprocess_exec(
                *arguments,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE,
            )
        )
        try:
            try:
                process = await asyncio.shield(spawn_task)
            except asyncio.CancelledError as cancellation:
                try:
                    process = await cls._finish_task(spawn_task)
                except Exception:
                    raise cancellation
                raise

            if process.stderr is None:
                raise RuntimeError("FFmpeg stderr pipe is unavailable.")
            stderr_task = asyncio.create_task(cls._read_stderr(process.stderr))
            try:
                await asyncio.wait_for(
                    process.wait(), timeout=CONVERSION_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError as exc:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Chuyển đổi âm thanh vượt quá thời gian cho phép.",
                ) from exc

            diagnostics = await asyncio.shield(stderr_task)
            if process.returncode != 0:
                cls._raise_ffmpeg_error(process.returncode, diagnostics)
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Dịch vụ chuyển đổi âm thanh chưa sẵn sàng: không tìm thấy FFmpeg.",
            ) from exc
        finally:
            if process is not None:
                cleanup_task = asyncio.create_task(
                    cls._cleanup_process(process, stderr_task)
                )
                await cls._await_completion(cleanup_task)

    @staticmethod
    async def _read_stderr(stream: asyncio.StreamReader) -> bytes:
        diagnostics = bytearray()
        while True:
            chunk = await stream.read(STDERR_CHUNK_SIZE_BYTES)
            if not chunk:
                return bytes(diagnostics)
            diagnostics.extend(chunk)
            if len(diagnostics) > MAX_STDERR_BYTES:
                del diagnostics[:-MAX_STDERR_BYTES]

    @classmethod
    async def _cleanup_process(
        cls,
        process: asyncio.subprocess.Process,
        stderr_task: Optional[asyncio.Task[bytes]],
    ) -> None:
        if stderr_task is None and process.stderr is not None:
            stderr_task = asyncio.create_task(cls._read_stderr(process.stderr))
        if process.returncode is None:
            try:
                process.kill()
            except ProcessLookupError:
                pass
        await process.wait()
        if stderr_task is not None:
            await stderr_task

    @staticmethod
    async def _finish_task(task: asyncio.Task[TaskResult]) -> TaskResult:
        """Wait through repeated cancellation until a resource operation finishes."""
        while not task.done():
            try:
                await asyncio.shield(task)
            except asyncio.CancelledError:
                continue
        return task.result()

    @classmethod
    async def _await_completion(cls, task: asyncio.Task[TaskResult]) -> TaskResult:
        """Defer cancellation until file I/O or cleanup has actually finished."""
        try:
            return await asyncio.shield(task)
        except asyncio.CancelledError:
            try:
                await cls._finish_task(task)
            except Exception as exc:
                logger.error(
                    "Operation failed during cancellation: %s", type(exc).__name__
                )
            raise

    @staticmethod
    def _raise_ffmpeg_error(returncode: Optional[int], diagnostics: bytes) -> None:
        logger.warning(
            "FFmpeg conversion failed: %s",
            diagnostics.decode("utf-8", errors="replace"),
        )
        diagnostic_text = diagnostics.lower()
        if any(marker in diagnostic_text for marker in FFMPEG_CONFIGURATION_ERRORS):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=CONFIGURATION_ERROR_MESSAGE,
            )
        if returncode is None or returncode < 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=INTERNAL_ERROR_MESSAGE,
            )
        if any(marker in diagnostic_text for marker in FFMPEG_SYSTEM_ERRORS):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=INTERNAL_ERROR_MESSAGE,
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Không thể giải mã âm thanh: dữ liệu bị hỏng hoặc định dạng/codec không được hỗ trợ.",
        )

    @staticmethod
    def _read_wav_output(output_path: Path) -> bytes:
        if output_path.stat().st_size > MAX_WAV_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Dung lượng âm thanh WAV sau chuyển đổi vượt quá giới hạn 10 MiB.",
            )
        wav_bytes = output_path.read_bytes()
        with wave.open(io.BytesIO(wav_bytes), "rb") as wav_file:
            if (
                wav_file.getframerate() != WAV_SAMPLE_RATE_HZ
                or wav_file.getnchannels() != WAV_CHANNELS
                or wav_file.getsampwidth() != WAV_SAMPLE_WIDTH_BYTES
                or wav_file.getcomptype() != WAV_COMPRESSION_TYPE
            ):
                raise ValueError("FFmpeg returned unexpected WAV parameters.")
            frame_count = wav_file.getnframes()
            if frame_count <= 0:
                raise ValueError("FFmpeg returned WAV without audio frames.")
            audio_data = wav_file.readframes(frame_count + 1)
            expected_size = frame_count * WAV_CHANNELS * WAV_SAMPLE_WIDTH_BYTES
            if len(audio_data) != expected_size:
                raise ValueError("FFmpeg returned incomplete WAV audio data.")
        return wav_bytes
