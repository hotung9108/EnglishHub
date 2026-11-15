# PM SPECIFICATION: TỔNG HỢP NHIỆM VỤ SPRINT 10 HOÀN THIỆN DỰ ÁN ENGLISHHUB

- **Mã tài liệu**: `production_artifacts/pm_to_dev/PM_SPEC_SPRINT_10_ROADMAP_AND_TASKS.md`
- **Người tạo**: `@pm` (Hồ Việt Tùng - `hotung9108`)
- **Ngày tạo**: 14/11/2026
- **Trello Board**: `Project1` -> Danh sách `Sprint Backlog` (Thẻ #532 đến #546)

---

## 1. BẢNG PHÂN CÔNG TOÀN BỘ 15 TASK TRÊN TRELLO

| Mã Task | Phân hệ | Mức ưu tiên | Tiêu đề Task trên Trello | Thành viên phụ trách | Role chính thức | Trello Card URL |
| :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| **BE-78** | Backend | **P0** | Hiện thực hóa API Quản trị viên Đổi mật khẩu Người dùng | **Đoàn Thái Sơn** | `@be-primary` | [Thẻ #532](https://trello.com/c/KLVLfq2Z) |
| **FE-92** | Frontend | **P0** | Sửa Modal Đổi Mật Khẩu Admin nối API thật và xóa bỏ Toast ảo | **Trần Tiến Sơn** | `@fe-primary` | [Thẻ #533](https://trello.com/c/pKohMgMB) |
| **OPS-47** | DevOps | **P0** | Tối Ưu Dockerfile Backend với BuildKit Cache Mounts & Khắc Phục Lỗi Tải Thư Viện Gradle | **Phạm Minh Tuấn** | `@devops-primary` | [Thẻ #534](https://trello.com/c/Q3xhi5nD) |
| **BE-79** | Backend | **P1** | Xây dựng CSDL và API Quản lý Cấu hình Hệ thống (System Settings) | **Phạm Minh Tuấn** | `@be-secondary` | [Thẻ #535](https://trello.com/c/DFzb0SzO) |
| **FE-93** | Frontend | **P1** | Nối API Admin Settings và Loại Bỏ Lưu Trữ LocalStorage Tạm Bợ | **Trần Tiến Sơn** | `@fe-primary` | [Thẻ #536](https://trello.com/c/mJJ6PnPy) |
| **FE-94** | Frontend | **P1** | Tích hợp Rich Text Toolbar Hoạt Động Thật Cho Bài Thi Writing | **Trần Tiến Sơn** | `@fe-primary` | [Thẻ #537](https://trello.com/c/CC5Hu08D) |
| **OPS-48** | DevOps | **P1** | Tự Động Hóa k6 Performance & Load Test Trên GitHub Actions CI/CD | **Phạm Minh Tuấn** | `@devops-primary` | [Thẻ #538](https://trello.com/c/EmN2V7rr) |
| **OPS-49** | DevOps | **P1** | Triển Khai Spring Boot Actuator & Prometheus Metrics Giám Sát Hiệu Năng | **Phạm Minh Tuấn** | `@devops-primary` | [Thẻ #539](https://trello.com/c/Qe52q77b) |
| **BE-80** | Backend | **P1** | Tối Ưu HikariCP Connection Pooling Chống Rớt Kết Nối Neon Serverless DB | **Phạm Minh Tuấn** | `@be-secondary` | [Thẻ #540](https://trello.com/c/wOfY2PLz) |
| **QA-34** | QA | **P1** | Bổ Sung Test Suites Vitest Đạt Tiêu Chí Coverage >= 80% (NFR MAI-05) | **Nguyễn Văn Tú** | `@tester` | [Thẻ #541](https://trello.com/c/HR8g5C3o) |
| **BE-81** | Backend | **P2** | Xây Dựng Module Kho Tài Liệu Ôn Tập & Lượt Tải File Thật (Materials API) | **Phạm Minh Tuấn** | `@be-secondary` | [Thẻ #542](https://trello.com/c/lBjpFvCw) |
| **BE-82** | Backend | **P2** | API Xuất Bảng Điểm & Sổ Điểm Lớp Học Chuẩn Excel (.xlsx) với Apache POI | **Đoàn Thái Sơn** | `@be-primary` | [Thẻ #543](https://trello.com/c/sTISBjDu) |
| **FE-95** | Frontend | **P2** | Hoàn Thiện Tương Tác Nút Highlight Reading và Sửa Tab Review Chi Tiết | **Trần Tiến Sơn** | `@fe-primary` | [Thẻ #544](https://trello.com/c/XpC4pr1t) |
| **OPS-50** | DevOps | **P2** | Pipeline Tự Động Sao Lưu CSDL PostgreSQL Disaster Recovery (Daily Backup) | **Hồ Việt Tùng** | `@devops-secondary` | [Thẻ #545](https://trello.com/c/lm6btVnS) |
| **OPS-51** | DevOps | **P2** | Chuẩn Hóa Healthcheck Dependencies & Auto-Recovery Trong Docker Compose | **Phạm Minh Tuấn** | `@devops-primary` | [Thẻ #546](https://trello.com/c/70REAsYr) |

---

## 2. KẾ HOẠCH TRIỂN KHAI PHỐI HỢP LIÊN PHÂN HỆ

1. **Nhóm P0 (Xử lý ngay trong 24h tới)**:
   - `@be-primary` triển khai `BE-78` -> `@fe-primary` nối `FE-92` để xóa bỏ hoàn toàn lỗi "reset password ảo".
   - `@devops-primary` cập nhật BuildKit Cache Mounts trong `backend/Dockerfile` (`OPS-47`) để dev team build container không còn lỗi timeout/TLS handshake.
2. **Nhóm P1 (Hoàn thành trước 18/11/2026)**:
   - `@be-secondary` hoàn tất Flyway V6 và `SystemSettingController` (`BE-79`) -> `@fe-primary` nối `FE-93` để chuyển toàn bộ cấu hình từ LocalStorage lên máy chủ.
   - `@fe-primary` sửa thanh công cụ Writing (`FE-94`).
   - `@devops-primary` cấu hình HikariCP (`BE-80`), Actuator Metrics (`OPS-49`), và workflow k6 (`OPS-48`).
   - `@tester` bổ sung Vitest cho 2 view trọng yếu (`QA-34`) đạt chỉ tiêu 80% NFR MAI-05.
3. **Nhóm P2 (Hoàn thành trước 20/11/2026)**:
   - Module kho tài liệu thật (`BE-81`), xuất Excel POI (`BE-82`), highlight bài đọc (`FE-95`), sao lưu CSDL tự động (`OPS-50`), và auto-recovery compose (`OPS-51`).
