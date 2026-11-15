# BÀN GIAO KIỂM THỬ TOÀN BỘ 5 TÍNH NĂNG FRONTEND (SPRINT 9)

- **Người thực hiện**: @fe-primary (Maloque18705 - Tiến Sơn Trần)
- **Người kiểm thử**: @tester (Zawn-Tsu - QA Lead)
- **Danh sách Task**: FE-87, FE-88, FE-89, FE-90, FE-91
- **Trạng thái Build & Test**: 100% Pass (0 errors, 212 API unit tests + 6 feature vitests pass)

---

## 1. TỔNG QUAN CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI

### [FE-88] Điều chuyển học viên giữa các lớp cho Quản lý (Admin Class Transfer - UC009)
- **Tệp mới**: `frontend/src/components/classes/TransferStudentModal.tsx`
- **Tệp chỉnh sửa**: `frontend/src/pages/ClassDetails.tsx`
- **Mô tả**: Bổ sung nút "Chuyển lớp" (icon ArrowRightLeft) trong bảng học viên lớp học Admin. Khi bấm, mở modal chọn lớp học chuyển đến (lọc tìm kiếm, hiển thị sĩ số hiện tại), tự động ghi danh vào lớp đích và hủy ghi danh khỏi lớp cũ với thông báo trạng thái.

### [FE-87] UI Quản lý thành viên lớp học (Thêm, Xóa, Chuyển lớp) cho Giáo viên (UC009)
- **Tệp chỉnh sửa**: `frontend/src/pages/TeacherClasses.tsx`, `frontend/src/pages/TeacherClassProgress.tsx`
- **Mô tả**:
  1. Thẻ lớp học tại `/teacher/classes` bổ sung nút "Thành viên" dẫn trực tiếp đến `/teacher/classes/:id/progress?tab=members`.
  2. Tab 4 "Quản lý thành viên" trong Sổ điểm lớp học hiển thị tổng sĩ số so với sĩ số tối đa, nút "Thêm học viên vào lớp" (mở `SelectExistingStudentsModal`), bảng danh sách kèm nút "Chuyển lớp" (`TransferStudentModal`) và "Xóa khỏi lớp" (`ConfirmModal`).

### [FE-89] Bổ sung chức năng Xuất báo cáo thống kê CSV cho Quản lý (Admin Reports Export - UC035/UC036)
- **Tệp chỉnh sửa**: `frontend/src/pages/AdminReports.tsx`
- **Mô tả**: Header trang Báo cáo Quản trị bổ sung nút "Xuất báo cáo (CSV)" (icon Download). Xuất file CSV định dạng UTF-8 BOM chuẩn (hỗ trợ hiển thị tiếng Việt hoàn hảo trên Excel) bao gồm tổng quan chỉ số hệ thống và danh sách chi tiết các lớp học đang được lọc.

### [FE-90] Modal Điều chỉnh điểm kèm Audit reason note trực tiếp trên Sổ điểm (UC030/UC031)
- **Tệp chỉnh sửa**: `frontend/src/pages/TeacherClassProgress.tsx`
- **Mô tả**: Bảng Sổ điểm học viên (Tab 1) bổ sung nút hành động "Điều chỉnh điểm" (icon Edit3). Modal cho phép chọn hạng mục (Overall, Writing, Speaking, Reading, Listening), nhập điểm số mới (0 - 10) và bắt buộc nhập Lý do điều chỉnh điểm (Audit reason note) theo quy chuẩn kiểm toán UC031 trước khi lưu.

### [FE-91] Bổ sung tùy chọn Tải tệp âm thanh ghi sẵn (.mp3, .wav) song song với Microphone cho bài Nói (UC017)
- **Tệp chỉnh sửa**: `frontend/src/pages/StudentAssignmentSpeaking.tsx`
- **Mô tả**: Giao diện làm bài Nói bổ sung tab chuyển đổi giữa 2 chế độ: "Ghi âm trực tiếp (Microphone)" và "Tải tệp (.mp3/.wav)". Kiểm tra định dạng (.mp3, .wav, .m4a, .webm), giới hạn dung lượng 25MB, hỗ trợ nghe lại (Play/Pause) và đẩy trực tiếp lên MinIO/S3 khi nộp bài.

---

## 2. HƯỚNG DẪN KIỂM THỬ CHI TIẾT (QA TEST GUIDE)

### Test Case 1: Điều chuyển học viên ở phân hệ Admin (FE-88)
1. Đăng nhập với tài khoản Admin.
2. Điều hướng đến `/admin/classes/1`.
3. Trong tab "Học viên", tìm một học viên bất kỳ và bấm nút "Chuyển lớp".
4. Chọn một lớp học khác trong danh sách, bấm "Xác nhận chuyển lớp".
5. Kiểm tra toast thông báo thành công và danh sách học viên lớp hiện tại tự động cập nhật.

### Test Case 2: Quản lý thành viên lớp học của Giáo viên (FE-87)
1. Đăng nhập với tài khoản Teacher.
2. Truy cập `/teacher/classes`, bấm nút "Thành viên" trên một lớp học.
3. Kiểm tra trang mở tab "Quản lý thành viên", hiển thị sĩ số `{hiện tại} / {tối đa}`.
4. Bấm "Thêm học viên vào lớp", chọn 1 học viên và bấm thêm -> sĩ số tăng lên.
5. Thử nút "Chuyển lớp" và "Xóa khỏi lớp" với modal xác nhận.

### Test Case 3: Xuất báo cáo CSV (FE-89)
1. Đăng nhập với tài khoản Admin, truy cập `/admin/reports`.
2. Bấm nút "Xuất báo cáo (CSV)" ở góc trên bên phải.
3. Mở file `.csv` vừa tải về bằng Microsoft Excel hoặc Notepad.
4. Xác nhận các ký tự tiếng Việt hiển thị chính xác (không lỗi font) và các chỉ số tổng quan lẫn lớp học khớp với UI.

### Test Case 4: Điều chỉnh điểm kèm Audit reason note (FE-90)
1. Đăng nhập Teacher, truy cập Sổ điểm lớp học `/teacher/classes/1/progress`.
2. Tại cột Thao tác của học viên, bấm biểu tượng cây bút (Điều chỉnh điểm).
3. Thử để trống lý do -> nút Lưu bị vô hiệu hóa hoặc báo lỗi bắt buộc nhập lý do theo UC031.
4. Nhập điểm mới và lý do hợp lệ -> bấm "Lưu điều chỉnh điểm" -> Điểm số trên bảng cập nhật ngay lập tức và có toast thông báo kèm lý do.

### Test Case 5: Tải tệp âm thanh bài Nói (FE-91)
1. Đăng nhập Student, mở một bài tập Speaking bất kỳ.
2. Bấm vào tab "Tải tệp (.mp3/.wav)" bên cạnh tab Microphone.
3. Kéo thả hoặc chọn một tệp `.mp3` hoặc `.wav` hợp lệ.
4. Bấm nút Play để nghe thử âm thanh đã tải lên.
5. Bấm "Nộp bài Nói" -> xác nhận tệp được tải lên thành công và chuyển sang màn hình kết quả.

---

## 3. KẾT QUẢ AUTOMATED TEST & BUILD

- `npx vitest run FrontendSprintFeatures`: **6/6 passed (100%)**
- `npm run test`: **212/212 passed (100%)**
- `npm run build`: **Compiled successfully in 789ms (0 errors, 0 warnings)**
