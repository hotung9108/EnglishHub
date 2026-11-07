# Kỹ thuật 1: Phân lớp tương đương (Equivalence Partitioning - EP)

## 1. Bản chất Kỹ thuật
Phân lớp tương đương là kỹ thuật kiểm thử hộp đen chia miền dữ liệu đầu vào (hoặc đầu ra) của chương trình thành các nhóm dữ liệu gọi là **Lớp tương đương (Equivalence Classes - EC)**.
- **Giả định cốt lõi**: Mọi giá trị trong cùng một lớp tương đương sẽ được chương trình xử lý theo cùng một cơ chế và mang lại kết quả cùng loại (cùng thành công hoặc cùng phát sinh một loại lỗi).
- **Mục tiêu**: Giảm thiểu số lượng test case cần chạy xuống mức tối ưu mà vẫn đảm bảo độ bao phủ các kịch bản kiểm thử.

---

## 2. Phân loại Lớp tương đương

Mỗi trường dữ liệu hoặc điều kiện đều có 2 loại lớp tương đương:
1. **Lớp tương đương hợp lệ (Valid Equivalence Class - VEC)**:
   - Đại diện cho các giá trị hợp lệ mà hệ thống được thiết kế để tiếp nhận và xử lý thành công.
   - Kết quả mong đợi: `HTTP 200/201 OK`, dữ liệu được lưu trữ, luồng tiếp tục bình thường.
2. **Lớp tương đương không hợp lệ (Invalid Equivalence Class - IEC)**:
   - Đại diện cho các giá trị sai, không đúng đặc tả, vi phạm ràng buộc dữ liệu hoặc logic.
   - Kết quả mong đợi: `HTTP 400 Bad Request`, `HTTP 422 Unprocessable Entity`, thông báo lỗi validation rõ ràng, không làm crash hệ thống (`HTTP 500`).

---

## 3. Quy tắc Xác định Phân lớp theo Kiểu Dữ liệu

### 3.1. Miền số liên tục (Range of Numbers)
*Ví dụ: Điểm bài thi $X \in [0.0, 10.0]$*
- **1 VEC**: $0.0 \le X \le 10.0$ (Ví dụ đại diện: `7.5`)
- **2 IEC**:
  - $X < 0.0$ (Ví dụ đại diện: `-1.5`)
  - $X > 10.0$ (Ví dụ đại diện: `11.0`)

### 3.2. Tập giá trị rời rạc hoặc Enum (Specific Set of Values)
*Ví dụ: Vai trò người dùng `role` $\in \{\text{'ADMIN'}, \text{'TEACHER'}, \text{'STUDENT'}\}$*
- **3 VEC**:
  - VEC 1: `ADMIN`
  - VEC 2: `TEACHER`
  - VEC 3: `STUDENT`
- **1 hoặc nhiều IEC**:
  - IEC 1: Giá trị chuỗi không nằm trong danh mục (ví dụ: `GUEST`, `SUPERUSER`)
  - IEC 2: Kiểu dữ liệu không phải chuỗi (ví dụ: số `123`, mảng `[]`, boolean `true`)
  - IEC 3: Giá trị `null` hoặc không truyền field khi bắt buộc

### 3.3. Độ dài chuỗi ký tự (String Length)
*Ví dụ: Tên bài tập `title` có độ dài $N \in [3, 200]$ ký tự*
- **1 VEC**: $3 \le N \le 200$ (Ví dụ: chuỗi 50 ký tự)
- **2 IEC**:
  - Chuỗi rỗng hoặc quá ngắn: $N < 3$ (Ví dụ: `""`, `"AB"`)
  - Chuỗi quá dài: $N > 200$ (Ví dụ: chuỗi 201 ký tự)
  - Chuỗi chỉ chứa khoảng trắng: `"   "` (thuộc phân lớp không hợp lệ nếu có quy tắc non-blank)

### 3.4. Định dạng mẫu (Format / Regular Expression)
*Ví dụ: Email định dạng `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`*
- **1 VEC**: Đúng chuẩn email (ví dụ: `tester.qa@englishhub.dev`)
- **Các IEC**:
  - Thiếu ký tự `@` (ví dụ: `tester.qa.englishhub.dev`)
  - Thiếu tên miền sau `@` (ví dụ: `tester.qa@`)
  - Thiếu username trước `@` (ví dụ: `@englishhub.dev`)
  - Chứa ký tự cấm / khoảng trắng (ví dụ: `test user@domain.com`)

### 3.5. Danh sách hoặc Mảng (Array / Collection Size)
*Ví dụ: Danh sách câu hỏi `questions` trong bài thi có số lượng $K \in [1, 50]$*
- **1 VEC**: $1 \le K \le 50$ (Ví dụ: mảng 10 phần tử)
- **2 IEC**:
  - Mảng rỗng: $K = 0$ (`[]`)
  - Mảng vượt giới hạn: $K > 50$ (mảng 51 phần tử)

---

## 4. Mẫu Bảng Phân Tích Lớp Tương Đương (Equivalence Partition Table)

Khi thiết kế test case, lập bảng theo định dạng sau:

| Tên trường / Điều kiện | Phân lớp tương đương hợp lệ (VEC) | Giá trị đại diện VEC | Phân lớp tương đương không hợp lệ (IEC) | Giá trị đại diện IEC |
|---|---|---|---|---|
| `assignmentTitle` | 3 đến 200 ký tự | `"Reading Comprehension Midterm"` | 1. Rỗng hoặc < 3 ký tự<br/>2. > 200 ký tự<br/>3. Toàn khoảng trắng | 1. `"AB"`<br/>2. Chuỗi 205 ký tự<br/>3. `"    "` |
| `maxSubmissions` | Số nguyên $\ge 1$ | `3` | 1. Số nguyên $\le 0$<br/>2. Số thập phân<br/>3. Không phải số | 1. `0`, `-1`<br/>2. `2.5`<br/>3. `"abc"` |
| `status` | Enum: `DRAFT`, `PUBLISHED` | `DRAFT` | 1. Trạng thái không tồn tại<br/>2. Rỗng | 1. `ARCHIVED`<br/>2. `null` |

---

## 5. Tiêu chí Bao phủ (Coverage Criteria)
- **Độ bao phủ tối thiểu**: 100% các lớp tương đương (cả VEC và IEC) phải được kiểm thử ít nhất một lần.
- **Quy tắc chọn đại diện**: Chỉ cần **1 giá trị đại diện** duy nhất cho mỗi lớp tương đương trong kịch bản kiểm thử (vì thử thêm các giá trị khác trong cùng một lớp tương đương không làm tăng khả năng phát hiện lỗi mới).
