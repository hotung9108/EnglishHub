# Quy chuẩn Làm việc & Vận hành Kiểm thử — `test_reborn/`

Nguồn tham chiếu: [`docs/core/01.SRS.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/core/01.SRS.md) & [`docs/core/03.TP.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/core/03.TP.md).

## Phân bổ Thư mục & Trách nhiệm

| Thư mục | Mục đích & Trách nhiệm | Công nghệ |
| :--- | :--- | :--- |
| `black-box/api/` | Kiểm thử toàn diện 8 nhóm API nghiệp vụ | Newman, Node.js, Axios, newman-reporter-qase |
| `black-box/e2e/` | Kiểm thử giao diện đầu cuối theo 3 vai trò người dùng | Selenium WebDriver, Node test runner |
| `white-box/` | Ma trận đối soát liên kết đến unit test backend và frontend | JUnit 5, Vitest, pytest |
| `performance/` | Kịch bản kiểm thử tải và áp lực cho các mốc cao điểm | k6, Grafana |
| `bugs/` | Kho lưu trữ tài liệu, ảnh chụp màn hình và payload tái hiện lỗi | Markdown, PNG screenshots, JSON logs |
| `common/` | Tiện ích dùng chung, cấu hình môi trường, Qase adapter | JavaScript, dotenv |
| `scripts/` | Các launcher tiện lợi cho người dùng thực thi theo vai trò | Windows CMD / PowerShell |

## Quy chuẩn Đặt tên & Tổ chức
1. **Tuyệt đối không dùng tiền tố `QA-...`** trong mã nguồn, tên file test, tên suite hay launcher.
2. Tên file phản ánh rõ nghiệp vụ và vai trò: `account-management`, `assignment-lifecycle`, `manual-grading`, `exam-taking`.
3. Khi phát hiện bug mới, ghi nhận vào `bugs/active/` kèm bằng chứng trong thư mục con `evidence/`.
