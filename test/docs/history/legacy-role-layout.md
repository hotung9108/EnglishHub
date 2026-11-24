# Phần còn lại của ba thư mục vai trò cũ

Di chuyển ngày 17/11/2026; không đổi mã case hay logic bộ 170 case.

| Đường dẫn trước | Đường dẫn sau | Mục đích |
|---|---|---|
| `test/selenium/admin/reports/` | `test/selenium/reports/legacy-roles/admin/` | Report gốc, ảnh và evidence; dữ liệu local, không đưa vào Git |
| `test/selenium/admin/` còn lại | Backup `team-test-layout-20261117/legacy-private/admin/` | `.env`, cache và trạng thái cũ |
| `test/selenium/teacher/` | Backup `team-test-layout-20261117/legacy-private/teacher/` | `.env`, fixture, cleanup và Postman cũ |
| `test/selenium/student/` | Backup `team-test-layout-20261117/legacy-private/student/` | `.env` và fixture lịch sử |

Backup trên máy người quản lý: `D:/ki7/prj1-archive/team-test-layout-20261117/`. ZIP private và manifest SHA-256 lưu tại đó. Không commit ZIP private.

Source dùng chung: `cases/`, `common/`, `catalog/`, `config/`, `fixtures/`, `integrations/`, `tools/`, `tests/`. Các helper `common/flows/support/admin|teacher|student` vẫn là code hiện hành.

Link lịch sử có chuỗi `test/selenium/admin/reports/` có thể tra theo bảng trên; số liệu và byte nội dung report gốc không bị sửa. Source archive trước migration chỉ dùng để đối chiếu local, không phải phụ thuộc cài đặt của bộ chính.
