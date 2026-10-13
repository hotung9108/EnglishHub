# Design Brief — Minimal SaaS EnglishHub Platform

**Phiên bản:** 2.0 (Đã đồng bộ hóa với Kiến trúc Kỹ thuật & Backend Schema V6 của EnglishHub)  
**Sản phẩm:** Nền tảng quản lý bài tập và chấm điểm tiếng Anh trực tuyến hỗ trợ AI (EnglishHub)  
**Vai trò người dùng:** 3 Vai trò — **Quản trị viên (Admin)**, **Giáo viên (Teacher)**, **Học viên (Student)**  
**Định hướng thiết kế:** Minimal SaaS · Thanh lịch · Hiện đại · Tối ưu trải nghiệm (Lấy cảm hứng từ Linear, Notion, Vercel)

---

## 1. Tầm Nhìn & Nguyên Tắc Thiết Kế (Design Vision & Principles)

### 1.1. Mục Tiêu
Xây dựng giao diện học tập và giảng dạy tiếng Anh trực tuyến tinh gọn, chuyên nghiệp, hiện đại và dễ tiếp cận:
- **Admin**: Quản lý tập trung toàn bộ tài khoản, lớp học, giáo viên, học viên và báo cáo hệ thống.
- **Giáo viên**: Tạo và quản lý bài tập 4 kỹ năng (Nghe, Nói, Đọc, Viết), chấm điểm bài nộp với sự hỗ trợ của AI, theo dõi tiến độ lớp học.
- **Học viên**: Theo dõi hạn nộp bài tập, làm bài trực tuyến tập trung (với audio player, microphone recorder, essay editor), xem điểm số và nhận xét chi tiết từ giáo viên và AI.

### 1.2. Nguyên Tắc Thiết Kế Cốt Lõi
- **Minimal (Tối giản):** Loại bỏ mọi thành phần trang trí thừa thãi không phục vụ mục đích học tập hay quản lý.
- **Refined & Elegant (Tinh tế):** Tận dụng khoảng trắng (generous whitespace), typography chuẩn mực và bảng màu trung tính trang nhã.
- **Functional (Đúng trọng tâm):** Thông tin quan trọng (Hạn nộp, Điểm số, Trạng thái bài làm, Nút hành động chính) phải nổi bật ngay trong tầm mắt.
- **Consistent (Đồng bộ hệ thống):** Toàn bộ 3 vai trò dùng chung một Design System, đồng bộ về components, layout và ngôn ngữ tương tác.
- **Accessible (Dễ tiếp cận):** Đảm bảo độ tương phản màu sắc cao, hỗ trợ thao tác bàn phím, không bao giờ dùng duy nhất màu sắc để biểu thị trạng thái.

---

## 2. Ràng Buộc Kỹ Thuật Dự Án (Technical Architecture Constraints)

