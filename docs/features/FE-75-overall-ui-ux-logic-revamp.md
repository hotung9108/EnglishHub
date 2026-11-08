# FE-75: Tái Thiết Kế Toàn Diện UI/UX và Chuẩn Hóa Logic Toàn Bộ Website EnglishHub

> **Mã tính năng:** `FE-75`  
> **Dự án:** EnglishHub  
> **Vai trò phụ trách:** Frontend Lead (`@Maloque18705` / `fe-primary`, `fe-secondary`)  
> **Tài liệu bàn giao:** `production_artifacts/pm_to_dev/FE-75-overall-ui-ux-logic-revamp.md`  
> **Nhánh Git dự kiến:** `feat/FE-75-overall-ui-ux-logic-revamp`  
> **Nhánh đích (Target):** `develop`  

---

## 1. BỐI CẢNH VÀ VẤN ĐỀ CẦN GIẢI QUYẾT

Hệ thống EnglishHub hiện tại đã hoàn thiện đầy đủ các chức năng cốt lõi (Xác thực, Quản lý lớp học, Tạo/nộp bài 4 kỹ năng Nghe-Nói-Đọc-Viết, Chấm điểm AI & Giáo viên, Báo cáo Admin). Tuy nhiên, giao diện người dùng và các luồng logic tương tác đang tồn tại nhiều hạn chế nghiêm trọng:

### 1.1. Phân Mảnh Hệ Thống Giao Diện (UI Inconsistencies & CSS Clashes)
- **Thiếu Design System tập trung**: Hệ thống styling bị chia cắt thành hơn 18 file CSS rải rác trong `frontend/src/styles/` (`layout.css`, `student-classes.css`, `teacher.css`, `admin-modern.css`, ...). Màu sắc, typography, kích thước khoảng cách (spacing), bán kính bo góc (border-radius) và bóng đổ (box-shadow) bị hard-code thủ công ở từng trang, không theo chuẩn Design Tokens.
- **Xung đột CSS Class Names (CSS Collisions)**: Nhiều file CSS dùng chung class names cấp thấp như `.card`, `.btn`, `.header`, `.title`, `.badge`, `.status` mà không có scoping/CSS modules, dẫn đến tình trạng import toàn bộ ở `main.tsx` làm trang này vô tình ghi đè giao diện của trang khác.
- **Trải nghiệm Responsive yếu**: Khi chuyển đổi giữa màn hình Desktop, Laptop và Mobile/Tablet, nhiều trang bị vỡ bố cục: bảng dữ liệu (Table) tràn màn hình không có thanh cuộn ngang độc lập, Sidebar che mất vùng làm bài thi, modals bị dài quá màn hình và mất nút xác nhận.
- **Visual Polish & Hierarchy**: Độ tương phản chữ (contrast ratio) nhiều nơi chưa đạt chuẩn WCAG (chữ xám trên nền xám nhạt), trạng thái hover/active/focus của các nút bấm và ô nhập liệu còn thô sơ hoặc giật lag.

### 1.2. Khiếm Khuyết Logic Tương Tác & Trạng Thái Ứng Dụng (UX & State Logic Bugs)
- **Lỗi stale data & thiếu đồng bộ sau thao tác**: Sau khi tạo bài tập, sửa bài, nộp bài hoặc thêm học sinh, bảng danh sách không tự làm mới dữ liệu cache (stale cache), buộc người dùng phải F5 lại trang thủ công.
- **Thiếu Skeleton Loading & Layout Shift**: Khi fetch dữ liệu API, giao diện bị giật cục hoặc trắng màn hình tạm thời do thiếu bộ Skeleton Loading đồng bộ.
- **Xử lý lỗi và phản hồi người dùng thiếu chuyên nghiệp**: Nhiều trang vẫn sử dụng `alert()` mặc định của trình duyệt hoặc hiển thị câu thông báo lỗi thô (raw error string từ backend) thay vì hệ thống Toast / Alert Banner có ngữ cảnh và hướng dẫn xử lý.
- **Luồng làm bài và nộp bài thi**: Logic đếm ngược thời gian bài thi, chuyển tab giữa các kỹ năng, trạng thái lưu nháp cục bộ (autosave) và phục hồi khi mạng gián đoạn cần được gia cố để đảm bảo học viên không bị mất bài làm.

---

## 2. MỤC TIÊU VÀ PHẠM VI DỰ ÁN (SCOPE & OBJECTIVES)

