# Nghiên cứu Chi tiết Pipeline Chấm điểm Kỹ năng Viết bằng AI (AI Writing Grading Pipeline)
## Chuyên sâu về Cơ chế Hoạt động & Kiến trúc Vi Dịch vụ Chấm điểm Kỹ năng Viết (UC27)

> **Mã phân hệ:** AI-SERVICE / WRITING-PIPELINE (UC27)  
> **Công nghệ áp dụng:** Python 3.11, FastAPI, Google GenAI SDK (Gemini Flash), Pydantic V2, Text Linguistics Engine  
> **Mục tiêu nghiên cứu:** Phân tích chi tiết quy trình xử lý nội bộ 6 giai đoạn của `ai-service`, từ trích xuất văn bản bài viết, tính toán chỉ số ngôn ngữ học định lượng, chuẩn hóa prompt rubric IELTS/CEFR 4 tiêu chí, sinh chú thích lỗi (annotations) dạng offset, đến cơ chế xử lý lỗi/fallback theo PP Mục 6.5.2 và bộ dữ liệu mẫu benchmark cố định QA-21.

---

## 1. Sơ đồ Tổng quan Pipeline 6 Giai đoạn (Writing Pipeline Architecture)

Toàn bộ quy trình chấm kỹ năng Viết (UC27) trong `ai-service` được thiết kế theo mô hình đường ống tuần tự (Sequential Pipe-and-Filter Pipeline), bao gồm 6 giai đoạn:

```
[1. Ingestion & Text Extraction]
        │ (Sanitization, Validation, Min-word gate >= 20 words)
        ▼
[2. Quantitative Linguistic Engine] ─── (Word count, Sentence count, ASL, TTR, Flesch Readability)
        │
        ▼
[3. LLM Semantic & Rubric Engine]  ─── (4 tiêu chí IELTS: TR/TA, CC, LR, GRA qua Gemini Structured Output)
        │
        ▼
[4. Annotation & Offset Engine]   ─── (Phát hiện lỗi Grammar, Vocab, Cohesion, Punctuation với start/endOffset)
        │
        ▼
[5. Scoring & Feedback Synthesis] ─── (Tính Overall Score, sinh nhận xét Markdown sư phạm)
        │
        ▼
[6. Pydantic Validation & Handoff]─── (Đóng gói JSON phản hồi tương thích CSDL Core Backend)
```

---

## 2. Giai đoạn 1: Tiếp nhận & Tiền xử lý Văn bản (Ingestion & Validation)

### 2.1. Tiếp nhận Yêu cầu qua REST API
Core Backend (Spring Boot) gửi yêu cầu phân tích tới endpoint:
`POST http://ai-service:8001/api/v1/analyze/writing`

Payload đầu vào gồm:
- `submissionModuleId`: Định danh phần nộp bài (`int`).
- `content`: Nội dung bài viết dạng văn bản thô (Plain text trích xuất từ cột `answers.content` trong CSDL Core).
- `moduleInstructions`: Đề bài hoặc yêu cầu câu hỏi của giáo viên (ví dụ: *"Some people believe that unpaid community service should be compulsory in high schools..."*).
- `aiInstructionSnapshot`: Khung tiêu chí hoặc rubric riêng biệt của giáo viên (tùy chọn).
- `maxScore`: Thang điểm tối đa (mặc định 9.0 theo IELTS hoặc 10.0 / 100.0).
- `modelUsed` / `providerUsed`: Định tuyến mô hình AI theo yêu cầu (tùy chọn).

### 2.2. Kiểm tra Hợp lệ Đầu vào (Input Validation Gates)
1. **Kiểm tra độ dài tối thiểu (Word Count Gate):**
   - Bài viết phải đạt tối thiểu **20 từ**. Nếu dưới 20 từ hoặc chỉ chứa các ký tự vô nghĩa lặp lại, API từ chối xử lý và trả về HTTP `422 Unprocessable Entity` kèm thông báo: *"Bài viết quá ngắn (dưới 20 từ) để có thể đánh giá học thuật."*
