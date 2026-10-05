import json
import base64
import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.speaking import (
    WordTimestamp,
    CriteriaScores,
    AnnotationItem,
    FluencyMetrics,
    AnalyzeSpeakingResponse,
)
from app.services.fluency_analyzer import FluencyAnalyzer

logger = logging.getLogger("ai_service.gemini")


class GeminiService:
    """Orchestrates Gemini Flash Multimodal evaluation and fallback handlers."""

    SYSTEM_PROMPT = """You are an expert IELTS and CEFR Certified Speaking Examiner.
Your task is to listen to the provided student audio recording, perform speech-to-text with word-level timestamps, and evaluate the speaking performance.

Rubric criteria to score from 0.0 to 9.0:
1. Fluency & Coherence (FC): Speech rate, smoothness, pauses, and discourse markers.
2. Lexical Resource (LR): Vocabulary variety, collocations, idiomatic phrasing.
3. Grammatical Range & Accuracy (GRA): Sentence complexity, tenses, structural errors.
4. Pronunciation (PR): Phoneme accuracy, word stress, ending sounds (/s/, /z/, /ed/), intonation.

You MUST respond strictly with a valid JSON object matching the following schema:
{
  "fullTranscript": "string containing the full spoken text",
  "words": [
    { "word": "word1", "start": 0.0, "end": 0.3, "confidence": 0.98 },
    { "word": "word2", "start": 0.3, "end": 0.7, "confidence": 0.95 }
  ],
  "criteriaScores": {
    "fluencyAndCoherence": 7.0,
    "lexicalResource": 6.5,
    "grammaticalRangeAndAccuracy": 7.0,
    "pronunciation": 7.5,
    "overallScore": 7.0
  },
  "feedbackMarkdown": "### Đánh giá Tổng quan Kỹ năng Nói...",
  "annotations": [
    {
      "word": "problem_word",
      "errorType": "PRONUNCIATION",
      "comment": "Missing final /s/ sound",
      "suggestedFix": "/ˈhæb.ɪts/"
    }
  ]
}
"""

    @classmethod
    def _build_static_system_prompt(
        cls,
        module_instructions: Optional[str] = None,
        ai_instruction_snapshot: Optional[str] = None,
        max_score: float = 9.0
    ) -> str:
        """
        Builds the unified static system prompt containing:
        1. Base Examiner Persona and Evaluation Rubric criteria
        2. Strict JSON output schema specification
        3. Assignment Context: Topic/Instructions, Rubric Snapshot, and Max Score

        This prefix is 100% deterministic and static for all students answering the same
        assignment module, enabling automatic LLM Prompt Caching (OpenRouter / Gemini Context Caching).
        """
        topic = (module_instructions or "Describe a book you enjoyed reading recently.").strip()
        rubric = (ai_instruction_snapshot or "Standard CEFR / IELTS Part 2").strip()

        return (
            f"{cls.SYSTEM_PROMPT.strip()}\n\n"
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
            logger.info("Running in QA-21 Benchmark / Mock Mode for submissionModuleId: %s (model: %s, provider: %s)",
                        submission_module_id, cleaned_model or "default", provider)
            resolved_mock_model = cleaned_model or (target_openrouter_model if provider == "openrouter" else target_gemini_model)
            return cls._generate_qa21_benchmark_response(
                submission_module_id,
                max_score,
                model_used=resolved_mock_model,
                provider_used=f"{provider}-mock" if settings.MOCK_MODE else "mock"
            )

        static_system_prompt = cls._build_static_system_prompt(
            module_instructions=module_instructions,
            ai_instruction_snapshot=ai_instruction_snapshot,
            max_score=max_score
        )
        user_prompt = "Please listen to the attached student audio recording and evaluate it strictly against the assignment topic and rubric defined in the system instructions."

        # Primary: OpenRouter
        if use_openrouter:
            try:
                return await cls._call_openrouter(
                    submission_module_id,
                    audio_bytes,
                    mime_type,
                    static_system_prompt,
                    user_prompt,
                    max_score,
                    model_name=target_openrouter_model
                )
            except Exception as exc:
                logger.warning("OpenRouter call failed: %s. Attempting fallback if available.", str(exc))
                if has_gemini:
                    try:
                        logger.info("Falling back to Gemini Direct API...")
                        return await cls._call_gemini_direct(
                            submission_module_id,
                            audio_bytes,
                            mime_type,
                            static_system_prompt,
                            user_prompt,
                            max_score,
                            model_name=target_gemini_model
                        )
                    except Exception as gemini_exc:
                        logger.error("Gemini Direct fallback also failed: %s", str(gemini_exc))
                raise HTTPException(
                    status_code=504,
                    detail=f"Dịch vụ AI phản hồi chậm hoặc gián đoạn kết nối: {str(exc)}"
                )

        # Primary: Gemini Direct
        if use_gemini:
            try:
                return await cls._call_gemini_direct(
                    submission_module_id,
                    audio_bytes,
                    mime_type,
                    static_system_prompt,
                    user_prompt,
                    max_score,
                    model_name=target_gemini_model
                )
            except Exception as exc:
                logger.warning("Gemini Direct call failed: %s. Attempting OpenRouter fallback if available.", str(exc))
                if has_openrouter:
                    try:
                        logger.info("Falling back to OpenRouter API...")
                        return await cls._call_openrouter(
                            submission_module_id,
                            audio_bytes,
                            mime_type,
                            static_system_prompt,
                            user_prompt,
                            max_score,
                            model_name=target_openrouter_model
                        )
                    except Exception as or_exc:
                        logger.error("OpenRouter fallback also failed: %s", str(or_exc))
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

        # Prompt Caching optimization (Tier 1):
        # 1. Place static system instructions + rubric + assignment topic in the system message.
        # 2. For Anthropic models on OpenRouter, add explicit cache_control.
        # 3. For Gemini/OpenAI/DeepSeek models, stable prefix automatically triggers implicit prompt caching.
        if is_anthropic:
            system_message = {
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

        payload = {
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
            "response_format": {"type": "json_object"}
        }

        url = f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"
        logger.info(
            "Calling OpenRouter model '%s' for submissionModuleId: %s",
            active_model,
            submission_module_id
        )

        async with httpx.AsyncClient(timeout=float(settings.REQUEST_TIMEOUT_SECONDS)) as client:
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
            clean_json_str = raw_content.strip()
            if clean_json_str.startswith("```json"):
                clean_json_str = clean_json_str[7:]
            if clean_json_str.startswith("```"):
                clean_json_str = clean_json_str[3:]
            if clean_json_str.endswith("```"):
                clean_json_str = clean_json_str[:-3]
            clean_json_str = clean_json_str.strip()

            parsed_data = json.loads(clean_json_str)
            return cls._build_response_from_json(
                submission_module_id,
                parsed_data,
                max_score,
                model_used=active_model,
                provider_used="openrouter"
            )

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
        model = genai.GenerativeModel(
            model_name=active_model,
            system_instruction=static_system_prompt,
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        )

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

        # Prompt Caching optimization (Tier 1):
        # Static prompt prefix goes first, dynamic per-student audio goes last.
        response = model.generate_content([user_prompt, audio_part])
        raw_text = response.text
        parsed_json = json.loads(raw_text)

        return cls._build_response_from_json(
            submission_module_id,
            parsed_json,
            max_score,
            model_used=active_model,
            provider_used="gemini"
        )

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
                word=w.get("word", ""),
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

        # Map annotations with precise character offsets
        raw_annotations = data.get("annotations", [])
        annotations: List[AnnotationItem] = []
        for ann in raw_annotations:
            target_word = ann.get("word", "").strip().lower()
            start_off = 0
            end_off = 0
            matched = False

            # Search in word_offsets
            for wo in word_offsets:
                if wo["word"].strip().lower() == target_word:
                    start_off = wo["startOffset"]
                    end_off = wo["endOffset"]
                    matched = True
                    break

            if not matched and full_transcript and target_word:
                idx = full_transcript.lower().find(target_word)
                if idx >= 0:
                    start_off = idx
                    end_off = idx + len(target_word)

            annotations.append(AnnotationItem(
                startOffset=start_off,
                endOffset=end_off,
                errorType=ann.get("errorType", "PRONUNCIATION"),
                comment=ann.get("comment", "Phát âm cần lưu ý"),
                suggestedFix=ann.get("suggestedFix")
            ))

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
            ("called", 4.1, 4.5, 0.94), ("Atomic", 4.5, 5.1, 0.92), ("Habits", 5.1, 5.7, 0.72), # Low confidence: missing /s/
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
            ("psychology", 20.9, 21.85, 0.70), # Low confidence: pronounced silent /p/
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

