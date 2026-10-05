# UC26: Speaking AI Grading Pipeline Testing Instructions

## 1. Overview & Architecture
This document guides `@tester` and developers on validating the **UC26 Speaking AI Grading Pipeline** across the decoupled microservices:
1. **AI Microservice (`ai-service/`)**: Standalone FastAPI service running on port `8001` with Gemini Flash Multimodal evaluation, QA-21 deterministic benchmark fallback, word-level timestamp extraction, fluency metrics computation, and rubric scoring.
2. **Core Backend (`backend/`)**: Spring Boot DDD service running on port `8080` handling business workflows, persistence in PostgreSQL (JSONB `ai_transcript`), S3 presigned URL generation, and fallback handling (PP 6.5.2).

---

## 2. Environment Preparation

### Option A: Running via Docker Compose (Recommended)
```bash
# Start all services (PostgreSQL, MinIO, AI Service, Backend)
docker compose -f docker-compose.dev.yml up --build -d
```

### Option B: Running Locally
1. **AI Microservice**:
```bash
cd ai-service
# (Optional: python -m venv .venv && source .venv/bin/activate)
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
2. **Core Backend**:
```bash
cd backend
./gradlew bootRun
```

---

## 3. Automated Test Verification

### 3.1. Python AI Service Tests
Execute in `ai-service/`:
```bash
python tests/test_runner.py
```
**Expected Result**:
- `test_health_check`: HTTP 200 `{"status": "healthy"}`
- `test_analyze_speaking_mock_benchmark`: HTTP 200, valid `aiTranscript` format, fluency metrics, criteria scores (overallScore 7.0), and pronunciation annotations.
- `test_analyze_speaking_validation_error`: HTTP 400 Bad Request when missing audio source.
- Result: **3 tests PASSED**.

### 3.2. Spring Boot Core Backend Tests
Execute in `backend/`:
```bash
./gradlew test --tests "com.english_hub.core.modules.grading.application.service.GradingServiceTest" \
               --tests "com.english_hub.core.modules.grading.infrastructure.service.GradingAiAnalysisServiceImplTest" \
               --tests "com.english_hub.core.modules.grading.infrastructure.client.AiServiceClientTest"
```
**Expected Result**: **BUILD SUCCESSFUL**, all unit and mock tests pass.

---

## 4. Manual Postman / cURL Test Cases

### TC-AI-01: AI Service Health Check
- **Method**: `GET`
- **URL**: `http://localhost:8001/health`
- **Expected Response**:
```json
{
  "status": "healthy",
  "app": "EnglishHub-AI-Service",
  "version": "1.0.0",
  "geminiConfigured": false
}
```

---

### TC-AI-02: Direct AI Service Benchmark Evaluation (QA-21 Reference Audio)
- **Method**: `POST`
- **URL**: `http://localhost:8001/api/v1/analyze/speaking`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "submissionModuleId": 14,
  "audioUrl": "https://storage.englishhub.io/submissions/14/audio.wav",
  "maxScore": 9.0
}
```
- **Expected Status**: `200 OK`
- **Expected Response Schema**:
```json
{
  "submissionModuleId": 14,
  "overallScore": 7.0,
  "aiFeedback": "The candidate demonstrates good fluency with a natural speech rate (120 WPM)...",
  "aiTranscript": [
    { "word": "Today", "start": 0.0, "end": 0.42, "confidence": 0.98 },
    { "word": "I", "start": 0.45, "end": 0.60, "confidence": 0.99 },
    { "word": "would", "start": 0.62, "end": 0.85, "confidence": 0.97 },
    { "word": "like", "start": 0.88, "end": 1.15, "confidence": 0.98 }
  ],
  "fluencyMetrics": {
    "wordsPerMinute": 120.0,
    "pauseCount": 4,
    "totalDurationSeconds": 45.0,
    "phonationTimeRatio": 0.76
  },
  "criteriaScores": {
    "fluencyAndCoherence": 7.0,
    "lexicalResource": 7.0,
    "grammaticalRangeAndAccuracy": 7.0,
    "pronunciation": 7.0,
    "overallScore": 7.0
  },
  "annotations": [
    {
      "startOffset": 155,
      "endOffset": 161,
      "errorType": "pronunciation",
      "comment": "Mispronounced 'habits' with incorrect vowel length.",
      "suggestedFix": "/ˈhæb.ɪts/"
    }
  ]
}
```

---

### TC-AI-03: Core Backend Trigger AI Analysis
- **Method**: `POST`
- **URL**: `http://localhost:8080/api/v1/submission-modules/14/grading/ai-analyze`
- **Headers**:
  - `Authorization: Bearer <TEACHER_JWT_TOKEN>`
