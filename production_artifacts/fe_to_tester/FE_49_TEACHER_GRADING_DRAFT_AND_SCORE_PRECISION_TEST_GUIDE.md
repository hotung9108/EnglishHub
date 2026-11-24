# FE-49 Hướng dẫn Kiểm thử (FE to Tester)

## 1. Thông tin chung
- **Task ID**: [FE-49][ISSUE #212 #215] Chuẩn hóa cơ chế lưu nháp nhận xét và thang điểm chấm bài
- **Branch**: `feat/FE-49-teacher-grading-draft-and-score-precision`
- **Developer**: Maloque18705 (@fe-primary)
- **Reviewer / Tester**: Zawn-Tsu (@tester)

## 2. Mục tiêu thay đổi
1. **Lưu bản nháp nhận xét (Issue #212 / BUG-QA32-GRADE)**:
   - Trước đây khi giáo viên bấm "Lưu bản nháp nhận xét", giao diện gọi `gradingService.submitGrade`, dẫn đến Backend chuyển trạng thái bản chấm thành `COMPLETED` (đã trả bài cho học sinh).
   - Đã chuẩn hóa: Khi bấm "Lưu bản nháp nhận xét", hệ thống lưu điểm và nội dung nhận xét vào `localStorage` (`eh_draft_grading_{submissionModuleId}`) và **tuyệt đối không gọi `submitGrade`**. Trạng thái chấm điểm trên hệ thống được giữ nguyên (`PENDING`), học sinh chưa thấy bài được trả.
   - Khi giáo viên tải lại trang hoặc quay lại bài nộp (nếu bài chưa `COMPLETED`), dữ liệu điểm và nhận xét nháp được tự động khôi phục từ `localStorage`.
   - Khi giáo viên bấm "Chấm điểm và trả bài" (`isFinalize = true`), hệ thống gọi API `submitGrade` chính thức và xóa sạch bản nháp trong `localStorage`.
2. **Chuẩn hóa bước điểm và độ chính xác (Issue #215)**:
   - Input điểm số hỗ trợ `step="any"` (linh hoạt các bước 0.5, 0.1, hoặc số thập phân hợp lệ trong dải 0.0 - 10.0).
   - Tự động chuẩn hóa dấu phẩy (`,`) thành dấu chấm (`.`) khi người dùng nhập từ bàn phím tiếng Việt.

## 3. Các bước kiểm thử (Testing Steps)

### Kịch bản 1: Lưu bản nháp nhận xét
1. Đăng nhập tài khoản Giáo viên (`teacher1@test.com`).
2. Vào chi tiết bài nộp một học sinh cần chấm (`/teacher/assignments/{id}/submissions/{studentId}`).
3. Nhập điểm: `8.2` (hoặc `7.5`).
4. Nhập nhận xét: *"Bản nháp nhận xét lần 1 - cần bổ sung luận điểm."*
5. Nhấn nút **"Lưu bản nháp nhận xét"**:
   - **Kỳ vọng**: 
     - Hiển thị Toast thông báo: "Đã lưu bản nháp nhận xét!".
     - Kiểm tra Network tab: **KHÔNG CÓ request PUT `/gradings/{id}`** gửi lên server.
     - Trạng thái bài làm của học sinh vẫn là chưa hoàn tất chấm.
6. F5 (tải lại trang):
   - **Kỳ vọng**: Điểm số `8.2` và nội dung nhận xét vẫn được giữ nguyên trên form.

### Kịch bản 2: Hoàn tất chấm điểm và dọn dẹp nháp
1. Tiếp tục từ Kịch bản 1, nhấn nút **"Chấm điểm và trả bài"** (Lưu & Gửi điểm cho học sinh).
2. **Kỳ vọng**:
   - Có request PUT `/gradings/{id}` gửi điểm số chính thức.
   - Hiển thị Toast: "Đã lưu điểm và trả bài cho học viên thành công!".
   - Bản nháp trong `localStorage` được xóa sạch.

### Kịch bản 3: Độ chính xác điểm số và dấu phẩy thập phân
1. Nhập điểm có dấu phẩy: `8,5` hoặc số lẻ `9.25`.
2. Bấm Lưu & Gửi điểm.
3. **Kỳ vọng**: Input tự động chuẩn hóa và gửi điểm số dạng số thực `8.5` / `9.25` lên server mà không báo lỗi "Điểm số không hợp lệ".

## 4. Bằng chứng kiểm thử tự động (Automated Test Evidence)
- `BUG-QA32-GRADE` (`TeacherGrade.known-bugs.test.tsx`): **PASSED** (Khẳng định bấm lưu nháp không gọi endpoint hoàn tất chấm điểm).
- `TeacherSubmissionDetails.test.tsx`: **128/128 tests PASSED** (Coverage >98% Lines, >83% Branch).
- `npm test`: **198/198 tests PASSED**.
- `npm run build`: **PASSED** (0 errors).
- `npm run lint`: **PASSED** (0 errors, 0 warnings).
