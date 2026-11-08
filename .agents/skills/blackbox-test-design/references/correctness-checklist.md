# Danh mục Thẩm định Tính Đúng đắn của Test Case (Test Case Correctness Checklist)

Trước khi bàn giao hoặc đưa bộ Test Case vào thực thi trên Postman, Qase TMS hoặc Automation Framework, AI Agent bắt buộc phải đối chiếu và kiểm tra đạt 100% các tiêu chí dưới đây:

---

## 1. Tiêu Chí Bao Phủ & Kỹ Thuật (Technique & Coverage Gate)

- [ ] **Bao phủ Phân lớp tương đương (EP)**:
  - 100% các lớp tương đương hợp lệ ($VEC$) đều có test case đại diện.
  - 100% các lớp tương đương không hợp lệ ($IEC$) đều có test case từ chối tương ứng.
- [ ] **Bao phủ Giá trị biên (BVA)**:
  - Các trường có miền số hoặc độ dài chuỗi đều có đủ các điểm biên: $Min$, $Min-1$, $Max$, $Max+1$.
  - Đã kiểm tra trường hợp chuỗi rỗng `""` và chuỗi chỉ chứa khoảng trắng `"   "`.
  - Các trường dung lượng file hoặc hạn nộp đã kiểm tra điểm biên chính xác từng byte / từng giây.
- [ ] **Triệt tiêu Lỗi che giấu lỗi (Anti-Fault Masking)**:
  - Trong các ca kiểm thử tiêu cực (Negative Cases), mỗi test case **chỉ kiểm tra duy nhất một giá trị lỗi/vượt biên**.
  - Tất cả các trường dữ liệu còn lại trong request **bắt buộc phải mang giá trị hợp lệ**.
- [ ] **Bao phủ Bảng quyết định (Decision Table)**:
  - Mọi cột quy tắc khả dĩ ($R_i$) sau khi rút gọn đều có một test case tương ứng.
  - Không tồn tại quy tắc logic mâu thuẫn hoặc bất khả thi.
- [ ] **Bao phủ Bảng chuyển trạng thái (State Transition)**:
  - Đã kiểm tra tất cả các bước chuyển hợp lệ (0-switch).
  - Đã có test case kiểm tra việc chặn các bước chuyển cấm (ví dụ: sửa thực thể đã đóng, nhảy cóc bước).
- [ ] **Bao phủ Lược đồ nhân quả (Cause-Effect)**:
  - Bảng chân lý không vi phạm các ràng buộc loại trừ ($E$), bao hàm ($I$), duy nhất ($O$), hoặc đòi hỏi ($R$).

---

## 2. Tiêu Chí Cấu Trúc & Thực Thi (Execution & Structure Gate)

- [ ] **Nguyên tắc 1 Action — 1 Expected Result**:
  - Mỗi bước (Step) chỉ chứa **đúng 1 hành động duy nhất**. Không gom hai hành động vào một step (ví dụ: KHÔNG viết `POST /assignments rồi GET /assignments`).
  - Mỗi kết quả mong đợi (Expected Result) phải tương ứng tỷ lệ 1:1 với step cùng số thứ tự.
- [ ] **Kiểm tra tính bền vững dữ liệu (Persistence Verification)**:
  - Với mọi thao tác thay đổi dữ liệu (POST, PUT, PATCH, DELETE), phải có bước đọc lại (GET) để chứng minh dữ liệu đã thực sự được lưu vào DB, không chỉ tin vào status code trả về.
- [ ] **Chế độ độc lập kịch bản (Execution Mode: `isolated`)**:
  - Test case có thể chạy độc lập, chạy lại nhiều lần hoặc chạy song song mà không phụ thuộc vào token hay ID do case khác để lại.
  - Tự động sinh dữ liệu với timestamp hoặc `runId` và có cơ chế cleanup dữ liệu rác sau khi chạy.
- [ ] **Tập trung phát hiện lỗi (Defect-focused)**:
  - Tuyệt đối không nới lỏng assertion để làm xanh báo cáo giả tạo. Assertions phải kiểm tra đúng HTTP status, cấu trúc DTO và error message.

---

## 3. Tiêu Chí Định Danh & Chuẩn Hóa EnglishHub (Convention Gate)

- [ ] **Quy tắc đặt tên bắt buộc**:
  ```text
  [TC_<SUITE>_<NN>] <Động từ/Chủ thể> — <Điều kiện hoặc dữ liệu cụ thể> — <Kết quả mong đợi>
  ```
  - `<SUITE>`: Viết hoa cố định (`AUTH`, `CLASS`, `ASSIGNMENT`, `MODULE`, `QUESTION`, `SUBMISSION`, `GRADING`).
  - `<NN>`: Số thứ tự 2 chữ số duy nhất trong suite (`01`, `02`,...).
  - Bắt đầu bằng động từ tiếng Việt chuẩn xác (`Tạo`, `Lấy`, `Cập nhật`, `Từ chối`, `Chặn`, `Upload`...).
- [ ] **Gắn Tag đầy đủ**:
  - Có đầy đủ các tag: `ep:`, `role:`, `check:validation`, `check:boundary`, `expect:400` / `expect:201`.
- [ ] **Mapping Qase TMS chính xác**:
  - Gắn đúng Suite ID và Case ID thật trên Qase; tuyệt đối không dùng logic regex cắt chuỗi lấy số tự động gây ghi đè chéo hoặc lệch kết quả như lỗi Run #23.
