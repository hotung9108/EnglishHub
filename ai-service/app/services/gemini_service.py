import asyncio
import base64
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.speaking import (
    WordTimestamp,
    CriteriaScores,
    AnnotationItem,
    FluencyMetrics,
    AnalyzeSpeakingResponse,
)
from app.schemas.writing import (
    WritingMetrics,
    WritingCriteriaScores,
    WritingAnnotationItem,
    AnalyzeWritingResponse,
)
from app.services.fluency_analyzer import FluencyAnalyzer
from app.services.text_analyzer import TextAnalyzer
from app.prompts import (
    SPEAKING_SYSTEM_PROMPT,
    SPEAKING_PROMPT_VERSION,
    WRITING_SYSTEM_TEMPLATE,
    WRITING_PROMPT_VERSION,
)
from app.prompts.base import (
    sanitize_and_parse_llm_json,
    sanitize_prompt_input,
    wrap_user_content,
)

logger = logging.getLogger("ai_service.gemini")

_SUGGESTION_PREFIX_RE = re.compile(
    r"(?:sửa\s+lại\s+thành|sửa\s+thành|có\s+thể\s+là|hoặc\s+là|nên\s+dùng|thay\s+bằng|đúng\s+là)\s*$",
    flags=re.IGNORECASE,
)


