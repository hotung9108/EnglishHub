"""Package app.prompts quản lý toàn bộ Prompt Templates và Guardrails theo convention-ai.md Mục 4."""
from app.prompts.speaking_prompts import SPEAKING_SYSTEM_PROMPT, SPEAKING_PROMPT_VERSION
from app.prompts.writing_prompts import WRITING_SYSTEM_TEMPLATE, WRITING_PROMPT_VERSION

__all__ = [
    "SPEAKING_SYSTEM_PROMPT",
    "SPEAKING_PROMPT_VERSION",
    "WRITING_SYSTEM_TEMPLATE",
    "WRITING_PROMPT_VERSION",
]
