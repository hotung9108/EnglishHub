from typing import List, Tuple, Dict
from app.schemas.speaking import WordTimestamp, FluencyMetrics


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
    def build_transcript_and_offsets(words: List[WordTimestamp]) -> Tuple[str, List[Dict[str, int]]]:
        """
        Builds the full transcript by joining words with a single space,
        and computes the startOffset and endOffset for each word.
        """
        full_transcript_parts = []
        word_offsets = []
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
