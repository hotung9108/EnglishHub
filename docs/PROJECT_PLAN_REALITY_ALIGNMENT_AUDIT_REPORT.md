# BÁO CÁO RÀ SOÁT VÀ ĐỒNG BỘ TOÀN DIỆN TÀI LIỆU KẾ HOẠCH DỰ ÁN (02. PROJECT PLAN) VỚI THỰC TẾ CODEBASE VÀ TRELLO BOARD

> **Dự án**: EnglishHub -- Xây dựng website quản lý bài tập và chấm chữa bài tiếng Anh thông minh  
> **Thời điểm hoàn thành**: 07/11/2026  
> **Tài liệu mục tiêu**: `overleaf_reports/Project_1/final/reports/02_PP.tex` và 5 chương tại `final/reports/02_Chapters/` (`Chapter_01.tex`, `Chapter_03.tex`, `Chapter_04.tex`, `Chapter_05.tex`, `Chapter_06.tex`)  
> **Trạng thái đám mây**: Đã đồng bộ 100% lên Overleaf Cloud (`Project_1` -- ID: `6a8d98489e5b4896f3515c11`)  
> **Căn cứ thực tế**: Trello board `Project1` (18 danh sách công việc, 246 cards), Codebase (`backend/`, `frontend/`, `ai-service/`, `database/`), 17 Flyway migrations, và các chỉ đạo kỹ thuật từ người dùng.

---

## 1. TỔNG QUAN HIỆN TRẠNG VÀ CÁC ĐIỂM SAI LỆCH ĐÃ ĐƯỢC CHUẨN HÓA

Trước khi thực hiện rà soát, tài liệu Kế hoạch Quản lý Dự án (`02_PP.tex`) có các mâu thuẫn lớn với thực tế triển khai của nhóm:

| Hạng mục đối soát | Hiện trạng cũ trong tài liệu | Hiện trạng thực tế triển khai (Codebase, Trello, DB) | Giải pháp chuẩn hóa đã áp dụng |
| :--- | :--- | :--- | :--- |
| **Tiến trình & Chu kỳ Sprint** | Ghi *"cần khoảng 8 tuần... cùng 1 tuần bổ sung..."* (Chương 6 dòng 7); Chương 3 chỉ liệt kê cột mốc tháng 8 cũ | Nhóm vận hành chuẩn **10 Sprints Scrum độc lập (1 tuần/Sprint)** từ 09/09/2026 đến 22/11/2026; Trello có đủ cột Done Sprint 1 đến Done Sprint 6, Sprint 7, Sprint 8 | Sửa ước tính dòng 7 thành **10 Sprints Scrum**; mở rộng bảng cột mốc 4 giai đoạn bao quát trọn vẹn từ Sprint 0 đến Sprint 10; đồng bộ các mốc WBS. |
| **Kiến trúc Lưu trữ Đa môi trường** | Chưa có chiến lược ngân sách bằng 0; ghi chung chung CSDL | Người dùng chỉ đạo: *"lưu trữ ở dev sẽ là minIO còn lưu trữ staging và prod là neon database storage"* | Bổ sung chiến lược Zero-budget tại Chương 1 & Chương 4: **Dev dùng MinIO S3 (`englishhub-dev`) + PostgreSQL 16**; **Staging/Prod dùng Neon Database Storage** (`sslmode=require`, keepalive 60s) + Cloud S3. |
| **Hiện trạng Cơ sở Dữ liệu** | Dòng 7 Chương 3 và Chương 5 ghi: *"Phần thiết kế cơ sở dữ liệu đang trong giai đoạn rà soát... dự kiến có đợt tái cấu trúc"* | CSDL đã được chốt và đóng băng hoàn toàn với **17 bản ghi Flyway migration** chạy trơn tru trên cả Dev và Staging | Xóa bỏ toàn bộ nội dung lỗi thời "đang rà soát tái cấu trúc"; khẳng định CSDL đã hoàn thiện chuẩn DDD với 17 Flyway migrations. |
| **Số lượng Use Cases** | Chương 6 dòng 291 ghi *"33 use case"* | Tài liệu SRS (`01_SRS.tex`) và thực tế có **36 Use Cases (`UC01` đến `UC36`)** | Sửa dứt điểm thành **36 use cases**, đồng bộ toàn bộ phạm vi chức năng với SRS và Test Plan. |
| **Hệ thống Công nghệ (Tech Stack)** | Chương 4 thiếu công nghệ AI, thiếu framework test, thiếu thư viện multimedia | Dự án sử dụng Java 21, Spring Boot 3, React 19, Python 3.11, FastAPI, Google Gemini 2.5 Flash SDK, FFmpeg, MinIO, Neon DB, Gradle | Bổ sung đầy đủ toàn bộ Tech Stack thực tế vào Giả định kỹ thuật (Chương 4 mục 4.1). |
| **Hệ sinh thái Kiểm thử** | Chỉ nhắc đơn giản test thủ công/Selenium | Thực tế dùng Selenium WebDriver Node.js (POM), Excel Master Test Matrix, Qase, JUnit 5 (93 files), Vitest, k6 | Bổ sung đầy đủ bộ công cụ kiểm thử đa tầng tại Chương 6 mục 6.6.1 theo yêu cầu người dùng. |
| **Cấu trúc Quản lý Trello** | Chưa mô tả cấu trúc các danh sách Trello | Trello board `Project1` có 18 danh sách công việc quy chuẩn | Bổ sung mô tả chi tiết kiến trúc 18 danh sách Trello tại Chương 6 mục 6.2.2. |
| **Git Flow & Quy ước Nhánh** | Chỉ có `main`, `develop`, `feature/*` chung chung | Thực tế có nhánh pre-production `staging`; tiền tố phân quyền vai trò: `feat/<ROLE>-<NUMBER>-<slug>` | Chuẩn hóa Git Flow: bổ sung nhánh `staging`, quy ước nhánh theo vai trò, liên kết Role Guard (`git-user-mapping.md`). |
| **Tiêu chí Hoàn thành (DoD)** | Chưa có công cụ kiểm định chất lượng tự động | Quy định dự án: Pass 100% Quality Gates của Project Doctor (`/doctor`); Tester độc quyền duyệt PR/Done | Đưa tiêu chuẩn **Project Doctor (`/doctor`)** và quyền hạn độc quyền của **Tester (`@Zawn-Tsu`)** vào DoD (Chương 5 mục 5.5). |
| **Lỗi chính tả** | Chương 1 dòng 3 ghi nhầm *"thông mình"* | Đề tài chuẩn: *"thông minh"* | Đã sửa thành *"thông minh"*. |

