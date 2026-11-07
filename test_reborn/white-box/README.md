# Kiểm thử Hộp trắng (White-box Testing) — EnglishHub

Tài liệu này xác lập ranh giới và liên kết kiểm thử hộp trắng của hệ thống theo quy định trong [`docs/core/03.TP.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/core/03.TP.md).

## Ranh giới Kiến trúc

Theo chuẩn công nghệ của EnglishHub:
- Mã nguồn kiểm thử hộp trắng (Unit test & Integration test) được tích hợp **trực tiếp cùng các tầng mã nguồn dịch vụ tương ứng**, không để test giả rải rác trong thư mục ngoài:
  1. **Backend (Spring Boot & JPA)**:
     - Thư mục: [`backend/src/test/java/...`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/backend/src/test/java)
     - Công nghệ: JUnit 5, Mockito, AssertJ, SpringBootTest, Testcontainers.
     - Lệnh chạy: `cd backend && ./gradlew test`
     - Độ bao phủ: Kiểm thử logic tính điểm, kiểm thử ràng buộc phân quyền, thuật toán đối chiếu đáp án, kiểm tra chống rò rỉ dữ liệu.
  2. **Frontend (React 19 & TypeScript)**:
     - Thư mục: [`frontend/src/__tests__/...`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/frontend/src/__tests__)
     - Công nghệ: Vitest, React Testing Library, jest-dom, jsdom.
     - Lệnh chạy: `cd frontend && npm run test:ui` (kiểm tra coverage ngưỡng $\ge 80\%$)
     - Phạm vi: Login, TeacherCreateAssignment, StudentAssignmentWriting, TeacherSubmissionDetails.
  3. **AI Service (FastAPI & Gemini / Whisper)**:
     - Thư mục: [`ai-service/tests/...`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/ai-service/tests)
     - Công nghệ: pytest, pytest-asyncio, httpx.
     - Lệnh chạy: `cd ai-service && pytest`
     - Phạm vi: Audio processor (FFmpeg), text analyzer, Gemini prompt formatting, benchmark tests.

## Danh mục Mã & Tài liệu Kiểm thử Hộp trắng

- [`whitebox-strategy.md`](whitebox-strategy.md): Chiến lược kiểm thử hộp trắng chi tiết theo chuẩn ISO/IEC/IEEE 29119.
- [`backend/whitebox-test-cases.md`](backend/whitebox-test-cases.md): Bộ ca kiểm thử hộp trắng chi tiết cho các Service lõi của Backend (Auth, Submission, Grading).
- [`ai-service/test_whitebox_extensions.py`](ai-service/test_whitebox_extensions.py): Kịch bản kiểm thử pytest cho AI Evaluation Service.
- [`frontend/api/services/auth.service.test.ts`](frontend/api/services/auth.service.test.ts): Unit tests kiểm tra xử lý token và service đăng nhập Frontend.
- [`frontend/utils/validators.test.ts`](frontend/utils/validators.test.ts): Unit tests kiểm tra hàm validation form (email, password, ngày tháng).
- [`traceability-matrix.md`](traceability-matrix.md): Ma trận truy vết độ bao phủ (Coverage Traceability Matrix).
