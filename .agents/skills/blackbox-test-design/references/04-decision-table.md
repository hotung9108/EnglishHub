# Kỹ thuật 4: Kỹ thuật Bảng quyết định (Decision Table Testing)

## 1. Bản chất Kỹ thuật
Bảng quyết định (Decision Table) là kỹ thuật kiểm thử hộp đen lý tưởng để mô tả và kiểm tra các **logic nghiệp vụ phức tạp**, trong đó hành vi của hệ thống phụ thuộc vào sự kết hợp của nhiều điều kiện đầu vào khác nhau (Boolean True/False hoặc các giá trị rời rạc).

- **Khi nào áp dụng**:
  - Khi có nhiều mệnh đề `if - else if - else` lồng nhau.
  - Khi các điều kiện đầu vào tương tác với nhau để sinh ra các hành động khác nhau.
  - Khi cần chứng minh không có nhánh logic nào bị bỏ sót trong đặc tả.

---

## 2. Cấu Trúc Bảng Quyết Định

Bảng quyết định chuẩn gồm 4 góc phần tư:

| Thành phần | Ý nghĩa |
|---|---|
| **Condition Stubs** (Điều kiện) | Liệt kê tất cả các điều kiện đầu vào hoặc trạng thái tiên quyết ($C_1, C_2, \dots, C_n$). |
| **Condition Entries** (Giá trị điều kiện) | Các giá trị gán cho điều kiện: `T` (True), `F` (False), hoặc `-` (Don't Care - không ảnh hưởng). |
| **Action Stubs** (Hành động) | Liệt kê tất cả các phản hồi, hành vi hoặc mã lỗi đầu ra ($A_1, A_2, \dots, A_m$). |
| **Action Entries** (Thực thi hành động) | Ký hiệu hành động được thực hiện: `X` (thực hiện) hoặc để trống / `.` (không thực hiện). |
| **Rules (Cột quy tắc)** | Mỗi cột đại diện cho một tổ hợp quy tắc nghiệp vụ ($R_1, R_2, \dots, R_k$). |

---

## 3. Quy Trình 5 Bước Lập Bảng Quyết Định

1. **Bước 1: Liệt kê Điều kiện ($C_i$)**: Xác định các biến đầu vào ảnh hưởng đến quyết định.
2. **Bước 2: Liệt kê Hành động ($A_j$)**: Xác định các kết quả đầu ra có thể xảy ra.
3. **Bước 3: Lập bảng đầy đủ ($2^n$ quy tắc)**: Với $n$ điều kiện nhị phân, số quy tắc tối đa là $2^n$.
4. **Bước 4: Rút gọn bảng (Table Reduction / Collapsing)**:
   - Nếu hai hoặc nhiều cột quy tắc có cùng các hành động đầu ra, và chỉ khác nhau ở một điều kiện duy nhất, ta có thể gộp chúng lại và đánh dấu điều kiện đó là `-` (Don't Care).
   - Loại bỏ các quy tắc bất khả thi (Infeasible Rules) về mặt logic nghiệp vụ.
5. **Bước 5: Ánh xạ thành Test Case**: Mỗi cột quy tắc khả dĩ sau khi rút gọn tương ứng với **1 Test Case duy nhất**.

---

## 4. Ví Dụ Thực Tế trong EnglishHub: Logic Cho Phép Học Viên Nộp Bài

### Xét 4 điều kiện kiểm tra khi nộp bài:
- $C_1$: Học viên đã ghi danh vào lớp (`isEnrolled = True`)?
- $C_2$: Bài tập đang ở trạng thái công khai (`status = PUBLISHED`)?
- $C_3$: Thời điểm nộp chưa quá hạn (`now <= closeAt`)?
- $C_4$: Học viên còn số lượt nộp bài (`attempts < maxSubmissions`)?

### Các hành động mong đợi:
- $A_1$: Tiếp nhận bài nộp, chuyển trạng thái `SUBMITTED`, HTTP `200/201`.
- $A_2$: Từ chối với lỗi `403 Forbidden` ("Not enrolled in this class").
- $A_3$: Từ chối với lỗi `400 Bad Request` ("Assignment is not published").
- $A_4$: Từ chối với lỗi `400 Bad Request` ("Assignment deadline has passed").
- $A_5$: Từ chối với lỗi `400 Bad Request` ("Maximum submission attempts reached").

### Bảng Quyết Định Đã Rút Gọn (Reduced Decision Table):

| Điều kiện / Hành động | $R_1$ (Happy) | $R_2$ | $R_3$ | $R_4$ | $R_5$ |
|---|:---:|:---:|:---:|:---:|:---:|
| $C_1$: Học viên đã ghi danh? | **T** | **F** | **T** | **T** | **T** |
| $C_2$: Bài tập đã `PUBLISHED`? | **T** | `-` | **F** | **T** | **T** |
| $C_3$: Trong thời hạn (`now <= closeAt`)? | **T** | `-` | `-` | **F** | **T** |
| $C_4$: Còn lượt nộp (`attempts < max`)? | **T** | `-` | `-` | `-` | **F** |
| **$A_1$: Chấp nhận bài nộp (`200 OK`)** | **X** | | | | |
| **$A_2$: Báo lỗi `403 Forbidden`** | | **X** | | | |
| **$A_3$: Báo lỗi `400 (Not published)`** | | | **X** | | |
| **$A_4$: Báo lỗi `400 (Deadline passed)`** | | | | **X** | |
| **$A_5$: Báo lỗi `400 (Max attempts)`** | | | | | **X** |

> [!NOTE]
> Từ $2^4 = 16$ quy tắc lý thuyết, sau khi rút gọn logic thứ bậc (precedence logic), ta thu được **5 Test Cases** sắc bén, bao phủ 100% tất cả các kịch bản của tính năng nộp bài.

---

## 5. Tiêu chí Bao Phủ (Coverage Criteria)
- **Độ bao phủ quy tắc (Decision Rule Coverage)**: 100% các cột quy tắc khả dĩ ($R_1 \dots R_k$) phải có ít nhất 1 test case tương ứng.
- **Tính độc lập của dữ liệu**: Dữ liệu chuẩn bị cho từng quy tắc phải thể hiện đúng tổ hợp `T/F` được chỉ định.