2. **Làm sạch văn bản (Sanitization):**
   - Chuẩn hóa ký tự xuống dòng (`\r\n` $\to$ `\n`), loại bỏ ký tự điều khiển ASCII ẩn (`\x00-\x1f` ngoại trừ `\n`, `\t`).
   - Cắt tỉa khoảng trắng đầu cuối (trim).

---

## 3. Giai đoạn 2: Động cơ Phân tích Ngôn ngữ học Định lượng (Quantitative Linguistic Engine)

Trước khi gửi dữ liệu sang LLM, vi dịch vụ chạy bộ phân tích văn bản thuần túy (`TextAnalyzer`) để tính toán các chỉ số toán học khách quan:

### 3.1. Các Chỉ số Định lượng Đo lường
1. **Độ dài & Mật độ câu:**
   - `wordCount`: Tổng số từ trong bài viết.
   - `sentenceCount`: Tổng số câu hợp lệ.
   - `averageSentenceLength (ASL)`: Số từ trung bình trong một câu:
     $$\text{ASL} = \frac{\text{Tổng số từ}}{\text{Tổng số câu}}$$
2. **Độ phong phú từ vựng (Lexical Diversity - Type-Token Ratio / TTR):**
   - Đo lường mức độ đa dạng vốn từ, tránh lặp từ đơn điệu:
     $$\text{TTR} = \frac{\text{Số từ vựng duy nhất (Unique Lemma / Words)}}{\text{Tổng số từ (Total Words)}}$$
     - $\text{TTR} \geq 0.60$: Vốn từ phong phú, linh hoạt.
     - $\text{TTR} < 0.45$: Bài viết lặp từ nhiều, diễn đạt nghèo nàn.
3. **Độ phức tạp & Mức độ Dễ đọc (Readability Metrics):**
   - **Chỉ số Flesch Reading Ease (FRE):**
     $$\text{FRE} = 206.835 - (1.015 \times \text{ASL}) - (84.6 \times \text{ASW})$$
     *(với ASW là số âm tiết trung bình mỗi từ)*.
   - **Chỉ số Flesch-Kincaid Grade Level (FKGL):** Ước lượng trình độ học vấn tương đương theo hệ thống giáo dục Mỹ.

---

## 4. Giai đoạn 3: Phân tích Chấm điểm Ngữ nghĩa LLM (LLM Semantic & Rubric Engine)

### 4.1. Chuẩn hóa Khung Tiêu chí Chấm IELTS Writing & CEFR
Mô hình Gemini 2.5 Flash / Pro đánh giá bài viết theo 4 tiêu chí cốt lõi:
1. **Task Response / Task Achievement (TR/TA):**
   - Mức độ trả lời đầy đủ tất cả các yêu cầu của đề bài.
   - Lập trường rõ ràng xuyên suốt bài viết, luận điểm được giải thích và minh họa cụ thể.
2. **Coherence and Cohesion (CC):**
   - Sự mạch lạc về tư duy và cấu trúc phân đoạn (Paragraphing).
   - Sử dụng phương tiện liên kết câu (Discourse markers, cohesive devices) tự nhiên, không gượng ép.
3. **Lexical Resource (LR):**
   - Vốn từ vựng đa dạng, sử dụng các cụm từ học thuật, collocation nâng cao.
   - Kiểm soát chính tả (Spelling) và dạng thức từ (Word formation).
4. **Grammatical Range and Accuracy (GRA):**
   - Đa dạng cấu trúc câu (câu phức, câu ghép, mệnh đề quan hệ, đảo ngữ, câu bị động).
   - Kiểm soát lỗi ngữ pháp (thì, hòa hợp chủ-vị, giới từ, mạo từ) và dấu câu (Punctuation).

### 4.2. Kỹ thuật Structured Outputs (Pydantic JSON Schema)
Yêu cầu Gemini phản hồi qua cơ chế Structured Output với JSON Schema định sẵn, loại bỏ hoàn toàn rủi ro sai định dạng hoặc sinh văn bản tự do:

