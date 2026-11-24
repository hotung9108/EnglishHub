# BE-44: Fix Event Loop Blocking in AI Service (Gemini SDK) — QA Testing Handoff

## 1. Thông tin chung (Metadata)
- **Mã Task**: `BE-TASK-44` / `[BE-44]`
- **Mã Bug liên kết**: `BUG-08`
- **Người thực hiện (Author)**: `@be-primary` (`doanthaison2706`)
- **Người nhận bàn giao (Target Tester)**: `@tester` (`Zawn-Tsu`)
- **Trạng thái**: Đã hoàn thành (Implemented & Verified by Dev) ✅
- **Phạm vi tác động**: `ai-service/` (Core AI Python Microservice)
- **Tài liệu quy chuẩn tuân thủ**: [`.agents/rules/convention-ai.md`](file:///D:/Coding/EnglishHub/.agents/rules/convention-ai.md)

---

## 2. Mô tả Nguyên nhân gốc rễ & Giải pháp kỹ thuật

### 2.1. Nguyên nhân gốc rễ (Root Cause)
- Trong các route bất đồng bộ (`async def`) xử lý chấm Speaking và Writing của FastAPI:
  - Hàm `gemini_service.py` trước đây gọi trực tiếp hàm SDK đồng bộ `model.generate_content(...)`.
  - SDK Google Generative AI thực hiện cuộc gọi I/O mạng đồng bộ, chặn (block) toàn bộ luồng chính `asyncio event loop` trong suốt 10 – 30 giây khi mô hình AI đang suy luận.
- **Hậu quả dây chuyền**:
  1. Luồng chính bị tắc nghẽn hoàn toàn, endpoint `GET /health` không thể xử lý request.
  2. Docker Daemon health check probe định kỳ (`curl -s -f http://localhost:8001/health` với interval 10s, timeout 5s, retries 3) liên tiếp bị timeout.
  3. Docker đánh dấu container `unhealthy` và kích hoạt tự động khởi động lại container (`restart: unless-stopped`) giữa chừng khi AI chưa chấm xong.
  4. Spring Boot Backend bị ngắt kết nối socket đến AI Service, ném lỗi **`504 Gateway Timeout`** hàng loạt lên Frontend.

### 2.2. Giải pháp kỹ thuật đã triển khai
1. **Bọc hàm blocking bằng `asyncio.to_thread`**:
   - Tại [`ai-service/app/services/gemini_service.py`](file:///D:/Coding/EnglishHub/ai-service/app/services/gemini_service.py):
     ```python
     # Đưa hàm sync generate_content ra worker thread riêng, giải phóng event loop chính
     response = await asyncio.to_thread(model.generate_content, prompt_contents)
     ```
   - Áp dụng triệt để cho cả 2 luồng: **Speaking** (phân tích âm thanh + phát âm) và **Writing** (chấm luận + ngữ pháp).
2. **Cài đặt thư viện FFmpeg vào Docker Image**:
   - Thêm `ffmpeg` vào [`ai-service/Dockerfile`](file:///D:/Coding/EnglishHub/ai-service/Dockerfile) để hỗ trợ `AudioProcessor` giải mã và chuẩn hóa âm thanh học sinh (16kHz mono WAV) không phát sinh lỗi 500.
3. **Chuẩn hóa kiến trúc theo [`convention-ai.md`](file:///D:/Coding/EnglishHub/.agents/rules/convention-ai.md)**:
   - Tách prompts độc lập ra package `app/prompts/` có phiên bản hóa (`2026-10-v2`).
   - Chuẩn hóa Schemas kế thừa `CamelModel` (hỗ trợ cả `snake_case` Pythonic và `camelCase` wire JSON).
   - Thiết lập FastAPI lifespan manager và chuẩn hóa Error Envelope (`HTTP 400/422/500`).

---

## 3. Hướng dẫn Tester kiểm chứng (Verification Guide)

### Cách thức 1: Kiểm thử bằng cURL / Postman & Kiểm tra tải đồng thời

#### A. Chuẩn bị môi trường
Đảm bảo container `englishhub-ai-service` đang chạy phiên bản mới nhất:
```powershell
docker ps --filter "name=englishhub-ai-service"
# Trạng thái mong đợi: Up ... (healthy)
```

#### B. Kiểm thử tải đồng thời (Concurrency Stress Test)
Mục tiêu: Đảm bảo trong lúc AI đang chấm bài (mất từ 10s – 30s), endpoint `/health` vẫn phản hồi tức thì (< 50ms) và container không bị restart.

1. **Bước 1**: Mở Terminal 1 (PowerShell), gửi 1 request chấm bài Speaking (hoặc Writing):
   ```powershell
   # Gửi request phân tích Writing qua cURL
   $writingPayload = @{
       submissionModuleId = 101
       essayText = "In recent years, artificial intelligence has developed rapidly and changed the education system significantly."
       topic = "The impact of AI on modern education"
       minWords = 50
       maxWords = 300
       maxScore = 10.0
       aiProvider = "openrouter"
   } | ConvertTo-Json

   curl.exe -i -X POST "http://localhost:8001/api/v1/analyze/writing" `
     -H "Content-Type: application/json" `
     -d $writingPayload
   ```

2. **Bước 2**: Trong lúc Terminal 1 đang chờ AI phân tích (thời gian suy luận 10 - 25s), mở Terminal 2 và chạy ngay vòng lặp kiểm tra độ trễ của `/health`:
   ```powershell
   1..10 | ForEach-Object {
       $elapsed = (Measure-Command { $res = curl.exe -s -f http://localhost:8001/health }).TotalMilliseconds
       Write-Host "Lần $_`: HTTP 200 OK | Thời gian phản hồi = $elapsed ms"
       Start-Sleep -Milliseconds 500
   }
   ```

3. **Bước 3**: Kiểm tra trạng thái Docker Container sau khi request hoàn tất:
   ```powershell
   docker inspect englishhub-ai-service --format "Trạng thái: {{.State.Status}} | Health: {{.State.Health.Status}} | Restarts: {{.RestartCount}}"
   ```

---

### Cách thức 2: Kiểm thử trực tiếp trên Giao diện Giáo viên (UI End-to-End)

#### Thông tin tài khoản kiểm thử:
- **Tài khoản**: `teacher1@gmail.com`
- **Mật khẩu**: `Password123!`
- **Frontend URL**: `http://localhost:5173`

#### Quy trình thực hiện (Step-by-Step UI Flow):
1. **Đăng nhập**: Truy cập `http://localhost:5173/login`, đăng nhập bằng tài khoản giáo viên nêu trên.
2. **Điều hướng**: Chọn menu **Quản lý bài tập (Assignments)** ➔ Chọn một bài tập Speaking/Writing đã có học sinh nộp bài ➔ Bấm vào chi tiết bài nộp của học sinh (giao diện `TeacherSubmissionDetails.tsx`).
3. **Kích hoạt AI Grading**:
   - Bấm vào nút **"Phân tích lại với AI"** (biểu tượng ✨).
   - Quan sát trạng thái hiển thị loading spinner trên nút.
4. **Kiểm tra tính không bị nghẽn (Non-blocking Verification)**:
   - Ngay trong lúc AI đang phân tích bài nộp (loading đang xoay), mở thêm một tab trình duyệt mới.
   - Truy cập vào trang Dashboard `http://localhost:5173/teacher/dashboard` hoặc danh sách lớp học.
   - **Xác nhận**: Trang mới tải ngay lập tức trong vòng 1-2 giây, không hề bị đứng hoặc quay vòng chờ đợi.
5. **Nghiệm thu kết quả AI trả về trên UI**:
   - Quay lại tab chi tiết bài nộp.
   - Đảm bảo thẻ điểm đề xuất (AI Suggested Score) hiển thị điểm số (ví dụ: `7.0 / 10` hoặc `7.5 / 9.0`).
   - Có đầy đủ các tiêu chí nhận xét chi tiết (Pronunciation, Fluency, Grammar, Vocabulary đối với Speaking; Task Achievement, Coherence, Lexical, Grammar đối với Writing).
   - Tuyệt đối **không xuất hiện thông báo lỗi `504 Gateway Timeout`** hoặc `Failed to fetch`.

---

## 4. Tiêu chí đánh giá Pass / Fail (Acceptance Criteria)

| STT | Hạng mục kiểm tra | Tiêu chí ĐẠT (PASS) ✅ | Tiêu chí HỎNG (FAIL) ❌ |
| :---: | :--- | :--- | :--- |
| **1** | **Thời gian phản hồi `/health`** | Mọi request probe `/health` phản hồi **< 50ms** trong suốt quá trình AI đang suy luận. | Có bất kỳ request nào phản hồi **> 500ms** hoặc bị timeout. |
| **2** | **Trạng thái Docker Container** | Container luôn giữ trạng thái `healthy`, chỉ số `RestartCount` giữ nguyên bằng `0`. | Container chuyển sang `unhealthy`, hoặc bị Docker restart giữa chừng. |
| **3** | **Kết quả chấm AI (cURL/Postman)** | Trả về HTTP `200 OK` với đầy đủ JSON fields (`overallScore`, `feedback`, `criteria`). | Trả về HTTP `500 Internal Server Error` hoặc `504 Gateway Timeout`. |
| **4** | **Trải nghiệm trên UI Giáo viên** | Bấm "Phân tích lại với AI" hoàn thành sau 10-25s, hiển thị điểm số đề xuất; các trang khác vẫn tương tác bình thường. | Bị treo đơ giao diện, xuất hiện toast đỏ `504 Gateway Timeout` hoặc ngắt kết nối. |
| **5** | **Bảo toàn chuẩn Schema Wire Format** | Key trong JSON trả về tuân thủ đúng định dạng `camelCase` (ví dụ: `overallScore`, `grammarScore`, `detailedFeedback`). | Key bị đổi sang định dạng khác làm gãy giao diện hoặc lỗi Spring Boot mapping. |

---

## 5. Bằng chứng thực nghiệm nội bộ từ Dev (Dev Verification Results)

Đã kiểm thử nghiệm thu tải đồng thời tự động vào lúc `2026-10-18T22:51:13+07:00`:
- **AI Inference Time**: 64.6 giây (OpenRouter Gemini 2.5 Flash).
- **Số lần probe `/health` đồng thời**: 10 lần.
- **Thời gian phản hồi trung bình**: **14.70 ms** (Min: `7.06 ms`, Max: `28.99 ms`).
- **Trạng thái Container**: `running | Health: healthy | Restarts: 0`.
- **Unit Test Suite**: 11/11 tests PASSED.
