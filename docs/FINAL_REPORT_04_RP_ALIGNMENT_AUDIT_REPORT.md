# BÁO CÁO ĐỐI SOÁT & CHUẨN HÓA TOÀN DIỆN BÁO CÁO TỔNG KẾT (04. FINAL REPORT - RP)

> **Dự án**: EnglishHub -- Website Quản lý Bài tập và Chấm chữa Bài tiếng Anh Thông minh  
> **Học phần**: Project 1 -- Khoa Công nghệ Thông tin, Trường Đại học Giao thông Vận tải (UTC)  
> **Giảng viên hướng dẫn**: TS. Nguyễn Trọng Phúc  
> **Nhóm thực hiện**: Nhóm 4 (Hồ Việt Tùng, Đoàn Thái Sơn, Trần Tiến Sơn, Nguyễn Văn Tú, Phạm Minh Tuấn)  
> **Thời gian hoàn thành**: Tháng 11/2026  
> **Tài liệu tham khảo đối chiếu**: `overleaf_reports/04. RP - Báo cáo tổng kết - Group-XXX.docx`  
> **Vị trí trên Overleaf Cloud**: Thư mục `final/reports/` (`04_FR.tex` và `04_Final Report/Chapter_01.tex` -- `Chapter_05.tex`, `Appendix.tex`) -- Project ID: `6a8d98489e5b4896f3515c11`

---

## 1. TỔNG QUAN & BỐI CẢNH NÂNG CẤP

Trong quá trình thực hiện học phần Project 1, giảng viên hướng dẫn (TS. Nguyễn Trọng Phúc) đã cung cấp mẫu văn bản chuẩn của Báo cáo Tổng kết cuối kỳ (`04. RP - Báo cáo tổng kết - Group-XXX.docx`). Tài liệu này quy định cấu trúc đề mục, phân bổ trách nhiệm theo 5 vai trò, quy trình triển khai CI/CD, cơ sở dữ liệu serverless và các bảng biểu thống kê kết quả kiểm thử bắt buộc.

Trước đây, phiên bản `04_FR.tex` trên Overleaf chỉ có phần khung sườn rút gọn, thiếu các phân mục vai trò chuyên sâu, thiếu bảng số liệu kiểm thử chi tiết qua các Sprint và các phân hệ.

Nhóm đã thực hiện **nâng cấp toàn diện và mở rộng quy mô báo cáo 04. RP**, vừa kế thừa 100% cấu trúc chuẩn mực từ tài liệu của giảng viên, vừa tích hợp toàn bộ các dữ liệu kiến trúc và kiểm thử thực tế từ mã nguồn hệ thống **EnglishHub**.

---

## 2. BẢNG ĐỐI CHIẾU CẤU TRÚC VÀ NỘI DUNG

