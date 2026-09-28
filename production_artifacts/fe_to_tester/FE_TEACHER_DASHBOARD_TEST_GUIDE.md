# Hướng dẫn Kiểm thử Frontend: Trang Tổng quan (Teacher Dashboard)

**Người thực hiện**: @fe-primary  
**Người nhận**: @tester  
**Tính năng**: Trang Tổng quan (Dashboard) cho Giáo viên & Nút điều hướng Sidebar  
**Branch / Commit**: `feature/teacher-dashboard`  
**Ngày bàn giao**: 2026-09-26  

---

## 1. Tổng quan tính năng
Trang **Tổng quan Giáo viên (Teacher Dashboard)** (`/teacher/dashboard`) là trung tâm quản lý hoạt động giảng dạy toàn diện dành cho Giáo viên tại EnglishHub. Hệ thống tích hợp:
1. **Nút Sidebar "Tổng quan"**: Nằm ở vị trí đầu tiên trong menu Giáo viên (nhóm `TỔNG QUAN` / `OVERVIEW`) với icon `LayoutDashboard`.
2. **Hero Greeting Banner**: Lời chào cá nhân hóa giáo viên ("Chào mừng trở lại, Cô Trần Thị Mai Lan!"), chỉ số học kỳ và các nút hành động nhanh ("Giao bài tập mới", "Kho đề thi & Mẫu").
3. **KPI Metrics Strip**:
   - Số lớp đang dạy (4 lớp • 100% On-track)
   - Tổng số học viên (86 học viên • 100% Chuyên cần)
   - Bài nộp chờ chấm (18 bài nộp • Cần chấm ngay)
   - Điểm trung bình các lớp (Band 7.1 • +0.3 Band)
4. **Hàng đợi bài nộp cần chấm & duyệt (Pending Grading Queue)**:
   - Bộ lọc theo 4 kỹ năng: Tất cả (18), Writing (5), Speaking (4), Reading (5), Listening (4).
   - Thẻ bài nộp hiển thị avatar học viên, tên, mã lớp (`ENG-IELTS-6.5A`), tiêu đề bài tập, nhãn kỹ năng, thời gian nộp, badge điểm AI sơ bộ (`AI sơ bộ: Band 6.5`), và nút "Chấm bài".
5. **Ma trận Năng lực 4 Kỹ năng (4-Skill Competence Matrix)**:
   - Đánh giá năng lực của học viên qua 4 kỹ năng Writing, Speaking, Reading, Listening so với mục tiêu chuẩn (Benchmark).
6. **Tổng quan các Lớp đang phụ trách (Active Classes Grid)**:
   - Thẻ 4 lớp học (`ENG-IELTS-6.5A`, `ENG-GRAM-ADV`, `ENG-TOEIC-750`, `ENG-SPEAK-PRO`), thông tin lịch học, phòng học/Zoom, sĩ số và số bài cần chấm.
7. **Widgets Hạn nộp & Lịch sắp tới & Dòng hoạt động gần đây**:
   - Đếm ngược hạn chót nộp bài tập và lịch workshop.
   - Luồng hoạt động cập nhật theo thời gian thực (học viên nộp bài, AI hoàn tất chấm sơ bộ...).

---

## 2. Đường dẫn và Điều hướng
- **URL chính**: `http://localhost:5173/teacher/dashboard`
- **URL gốc**: `http://localhost:5173/teacher` (tự động chuyển hướng về `/teacher/dashboard`)
- **Nút Sidebar**: Mục **"Tổng quan"** trên cùng trong Sidebar của Giáo viên.

---

## 3. Danh sách kiểm thử chi tiết (Test Cases)

