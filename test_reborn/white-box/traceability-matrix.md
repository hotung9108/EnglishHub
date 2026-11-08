# Ma trận Truy vết Kiểm thử Hộp trắng (Traceability Matrix)

Ma trận đối chiếu giữa Use Cases trong [`01.SRS.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/core/01.SRS.md) với các bộ kiểm thử hộp trắng thực tế:

| Use Case ID | Tên Chức năng | Thành phần | Vị trí Test Code Hộp trắng | Trọng tâm kiểm thử |
| :--- | :--- | :--- | :--- | :--- |
| **UC01, UC02** | Đăng nhập & Đăng xuất | Backend / Frontend | `backend/src/test/.../AuthServiceTest.java`<br>`frontend/src/__tests__/components/Login.test.tsx` | Mã hóa bcrypt, sinh JWT token, kiểm tra hết hạn, validate định dạng email |
| **UC03** | Quản lý tài khoản | Backend | `backend/src/test/.../UserServiceTest.java` | Ràng buộc đổi mật khẩu, kiểm tra độ dài số điện thoại, cập nhật hồ sơ |
| **UC08, UC09** | Quản lý lớp học & thành viên | Backend | `backend/src/test/.../ClassServiceTest.java` | Ràng buộc duy nhất mã lớp, phân quyền giáo viên sở hữu lớp, thêm học viên |
| **UC11 – UC14** | Vòng đời bài tập (CRUD, Đa kỹ năng) | Backend / Frontend | `backend/src/test/.../AssignmentServiceTest.java`<br>`frontend/src/__tests__/components/TeacherCreateAssignment.test.tsx` | Kiểm tra ngày mở trước ngày đóng, trạng thái DRAFT vs PUBLISHED, tạo module con |
| **UC15 – UC23** | Làm & Nộp bài tập | Backend / Frontend | `backend/src/test/.../SubmissionServiceTest.java`<br>`frontend/src/__tests__/components/StudentAssignmentWriting.test.tsx` | Tính toán số từ bài luận, upload file S3 an toàn, chống nộp quá hạn, lưu nháp |
| **UC24 – UC27** | Chấm điểm & AI hỗ trợ | Backend / AI Service | `backend/src/test/.../GradingServiceTest.java`<br>`frontend/src/__tests__/components/TeacherSubmissionDetails.test.tsx`<br>`ai-service/tests/test_speaking_api.py` | Kiểm tra điểm 0–10, reject AI cho trắc nghiệm, phân biệt lưu nháp vs hoàn tất |
| **UC28, UC29** | Chấm bài tự động Đọc / Nghe | Backend | `backend/src/test/.../AnswerComparatorTest.java` | Thuật toán đối chiếu đáp án trắc nghiệm MCQ, điền từ ngắn không phân biệt hoa thường |