### 2.1. Mục Tiêu Cốt Lõi
1. **Thiết lập Design Tokens & Hệ thống Base Components chuẩn**: Định nghĩa bảng màu semantic, thang font chữ, spacing, bo góc trong CSS variables dùng chung; chuẩn hóa các Base Components (`Button`, `Input`, `Select`, `Card`, `Modal`, `Badge`, `Toast`, `SkeletonLoader`, `EmptyState`).
2. **Chuẩn hóa đồng bộ 4 Phân hệ chính**:
   - **Student Portal**: Dashboard, Danh sách lớp & bài tập, Phòng thi 4 kỹ năng (Exam Stepper Studio), Trang xem điểm & bài sửa chi tiết.
   - **Teacher Portal**: Dashboard, Quản lý lớp & học sinh, Studio soạn bài tập đa kỹ năng, Studio chấm bài tích hợp trình phát audio và highlight AI Annotation.
   - **Admin Portal**: Quản lý tài khoản, Phân quyền, Thống kê báo cáo, Cài đặt hệ thống, Lịch sử thao tác (Audit Logs).
   - **Auth & Global Shell**: Đăng nhập, Quên/Đổi mật khẩu, Navigation Header, Responsive Sidebar, Error Pages (403, 404, 500).
3. **Sửa dứt điểm các lỗi logic tương tác**: Quản lý state nhất quán, tự động làm mới dữ liệu sau mutation, validate form chặt chẽ với phản hồi trực quan, ngăn chặn submit trùng lặp (double submit guard).

---

## 3. ĐẶC TẢ KỸ THUẬT CHI TIẾT (TECHNICAL SPECIFICATIONS)

