# BÁO CÁO TOÀN DIỆN VỀ DỰ ÁN ENGLISSHUB
## ĐỐI SOÁT TÀI LIỆU (SRS, PP, TP) VỚI THỰC TẾ CODEBASE & DANH MỤC TOÀN BỘ CÁC LỖI THẬT SỰ
### CHUYÊN SÂU: BACKEND (SPRING BOOT) • AI SERVICE (FASTAPI) • DEVOPS (DOCKER/CI-CD) • FRONTEND (REACT 19)

> **Ngày thực hiện**: 16/10/2026  
> **Phiên bản báo cáo**: 3.0 (Exhaustive Deep-Dive Audit)  
> **Phạm vi kiểm tra**: 100% Codebase (Backend Spring Boot 3.4, AI Service FastAPI, Frontend React 19, Database Flyway PostgreSQL, DevOps Docker/CI-CD, QA Test Suite) & 100% Tài liệu (`docs/core/`, `docs/api/`, `docs/devops/`, `.agents/tasks/`).

---

## MỤC LỤC
1. [Phán Quyết Tổng Quan & Mức Độ Thật Sự Của Dự Án (Executive Summary)](#1-phán-quyết-tổng-quan--mức-độ-thật-sự-của-dự-án)
2. [Đối Soát Chi Tiết Giữa Docs Và Codebase Thực Tế](#2-đối-soát-chi-tiết-giữa-docs-và-codebase-thực-tế)
   - 2.1. Soát với SRS (Software Requirements Specification - 01.SRS.md)
   - 2.2. Soát với Project Plan (02.PP.md)
   - 2.3. Soát với Test Plan (03.TP.md)
3. [Phân Tích Tiến Độ Thực Tế vs Kế Hoạch (Drift Analysis)](#3-phân-tích-tiến-độ-thực-tế-vs-kế-hoạch)
4. [Danh Mục Toàn Bộ 25 Lỗi Thật Sự (Exhaustive Bug Catalog)](#4-danh-mục-toàn-bộ-25-lỗi-thật-sự)
   - 4.1. Nhóm P0 - Lỗ Hổng Bảo Mật & Rủi Ro Dữ Liệu Nghiêm Trọng (Critical Security & Data Loss)
   - 4.2. Nhóm P0 - Tính Năng Trọng Yếu Bị Tắc Nghẽn / Làm Giả (Blocker Defects)
   - 4.3. Nhóm P1 - Lỗi Backend, Concurrency, AI Service & CI/CD (High Severity)
   - 4.4. Nhóm P2 - Lỗi Hiệu Năng, Giao Diện & Bất Cập Kiến Trúc (Medium Severity)
5. [Phân Tích Chuyên Sâu Từng Khối Hệ Thống](#5-phân-tích-chuyên-sâu-từng-khối-hệ-thống)
   - 5.1. Khối Backend (Spring Boot 3.4 & Flyway PostgreSQL)
   - 5.2. Khối AI Service (FastAPI & Gemini/OpenRouter Multimodal)
   - 5.3. Khối DevOps & Hạ Tầng Triển Khai (Docker, CI/CD, Storage, Cloudflare)
6. [Bảng Ma Trận Trách Nhiệm & Biện Pháp Khắc Phục Theo Role](#6-bảng-ma-trận-trách-nhiệm--biện-pháp-khắc-phục-theo-role)

---

## 1. PHÁN QUYẾT TỔNG QUAN & MỨC ĐỘ THẬT SỰ CỦA DỰ ÁN

### 1.1. Bức tranh đối lập giữa "Tài liệu / Báo cáo" và "Thực thi trong Code"
Dự án EnglishHub có cấu trúc kiến trúc tổng thể (Architecture) rất tốt: phân tầng DDD ở Backend, module hóa ở AI Service, và giao diện React 19 trau chuốt. Tuy nhiên, khi đi sâu vào kiểm tra **từng dòng mã (line-by-line verification)**, tồn tại sự **ngụy tạo tiến độ (illusion of completeness)** nghiêm trọng ở nhiều mắt xích:

1. **Bộ Test kiểm thử bị làm giả (Test Suite Fraud)**:
   - Toàn bộ thư mục `test/white-box/` chứa các test case chỉ gồm đúng 1 dòng lệnh: `assert.ok(true);`.
   - Kịch bản k6 `test/performance/scenarios/login-load.js` chỉ có đúng 1 lệnh `console.log("Mocking login load")`.
   - Các thư mục Selenium `test/selenium/tests/admin/`, `student/`, `teacher/` chỉ là các file rỗng `.gitkeep`.
   - Thư mục bug tracking `.agents/tasks/bugs/` hoàn toàn trống (0 bugs), trong khi dự án có 25 lỗi nghiêm trọng khiến hệ thống không thể đưa vào khai thác thực tế.
2. **Kỹ năng Nói (Speaking) hoàn toàn là kịch bản giả (Mock Illusion)**:
   - Màn hình học sinh làm bài thi Nói (`StudentAssignmentSpeaking.tsx`) không hề gọi `navigator.mediaDevices.getUserMedia()`, không ghi âm, không đẩy file lên S3, mà chỉ chạy một đồng hồ `setInterval` đếm ngược rồi nộp payload rỗng `{}` lên backend.
   - AI Service có thuật toán chấm Speaking bằng Gemini Flash Multimodal rất công phu, nhưng **vĩnh viễn không bao giờ được kích hoạt trên môi trường thật** vì Frontend không hề gửi dữ liệu âm thanh!
3. **Kỹ năng Nghe (Listening) mất hoàn toàn khả năng phát lại & Mất dữ liệu khi restart container**:
   - Backend chỉ có endpoint upload audio từ giáo viên, nhưng **thiếu hoàn toàn endpoint GET / Stream audio** cho học sinh nghe.
   - File audio lưu vào thư mục local trong container, không mount volume, nên mỗi lần restart hoặc redeploy là **mất sạch dữ liệu**.
   - Khi học sinh tải câu hỏi trắc nghiệm, Backend loại bỏ trường `correctAnswer` để chống gian lận, nhưng vì Backend lưu nội dung các phương án A, B, C, D bên trong chính cột `correctAnswer`, học sinh bị **mất toàn bộ danh sách lựa chọn** và bị ép hiển thị fallback thành: `"Option A"`, `"Option B"`, `"Option C"`, `"Option D"`.
4. **Lỗ hổng bảo mật chết người (P0 Critical Security Vulnerabilities)**:
   - Endpoint Quên mật khẩu `POST /api/v1/auth/forgot-password` sinh mã OTP và **trả thẳng mã OTP về cho Client trong response HTTP** (`debugOtp`), cho phép chiếm quyền (Account Takeover) tài khoản Admin hoặc Giáo viên.
   - AI Service mở Port 8001 ra ngoài Internet qua Docker mà **không có bất kỳ cơ chế xác thực nào (No Auth)**, cho phép bên ngoài lạm dụng làm proxy AI miễn phí.
   - Bucket MinIO trong môi trường dev được cấu hình `anonymous set download`, lộ toàn bộ bài làm và file ghi âm của học sinh ra Internet.

---

## 2. ĐỐI SOÁT CHI TIẾT GIỮA DOCS VÀ CODEBASE THỰC TẾ

### 2.1. Soát với SRS (`docs/core/01.SRS.md`)

| Mục trong SRS | Cam kết tài liệu | Thực tế trong Codebase | Đánh giá & Sai lệch |
| :--- | :--- | :--- | :--- |
| **Chương 3: Chi tiết Use Cases** | Liệt kê 36 Use Cases (UC01 đến UC36) | Toàn bộ dòng 385–456 trong `01.SRS.md` chỉ là các tiêu đề rỗng (`### UC01...`), không có mô tả luồng, precondition hay postcondition | **Bị bỏ dở 100%**: Task `PM-TASK-2` bị bỏ quên ở trạng thái `To Do`. |
| **Số lượng Use Cases** | Bảng tổng quan ghi **35 UCs** | Bảng PP ghi **33 UCs**, Test Plan ghi **36 UCs** | **Bất nhất tài liệu**: 3 tài liệu quan trọng nhất không thống nhất số lượng ca sử dụng. |
| **UC09: Quản lý học sinh trong lớp** | Giáo viên có quyền thêm/xóa học sinh vào lớp học của mình | `ApiRoutePolicy.java` (L47) cấu hình `POST /api/v1/classes/{id}/members` chỉ cho phép role `ADMIN` | **Code vi phạm SRS**: Giáo viên thao tác trên UI sẽ bị lỗi `403 Forbidden`. |
| **UC25 & UC26: Chấm điểm Speaking & Writing** | Giáo viên xem chi tiết gợi ý AI, duyệt/từ chối từng annotation | `TeacherSubmissionDetails.tsx` không hề gọi `answerAnnotationService`. Giáo viên không thể tương tác với annotations | **Tính năng thiếu**: Chỉ hiển thị điểm thô, không duyệt được từng sửa đổi của AI. |
| **UC19: Nộp bài thi Nói** | Học sinh thu âm bài nói, upload audio lên lưu trữ | `StudentAssignmentSpeaking.tsx` nộp payload rỗng, không ghi âm thực | **Làm giả giao diện (Sham UI)**. |
| **UC21: Nộp bài thi Viết** | Cho phép gõ trực tiếp hoặc đính kèm tài liệu Word/PDF | `StudentAssignmentWriting.tsx` nhận file kéo thả nhưng khi nhấn nộp bài thì bỏ qua file | **Tính năng bị cụt**. |
| **UC18: Đóng/mở bài thi theo hạn** | Chặn nộp bài khi quá hạn `closeAt` | `SubmissionService.java` chỉ kiểm tra hạn lúc `startAttempt`, không kiểm tra lúc `submitModule` | **Lỗ hổng gian lận**: Học sinh mở đề trước hạn có thể nộp bài muộn nhiều ngày. |

### 2.2. Soát với Project Plan (`docs/core/02.PP.md`)
- **Trạng thái Sprint 5 & 6 theo kế hoạch**: Đáng lẽ phải hoàn tất tích hợp End-to-End AI Service, nộp bài Speaking/Listening và kiểm thử hồi quy.
- **Thực tế**:
  1. Frontend chỉ mới hoàn thiện lớp vỏ ngoài (Look & Feel), chưa kết nối luồng I/O đa phương tiện (Audio Stream & Recording).
  2. Test Suite tự động bị làm giả để đạt chỉ số báo cáo "Pass 100%".
  3. DoD (Definition of Done) quy định "Unit tests code coverage > 80%": Frontend hoàn toàn không có test component nào (0 Vitest/RTL tests), chỉ có 91 test đơn vị tầng API service.

### 2.3. Soát với Test Plan (`docs/core/03.TP.md`)
- **Mục tiêu TP đề ra**:
  - Kiểm thử chức năng toàn diện 36 UCs bằng Selenium.
  - Kiểm thử hộp trắng (White-box) độ phủ C1/C2 (nhánh, điều kiện).
  - Kiểm thử hiệu năng (k6/JMeter) đạt 500 CCU, P95 < 2.0s.
  - Lưu trữ tài liệu test case tại `docs/testing/`.
- **Thực tế kiểm tra đối chiếu**:
  - Thư mục `docs/testing/`: **Không tồn tại**.
  - Thư mục `test/selenium/tests/admin/`, `student/`, `teacher/`: **Chỉ có file `.gitkeep` rỗng**.
  - File `test/white-box/whitebox.test.js` & `integration.test.js`: **Toàn bộ nội dung là `assert.ok(true);`**.
  - File `test/performance/scenarios/login-load.js`: **Chỉ có lệnh `console.log("Mocking login load")`**.
  - Thư mục `.agents/tasks/bugs/`: **0 file bug**. QA Tester hoàn toàn bỏ qua việc báo cáo lỗi.

---

## 3. PHÂN TÍCH TIẾN ĐỘ THỰC TẾ VS KẾ HOẠCH

```mermaid
pie title Thực trạng hoàn thiện tính năng EnglishHub
    "Hoàn thành thật sự (Auth, CRUD, Class, Basic DB)" : 46
    "Giao diện Mock / Chưa kết nối thật (Speaking, Audio, Doc Upload)" : 22
    "Lỗ hổng Backend / Lệch Schema / Logic Concurrency" : 18
    "Test Suite giả mạo & Lỗi Hạ tầng DevOps" : 14
```

- **Mức độ sẵn sàng sản phẩm (Production Readiness)**: **44%** (Mặc dù giao diện hiển thị tưởng chừng đã đạt 85%).
- **Trục trặc lớn nhất**: Sự thiếu đồng bộ giữa Backend (thiết kế theo hướng DDD chặt chẽ) và Frontend (lập trình viên FE dùng dữ liệu mock hoặc xử lý tắt để giao diện "chạy được" mà không gắn kết nối thật).

---

## 4. DANH MỤC TOÀN BỘ 25 LỖI THẬT SỰ (EXHAUSTIVE BUG CATALOG)

### 4.1. NHÓM P0 - LỖ HỔNG BẢO MẬT & RỦI RO DỮ LIỆU NGHIÊM TRỌNG (CRITICAL SECURITY & DATA LOSS)

#### BUG-01: Lộ mã OTP quên mật khẩu trong HTTP Response Body (Account Takeover)
- **Tệp tin**: `backend/src/main/java/com/english_hub/core/modules/auth/application/service/AuthService.java`
- **Vị trí**: Dòng 231–245
- **Mã lỗi**:
  ```java
  String otp = otpGenerator.generateOtp();
  // ... lưu otp vào redis/db ...
  return new ForgotPasswordResponse("Mã OTP đã được gửi.", otp); // <-- debugOtp trả thẳng về client
  ```
- **Tác động**: Bất kỳ ai cũng có thể gửi request quên mật khẩu cho email của Quản trị viên (`admin@englishhub.com`) và nhận ngay mã OTP trong phản hồi HTTP để đổi mật khẩu và chiếm quyền quản trị.
- **Hệ thống thiếu hụt**: Không cấu hình dịch vụ gửi mail SMTP thực tế.

#### BUG-02: Nguy cơ mất trắng toàn bộ file Audio bài nghe khi container restart hoặc redeploy (Ephemeral Container Storage)
- **Tệp tin**:
  - `backend/src/main/java/com/english_hub/core/modules/module/infrastructure/storage/LocalAudioStorageAdapter.java` (Dòng 37–56)
  - `docker-compose.prod.yml` (Dòng 15–68)
- **Cơ chế lỗi**:
  - `LocalAudioStorageAdapter` lưu file audio nghe của bài tập vào thư mục local `./.local/backend-storage`.
  - Nhưng trong `docker-compose.prod.yml`, service `backend` **không hề mount volume nào** (chỉ có mạng `englishhub_network` và `englishhub_shared`).
- **Hệ quả**: Toàn bộ file âm thanh bài nghe do giáo viên upload nằm trong tầng ghi tạm (ephemeral write layer) của Docker container. Khi container restart hoặc CI/CD deploy image mới, **toàn bộ file audio nghe bị xóa sạch vĩnh viễn**, dẫn đến lỗi 404 cho học sinh.

#### BUG-03: AI Microservice mở Port 8001 ra ngoài Internet không có Authentication (No Auth AI Proxy)
- **Tệp tin**:
  - `ai-service/app/main.py`
  - `docker-compose.ai-service.yml` (Dòng 50–51)
- **Cơ chế lỗi**:
  - FastAPI không có bất kỳ middleware kiểm tra Bearer token hay `X-Internal-Secret` nào.
  - `docker-compose.ai-service.yml` ánh xạ cổng: `"${AI_SERVICE_PORT:-8001}:8001"`, bind trực tiếp vào `0.0.0.0` trên máy chủ host.
- **Hệ quả**: Bất kỳ ai trên Internet đều có thể gọi trực tiếp `POST http://<server-ip>:8001/api/v1/writing/analyze` hoặc `/api/v1/speaking/analyze` với văn bản tùy ý, đốt sạch tiền/quota tài khoản Gemini và OpenRouter của dự án, hoặc dùng máy chủ làm proxy LLM lậu.

#### BUG-04: Cấu hình MinIO môi trường Dev cấp quyền truy cập Anonymous Download
- **Tệp tin**: `docker-compose.dev.yml` (Dòng 118)
- **Mã lỗi**:
  ```yaml
  mc anonymous set download local/"$$MINIO_BUCKET"
  ```
- **Hệ quả**: Toàn bộ tài liệu bài viết (Word/PDF) và file âm thanh học sinh upload lên bucket `englishhub-dev` bị mở quyền tải công khai cho bất kỳ ai không cần đăng nhập.

---

### 4.2. NHÓM P0 - TÍNH NĂNG TRỌNG YẾU BỊ TẮC NGHẼN / LÀM GIẢ (BLOCKER DEFECTS)

#### BUG-05: Giao diện thi Nói (Speaking) 100% là giả lập, không ghi âm thực tế
- **Tệp tin**: `frontend/src/pages/StudentAssignmentSpeaking.tsx` (Dòng 125–160)
- **Chi tiết**: Không có `navigator.mediaDevices.getUserMedia()`, không có `MediaRecorder`, không lưu Blob. Hết giờ chỉ nộp payload rỗng `submitModule(moduleId, {})`. Luồng AI chấm Speaking của backend vĩnh viễn không nhận được dữ liệu.

#### BUG-06: Thiếu hoàn toàn Endpoint GET / Stream Audio bài nghe trên Backend
- **Tệp tin**:
  - `backend/src/main/java/com/english_hub/core/modules/module/presentation/rest/ModuleController.java`
  - `backend/src/main/java/com/english_hub/core/infrastructure/security/ApiRoutePolicy.java` (Dòng 105–121)
- **Cơ chế lỗi**:
  - `ModuleController` chỉ có `POST /modules/{id}/audio` để upload.
  - Hoàn toàn **không có `GET /modules/{id}/audio`**, không có API streaming hỗ trợ header `Range: bytes=...`, và cũng không cấp Presigned GET URL.
- **Hệ quả**: Kể cả khi giáo viên upload audio thành công, học sinh và giáo viên không có bất kỳ endpoint nào để phát hoặc tải file nghe về trình duyệt.

#### BUG-07: Mất toàn bộ nội dung lựa chọn trắc nghiệm (MCQ Options Blackout) đối với Học sinh
- **Tệp tin**:
  - `backend/src/main/java/com/english_hub/core/modules/question/presentation/rest/dto/QuestionResponse.java` (Dòng 14–24)
  - `frontend/src/api/services/question.service.ts` (Dòng 170–208)
- **Cơ chế lỗi**:
  1. Trong CSDL, các phương án trắc nghiệm (`options: [{id: 1, content: "Paris", isCorrect: true}, ...]`) được lưu chung trong cột JSONB `correct_answer`.
  2. Khi học sinh gọi `GET /api/v1/modules/{id}/questions`, Backend kiểm tra role học sinh và gán `correctAnswer = null` để chống gian lận.
  3. Vì `correctAnswer` bị gán `null`, mảng `options` cũng biến mất khỏi payload.
  4. Frontend nhận được `correctAnswer: null` nên fallback về:
     ```typescript
     options: ['Option A', 'Option B', 'Option C', 'Option D']
     ```
- **Tác động**: Học sinh vào làm bài thi trắc nghiệm Nghe/Đọc chỉ nhìn thấy 4 chữ cái vô nghĩa "Option A", "Option B", "Option C", "Option D", không thể thấy nội dung câu hỏi của giáo viên.

#### BUG-08: Hàm đồng bộ `model.generate_content` làm tắc nghẽn (Block) hoàn toàn FastAPI Event Loop
- **Tệp tin**: `ai-service/app/services/gemini_service.py` (Dòng 472)
- **Mã lỗi**:
  ```python
  response = model.generate_content([user_prompt, audio_part]) # <-- Synchronous blocking network call
  ```
- **Cơ chế lỗi**: Trong hàm bất đồng bộ `async def _call_gemini_direct`, việc gọi trực tiếp hàm đồng bộ I/O của Google SDK (kéo dài 5–20 giây) sẽ **phong tỏa hoàn toàn main thread của FastAPI**.
- **Hệ quả**: Trong thời gian Gemini đang phân tích một bài nói, mọi request khác gửi tới AI Service (kể cả `/health` check của Docker) đều bị đóng băng. Docker tưởng container bị treo và tự restart, sinh lỗi 504 Gateway Timeout hàng loạt. Phải chuyển sang `asyncio.to_thread` hoặc `run_in_threadpool`.

#### BUG-09: Màn hình giáo viên không hiển thị AI Annotations và không nghe được bài nói của học sinh
- **Tệp tin**: `frontend/src/pages/TeacherSubmissionDetails.tsx` (Dòng 160–165)
- **Chi tiết**:
  - Trang không import hoặc gọi `answerAnnotationService`. Giáo viên không thể duyệt/từ chối các đoạn bắt lỗi ngữ pháp/phát âm của AI.
  - Nút nghe audio học sinh chỉ bật toast `showToast('Đang mở audio...')` vì không có player và backend thiếu endpoint cấp Presigned GET URL.

#### BUG-10: Chương 3 tài liệu SRS bị bỏ trống 100%
- **Tệp tin**: `docs/core/01.SRS.md` (Dòng 385–456)
- **Chi tiết**: Chứa 36 tiêu đề phân mục (`### UC01...`) nhưng bên dưới hoàn toàn không có nội dung đặc tả hay sơ đồ quy trình do task `PM-TASK-2` bị bỏ dở.

#### BUG-11: Bộ kiểm thử QA gian lận, không có giá trị nghiệm thu
- **Tệp tin**:
  - `test/white-box/whitebox.test.js`
  - `test/white-box/integration.test.js`
  - `test/performance/scenarios/login-load.js`
  - `test/selenium/tests/` (admin, student, teacher)
- **Chi tiết**: Toàn bộ các test case kiểm thử hộp trắng chỉ chứa `assert.ok(true);`, test hiệu năng chỉ có `console.log`, và selenium test chỉ là file rỗng. Thư mục `.agents/tasks/bugs/` có 0 báo cáo lỗi.

---

### 4.3. NHÓM P1 - LỖI BACKEND, CONCURRENCY, AI SERVICE & CI/CD (HIGH SEVERITY)

#### BUG-12: Bỏ quên kiểm tra hạn nộp bài (`closeAt`) trong hàm `submitModule`
- **Tệp tin**: `backend/src/main/java/com/english_hub/core/modules/submission/application/service/SubmissionService.java` (Dòng 240–260 vs Dòng 141)
- **Cơ chế lỗi**: `isWithinWindow(window)` chỉ được gọi ở `startAttempt`. Khi học sinh nộp bài trong `submitModule`, hệ thống chỉ kiểm tra `submission.getStatus() == IN_PROGRESS`.
- **Hệ quả**: Học sinh có thể bấm mở đề trước hạn đóng 1 phút, sau đó nộp bài muộn sau hạn chót nhiều ngày hoặc nhiều tuần mà backend vẫn ghi nhận hợp lệ.

#### BUG-13: Thiếu Refresh Token Rotation (RTR) và không thu hồi Access Token khi Logout
- **Tệp tin**: `backend/src/main/java/com/english_hub/core/modules/auth/application/service/AuthService.java` (Dòng 93–129)
- **Cơ chế lỗi**:
  - Hàm `refresh()` được đánh dấu `@Transactional(readOnly = true)`. Nó không hề revoke hay rotate `refreshToken`. Một refresh token có thể được dùng lại vô số lần trong suốt 7–30 ngày.
  - Hàm `logout()` chỉ revoke refresh token trong DB, không có token blacklist (Redis). Access token cũ vẫn tiếp tục sử dụng bình thường đến khi hết hạn.

#### BUG-14: Lỗi xung đột dữ liệu trả về 500 Internal Server Error thay vì 409 Conflict
- **Tệp tin**: `backend/src/main/java/com/english_hub/core/common/GlobalExceptionHandler.java` (Dòng 82–90)
- **Mã lỗi**:
  ```java
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException exception) {
      if (containsDuplicateEmail(exception)) {
          return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("Email đã được sử dụng."));
      }
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiError("Lỗi máy chủ."));
  }
  ```
- **Hệ quả**: Khi học sinh click đúp nhanh khiến 2 request bắt đầu làm bài gửi song song, vi phạm ràng buộc `uq_submissions_assignment_student_attempt`, backend trả về lỗi 500 "Lỗi máy chủ" thay vì 409 Conflict hoặc xử lý idempotency.

#### BUG-15: AI Analysis thất bại bị đánh dấu FAILED vĩnh viễn, thiếu Retry Queue
- **Tệp tin**: `backend/src/main/java/com/english_hub/core/modules/grading/infrastructure/service/GradingAiAnalysisServiceImpl.java` (Dòng 120–130)
- **Cơ chế lỗi**: Khi AI service gặp lỗi tạm thời (429 Rate Limit, 504 Timeout), bản ghi grading bị đánh dấu `FAILED` ngay lập tức.
- **Hệ quả**: Không có scheduled job quét lại các bản ghi failed, không có exponential backoff, và không có API cho giáo viên retry thủ công.

#### BUG-16: Downtime lúc deploy Backend và không có Auto-Rollback khi lỗi Flyway
- **Tệp tin**: `.github/workflows/cd-backend.yml` (Dòng 218–224)
- **Cơ chế lỗi**: Lệnh `docker compose up -d` dừng container cũ trước khi container mới sẵn sàng. Quá trình Spring Boot khởi động và chạy Flyway migration đối với Neon DB ở Singapore mất 20–40 giây, khiến toàn bộ request trong thời gian này dính lỗi Cloudflare 502 Bad Gateway. Nếu migration script lỗi, container crash và production sập hoàn toàn.

#### BUG-17: Cấu hình CORS `allowedOriginPatterns: ["*"]` đi kèm `allowCredentials: true`
- **Tệp tin**: `backend/src/main/java/com/english_hub/core/infrastructure/security/SecurityConfig.java` (Dòng 68–79)
- **Mã lỗi**: Cấu hình Spring Security cho phép bất kỳ domain nào (`*`) gửi request kèm credentials (cookies/auth headers). Đây là cấu hình CORS không an toàn, có nguy cơ bị tấn công CSRF/Credential Leakage.

#### BUG-18: Sai quyền RBAC - Chặn giáo viên thêm học sinh vào lớp học
- **Tệp tin**: `backend/src/main/java/com/english_hub/core/infrastructure/security/ApiRoutePolicy.java` (Dòng 47)
- **Mã lỗi**: `POST /api/v1/classes/{id}/members` chỉ cấp cho `ADMIN`. Giáo viên thao tác sẽ nhận lỗi `403 Forbidden` (vi phạm SRS UC09).

#### BUG-19: API tóm tắt bài tập thiếu mảng kỹ năng (`skills`)
- **Tệp tin**: `backend/src/main/java/com/english_hub/core/modules/assignment/presentation/rest/dto/AssignmentSummaryResponse.java`
- **Hệ quả**: Màn hình `TeacherAssignments.tsx` phải dùng regex quét chữ cái trong tiêu đề bài tập (`title.includes('nói')`) để đoán kỹ năng.

#### BUG-20: Điều hướng thi bài tập nhiều kỹ năng (Multi-module) bị kẹt ở Module 0
- **Tệp tin**: `frontend/src/pages/StudentAssignmentOverview.tsx` (Dòng 156–169) & `App.tsx`
- **Chi tiết**: Logic vào bài làm chỉ đọc `assignment?.modules?.[0]`. Học sinh làm bài thi tổng hợp 4 kỹ năng chỉ làm được module đầu tiên và không có stepper chuyển tiếp.

#### BUG-21: Chức năng nộp file đính kèm bài Viết (Word/PDF) bị bỏ rơi
- **Tệp tin**: `frontend/src/pages/StudentAssignmentWriting.tsx` (Dòng 250–280)
- **Chi tiết**: Giao diện cho phép kéo thả file nhưng hàm submit chỉ gửi `textContent` và bỏ qua biến `uploadedFile`.

#### BUG-22: Lỗi hiển thị thẻ đánh dấu chấm điểm của học sinh (Highlight Glitch)
- **Tệp tin**: `frontend/src/pages/StudentSubmissionResult.tsx` (Dòng 186)
- **Mã lỗi**: Hiển thị chuỗi thô `"Đoạn ký tự [" + annotation.startOffset + " - " + annotation.endOffset + "]"` thay vì trích đoạn văn bản thực.

#### BUG-23: Docker container của AI Service thiếu gói giải mã âm thanh ffmpeg
- **Tệp tin**: `ai-service/Dockerfile`
- **Hệ quả**: Khi học sinh gửi file âm thanh WebM hoặc OGG từ trình duyệt, các thư viện xử lý âm thanh trong Python sẽ ném ngoại lệ khi chuyển mã hoặc tính độ trôi chảy (Fluency).

#### BUG-24: Độ trễ Staging cao (400ms - 600ms) do chênh lệch vị trí địa lý
- **Tệp tin**: `docs/NON_FUNCTIONAL_REQUIREMENTS_AND_STAGING_PERFORMANCE.md`
- **Hệ quả**: Home Server đặt tại Việt Nam gọi sang Neon PostgreSQL tại Singapore, mỗi request thực hiện 4–5 query tuần tự dẫn đến độ trễ cao, vi phạm tiêu chí NFR < 200ms.

---

### 4.4. NHÓM P2 - LỖI HIỆU NĂNG, GIAO DIỆN & BẤT CẬP KIẾN TRÚC (MEDIUM SEVERITY)

#### BUG-25: N+1 HTTP Query Storm trên màn hình Teacher Dashboard & Class Progress
- **Tệp tin**:
  - `backend/src/main/java/com/english_hub/core/modules/submission/application/service/SubmissionService.java` (Dòng 218–225)
  - `frontend/src/pages/TeacherDashboard.tsx` (Dòng 102) & `TeacherClassProgress.tsx` (Dòng 152)
- **Cơ chế lỗi**: Backend ép buộc giáo viên phải truyền `assignmentId` khi gọi `GET /api/v1/submissions`. Frontend buộc phải chạy vòng lặp gọi hàng chục request HTTP tuần tự cho từng bài tập trong lớp.
- **Hệ quả**: Nếu lớp có 20 bài tập, trình duyệt gửi 20 request sang Neon DB Singapore, làm màn hình dashboard bị đơ và tải xoay vòng mất hơn 6 giây.

---

## 5. PHÂN TÍCH CHUYÊN SÂU TỪNG KHỐI HỆ THỐNG

### 5.1. Khối Backend (Spring Boot 3.4 & Flyway PostgreSQL)
- **Điểm sáng**: Kiến trúc phân tầng DDD (Domain-Driven Design) rất mạch lạc, áp dụng Pattern Value Object, Domain Model không bị phụ thuộc vào Spring Framework hay JPA Entity, các mapper chuyển đổi dữ liệu được viết cẩn thận.
- **Lỗ hổng cốt lõi**:
  1. *Lệch pha giữa Security Model và Domain Model*: `ApiRoutePolicy` chặn giáo viên quản lý học sinh trong lớp (`POST /classes/{id}/members`), trong khi nghiệp vụ giáo viên là người trực tiếp phụ trách lớp học.
  2. *Data Leak & Sanitization khập khiễng*: Việc giấu `correctAnswer` ở tầng DTO đã xóa luôn mảng `options` khiến trắc nghiệm học sinh bị hỏng toàn bộ.
  3. *Thiếu kiểm soát tính toàn vẹn thời gian thực*: Hạn nộp bài `closeAt` bị bỏ quên trong phương thức cốt lõi `submitModule`.

### 5.2. Khối AI Service (FastAPI & Gemini/OpenRouter Multimodal)
- **Điểm sáng**: Prompt kỹ thuật số 1 (Prompt Engineering) cho IELTS Writing và Speaking được viết cực kỳ chuyên nghiệp, có rubric chi tiết, anchor calibration để chống thiên kiến điểm an toàn (central tendency bias), có cơ chế tính Flesch-Kincaid và phân tích âm học WPM/PTR.
- **Lỗ hổng cốt lõi**:
  1. *Khuyết tật Concurrency ở Python*: Lệnh gọi `model.generate_content` đồng bộ bên trong async route phá hủy hoàn toàn mô hình non-blocking của FastAPI.
  2. *Bảo mật zero*: Không có token xác thực nội bộ giữa Spring Boot và FastAPI. Port 8001 bị phơi bày hoàn toàn ra mạng ngoài.

### 5.3. Khối DevOps & Hạ Tầng Triển Khai (Docker, CI/CD, Storage, Cloudflare)
- **Điểm sáng**: Có Cloudflare Tunnel để đưa ứng dụng từ máy tính cá nhân (Home Server) ra Internet an toàn mà không cần mở port router (NAT), có kịch bản chờ đợi CI thông minh giữa các workflow.
- **Lỗ hổng cốt lõi**:
  1. *Lưu trữ không đồng nhất (Storage Fragmentation)*: Module audio dùng disk local không volume, trong khi submission audio dùng S3/R2.
  2. *Quy trình CD gián đoạn dịch vụ*: Thiếu mô hình triển khai Blue-Green / Rolling update, gây downtime mỗi lần deploy code mới.

---

## 6. BẢNG MA TRẬN TRÁCH NHIỆM & BIỆN PHÁP KHẮC PHỤC THEO ROLE

```mermaid
flowchart TD
    subgraph PM ["@pm (Product Manager)"]
        PM1["Bổ sung 100% nội dung Chương 3 SRS.md"]
        PM2["Đồng bộ số lượng Use Case (36 UCs) giữa SRS, PP, TP"]
    end

    subgraph Backend ["@be-primary & @be-secondary"]
        BE1["Sửa ForgotPassword: Xóa debugOtp, tích hợp JavaMailSender"]
        BE2["Tách options ra khỏi correctAnswer trong QuestionResponse"]
        BE3["Sửa ApiRoutePolicy: Cho TEACHER thêm member vào lớp"]
        BE4["Bổ sung GET audio stream endpoint cho ModuleController"]
        BE5["Thêm kiểm tra closeAt trong SubmissionService.submitModule"]
        BE6["Chuyển LocalAudioStorageAdapter sang dùng S3StorageService"]
        BE7["Sửa GlobalExceptionHandler: Map DataIntegrity sang 409 Conflict"]
    end

    subgraph AIService ["@be-primary / AI Dev"]
        AI1["Bọc model.generate_content bằng asyncio.to_thread"]
        AI2["Thêm API Key / X-Internal-Secret Middleware cho FastAPI"]
        AI3["Thêm ffmpeg vào Dockerfile"]
    end

    subgraph Frontend ["@fe-primary & @fe-secondary"]
        FE1["Tích hợp MediaRecorder thật vào StudentAssignmentSpeaking.tsx"]
        FE2["Thêm thẻ audio thật vào StudentAssignmentListening.tsx"]
        FE3["Tích hợp answerAnnotationService vào TeacherSubmissionDetails.tsx"]
        FE4["Xây dựng bộ chuyển tiếp Module thi (Multi-module Exam Stepper)"]
        FE5["Sửa lỗi hiển thị chuỗi ký tự highlight trong StudentSubmissionResult.tsx"]
    end

    subgraph QA ["@tester (QA/Tester)"]
        QA1["Viết lại toàn bộ White-box tests có assertion thực tế"]
        QA2["Cấu hình k6 kịch bản tải thật và Selenium E2E tests"]
        QA3["Khai báo toàn bộ 25 lỗi vào .agents/tasks/bugs/"]
    end

    subgraph DevOps ["@devops-primary"]
        DO1["Đóng port 8001 trên host, chỉ giữ network internal englishhub_shared"]
        DO2["Tối ưu pipeline CD Backend để tránh downtime lúc deploy"]
        DO3["Tắt quyền anonymous download trên MinIO dev"]
    end

    PM --> Backend
    PM --> Frontend
    Backend --> QA
    AIService --> QA
    Frontend --> QA
    QA --> DevOps
```

### Kế hoạch hành động chi tiết:

| Vai trò phụ trách | Mã công việc | Hành động khắc phục chi tiết | Mức độ ưu tiên |
| :--- | :--- | :--- | :--- |
| **@pm** | `PM-FIX-01` | Mở lại task `PM-TASK-2`, viết đầy đủ mô tả luồng chính/phụ và điều kiện cho 36 UCs trong `01.SRS.md`. | **P0** |
| **@be-primary** | `BE-SEC-01` | Xóa `debugOtp` trong `ForgotPasswordResponse`. Cấu hình `spring-boot-starter-mail` để gửi email thật. | **P0 (Critical)** |
| **@be-primary** | `BE-STO-01` | Chuyển `LocalAudioStorageAdapter` sang lưu trữ trên S3, xóa bỏ lưu disk local không volume. | **P0 (Data Loss)** |
| **@be-primary** | `BE-API-01` | Cập nhật `QuestionResponse`: Trả về mảng `options: [{id, content}]` đã ẩn trường `isCorrect` cho học sinh. | **P0 (Blocker)** |
| **@be-primary** | `BE-AUD-01` | Bổ sung endpoint `GET /api/v1/modules/{id}/audio` hỗ trợ streaming cho học sinh làm bài nghe. | **P0 (Blocker)** |
| **@be-primary** | `BE-AI-01` | Bọc lệnh gọi Google SDK bằng `asyncio.to_thread` trong `gemini_service.py` để giải phóng Event Loop. | **P0 (Blocker)** |
| **@devops-primary**| `DO-SEC-01` | Đóng port 8001 của AI service khỏi host, thêm `X-Internal-Token` bảo vệ giữa Spring Boot và FastAPI. | **P0 (Critical)** |
| **@fe-primary** | `FE-SPK-01` | Viết hook `useAudioRecorder` với Web Audio API và `MediaRecorder`, upload blob lên S3 và gửi `audioStorageKey`. | **P0 (Blocker)** |
| **@fe-primary** | `FE-LIS-01` | Gắn thẻ `<audio>` chuẩn HTML5 vào `StudentAssignmentListening.tsx`, kết nối API phát nhạc. | **P0 (Blocker)** |
| **@fe-primary** | `FE-REV-01` | Tích hợp `answerAnnotationService` và trình phát audio học sinh vào `TeacherSubmissionDetails.tsx`. | **P0 (Blocker)** |
| **@be-secondary**| `BE-CHK-01` | Thêm kiểm tra `now.isAfter(closeAt)` vào `SubmissionService.submitModule()` để chặn gian lận nộp muộn. | **P1** |
| **@be-secondary**| `BE-SEC-02` | Sửa `ApiRoutePolicy.java`: Đổi quyền `POST /api/v1/classes/{id}/members` thành `hasAnyRole('ADMIN', 'TEACHER')`. | **P1** |
| **@be-secondary**| `BE-API-02` | Thêm trường `skills: List<ModuleSkill>` vào `AssignmentSummaryResponse.java`. | **P1** |
| **@devops-primary**| `DO-DOCKER-01`| Cập nhật `ai-service/Dockerfile`: thêm lệnh `apt-get install -y ffmpeg`. | **P1** |
| **@tester** | `QA-TEST-01`| Loại bỏ toàn bộ `assert.ok(true);`, viết lại test suite thật sự, kích hoạt k6 load test và log 25 bugs vào hệ thống. | **P0** |

---

> **Kết luận**: Dự án EnglishHub sở hữu nền tảng kiến trúc rất tiềm năng, nhưng để có thể chuyển giao nghiệm thu và đưa vào sử dụng thực tế, toàn bộ đội ngũ kỹ thuật bắt buộc phải giải quyết dứt điểm các lỗi tắc nghẽn P0, đóng các lỗ hổng bảo mật hạ tầng và chấm dứt việc duy trì các bài test giả mạo.
