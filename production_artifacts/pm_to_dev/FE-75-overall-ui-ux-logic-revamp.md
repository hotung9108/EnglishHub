# SPECIFICATION HANDOFF: [FE-75] Tái Thiết Kế Toàn Diện UI/UX và Chuẩn Hóa Logic Toàn Bộ Website

> **Mã nhiệm vụ:** `[FE-75]`  
> **Trello Card:** [https://trello.com/c/808MTDmQ](https://trello.com/c/808MTDmQ)  
> **Người thực hiện:** Tiến Sơn Trần (`@tinsntrn` / Git: `Maloque18705`)  
> **Vai trò:** Frontend Lead (`@fe-primary`, `@fe-secondary`)  
> **Nhánh Git:** `feat/FE-75-overall-ui-ux-logic-revamp`  
> **Target Branch:** `develop`  
> **Tài liệu đặc tả:** [`docs/features/FE-75-overall-ui-ux-logic-revamp.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/features/FE-75-overall-ui-ux-logic-revamp.md)  

---

## 1. TỔNG QUAN YÊU CẦU & BỐI CẢNH

Hệ sinh thái giao diện của website EnglishHub hiện tại gặp tình trạng phân mảnh CSS nghiêm trọng (hơn 18 file CSS không có scope chung), màu sắc và khoảng cách hard-code, nhiều trang bị vỡ bố cục khi co dãn màn hình, đè CSS chéo class name và tồn tại nhiều lỗi logic tương tác (dữ liệu không tự động làm mới sau khi tạo/sửa/xóa, thiếu loading skeleton, thông báo lỗi bằng alert thô sơ, form validation chưa đồng bộ).

Nhiệm vụ `FE-75` yêu cầu Frontend Lead thực hiện cuộc cải tổ toàn diện:
1. **Kiến trúc giao diện mới**: Xây dựng Design Tokens chuẩn (`design-tokens.css`) và bộ Base UI Components nhất quán.
2. **Chuẩn hóa trải nghiệm 4 phân hệ**: Student, Teacher, Admin, và Auth/Shell.
3. **Khắc phục triệt để các lỗi logic giao diện & tương tác người dùng**.

---

## 2. QUY TRÌNH THỰC HIỆN TỪNG BƯỚC (STEP-BY-STEP IMPLEMENTATION PLAN)

### Bước 1: Xây dựng Tầng Nền Tảng Design Tokens & Base Components
1. Tạo tệp `frontend/src/styles/design-tokens.css` quy định biến CSS dùng chung:
   - Primary Palette (Brand Blues & Purples: 50 -> 900)
   - Neutral Gray Palette (50 -> 900)
   - Status Colors (Success, Warning, Danger, Info)
   - Spacing scale (`--space-1` đến `--space-16`)
   - Border radius (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`)
   - Elevation shadows (`--shadow-sm`, `--shadow-md`, `--shadow-lg`)
   - Font typography hierarchy (`--font-sans`, `--text-xs` -> `--text-3xl`)
2. Rà soát và nâng cấp thư mục `frontend/src/components/common/`:
   - `Button.tsx`: Hỗ trợ biến thể (primary, secondary, outline, danger), kích cỡ, loading spinner và ngăn double click.
   - `Input.tsx`, `Textarea.tsx`, `Select.tsx`: Đồng bộ trạng thái focus, error message, helper text.
   - `Card.tsx`, `Badge.tsx`: Chuẩn hóa bo góc và màu trạng thái.
   - `Modal.tsx`: Hỗ trợ overlay đóng bằng click ngoài / phím ESC, chống tràn màn hình (overflow containment).
   - `Toast.tsx` & `ToastContext`: Cung cấp hook `useToast()` để thay thế toàn bộ `alert()` trên toàn website.
   - `Skeleton.tsx`: Hiệu ứng shimmer animation cho loading state.
   - `EmptyState.tsx`: Giao diện trực quan khi danh sách rỗng kèm nút thao tác gợi ý.

### Bước 2: Chuẩn Hóa Phân Hệ Học Sinh (Student Experience)
1. **Student Dashboard (`StudentDashboard.tsx`)**:
   - Thống kê tiến độ trực quan, thẻ bài tập hiển thị rõ hạn nộp, điểm số và trạng thái làm bài.
   - Bổ sung Skeleton Loading khi đang tải dữ liệu bài tập và tiến độ.
2. **Student Classes (`StudentClasses.tsx`, `StudentClassDetails.tsx`)**:
   - Giao diện thẻ lớp học sinh động, danh sách bài tập được gom nhóm theo kỹ năng hoặc thứ tự hạn chót.
3. **Phòng thi 4 kỹ năng (Exam Stepper Studio)**:
   - `StudentAssignmentOverview.tsx`: Màn hình hướng dẫn trước khi bắt đầu bài thi với nút "Bắt đầu làm bài" nổi bật.
   - `StudentAssignmentListening.tsx`: Trình phát audio hiện đại, nút phát/dừng, tua thời gian và âm lượng.
   - `StudentAssignmentSpeaking.tsx`: Bộ thu âm rõ ràng, visualizer ghi âm, nút nghe lại và gửi bản ghi.
   - `StudentAssignmentReading.tsx`: Bố cục chia 2 khung riêng biệt giúp vừa đọc bài vừa trả lời câu hỏi tiện lợi.
   - `StudentAssignmentWriting.tsx`: Soạn thảo văn bản có đếm từ thời gian thực, upload file đính kèm với thanh tiến trình.
   - Đồng bộ logic Countdown Timer và cơ chế Auto-save nháp bài làm vào LocalStorage chống mất dữ liệu khi gián đoạn mạng.
4. **Kết quả và Nhận xét (`StudentSubmissionResult.tsx`, `StudentFeedback.tsx`, `StudentGrades.tsx`)**:
   - Hiển thị bảng điểm chi tiết từng kỹ năng, nhận xét của giáo viên và highlight trực tiếp các lỗi được AI phân tích.

### Bước 3: Chuẩn Hóa Phân Hệ Giáo Viên (Teacher Studio)
1. **Teacher Dashboard & Classes (`TeacherDashboard.tsx`, `TeacherClasses.tsx`, `TeacherClassProgress.tsx`)**:
   - Bảng tổng quan thông minh hiển thị số bài tập chờ chấm, danh sách lớp học và biểu đồ kết quả học tập.
   - Lọc danh sách học sinh theo trạng thái nộp bài và tìm kiếm tức thì.
2. **Studio Soạn Thảo Bài Tập (`TeacherCreateAssignment.tsx`, `TeacherEditAssignment.tsx`)**:
   - Giao diện chia bước (Step wizard) rõ ràng: Cấu hình thông tin bài tập -> Chọn các module kỹ năng -> Nhập câu hỏi và đáp án -> Cài đặt thời hạn và số lượt làm.
   - Tự động làm mới dữ liệu và điều hướng về trang chi tiết sau khi lưu thành công.
3. **Studio Chấm Bài (`TeacherSubmissionDetails.tsx`)**:
   - Màn hình 2 cột chuyên nghiệp: Bên trái duyệt bài làm học sinh (nghe audio, đọc essay, xem PDF), Bên phải nhập điểm và nhận xét chi tiết từng tiêu chí.
   - Hỗ trợ lưu nháp nhận xét cục bộ (Draft Save) để giáo viên không bị mất dữ liệu khi chưa ấn nút Chốt điểm.

### Bước 4: Chuẩn Hóa Phân Hệ Quản Trị Viên (Admin Portal) & Shell Chung
1. **Admin Layout & Pages (`Accounts.tsx`, `Classes.tsx`, `AdminReports.tsx`, `AdminSettings.tsx`, `AdminGradingAuditLogs.tsx`)**:
   - Thống nhất bảng dữ liệu Data Table: Hỗ trợ phân trang, tìm kiếm, lọc theo vai trò, trạng thái tài khoản.
   - Modal thêm/sửa tài khoản và lớp học có validation mượt mà, thông báo toast tức thì.
2. **Global Shell & Auth (`Login.tsx`, `ForgotPassword.tsx`, `Navbar.tsx`, `Sidebar.tsx`, `ErrorPages`)**:
   - Thiết kế trang Đăng nhập / Quên mật khẩu tối giản, chuyên nghiệp.
   - Sidebar hỗ trợ thu gọn/mở rộng linh hoạt (responsive toggle), highlight menu đang chọn chính xác theo URL.
   - Trang lỗi 403, 404, 500 có hình minh họa thân thiện và nút quay về trang chủ.

---

## 3. CHECKLIST KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (QA & DOD CHECKLIST)

- [ ] Toàn bộ các file CSS được dọn dẹp, scoped hoặc kế thừa từ `design-tokens.css`, không còn class name collision.
- [ ] Không còn bất kỳ hàm `alert()` nào trên toàn frontend, thay thế 100% bằng hệ thống Toast / Notification banner.
- [ ] Mọi thao tác Mutation (Thêm lớp, tạo bài tập, nộp bài, đóng bài, chấm bài, cập nhật tài khoản) tự động làm mới dữ liệu trên giao diện mà không cần reload trang.
- [ ] Các màn hình tải dữ liệu hiển thị Skeleton Loader mượt mà, không giật layout.
- [ ] Kiểm thử hiển thị hoàn hảo trên các độ phân giải: 1920x1080 (Desktop), 1366x768 (Laptop), 768x1024 (Tablet).
- [ ] Chạy `npm --prefix frontend run build` đạt kết quả sạch (0 lỗi TypeScript, 0 cảnh báo nghiêm trọng).
- [ ] Chạy `npm --prefix frontend test` và `npm --prefix frontend run test:ui` đạt 100% pass, coverage > 80%.
- [ ] Mở Pull Request vào nhánh `develop` tuân thủ PR Convention Linter (`feat(FE-75): ...`).
- [ ] Phối hợp cùng `@Zawn-Tsu` (QA/Tester) nghiệm thu trên môi trường Staging.