---

## 2. BẢN ĐỒ TIẾN TRÌNH 10 SPRINTS SCRUM (ĐỒNG BỘ TRELLO TASK BOARD)

Tiến trình 10 Sprints của dự án (từ 09/09/2026 đến 22/11/2026) đã được chuẩn hóa đồng bộ giữa Project Plan, Test Plan và Trello:

```
[Sprint 0: 26/08 - 27/08] --> Cài đặt Docker Dev, MinIO, PostgreSQL, hoàn thiện SRS, khởi tạo Excel Test Matrix ([QA-03]).
         │
[Giai đoạn 1: Nền tảng Cốt lõi & Quản lý (Sprint 1 - 3: 09/09 - 30/09)]
         ├─ Sprint 1: Auth JWT, User Management, Profile, Classes (UC01-UC10)
         ├─ Sprint 2: Biên soạn bài tập đa kỹ năng (Draft -> Published -> Closed, UC11-UC15)
         └─ Sprint 3: Làm bài & Nộp bài 4 kỹ năng (Audio recording, text, submission rules, UC16-UC24)
         │
[Giai đoạn 2: Tích hợp AI Microservice & Teacher Studio (Sprint 4 - 5: 01/10 - 15/10)]
         ├─ Sprint 4: Chấm tự động Reading/Listening, Microservice FastAPI Google Gemini 2.5 Flash SDK (UC25-UC27)
         └─ Sprint 5: Teacher Grading Studio, AI Annotation suggestions, ghi đè điểm, Selenium POM Framework ([QA-24])
         │
[Giai đoạn 3: Báo cáo Quản trị, Media S3 & Khắc phục P0 Blockers (Sprint 6 - 8: 16/10 - 06/11)]
         ├─ Sprint 6: Admin Reports, thống kê học tập, MinIO S3 Audio Streaming (UC33-UC36), CI npm test ([OPS-25])
         ├─ Sprint 7: Web Audio Presigned URL, upload Word/PDF, Stepper, FFmpeg transcoder WebM->WAV, Vitest UI ([QA-28])
         └─ Sprint 8: Khắc phục triệt để 14 lỗi P0 Blockers (#174, #175, #176, #212, #233), thay thế test giả bằng test thật ([QA-29])
         │
[Giai đoạn 4: Hồi quy Toàn diện & Nghiệm thu Bảo vệ (Sprint 9 - 10: 07/11 - 22/11)]
         ├─ Sprint 9: Full Regression 36 UCs trên Staging, chạy 133 automated tests (93 BE + 40 FE), k6 load testing (P95)
         └─ Sprint 10: Đóng gói Production Docker Compose, Smoke test, chốt Test Summary Report (TSR), bảo vệ đồ án
```