- **Expected Status**: `202 Accepted`
- **Expected Response**:
```json
{
  "message": "Đã gửi yêu cầu phân tích, vui lòng chờ."
}
```
- **Verification**:
  - Poll `GET http://localhost:8080/api/v1/submission-modules/14/grading`.
  - Status updates from `PENDING` -> `AI_GRADED`.
  - `finalScore` is populated (e.g. `7.00`).
  - Annotations populated under `GET http://localhost:8080/api/v1/answers/{answerId}/annotations`.

---

### TC-AI-04: Fault Isolation & Fallback (PP Mục 6.5.2)
1. **Scenario**: AI Service is offline or returns error / timeout.
   - Stop `ai-service` container or configure an unreachable URL `AI_SERVICE_BASE_URL=http://localhost:9999`.
2. **Trigger**:
   - `POST http://localhost:8080/api/v1/submission-modules/14/grading/ai-analyze`
3. **Expected Behavior**:
   - Backend retries with exponential backoff (2 attempts).
   - Backend catches the timeout/connection error, logs error, and updates grading status:
     `gradings.status = FAILED`.
   - The user/teacher request is not blocked or crashing.
4. **Teacher Fallback Actions**:
   - **Action 1 (Retry)**: Once AI service is back up, teacher calls `POST /api/v1/submission-modules/14/grading/ai-analyze`. Status returns to `PENDING` and analysis succeeds.
   - **Action 2 (Manual Override)**: Teacher calls `PUT /api/v1/gradings/{id}`:
     ```json
     {
       "finalScore": 7.5,
       "finalFeedback": "Good presentation, manual review completed.",
       "note": "AI service was unreachable, graded manually per fallback PP 6.5.2."
     }
     ```
     Grading status becomes `COMPLETED` and `method = TEACHER_MANUAL`.

---

### TC-AI-05: Dynamic Model & Provider Selection via API Request (Option 1)
- **Overview**: Callers (Core Backend or API testers) can dynamically select the AI model and provider per request without restarting any service or modifying `.env`.
- **JSON Request with Custom Model & Provider**:
  - **Method**: `POST`
  - **URL**: `http://localhost:8001/api/v1/analyze/speaking`
  - **Body**:
    ```json
    {
      "submissionModuleId": 15,
      "audioBase64": "ID3...",
      "moduleInstructions": "Describe your favorite hobby.",
      "maxScore": 9.0,
      "model": "anthropic/claude-3.5-sonnet",
      "aiProvider": "openrouter"
    }
    ```
  - **Expected Status**: `200 OK`
  - **Expected Fields**:
    - `"modelUsed": "anthropic/claude-3.5-sonnet"`
    - `"providerUsed": "openrouter"` (or `"openrouter-mock"` in Mock mode)

- **Multipart Upload with Custom Model**:
  - **Method**: `POST`
  - **URL**: `http://localhost:8001/api/v1/analyze/speaking/upload`
  - **Form Data**:
    - `file`: `audio.mp3`
    - `submissionModuleId`: `16`
    - `model`: `google/gemini-1.5-pro`
    - `aiProvider`: `gemini`
  - **Expected Status**: `200 OK`
  - **Expected Fields**:
    - `"modelUsed": "google/gemini-1.5-pro"`
    - `"providerUsed": "gemini"` (or `"gemini-mock"` in Mock mode)

- **Backend Configuration**:
  - `application.properties`: `app.ai-service.model` (`${AI_SERVICE_MODEL:}`) & `app.ai-service.provider` (`${AI_SERVICE_PROVIDER:}`).
  - Automatically propagated via `AiSpeakingAnalysisRequest` record to AI Service.
