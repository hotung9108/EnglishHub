import httpx
import base64
import io
from typing import Tuple, Optional
from fastapi import HTTPException


class AudioProcessor:
    """Handles audio ingestion, in-memory streaming, and base64 conversion."""

    MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
    ALLOWED_MIME_TYPES = {
        "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
        "audio/m4a", "audio/x-m4a", "audio/webm", "audio/ogg"
    }

    @classmethod
    async def get_audio_bytes(
        cls,
        audio_url: Optional[str] = None,
        audio_base64: Optional[str] = None
    ) -> Tuple[bytes, str]:
        """
        Retrieves raw audio bytes either by downloading from a URL (e.g. S3 presigned GET)
        or by decoding an inline Base64 payload.
        Returns: (audio_bytes, mime_type)
        """
        if audio_base64:
            try:
                # Strip data URL prefix if present (e.g., "data:audio/mp3;base64,")
                if "," in audio_base64:
                    header, audio_base64 = audio_base64.split(",", 1)
                    mime_type = "audio/mp3"
                    if "audio/" in header:
                        mime_type = header.split(";")[0].replace("data:", "")
                else:
                    mime_type = "audio/mp3"

                raw_bytes = base64.b64decode(audio_base64)
                if len(raw_bytes) > cls.MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="Dung lượng tệp âm thanh vượt quá giới hạn 25MB."
                    )
                return raw_bytes, mime_type
            except Exception as e:
                if isinstance(e, HTTPException):
                    raise e
                raise HTTPException(
                    status_code=400,
                    detail=f"Dữ liệu base64 âm thanh không hợp lệ: {str(e)}"
                )

        if audio_url:
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    response = await client.get(audio_url)
                    if response.status_code != 200:
                        raise HTTPException(
                            status_code=404,
                            detail=f"Không thể tải tệp âm thanh từ URL. Mã phản hồi: {response.status_code}"
                        )
                    raw_bytes = response.content
                    content_type = response.headers.get("Content-Type", "audio/mp3").split(";")[0].strip()

                    if len(raw_bytes) > cls.MAX_FILE_SIZE_BYTES:
                        raise HTTPException(
                            status_code=413,
                            detail="Dung lượng tệp âm thanh tải về vượt quá 25MB."
                        )
                    return raw_bytes, content_type
                except httpx.RequestError as exc:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Lỗi kết nối khi tải tệp âm thanh từ storage: {str(exc)}"
                    )

        raise HTTPException(
            status_code=400,
            detail="Yêu cầu phải cung cấp ít nhất một trong hai: audioUrl hoặc audioBase64."
        )
