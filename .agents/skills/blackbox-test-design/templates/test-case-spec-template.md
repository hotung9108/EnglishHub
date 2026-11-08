# Template Đặc Tả Test Case Chuẩn Hóa EnglishHub

Dùng mẫu này khi xuất tài liệu đặc tả kiểm thử hoặc chuẩn bị dữ liệu import vào Qase TMS.

---

## 1. Mẫu Bảng Test Case Tóm Tắt (Summary Matrix)

| ID | Title | Kỹ thuật áp dụng | Actor / Role | Input Data / Condition | Expected Result | Type / Priority |
|---|---|---|---|---|---|---|
| `[TC_<SUITE>_01]` | Tạo bài tập thành công — Dữ liệu hợp lệ danh định | EP (VEC) | Teacher owner | Tiêu đề 50 ký tự, thời lượng 60p | `201 Created`, bản ghi lưu DB | Positive / High |
| `[TC_<SUITE>_02]` | Tạo bài tập thành công — Biên Min hợp lệ | BVA (Min) | Teacher owner | Tiêu đề đúng 3 ký tự, thời lượng 5p | `201 Created` | Positive / Medium |
| `[TC_<SUITE>_03]` | Từ chối tạo bài tập — Tiêu đề dưới biên Min | BVA (Min-1) | Teacher owner | Tiêu đề 2 ký tự (`"AB"`) | `400 Bad Request` | Negative / Medium |
| `[TC_<SUITE>_04]` | Từ chối tạo bài tập — Tiêu đề rỗng | EP (IEC) | Teacher owner | Tiêu đề `""` | `400 Bad Request` | Negative / High |

---

## 2. Mẫu Chi Tiết Từng Test Case (Detailed Specification)

### `[TC_<SUITE>_<NN>]` <Động từ/Chủ thể> — <Điều kiện hoặc dữ liệu cụ thể> — <Kết quả mong đợi>

- **Mô tả (Description)**: <Mục đích kiểm thử của case, tham chiếu SRS/API contract>
- **Kỹ thuật thiết kế (Design Technique)**: <Phân lớp tương đương / Phân tích biên / Bảng quyết định / Máy trạng thái / Lược đồ nhân quả>
- **Chế độ thực thi (Execution Mode)**: `isolated` (hoặc `stateful-sequential` nếu là chuỗi logic)
- **Tiền điều kiện (Preconditions)**:
  - Tài khoản: `<Role>`, trạng thái `ACTIVE`
  - Fixtures: `<ID lớp / bài tập / token>`
- **Tags**: `ep:<suite>`, `role:<actor>`, `check:<validation|boundary|authn|authz>`, `expect:<status_code>`
- **Độ ưu tiên (Priority)**: `High` | `Medium` | `Low`
- **Mức độ nghiêm trọng (Severity)**: `Critical` | `Major` | `Normal`

#### Các bước thực hiện (Steps):

| Bước | Thao tác (Action - Duy nhất 1 hành động) | Dữ liệu đầu vào (Input Data) | Kết quả mong đợi (Expected Result - Tỷ lệ 1:1) |
|:---:|---|---|---|
| **1** | Gửi request `POST /api/v1/...` | Payload JSON hoặc form-data | Nhận HTTP status code mong đợi (`201` / `400`), phản hồi JSON đúng DTO |
| **2** | Gửi request `GET /api/v1/...` để xác minh persistence | Resource ID từ Bước 1 | HTTP 200, dữ liệu trả về khớp hoàn toàn với dữ liệu đã gửi ở Bước 1 |

- **Hậu điều kiện / Dọn dẹp (Postconditions / Teardown)**:
  - Xóa resource vừa tạo (nếu có) để tránh ô nhiễm cơ sở dữ liệu.