```json
{
  "taskResponse": 6.5,
  "coherenceAndCohesion": 6.0,
  "lexicalResource": 6.5,
  "grammaticalRangeAndAccuracy": 6.0,
  "overallScore": 6.5,
  "feedbackSummary": "Bài viết có lập trường rõ ràng, tuy nhiên còn mắc một số lỗi về chia động từ và dùng từ chưa tự nhiên...",
  "criteriaFeedback": {
    "taskResponse": "Đã trả lời trọn vẹn yêu cầu đề bài...",
    "coherenceAndCohesion": "Cần thêm từ nối chuyển tiếp giữa đoạn 1 và đoạn 2...",
    "lexicalResource": "Vốn từ tương đối tốt, nhưng cụm từ 'make benefit' dùng sai collocation...",
    "grammaticalRangeAndAccuracy": "Mắc lỗi chủ ngữ số ít đi với động từ nguyên thể..."
  },
  "annotations": [
    {
      "exactText": "Community service help teenagers",
      "errorType": "GRAMMAR",
      "comment": "Chủ ngữ số ít 'Community service' cần đi với động từ số ít 'helps'.",
      "suggestedFix": "Community service helps teenagers"
    }
  ]
}
```

---

## 5. Giai đoạn 4: Động cơ Đánh dấu Lỗi Dạng Offset (Annotation & Offset Alignment)

Nhằm đảm bảo tương thích 100% với hệ thống hiển thị Highlight trên giao diện học viên và giáo viên của EnglishHub:
- Hệ thống thực hiện tìm kiếm chính xác vị trí của đoạn văn bản có lỗi trong bài viết gốc:
  - `startOffset`: Vị trí ký tự bắt đầu (0-indexed).
  - `endOffset`: Vị trí ký tự kết thúc ($endOffset = startOffset + \text{len}(exactText)$).
  - `errorType`: Loại lỗi (`GRAMMAR`, `VOCABULARY`, `COHESION`, `PUNCTUATION`, `SPELLING`).
- **Xác thực Offset (Offset Integrity Gate):**
  - Đảm bảo $0 \leq startOffset < endOffset \leq \text{len}(content)$.
  - Tránh các trường hợp duplicate matches bằng cách căn chỉnh vị trí theo ngữ cảnh đoạn văn.

---

## 6. Dữ liệu Mẫu Benchmark QA-21 cho Kỹ năng Viết (QA-21 Writing Reference Dataset)

Để phục vụ kiểm thử hồi quy tự động (CI/CD) và đảm bảo tính tất định (100% Deterministic) độc lập với LLM bên ngoài, hệ thống tích hợp bộ dữ liệu mẫu cố định trong chế độ `MOCK_MODE` hoặc fallback:

### 6.1. Đề bài Tham chiếu (QA-21 Prompt)
> *"Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?"*

### 6.2. Bài viết Học viên Tham chiếu (QA-21 Student Essay)
> *"Nowadays, many educators argue that unpaid community service should be compulsory in high school. In my opinion, I completely agree with this viewpoint because volunteering helps students develop essential life skills and broadens their social awareness.*  
> *First of all, engaging in voluntary activities allows teenagers to acquire practical experience. Community service help teenagers understand social responsibilities and learn how to work effectively in a team. Furthermore, participating in social work can make a big benefit for their future university applications because admissions officers always appreciate well-rounded candidates.*  
> *However they should not be overloaded with too many working hours, as academic study must remain their top priority. In conclusion, mandatory community service is highly beneficial for high school students as long as it is reasonably arranged."*

### 6.3. Bộ Chú thích Lỗi Cố định (QA-21 Reference Annotations)
1. **Lỗi 1 (GRAMMAR):**
   - Đoạn văn: `"Community service help teenagers"`
   - Lỗi: Chia sai động từ cho chủ ngữ số ít không đếm được.
   - Sửa: `"Community service helps teenagers"`
2. **Lỗi 2 (VOCABULARY):**
   - Đoạn văn: `"make a big benefit"`
   - Lỗi: Sai Collocation. Trong tiếng Anh chuẩn, kết hợp từ đúng là *bring significant benefits* hoặc *provide great benefits*.
   - Sửa: `"bring significant benefits"`
