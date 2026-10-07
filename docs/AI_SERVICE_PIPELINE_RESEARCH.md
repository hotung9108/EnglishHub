# Nghiên cứu Chi tiết Pipeline Xử lý của Service AI (AI Service Internal Pipeline)
## Chuyên sâu về Cơ chế Hoạt động của Vi Dịch vụ Chấm điểm Kỹ năng Nói (UC26)

> **Mã phân hệ:** AI-SERVICE / SPEAKING-PIPELINE (UC26)  
> **Công nghệ áp dụng:** Python 3.11, FastAPI, Google GenAI SDK (Gemini Flash Multimodal), Pydantic V2  
> **Mục tiêu nghiên cứu:** Phân tích chi tiết quy trình xử lý nội bộ 6 giai đoạn của `ai-service`, từ lúc nhận tệp âm thanh từ Core Backend đến khi hoàn tất tính toán âm học, phân tích ngữ nghĩa, sinh chú thích lỗi và đóng gói JSON phản hồi.

---

## 1. Sơ đồ Tổng quan Pipeline 6 Giai đoạn (Pipeline Architecture)

Toàn bộ quy trình xử lý trong `ai-service` được thiết kế theo mô hình đường ống tuần tự (Sequential Pipe-and-Filter Pipeline), bao gồm 6 giai đoạn rõ ràng:

![Sơ đồ Pipeline Làm việc của AI Service](C:/Users/ad/.gemini/antigravity-ide/brain/9ff40f19-90c9-495c-a8c3-e1496c0d722d/ai_service_internal_pipeline.png)

```
[1. Ingestion & Validation]
        │
        ▼ (Audio Stream / Base64)
[2. Gemini Multimodal Engine]
        │
        ▼ (Raw Transcript + Timestamps + Rubric Evaluations)
[3. Acoustic & Fluency Engine] ─── (Tính WPM, Pause Intervals, PTR)
        │
        ▼
[4. Rubric Evaluation Engine] ──── (Chuẩn hóa 4 tiêu chí IELTS/CEFR)
        │
        ▼
[5. Annotation & Offset Engine] ── (Tính startOffset/endOffset, ký âm IPA)
        │
        ▼
[6. Pydantic Output Validation] ── (Đóng gói JSON phản hồi -> Core Backend)
```

---

## 2. Giai đoạn 1: Tiếp nhận & Tiền xử lý Âm thanh (Audio Ingestion & Validation)

### 2.1. Tiếp nhận Yêu cầu qua REST API
Core Backend (Spring Boot) gửi yêu cầu phân tích tới endpoint:
`POST http://ai-service:8001/api/v1/analyze/speaking`

Payload đầu vào gồm:
- `submission_module_id`: Định danh phần thi.
- `audio_url`: Đường dẫn Presigned GET URL tải tệp ghi âm từ **Neon Storage (S3)**.
- `module_instructions`: Đề bài / câu hỏi của giáo viên (ví dụ: *"Describe a book you enjoyed reading"*).
- `ai_instruction_snapshot`: Khung tiêu chí hoặc chỉ dẫn chấm bổ sung.
- `max_score`: Thang điểm tối đa (mặc định 9.0 theo IELTS hoặc 10.0 / 100.0).

### 2.2. Kỹ thuật Tải tệp Tinh gọn (Streaming In-Memory)
- **Vấn đề cần tránh:** Lưu tệp âm thanh tạm thời xuống ổ cứng của container sẽ gây nghẽn I/O và làm phình dung lượng lưu trữ container theo thời gian.
- **Giải pháp:** Sử dụng thư viện `httpx.AsyncClient` để stream trực tiếp dữ liệu âm thanh vào bộ nhớ RAM (`io.BytesIO` buffer).
- **Kiểm tra tính hợp lệ (Validation Gates):**
  1. *Kiểm tra kích thước tệp:* Giới hạn tối đa 25MB (đáp ứng các bài thi Nói dài tới 5-10 phút).
  2. *Kiểm tra thời lượng tệp:* Tối thiểu 3 giây (đảm bảo học viên có phát âm, không phải file rỗng) và tối đa 300 giây.
  3. *MIME-Type:* Xác thực header `audio/mpeg`, `audio/wav`, `audio/x-m4a`, `audio/webm`.
  4. *Mã hóa Base64:* Chuyển đổi buffer âm thanh sang chuỗi Base64 chuẩn bị cho payload của Gemini Multimodal API.

