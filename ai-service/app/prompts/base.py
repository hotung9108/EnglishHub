import json
import logging
import re
from typing import Any, Dict

logger = logging.getLogger("ai_service.prompts")


def sanitize_prompt_input(text: str) -> str:
    """
    Lọc bỏ các thẻ XML/HTML giả mạo và delimiter nguy hiểm để chống Prompt Injection.
    Tuân thủ Mục 4.2 convention-ai.md.
    """
    if not text:
        return ""
    # Loại bỏ các tag đóng/mở giả mạo ngữ cảnh hệ thống
    cleaned = re.sub(r'<\/?(?:system|instruction|admin|override|deliberation)[^>]*>', '', text, flags=re.IGNORECASE)
    return cleaned.strip()


def wrap_user_content(content: str, tag: str = "submission") -> str:
    """Cô lập nội dung của học viên bên trong delimiters an toàn."""
    safe_content = sanitize_prompt_input(content)
    return f"<{tag}>\n{safe_content}\n</{tag}>"


def sanitize_and_parse_llm_json(raw_text: str) -> Dict[str, Any]:
    """
    Chuẩn hoá và parse JSON an toàn từ phản hồi của LLM.
    Xử lý markdown codeblock, ký tự điều khiển ẩn và trailing commas.
    Tuân thủ Mục 4.3 convention-ai.md.
    """
    if not raw_text:
        raise ValueError("Empty response received from LLM")

    cleaned = raw_text.strip()

    # Bóc tách markdown codeblock nếu có (```json ... ``` hoặc ``` ... ```)
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

    # Thử parse JSON tiêu chuẩn
    try:
        return json.loads(cleaned, strict=False)
    except json.JSONDecodeError:
        pass

    # Thử parse bằng dirtyjson nếu có sẵn
    try:
        import dirtyjson
        return dict(dirtyjson.loads(cleaned))
    except Exception:
        pass

    # Thay thế các ký tự điều khiển không hợp lệ (control characters 0x00 - 0x1F)
    sanitized = re.sub(
        r'[\x00-\x1f\x7f-\x9f]',
        lambda m: '\n' if m.group() == '\n' else ('\t' if m.group() == '\t' else ' '),
        cleaned
    )

    try:
        return json.loads(sanitized, strict=False)
    except json.JSONDecodeError:
        try:
            import dirtyjson
            return dict(dirtyjson.loads(sanitized))
        except Exception as exc:
            logger.error("Failed to parse JSON from LLM: %s. Raw snippet: %s", str(exc), cleaned[:300])
            raise ValueError(f"LLM returned invalid JSON structure: {str(exc)}") from exc
