# BÁO CÁO BÀN GIAO KIỂM THỬ FRONTEND SPRINT 10 (FE TO TESTER)

> **Người thực hiện**: Tiến Sơn Trần (Maloque18705 - fe-primary)  
> **Người nhận**: QA / Tester (@Zawn-Tsu) & Lead (@hotung9108)  
> **Các tính năng bàn giao**:
> 1. `[FE-96]` (#547): Màn hình Review Tổng Thể Tiến Trình & Module trước khi Nộp Bài Tập (UC020, UC021, AD20, AD21)
> 2. `[FE-90]` (#529): Modal Điều chỉnh điểm kèm Audit reason note trực tiếp trên Sổ điểm & Chi tiết bài chấm (UC030, AD30)
> 3. `[FE-95]` (#544): Hoàn Thiện Tab Xem Bài Chữa & Đối Chiếu Đáp Án Chi Tiết (UC020, UC032)

---

## 1. TÍNH NĂNG 1: MÀN HÌNH REVIEW TỔNG THỂ TRƯỚC KHI NỘP (UC020, UC021) - `[FE-96]`

### A. Tóm tắt thay đổi
- **File sửa đổi**:
  - [ExamStepper.tsx](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/frontend/src/components/assignments/ExamStepper.tsx): Cho phép học viên bấm vào các phần thi đã hoàn thành trong lúc đang làm bài để xem lại / sửa câu trả lời (`hasActiveAttempt ? 'Sửa câu trả lời' : 'Xem lại'`).
  - [StudentAssignmentOverview.tsx](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/frontend/src/pages/StudentAssignmentOverview.tsx): Khi học viên có bài làm dở dang (`inProgressSub`), hiển thị **Pre-Submit Review Dashboard**:
    + Thẻ tiến độ của từng kỹ năng (Listening, Reading, Writing, Speaking).
    + Trạng thái: "Đã làm" (xanh) hoặc "Chưa nộp" (cam).
    + Nút "Sửa câu trả lời" hoặc "Làm bài ngay" cho từng kỹ năng.
    + Cảnh báo nếu còn câu hỏi chưa điền (UC020 Dòng phụ).
    + Nút to "Xác nhận Nộp toàn bộ bài tập (Final Submit)".
    + `ConfirmModal` xác nhận trước khi chốt nộp (UC021 & AD21).
  - [StudentAssignmentReading.tsx](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/frontend/src/pages/StudentAssignmentReading.tsx), [StudentAssignmentWriting.tsx](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/frontend/src/pages/StudentAssignmentWriting.tsx), [StudentAssignmentListening.tsx](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/frontend/src/pages/StudentAssignmentListening.tsx), [StudentAssignmentSpeaking.tsx](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/frontend/src/pages/StudentAssignmentSpeaking.tsx): Thêm nút "Xem lại trước khi nộp" đưa thẳng về màn hình rà soát tổng thể.

### B. Hướng dẫn Tester nghiệm thu
1. Đăng nhập tài khoản Học viên (`student1@englishhub.com` / `123456`).
2. Mở một bài tập có nhiều kỹ năng (hoặc làm dở dang 1 kỹ năng).
3. Bấm nút **"Xem lại trước khi nộp"**:
   - Hệ thống chuyển về màn hình Overview với bảng **"Kiểm tra và xem lại bài làm trước khi nộp (UC020)"**.
   - Thấy rõ danh sách các phần thi: phần đã nộp hiển thị huy hiệu "Đã làm", phần chưa làm hiển thị "Chưa nộp".
   - Nếu còn phần thi chưa hoàn thành: Thấy hộp cảnh báo màu vàng nổi bật.
4. Bấm nút **"Sửa câu trả lời"** trên thẻ một kỹ năng đã làm:
   - Hệ thống điều hướng quay lại đúng kỹ năng đó để học viên sửa câu trả lời.
5. Quay lại và bấm **"Xác nhận Nộp toàn bộ bài tập"**:
   - Hộp thoại `ConfirmModal` hiện lên: *"Bạn có chắc chắn muốn nộp toàn bộ bài tập? Sau khi xác nhận nộp, bạn sẽ không thể chỉnh sửa lại các câu trả lời..."*.
   - Bấm "Kiểm tra lại": Modal đóng, không nộp bài.
   - Bấm "Xác nhận nộp bài": Bài thi được gửi lên server, thông báo thành công và chuyển hướng sang trang kết quả `/student/submissions/:id`.

---

## 2. TÍNH NĂNG 2: BẮT BUỘC NHẬP LÝ DO ĐIỀU CHỈNH ĐIỂM (UC030, AD30) - `[FE-90]`

### A. Tóm tắt thay đổi
- **File sửa đổi**:
  - [TeacherSubmissionDetails.tsx](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/frontend/src/pages/TeacherSubmissionDetails.tsx): Khi giáo viên sửa điểm số của một bài làm đã có điểm trước đó (`existingFinalScore !== scoreNum`), hệ thống mở `AdjustGradeAuditModal`.
  - Bắt buộc giáo viên phải nhập lý do điều chỉnh (Audit Reason Note, tối thiểu 3 ký tự). Nút bấm bị vô hiệu hóa nếu để trống.
  - Sau khi xác nhận, gửi trường `note` qua API `PUT /api/v1/gradings/{id}` để backend lưu vào bảng `grading_change_logs`.
  - [TeacherClassProgress.tsx](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/frontend/src/pages/TeacherClassProgress.tsx): Chuẩn hóa nhãn kiểm toán UC030 trong modal điều chỉnh điểm số sổ điểm lớp học.

### B. Hướng dẫn Tester nghiệm thu
1. Đăng nhập tài khoản Giáo viên (`teacher1@englishhub.com` / `123456`).
2. Mở một bài nộp đã được chấm hoàn tất (có điểm).
3. Thay đổi ô "Điểm số" sang một giá trị mới (ví dụ: từ 8.0 thành 8.5) và nhấn "Lưu điểm & Trả bài".
4. Quan sát: Modal **"Lý do điều chỉnh điểm số (UC030)"** xuất hiện.
   - Thông báo rõ ràng: *"Bài nộp này đã có điểm trước đó (8.0 điểm). Bạn đang điều chỉnh thành 8.5 điểm..."*.
   - Để trống ô lý do: Nút "Xác nhận & Cập nhật điểm" bị mờ / disabled.
   - Nhập lý do (ví dụ: "Phúc khảo bài làm, cộng điểm từ vựng"): Nút sáng lên, bấm xác nhận.
5. Thông báo toast: *"Đã điều chỉnh điểm thành công (8.5đ - Lý do: Phúc khảo bài làm...)"*.
6. Đăng nhập tài khoản Admin vào trang `Quản lý kiểm toán điểm` (`/admin/reports` hoặc `/admin/grading-audit-logs`):
   - Thấy bản ghi lịch sử sửa điểm với `oldScore: 8.0`, `newScore: 8.5`, và ghi chú `note` vừa nhập.

---

## 3. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & QUALITY GATES
- **Build TypeScript**: `npm run build` -> **0 lỗi** (2236 modules transformed, `exit code 0`).
- **Unit Tests**: `npm test` -> **213/213 test pass 100%**.
- **Không tự ý commit/push**: Đã tuân thủ nghiêm ngặt quy tắc [no-auto-commit-push.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/private/rules/no-auto-commit-push.md).