---

## 3. Giai đoạn 2: Nhận diện Âm thanh & Căn chỉnh Mốc thời gian (STT & Word-Level Alignment)

### 3.1. Cơ chế Multimodal Native của Gemini Flash
Khác với các mô hình truyền thống (phải dùng mô hình STT riêng như Whisper rồi chuyển text sang LLM), **Google Gemini Flash Multimodal** có khả năng "lắng nghe" trực tiếp dữ liệu âm thanh dạng sóng (raw audio waveform).
- **Lợi ích:** Mô hình không chỉ nghe được từ ngữ mà còn cảm nhận được:
  - Ngữ điệu (Intonation).
  - Trọng âm câu và trọng âm từ (Word stress).
  - Độ dài khoảng ngừng và nhịp điệu hơi thở.

### 3.2. Cấu trúc Trích xuất Mốc thời gian từng từ (Word Timestamps)
Prompt chỉ thị Gemini trả về danh sách các từ đã nói kèm mốc thời gian giây (Float seconds) và độ tin cậy phát âm (Confidence score):

```json
[
  { "word": "I", "start": 0.0, "end": 0.3, "confidence": 0.98 },
  { "word": "would", "start": 0.3, "end": 0.55, "confidence": 0.95 },
  { "word": "like", "start": 0.55, "end": 0.85, "confidence": 0.96 },
  { "word": "to", "start": 0.85, "end": 1.05, "confidence": 0.97 },
  { "word": "describe", "start": 1.05, "end": 1.65, "confidence": 0.92 },
  { "word": "a", "start": 1.65, "end": 1.75, "confidence": 0.99 },
  { "word": "book", "start": 1.75, "end": 2.15, "confidence": 0.95 }
]
```

> **Quy chuẩn tương thích:** Định dạng mảng này tương thích 100% với hàm kiểm chuẩn `validateTranscript` trong CSDL Core của dự án (tại `GradingMockDataSeeder.java`), đảm bảo khi lưu vào cột `gradings.ai_transcript` (JSONB) sẽ không phát sinh lỗi validation.

---

## 4. Giai đoạn 3: Động cơ Phân tích Âm học & Đo lường Độ trôi chảy (Acoustic & Fluency Engine)

Giai đoạn này trích xuất các chỉ số toán học định lượng khách quan từ chuỗi timestamps:

### 4.1. Tốc độ Nói (Speech Rate - WPM)
Tốc độ nói được tính bằng số từ phát âm được trong một phút:
$$\text{WPM} = \frac{\text{Tổng số từ (Word Count)}}{\text{Tổng thời gian nói (Total Duration in seconds)}} \times 60$$

**Bảng thang đo tham chiếu IELTS Speaking:**
- **Chậm / Ngắc ngứ ($< 100 \text{ WPM}$):** Thiếu độ lưu loát, thí sinh mất nhiều thời gian tìm từ.
- **Tự nhiên / Chuẩn ($110 - 150 \text{ WPM}$):** Tốc độ lý tưởng của người nói tiếng Anh trôi chảy.
- **Nói quá nhanh ($> 170 \text{ WPM}$):** Có thể làm mất rõ ràng trong phát âm hoặc nuốt âm.

### 4.2. Phát hiện Khoảng ngập ngừng (Pauses & Hesitations Detection)
Khoảng nghỉ giữa từ thứ $i$ và từ thứ $i+1$ được tính theo công thức:
$$\Delta t_i = \text{word}[i+1].\text{start} - \text{word}[i].\text{end}$$

Hệ thống phân loại khoảng nghỉ thành 2 nhóm:
1. **Nghỉ tự nhiên (Micropause / Syntactic Pause):** $0.2\text{s} \le \Delta t_i < 0.5\text{s}$  
   *(Nghỉ giữa các cụm từ, mệnh đề hoặc sau dấu câu — không bị trừ điểm).*
