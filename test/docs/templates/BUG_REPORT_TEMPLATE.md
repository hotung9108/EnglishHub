# [BUG-<ID>] <Tiêu đề lỗi ngắn gọn và rõ ràng>

- **Phân hệ / Vai trò**: Admin | Teacher | Student | Common
- **Use Case liên quan**: UCxxx trong PDF Group-04 và tài liệu đặc tả đã chốt; ghi trang/mục nguồn
- **Mã case local**: Ví dụ ASG_009; không suy ra từ số Qase
- **Phiên bản chạy**: Commit/build nếu xác định được; ghi chưa xác định nếu không biết
- **Mức xác minh**: Lỗi đã tái hiện | Chưa tái hiện | Cần kiểm tra yêu cầu | Lỗi test
- **Mức độ nghiêm trọng (Severity)**: Critical | High | Medium | Low
- **Mức độ ưu tiên (Priority)**: P1 (Khẩn cấp) | P2 (Cao) | P3 (Trung bình)
- **Môi trường phát hiện**: Local | Dev | Staging
- **Qase Suite ID / Case ID**: <Ví dụ: Suite 12 / Case EAM-77>
- **GitHub Issue liên quan**: <Ví dụ: #210>

---

## 1. Mô tả Hiện tượng (Bug Description)
Mô tả tóm tắt hành vi sai lệch của hệ thống.

---

## 2. Các bước Tái hiện (Steps to Reproduce)
1. Đăng nhập hệ thống với vai trò `...`
2. Điều hướng đến màn hình `...`
3. Nhập các giá trị sau vào biểu mẫu:
   - Trường A: `...`
   - Trường B: `...`
4. Nhấn nút `Submit` hoặc thao tác `...`
5. Quan sát phản hồi của giao diện và tab Network.

---

## 3. Kết quả Thực tế (Actual Result)
Hệ thống phản hồi sai như thế nào? (Kèm mã lỗi HTTP, thông báo hiển thị).

---

## 4. Kết quả Mong đợi (Expected Result)
Theo PDF Group-04 và tài liệu đặc tả đã chốt, hệ thống phải phản hồi như thế nào? Trích yêu cầu, kèm trang/mục. Không dùng kỳ vọng từ test cũ làm đặc tả.

---

## 5. Bằng chứng đính kèm (Evidence)
- **Ảnh chụp màn hình**: `evidence/screenshot-error.png`
- **Request / Response Payload**: `evidence/network-payload.json`
- **Log lỗi / Stack Trace**: `evidence/browser-console.log`
