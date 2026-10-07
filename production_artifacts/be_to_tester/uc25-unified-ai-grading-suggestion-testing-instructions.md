# UC25: Unified AI Grading & Suggestion API Testing Instructions

## 1. Overview & Architecture
This document provides testing instructions for `@tester` and developers to validate **UC25: Unified AI Grading & Suggestion API**.
The endpoint aggregates and unifies results from both AI pipelines:
- **[BE-22] Speaking AI Pipeline (UC26)**: Transcripts, word timestamps, fluency metrics (`wordsPerMinute`, `pauseCount`, etc.), and 4-criteria IELTS speaking scores (`fluencyAndCoherence`, `lexicalResource`, `grammaticalRangeAndAccuracy`, `pronunciation`).
- **[BE-23] Writing AI Pipeline (UC27)**: Essay analysis, quantitative text metrics (`wordCount`, `sentenceCount`, `lexicalDiversity`, `fleschKincaidGrade`), character offset annotations, and 4-criteria IELTS writing scores (`taskResponse`, `coherenceAndCohesion`, `lexicalResource`, `grammaticalRangeAndAccuracy`).
- **[BE-19] Core Grading Integration**: Linked directly to `gradings`, `answers`, and `answer_annotations` tables, providing seamless teacher review, feedback drafting, and **fallback to manual grading when AI is unavailable or timed out** (**PP R6 / PP 6.5.2**).

---

## 2. API Contract Specification

### Unified Endpoint: `GET /api/v1/submission-modules/{id}/grading/ai-suggestion`
- **Method**: `GET`
- **Path**: `/api/v1/submission-modules/{id}/grading/ai-suggestion`
- **Role**: Teacher (classroom owner) or Admin (or Student owner after grading)
- **Response Model**: `AiGradingSuggestionResponse`

```json
{
  "submissionModuleId": 14,
  "gradingId": 5,
  "skill": "SPEAKING",
  "status": "AI_GRADED",
  "suggestedScore": 7.0,
  "maxScore": 9.0,
  "aiFeedback": "### Đánh giá Tổng quan Kỹ năng Nói (IELTS Speaking)\n...",
  "criteriaScores": {
    "fluencyAndCoherence": 7.0,
    "lexicalResource": 7.0,
    "grammaticalRangeAndAccuracy": 7.0,
    "pronunciation": 7.0,
    "overallScore": 7.0
  },
  "metrics": {
    "wordsPerMinute": 120.0,
    "pauseCount": 3,
    "totalDurationSeconds": 45.0,
    "phonationTimeRatio": 0.85
  },
  "annotations": [
    {
      "id": 101,
      "answerId": 77,
      "source": "AI",
      "startOffset": 10,
      "endOffset": 16,
      "errorType": "pronunciation",
      "comment": "Lỗi phát âm đuôi /s/",
      "suggestedFix": "focus",
      "reviewStatus": "PENDING"
    }
  ],
  "transcript": [
    { "word": "Today", "start": 0.0, "end": 0.42, "confidence": 0.98 },
    { "word": "I", "start": 0.45, "end": 0.60, "confidence": 0.99 }
  ],
  "modelUsed": "benchmark/qa-21-deterministic",
  "providerUsed": "mock",
  "canTriggerAi": false,
  "fallbackManualGradingAvailable": true,
  "fallbackMessage": "AI đã hoàn tất gợi ý chấm điểm. Giáo viên có thể duyệt gợi ý hoặc chỉnh sửa lại điểm số và nhận xét trước khi lưu chính thức."
}
```

---

## 3. Automated Test Verification

### 3.1. Spring Boot Backend Tests
Execute in `backend/`:
```bash
./gradlew test --tests "com.english_hub.core.modules.grading.application.service.GradingServiceTest" \
               --tests "com.english_hub.core.modules.grading.presentation.rest.GradingControllerMockMvcTest" \
               --tests "com.english_hub.core.modules.grading.infrastructure.service.GradingAiAnalysisServiceImplTest"
```
**Expected Result**: `BUILD SUCCESSFUL`, all unit, controller, and service tests pass 100%.

### 3.2. Frontend Client Unit Tests
Execute in `frontend/`:
```bash
npm test src/api/__tests__/grading.service.test.ts
```
**Expected Result**: All tests pass (`ok - GradingService #49b - GET AI suggestion for submission module (UC25)`).

---

## 4. Manual Postman / cURL Test Cases

### TC-AI-SUGGEST-01: Valid Speaking AI Suggestion (Aggregated Pipeline)
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/v1/submission-modules/14/grading/ai-suggestion`
- **Headers**:
  - `Authorization: Bearer <TEACHER_JWT>`
- **Expected Status**: `200 OK`
- **Verification Points**:
  - `skill == "SPEAKING"`
  - `suggestedScore` contains AI overall score (e.g. `7.0`)
  - `criteriaScores` contains 4 IELTS speaking criteria (`fluencyAndCoherence`, `lexicalResource`, `grammaticalRangeAndAccuracy`, `pronunciation`)
  - `metrics` contains fluency metrics (`wordsPerMinute`, `pauseCount`, `totalDurationSeconds`, `phonationTimeRatio`)
  - `transcript` contains word timestamps array
  - `fallbackManualGradingAvailable == true`

---

### TC-AI-SUGGEST-02: Valid Writing AI Suggestion (Aggregated Pipeline)
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/v1/submission-modules/15/grading/ai-suggestion`
- **Headers**:
  - `Authorization: Bearer <TEACHER_JWT>`
