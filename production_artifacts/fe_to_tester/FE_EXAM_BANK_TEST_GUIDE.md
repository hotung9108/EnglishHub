# Hướng dẫn Kiểm thử Frontend: Kho đề thi & Đề mẫu (Exam Bank) cho Giáo viên

**Người thực hiện**: @fe-primary  
**Người nhận**: @tester  
**Tính năng**: Kho đề thi & Đề mẫu (Exam Bank) phân loại theo 4 kỹ năng cho Giáo viên  
**Branch / Commit**: `feature/teacher-exam-bank`  
**Ngày bàn giao**: 2026-09-26  

---

## 1. Tổng quan tính năng
Trang **Kho đề thi** (`/teacher/exam-bank`) cung cấp cho giáo viên thư viện bài tập & đề thi chuẩn hóa phân loại theo 4 kỹ năng tiếng Anh (Writing, Speaking, Reading, Listening). Giáo viên có thể:
1. Truy cập trực tiếp qua menu sidebar **Kho đề thi & Mẫu** (icon `Library`) trong nhóm giảng dạy.
2. Lọc nhanh danh sách theo 4 kỹ năng (Writing, Speaking, Reading, Listening) kèm huy hiệu số lượng.
3. Tìm kiếm theo từ khóa (tiêu đề, mã đề, nguồn, thẻ chủ đề) và lọc theo Format (IELTS Academic, Cambridge...) & Target Band (Band 5.5 - 6.5, Band 6.5 - 7.5, Band 7.5+...).
4. **Xem trước chi tiết đề thi (`ExamDetailModal`)**: xem đề bài chi tiết, audio player (Listening), dàn ý / sample response (Writing/Speaking), passage (Reading), và tiêu chí chấm chuẩn (Rubric criteria).
5. **Giao bài nhanh cho lớp (`QuickAssignModal`)**: tự động tạo mã bài tập, cho phép chọn lớp (`ENG-IELTS-6.5A`, `ENG-IELTS-7.0B`...), cấu hình hạn nộp, cho phép nộp trễ và gửi thông báo cho học sinh.
6. **Sao chép vào trình tạo bài tập**: chuyển thẳng sang màn hình tạo bài tập (`/teacher/assignments/create?type={skill}&templateId={id}`) để giáo viên tiếp tục tinh chỉnh nội dung.

---

## 2. Đường dẫn và Điều hướng
- **URL chính**: `http://localhost:5173/teacher/exam-bank`
- **URL alias**: `http://localhost:5173/teacher/assignments/templates` (tự động điều hướng về `/teacher/exam-bank`)
- **Nút Sidebar**: Mục **"Kho đề thi & Mẫu"** nằm ngay dưới mục "Bài tập & Chấm điểm" trong thanh điều hướng của Giáo viên.
- **Nút tắt trên trang Quản lý bài tập**: Nút "Ngân hàng đề thi" ở góc trên trang `/teacher/assignments` liên kết trực tiếp sang `/teacher/exam-bank`.

---

## 3. Danh sách kiểm thử chi tiết (Test Cases)