| Mã TC | Hạng mục kiểm thử | Các bước thực hiện | Kết quả mong đợi |
|-------|-------------------|--------------------|------------------|
| **TC-TD-01** | Hiển thị nút Dashboard trên Sidebar | 1. Đăng nhập tài khoản Giáo viên (`teacher@eh.com`).<br>2. Quan sát menu sidebar bên trái. | Xuất hiện nhóm `TỔNG QUAN` ở đầu menu chứa mục `Tổng quan` với icon `LayoutDashboard`. Mục này tự động được highlight active khi đang ở `/teacher/dashboard`. |
| **TC-TD-02** | Tự động chuyển hướng khi đăng nhập | 1. Đăng nhập bằng nút nhanh "Đăng nhập nhanh Giáo viên". | Hệ thống tự động chuyển hướng vào `/teacher/dashboard` thay vì chuyển sang danh sách lớp như trước. |
| **TC-TD-03** | Thống kê KPI dải trên cùng | 1. Quan sát 4 thẻ KPI đầu trang. | Hiển thị chính xác 4 thẻ: `4 Lớp đang giảng dạy`, `86 Tổng số học viên`, `18 Bài nộp chờ chấm` (có badge cảnh báo màu đỏ), `Band 7.1 Điểm trung bình các lớp`. |
| **TC-TD-04** | Bộ lọc 4 kỹ năng trong hàng đợi chấm bài | 1. Bấm tab `Writing`.<br>2. Bấm tab `Speaking`.<br>3. Bấm tab `Reading`.<br>4. Bấm tab `Listening`.<br>5. Bấm về `Tất cả`. | Danh sách bài nộp lọc tức thì theo kỹ năng tương ứng. Mỗi thẻ hiển thị đầy đủ avatar, tên học sinh, lớp, và badge `AI sơ bộ` với độ tin cậy. |
| **TC-TD-05** | Nút hành động Chấm bài | 1. Bấm nút `Chấm bài` trên một bài nộp bất kỳ trong hàng đợi. | Hệ thống chuyển hướng đúng sang trang chi tiết chấm bài `/teacher/assignments/:id/submissions/:studentId`. |
| **TC-TD-06** | Ma trận năng lực 4 Kỹ năng | 1. Quan sát khối `4-Skill Competence Matrix`. | Hiển thị 4 cột/hộp kỹ năng (Writing, Speaking, Reading, Listening) với thanh tiến trình phần trăm điểm so với thang điểm 9.0 và tỷ lệ hoàn thành. |
| **TC-TD-07** | Thẻ lớp học đang phụ trách | 1. Bấm vào bất kỳ thẻ lớp nào trong phần `Tổng quan các Lớp đang phụ trách`. | Chuyển hướng đúng sang trang chi tiết tiến độ học bạ của lớp đó (`/teacher/classes/:id/progress`). |
| **TC-TD-08** | Lịch sắp tới và Luồng hoạt động | 1. Quan sát cột bên phải. | Hiển thị đúng widget `Hạn nộp & Lịch sắp tới` kèm đếm ngược và timeline `Hoạt động gần đây`. |
| **TC-TD-09** | Nút CTA trên Hero Banner | 1. Bấm nút `Giao bài tập mới`.<br>2. Bấm nút `Kho đề thi & Mẫu`. | - Nút 1 dẫn đến `/teacher/assignments/create`.<br>- Nút 2 dẫn đến `/teacher/exam-bank`. |
| **TC-TD-10** | Đa ngôn ngữ và Responsive | 1. Bấm chuyển ngôn ngữ sang Tiếng Anh ở Header.<br>2. Thử nghiệm trên màn hình Laptop (1024px) và Tablet (768px). | - Toàn bộ giao diện chuyển sang tiếng Anh hoàn hảo (Dashboard, Overview, Active Classes, All Skills...).<br>- Bố cục co giãn 2 cột -> 1 cột mượt mà, không bị bể layout. |

---

## 4. Hình ảnh & Video bằng chứng kiểm thử tự động
- **Video luồng thao tác**: `production_artifacts/fe_to_tester/teacher_dashboard_demo.webp`
- **Ảnh chụp giao diện**: `teacher_dashboard_1790437485131.png`

---

## 5. Danh sách các file liên quan
- `frontend/src/types/teacher-dashboard.types.ts`: Định nghĩa Interface dữ liệu Dashboard, hàng đợi bài nộp, ma trận 4 kỹ năng.
- `frontend/src/styles/teacher-dashboard.css`: Toàn bộ CSS phong cách hiện đại cho Teacher Dashboard (tuân thủ `convention-fe.md`).
- `frontend/src/pages/TeacherDashboard.tsx`: Component trang chính Teacher Dashboard.
- `frontend/src/components/layout/Sidebar.tsx`: Thêm mục `Tổng quan` (`LayoutDashboard`) vào menu Teacher.
- `frontend/src/App.tsx`: Khai báo route `/teacher/dashboard` và cập nhật redirect mặc định `/teacher` -> `/teacher/dashboard`.
- `frontend/src/main.tsx`: Import stylesheet `teacher-dashboard.css`.
