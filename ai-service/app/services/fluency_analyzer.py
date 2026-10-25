import re
from typing import Any, Dict, List, Optional, Tuple
from app.schemas.speaking import WordTimestamp, FluencyMetrics

_EDGE_PUNCTUATION = ".,!?;:\"'“”‘’()[]{}-—…"


class FluencyAnalyzer:
    """Calculates objective acoustic and fluency metrics from word-level timestamps."""

    @staticmethod
    def analyze(words: List[WordTimestamp], total_duration_seconds: float = 0.0) -> FluencyMetrics:
        if not words:
            return FluencyMetrics(
                wordsPerMinute=0.0,
                pauseCount=0,
                totalDurationSeconds=max(total_duration_seconds, 0.0),
                phonationTimeRatio=0.0
            )

        # Determine effective spoken duration
        first_start = words[0].start
        last_end = words[-1].end
        spoken_duration = max(last_end - first_start, 0.1)
        total_duration = total_duration_seconds if total_duration_seconds > 0 else spoken_duration

        # 1. Words Per Minute (WPM) based on active speaking duration
        word_count = len(words)
        wpm = round((word_count / spoken_duration) * 60.0, 1)

        # 2. Pause detection: interval between word[i].end and word[i+1].start >= 0.5s
        pause_count = 0
        for i in range(len(words) - 1):
            pause_interval = words[i + 1].start - words[i].end
            if pause_interval >= 0.5:
                pause_count += 1

        # 3. Phonation Time Ratio (PTR) = total phonation time / spoken_duration
        total_phonation = sum(max(w.end - w.start, 0.0) for w in words)
        ptr = round(min(total_phonation / spoken_duration, 1.0), 2)

        return FluencyMetrics(
            wordsPerMinute=wpm,
            pauseCount=pause_count,
            totalDurationSeconds=round(total_duration, 1),
            phonationTimeRatio=ptr
        )

    @staticmethod
    def build_transcript_and_offsets(words: List[WordTimestamp]) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Builds the full transcript by joining words with a single space,
        and computes the startOffset and endOffset for each word.
        """
        full_transcript_parts: List[str] = []
        word_offsets: List[Dict[str, Any]] = []
        current_offset = 0

        for i, w in enumerate(words):
            if i > 0:
                full_transcript_parts.append(" ")
                current_offset += 1
            start_off = current_offset
            full_transcript_parts.append(w.word)
            current_offset += len(w.word)
            end_off = current_offset
            word_offsets.append({
                "word": w.word,
                "startOffset": start_off,
                "endOffset": end_off
            })

        full_transcript = "".join(full_transcript_parts)
        return full_transcript, word_offsets

    @staticmethod
    def _strip_edge_punctuation(token: str) -> Tuple[str, int, int]:
        """
        Strips leading and trailing punctuation/whitespace from a token.
        Returns (clean_token_lower, leading_trimmed_count, trailing_trimmed_count).
        """
        if not token:
            return ("", 0, 0)

        n = len(token)
        lead = 0
        while lead < n and (token[lead].isspace() or token[lead] in _EDGE_PUNCTUATION):
            lead += 1

        trail = 0
        while (n - trail - 1) >= lead and (
            token[n - trail - 1].isspace() or token[n - trail - 1] in _EDGE_PUNCTUATION
        ):
            trail += 1

        clean = token[lead: n - trail].lower()
        return (clean, lead, trail)

    @classmethod
    def align_spoken_annotation_offset(
        cls,
        full_transcript: str,
        word_offsets: List[Dict[str, Any]],
        target_text: str,
        context: Optional[str] = None,
        comment: Optional[str] = None,
        used_ranges: Optional[List[Tuple[int, int]]] = None
    ) -> Tuple[int, int]:
        """
        Aligns a target word or multi-word phrase with exact character offsets
        in `full_transcript`, prioritizing sentence context (from LLM or comment)
        to disambiguate duplicate words (e.g. repeated 'is', 'have', 'the'),
        ignoring attached punctuation and avoiding duplicate overlaps in `used_ranges`.
        """
        if not target_text or not full_transcript:
            return (0, 0)

        cleaned_target = target_text.strip().strip(_EDGE_PUNCTUATION).strip()
        if not cleaned_target:
            return (0, 0)

        raw_tokens = [t for t in cleaned_target.split() if t]
        target_tokens = [
            cls._strip_edge_punctuation(t)[0]
            for t in raw_tokens
            if cls._strip_edge_punctuation(t)[0]
        ]
        if not target_tokens:
            return (0, 0)

        def is_overlapping(start: int, end: int) -> bool:
            if not used_ranges:
                return False
            for u_start, u_end in used_ranges:
                if max(start, u_start) < min(end, u_end):
                    return True
            return False

        # =========================================================================
        # TẦNG 1 & 2: CONTEXT-BASED MATCHING (Ưu tiên ngữ cảnh câu để chống trùng lặp)
        # =========================================================================
        candidate_contexts: List[str] = []
        if context and context.strip():
            candidate_contexts.append(context.strip())

        # Fallback: Trích xuất cụm mỏ neo từ dấu ngoặc kép hoặc ngoặc đơn trong comment
        if comment and ("'" in comment or '"' in comment or '“' in comment):
            matches = re.findall(r"['\"“]([^'\"”\n]{3,100})['\"”]", comment)
            for m in matches:
                clean_m = m.strip().strip(_EDGE_PUNCTUATION)
                if cleaned_target.lower() in clean_m.lower() and clean_m not in candidate_contexts:
                    candidate_contexts.append(clean_m)

        pattern = r"\b" + r"[\s,.;:!?\"'“”‘’()\-]+".join(re.escape(t) for t in target_tokens) + r"\b"

        for ctx in candidate_contexts:
            ctx_clean = ctx.strip().strip(_EDGE_PUNCTUATION)
            if not ctx_clean:
                continue
            # Regex match context allowing flexible whitespace & punctuation
            ctx_escaped = re.escape(ctx_clean)
            ctx_regex = re.sub(r"\\\s+", r"[\\s,.;:!?\"'“”‘’()\\-]+", ctx_escaped)
            try:
                for m_ctx in re.finditer(ctx_regex, full_transcript, flags=re.IGNORECASE):
                    ctx_start, ctx_end = m_ctx.start(), m_ctx.end()
                    ctx_sub = full_transcript[ctx_start:ctx_end]
                    # Find target token within this isolated context substring
                    for m_word in re.finditer(pattern, ctx_sub, flags=re.IGNORECASE):
                        cand_start = ctx_start + m_word.start()
                        cand_end = ctx_start + m_word.end()
                        if cand_end > cand_start and not is_overlapping(cand_start, cand_end):
                            return (cand_start, cand_end)
            except re.error:
                # If regex fails on special symbols, fall back to simple substring search
                idx_c = full_transcript.lower().find(ctx_clean.lower())
                if idx_c >= 0:
                    ctx_sub = full_transcript[idx_c: idx_c + len(ctx_clean)]
                    for m_word in re.finditer(pattern, ctx_sub, flags=re.IGNORECASE):
                        cand_start = idx_c + m_word.start()
                        cand_end = idx_c + m_word.end()
                        if cand_end > cand_start and not is_overlapping(cand_start, cand_end):
                            return (cand_start, cand_end)

        # =========================================================================
        # TẦNG 3: SO KHỚP TỪ ĐƠN LẺ TRONG WORD_OFFSETS (Duyệt tuần tự, tránh trùng)
        # =========================================================================
        wo_cleaned = [
            cls._strip_edge_punctuation(str(wo.get("word", "")))
            for wo in word_offsets
        ]

        first_fallback: Optional[Tuple[int, int]] = None

        if len(target_tokens) == 1:
            target_word = target_tokens[0]
            for idx, wo in enumerate(word_offsets):
                clean_wo, lead_trim, trail_trim = wo_cleaned[idx]
                if clean_wo == target_word:
                    cand_start = int(wo["startOffset"]) + lead_trim
                    cand_end = int(wo["endOffset"]) - trail_trim
                    if cand_end <= cand_start:
                        cand_start = int(wo["startOffset"])
                        cand_end = int(wo["endOffset"])
                    if not is_overlapping(cand_start, cand_end):
                        return (cand_start, cand_end)
                    if first_fallback is None:
                        first_fallback = (cand_start, cand_end)

            if first_fallback is not None:
                return first_fallback

        # =========================================================================
        # TẦNG 4: SO KHỚP CỤM NHIỀU TỪ QUA CÁC WORD_OFFSETS LIÊN TIẾP
        # =========================================================================
        if len(target_tokens) > 1 and len(word_offsets) >= len(target_tokens):
            k = len(target_tokens)
            for i in range(len(word_offsets) - k + 1):
                if all(wo_cleaned[i + j][0] == target_tokens[j] for j in range(k)):
                    first_wo = word_offsets[i]
                    last_wo = word_offsets[i + k - 1]
                    _, lead_trim, _ = wo_cleaned[i]
                    _, _, trail_trim = wo_cleaned[i + k - 1]
                    cand_start = int(first_wo["startOffset"]) + lead_trim
                    cand_end = int(last_wo["endOffset"]) - trail_trim
                    if cand_end <= cand_start:
                        cand_start = int(first_wo["startOffset"])
                        cand_end = int(last_wo["endOffset"])
                    if not is_overlapping(cand_start, cand_end):
                        return (cand_start, cand_end)
                    if first_fallback is None:
                        first_fallback = (cand_start, cand_end)

            if first_fallback is not None:
                return first_fallback

        # =========================================================================
        # TẦNG 5: REGEX WORD-BOUNDARY SEARCH TRÊN TOÀN BỘ TRANSCRIPT
        # =========================================================================
        for match in re.finditer(pattern, full_transcript, flags=re.IGNORECASE):
            cand_start, cand_end = match.start(), match.end()
            if cand_end > cand_start:
                if not is_overlapping(cand_start, cand_end):
                    return (cand_start, cand_end)
                if first_fallback is None:
                    first_fallback = (cand_start, cand_end)

        if first_fallback is not None:
            return first_fallback

        # =========================================================================
        # TẦNG 6: SUBSTRING FALLBACK CUỐI CÙNG
        # =========================================================================
        idx = full_transcript.lower().find(cleaned_target.lower())
        if idx >= 0:
            cand_start = idx
            cand_end = idx + len(cleaned_target)
            if not is_overlapping(cand_start, cand_end) or first_fallback is None:
                return (cand_start, cand_end)

        return (0, 0)