class GeminiService:
    """Orchestrates Gemini Flash Multimodal evaluation and fallback handlers for Speaking & Writing."""

    # =========================================================================
    # SYSTEM PROMPTS & RUBRICS (Managed in app.prompts per convention-ai.md Mục 4)
    # =========================================================================
    SPEAKING_SYSTEM_PROMPT = SPEAKING_SYSTEM_PROMPT
    SYSTEM_PROMPT = SPEAKING_SYSTEM_PROMPT
    SPEAKING_PROMPT_VERSION = SPEAKING_PROMPT_VERSION
    WRITING_SYSTEM_TEMPLATE = WRITING_SYSTEM_TEMPLATE
    WRITING_PROMPT_VERSION = WRITING_PROMPT_VERSION

    @classmethod
    def _build_static_system_prompt(
        cls,
        skill: str = "speaking",
        module_instructions: Optional[str] = None,
        ai_instruction_snapshot: Optional[str] = None,
        max_score: float = 9.0
    ) -> str:
        """
        Unified static system prompt builder for prompt caching across skills (Speaking, Writing).
        Contains base persona, rubric, JSON schema, and sanitized assignment context (Mục 4.2 convention-ai.md).
        """
        safe_instructions = sanitize_prompt_input(module_instructions or "")
        safe_rubric = sanitize_prompt_input(ai_instruction_snapshot or "")

        if skill.strip().lower() == "writing":
            instructions = safe_instructions or "Evaluate this student essay according to standard academic English criteria."
            extra = f"\nAdditional Teacher Rubric / Instructions:\n{safe_rubric}" if safe_rubric else ""
            return cls.WRITING_SYSTEM_TEMPLATE.format(
                instructions=instructions,
                extra=extra,
                max_score=max_score
            )

        # Default: Speaking
        topic = safe_instructions or "Describe a book you enjoyed reading recently."
        rubric = safe_rubric or "Standard CEFR / IELTS Part 2"

        return (
            f"{cls.SPEAKING_SYSTEM_PROMPT.strip()}\n\n"
            "--- ASSIGNMENT CONTEXT (STATIC PREFIX FOR PROMPT CACHING) ---\n"
            f"Topic / Instructions: {topic}\n"
            f"Rubric Notes: {rubric}\n"
            f"Max Score: {max_score}\n"
            "------------------------------------------------------------"
        )

    @classmethod
    async def analyze_speaking(
        cls,
        submission_module_id: int,
        audio_bytes: bytes,
        mime_type: str = "audio/mp3",
        module_instructions: Optional[str] = None,
        ai_instruction_snapshot: Optional[str] = None,
        max_score: float = 9.0,
        custom_model: Optional[str] = None,
        custom_provider: Optional[str] = None
    ) -> AnalyzeSpeakingResponse:
        """
        Analyzes speaking audio using OpenRouter or Gemini Multimodal.
        Supports dynamic model and provider override per request.
        If in MOCK_MODE or no API key is provided, returns deterministic QA-21 benchmark response.
        """
        start_time = time.perf_counter()

        # Sanitize overrides (e.g. Swagger UI auto-fills "string")
        cleaned_provider = (custom_provider or "").strip().lower()
        if cleaned_provider in ("", "string", "none", "null"):
            cleaned_provider = settings.AI_PROVIDER.strip().lower()

        cleaned_model = (custom_model or "").strip()
        if cleaned_model in ("", "string", "none", "null"):
            cleaned_model = None

        provider = cleaned_provider
        has_openrouter = bool(settings.OPENROUTER_API_KEY.strip())
        has_gemini = bool(settings.GEMINI_API_KEY.strip())

        use_openrouter = (provider == "openrouter" and has_openrouter) or (provider == "auto" and has_openrouter)
        use_gemini = (provider == "gemini" and has_gemini) or (provider == "auto" and not use_openrouter and has_gemini)

        # Target model names: custom_model takes precedence over settings
        target_openrouter_model = cleaned_model or settings.OPENROUTER_MODEL
        target_gemini_model = cleaned_model or settings.GEMINI_MODEL

        if settings.MOCK_MODE or (not use_openrouter and not use_gemini):
            logger.info(
                "Running in QA-21 Benchmark / Mock Mode for submissionModuleId: %s (model: %s, provider: %s)",
                submission_module_id,
                cleaned_model or "default",
                provider
            )
            resolved_mock_model = cleaned_model or (target_openrouter_model if provider == "openrouter" else target_gemini_model)
            return cls._generate_qa21_benchmark_response(
                submission_module_id,
                max_score,
                model_used=resolved_mock_model,
                provider_used=f"{provider}-mock" if settings.MOCK_MODE else "mock"
            )

        static_system_prompt = cls._build_static_system_prompt(
            skill="speaking",
            module_instructions=module_instructions,
            ai_instruction_snapshot=ai_instruction_snapshot,
            max_score=max_score
        )
        user_prompt = (
            "Please listen to the attached student audio recording and evaluate it strictly against "
            "the assignment topic, rubric, and verbatim spoken annotation rules defined in the system instructions."
        )

        # Primary: OpenRouter
        if use_openrouter:
            try:
                result = await cls._call_openrouter(
                    submission_module_id,
                    audio_bytes,
                    mime_type,
                    static_system_prompt,
                    user_prompt,
                    max_score,
                    model_name=target_openrouter_model
                )
                duration_ms = int((time.perf_counter() - start_time) * 1000)
                logger.info(
                    "Speaking analysis finished for submissionModuleId: %s (durationMs: %d, modelUsed: %s, providerUsed: %s, annotationsCount: %d)",
                    submission_module_id,
                    duration_ms,
                    result.model_used,
                    result.provider_used,
                    len(result.annotations)
                )
                return result
            except Exception as exc:
                logger.warning("OpenRouter call failed for submissionModuleId %s: %s. Attempting fallback if available.", submission_module_id, str(exc))
                if has_gemini:
                    try:
                        logger.info("Falling back to Gemini Direct API for submissionModuleId: %s...", submission_module_id)
                        result = await cls._call_gemini_direct(
                            submission_module_id,
                            audio_bytes,
                            mime_type,
                            static_system_prompt,
                            user_prompt,
                            max_score,
                            model_name=target_gemini_model
                        )
                        duration_ms = int((time.perf_counter() - start_time) * 1000)
                        logger.info(
                            "Speaking fallback analysis finished for submissionModuleId: %s (durationMs: %d, modelUsed: %s, providerUsed: %s, annotationsCount: %d)",
                            submission_module_id,
                            duration_ms,
                            result.model_used,
                            result.provider_used,
                            len(result.annotations)
                        )
                        return result
                    except Exception as gemini_exc:
                        logger.error("Gemini Direct fallback also failed for submissionModuleId %s: %s", submission_module_id, str(gemini_exc))
                raise HTTPException(
                    status_code=504,
                    detail=f"Dịch vụ AI phản hồi chậm hoặc gián đoạn kết nối: {str(exc)}"
                )

        # Primary: Gemini Direct
        if use_gemini:
            try:
                result = await cls._call_gemini_direct(
                    submission_module_id,
                    audio_bytes,
                    mime_type,
                    static_system_prompt,
                    user_prompt,
                    max_score,
                    model_name=target_gemini_model
                )
                duration_ms = int((time.perf_counter() - start_time) * 1000)
                logger.info(
                    "Speaking analysis finished for submissionModuleId: %s (durationMs: %d, modelUsed: %s, providerUsed: %s, annotationsCount: %d)",
                    submission_module_id,
                    duration_ms,
                    result.model_used,
                    result.provider_used,
                    len(result.annotations)
                )
                return result
            except Exception as exc:
                logger.warning("Gemini Direct call failed for submissionModuleId %s: %s. Attempting OpenRouter fallback if available.", submission_module_id, str(exc))
                if has_openrouter:
                    try:
                        logger.info("Falling back to OpenRouter API for submissionModuleId: %s...", submission_module_id)
                        result = await cls._call_openrouter(
                            submission_module_id,
                            audio_bytes,
                            mime_type,
                            static_system_prompt,
                            user_prompt,
                            max_score,
                            model_name=target_openrouter_model
                        )
                        duration_ms = int((time.perf_counter() - start_time) * 1000)
                        logger.info(
                            "Speaking fallback analysis finished for submissionModuleId: %s (durationMs: %d, modelUsed: %s, providerUsed: %s, annotationsCount: %d)",
                            submission_module_id,
                            duration_ms,
                            result.model_used,
                            result.provider_used,
                            len(result.annotations)
                        )
                        return result
                    except Exception as or_exc:
                        logger.error("OpenRouter fallback also failed for submissionModuleId %s: %s", submission_module_id, str(or_exc))
                raise HTTPException(
                    status_code=504,
                    detail=f"Dịch vụ AI phản hồi chậm hoặc gián đoạn kết nối: {str(exc)}"
                )

        return cls._generate_qa21_benchmark_response(submission_module_id, max_score, model_used=custom_model, provider_used=provider)

    @classmethod
    async def _call_openrouter(
        cls,
        submission_module_id: int,
        audio_bytes: bytes,
        mime_type: str,
        static_system_prompt: str,
        user_prompt: str,
        max_score: float,
        model_name: Optional[str] = None
    ) -> AnalyzeSpeakingResponse:
        import httpx
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        format_ext = mime_type.split("/")[-1].lower()
        if "wav" in format_ext:
            audio_format = "wav"
        elif "ogg" in format_ext:
            audio_format = "ogg"
        elif "webm" in format_ext:
            audio_format = "webm"
        elif "mp4" in format_ext or "m4a" in format_ext:
            audio_format = "m4a"
        else:
            audio_format = "mp3"

        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY.strip()}",
            "HTTP-Referer": "https://englishhub.io",
            "X-Title": "EnglishHub AI Service",
            "Content-Type": "application/json"
        }

        active_model = model_name or settings.OPENROUTER_MODEL
        is_anthropic = "claude" in active_model.lower() or "anthropic" in active_model.lower()

        if is_anthropic:
            system_message: Dict[str, Any] = {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": static_system_prompt,
                        "cache_control": {"type": "ephemeral"}
                    }
                ]
            }
        else:
            system_message = {
                "role": "system",
                "content": static_system_prompt
            }

        payload: Dict[str, Any] = {
            "model": active_model,
            "messages": [
                system_message,
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_prompt
                        },
                        {
                            "type": "input_audio",
                            "input_audio": {
                                "data": audio_b64,
                                "format": audio_format
                            }
                        }
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        url = f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"
        logger.info(
            "Calling OpenRouter model '%s' for submissionModuleId: %s",
            active_model,
            submission_module_id
        )

        last_parse_err: Optional[Exception] = None
        async with httpx.AsyncClient(timeout=float(settings.REQUEST_TIMEOUT_SECONDS)) as client:
            for attempt in range(3):
                if attempt > 0:
                    payload["temperature"] = 0.1
                    logger.warning(
                        "Retrying OpenRouter JSON generation (attempt %d/3) for submissionModuleId: %s",
                        attempt + 1,
                        submission_module_id
                    )

                resp = await client.post(url, headers=headers, json=payload)

                # If input_audio is not accepted by this specific model, retry with data URI format
                if resp.status_code == 400 and ("input_audio" in resp.text or "audio" in resp.text.lower()):
                    logger.info("OpenRouter model does not accept input_audio. Retrying with data URI format...")
                    payload["messages"][1]["content"] = [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{audio_b64}"}
                        }
                    ]
                    resp = await client.post(url, headers=headers, json=payload)

                if resp.status_code >= 400:
                    raise RuntimeError(f"OpenRouter returned HTTP {resp.status_code}: {resp.text}")

                res_json = resp.json()
                choices = res_json.get("choices", [])
                if not choices:
                    raise RuntimeError(f"No choices in OpenRouter response: {res_json}")

                raw_content = choices[0].get("message", {}).get("content", "")
                try:
                    parsed_data = sanitize_and_parse_llm_json(raw_content)
                    return cls._build_response_from_json(
                        submission_module_id,
                        parsed_data,
                        max_score,
                        model_used=active_model,
                        provider_used="openrouter"
                    )
                except ValueError as parse_err:
                    last_parse_err = parse_err

        raise ValueError(f"Failed to parse OpenRouter JSON after retries: {last_parse_err}")

    @classmethod
    async def _call_gemini_direct(
        cls,
        submission_module_id: int,
        audio_bytes: bytes,
        mime_type: str,
        static_system_prompt: str,
        user_prompt: str,
        max_score: float,
        model_name: Optional[str] = None
    ) -> AnalyzeSpeakingResponse:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        active_model = model_name or settings.GEMINI_MODEL

        logger.info(
            "Calling Gemini Direct model '%s' for submissionModuleId: %s",
            active_model,
            submission_module_id
        )

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        audio_part = {
            "mime_type": mime_type,
            "data": audio_b64
        }

        last_parse_err: Optional[Exception] = None
        for attempt in range(3):
            temp = 0.2 if attempt == 0 else 0.1
            model = genai.GenerativeModel(
                model_name=active_model,
                system_instruction=static_system_prompt,
                generation_config={
                    "temperature": temp,
                    "response_mime_type": "application/json"
                }
            )
            response = await asyncio.to_thread(model.generate_content, [user_prompt, audio_part])
            raw_text = response.text
            try:
                parsed_json = sanitize_and_parse_llm_json(raw_text)
                return cls._build_response_from_json(
                    submission_module_id,
                    parsed_json,
                    max_score,
                    model_used=active_model,
                    provider_used="gemini"
                )
            except ValueError as parse_err:
                last_parse_err = parse_err
                logger.warning(
                    "Gemini Direct returned invalid JSON on attempt %d/3 for submissionModuleId %s: %s",
                    attempt + 1,
                    submission_module_id,
                    str(parse_err)
                )

        raise ValueError(f"Failed to parse Gemini Direct JSON after retries: {last_parse_err}")

    @classmethod
    def _extract_fallback_annotations_from_feedback(
        cls,
        feedback_md: str,
        full_transcript: str,
        word_offsets: List[Dict[str, Any]],
        words: List[WordTimestamp],
        used_ranges: List[Tuple[int, int]]
    ) -> List[AnnotationItem]:
        """
        Deterministic fallback extractor when the LLM writes specific critique in `feedbackMarkdown`
        (under 'Cần cải thiện' / 'Khuyến nghị') or reports low-confidence words, but leaves `annotations` empty.
        """
        extracted: List[AnnotationItem] = []
        if not full_transcript:
            return extracted

        # 1. Isolate improvement section from feedbackMarkdown if available
        critique_section = feedback_md or ""
        if critique_section:
            section_match = re.search(
                r"(?:Cần\s+cải\s+thiện|Điểm\s+yếu|Khuyến\s+nghị|Areas\s+for\s+Improvement|Improvements)\s*:?\s*\*?\*?(.*?)(?:(?:\*\*|###|####)\s*(?:Kết\s+luận|Conclusion|Kế\s+hoạch)|$)",
                critique_section,
                flags=re.IGNORECASE | re.DOTALL,
            )
            if section_match:
                critique_section = section_match.group(1)

        if critique_section:
            for raw_line in critique_section.splitlines():
                line = raw_line.strip()
                if not line:
                    continue

                lower_line = line.lower()
                if any(k in lower_line for k in ("pronunciation", "phát âm", "trọng âm", "âm cuối")):
                    error_type = "PRONUNCIATION"
                elif any(k in lower_line for k in ("vocabulary", "lexical", "từ vựng", "collocation", "cụm từ")):
                    error_type = "VOCABULARY"
                elif any(k in lower_line for k in ("grammar", "grammatical", "ngữ pháp", "cấu trúc", "thì")):
                    error_type = "GRAMMAR"
                elif any(k in lower_line for k in ("fluency", "coherence", "trôi chảy", "mạch lạc")):
                    error_type = "FLUENCY"
                else:
                    error_type = "PRONUNCIATION"

                quote_matches = list(re.finditer(r'["“]([^"”\n]{2,60})["”]', line))
                if not quote_matches:
                    continue

                for idx_q, q_match in enumerate(quote_matches):
                    candidate_phrase = q_match.group(1).strip()
                    prefix_context = line[max(0, q_match.start() - 35): q_match.start()]

                    # Skip quotes that are clearly suggested replacements or student self-corrections
                    if _SUGGESTION_PREFIX_RE.search(prefix_context):
                        continue
                    if re.search(r"thay\s+vì\s*$", prefix_context, flags=re.IGNORECASE) and idx_q > 0:
                        continue

                    start_off, end_off = FluencyAnalyzer.align_spoken_annotation_offset(
                        full_transcript=full_transcript,
                        word_offsets=word_offsets,
                        target_text=candidate_phrase,
                        used_ranges=used_ranges
                    )
                    if end_off <= start_off or end_off > len(full_transcript):
                        continue

                    # Look ahead for a suggested fix in subsequent quotes of the same line
                    suggested_fix: Optional[str] = None
                    for next_q in quote_matches[idx_q + 1:]:
                        between_text = line[q_match.end(): next_q.start()]
                        if len(between_text) <= 80 and re.search(
                            r"(?:thay\s+vì|có\s+thể\s+là|nên\s+là|hoặc|thay\s+bằng)",
                            between_text,
                            flags=re.IGNORECASE,
                        ):
                            suggested_fix = next_q.group(1).strip()
                            break

                    # Extract concise sentence/clause comment around the match
                    clean_line = re.sub(r"^\*\s+", "", line)
                    clean_line = re.sub(r"\*\*([^*]+)\*\*", r"\1", clean_line).strip()

                    used_ranges.append((start_off, end_off))
                    extracted.append(
                        AnnotationItem(
                            startOffset=start_off,
                            endOffset=end_off,
                            errorType=error_type,
                            comment=clean_line,
                            suggestedFix=suggested_fix
                        )
                    )

        # 2. If still empty, check low-confidence words (< 0.80) in transcript
        if not extracted and words:
            for idx, w in enumerate(words):
                if w.confidence < 0.80 and idx < len(word_offsets):
                    clean_w, lead_trim, trail_trim = FluencyAnalyzer._strip_edge_punctuation(w.word)
                    if len(clean_w) < 3:
                        continue
                    wo = word_offsets[idx]
                    start_off = int(wo["startOffset"]) + lead_trim
                    end_off = int(wo["endOffset"]) - trail_trim
                    if end_off > start_off and end_off <= len(full_transcript):
                        used_ranges.append((start_off, end_off))
                        extracted.append(
                            AnnotationItem(
                                startOffset=start_off,
                                endOffset=end_off,
                                errorType="PRONUNCIATION",
                                comment=f"Từ '{clean_w}' có độ tự tin nhận diện âm thanh thấp ({w.confidence:.2f}), cần lưu ý phát âm rõ hơn.",
                                suggestedFix=None
                            )
                        )
                        if len(extracted) >= 3:
                            break

        return extracted

    @classmethod
    def _build_response_from_json(
        cls,
        submission_module_id: int,
        data: Dict[str, Any],
        max_score: float,
        model_used: Optional[str] = None,
        provider_used: Optional[str] = None
    ) -> AnalyzeSpeakingResponse:
        raw_words = data.get("words", [])
        words = [
            WordTimestamp(
                word=str(w.get("word", "")),
                start=float(w.get("start", 0.0)),
                end=float(w.get("end", 0.0)),
                confidence=float(w.get("confidence", 0.95))
            )
            for w in raw_words if w.get("word")
        ]

        # Calculate objective fluency metrics
        fluency_metrics = FluencyAnalyzer.analyze(words)
        full_transcript, word_offsets = FluencyAnalyzer.build_transcript_and_offsets(words)

        # Parse criteria scores
        scores_dict = data.get("criteriaScores", {})
        criteria = CriteriaScores(
            fluencyAndCoherence=float(scores_dict.get("fluencyAndCoherence", 7.0)),
            lexicalResource=float(scores_dict.get("lexicalResource", 6.5)),
            grammaticalRangeAndAccuracy=float(scores_dict.get("grammaticalRangeAndAccuracy", 7.0)),
            pronunciation=float(scores_dict.get("pronunciation", 7.0)),
            overallScore=min(float(scores_dict.get("overallScore", 7.0)), max_score)
        )

        feedback_md = data.get("feedbackMarkdown", "")
        if not feedback_md:
            feedback_md = f"""### Đánh giá Tổng quan Kỹ năng Nói (IELTS Speaking)
- **Điểm đề xuất:** {criteria.overallScore} / {max_score}
- **Tốc độ nói (Speech Rate):** {fluency_metrics.wordsPerMinute} WPM
- **Khoảng ngập ngừng (>0.5s):** {fluency_metrics.pauseCount} lần

#### Điểm chi tiết 4 tiêu chí:
1. **Fluency & Coherence:** {criteria.fluencyAndCoherence}/9.0
2. **Lexical Resource:** {criteria.lexicalResource}/9.0
3. **Grammatical Range & Accuracy:** {criteria.grammaticalRangeAndAccuracy}/9.0
4. **Pronunciation:** {criteria.pronunciation}/9.0
"""

        # Map annotations with precise character offsets
        raw_annotations = data.get("annotations", [])
        annotations: List[AnnotationItem] = []
        used_ranges: List[Tuple[int, int]] = []

        for ann in raw_annotations:
            if not isinstance(ann, dict):
                continue
            target_text = (
                ann.get("word")
                or ann.get("exactText")
                or ann.get("phrase")
                or ann.get("text")
                or ""
            ).strip()

            start_off, end_off = FluencyAnalyzer.align_spoken_annotation_offset(
                full_transcript=full_transcript,
                word_offsets=word_offsets,
                target_text=target_text,
                used_ranges=used_ranges
            )

            # Never emit unaligned (0, 0) or out-of-bounds annotations
            if end_off <= start_off or (full_transcript and end_off > len(full_transcript)):
                logger.warning(
                    "Skipping unaligned speaking annotation for submissionModuleId %s (target: '%s')",
                    submission_module_id,
                    target_text
                )
                continue

            used_ranges.append((start_off, end_off))
            annotations.append(AnnotationItem(
                startOffset=start_off,
                endOffset=end_off,
                errorType=str(ann.get("errorType", "PRONUNCIATION")).upper(),
                comment=str(ann.get("comment", "Phát âm cần lưu ý")),
                suggestedFix=ann.get("suggestedFix")
            ))

        # Fallback: extract annotations from feedbackMarkdown if LLM returned none
        if not annotations and full_transcript:
            annotations = cls._extract_fallback_annotations_from_feedback(
                feedback_md=feedback_md,
                full_transcript=full_transcript,
                word_offsets=word_offsets,
                words=words,
                used_ranges=used_ranges
            )
            if annotations:
                logger.info(
                    "Extracted %d fallback speaking annotations from feedbackMarkdown for submissionModuleId: %s",
                    len(annotations),
                    submission_module_id
                )

        return AnalyzeSpeakingResponse(
            submissionModuleId=submission_module_id,
            overallScore=criteria.overallScore,
            aiFeedback=feedback_md,
            aiTranscript=words,
            fluencyMetrics=fluency_metrics,
            criteriaScores=criteria,
            annotations=annotations,
            modelUsed=model_used,
            providerUsed=provider_used
        )

    @classmethod
    def _generate_qa21_benchmark_response(
        cls,
        submission_module_id: int,
        max_score: float = 9.0,
        model_used: Optional[str] = None,
        provider_used: Optional[str] = None
    ) -> AnalyzeSpeakingResponse:
        """
        Returns the fixed QA-21 reference benchmark dataset.
        Guarantees 100% deterministic output across test runs.
        """
        # 85-word QA-21 fixed transcript with realistic word-level timestamps
        raw_words_data = [
            ("I", 0.0, 0.25, 0.98), ("would", 0.25, 0.55, 0.96), ("like", 0.55, 0.85, 0.97),
            ("to", 0.85, 1.05, 0.99), ("talk", 1.05, 1.45, 0.94), ("about", 1.45, 1.85, 0.95),
            ("a", 1.85, 1.95, 0.99), ("book", 1.95, 2.35, 0.96), ("that", 2.35, 2.65, 0.97),
            ("I", 2.65, 2.85, 0.98), ("read", 2.85, 3.25, 0.95), ("recently", 3.25, 3.95, 0.93),
            ("called", 4.1, 4.5, 0.94), ("Atomic", 4.5, 5.1, 0.92), ("Habits", 5.1, 5.7, 0.72),  # Low confidence: missing /s/
            ("by", 5.9, 6.2, 0.98), ("James", 6.2, 6.7, 0.95), ("Clear.", 6.7, 7.3, 0.94),
            ("It", 7.8, 8.0, 0.99), ("is", 8.0, 8.2, 0.98), ("a", 8.2, 8.35, 0.99),
            ("self-help", 8.35, 9.1, 0.93), ("book", 9.1, 9.45, 0.97), ("that", 9.45, 9.75, 0.96),
            ("focuses", 9.75, 10.35, 0.92), ("on", 10.35, 10.55, 0.98), ("how", 10.55, 10.85, 0.97),
            ("small", 10.85, 11.35, 0.95), ("changes", 11.35, 11.95, 0.93), ("can", 11.95, 12.25, 0.98),
            ("lead", 12.25, 12.65, 0.96), ("to", 12.65, 12.85, 0.99), ("remarkable", 12.85, 13.65, 0.91),
            ("results.", 13.65, 14.35, 0.94),
            ("I", 15.0, 15.2, 0.98), ("found", 15.2, 15.65, 0.95), ("it", 15.65, 15.85, 0.99),
            ("extremely", 15.85, 16.65, 0.92), ("practical", 16.65, 17.35, 0.94), ("and", 17.35, 17.65, 0.97),
            ("inspiring", 17.65, 18.45, 0.93), ("because", 18.45, 19.05, 0.95), ("it", 19.05, 19.25, 0.99),
            ("explains", 19.25, 19.85, 0.94), ("human", 19.85, 20.35, 0.96),
            ("psychology", 20.9, 21.85, 0.70),  # Low confidence: pronounced silent /p/
            ("in", 21.85, 22.05, 0.98), ("a", 22.05, 22.15, 0.99), ("very", 22.15, 22.55, 0.97),
            ("simple", 22.55, 23.05, 0.95), ("way.", 23.05, 23.55, 0.96)
        ]

        words = [
            WordTimestamp(word=w[0], start=w[1], end=w[2], confidence=w[3])
            for w in raw_words_data
        ]

        full_transcript, word_offsets = FluencyAnalyzer.build_transcript_and_offsets(words)
        fluency_metrics = FluencyAnalyzer.analyze(words, total_duration_seconds=45.0)

        criteria = CriteriaScores(
            fluencyAndCoherence=7.0,
            lexicalResource=6.5,
            grammaticalRangeAndAccuracy=7.0,
            pronunciation=7.0,
            overallScore=min(7.0, max_score)
        )

        # Precise annotations for the 2 QA-21 fixed benchmark pronunciation errors
        annotations = [
            AnnotationItem(
                startOffset=full_transcript.find("Habits"),
                endOffset=full_transcript.find("Habits") + len("Habits"),
                errorType="PRONUNCIATION",
                comment="Phát âm chưa rõ phụ âm cuối /s/ ở từ 'Habits'.",
                suggestedFix="/ˈhæb.ɪts/"
            ),
            AnnotationItem(
                startOffset=full_transcript.find("psychology"),
                endOffset=full_transcript.find("psychology") + len("psychology"),
                errorType="PRONUNCIATION",
                comment="Phát âm nhầm âm câm /p/ ở đầu từ 'psychology'.",
                suggestedFix="/saɪˈkɒl.ə.dʒi/"
            )
        ]

        feedback_md = f"""### Đánh giá Tổng quan Kỹ năng Nói (IELTS Speaking Part 2)
- **Điểm đề xuất:** {criteria.overallScore} / {max_score}
- **Tốc độ nói (Speech Rate):** {fluency_metrics.wordsPerMinute} WPM (Mức độ tự nhiên, lưu loát)
- **Số lần ngập ngừng (>0.5s):** {fluency_metrics.pauseCount} lần
- **Tỷ lệ phát âm liên tục (PTR):** {fluency_metrics.phonationTimeRatio}

#### Điểm chi tiết theo 4 tiêu chí IELTS:
1. **Fluency and Coherence (7.0 / 9.0):** Duy trì tốt bài nói, các ý được triển khai liền mạch theo chủ đề cuốn sách yêu thích.
2. **Lexical Resource (6.5 / 9.0):** Có vốn từ tương đối tốt về chủ đề sách và tâm lý học (`self-help`, `remarkable results`, `practical`), cần tăng thêm collocation nâng cao.
3. **Grammatical Range and Accuracy (7.0 / 9.0):** Sử dụng linh hoạt các thì quá khứ và hiện tại đơn, câu phức có mệnh đề quan hệ `that focuses on...`.
4. **Pronunciation (7.0 / 9.0):** Ngữ điệu tự nhiên, cần lưu ý âm cuối /s/ và âm câm trong từ vựng học thuật.

#### Khuyến nghị cải thiện:
- Luyện tập phát âm rõ ràng âm cuối `/s/` ở từ *"Habits"* (/ˈhæb.ɪts/).
- Chú ý phụ âm câm `/p/` trong các từ bắt nguồn từ tiếng Hy Lạp như *"psychology"* (/saɪˈkɒl.ə.dʒi/).
"""

        return AnalyzeSpeakingResponse(
            submissionModuleId=submission_module_id,
            overallScore=criteria.overallScore,
            aiFeedback=feedback_md,
            aiTranscript=words,
            fluencyMetrics=fluency_metrics,
            criteriaScores=criteria,
            annotations=annotations,
            modelUsed=model_used or "benchmark/qa-21-deterministic",
            providerUsed=provider_used or "mock"
        )

    # =========================================================================
    # WRITING EVALUATION PIPELINE (UC27)
    # =========================================================================

    @classmethod
    async def analyze_writing(
        cls,
        submission_module_id: int,
        content: str,
        module_instructions: Optional[str] = None,
        ai_instruction_snapshot: Optional[str] = None,
        max_score: float = 9.0,
        custom_model: Optional[str] = None,
        custom_provider: Optional[str] = None
    ) -> AnalyzeWritingResponse:
        """
        Analyzes student writing essay using OpenRouter or Gemini.
        Supports dynamic model and provider override per request.
        If in MOCK_MODE or no API key is provided, returns deterministic QA-21 writing benchmark response.
        """
        start_time = time.perf_counter()

        cleaned_provider = (custom_provider or "").strip().lower()
        if cleaned_provider in ("", "string", "none", "null"):
            cleaned_provider = settings.AI_PROVIDER.strip().lower()

        cleaned_model = (custom_model or "").strip()
        if cleaned_model in ("", "string", "none", "null"):
            cleaned_model = None

        provider = cleaned_provider
        has_openrouter = bool(settings.OPENROUTER_API_KEY.strip())
        has_gemini = bool(settings.GEMINI_API_KEY.strip())

        use_openrouter = (provider == "openrouter" and has_openrouter) or (provider == "auto" and has_openrouter)
        use_gemini = (provider == "gemini" and has_gemini) or (provider == "auto" and not use_openrouter and has_gemini)

        target_openrouter_model = cleaned_model or settings.OPENROUTER_MODEL
        target_gemini_model = cleaned_model or settings.GEMINI_MODEL

        if settings.MOCK_MODE or (not use_openrouter and not use_gemini):
            logger.info(
                "Running in QA-21 Writing Benchmark / Mock Mode for submissionModuleId: %s (model: %s, provider: %s)",
                submission_module_id,
                cleaned_model or "default",
                provider
            )
            resolved_mock_model = cleaned_model or (target_openrouter_model if provider == "openrouter" else target_gemini_model)
            return cls._generate_qa21_writing_benchmark_response(
                submission_module_id,
                content=content,
                max_score=max_score,
                model_used=resolved_mock_model,
                provider_used=f"{provider}-mock" if settings.MOCK_MODE else "mock"
            )

        static_system_prompt = cls._build_static_system_prompt(
            skill="writing",
            module_instructions=module_instructions,
            ai_instruction_snapshot=ai_instruction_snapshot,
            max_score=max_score
        )
        # Cô lập nội dung bài nộp của học viên theo Mục 4.2 convention-ai.md
        wrapped_submission = wrap_user_content(content, tag="submission")
        user_prompt = f"Student Essay Submission:\n\"\"\"\n{wrapped_submission}\n\"\"\""

        if use_openrouter:
            try:
                result = await cls._call_openrouter_writing(
                    submission_module_id,
                    content,
                    static_system_prompt,
                    user_prompt,
                    max_score,
                    model_name=target_openrouter_model
                )
                duration_ms = int((time.perf_counter() - start_time) * 1000)
                logger.info(
                    "Writing analysis finished for submissionModuleId: %s (durationMs: %d, modelUsed: %s, providerUsed: %s, annotationsCount: %d)",
                    submission_module_id,
                    duration_ms,
                    result.model_used,
                    result.provider_used,
                    len(result.annotations)
                )
                return result
            except Exception as exc:
                logger.warning("OpenRouter writing call failed for submissionModuleId %s: %s. Attempting fallback if available.", submission_module_id, str(exc))
                if has_gemini:
                    try:
                        logger.info("Falling back to Gemini Direct API for writing (submissionModuleId: %s)...", submission_module_id)
                        result = await cls._call_gemini_direct_writing(
                            submission_module_id,
                            content,
                            static_system_prompt,
                            user_prompt,
                            max_score,
                            model_name=target_gemini_model
                        )
                        duration_ms = int((time.perf_counter() - start_time) * 1000)
                        logger.info(
                            "Writing fallback analysis finished for submissionModuleId: %s (durationMs: %d, modelUsed: %s, providerUsed: %s, annotationsCount: %d)",
                            submission_module_id,
                            duration_ms,
                            result.model_used,
                            result.provider_used,
                            len(result.annotations)
                        )
                        return result
                    except Exception as gem_exc:
                        logger.error("Gemini Direct fallback for writing also failed for submissionModuleId %s: %s", submission_module_id, str(gem_exc))
                raise HTTPException(
                    status_code=504,
                    detail=f"Dịch vụ AI phản hồi chậm hoặc gián đoạn kết nối: {str(exc)}"
                )

        if use_gemini:
            try:
                result = await cls._call_gemini_direct_writing(
                    submission_module_id,
                    content,
                    static_system_prompt,
                    user_prompt,
                    max_score,
                    model_name=target_gemini_model
                )
                duration_ms = int((time.perf_counter() - start_time) * 1000)
                logger.info(
                    "Writing analysis finished for submissionModuleId: %s (durationMs: %d, modelUsed: %s, providerUsed: %s, annotationsCount: %d)",
                    submission_module_id,
                    duration_ms,
                    result.model_used,
                    result.provider_used,
                    len(result.annotations)
                )
                return result
            except Exception as exc:
                logger.warning("Gemini Direct writing call failed for submissionModuleId %s: %s. Attempting OpenRouter fallback if available.", submission_module_id, str(exc))
                if has_openrouter:
                    try:
                        logger.info("Falling back to OpenRouter for writing (submissionModuleId: %s)...", submission_module_id)
                        result = await cls._call_openrouter_writing(
                            submission_module_id,
                            content,
                            static_system_prompt,
                            user_prompt,
                            max_score,
                            model_name=target_openrouter_model
                        )
                        duration_ms = int((time.perf_counter() - start_time) * 1000)
                        logger.info(
                            "Writing fallback analysis finished for submissionModuleId: %s (durationMs: %d, modelUsed: %s, providerUsed: %s, annotationsCount: %d)",
                            submission_module_id,
                            duration_ms,
                            result.model_used,
                            result.provider_used,
                            len(result.annotations)
                        )
                        return result
                    except Exception as or_exc:
                        logger.error("OpenRouter fallback for writing also failed for submissionModuleId %s: %s", submission_module_id, str(or_exc))
                raise HTTPException(
                    status_code=504,
                    detail=f"Dịch vụ AI phản hồi chậm hoặc gián đoạn kết nối: {str(exc)}"
                )

        return cls._generate_qa21_writing_benchmark_response(submission_module_id, content, max_score, model_used=cleaned_model, provider_used=provider)

    @classmethod
    async def _call_openrouter_writing(
        cls,
        submission_module_id: int,
        content: str,
        static_system_prompt: str,
        user_prompt: str,
        max_score: float,
        model_name: Optional[str] = None
    ) -> AnalyzeWritingResponse:
        import httpx
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY.strip()}",
            "HTTP-Referer": "https://englishhub.io",
            "X-Title": "EnglishHub AI Service",
            "Content-Type": "application/json"
        }
        active_model = model_name or settings.OPENROUTER_MODEL
        is_anthropic = "claude" in active_model.lower() or "anthropic" in active_model.lower()

        if is_anthropic:
            system_message: Dict[str, Any] = {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": static_system_prompt,
                        "cache_control": {"type": "ephemeral"}
                    }
                ]
            }
        else:
            system_message = {
                "role": "system",
                "content": static_system_prompt
            }

        payload: Dict[str, Any] = {
            "model": active_model,
            "messages": [
                system_message,
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        last_parse_err: Optional[Exception] = None
        async with httpx.AsyncClient(timeout=45.0) as client:
            for attempt in range(3):
                if attempt > 0:
                    payload["temperature"] = 0.1
                resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code != 200:
                    raise RuntimeError(f"OpenRouter API error (HTTP {resp.status_code}): {resp.text}")
                data = resp.json()
                raw_text = data["choices"][0]["message"]["content"]
                try:
                    parsed_data = sanitize_and_parse_llm_json(raw_text)
                    return cls._build_writing_response_from_json(
                        submission_module_id,
                        content,
                        parsed_data,
                        max_score,
                        model_used=active_model,
                        provider_used="openrouter"
                    )
                except ValueError as parse_err:
                    last_parse_err = parse_err

        raise ValueError(f"Failed to parse OpenRouter writing JSON after retries: {last_parse_err}")

    @classmethod
    async def _call_gemini_direct_writing(
        cls,
        submission_module_id: int,
        content: str,
        static_system_prompt: str,
        user_prompt: str,
        max_score: float,
        model_name: Optional[str] = None
    ) -> AnalyzeWritingResponse:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY.strip())
        active_model = model_name or settings.GEMINI_MODEL

        last_parse_err: Optional[Exception] = None
        for attempt in range(3):
            temp = 0.2 if attempt == 0 else 0.1
            model = genai.GenerativeModel(
                model_name=active_model,
                system_instruction=static_system_prompt,
                generation_config={"response_mime_type": "application/json", "temperature": temp}
            )
            response = await asyncio.to_thread(model.generate_content, [user_prompt])
            raw_text = response.text.strip()
            try:
                parsed_data = sanitize_and_parse_llm_json(raw_text)
                return cls._build_writing_response_from_json(
                    submission_module_id,
                    content,
                    parsed_data,
                    max_score,
                    model_used=active_model,
                    provider_used="gemini"
                )
            except ValueError as parse_err:
                last_parse_err = parse_err

        raise ValueError(f"Failed to parse Gemini Direct writing JSON after retries: {last_parse_err}")

    @classmethod
    def _build_writing_response_from_json(
        cls,
        submission_module_id: int,
        content: str,
        data: Dict[str, Any],
        max_score: float,
        model_used: str,
        provider_used: str
    ) -> AnalyzeWritingResponse:
        text_metrics = TextAnalyzer.analyze(content)
        raw_criteria = data.get("criteriaScores", {})
        tr = min(float(raw_criteria.get("taskResponse", 6.5)), max_score)
        cc = min(float(raw_criteria.get("coherenceAndCohesion", 6.0)), max_score)
        lr = min(float(raw_criteria.get("lexicalResource", 6.0)), max_score)
        gra = min(float(raw_criteria.get("grammaticalRangeAndAccuracy", 6.0)), max_score)
        overall = min(float(raw_criteria.get("overallScore", (tr + cc + lr + gra) / 4.0)), max_score)

        criteria = WritingCriteriaScores(
            taskResponse=tr,
            coherenceAndCohesion=cc,
            lexicalResource=lr,
            grammaticalRangeAndAccuracy=gra,
            overallScore=overall
        )

        annotations: List[WritingAnnotationItem] = []
        raw_ann_list = data.get("annotations", [])
        for ann in raw_ann_list:
            if not isinstance(ann, dict):
                continue
            exact_text = ann.get("exactText") or ann.get("text") or ann.get("word") or ""
            est_start = ann.get("startOffset")
            start_off, end_off = TextAnalyzer.align_annotation_offset(content, exact_text, estimated_start=est_start)
            if end_off <= start_off or (content and end_off > len(content)):
                logger.warning(
                    "Skipping unaligned writing annotation for submissionModuleId %s (exactText: '%s')",
                    submission_module_id,
                    exact_text
                )
                continue
            annotations.append(WritingAnnotationItem(
                startOffset=start_off,
                endOffset=end_off,
                errorType=str(ann.get("errorType", "GRAMMAR")).upper(),
                comment=str(ann.get("comment", "")),
                suggestedFix=ann.get("suggestedFix")
            ))

        feedback_md = data.get("feedbackMarkdown", f"### Đánh giá Kỹ năng Viết\nĐiểm: {overall} / {max_score}")

        return AnalyzeWritingResponse(
            submissionModuleId=submission_module_id,
            overallScore=overall,
            aiFeedback=feedback_md,
            textMetrics=text_metrics,
            criteriaScores=criteria,
            annotations=annotations,
            modelUsed=model_used,
            providerUsed=provider_used
        )

    @classmethod
    def _generate_qa21_writing_benchmark_response(
        cls,
        submission_module_id: int,
        content: Optional[str] = None,
        max_score: float = 9.0,
        model_used: Optional[str] = None,
        provider_used: Optional[str] = None
    ) -> AnalyzeWritingResponse:
        """
        Returns the fixed QA-21 reference benchmark dataset for Writing.
        Guarantees 100% deterministic output across test runs.
        """
        qa21_fixed_essay = (
            "Nowadays, many educators argue that unpaid community service should be compulsory in high school. "
            "In my opinion, I completely agree with this viewpoint because volunteering helps students develop essential life skills and broadens their social awareness.\n"
            "First of all, engaging in voluntary activities allows teenagers to acquire practical experience. "
            "Community service help teenagers understand social responsibilities and learn how to work effectively in a team. "
            "Furthermore, participating in social work can make a big benefit for their future university applications because admissions officers always appreciate well-rounded candidates.\n"
            "However they should not be overloaded with too many working hours, as academic study must remain their top priority. "
            "In conclusion, mandatory community service is highly beneficial for high school students as long as it is reasonably arranged."
        )

        essay_text = content.strip() if (content and len(content.strip()) >= 20) else qa21_fixed_essay
        text_metrics = TextAnalyzer.analyze(essay_text)

        criteria = WritingCriteriaScores(
            taskResponse=7.0,
            coherenceAndCohesion=6.5,
            lexicalResource=6.0,
            grammaticalRangeAndAccuracy=6.5,
            overallScore=min(6.5, max_score)
        )

        target1 = "Community service help teenagers"
        s1, e1 = TextAnalyzer.align_annotation_offset(essay_text, target1)

        target2 = "make a big benefit"
        s2, e2 = TextAnalyzer.align_annotation_offset(essay_text, target2)

        target3 = "However they should not"
        s3, e3 = TextAnalyzer.align_annotation_offset(essay_text, target3)

        annotations = [
            WritingAnnotationItem(
                startOffset=s1,
                endOffset=e1,
                errorType="GRAMMAR",
                comment="Chủ ngữ số ít 'Community service' cần đi với động từ số ít 'helps'.",
                suggestedFix="Community service helps teenagers"
            ),
            WritingAnnotationItem(
                startOffset=s2,
                endOffset=e2,
                errorType="VOCABULARY",
                comment="Sai kết hợp từ (collocation). Trong tiếng Anh chuẩn, nên dùng 'bring significant benefits' hoặc 'provide great benefits'.",
                suggestedFix="bring significant benefits"
            ),
            WritingAnnotationItem(
                startOffset=s3,
                endOffset=e3,
                errorType="PUNCTUATION",
                comment="Thiếu dấu phẩy ngăn cách trạng từ liên kết (transitional adverb) 'However' ở đầu mệnh đề.",
                suggestedFix="However, they should not"
            )
        ]

        feedback_md = f"""### Đánh giá Tổng quan Kỹ năng Viết (IELTS Writing Task 2)
- **Điểm đề xuất:** {criteria.overallScore} / {max_score}
- **Tổng số từ (Word Count):** {text_metrics.wordCount} từ (Đạt yêu cầu tối thiểu)
- **Độ đa dạng từ vựng (TTR):** {text_metrics.lexicalDiversity} (Vốn từ đa dạng)
- **Độ phức tạp câu (Flesch-Kincaid Grade Level):** Lớp {text_metrics.fleschKincaidGrade}

#### Điểm chi tiết theo 4 tiêu chí IELTS:
1. **Task Response (7.0 / 9.0):** Trả lời đúng trọng tâm đề bài, lập trường rõ ràng xuyên suốt và giải thích đầy đủ các lợi ích của hoạt động công ích đối với học sinh.
2. **Coherence and Cohesion (6.5 / 9.0):** Bố cục bài viết 4 đoạn rõ ràng, các ý được liên kết tốt bằng các từ nối (`First of all`, `Furthermore`, `In conclusion`), cần lưu ý ngắt câu sau trạng từ liên kết.
3. **Lexical Resource (6.0 / 9.0):** Sử dụng tốt một số từ vựng chủ đề (`voluntary activities`, `social awareness`, `well-rounded candidates`), nhưng còn mắc lỗi kết hợp từ (`make a benefit`).
4. **Grammatical Range and Accuracy (6.5 / 9.0):** Đa dạng cấu trúc câu phức với mệnh đề quan hệ `because...`, tuy nhiên còn lỗi cơ bản về hòa hợp chủ ngữ - động từ số ít.

#### Khuyến nghị cải thiện:
- Sửa lỗi hòa hợp chủ vị: *"Community service helps"* thay vì *"help"*.
- Nâng cao sử dụng collocations chuẩn xác: dùng *"bring/provide significant benefits"*.
- Bổ sung dấu phẩy sau *"However,"* khi đứng đầu mệnh đề độc lập.
"""

        return AnalyzeWritingResponse(
            submissionModuleId=submission_module_id,
            overallScore=criteria.overallScore,
            aiFeedback=feedback_md,
            textMetrics=text_metrics,
            criteriaScores=criteria,
            annotations=annotations,
            modelUsed=model_used or "benchmark/qa-21-deterministic",
            providerUsed=provider_used or "mock"
        )