3. **Lỗi 3 (PUNCTUATION):**
   - Đoạn văn: `"However they should not"`
   - Lỗi: Thiếu dấu phẩy ngăn cách trạng từ liên kết (transitional adverb) ở đầu mệnh đề.
   - Sửa: `"However, they should not"`

### 6.4. Điểm số Tham chiếu Cố định
- `overallScore`: **6.5 / 9.0**
- `taskResponse`: **7.0 / 9.0**
- `coherenceAndCohesion`: **6.5 / 9.0**
- `lexicalResource`: **6.0 / 9.0**
- `grammaticalRangeAndAccuracy`: **6.5 / 9.0**

---

## 7. Phương án Dự phòng khi LLM Bên thứ ba Timeout / Lỗi (theo PP Mục 6.5.2)

### 7.1. Tầng Vi Dịch vụ AI (`ai-service`)
1. **Cơ chế Timeout & Retry:**
   - Cấu hình Timeout cho mỗi request gọi LLM: **15 giây**.
   - Cấu hình Retry tự động: 1 lần sau 2 giây (Exponential Backoff) đối với các lỗi tạm thời như Rate Limit (`HTTP 429`) hoặc Network Glitch.
2. **Chế độ Mock / Benchmark Fallback:**
   - Khi biến môi trường `MOCK_MODE=True` (chạy offline / CI) hoặc khi dịch vụ LLM bên ngoài bị gián đoạn kéo dài, dịch vụ trả về bộ dữ liệu chuẩn QA-21 Deterministic, đảm bảo hệ thống không bị treo.
3. **Chuẩn hóa Mã phản hồi Lỗi:**
   - Trả về JSON lỗi đồng nhất:
     ```json
     {
       "error": "AI_PROCESSING_TIMEOUT",
       "message": "Không nhận được phản hồi từ dịch vụ AI trong thời gian cho phép.",
       "submissionModuleId": 15
     }
     ```

### 7.2. Tầng Core Backend (Spring Boot DDD)
1. **Phân lập lỗi (Fault Isolation):**
   - Tiến trình AI được chạy trong thread pool riêng biệt (`@Async("gradingAiExecutor")`). Nếu `ai-service` gặp sự cố, luồng nghiệp vụ chính của học viên và giáo viên hoàn toàn không bị ảnh hưởng.
2. **Chuyển trạng thái sang Chấm thủ công (Manual Fallback per PP 6.5.2):**
   - Khi nhận mã lỗi HTTP 5xx hoặc timeout từ `ai-service`, Spring Boot bắt `RestClientResponseException`, ghi log cảnh báo và cập nhật `gradings.status = FAILED`.
   - Bài làm của học sinh trong bảng `answers` vẫn được bảo toàn toàn vẹn. Giáo viên có thể truy cập giao diện chấm bài thủ công (UC24) để chấm điểm và nhận xét cho học viên bình thường.

---

## 8. Hướng dẫn Kiểm thử Postman Tham chiếu

- **Endpoint:** `POST http://localhost:8001/api/v1/analyze/writing`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "submissionModuleId": 15,
  "content": "Nowadays, many educators argue that unpaid community service should be compulsory in high school. In my opinion, I completely agree with this viewpoint because volunteering helps students develop essential life skills and broadens their social awareness.\nFirst of all, engaging in voluntary activities allows teenagers to acquire practical experience. Community service help teenagers understand social responsibilities and learn how to work effectively in a team. Furthermore, participating in social work can make a big benefit for their future university applications because admissions officers always appreciate well-rounded candidates.\nHowever they should not be overloaded with too many working hours, as academic study must remain their top priority. In conclusion, mandatory community service is highly beneficial for high school students as long as it is reasonably arranged.",
  "moduleInstructions": "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?",
  "maxScore": 9.0
}
```
- **Mã phản hồi mong đợi:** `200 OK`
- **Kiểm tra tính nhất quán:** Các trường `overallScore`, `criteriaScores`, `annotations` phải trả về chính xác như bộ tham chiếu QA-21 qua mọi lần gọi lặp lại.
