# Writing AI Grading Pipeline (UC27) Testing Instructions

## 1. Overview
This document outlines the testing procedures and Postman collection guidelines for **UC27: Autonomous AI Writing Grading Pipeline**.
It verifies:
1. Direct evaluation via FastAPI AI Microservice (`POST /api/v1/analyze/writing`).
2. QA-21 Deterministic Writing Benchmark dataset evaluation (DoD compliance).
3. 4-criteria IELTS scoring (`taskResponse`, `coherenceAndCohesion`, `lexicalResource`, `grammaticalRangeAndAccuracy`).
4. Linguistic metrics calculation (`wordCount`, `sentenceCount`, `averageSentenceLength`, `lexicalDiversity`, `fleschKincaidGrade`).
5. Precise character-level error annotations (`startOffset`, `endOffset`, `errorType`, `comment`, `suggestedFix`).
6. Third-party LLM timeout and failure fallback mechanisms (**PP Section 6.5.2**).

---

## 2. Environment Setup

| Service | Port | Endpoint |
|---|---|---|
| AI Microservice (FastAPI) | `8001` | `http://localhost:8001/api/v1/analyze/writing` |
| Core Backend (Spring Boot) | `8080` | `http://localhost:8080/api/v1/gradings` |

---

## 3. Test Cases for Postman & QA

### TC-WRITING-01: Direct AI Service Benchmark Evaluation (QA-21 Reference Essay)
- **Method**: `POST`
- **URL**: `http://localhost:8001/api/v1/analyze/writing`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "submissionModuleId": 15,
  "content": "Nowadays, many educators argue that unpaid community service should be compulsory in high school. In my opinion, I completely agree with this viewpoint because volunteering helps students develop essential life skills and broadens their social awareness.\nFirst of all, engaging in voluntary activities allows teenagers to acquire practical experience. Community service help teenagers understand social responsibilities and learn how to work effectively in a team. Furthermore, participating in social work can make a big benefit for their future university applications because admissions officers always appreciate well-rounded candidates.\nHowever they should not be overloaded with too many working hours, as academic study must remain their top priority. In conclusion, mandatory community service is highly beneficial for high school students as long as it is reasonably arranged.",
  "moduleInstructions": "Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?",
  "maxScore": 9.0
}
```
- **Expected Status**: `200 OK`
- **Expected Response Schema**:
```json
{
  "submissionModuleId": 15,
  "overallScore": 6.5,
  "aiFeedback": "### Đánh giá Tổng quan Kỹ năng Viết (IELTS Writing Task 2)\n...",
  "textMetrics": {
    "wordCount": 140,
    "sentenceCount": 5,
    "averageSentenceLength": 28.0,
    "lexicalDiversity": 0.67,
    "fleschKincaidGrade": 13.5
  },
  "criteriaScores": {
    "taskResponse": 7.0,
    "coherenceAndCohesion": 6.5,
    "lexicalResource": 6.0,
    "grammaticalRangeAndAccuracy": 6.5,
    "overallScore": 6.5
  },
  "annotations": [
    {
      "startOffset": 272,
      "endOffset": 305,
      "errorType": "GRAMMAR",
      "comment": "Chủ ngữ số ít 'Community service' cần đi với động từ số ít 'helps'.",
      "suggestedFix": "Community service helps teenagers"
    },
    {
      "startOffset": 435,
      "endOffset": 453,
      "errorType": "VOCABULARY",
      "comment": "Sai kết hợp từ (collocation). Trong tiếng Anh chuẩn, nên dùng 'bring significant benefits' hoặc 'provide great benefits'.",
      "suggestedFix": "bring significant benefits"
    },
    {
      "startOffset": 586,
      "endOffset": 609,
      "errorType": "PUNCTUATION",
      "comment": "Thiếu dấu phẩy ngăn cách trạng từ liên kết (transitional adverb) 'However' ở đầu mệnh đề.",
      "suggestedFix": "However, they should not"
    }
  ],
  "modelUsed": "benchmark/qa-21-deterministic",
  "providerUsed": "mock"
}
```

---

### TC-WRITING-02: Deterministic Stability Verification (DoD Requirement)
- **Method**: `POST`
- **URL**: `http://localhost:8001/api/v1/analyze/writing`
- **Steps**:
  1. Gửi request TC-WRITING-01 lần thứ nhất, lưu kết quả.
  2. Gửi request TC-WRITING-01 lần thứ hai ngay lập tức.
  3. Đối chiếu hai phản hồi JSON.
- **Expected Result**: Kết quả 100% đồng nhất giữa các lần gọi (giữ nguyên điểm số, metrics và annotations).

---