---

## 3. CHI TIẾT CÁC THAY ĐỔI THEO TỪNG CHƯƠNG TRÊN OVERLEAF

Toàn bộ 6 tệp tin của Kế hoạch Quản lý Dự án (`02_PP.tex` và 5 chương trong `02_Chapters/`) đã được chỉnh sửa và cập nhật:

### 3.1. `02_PP.tex` (Master LaTeX Wrapper)
* Kiểm tra cấu hình font Times New Roman, polyglossia tiếng Việt, căn lề geometry chuẩn A4, các định nghĩa macro bảng biểu và tính toàn vẹn của các lệnh `\input{final/reports/02_Chapters/...}`.

### 3.2. `Chapter_01.tex` -- Chương 1: TỔNG QUAN DỰ ÁN
* **Sửa lỗi chính tả**: Dòng 3 sửa từ *"thông mình"* thành *"thông minh"*.
* **Chiến lược Zero-Budget & Lưu trữ đa môi trường**: Bổ sung phân tích giải pháp kỹ thuật đáp ứng ràng buộc ngân sách 0 đồng:
  * Môi trường phát triển cục bộ (Local Dev): Tận dụng phần mềm mã nguồn mở tự lưu trữ (self-hosted) gồm **PostgreSQL 16** và **MinIO Object Storage** (chuẩn S3 API, bucket `englishhub-dev`).
  * Môi trường tiền phát hành Staging và Production: Sử dụng hạ tầng đám mây serverless miễn phí với **Neon Database Storage (Neon Serverless PostgreSQL)** kết hợp Cloud Storage.

### 3.3. `Chapter_03.tex` -- Chương 3: MỤC TIÊU VÀ PHẠM VI DỰ ÁN
* **Xóa bỏ nội dung lỗi thời**: Loại bỏ hoàn toàn nhận định cũ *"Phần thiết kế cơ sở dữ liệu đang trong giai đoạn rà soát... dự kiến có đợt tái cấu trúc"*.
* **Cập nhật hiện trạng CSDL**: Khẳng định cơ sở dữ liệu đã được chốt và quản lý phiên bản qua **17 bản ghi Flyway migration** hoàn chỉnh.
* **Mở rộng cột mốc 4 giai đoạn**: Bổ sung bảng tóm tắt 4 giai đoạn phát triển bao quát trọn vẹn cả **10 Sprints (09/09/2026 -- 22/11/2026)**, giải quyết triệt để sự thiếu hụt thông tin các sprint sau.

### 3.4. `Chapter_04.tex` -- Chương 4: KẾ HOẠCH QUẢN LÝ DỰ ÁN
* **Bổ sung Tech Stack toàn diện**: Cập nhật mục 4.1 (Giả định kỹ thuật) bao gồm:
  * Backend: Java 21, Spring Boot 3.x, Spring Data JPA, Hibernate, Gradle 8.x.
  * Frontend: React 19, Vite, TypeScript, Tailwind CSS, Shadcn UI / Radix UI, Lucide React.
  * AI Service: Python 3.11, FastAPI, Google Gemini 2.5 Flash SDK, FFmpeg xử lý âm thanh.
  * CSDL & Storage: PostgreSQL 16, MinIO Object Storage (Dev S3), Neon Serverless PostgreSQL (Staging/Prod).
* **Phân tích rủi ro kỹ thuật**: Đánh giá rủi ro R3 và R6 liên quan đến độ trễ gọi AI Gemini Flash và rủi ro cold start trên Staging serverless (xử lý bằng cấu hình keepalive 60s cho HikariCP pool).

### 3.5. `Chapter_05.tex` -- Chương 5: CẤU TRÚC PHÂN CHIA CÔNG VIỆC (WBS) VÀ TIÊU CHÍ NGHIỆM THU
* **WBS CSDL**: Cập nhật mục công việc thiết kế và di chuyển CSDL thành 17 Flyway migrations.
* **Tiêu chuẩn nghiệm thu (Definition of Done -- DoD)**: Bổ sung 3 điều kiện bắt buộc:
  1. Mã nguồn vượt qua 100% Quality Gates của công cụ **Project Doctor (`/doctor`)**.
  2. Mọi commit và Pull Request tuân thủ nghiêm ngặt **Conventional Commits**.
  3. Pull Request chỉ được merge khi có xác nhận kiểm thử đạt yêu cầu và được **Tester độc quyền phê duyệt**.