2. **Ngập ngừng bất thường (Unnatural Pause / Hesitation):** $\Delta t_i \ge 0.5\text{s}$  
   *(Ngập ngừng do quên từ, bế tắc ý tưởng hoặc tự sửa sai — ảnh hưởng tiêu cực đến điểm Fluency).*

### 4.3. Tỷ lệ Phát âm Liên tục (Phonation Time Ratio - PTR)
Tỷ lệ giữa thời gian thực sự phát âm so với tổng thời lượng ghi âm:
$$\text{PTR} = \frac{\sum_{i=1}^{N} (\text{word}[i].\text{end} - \text{word}[i].\text{start})}{\text{Total Duration}}$$
- $\text{PTR} \ge 0.70$: Thí sinh có năng lực duy trì bài nói liên tục, ít khoảng lặng chết.
- $\text{PTR} < 0.50$: Bài nói có quá nhiều khoảng trống im lặng, bị gián đoạn nhiều lần.

---

## 5. Giai đoạn 4: Đánh giá Năng lực 4 Tiêu chí IELTS / CEFR (Rubric Reasoning Engine)

Mô hình Gemini Flash được nạp một System Prompt chuẩn mực, đóng vai trò là **Giám khảo Khảo thí IELTS Quốc tế**.

### 5.1. Bốn Tiêu chí Đánh giá Độc lập
1. **Fluency & Coherence (FC) - Độ trôi chảy & Mạch lạc:**
   - Dựa trên chỉ số WPM, số khoảng ngập ngừng, khả năng mở rộng câu trả lời và sử dụng từ nối (`connectors` / `discourse markers`).
2. **Lexical Resource (LR) - Vốn từ vựng:**
   - Đánh giá sự đa dạng của từ vựng (Type-Token Ratio - TTR).
   - Kiểm tra việc sử dụng thành ngữ (`idiomatic language`), cụm từ cố định (`collocations`) và tránh lặp từ thông dụng (`good`, `nice`, `important`).
3. **Grammatical Range & Accuracy (GRA) - Ngữ pháp:**
   - Tỷ lệ câu đơn so với câu ghép/câu phức (`compound/complex sentences`).
   - Độ chuẩn xác khi chia động từ, mạo từ (`a/an/the`), giới từ và các cấu trúc câu điều kiện/gián tiếp.
4. **Pronunciation (PR) - Phát âm:**
   - Nhận diện các lỗi phát âm phụ âm cuối (Ending sounds: `/s/`, `/z/`, `/t/`, `/d/`, `/ɪd/`).
   - Đánh giá trọng âm từ (Word stress) và độ tin cậy phát âm (Confidence $< 0.75$).

### 5.2. Công thức Tổng hợp Điểm
$$\text{Overall Score} = \text{Round}\left(\frac{\text{Score}_{\text{FC}} + \text{Score}_{\text{LR}} + \text{Score}_{\text{GRA}} + \text{Score}_{\text{PR}}}{4}\right)$$
*(Làm tròn về mốc 0.5 gần nhất theo quy tắc làm tròn điểm số chính thức của IELTS).*

---

## 6. Giai đoạn 5: Định vị & Sinh Chú thích Lỗi (Error Localization & Annotation Engine)

Để giao diện người dùng (Frontend) có thể làm nổi bật (highlight) chính xác vị trí lỗi trên văn bản phiên âm (Karaoke / Interactive Transcript), hệ thống phải tính toán chỉ số vị trí ký tự:

### 6.1. Thuật toán Tính toán Chỉ số Ký tự (Offset Mapping Algorithm)
Sau khi nối toàn bộ chuỗi từ trong `ai_transcript` thành chuỗi văn bản hoàn chỉnh `FullTranscript`:

$$\text{FullTranscript} = \text{word}_1 + \text{" "} + \text{word}_2 + \text{" "} + \dots + \text{word}_N$$

