# Đặc Tả Kỹ Thuật (PM Spec): [FE-109] Tối Ưu Hóa Giao Diện Thân Thiện Với Thiết Bị Di Động (Mobile Responsive UI/UX)

> **Mã Nhiệm Vụ:** FE-109  
> **Thẻ Trello:** [#580 (https://trello.com/c/rF3hUuXh)](https://trello.com/c/rF3hUuXh)  
> **Người Phụ Trách Chính:** Trần Tiến Sơn (`@tinsntrn` / `Maloque18705` - Frontend Developer Primary)  
> **Người Duyệt & Hướng Dẫn:** Hồ Việt Tùng (`@hvittung` / `hotung9108` - Technical Lead)  
> **Kiểm Thử & Nghiệm Thu:** Nguyễn Văn Tú (`@zawntsu` / `Zawn-Tsu` - QA/Tester)  
> **Hạn Hoàn Thành (Sprint 10):** 24/11/2026 23:59 (UTC+7)  
> **Target Branch:** `feat/FE-109-mobile-responsive-ui-ux` -> `develop`

---

## 1. Bối Cảnh & Mục Tiêu Nghiệp Vụ (Context & Business Value)
Hệ thống **EnglishHub** hiện tại đã vận hành tốt trên môi trường máy tính để bàn (Desktop viewport >= 1024px). Tuy nhiên, đối tượng Học viên (Student) và Giáo viên (Teacher) có nhu cầu truy cập thường xuyên qua điện thoại thông minh (Smartphones) và máy tính bảng (Tablets) để:
1. Xem thông báo, danh sách bài tập được giao.
2. Làm bài thi trắc nghiệm, đọc hiểu Reading, nghe Listening, nộp bài viết Writing hoặc ghi âm Speaking.
3. Giáo viên theo dõi danh sách bài nộp, mở/khóa bài tập nhanh chóng khi di chuyển.

**Mục tiêu của FE-109:** Đảm bảo toàn bộ ứng dụng EnglishHub đạt tiêu chuẩn **Mobile-First Responsive** từ màn hình 375px (iPhone SE) đến 768px (iPad Mini), loại bỏ triệt để hiện tượng vỡ layout, tràn ngang màn hình, và tối ưu hóa vùng chạm cảm ứng theo tiêu chuẩn WCAG 2.1 & Apple Human Interface Guidelines.

---

## 2. Phạm Vi Chi Tiết & Giải Pháp Kỹ Thuật (Scope of Work & Technical Solutions)

### 2.1. Thanh Điều Hướng & Bố Cục Chung (Global Navigation & Layout)
- **Component:** `frontend/src/components/layout/Sidebar.tsx`, `Header.tsx`, `App.tsx`.
- **Yêu cầu:**
  * Màn hình nhỏ (`max-width: 768px`): Ẩn Sidebar cố định bên trái; thay thế bằng biểu tượng **Hamburger Menu** (`FiMenu`) ở góc trên Header.
  * Khi bấm Hamburger Menu: Mở **Mobile Drawer Navigation** trượt từ cạnh trái sang (có overlay làm mờ nền). Tự động đóng drawer khi bấm vào một liên kết trang hoặc bấm ra ngoài overlay.
  * Tối ưu hóa Header trên mobile: Rút gọn breadcrumb, ẩn bớt text phụ, giữ logo nhỏ gọn và avatar tài khoản.
  * Đảm bảo an toàn vùng hiển thị (`safe-area-inset-top`, `safe-area-inset-bottom`) cho các dòng điện thoại có tai thỏ (Notch / Dynamic Island).

### 2.2. Giao Diện Làm Bài Thi Của Học Viên (Student Exam Studio)
- **Components:** 
  * `StudentAssignmentReading.tsx` (Reading)
  * `StudentAssignmentWriting.tsx` (Writing)
  * `StudentAssignmentQuiz.tsx` (Quiz / Multiple Choice / Listening)
  * `AudioRecorder.tsx`, `AudioPlayer.tsx` (Speaking / Listening)
- **Yêu cầu:**
  * **Tránh Tràn Ngang**: Kiểm tra và loại bỏ triệt để `overflow-x` không mong muốn (đặc biệt các đoạn văn bản dài, thẻ code, ảnh minh họa hoặc audio player). Đặt `max-width: 100%` và `box-sizing: border-box`.
  * **Reading**: Bố cục 2 cột (Bài đọc bên trái, Câu hỏi bên phải) trên desktop phải tự động chuyển thành **1 cột dạng dọc (Single Column)** hoặc hỗ trợ **Tab chuyển đổi** (Tab 1: Bài Đọc - Tab 2: Câu Hỏi) trên mobile để học sinh không bị rối mắt.
  * **Writing**: Ô nhập bài văn (`textarea` / markdown editor) tự động giãn chiều cao, không bị bàn phím ảo (virtual keyboard) che khuất nút Nộp bài. Ghim thanh Floating Action Bar chứa nút "Nộp bài" và số đếm từ ở đáy màn hình.
  * **Speaking & Listening**: Nút Bắt đầu ghi âm / Phát audio có đường kính tối thiểu 56px, đặt ở vị trí ngón tay cái dễ chạm (Thumb Zone).

### 2.3. Bảng Dữ Liệu & Danh Sách (Data Tables & List Views)
- **Components:** `StudentAssignments.tsx`, `TeacherAssignments.tsx`, `ClassList.tsx`, `TeacherGradebook.tsx`.
- **Yêu cầu:**
  * Các bảng dữ liệu phức tạp nhiều cột: 
    * Cách 1 (Khuyến nghị cho danh sách bài tập/lớp): Tự động chuyển đổi từ `<table />` sang danh sách dạng thẻ (**Card View**) trên màn hình `<640px`.
    * Cách 2: Bọc trong container có thuộc tính `overflow-x-auto` kèm thanh cuộn mềm (`scrollbar-thin`) và chỉ báo cuộn ngang mượt mà, không vỡ layout bao quanh.

### 2.4. Vùng Cảm Ứng & Tương Tác Cảm Ứng (Touch Targets & Micro-interactions)
- **Chuẩn Accessibility:** Kích thước tối thiểu cho mọi thành phần tương tác (nút bấm, icon, checkbox, radio, tab) là **44 x 44px** (theo chuẩn WCAG 2.1 AA).
- Khoảng cách giữa các nút hành động (ví dụ: Nút "Xóa" và "Sửa", nút "Hủy" và "Xác nhận") tối thiểu **8px - 12px** để chống bấm nhầm trên màn hình cảm ứng.

### 2.5. Hộp Thoại & Popup (Modals & Dialogs)
- **Components:** `Modal.tsx`, `ConfirmDialog.tsx`, các drawer chi tiết.
- **Yêu cầu:**
  * Trên mobile (`<640px`): Các hộp thoại popup chuyển đổi sang dạng **Bottom Sheet** trượt từ dưới lên hoặc chiếm toàn màn hình (Full-screen Modal) với nút Đóng (X) lớn ở góc trên bên phải.

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. **Responsive Viewport Coverage**:
   * Kiểm thử đạt 100% trên các thiết bị DevTools:
     - iPhone SE (375 x 667)
     - iPhone 14/15 Pro (393 x 852)
     - Samsung Galaxy S20/S22 (360 x 800 & 412 x 915)
     - iPad Mini (768 x 1024)
2. **Không Vỡ Giao Diện**: Không xuất hiện thanh cuộn ngang trang (horizontal page scrollbar) ở bất kỳ trang nào.
3. **Quy Trình Học Viên Trơn Tru**: Học viên có thể đăng nhập, xem danh sách bài, mở đề, làm bài 4 kỹ năng và nộp bài hoàn chỉnh trên điện thoại.
4. **Touch Friendly**: Vùng chạm nút bấm và khoảng cách thao tác đạt chuẩn >= 44px.
5. **Quality Gates**:
   * Chạy `npm --prefix frontend run test` pass 100%.
   * Chạy `npm --prefix frontend run build` và `npm --prefix frontend run lint` 0 lỗi, 0 cảnh báo.

---

## 4. Hướng Dẫn Handoff Cho Developer (`@Maloque18705`)
1. Tạo branch: `git checkout -b feat/FE-109-mobile-responsive-ui-ux origin/develop`
2. Ưu tiên chỉnh sửa CSS utility / Tailwind / Responsive media queries trong các component layout chính và trang làm bài học sinh.
3. Chạy kiểm thử: `npm --prefix frontend test` và `npm --prefix frontend run build`.
4. Mở PR vào `develop`, gắn link thẻ Trello `#580` và yêu cầu `@zawntsu` cùng `@hotung9108` review.
