# Phạm vi các bộ kiểm thử

| Mục đích | Nơi quản lý | Ghi chú |
|---|---|---|
| UI/E2E nghiệp vụ | `test/selenium/` | 170 mã case; tra theo chức năng và UC |
| API | `test/api/` | Collection thật, report và catalog review có trạng thái riêng |
| Manual/khám phá UI | `test/manual/` | Giữ kịch bản và minh chứng đã chạy |
| Backend unit/integration | `backend/src/test/` | Nằm cùng mã sản phẩm |
| Frontend component/unit | Source frontend | Xem cấu hình kiểm thử frontend |
| AI unit/integration | `ai-service/tests/` | Phân biệt mock và tích hợp AI thật |
| Công cụ NFR | `test/tools/` | JMeter/Sonar là công cụ cài local |
| Report/TSR | `test/reports/`, `production_artifacts/test_reports/` | Giữ ngày chạy, nguồn và giới hạn |

File mẫu chỉ `assert.ok(true)`, chấp nhận lỗi kết nối như PASS hoặc chỉ in tiêu đề đã được đưa ra backup. Không tính chúng vào độ phủ hoặc kết quả nghiệm thu.

`archive/`, `bugs/imports/`, `docs/review/` có tham chiếu trong catalog/tìm kiếm, được giữ làm nguồn đối chiếu.