- **Expected Status**: `200 OK`
- **Verification Points**:
  - `skill == "WRITING"`
  - `suggestedScore` contains AI overall score (e.g. `6.5`)
  - `criteriaScores` contains 4 IELTS writing criteria (`taskResponse`, `coherenceAndCohesion`, `lexicalResource`, `grammaticalRangeAndAccuracy`)
  - `metrics` contains text metrics (`wordCount`, `sentenceCount`, `averageSentenceLength`, `lexicalDiversity`, `fleschKincaidGrade`)
  - `annotations` contains character offset annotations list with `startOffset`, `endOffset`, `errorType`, `comment`, `suggestedFix`
  - `fallbackManualGradingAvailable == true`

---

### TC-AI-SUGGEST-03: AI Pipeline Error / Timeout Fallback Handling (PP R6 & PP 6.5.2)
- **Scenario**: Third-party LLM is unreachable or timed out during evaluation.
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/v1/submission-modules/16/grading/ai-suggestion`
- **Headers**:
  - `Authorization: Bearer <TEACHER_JWT>`
- **Expected Status**: `200 OK`
- **Expected Response Payload**:
```json
{
  "submissionModuleId": 16,
  "gradingId": 8,
  "skill": "WRITING",
  "status": "FAILED",
  "suggestedScore": null,
  "maxScore": 9.0,
  "aiFeedback": null,
  "criteriaScores": null,
  "metrics": null,
  "annotations": [],
  "transcript": null,
  "modelUsed": null,
  "providerUsed": null,
  "canTriggerAi": true,
  "fallbackManualGradingAvailable": true,
  "fallbackMessage": "AI phân tích gặp lỗi hoặc quá thời gian chờ (timeout). Giáo viên có thể thử lại bằng nút 'Phân tích lại' hoặc thực hiện chấm thủ công theo cơ chế dự phòng PP R6 (gọi PUT /api/v1/gradings/8)."
}
```
- **Verification Points**:
  - Service does not throw 500 internal server error.
  - `status == "FAILED"`
  - `canTriggerAi == true` allows teacher to retry AI analysis.
  - `fallbackManualGradingAvailable == true` enables immediate fallback to teacher manual grading.

---

### TC-AI-SUGGEST-04: Manual Grading Fallback Execution (PP R6 Compliance)
- **Scenario**: When AI is failed or pending, the teacher immediately grades the submission manually via the core grading API without being blocked.
- **Method**: `PUT`
- **URL**: `http://localhost:8080/api/v1/gradings/8`
- **Headers**:
  - `Authorization: Bearer <TEACHER_JWT>`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "finalScore": 7.5,
  "finalFeedback": "Bài viết phát triển ý tốt, giáo viên đã chấm thủ công do AI pipeline gặp timeout.",
  "note": "Chấm thủ công theo cơ chế fallback PP R6"
}
```
- **Expected Status**: `200 OK`
- **Follow-up Verification**:
  - Calling `GET /api/v1/submission-modules/16/grading/ai-suggestion` returns `status: "COMPLETED"`, `suggestedScore: 7.5`, and fallback message indicating grading is finalized.

---

### TC-AI-SUGGEST-05: Non-AI Skill Rejection
- **Scenario**: Calling `ai-suggestion` on a module that is Listening or Reading.
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/v1/submission-modules/10/grading/ai-suggestion`
- **Expected Status**: `400 Bad Request`
- **Response**:
```json
{
  "error": "Gợi ý chấm AI chỉ hỗ trợ cho kỹ năng Nói (Speaking) và Viết (Writing)."
}
```

---

### TC-AI-SUGGEST-06: Authorization Protection
- **Scenario**: Teacher from Class B attempts to access submission module grading from Class A.
- **Method**: `GET`
- **URL**: `http://localhost:8080/api/v1/submission-modules/14/grading/ai-suggestion`
- **Headers**:
  - `Authorization: Bearer <UNAUTHORIZED_TEACHER_JWT>`
- **Expected Status**: `403 Forbidden`
- **Response**:
```json
{
  "error": "Bạn không có quyền thực hiện thao tác này."
}
```

---

## 5. Definition of Done (DoD) Checklist
- [x] Gộp đúng kết quả từ 2 pipeline (Speaking & Writing) thành một API duy nhất, không đánh giá độ chính xác học thuật tuyệt đối (theo TP mục 2.6.2).
- [x] Đầy đủ kịch bản kiểm thử: pipeline lỗi (`FAILED`), timeout, kết quả hợp lệ cho Speaking và Writing.
- [x] Cơ chế fallback cho giáo viên chấm thủ công khi AI không khả dụng hoạt động trơn tru (theo PP R6 / PP 6.5.2).
- [x] 100% automated unit and presentation tests passing trên cả Spring Boot backend và React frontend client.