Mỗi từ $i$ sẽ có một cặp tọa độ ký tự chính xác:
- $\text{startOffset}_i$: Chỉ số ký tự bắt đầu của từ trong chuỗi văn bản.
- $\text{endOffset}_i = \text{startOffset}_i + \text{length}(\text{word}_i)$.

### 6.2. Cấu trúc Ghi chú Lỗi (Annotation Item)
Khi phát hiện một lỗi (ví dụ phát âm sai hoặc chia sai thì):
- **Phân loại lỗi (`errorType`):** `PRONUNCIATION` | `GRAMMAR` | `VOCABULARY` | `FLUENCY`.
- **Tọa độ (`startOffset`, `endOffset`):** Khớp chính xác với đoạn văn bản chứa lỗi.
- **Nhận xét (`comment`):** Lời giải thích ngắn gọn, dễ hiểu (bằng tiếng Việt hoặc tiếng Anh).
- **Gợi ý khắc phục (`suggestedFix`):**
  - Đối với lỗi phát âm: Cung cấp ký âm phiên âm quốc tế **IPA** (ví dụ: `/ˈhæb.ɪts/`).
  - Đối với lỗi ngữ pháp: Cung cấp cụm từ sửa đúng.

---

## 7. Giai đoạn 6: Kiểm chuẩn Đầu ra & Cơ chế Xử lý Ngoại lệ (Validation & Fault Resilience)

### 7.1. Kiểm chuẩn Dữ liệu Đầu ra bằng Pydantic V2
Trước khi gửi phản hồi HTTP 200 về Core Backend, `ai-service` chạy dữ liệu qua bộ kiểm chuẩn nghiêm ngặt:
- Đảm bảo `aiTranscript` là mảng không rỗng.
- Đảm bảo các chỉ số điểm số nằm trong khoảng $[0.0, \text{maxScore}]$.
- Đảm bảo các khoảng offset không bị vượt quá độ dài toàn văn (`endOffset <= len(full_transcript)`).

### 7.2. Xử lý Lỗi & Phòng ngừa Rủi ro (PP Mục 6.5.2)
1. **Lỗi Âm thanh Hỏng / Không có Giọng nói (Silent/Corrupt Audio):**
   - Trả về mã HTTP `422 Unprocessable Entity` kèm thông báo: *"Không nhận diện được giọng nói trong tệp ghi âm. Vui lòng kiểm tra lại micro."*
2. **Lỗi Quá tải Dịch vụ AI (HTTP 429 Too Many Requests / Quota Exceeded):**
   - Cơ chế Backoff nội bộ: Tự động thử lại 1 lần sau 2 giây. Nếu vẫn thất bại, trả về HTTP `503 Service Unavailable`.
3. **Phản hồi Lỗi Chuẩn hóa:**
   - Trả về JSON lỗi đồng nhất:
     ```json
     {
       "error": "AI_PROCESSING_TIMEOUT",
       "message": "Không nhận được phản hồi từ dịch vụ AI trong thời gian cho phép.",
       "submissionModuleId": 14
     }
     ```
   - Nhờ đó, Core Backend (Spring Boot) dễ dàng bắt được lỗi và cập nhật `gradings.status = FAILED`, chuyển sang cơ chế chấm thủ công (**PP Mục 6.5.2**).

---

## 8. Kết luận & Giá trị Kỹ thuật

Pipeline của `ai-service` mang lại 3 giá trị cốt lõi:
1. **Tính Tách Biệt & Độc Lập:** Core Backend hoàn toàn giải phóng khỏi gánh nặng xử lý AI, không bị ảnh hưởng bởi memory leak hay latency của các model xử lý âm thanh.
2. **Tính Khoa Học & Định Lượng:** Không đánh giá cảm tính; kết hợp cả số đo âm học khách quan (WPM, Pauses, PTR) lẫn tư duy ngữ nghĩa sâu sắc của LLM (4 tiêu chí IELTS).
3. **Tính Khả Dụng Cao:** Hỗ trợ giao diện hiển thị đồng bộ mốc thời gian (Karaoke-style) và ghi chú trực quan giúp học viên tiến bộ rõ rệt sau từng bài tập Nói.