| STT | Đề mục theo Mẫu Chuẩn (`04. RP.docx`) | Báo cáo 04_FR Cũ trên Overleaf | Báo cáo 04_FR Nâng Cấp Hoàn Chỉnh (EnglishHub) | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **0** | **Trang bìa & Bảng phân công** | Nhầm tiêu đề bìa ngoài thành *Đặc tả phần mềm* | Sửa chuẩn thành **BÁO CÁO TỔNG KẾT**, bảng phân công 5 vai trò chi tiết kèm MSSV | **ĐÃ HOÀN TẤT** |
| **1** | **CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI**<br>- 1.1. Chức năng chung<br>&nbsp;&nbsp;1.1.1. Chức năng cho admin<br>&nbsp;&nbsp;1.1.2. Chức năng cho người dùng | Chỉ có bối cảnh & 5 mục tiêu chung | Bổ sung đầy đủ 1.1 Bối cảnh, 1.2 Mục tiêu, **1.3 Chức năng chung phân tách 3 phân hệ đối tượng**: Quản trị viên, Giáo viên, Học viên | **ĐÃ HOÀN TẤT** |
| **2** | **CHƯƠNG 2: CÔNG NGHỆ VÀ CÔNG CỤ SỬ DỤNG**<br>- 2.1. Project Manager<br>- 2.2. Frontend Developer<br>- 2.3. Backend Developer<br>- 2.4. Tester<br>- 2.5. DevOps | Gộp vào mô tả kiến trúc ngắn | **Tái cấu trúc Chương 2 phân bổ theo đúng 5 vai trò**: PM (Trello 10 Sprints Scrum, SDD, DoD), FE (React 19, TypeScript, Vite, Tailwind, Shadcn), BE (Java 21 Spring Boot 3 DDD, 17 Flyway migrations, Python FastAPI Gemini SDK), Tester (Selenium WebDriver Node.js POM, Excel, Qase, Vitest, JUnit 5, k6), DevOps (Docker Compose, VPS Ubuntu, Nginx SSL, MinIO S3 Dev, Neon Serverless DB Staging/Prod) | **ĐÃ HOÀN TẤT** |
| **3** | **CHƯƠNG 3: KẾT QUẢ TRIỂN KHAI**<br>- 3.1. Triển khai Backend<br>- 3.2. Triển khai Frontend<br>- 3.3. Triển khai Database (Neon Postgres)<br>- 3.4. Các chức năng đã thực hiện được | Mô tả sơ lược | **Mở rộng Chương 3 toàn diện chuyên sâu**: 3.1 Backend (62 API endpoints, AI FastAPI Gemini SDK, CI/CD, Presigned URL S3); 3.2 Frontend (46 màn hình SPA, Vitest CI/CD); 3.3 CSDL (PostgreSQL 16 Dev, Neon Serverless DB Staging/Prod, 17 Flyway migrations); 3.4 Báo cáo chi tiết 36 Use Cases theo 5 phân hệ lớn | **ĐÃ HOÀN TẤT** |
| **4** | **CHƯƠNG 4: KẾT QUẢ KIỂM THỬ**<br>- 4.1. Bảng tổng kết theo từng Sprint<br>- 4.2. Bảng tổng kết theo từng module | Bullet points ngắn | **Thiết kế bảng LaTeX vector chuẩn mực**: Bảng 4.1 Tổng hợp kiểm thử qua 10 Sprints Scrum; Bảng 4.2 Tổng hợp kiểm thử theo 6 Modules nghiệp vụ; Đánh giá 133 test files tự động hóa, Selenium E2E POM, chỉ số tải k6 và giải quyết dứt điểm 14 P0 Blockers | **ĐÃ HOÀN TẤT** |
| **5** | **ĐÁNH GIÁ, HƯỚNG PHÁT TRIỂN & KẾT LUẬN**<br>- Đánh giá (Mức độ, Điểm mạnh, Hạn chế)<br>- Hướng phát triển<br>- Kết luận & Tri ân thầy Phúc | Thiếu đánh giá và hướng phát triển chi tiết | **Tạo mới Chương 5 chuyên biệt**: 5.1 Đánh giá hệ thống (hoàn thành 100% 36 UCs, điểm mạnh DDD & AI thực tế, 14 P0 resolved); 5.2 Hướng phát triển (Adaptive Learning, Whisper STT offline, Mobile App); 5.3 Kết luận & Lời tri ân TS. Nguyễn Trọng Phúc; 5.4 Danh mục tài liệu tham khảo chuẩn IEEE | **ĐÃ HOÀN TẤT** |
| **6** | **PHỤ LỤC** | Bảng 36 UCs | Chuẩn hóa bảng Ma trận nghiệm thu 36 Use Cases đạt kết quả 100% ĐẠT | **ĐÃ HOÀN TẤT** |

---

## 3. CHI TIẾT NỘI DUNG KỸ THUẬT CÁC CHƯƠNG ĐÃ ĐỒNG BỘ

