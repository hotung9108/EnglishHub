# Hướng Dẫn Kiểm Thử: Chuẩn Hóa Trải Nghiệm Giáo Viên & Bộ Biên Soạn Quiz [FE-81]

> **Mã công việc:** `[FE-81]`  
> **Nhánh:** `feat/FE-81-teacher-experience-and-quiz-refinements`  
> **Tác giả:** Tiến Sơn Trần (`Maloque18705` / `tinsntrn`)  
> **Kiểm thử viên:** Tú Nguyễn (`Zawn-Tsu` / `zawntsu`)  
> **Thẻ Trello:** https://trello.com/c/T31r7Msg  

---

## 1. Mục tiêu Kiểm thử
Xác nhận 5 nhóm chức năng và cải tiến trải nghiệm cho Giáo viên:
1. Thống kê Dashboard & Lớp học tính theo số lượng học sinh duy nhất nộp bài (không tính theo số lượt nộp).
2. Modal chi tiết học viên trong Tiến độ lớp học hiển thị Lịch sử đánh giá & nhận xét trước đây (`studentEvaluationService.list`).
3. Bộ biên soạn Quiz (Reading & Listening): Đổi vị trí câu hỏi (Move up/down), placeholder lựa chọn đáp án, chèn câu hỏi mới ngay dưới câu đang chọn, tự động chia đều điểm từ tổng điểm module, loading và thông báo toast chuẩn khi lưu.
4. Gỡ bỏ hoàn toàn menu, route và các component Ngân hàng đề thi (Exam Bank).
5. Giáo viên xem được bản ghi âm kèm toàn bộ transcript lời nói của học viên trong màn hình chấm bài Speaking.

---

## 2. Kịch bản Kiểm thử Thủ công (Manual Test Cases)

### TC-FE81-01: Thống kê số lượng nộp theo học viên duy nhất
- **Bước 1**: Đăng nhập tài khoản Giáo viên (`teacher`).
- **Bước 2**: Truy cập `/teacher/dashboard` và `/teacher/classes/:id/progress`.
- **Bước 3**: Quan sát cột "Bài nộp" hoặc tỷ lệ nộp bài của bài tập đã có học viên nộp nhiều lần (nhiều attempts).
- **Kết quả kỳ vọng**:
  - Số lượng nộp hiển thị đúng số học viên độc lập đã nộp (ví dụ lớp 10 học viên, 2 học viên nộp thì hiển thị `2 / 10`).
  - Tỷ lệ hoàn thành không vượt quá 100%.

### TC-FE81-02: Lịch sử nhận xét & đánh giá học viên
- **Bước 1**: Truy cập `/teacher/classes/:id/progress`.
- **Bước 2**: Bấm nút icon "Xem chi tiết" (mắt) của một học viên trong danh sách sổ điểm.
- **Bước 3**: Quan sát phần "Lịch sử đánh giá & nhận xét".
- **Bước 4**: Nhập nhận xét mới vào ô "Nhận xét mới cho học viên" và bấm nút "Lưu đánh giá".
- **Kết quả kỳ vọng**:
  - Danh sách các nhận xét trước đó hiển thị đầy đủ ngày giờ, tên giáo viên và nội dung.
  - Bấm "Lưu đánh giá" -> Nhận xét mới lập tức xuất hiện đầu danh sách lịch sử, ô nhập được xóa trắng và hiện Toast thông báo thành công.

### TC-FE81-03: Biên soạn Quiz (Reading & Listening)
- **Bước 1**: Truy cập `/teacher/assignments/create` hoặc `/teacher/assignments/:id/edit`.
- **Bước 2**: Chọn tab Reading hoặc Listening.
- **Bước 3**: Bấm nút "Trắc nghiệm" -> Kiểm tra các ô đáp án A, B, C, D hiển thị `placeholder` (ví dụ `Lựa chọn A (nhập đáp án...)`), không có text điền sẵn.
- **Bước 4**: Bấm mũi tên Lên/Xuống trên header câu hỏi -> Thứ tự câu hỏi hoán đổi mượt mà.
- **Bước 5**: Bấm "+ Trắc nghiệm" hoặc "+ Điền từ" ở chân câu hỏi 1 -> Câu hỏi mới được chèn ngay tại vị trí số 2 (dưới câu 1).
- **Bước 6**: Thay đổi thang điểm tổng của module (ví dụ: 3 điểm cho 3 câu hỏi) -> Badge hiển thị điểm mỗi câu tự động chia đều (1.00 điểm/câu, tổng 3 điểm).
- **Bước 7**: Bấm "Lưu thay đổi bài tập" -> Nút chuyển sang trạng thái "Đang lưu thay đổi..." với icon xoay tròn, sau đó hiện messagebox Toast màu xanh `Đã lưu thay đổi bài tập thành công!`.

### TC-FE81-04: Gỡ bỏ Ngân hàng đề thi
- **Bước 1**: Quan sát Sidebar bên trái của giáo viên -> Không còn mục "Ngân hàng đề thi".
- **Bước 2**: Gõ trực tiếp URL `/teacher/exam-bank` -> Tự động chuyển hướng về `/teacher/assignments`.

### TC-FE81-05: Audio Transcript bài tập Speaking của Giáo viên
- **Bước 1**: Vào `/teacher/assignments/:id/submissions/:studentId` (bài nộp có kỹ năng Speaking).
- **Bước 2**: Chọn module Speaking.
- **Kết quả kỳ vọng**: Dưới Audio Player của học viên hiển thị khung "Bản ghi lời nói của học viên (AI Transcript)" với đầy đủ nội dung chữ văn bản mà học viên đã nói.

---

## 3. Kết quả Kiểm thử Tự động (Automated Test Pass)
- `npm test -- --run`: **212/212 tests PASS**
- `npm run test:ui -- --run`: **982/982 tests PASS**
- `npm run lint`: **0 errors, 0 warnings**
- `npm run build`: **Vite build thành công (0 errors)**