### 3.1. Tầng Nền Tảng (Foundation & Design Tokens)
- Tạo mới `frontend/src/styles/design-tokens.css` định nghĩa toàn bộ biến CSS:
  - **Màu sắc Semantic**:
    - Primary: `--color-primary-50` đến `--color-primary-900` (Brand Indigo/Blue).
    - Neutral: `--color-neutral-50` đến `--color-neutral-900` (Slate/Gray).
    - Feedback: `--color-success`, `--color-warning`, `--color-danger`, `--color-info`.
  - **Typography**: `--font-sans`, `--font-mono`, các cấp `--text-xs` đến `--text-4xl`.
  - **Spacing & Radius**: `--space-1` đến `--space-16`, `--radius-sm` đến `--radius-2xl`, `--radius-full`.
  - **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`.
- Refactor các file CSS hiện tại để kế thừa 100% từ Design Tokens, đóng gói selector theo prefix cụ thể (e.g. `.eh-student-*`, `.eh-teacher-*`, `.eh-admin-*`) để triệt tiêu vĩnh viễn tình trạng đè CSS chéo.

### 3.2. Chuẩn Hóa Base UI Components (`frontend/src/components/common/`)
- **`Button`**: Hỗ trợ các biến thể `primary`, `secondary`, `outline`, `ghost`, `danger`; kích cỡ `sm`, `md`, `lg`; trạng thái `isLoading` kèm spinner tích hợp, ngăn double-click.
- **`Input` / `Textarea` / `Select`**: Hỗ trợ hiển thị nhãn bắt buộc (`*`), icon hỗ trợ, thông báo lỗi (`errorMessage`), gợi ý (`helperText`), trạng thái disabled và readonly rõ ràng.
- **`Modal` & `Drawer`**: Căn giữa màn hình, hiệu ứng mở mượt (fade/slide), đóng bằng phím ESC và bấm overlay, chống scroll body khi mở modal, hỗ trợ scroll nội dung độc lập.
- **`Toast` & `NotificationProvider`**: Thông báo dạng nổi góc màn hình hỗ trợ 4 trạng thái (Success, Error, Warning, Info) với tự động ẩn sau 4 giây và nút đóng thủ công.
- **`SkeletonLoader`**: Hiệu ứng shimmering animation thay thế hoàn toàn các màn hình trắng khi đang tải dữ liệu.
- **`EmptyState`**: Minh họa đồ họa sạch kèm tiêu đề, mô tả và nút Call-to-Action (CTA) khi danh sách trống.

### 3.3. Phân Hệ Học Sinh (Student Experience)
1. **Student Dashboard & Classes**:
   - Thống kê tiến độ trực quan: số bài tập cần làm, hạn nộp gần nhất, điểm trung bình các kỹ năng.
   - Thẻ bài tập hiển thị rõ ràng trạng thái: `Chưa làm`, `Đang làm`, `Đã nộp - Chờ chấm`, `Đã chấm`.
2. **Student Assignment Workspace (Exam Stepper Studio)**:
   - Thanh điều hướng module trực quan: Nghe -> Nói -> Đọc -> Viết với đánh dấu hoàn thành từng phần.
   - Bộ đếm ngược thời gian (Countdown Timer) nổi bật, cảnh báo màu cam khi còn 5 phút và tự động nộp bài khi hết giờ.
   - Module Nghe: Trình phát audio mượt mà, hỗ trợ tua, chỉnh âm lượng, hiển thị số lần nghe cho phép.
   - Module Nói: Bộ thu âm có sóng âm (waveform/indicator), nút ghi âm, nghe lại và xóa ghi lại rõ ràng.
   - Module Đọc: Chia 2 cột (Cột đề văn bản dài có thanh cuộn riêng, Cột câu hỏi trắc nghiệm dễ chọn).
   - Module Viết: Trình soạn thảo văn bản có đếm số từ (word count) theo thời gian thực và hỗ trợ tải file đính kèm với thanh tiến trình upload.
3. **Student Feedback & Result**:
   - Trực quan hóa điểm số từng kỹ năng và điểm tổng quan.
   - Hiển thị nhận xét của giáo viên và highlight trực tiếp các đoạn văn bản được AI gắn cờ sửa lỗi ngữ pháp/từ vựng kèm giải thích chi tiết.

### 3.4. Phân Hệ Giáo Viên (Teacher Studio)
1. **Teacher Dashboard & Quản Lý Lớp**:
   - Bảng tổng quan hoạt động: lớp đang phụ trách, số bài cần chấm, biểu đồ phân bố điểm.
   - Bảng quản lý học sinh và danh sách lớp có tìm kiếm tức thì (debounced search), bộ lọc trạng thái và phân trang.
2. **Soạn Thảo Bài Tập (Assignment Creator & Editor)**:
   - Giao diện wizard từng bước trực quan: Thông tin chung -> Chọn kỹ năng -> Nhập đề & đáp án -> Cài đặt lịch mở/đóng và giới hạn lượt làm.
   - Trực quan hóa việc thêm câu hỏi, đáp án đúng, điểm số từng câu, upload audio mẫu.
3. **Teacher Grading Studio**:
   - Bố cục 2 cột chuyên nghiệp: Bên trái là bài làm của học sinh (nghe audio, đọc bài viết có highlight AI, xem bài nộp PDF), Bên phải là bảng chấm điểm chi tiết và ô nhập nhận xét.
   - Hỗ trợ lưu nháp nhận xét tự động (auto-save draft) để tránh mất dữ liệu khi mất mạng hoặc chưa chấm xong.

### 3.5. Phân Hệ Quản Trị Viên (Admin Portal)
- Chuẩn hóa layout Admin: Thanh Header gọn gàng, sidebar điều hướng sắc nét với icon sinh động.
- Trang Quản lý tài khoản: Bảng danh sách người dùng với bộ lọc Role (Admin, Teacher, Student), trạng thái kích hoạt, hành động Reset mật khẩu, Khóa/Mở tài khoản và Phân quyền.
- Trang Lịch sử chấm điểm (Audit Logs): Tìm kiếm và lọc theo thời gian, giáo viên, học sinh, xem lịch sử thay đổi điểm rõ ràng.

---

## 4. TIÊU CHUẨN HOÀN THÀNH (DEFINITION OF DONE - DOD)
- [ ] Xây dựng hoàn chỉnh hệ thống Design Tokens (`design-tokens.css`) và bộ Base UI Components.
- [ ] Toàn bộ 46+ trang thuộc 4 phân hệ (Student, Teacher, Admin, Auth) được rà soát và chuẩn hóa theo giao diện mới.
- [ ] Không còn xung đột class CSS; kiểm tra hiển thị responsive hoàn hảo trên Desktop (1920x1080, 1440x900), Laptop (1280x800) và Tablet (768x1024).
- [ ] Khắc phục 100% các lỗi logic: tự động refresh dữ liệu sau thao tác, hiển thị Skeleton khi load, toast thông báo lỗi thân thiện, bảo vệ form tránh double submit.
- [ ] Chạy Project Doctor (`/doctor` hoặc lệnh test tương ứng) đạt 100% Quality Gates.
- [ ] Code compile & build sạch sẽ (`npm --prefix frontend run build` không lỗi).
- [ ] Bộ unit test frontend (`npm --prefix frontend test` & `npm --prefix frontend run test:ui`) pass 100%.
- [ ] Mở Pull Request vào nhánh `develop` với tiêu đề chuẩn `feat(FE-75): comprehensive ui ux redesign and logic revamp across platform`.
- [ ] Đội Tester (`@Zawn-Tsu`) kiểm thử thực tế trên Staging, xác nhận ĐẠT và đóng thẻ Trello sang cột Done.