| Mã TC | Hạng mục kiểm thử | Các bước thực hiện | Kết quả mong đợi |
|-------|-------------------|--------------------|------------------|
| **TC-EB-01** | Hiển thị nút trên Sidebar | 1. Đăng nhập tài khoản Giáo viên (`teacher`).<br>2. Quan sát menu bên trái. | Xuất hiện mục `Kho đề thi & Mẫu` với icon Thư viện (`Library`). Khi hover có hiệu ứng nổi bật, khi click chuyển đúng route `/teacher/exam-bank`. |
| **TC-EB-02** | Thống kê KPI tổng quan | 1. Truy cập `/teacher/exam-bank`.<br>2. Quan sát dải banner KPI. | Hiển thị 4 thẻ KPI: `12 Đề thi chuẩn`, `100% Rubric chuẩn`, `420+ Lượt giao bài`, `4.9/5.0 Đánh giá chất lượng`. |
| **TC-EB-03** | Lọc theo 4 kỹ năng | 1. Bấm vào tab `Writing`.<br>2. Bấm vào tab `Speaking`.<br>3. Bấm vào tab `Reading`.<br>4. Bấm vào tab `Listening`.<br>5. Bấm về `Tất cả kỹ năng`. | - Tab Writing: hiển thị 3 đề Writing (Task 1 & Task 2).<br>- Tab Speaking: hiển thị 3 đề Speaking (Part 1, 2, 3).<br>- Tab Reading: hiển thị 3 đề Reading (Passage 1, 2, 3).<br>- Tab Listening: hiển thị 3 đề Listening (Section 1, 2, 3, 4).<br>- Tab Tất cả: hiển thị toàn bộ 12 đề. |
| **TC-EB-04** | Tìm kiếm và Bộ lọc nâng cao | 1. Nhập từ khóa "Cambridge 19" vào ô tìm kiếm.<br>2. Chọn bộ lọc Định dạng: "IELTS Academic".<br>3. Chọn thang điểm mục tiêu: "Band 6.5 - 7.5". | Danh sách tự động lọc mượt mà, hiển thị đúng các bài tập thoả mãn tất cả điều kiện lọc. Khi không có kết quả, hiển thị Empty State với nút "Xóa tất cả bộ lọc". |
| **TC-EB-05** | Modal Xem trước đề (`ExamDetailModal`) | 1. Bấm nút `Xem trước` trên một đề thi (VD: Writing Task 2 Cambridge 19). | Mở modal chi tiết hiển thị:<br>- Tiêu đề, mã đề, nguồn gốc, thời gian làm bài, target band.<br>- Đề bài chuẩn & số từ yêu cầu (250+ words).<br>- Tiêu chí chấm 4 tiêu chí IELTS.<br>- Bài mẫu Band 8.0+ excerpt.<br>- Các thẻ hashtag chủ đề.<br>- Nút "Đóng" (X) đóng modal mượt mà. |
| **TC-EB-06** | Xem trước đề Listening có Audio player | 1. Chuyển sang tab `Listening`.<br>2. Bấm `Xem trước` đề Listening Cambridge 18 Section 2. | Modal hiển thị trình phát audio mô phỏng với nút Play/Pause hoạt động tốt, thanh tiến trình âm thanh và danh sách câu hỏi điền từ/trắc nghiệm. |
| **TC-EB-07** | Modal Giao bài nhanh (`QuickAssignModal`) | 1. Bấm nút `Giao cho lớp` trên bất kỳ card đề thi nào.<br>2. Chọn lớp học từ dropdown (VD: IELTS Intensive 7.0+).<br>3. Đặt hạn nộp bài.<br>4. Tích chọn "Cho phép nộp muộn" và "Gửi thông báo".<br>5. Bấm `Xác nhận giao bài`. | - Modal hiển thị đúng thông tin đề thi.<br>- Khi bấm xác nhận, modal đóng lại và xuất hiện Toast thông báo thành công: *"Đã giao bài tập thành công cho lớp..."*. |
| **TC-EB-08** | Tính năng sao chép vào trình tạo bài tập | 1. Trong modal Xem trước đề thi, bấm nút `Sao chép & Chỉnh sửa đề này`. | Chuyển hướng sang trình tạo bài tập mới với tham số `type={skill}&templateId={id}` và thông báo sao chép thành công. |
| **TC-EB-09** | Đa ngôn ngữ (i18n) | 1. Bấm chuyển đổi ngôn ngữ sang Tiếng Anh (English) ở thanh Header.<br>2. Bấm chuyển lại Tiếng Việt. | - Sidebar chuyển thành `Exam Bank & Templates`.<br>- Các nhãn, tiêu đề, nút hành động cập nhật ngôn ngữ tương ứng mà không bị gãy giao diện. |
| **TC-EB-10** | Responsive & Giao diện hiện đại | 1. Resize màn hình từ Desktop (1440px) xuống Laptop (1024px) và Tablet (768px). | Grid tự động co giãn từ 3 cột xuống 2 cột và 1 cột; không bị tràn màn hình; các modal căn giữa màn hình với thanh cuộn nội bộ mượt mà. |

---

## 4. Hình ảnh & Video bằng chứng kiểm thử tự động
- **Video luồng thao tác**: `production_artifacts/fe_to_tester/teacher_exam_bank_demo.webp` (hoặc trong thư mục artifacts ghi nhận bởi browser subagent).
- **Ảnh chụp giao diện**:
  - Giao diện Kho đề thi & Mẫu phân loại theo 4 kỹ năng: `teacher_exam_bank.png`

---

## 5. Danh sách các file liên quan
- `frontend/src/types/exam-bank.types.ts`: Định nghĩa Type cho Đề thi mẫu, Kỹ năng, Form giao bài.
- `frontend/src/styles/teacher-exam-bank.css`: Style hệ thống màu sắc, hero banner, badge 4 kỹ năng, card grid, modals.
- `frontend/src/components/exam-bank/ExamDetailModal.tsx`: Modal xem trước đề thi chi tiết theo từng kỹ năng.
- `frontend/src/components/exam-bank/QuickAssignModal.tsx`: Modal giao bài nhanh cho lớp học.
- `frontend/src/pages/TeacherExamBank.tsx`: Trang Master Kho đề thi & Đề mẫu.
- `frontend/src/components/layout/Sidebar.tsx`: Thêm mục điều hướng `Kho đề thi & Mẫu` kèm icon `Library`.
- `frontend/src/locales/common.ts`: Bổ sung key `menuExamBank` cho cả `vi` và `en`.
- `frontend/src/App.tsx`: Đăng ký route `/teacher/exam-bank` và alias `/teacher/assignments/templates`.
- `frontend/src/pages/TeacherAssignments.tsx`: Liên kết nút "Ngân hàng đề thi" sang `/teacher/exam-bank`.