### 3.6. `Chapter_06.tex` -- Chương 6: KẾ HOẠCH THỰC HIỆN VÀ THEO DÕI
* **Sửa ước tính thời gian**: Dòng 7 sửa *"cần khoảng 8 tuần... cùng 1 tuần bổ sung..."* thành mô hình chuẩn **10 Sprints Scrum (chu kỳ 1 tuần/Sprint)**.
* **Kiến trúc Trello Board**: Bổ sung mô tả chi tiết 18 danh sách công việc trên Trello board `Project1` (Docs, Product Backlog, Sprint Backlog, Blocked, Ongoing, Review, Done Sprint 1--6, Sprint 7, Sprint 8, 00.PI, 01.SRS, 02.PP, 03.TP).
* **Hệ sinh thái Kiểm thử**: Bổ sung mục 6.6.1 với đầy đủ các công cụ: **Excel Master Test Matrix**, **Qase Platform**, **Selenium WebDriver (Node.js POM)**, **Vitest**, **JUnit 5**, **Pytest**, **k6**, **SonarQube**, **Lighthouse**.
* **Chuẩn hóa Git Flow & Phân quyền**: Bổ sung nhánh `staging`, quy ước nhánh `feat/<ROLE>-<NUMBER>-<slug>` và `fix/<ROLE>-...`, áp dụng Role Guard theo `git-user-mapping.md`.
* **Sửa số lượng Use Case**: Dòng 291 sửa *"33 use case"* thành **36 use cases (`UC01`--`UC36`)**.

---

## 4. BẢNG TỔNG HỢP TRẠNG THÁI ĐỒNG BỘ LÊN OVERLEAF CLOUD

Tất cả 6 tệp tin của Kế hoạch Quản lý Dự án đã được đồng bộ thành công 100% lên Overleaf Cloud (`Project_1` -- ID: `6a8d98489e5b4896f3515c11`):

| STT | Tên file trên Overleaf | Đường dẫn từ Root | ID trên Cloud | Kích thước | Trạng thái đồng bộ |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | `02_PP.tex` | `final/reports/02_PP.tex` | `6aeee2c90324c6c7a6903d52` | 23.4 KB | **Thành công 100%** |
| 2 | `Chapter_01.tex` | `final/reports/02_Chapters/Chapter_01.tex` | `6aeee2cc264c70bbb134bbef` | 6.35 KB | **Thành công 100%** |
| 3 | `Chapter_03.tex` | `final/reports/02_Chapters/Chapter_03.tex` | `6aeee2ce5d645cc78345c253` | 3.92 KB | **Thành công 100%** |
| 4 | `Chapter_04.tex` | `final/reports/02_Chapters/Chapter_04.tex` | `6aeee2d1264c70bbb134c0a3` | 10.04 KB | **Thành công 100%** |
| 5 | `Chapter_05.tex` | `final/reports/02_Chapters/Chapter_05.tex` | `6aeee2d484dcc0b2d48deb3d` | 12.45 KB | **Thành công 100%** |
| 6 | `Chapter_06.tex` | `final/reports/02_Chapters/Chapter_06.tex` | `6aeee2d836825e57b229930b` | 33.01 KB | **Thành công 100%** |

---

## 5. BỘ BA BÁO CÁO ĐỐI SOÁT TOÀN DIỆN TRONG THƯ MỤC `docs/`

Hiện nay, thư mục `docs/` đã sở hữu đầy đủ bộ ba báo cáo đối soát và thay đổi tương ứng với 3 tài liệu lớn của đồ án:
1. **SRS & Activity Diagrams**: [`docs/SRS_AND_ACTIVITY_DIAGRAMS_AUDIT_REPORT.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/SRS_AND_ACTIVITY_DIAGRAMS_AUDIT_REPORT.md)
2. **Project Plan**: [`docs/PROJECT_PLAN_REALITY_ALIGNMENT_AUDIT_REPORT.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/PROJECT_PLAN_REALITY_ALIGNMENT_AUDIT_REPORT.md)
3. **Test Plan**: [`docs/TEST_PLAN_REALITY_ALIGNMENT_AUDIT_REPORT.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/TEST_PLAN_REALITY_ALIGNMENT_AUDIT_REPORT.md)
