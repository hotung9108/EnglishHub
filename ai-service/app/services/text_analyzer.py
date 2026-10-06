import re
from typing import List, Tuple, Optional
from app.schemas.writing import WritingMetrics


class TextAnalyzer:
    """
    Engine phân tích ngôn ngữ học định lượng cho bài viết (UC27).
    Tính toán các chỉ số toán học: Word Count, Sentence Count, ASL, TTR, Flesch-Kincaid.
    """

    @staticmethod
    def count_syllables_in_word(word: str) -> int:
        """Ước lượng số âm tiết trong một từ tiếng Anh."""
        word = word.lower().strip()
        if not word:
            return 1
        # Bỏ dấu câu xung quanh
        word = re.sub(r"[^a-z]", "", word)
        if len(word) <= 3:
            return 1

        # Xóa 'e' câm ở cuối nếu không phải 'le'
        if word.endswith("e") and not word.endswith("le") and len(word) > 2:
            word = word[:-1]

        # Đếm các cụm nguyên âm liên tiếp
        vowel_runs = re.findall(r"[aeiouy]+", word)
        count = len(vowel_runs)
        return max(1, count)

    @classmethod
    def analyze(cls, text: str) -> WritingMetrics:
        """Tính toán toàn bộ các chỉ số định lượng của bài viết."""
        cleaned_text = text.strip()
        if not cleaned_text:
            return WritingMetrics(
                wordCount=0,
                sentenceCount=0,
                averageSentenceLength=0.0,
                lexicalDiversity=0.0,
                fleschKincaidGrade=0.0
            )

        # 1. Trích xuất danh sách từ
        words = re.findall(r"\b[A-Za-z0-9'-]+\b", cleaned_text)
        word_count = len(words)
        if word_count == 0:
            return WritingMetrics(
                wordCount=0,
                sentenceCount=0,
                averageSentenceLength=0.0,
                lexicalDiversity=0.0,
                fleschKincaidGrade=0.0
            )

        # 2. Trích xuất danh sách câu
        raw_sentences = re.split(r"[.!?]+(?:\s+|$)", cleaned_text)
        sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 0]
        sentence_count = max(1, len(sentences))

        # 3. Độ dài trung bình câu (Average Sentence Length - ASL)
        asl = round(word_count / sentence_count, 2)

        # 4. Độ đa dạng từ vựng (Type-Token Ratio - TTR)
        unique_words = set(w.lower() for w in words)
        ttr = round(len(unique_words) / word_count, 4)

        # 5. Flesch-Kincaid Grade Level
        total_syllables = sum(cls.count_syllables_in_word(w) for w in words)
        asw = total_syllables / word_count  # Average Syllables per Word
        fk_grade = round(0.39 * asl + 11.8 * asw - 15.59, 1)
        fk_grade = max(0.0, min(18.0, fk_grade))

        return WritingMetrics(
            wordCount=word_count,
            sentenceCount=sentence_count,
            averageSentenceLength=asl,
            lexicalDiversity=ttr,
            fleschKincaidGrade=fk_grade
        )

    @staticmethod
    def align_annotation_offset(
        full_text: str,
        target_phrase: str,
        estimated_start: Optional[int] = None
    ) -> Tuple[int, int]:
        """
        Xác định chính xác startOffset và endOffset của đoạn văn bản có lỗi.
        Nếu estimated_start được cung cấp, ưu tiên tìm kiếm quanh vị trí đó.
        """
        if not target_phrase or not full_text:
            return (0, 0)

        # Tìm kiếm chính xác quanh estimated_start nếu hợp lệ
        if estimated_start is not None and estimated_start >= 0 and estimated_start < len(full_text):
            found_idx = full_text.find(target_phrase, max(0, estimated_start - 30))
            if found_idx != -1 and abs(found_idx - estimated_start) <= 50:
                return (found_idx, found_idx + len(target_phrase))

        # Tìm kiếm từ đầu văn bản
        idx = full_text.find(target_phrase)
        if idx != -1:
            return (idx, idx + len(target_phrase))

        # Thử tìm kiếm không phân biệt hoa thường
        lower_full = full_text.lower()
        idx_lower = lower_full.find(target_phrase.lower())
        if idx_lower != -1:
            return (idx_lower, idx_lower + len(target_phrase))

        return (0, 0)

    @staticmethod
    def extract_text_from_document(file_bytes: bytes, filename: str) -> str:
        """
        Trích xuất nội dung văn bản từ các định dạng tài liệu: .txt, .md, .pdf, .docx.
        """
        import io
        ext = filename.lower().split(".")[-1] if "." in filename else ""

        if ext in ("txt", "md"):
            return file_bytes.decode("utf-8", errors="ignore").strip()

        if ext == "pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                pages_text = [page.extract_text() or "" for page in reader.pages]
                return "\n".join(pages_text).strip()
            except Exception as e:
                raise ValueError(f"Không thể đọc nội dung file PDF: {str(e)}")

        if ext in ("docx", "doc"):
            try:
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                paragraphs_text = [p.text for p in doc.paragraphs if p.text]
                return "\n".join(paragraphs_text).strip()
            except Exception as e:
                raise ValueError(f"Không thể đọc nội dung file Word (.docx): {str(e)}")

        # Mặc định thử decode utf-8
        try:
            return file_bytes.decode("utf-8").strip()
        except Exception:
            raise ValueError(f"Định dạng tệp '.{ext}' không được hỗ trợ. Vui lòng tải lên file .txt, .docx, .pdf hoặc .md.")