### TC-WRITING-03: Input Validation Gate (Essay Too Short < 20 Words)
- **Method**: `POST`
- **URL**: `http://localhost:8001/api/v1/analyze/writing`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "submissionModuleId": 15,
  "content": "This is too short.",
  "maxScore": 9.0
}
```
- **Expected Status**: `422 Unprocessable Entity`
- **Expected Response**:
```json
{
  "detail": "Bài viết quá ngắn (4 từ). Yêu cầu tối thiểu 20 từ để có thể đánh giá học thuật."
}
```

---

### TC-WRITING-04: Third-Party LLM Timeout / Resilience Fallback (PP Mục 6.5.2)
- **Scenario**: Khi LLM bên thứ ba (Gemini API hoặc OpenRouter) gặp lỗi 429 Quota Exceeded hoặc connection timeout.
- **AI Service Behavior**:
  - Dịch vụ trả về mã lỗi `HTTP 504 Gateway Timeout` hoặc tự động chuyển hướng sang bộ benchmark QA-21 nếu được kích hoạt cờ fallback.
  - Phản hồi lỗi chuẩn hóa:
    ```json
    {
      "error": "AI_PROCESSING_TIMEOUT",
      "message": "Dịch vụ AI phản hồi chậm hoặc gián đoạn kết nối.",
      "submissionModuleId": 15
    }
    ```
- **Core Backend Behavior**:
  - Thread `@Async("gradingAiExecutor")` bắt ngoại lệ `RestClientResponseException`.
  - Cập nhật bản ghi `gradings.status = FAILED`.
  - Hệ thống bảo toàn nội dung bài làm của học sinh trong bảng `answers`. Giáo viên có thể truy cập phân hệ chấm thủ công (UC24) để chấm điểm trực tiếp cho học sinh mà không bị gián đoạn hệ thống.

---

### TC-WRITING-05: Direct Document Upload (.txt, .docx, .pdf, .md)
- **Method**: `POST`
- **URL**: `http://localhost:8001/api/v1/analyze/writing/upload`
- **Headers**: `Content-Type: multipart/form-data`
- **Form Data**:
  - `file`: Chọn tệp bài viết từ máy tính (`my_essay.docx`, `essay.pdf`, hoặc `essay.txt`).
  - `submissionModuleId`: `15`
  - `moduleInstructions`: *"Some people believe that unpaid community service should be compulsory in high school..."* (tùy chọn)
  - `maxScore`: `9.0`
- **Expected Status**: `200 OK`
- **Expected Behavior**: Hệ thống tự động trích xuất nội dung văn bản từ tệp, tính toán chỉ số ngôn ngữ học và trả về bảng điểm chi tiết kèm annotations lỗi.

---

## 4. Core Backend Integration (Spring Boot)

### 4.1. Core Workflow
1. Giáo viên kích hoạt phân tích AI cho bài viết học sinh qua endpoint:
   - **Method**: `POST`
   - **URL**: `http://localhost:8080/api/v1/submission-modules/{submissionModuleId}/grading/ai-analyze`
   - **Response**: `202 Accepted` - `{"message": "Đã gửi yêu cầu phân tích, vui lòng chờ."}`
2. `GradingAiAnalysisServiceImpl` xử lý bất đồng bộ trên thread pool `gradingAiExecutor`:
   - Xác định `context.moduleSkill() == ModuleSkill.WRITING`.
   - **Kịch bản văn bản nhập trực tiếp**: Lấy `answer.getContent()` và gọi `AiServiceClient.analyzeWriting(request)` (`POST /api/v1/analyze/writing`).
   - **Kịch bản tệp tài liệu đính kèm**: Lấy `answer.getDocStorageKey()`, tải file từ MinIO/S3 qua `StorageService` và gọi `AiServiceClient.analyzeWritingUpload(...)` (`POST /api/v1/analyze/writing/upload`).
3. Cập nhật kết quả:
   - Cập nhật điểm `finalScore`, nhận xét `aiFeedback`, và lưu toàn bộ `criteriaScores` + `textMetrics` vào cột `ai_transcript` (JSONB).
   - Lưu các chú thích lỗi ngữ pháp/từ vựng vào bảng `answer_annotations` với nguồn `AnnotationSource.AI` và trạng thái `PENDING`.
   - Chuyển `gradings.status = AI_GRADED`.
4. Cơ chế dự phòng khi lỗi bên thứ ba (PP 6.5.2):
   - Nếu dịch vụ AI timeout (504) hoặc mất kết nối, hệ thống cập nhật `gradings.status = FAILED`, ghi log cảnh báo và bảo toàn bài nộp để giáo viên chấm tay thủ công (UC24).

### 4.2. Automated Testing Commands
Chạy kiểm thử tích hợp trên Core Backend:
```bash
cd backend
./gradlew test --tests "com.english_hub.core.modules.grading.infrastructure.service.GradingAiAnalysisServiceImplTest" \
               --tests "com.english_hub.core.modules.grading.infrastructure.client.AiServiceClientTest"
```
**Kết quả mong đợi:** `BUILD SUCCESSFUL`, 100% tests pass (cả kịch bản chấm bài văn bản, tệp tài liệu và kịch bản lỗi fallback).