> [!IMPORTANT]
> Toàn bộ thiết kế và code Frontend phải tuân thủ nghiêm ngặt quy chuẩn tại [.agents/rules/convention-fe.md](file:///D:/Coding/EnglishHub/.agents/rules/convention-fe.md). Tuyệt đối **không** áp dụng các công nghệ nằm ngoài stack quy định.

| Hạng mục | Quy chuẩn bắt buộc của EnglishHub | Lưu ý so với brief cũ |
| :--- | :--- | :--- |
| **Framework** | **React 19 + Vite + TypeScript (Strict Mode)** | Không dùng Next.js |
| **Routing** | **React Router DOM (v7)** kèm [`ProtectedRoute`](file:///D:/Coding/EnglishHub/frontend/src/components/auth/ProtectedRoute.tsx) kiểm soát RBAC | Không dùng file-based routing của Next.js |
| **Styling** | **Vanilla CSS với CSS Custom Properties (Variables)** tại `src/styles/` (`index.css`, `layout.css`, `admin.css`, `teacher.css`, `student.css`, `auth.css`) | **Không dùng Tailwind CSS** |
| **UI Primitives** | Components tự xây dựng chuẩn dùng chung tại `src/components/common/` (`Button`, `Card`, `Input`, `Select`, `Table`, `Modal`, `Badge`, `EmptyState`) | Không phụ thuộc shadcn/ui hay Radix UI |
| **Icons** | **Lucide React (`lucide-react`)** | Đồng bộ toàn bộ icon hệ thống |
| **Form Handling** | React Controlled State + Modular Validator Helpers tại `src/utils/` | Không cài thêm React Hook Form / Zod |
| **API Client** | **Axios (`src/api/`)** ánh xạ chuẩn DTO backend `ApiResponse<T>` | Gắn tự động Bearer Token |
| **Localization** | **Song ngữ Tiếng Việt & Tiếng Anh (i18n)** tại `src/locales/` | Đảm bảo font chữ hiển thị tiếng Việt hoàn hảo |
| **Dữ liệu & Backend** | Khớp 100% với **16 bảng DB Schema V6**; loại bỏ mọi trang/trường dữ liệu ảo (phantom routes/fields) | Không có tính năng Lịch (Calendar) hay Ngân hàng đề (Exam Bank) |

---

## 3. Hệ Thống Màu Sắc & Design Tokens (Color System)

Bảng màu được xây dựng dựa trên nền tảng trung tính ấm (Warm Neutral), điểm xuyết màu nhấn Indigo/Blue hiện đại cho các hành động chính.

### 3.1. Bảng Màu Nền Tảng (Foundation Palette)

| Token CSS | Tên màu | Giá trị Hex | Ứng dụng |
| :--- | :--- | :--- | :--- |
| `--background` | Warm Off-White / Gray | `#FAFAF9` | Màu nền canvas toàn ứng dụng |
| `--surface` | Pure White | `#FFFFFF` | Nền thẻ Card, Modal, Panel, Bảng dữ liệu |
| `--surface-container-low` | Light Neutral | `#F3F4F6` | Nền thanh TopBar, header bảng, input disabled |
| `--on-background` | Deep Charcoal | `#111827` | Tiêu đề chính và nội dung văn bản quan trọng |
| `--on-surface-variant` | Muted Gray | `#6B7280` | Nhãn phụ, mô tả ngắn, metadata |
| `--outline-variant` | Subtle Border | `#E5E7EB` | Đường viền 1px cho card, divider, ô nhập liệu |
| `--primary` | Modern Indigo / Blue | `#4F46E5` | Nút hành động chính (Primary CTA), link, active tab |
| `--on-primary` | White | `#FFFFFF` | Màu chữ trên nền nút primary |

### 3.2. Màu Trạng Thái Nghiệp Vụ (Semantic Colors)

| Token CSS | Giá trị Hex | Nền nhạt (Badge) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `--secondary` (Success) | `#16A34A` | `#DCFCE7` | Hoàn thành, đã nộp bài, đã chấm điểm |
| `--tertiary` (Warning) | `#D97706` | `#FEF3C7` | Sắp đến hạn nộp (Due soon), đang chấm bài |
| `--error` (Danger) | `#DC2626` | `#FEE2E2` | Quá hạn, thao tác xóa, lỗi xác thực, hủy |

### 3.3. Màu Nhận Diện 4 Kỹ Năng Tiếng Anh (English 4 Skills Tokens)

| Kỹ năng | Màu chủ đạo | Nền Badge | Viền |
| :--- | :--- | :--- | :--- |
| **Listening (Nghe)** | `#0284C7` (Sky Blue) | `#E0F2FE` | `#BAE6FD` |
| **Speaking (Nói)** | `#7C3AED` (Purple) | `#EDE9FE` | `#DDD6FE` |
| **Reading (Đọc)** | `#059669` (Emerald) | `#D1FAE5` | `#A7F3D0` |
| **Writing (Viết)** | `#D97706` (Amber) | `#FEF3C7` | `#FDE68A` |

### 3.4. Nguyên Tắc Ứng Dụng Màu Sắc
- Giữ **75–80%** diện tích giao diện trong vùng trung tính (`#FAFAF9` và `#FFFFFF`).
- Màu nhấn Indigo (`#4F46E5`) chỉ xuất hiện tại các điểm kích hoạt hành vi (CTA) chính.
- Tuyệt đối không dùng gradient màu tím/xanh đậm toàn trang, không dùng hiệu ứng bóng đổ nặng nề hay glassmorphism lòe loẹt.
- Luôn kết hợp màu sắc trạng thái với **icon và text label rõ ràng** (Ví dụ: Icon Checkmark + "Đã nộp", không để mỗi chấm tròn màu xanh).

---

## 4. Bố Cục, Tỷ Lệ & Khoảng Cách (Layout & Proportions)

### 4.1. Thông Số Chuẩn Cho Màn Hình Desktop (1440 × 900 px)

| Thành phần | Kích thước chuẩn | Ghi chú CSS |
| :--- | :--- | :--- |
| **TopBar / Header** | 64 px | Cố định, nền trắng `--surface`, viền dưới 1px |
| **Desktop Sidebar** | 240 px | Cố định bên trái, nền trắng, phân nhóm bằng spacing |
| **Main Content Padding** | 32 px | Khoảng cách padding vùng nội dung chính |
| **Section Spacing** | 24–32 px | Khoảng cách giữa các khối chức năng |
| **Card Gap** | 16–20 px | Khoảng cách grid giữa các card |
| **Card Padding** | 20–24 px | Đệm trong của card dữ liệu |
| **Button / Input Height** | 40–44 px | Chiều cao chuẩn, chuẩn hóa touch target |
| **Border Radius Scale** | `8px` (sm/input) · `12px` (md/card) · `16px` (lg/modal) · `9999px` (pill) | Bo góc tinh tế, không bo tròn quá mức |
| **Shadow Scale** | `--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);` `--shadow-card: 0 4px 12px rgba(0,0,0,0.03);` | Đổ bóng cực nhẹ, thanh thoát |

### 4.2. Khả Năng Thích Ứng Màn Hình (Responsive Breakpoints)
- **Desktop (≥ 1024 px):** Sidebar luôn hiển thị. Bảng dữ liệu và grid cards hiển thị 3–4 cột.
- **Tablet (768–1023 px):** Sidebar có thể thu gọn (collapse). Grid thẻ bài tập tự động co về 2 cột.
- **Mobile (< 768 px):** Sidebar chuyển đổi thành Mobile Drawer (mở bằng nút menu góc trái TopBar). Thẻ bài tập và bảng dữ liệu chuyển sang dạng danh sách thẻ xếp chồng 1 cột. Không phát sinh thanh cuộn ngang trang (horizontal scroll).

---

## 5. Typography (Phông Chữ & Hệ Thống Thứ Bậc)

- **Font Family:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- Ưu tiên hiển thị dấu tiếng Việt sắc nét, chuẩn Unicode.

| Cấp bậc | Cỡ chữ (Font size) | Độ đậm (Font weight) | Ứng dụng |
| :--- | :--- | :--- | :--- |
| **Page Title** | 26–28 px | 650–700 | Tiêu đề chính đầu trang |
| **Section Title** | 18–20 px | 600 | Tiêu đề nhóm card, tiêu đề bảng |
| **Card Title / Heading** | 15–16 px | 600 | Tên bài tập, tên lớp học |
| **Body Text** | 14–15 px | 400–500 | Nội dung bài viết, đề bài, dữ liệu bảng |
| **Caption / Helper** | 12–13 px | 400 | Hạn nộp, số câu hỏi, chú thích, ngày tháng |

---

## 6. Quy Chuẩn Các Components Dùng Chung (`src/components/common/`)

Mọi component tuân thủ nghiêm ngặt [convention-fe.md](file:///D:/Coding/EnglishHub/.agents/rules/convention-fe.md), định nghĩa props type rõ ràng, không dùng `any`:

### 6.1. Buttons
- **`btn-primary`**: Nền `--primary` (`#4F46E5`), chữ trắng. Mỗi màn hình chỉ có duy nhất 1 nút Primary chính (như *Tạo bài tập*, *Nộp bài*, *Lưu điểm*).
- **`btn-secondary`**: Nền trắng, viền `--outline-variant` 1px, chữ `--on-background`. Dùng cho hành động phụ (như *Hủy*, *Quay lại*, *Lọc*).
- **`btn-ghost`**: Không nền, không viền, đổi màu nhẹ khi hover. Dùng cho nút icon hoặc thao tác nhanh.
- **`btn-danger`**: Nền đỏ `--error` hoặc viền đỏ khi thực hiện hành động xóa/hủy nhạy cảm.

### 6.2. Cards & Metric Cards
- Nền trắng tinh khiết, viền mảnh 1px (`#E5E7EB`), bo góc 12px, bóng đổ mờ nhẹ (`--shadow-card`).
- Card chỉ số KPI: Tập trung vào 1 con số lớn (28–32px), 1 nhãn miêu tả ngắn gọn (13px), và 1 icon minh họa nhỏ gọn.

### 6.3. Bảng Dữ Liệu (`adm-table`)
- Chiều cao dòng (row height): 48–56 px.
- Header nền xám nhẹ (`#F9FAFB`), chữ in hoa nhỏ (12px, weight 600, color `#6B7280`).
- Dòng có hiệu ứng hover mượt mà (`background-color: #F9FAFB`).
- Tích hợp ô tìm kiếm, phân trang (pagination) và thông báo rỗng chuẩn mực.

### 6.4. Form Controls (Input, Select, Textarea)
- Chiều cao 40–44 px, viền 1px `#E5E7EB`, bo góc 8px.
- Hiệu ứng focus: Đường viền chuyển màu Indigo kèm vòng sáng tinh tế (`box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1)`).
- Tiêu đề nhãn (Label) luôn nằm phía trên ô nhập liệu kèm dấu `*` đỏ cho trường bắt buộc.

### 6.5. Trạng Thái Giao Diện Bắt Buộc (UI States)
Mọi trang và component tải dữ liệu đều phải xử lý trọn vẹn 3 trạng thái:
1. **`isLoading`**: Sử dụng Skeleton Loading thanh lịch (nền nhịp điệu shimmer) thay cho vòng xoay đơn điệu.
2. **`isError`**: Khối thông báo lỗi với icon cảnh báo, nội dung rõ ràng và nút **Thử lại (Retry)**.
3. **`isEmpty`**: Component `EmptyState` đồng bộ với icon minh họa tối giản, tiêu đề, mô tả và nút CTA dẫn hướng.

---

## 7. Yêu Cầu Chi Tiết UX Theo 3 Vai Trò (Role Workspaces)

### 7.1. Phân Hệ Quản Trị Viên (Admin Workspace)
**Mục tiêu:** Quản trị toàn bộ tổ chức trường học/trung tâm một cách mạch lạc, tin cậy.

- **Admin Dashboard (`/admin/dashboard`)**:
  - 4 thẻ KPI tổng quan: Tổng tài khoản, Tổng số giáo viên, Tổng số học sinh, Tổng số lớp đang hoạt động.
  - Danh sách lớp học mới nhất và hoạt động gần đây.
- **Quản lý Tài khoản (`/admin/accounts`)**:
  - Bảng danh sách tài khoản kèm bộ lọc theo vai trò (Admin, Teacher, Student) và trạng thái hoạt động.
  - Modal tạo tài khoản mới và chức năng khóa/mở khóa tài khoản.
- **Quản lý Lớp học (`/admin/classes`)**:
  - Danh sách lớp, tìm kiếm theo tên lớp, gán giáo viên phụ trách và thêm học sinh vào lớp.
- **Quản lý Giáo viên (`/admin/teachers`) & Học sinh (`/admin/students`)**:
  - Bảng thông tin chi tiết, liên kết tới danh sách lớp tham gia.
- **Báo cáo Thống kê (`/admin/reports`)**:
  - 4 thẻ KPI đo lường: Tổng bài nộp, Tỷ lệ nộp bài, Điểm trung bình hệ thống, Số bài đã chấm.
  - Bảng kết quả học tập chi tiết theo từng lớp (Sĩ số, bài tập, tỷ lệ nộp, điểm TB) hiển thị trực diện.
- **Cài đặt Hệ thống (`/admin/settings`)**:
  - Cấu hình thông tin trường học, đổi mật khẩu và tùy chọn hệ thống.

---

### 7.2. Phân Hệ Giáo Viên (Teacher Workspace)
**Mục tiêu:** Quản lý lớp học, soạn bài tập 4 kỹ năng thuận tiện và chấm điểm nhanh chóng với trợ lý AI.

- **Teacher Dashboard (`/teacher/dashboard`)**:
  - Thẻ KPI: Lớp đang dạy, Bài tập đang mở, Bài nộp chờ chấm.
  - Lối tắt nhanh: Tạo bài tập mới, Xem bài nộp cần chấm ngay.
- **Quản lý Lớp học (`/teacher/classes`, `/teacher/classes/:id`)**:
  - Danh sách lớp học dạng card sạch sẽ; trang chi tiết lớp hiển thị danh sách học viên và bảng tiến độ nộp bài.
- **Quản lý Bài tập (`/teacher/assignments`)**:
  - Bảng danh sách bài tập kèm bộ lọc theo lớp, kỹ năng (Nghe, Nói, Đọc, Viết) và trạng thái (Mở / Đóng).
  - Nút chuyển trạng thái Mở/Đóng bài tập nhanh.
- **Tạo & Chỉnh sửa bài tập (`/teacher/assignments/create`, `:id/edit`)**:
  - Thông tin chung: Tiêu đề, chọn lớp, hạn nộp (deadline), số lần nộp tối đa (`maxSubmissions`).
  - **Trình soạn thảo chuyên biệt cho 4 kỹ năng**:
    - **Listening**: Tải lên file âm thanh (Audio URL/file), tạo danh sách câu hỏi trắc nghiệm hoặc điền từ ngắn.
    - **Speaking**: Soạn chủ đề nói, mô tả câu hỏi, thời lượng ghi âm tối đa.
    - **Reading**: Soạn đoạn văn đọc hiểu (Passage), tạo các câu hỏi trắc nghiệm nội dung bên cạnh.
    - **Writing**: Soạn đề bài luận, gợi ý dàn ý, cấu hình số từ tối thiểu và tối đa.
- **Chấm điểm & Nhận xét (`/teacher/assignments/:id/submissions`, `/teacher/submissions/:id/grade`)**:
  - Danh sách bài nộp của học sinh (đã nộp, đang chấm, đã trả kết quả).
  - Không gian chấm bài:
    - Trình phát Audio nghe bài học sinh thu âm (Speaking) hoặc Trình xem bài viết (Writing).
    - **Khối gợi ý chấm điểm từ AI**: Điểm đề xuất, nhận xét ngữ pháp, từ vựng và độ trôi chảy.
    - Giáo viên có quyền điều chỉnh điểm số (thang 0–10) và chỉnh sửa lời nhận xét trước khi gửi cho học sinh.

---

### 7.3. Phân Hệ Học Viên (Student Workspace)
**Mục tiêu:** Nắm bắt lịch nộp bài tập, hoàn thành bài làm tập trung, không phân tâm và thấu hiểu kết quả học tập.

- **Student Dashboard (`/student/dashboard`)**:
  - Khối **"Bài tập cần làm gấp" (Upcoming Deadlines)** đặt ngay vị trí trang trọng nhất.
  - Danh sách lớp học đang theo học và kết quả bài tập đã chấm gần đây.
- **Danh sách Bài tập (`/student/assignments`)**:
  - Bộ lọc theo lớp học, theo kỹ năng (Nghe, Nói, Đọc, Viết) và theo trạng thái (Chưa nộp, Đã nộp, Đã chấm).
  - Thẻ bài tập hiển thị rõ ràng: Kỹ năng (Badge màu), Tên bài tập, Hạn nộp còn lại, Số lượt nộp còn lại.
- **Không gian Làm bài Trực tuyến 4 Kỹ năng (`/student/assignments/:id/take`)**:
  - Giao diện làm bài chuyên sâu (Distraction-free workspace):
    - **Listening**: Trình phát audio nghe bài rõ ràng kèm danh sách câu hỏi trắc nghiệm/điền từ bên dưới.
    - **Speaking**: Giao diện thu âm microphone tích hợp sóng âm (waveform), bộ đếm thời gian thực và nút nghe lại trước khi gửi.
    - **Reading**: Bố cục 2 cột (Cột trái: Đoạn văn đọc hiểu; Cột phải: Bộ câu hỏi trắc nghiệm), hỗ trợ cuộn độc lập.
    - **Writing**: Trình soạn thảo văn bản sạch sẽ kèm bộ đếm số từ tự động thời gian thực (Word Counter).
  - Thanh cảnh báo chống mất dữ liệu khi vô tình rời trang (Unsaved changes guard).
  - Modal xác nhận nộp bài hiển thị tóm tắt trước khi gửi chính thức.
- **Xem Kết quả & Phản hồi (`/student/grades`, `/student/feedback`)**:
  - Điểm số thang 0–10 rõ ràng cho từng bài nộp.
  - Khối phản hồi chi tiết: Nhận xét của giáo viên và nhận xét phân tích từ AI.
- **Phân tích Kỹ năng Học tập (`/student/analytics`)**:
  - Theo dõi mức độ tiến bộ qua từng tuần/tháng trên 4 kỹ năng Listening, Speaking, Reading, Writing.

---

## 8. Những Điều Cần Tránh Tuyệt Đối (Anti-Patterns to Avoid)

1. **Tuyệt đối không đưa vào các tính năng "ảo" (Phantom Features)** không tồn tại trong backend DB: Lịch (Calendar), Ngân hàng đề thi (Exam Bank), Quản lý vai trò riêng lẻ (`/admin/roles`), Thiết bị đăng nhập (`sessions`), Cài đặt 2FA ảo.
2. **Tuyệt đối không dùng Tailwind CSS hay thư viện ngoài**: Toàn bộ styling phải viết bằng Vanilla CSS với token định nghĩa trong `src/styles/` theo `convention-fe.md`.
3. **Tuyệt đối không dùng thuật ngữ IELTS hàn lâm hoặc thang điểm 9.0**: Luôn dùng 4 kỹ năng chuẩn (Listening, Speaking, Reading, Writing) và thang điểm 10 tiêu chuẩn giáo dục.
4. **Không lạm dụng biểu đồ trang trí**: Chỉ hiển thị số liệu khi đem lại giá trị thực tế cho học viên/giáo viên.
5. **Không dùng bóng đổ quá đậm hoặc hiệu ứng neon/gradient tím xanh**: Giữ vững tinh thần Minimal SaaS thanh lịch, tinh gọn của Linear/Notion.
6. **Không để bảng dữ liệu tràn viền ngang (horizontal scroll) trên di động**: Luôn chuyển đổi bảng thành danh sách card trên màn hình nhỏ hơn 768px.

---

## 9. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- [ ] Giao diện thể hiện rõ nét ngôn ngữ **Minimal SaaS**: Nền trung tính ấm `#FAFAF9`, bề mặt thẻ trắng `#FFFFFF`, điểm nhấn `#4F46E5`, đường viền tinh tế 1px `#E5E7EB`.
- [ ] Cả 3 vai trò (Admin, Giáo viên, Học viên) sử dụng chung một hệ thống design tokens và component dùng chung tại `src/components/common/`.
- [ ] Soạn thảo và làm bài 4 kỹ năng (Nghe, Nói, Đọc, Viết) hoạt động mượt mà, trực quan, hỗ trợ microphone và audio player.
- [ ] Tích hợp đầy đủ khối gợi ý chấm điểm từ AI trong luồng chấm bài của giáo viên.
- [ ] Tuân thủ 100% quy chuẩn [.agents/rules/convention-fe.md](file:///D:/Coding/EnglishHub/.agents/rules/convention-fe.md).
- [ ] Không có lỗi TypeScript (`npx tsc -b` exit code 0).
- [ ] Toàn bộ bộ test Vitest (`npm test -- --run`) đạt 100% passed.
- [ ] Không có hiện tượng vỡ layout hay tràn ngang trang ở kích thước màn hình Mobile, Tablet và Desktop.
- [ ] Mọi màn hình tải dữ liệu có đầy đủ trạng thái Loading Skeleton, Empty State và Error Retry.