### 3.1. Chương 1: Tổng Quan Đề Tài (`Chapter_01.tex`)
- **Bối cảnh thực tiễn**: Nhu cầu đào tạo và rèn luyện tiếng Anh 4 kỹ năng Nghe -- Nói -- Đọc -- Viết; gánh nặng chấm chữa thủ công hai kỹ năng Nói/Viết (tiêu tốn 15--30 phút/bài, phản hồi trễ 3--7 ngày); sự ra đời của giải pháp chuyển đổi số kết hợp AI tạo sinh EnglishHub.
- **Mục tiêu đề tài**: Xây dựng nền tảng quản trị tập trung, tự động chấm điểm Đọc/Nghe, ứng dụng mô hình Google Gemini 2.5 Flash SDK phân tích ngữ pháp, từ vựng, tính mạch lạc cho bài Viết và độ trôi chảy, phát âm cho bài Nói; cung cấp phòng chấm bài tập trung *Teacher Grading Studio*.
- **Phân hệ chức năng chi tiết**:
  - *Quản trị viên (Admin)*: Quản lý người dùng, phân quyền vai trò RBAC (Admin, Teacher, Student), quản lý lớp học, giám sát toàn hệ thống.
  - *Giáo viên (Teacher)*: Quản lý lớp học và thành viên, tạo bài tập đa kỹ năng tích hợp trong một đề thi duy nhất, mở/khóa bài tập, Teacher Grading Studio duyệt/tùy biến gợi ý của AI, xuất bảng điểm.
  - *Học viên (Student)*: Làm bài thi trực tuyến qua Exam Stepper 4 kỹ năng (audio S3, gõ văn bản/đính kèm Word-PDF, ghi âm trực tiếp qua mic), nộp bài, xem bài chữa chi tiết từng câu và theo dõi lịch sử điểm số.

### 3.2. Chương 2: Công Nghệ và Công Cụ Sử Dụng Theo 5 Vai Trò (`Chapter_02.tex`)
- **2.1. Project Manager (Hồ Việt Tùng)**:
  - Trello Board theo mô hình Scrum 10 Sprints độc lập (quản trị trực quan 35 thẻ QA/Testing và toàn bộ backlog).
  - Quy trình Handoff Spec-Driven Development (SDD) qua thư mục chia sẻ `production_artifacts/`.
  - Bộ tiêu chuẩn Definition of Done (DoD) kết hợp công cụ Project Doctor (`/doctor`) đạt 100% Quality Gates.
- **2.2. Frontend Developer (Trần Tiến Sơn)**:
  - React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, Lucide Icons (46 màn hình nghiệp vụ).
  - Cỗ máy làm bài thi Exam Stepper State Machine cô lập trạng thái, tự động lưu nháp (Auto-Save) định kỳ.
  - Tích hợp HTML5 Audio stream từ S3 và MediaRecorder API thu âm WebM Opus chất lượng cao.
  - Axios Interceptors tự động đính kèm và làm mới JWT Bearer Token.
- **2.3. Backend Developer (Đoàn Thái Sơn, Phạm Minh Tuấn)**:
  - Java 21, Spring Boot 3.3.4 áp dụng kiến trúc Domain-Driven Design (DDD) phân tách 4 tầng và 11 Bounded Contexts.
  - Cung cấp **62 REST API endpoints** chuẩn OpenAPI/Swagger.
  - Spring Data JPA, Hibernate, **17 phiên bản Flyway Database Migration** quản lý cấu trúc bảng.
  - AI Assistant Microservice (Python 3.12, FastAPI, Google Gemini 2.5 Flash SDK, ffmpeg audio conversion).
- **2.4. Tester (Nguyễn Văn Tú)**:
  - Framework kiểm thử tự động giao diện **Selenium WebDriver trên nền tảng Node.js/JavaScript** (Mocha, Chai, ChromeDriver) theo mô hình **Page Object Model (POM)**.
  - Ma trận kiểm thử tổng thể **Excel Master Test Matrix** (62+ kịch bản chi tiết) kết hợp nền tảng đám mây **Qase TestOps**.
  - 133 tệp kiểm thử tự động hóa (93 BE JUnit 5 + 40 FE Vitest), độ phủ code coverage $\ge 82.4\%$.
  - Kiểm thử hiệu năng và tải bằng công cụ **k6 Load Testing**.
- **2.5. DevOps (Phạm Minh Tuấn, Hồ Việt Tùng)**:
  - Môi trường Local/Dev: Docker Compose đa container, PostgreSQL 16 cục bộ, MinIO S3 Object Storage (bucket `english-hub-media` và `english-hub-submissions`).
  - Môi trường Staging/Production: VPS Ubuntu Server, Nginx Reverse Proxy với Let's Encrypt SSL, cơ sở dữ liệu serverless **Neon Serverless PostgreSQL** (\textit{Neon Database Storage}) kết hợp Cloud Storage với Presigned URL 15 phút.
  - Tự động hóa CI/CD qua GitHub Actions và quy tắc bảo vệ nhánh `IMMUTABLE-CORE-BRANCHES`.

### 3.3. Chương 3: Kết Quả Triển Khai (`Chapter_03.tex`)
- **Triển khai Backend**: Dịch vụ lõi Spring Boot 3.3.4 DDD 62 REST API endpoints, AI FastAPI microservice, quy trình CI/CD GitHub Actions, dịch vụ lưu trữ đa môi trường MinIO Dev vs Cloud Storage Staging/Prod.
- **Triển khai Frontend**: 46 màn hình SPA, bộ máy Exam Stepper, TypeScript typecheck và 40 Vitest files.
- **Triển khai Cơ sở dữ liệu**: PostgreSQL 16 Dev, Neon Serverless PostgreSQL Staging/Prod với 17 bảng quan hệ chuẩn hóa và 17 bản ghi Flyway Migration, cấu hình HikariCP keepalive 60 giây chống cold-start.
- **Chi tiết 36 Use Cases**: Báo cáo nghiệm thu trọn vẹn 36/36 UCs (100%) phân bổ theo 5 phân hệ lớn.

### 3.4. Chương 4: Kết Quả Kiểm Thử (`Chapter_04.tex`)
- **Bảng 4.1: Tổng kết kết quả kiểm thử qua 10 Sprints Scrum**:
  - Tổng số Test Cases thực thi: **429 TCs**.
  - Số ca Pass: **409 TCs**; Số ca Fail đã xử lý: **20 TCs**; Tỷ lệ đạt: **95.3\%**.
  - Ghi nhận chi tiết kết quả từng Sprint từ Sprint 0 đến Sprint 10 và các thẻ Trello QA tương ứng.
- **Bảng 4.2: Tổng kết kết quả kiểm thử theo 6 phân hệ chức năng**:
  - Xác thực & Phân quyền: 56 TCs (100% Pass).
  - Quản lý Lớp & Thành viên: 48 TCs (100% Pass).
  - Quản lý Bài tập Giáo viên: 74 TCs (97.3% Pass).
  - Làm bài thi 4 Kỹ năng: 112 TCs (96.4% Pass).
  - Chấm điểm & AI Studio: 85 TCs (96.5% Pass).
  - Báo cáo & Thống kê: 54 TCs (100% Pass).
- **Chỉ số hiệu năng & Chịu tải**:
  - API đọc dữ liệu đạt P95 $< 380$ms; API nộp bài đạt P95 $< 620$ms.
  - AI chấm bài Viết đạt trung bình 3.6 giây; bài Nói đạt 4.1 giây.
  - Chịu tải k6 với 100 CCU trong 5 phút đạt tỷ lệ thành công 99.8\%.
- **Khắc phục 14 lỗi P0 Blockers**: Xử lý triệt để các lỗi #174 (mất bài submit), #175 (upload PDF lớn), #176 (stream audio gián đoạn), #212 (xung đột nộp bài), #233 (403 AI Microservice) và #234--#242 (cold-start DB).

### 3.5. Chương 5: Đánh Giá, Hướng Phát Triển và Kết Luận (`Chapter_05.tex`)
- **Đánh giá hệ thống**: Đạt 100% 36 Use Cases; điểm mạnh về kiến trúc DDD, AI thực tế Gemini, lưu trữ đa môi trường MinIO/Neon DB, kỷ luật Scrum có Tester phê duyệt; các thách thức kỹ thuật đã vượt qua.
- **Hướng phát triển tương lai**: Học thích ứng thông minh (Adaptive Learning), Whisper STT offline trên Docker nội bộ, Mobile App React Native, Ngân hàng đề thi chuẩn quốc tế IELTS/TOEIC.
- **Kết luận**: Đóng góp học thuật và thực tiễn, kinh nghiệm làm việc nhóm, lời tri ân sâu sắc tới **TS. Nguyễn Trọng Phúc**.
- **Tài liệu tham khảo**: 9 nguồn tài liệu chuẩn mực (IEEE Std 830, Spring Boot 3.3, React 19, Google Gemini API, PostgreSQL 16, MinIO, Neon DB, Selenium WebDriver, Evans DDD).

### 3.6. Phụ Lục: Ma Trận Nghiệm Thu 36 Use Cases (`Appendix.tex`)
- Toàn bộ 36 Use Cases từ UC001 đến UC036 đều đạt kết quả nghiệm thu **ĐẠT (100%)**.

---

## 4. BẢNG MÃ ĐỒNG BỘ TRÊN OVERLEAF CLOUD

Toàn bộ các tệp tin của Báo cáo Tổng kết `04_FR` đã được tải lên thành công vào dự án Overleaf Cloud (`Project_1` - ID: `6a8d98489e5b4896f3515c11`):

| Tệp tin | Đường dẫn trên Cloud | Entity ID mới trên Overleaf | Dung lượng | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| `04_FR.tex` | `final/reports/04_FR.tex` | `6aeefbd43cd4153a017fcfba` | 19.14 KB | **Synced 100%** |
| `Chapter_01.tex` | `final/reports/04_Final Report/Chapter_01.tex` | `6aeefbd95d4ccedd233b2e4a` | 9.39 KB | **Synced 100%** |
| `Chapter_02.tex` | `final/reports/04_Final Report/Chapter_02.tex` | `6aeefbdda934e0abb17062e4` | 12.58 KB | **Synced 100%** |
| `Chapter_03.tex` | `final/reports/04_Final Report/Chapter_03.tex` | `6aeefbe0b77bec0132c6a7f8` | 12.90 KB | **Synced 100%** |
| `Chapter_04.tex` | `final/reports/04_Final Report/Chapter_04.tex` | `6aeefbe50324c6c7a6a02dd7` | 9.70 KB | **Synced 100%** |
| `Chapter_05.tex` | `final/reports/04_Final Report/Chapter_05.tex` | `6aeefbe75d645cc7834d6fdb` | 9.38 KB | **Synced 100%** |
| `Appendix.tex` | `final/reports/04_Final Report/Appendix.tex` | `6aeefbea264c70bbb1400b7c` | 2.98 KB | **Synced 100%** |

---

## 5. KẾT QUẢ KIỂM TRA CHẤT LƯỢNG (QUALITY GATES)

- **Kiểm tra từ khóa lỗi thời (Zero Outdated Keywords)**: Quét tự động toàn bộ 52 tệp `.tex` trong `final/` xác nhận **0 vi phạm** đối với các từ khóa: `Ant Design`, `TestNG`, `Hiếu Cường`, `Flyway Migration v6`, `Cloudflare`, `Tháng 4 Năm 2026`.
- **Độ nhất quán đa tài liệu**: 100% thông tin công nghệ (Java 21, Spring Boot 3 DDD, React 19, MinIO Dev, Neon DB Staging/Prod, Selenium Node.js POM, 36 UCs, 10 Sprints Scrum) hoàn toàn khớp giữa 4 tài liệu chủ đạo: `00_PI`, `01_SRS`, `02_PP`, `03_TP` và `04_FR`.
