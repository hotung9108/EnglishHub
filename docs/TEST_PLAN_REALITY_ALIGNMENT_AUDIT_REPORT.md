# BÁO CÁO RÀ SOÁT VÀ ĐỒNG BỘ TOÀN DIỆN TÀI LIỆU KIỂM THỬ (03. TEST PLAN) VỚI THỰC TẾ DỰ ÁN VÀ TRELLO BOARD

> **Dự án**: EnglishHub -- Xây dựng website quản lý bài tập và chấm chữa bài tiếng Anh thông minh  
> **Thời điểm hoàn thành**: 07/11/2026  
> **Tài liệu mục tiêu**: `overleaf_reports/Project_1/final/reports/03_TP.tex` và 13 chương tại `final/reports/03_Chapters/` (`1.tex` -- `12.tex`, `A.tex`)  
> **Trạng thái đám mây**: Đã đồng bộ 100% lên Overleaf Cloud (`Project_1` -- ID: `6a8d98489e5b4896f3515c11`)  
> **Căn cứ thực tế**: Trello board `Project1` (18 danh sách công việc), Codebase (`test/`, `backend/`, `frontend/`, `ai-service/`), Database (17 Flyway migrations), và các chỉ đạo kỹ thuật của người dùng.

---

## 1. TỔNG QUAN HIỆN TRẠNG VÀ CÁC ĐIỂM ĐÃ ĐƯỢC CHUẨN HÓA

Trước khi rà soát, tài liệu Kế hoạch Kiểm thử (`03_TP.tex`) tồn tại một số điểm sai lệch công nghệ, mâu thuẫn kiến trúc và chưa phản ánh trung thực toàn bộ diễn biến kiểm thử thực tế trên Trello:

| Hạng mục đối soát | Hiện trạng cũ trong tài liệu | Hiện trạng thực tế (Codebase, Trello, DB) | Giải pháp chuẩn hóa đã áp dụng |
| :--- | :--- | :--- | :--- |
| **Framework E2E UI** | Ghi *"Selenium/TestNG"* (nền tảng Java) | Framework JavaScript/Node.js (`test/selenium/`) dùng `selenium-webdriver` v4.16, Mocha, Chai, ChromeDriver | Chuẩn hóa 100% sang **Selenium WebDriver (JavaScript/Node.js)** áp dụng mô hình Page Object Model (POM) trên Staging. |
| **Quản lý Test Case** | Chỉ nhắc đến Qase, coi Excel là file xuất | Người dùng yêu cầu *"vẫn có selenium, excel, qase nhé"*; Trello có thẻ `[QA-03] Excel test` ngay từ Sprint 0 | Khẳng định mô hình song hành: **Excel Master Test Matrix** (`docs/testing/EnglishHub_TestCase_Matrix.xlsx`) là nguồn gốc, kết hợp **Qase Cloud** để chạy test run. |
| **Kiến trúc Lưu trữ** | Chỉ ghi chung chung "PostgreSQL" | Dev dùng MinIO S3 + PostgreSQL 16; Staging/Prod dùng Neon Serverless DB + Cloud Storage | Phân tách rõ ràng: **Dev cục bộ dùng MinIO S3 (`englishhub-dev`)**; **Staging/Prod dùng Neon Database Storage** (`sslmode=require`, keepalive 60s). |
| **Frontend Stack** | Ghi có *"Ant Design"* | Frontend dùng React 19, Vite, Tailwind CSS, Shadcn UI / Radix UI, Lucide React (không dùng Ant Design) | Loại bỏ hoàn toàn Ant Design; cập nhật React 19, Tailwind, Shadcn UI. |
| **Kiểm thử Đơn vị / Tải** | Chưa liệt kê Vitest và k6 | Codebase có 93 file test JUnit 5, Vitest + React Testing Library trong CI, k6 scenarios | Bổ sung đầy đủ **JUnit 5 + Mockito** (Backend), **Vitest** (Frontend UI), **Pytest** (AI), và **k6** (Load test P95). |
| **Tiến trình Scrum** | Lịch kiểm thử còn sót mốc chung chung | Trello ghi nhận chi tiết 35 thẻ QA/Test trải dài từ Sprint 0 đến Sprint 10 | Ánh xạ chi tiết từng mã thẻ Trello (`[QA-01]` đến `[QA-32]`, `[OPS-25]`, `[OPS-36]`, `[OPS-43]`) vào bảng 10 Sprints. |
| **Quyền hạn Tester & DoD** | Tiêu chí nghiệm thu chưa có Project Doctor | AGENTS.md và PP quy định: Project Doctor 100% Quality Gates; Tester là người duy nhất duyệt PR/Done | Đưa tiêu chuẩn **Project Doctor (`/doctor`)** và **quyền hạn độc quyền của Tester (`@Zawn-Tsu` / Nguyễn Văn Tú)** vào DoD. |

---

## 2. BẢN ĐỒ ÁNH XẠ CÔNG VIỆC KIỂM THỬ TRÊN TRELLO BOARD `Project1`

Qua rà soát trực tiếp 246 thẻ công việc trên Trello board `Project1`, toàn bộ 35 thẻ chuyên trách về QA / Testing và DevOps CI/CD đã được liên kết chính xác vào tài liệu:

### 2.1. Giai đoạn Khởi tạo & Chuẩn bị (Sprint 0: 26/08 -- 27/08/2026)
* `[QA-01]`: Viết tài liệu kiến thức về tester (List: `00. PI`).
* `[QA-02]`: Viết tài liệu các công cụ testing phi chức năng (List: `00. PI`).
* `[QA-03]`: **Excel test** (List: `03. TP` -- Due: 29/08/2026) -- *Khởi tạo bảng Ma trận kiểm thử tổng thể trên Excel trước khi có API*.

### 2.2. Giai đoạn Kiểm thử Nền tảng (Sprint 1 -- Sprint 3: 09/09 -- 30/09/2026)
* `[QA-04]`: Khởi tạo báo cáo kế hoạch kiểm thử (Test Plan) (Due: 11/09/2026).
* `[QA-07]`: API Auth test case & `[QA-08]`: Tạo test case cho API User (List: `Done (Sprint 1)`).
* `[QA-05]`: Tester: Test plan, Test case & `[QA-06]`: Hoàn thiện báo cáo Tester v1.1 (Due: 21/09/2026).
* `[QA-09]`: Báo cáo test case cho API User (List: `Done (Sprint 2)`).
* `[QA-10]`: API User Profile test case, `[QA-11]`: API Classes test case, `[QA-12]`: API User Profile chạy test case, `[QA-13]`: API Assignments viết test case, `[QA-14]`: API Assignments chạy test case (List: `Done (Sprint 3)`).

### 2.3. Giai đoạn AI Microservice & Teacher Studio (Sprint 4 -- Sprint 5: 01/10 -- 15/10/2026)
* `[QA-15]`: **Trình bày lại test case trên Qase khoa học hơn** (List: `Done (Sprint 4)`).
* `[QA-16]`: API Assignments submission test case & `[QA-18]`: chạy test case nộp bài.
* `[QA-17]`: API Student Evaluation test case & `[QA-19]`: chạy test case đánh giá học viên.
* `[QA-32]`: Chuẩn bị bộ dữ liệu mẫu benchmark 20 bài cho pipeline chấm AI Nói và Viết.
* `[QA-20]`: API Grading test case & `[QA-21]`: API Grading chạy test case.
* `[QA-22]`: Viết Test Summary Report (TSR đợt 1) & `[QA-23]`: Regression test các API đã hoàn thành.
* `[QA-24]`: **Thiết lập Selenium Framework cho test giao diện Web** (`test/selenium/`, Due: 11/10/2026).

### 2.4. Giai đoạn Mở rộng Tự động hóa & Khắc phục P0 Blockers (Sprint 6 -- Sprint 8: 16/10 -- 06/11/2026)
* `[QA-25]`: Viết & chạy test Selenium cho luồng Giáo viên trên Staging (`https://staging.hotung9108.me`).
* `[OPS-25]`: Bổ sung bước kiểm thử tự động (`npm test`) vào pipeline `ci-frontend.yml` (P0).
* `[QA-26]`: Viết & chạy test Selenium cho luồng Học viên trên Staging.
* `[QA-27]`: Viết & chạy test Selenium cho luồng Admin trên Staging.
* `[QA-28]`: Thiết lập Vitest & React Testing Library cho UI Components (P0).
* `[QA-29]`: **Viết lại test suite thật & khai báo toàn bộ bug vào hệ thống** -- *chấm dứt tình trạng test placeholder, viết assertion thật, kiểm thử khắc phục hoàn toàn 14 lỗi P0 Blockers (#174 mất bài submit, #175 mất PDF, #176 mất audio, #212 lưu nháp, #233 lỗi 403 AI)*.
* `[OPS-36]`: Xây dựng bộ test CI tự động cho pipeline audio Speaking & Listening với FFmpeg transcoder.

### 2.5. Giai đoạn Hồi quy Toàn diện & Nghiệm thu (Sprint 9 -- Sprint 10: 07/11 -- 22/11/2026)
* `[QA-30]`: Xác nhận và kiểm thử độ phủ UI làm bài 4 kỹ năng (UC15--UC19).
* `[QA-31]`: Kiểm thử đánh giá NFR Usability và Maintainability Lần 1 ($\geq$ 80%).
* `[OPS-43]`: Load testing cho AI Service & API chính bằng k6 (50--100 CCU, đo thời gian đáp ứng P95).
* Full Regression toàn bộ 36 Use Cases với 133 file automated tests (93 BE JUnit + 40 FE Vitest).
* Smoke test bản đóng gói Production Docker Compose, chốt Test Summary Report (TSR) và nghiệm thu bảo vệ đồ án.

---

## 3. CHI TIẾT CÁC THAY ĐỔI THEO TỪNG CHƯƠNG TRÊN OVERLEAF

Toàn bộ 14 file (`03_TP.tex`, `1.tex` đến `12.tex` và `A.tex`) đã được biên tập và nâng cấp toàn diện:

### 3.1. `03_TP.tex` (Master Wrapper & Lời mở đầu)
* **Lời mở đầu**: Chuẩn hóa chính tả danh từ riêng *"tiếng Anh"*, cập nhật bối cảnh kiểm thử toàn diện qua 10 Sprints Scrum chính thức (thay vì giai đoạn đầu). Bổ sung sự phối hợp của các công cụ hiện đại (Trello, GitHub, Excel, Qase, Selenium WebDriver, k6).
* **Cấu trúc lệnh `\input`**: Giữ nguyên cơ chế phân rã modulary bám sát 12 chương và phụ lục trong `final/reports/03_Chapters/`.

### 3.2. `1.tex` -- Chương 1: GIỚI THIỆU
* **Công nghệ Frontend**: Loại bỏ Ant Design; xác định rõ React 19, Vite, TypeScript, Shadcn UI / Radix UI, Tailwind CSS, Lucide React.
* **Backend**: Java 21, Spring Boot 3.x, Spring Data JPA, Hibernate, 17 bản ghi Flyway migration.
* **Lưu trữ đa môi trường**: Phân tách rõ Local Dev dùng MinIO Object Storage (bucket `englishhub-dev`, console 9001/API 9000) và PostgreSQL 16; Staging/Production dùng Neon Database Storage (Neon Serverless PostgreSQL với pooler endpoint, `sslmode=require`) + Cloud Storage.
* **AI Service**: Python 3.11, FastAPI, Google Gemini 2.5 Flash SDK, FFmpeg.
* **Công cụ Kiểm thử**: Chuẩn hóa Selenium WebDriver (Node.js/JavaScript), Excel Master Test Matrix + Qase, Postman, k6, JUnit 5, Vitest, SonarQube, Lighthouse.

### 3.3. `2.tex` -- Chương 2: GIẢ ĐỊNH / RÀNG BUỘC / RỦI RO
* **Giả định**: Bổ sung tính sẵn sàng của hạ tầng đa môi trường Dev (MinIO) và Staging (Neon DB); xác định 3 tài khoản kiểm thử đại diện cho 3 vai trò (Admin, GV, HV).
* **Ràng buộc**: Khẳng định ngân sách 0 đồng; nêu rõ giải pháp duy trì Master Test Matrix trên Excel (`docs/testing/EnglishHub_TestCase_Matrix.xlsx`) để chủ động vượt qua giới hạn hạn mức của gói Qase Free; phân định rõ trách nhiệm kiêm nhiệm của các thành viên.
* **Rủi ro**: Bổ sung rủi ro lệch đồng bộ dữ liệu giữa MinIO cục bộ và Neon DB trên đám mây; rủi ro mã hóa âm thanh (WebM/Opus sang WAV 16kHz); rủi ro cold start trên Staging serverless được khắc phục bằng keepalive 60 giây.

### 3.4. `3.tex` -- Chương 3: PHƯƠNG PHÁP / CHIẾN LƯỢC KIỂM THỬ
* **Chiến lược kiểm thử**: Phân định kiểm thử hộp đen cho 36 use cases và kiểm thử hộp trắng cho pipeline AI và backend.
* **Tự động hóa**: Thay thế hoàn toàn "Selenium/TestNG" bằng **Selenium WebDriver trên Node.js/JavaScript (Mocha, Chai, ChromeDriver)** theo mô hình Page Object Model tại `test/selenium/`. Bổ sung kiểm thử Component bằng **Vitest** trong pipeline CI `ci-frontend.yml`.
* **Tiêu chí nghiệm thu & DoD**: Bổ sung yêu cầu bắt buộc phải vượt qua 100% Quality Gates của công cụ **Project Doctor (`/doctor`)**; code coverage $\ge$ 80%; khẳng định **chỉ duy nhất Tester chính (`@Zawn-Tsu` / Nguyễn Văn Tú) có thẩm quyền ký duyệt PR và chuyển task sang Done**.

### 3.5. `4.tex` -- Chương 4: KẾ HOẠCH KIỂM THỬ
* **Development Testing**: Phân bổ rõ JUnit 5 + Mockito cho Spring Boot backend, Vitest cho React UI components, Pytest cho FastAPI AI service.
* **Validation Testing**: Kiểm thử 36 use cases nghiệp vụ và kiểm thử E2E bằng Selenium WebDriver trên Staging.
* **Implementation Testing**: Kiểm tra CI/CD GitHub Actions, xác nhận tính toàn vẹn 17 bản ghi Flyway migration, lưu trữ tệp trên MinIO S3 Dev và Neon Database Storage trên Staging qua SSL.
* **Operational Testing**: Bổ sung k6 load testing (50--100 CCU), kiểm tra thời gian đáp ứng P95 và cơ chế phục hồi lỗi ngoại lệ an toàn khi gọi Google Gemini.

### 3.6. `5.tex` -- Chương 5: TIẾN TRÌNH KIỂM THỬ
* **Quy trình Handoff chuẩn**: Lập trình viên bàn giao hướng dẫn tại `production_artifacts/be_to_tester/` và `fe_to_tester/`; Tester xuất bản kết quả tại `production_artifacts/test_reports/`.
* **Cổng phê duyệt**: Khẳng định quyền hạn tối cao của Tester trong việc di chuyển thẻ Trello từ `Review` sang `Done (Sprint X)`.
* **Họp Scrum định kỳ**: Đồng bộ việc báo cáo test run và tình trạng bug trong các buổi Sprint Review/Retrospective hàng tuần.

### 3.7. `6.tex` -- Chương 6: KIỂM THỬ TÍNH NĂNG
* **Bảng 6.1 (Các tính năng được kiểm thử)**: Kiểm tra và chuẩn hóa thành phần kỹ thuật cho toàn bộ 36 use cases (`UC01`--`UC36`), đặc biệt các luồng nộp bài chống mất dữ liệu (#174), lưu nháp (#212), và pipeline chấm chữa AI (Gemini Flash, FFmpeg, Presigned URL).
* **Bảng 6.2 (NFRs)**: Chuẩn hóa công cụ đo lường Usability (Lighthouse, Chrome DevTools, Selenium) và Maintainability (SonarQube, Project Doctor, Vitest, JUnit 5) với mục tiêu $\ge$ 80%.
* **Bảng 6.3 (Các tính năng không kiểm thử)**: Nêu rõ không kiểm thử độ chính xác học thuật chủ quan của AI; không stress test hàng nghìn CCU (chỉ test tải vừa phải với k6 50--100 CCU).

### 3.8. `7.tex` -- Chương 7: TEST CASES
* **Mô hình Quản trị kép**: Khẳng định vai trò nền tảng của **Master Test Case Matrix Workbook trên Excel** (`docs/testing/EnglishHub_TestCase_Matrix.xlsx`) khởi tạo từ thẻ Trello `[QA-03]`, phối hợp cùng **Qase Platform** và bộ mã nguồn kiểm thử tự động trong `test/selenium/tests/`.
* **Cấu trúc Test Case**: ID chuẩn (`TC_<Module>_<STT>`), use case tham chiếu, điều kiện tiên quyết, các bước, dữ liệu test, kết quả mong đợi, độ ưu tiên và trạng thái.
* **Lưu trữ**: Quy định cụ thể nơi lưu trữ file Excel gốc, mã nguồn test trên Git repo, test run trên Qase và bằng chứng nghiệm thu tại `production_artifacts/test_reports/`.

### 3.9. `8.tex` -- Chương 8: THEO DÕI VÀ BÁO CÁO LỖI
* **Defect Life Cycle**: Quy trình 5 bước khép kín từ lúc phát hiện lỗi $\rightarrow$ tạo GitHub Issue & thẻ Trello `Blocked` $\rightarrow$ phân công lập trình viên fix lỗi $\rightarrow$ tạo PR cú pháp `closes #<id>` qua Project Doctor $\rightarrow$ Tester retest trên Staging, phê duyệt PR và đóng lỗi.
* **Phân loại**: Severity (Blocker, Critical, Major, Normal, Minor) và Priority (P0--P4).
* **Thực tế dự án**: Nêu dẫn chứng đợt xử lý dứt điểm 14 lỗi P0 Blockers tại Sprint 8 (mất text #174, mất PDF #175, mất audio #176, lỗi 403 AI #233, lưu nháp #212).

### 3.10. `9.tex` -- Chương 9: MÔI TRƯỜNG KIỂM THỬ
* **Bảng 9.1 (Phần cứng)**: Nâng cấp yêu cầu máy phát triển/kiểm thử lên RAM $\ge$ 16GB để chạy mượt mà Docker Compose và Selenium Browser Runner.
* **Bảng 9.2 (Phần mềm & Công cụ)**: Chuẩn hóa toàn bộ danh mục công cụ: Windows 10/11, JDK 21, Node.js 22, Python 3.11, PostgreSQL 16, Neon Database Storage, MinIO S3, React 19, Docker Compose, GitHub Actions, Trello board `Project1`, Microsoft Excel, Qase, Selenium WebDriver Node.js, Vitest, JUnit 5, Postman, k6, Project Doctor, SonarQube, Lighthouse.
* **Dữ liệu test & Audio Fixtures**: Chuẩn hóa bộ dữ liệu kiểm thử, bộ 20 bài benchmark AI, quy chuẩn seeding dữ liệu sạch qua 17 Flyway migrations.
* **Bảo mật môi trường**: Cơ chế redaction thông tin nhạy cảm của Selenium Framework, quản lý API Key qua biến môi trường.

### 3.11. `10.tex` -- Chương 10: SẢN PHẨM BÀN GIAO KIỂM THỬ
* **Danh mục bàn giao**: 
  1. Tài liệu Kế hoạch kiểm thử (`03.TP`).
  2. Bảng Ma trận Kiểm thử Tổng thể trên Excel (`EnglishHub_TestCase_Matrix.xlsx`).
  3. Dự án kiểm thử trực tuyến trên Qase Cloud.
  4. Toàn bộ mã nguồn kiểm thử tự động E2E Selenium WebDriver (`test/selenium/`).
  5. Bộ kiểm thử đơn vị & tích hợp: 93 file test JUnit 5, Vitest UI component tests, Pytest AI service.
  6. Báo cáo Sự cố Kiểm thử (TIRs) trên GitHub Issues.
  7. Báo cáo Tổng kết Kiểm thử (TSR) tại `production_artifacts/test_reports/`.

### 3.12. `11.tex` -- Chương 11: LỊCH KIỂM THỬ
* **Bảng 11.1 (Cột mốc 10 Sprints)**: Liên kết trực tiếp các thẻ công việc Trello thực tế (`[QA-01]` đến `[QA-32]`, `[OPS-25]`, `[OPS-36]`, `[OPS-43]`) vào từng sprint cụ thể từ 26/08/2026 đến 22/11/2026, phản ánh chân thực tiến trình xây dựng bộ test suite, xử lý 14 lỗi P0 Blockers và nghiệm thu sản phẩm.

### 3.13. `12.tex` -- Chương 12: VAI TRÒ VÀ TRÁCH NHIỆM TRONG KIỂM THỬ
* **Bảng 12.1 (Phân công nhân sự)**:
  * **Nguyễn Văn Tú (`@Zawn-Tsu`)**: QA Lead / Tester chuyên trách -- Quản lý Master Test Matrix trên Excel, Qase, Selenium WebDriver E2E; nắm độc quyền thẩm quyền phê duyệt PR và chuyển Done trên Trello.
  * **Đoàn Thái Sơn**: Backend Developer Primary & AI Lead -- Viết Unit Test JUnit 5 và Pytest, fix bug backend/AI.
  * **Phạm Minh Tuấn**: Backend Secondary & DevOps Primary -- Thiết lập CI/CD GitHub Actions, quản lý Docker Compose, MinIO, Neon DB.
  * **Trần Tiến Sơn (`@Maloque18705`)**: Frontend Developer Primary -- Viết Vitest component tests, fix bug UI và responsive.
  * **Hồ Việt Tùng (`@hotung9108`)**: Project Manager & DevOps Secondary -- Điều phối Trello Scrum board, phê duyệt Change Control.
* **Quy trình phối hợp 4 bước**: Mô tả tường minh luồng Dev $\rightarrow$ Project Doctor $\rightarrow$ Handoff $\rightarrow$ Tester kiểm thử $\rightarrow$ Báo lỗi / Duyệt PR $\rightarrow$ Done.

### 3.14. `A.tex` -- PHỤ LỤC
* **Phụ lục A (Bản ghi thay đổi)**: Bổ sung phiên bản **v1.2 (07/11/2026)** do Nguyễn Văn Tú thực hiện, ghi nhận việc rà soát chuyên sâu theo Trello task board thực tế, chuẩn hóa Selenium WebDriver Node.js, Excel Master Test Matrix, MinIO / Neon DB và 10 Sprints Scrum.
* **Phụ lục B (Thuật ngữ viết tắt)**: Bổ sung các thuật ngữ cốt lõi: MinIO, Neon DB, S3, E2E, POM, DoD.
* **Phụ lục C (Tài liệu tham khảo)**: Bổ sung file Excel Ma trận kiểm thử (`EnglishHub_TestCase_Matrix.xlsx`) và Hướng dẫn Selenium Framework (`test/selenium/README.md`).
* **Phụ lục D (Phê duyệt)**: Bổ sung xác nhận phê duyệt nội bộ của Project Manager (Hồ Việt Tùng) và QA Lead (Nguyễn Văn Tú).

---

## 4. BẢNG TỔNG HỢP TRẠNG THÁI ĐỒNG BỘ LÊN OVERLEAF CLOUD

Tất cả 14 file đã được cập nhật thành công lên Overleaf Cloud (`Project_1` -- ID: `6a8d98489e5b4896f3515c11`):

| STT | Tên file trên Overleaf | Đường dẫn từ Root | ID mới trên Cloud | Kích thước | Trạng thái đồng bộ |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | `03_TP.tex` | `final/reports/03_TP.tex` | `6aeee9e80e2efc15389a7199` | 17.5 KB | **Thành công 100%** |
| 2 | `1.tex` | `final/reports/03_Chapters/1.tex` | `6aeee9ea22046c07b62f3ff0` | 5.98 KB | **Thành công 100%** |
| 3 | `2.tex` | `final/reports/03_Chapters/2.tex` | `6aeee9ee5d645cc78345c253` | 6.28 KB | **Thành công 100%** |
| 4 | `3.tex` | `final/reports/03_Chapters/3.tex` | `6aeee9f203ca6c90d72dd776` | 8.91 KB | **Thành công 100%** |
| 5 | `4.tex` | `final/reports/03_Chapters/4.tex` | `6aeee9f5cbcd361b1f3850e4` | 7.07 KB | **Thành công 100%** |
| 6 | `5.tex` | `final/reports/03_Chapters/5.tex` | `6aeee9f80925752415779776` | 4.68 KB | **Thành công 100%** |
| 7 | `6.tex` | `final/reports/03_Chapters/6.tex` | `6aeee9fcc2b88b3db08ffed5` | 6.11 KB | **Thành công 100%** |
| 8 | `7.tex` | `final/reports/03_Chapters/7.tex` | `6aeee9ff5d4ccedd232f5589` | 5.71 KB | **Thành công 100%** |
| 9 | `8.tex` | `final/reports/03_Chapters/8.tex` | `6aeeea02b77bec0132bf2946` | 5.10 KB | **Thành công 100%** |
| 10 | `9.tex` | `final/reports/03_Chapters/9.tex` | `6aeeea053ea7a24e3da17973` | 10.43 KB | **Thành công 100%** |
| 11 | `10.tex` | `final/reports/03_Chapters/10.tex` | `6aeeea0803ca6c90d72de896` | 4.12 KB | **Thành công 100%** |
| 12 | `11.tex` | `final/reports/03_Chapters/11.tex` | `6aeeea0aeb1a1cf3d9b29309` | 3.81 KB | **Thành công 100%** |
| 13 | `12.tex` | `final/reports/03_Chapters/12.tex` | `6aeeea0e583be0fcd1b3eda9` | 4.96 KB | **Thành công 100%** |
| 14 | `A.tex` | `final/reports/03_Chapters/A.tex` | `6aeeea11eb1a1cf3d9b29986` | 6.50 KB | **Thành công 100%** |

---

## 5. KẾT LUẬN VÀ BƯỚC TIẾP THEO

Tài liệu **Kế hoạch Kiểm thử (03. Test Plan)** hiện nay đã đạt độ chính xác và tính nhất quán tuyệt đối:
* Khớp 100% với đặc tả 36 Use Cases trong SRS (`01_SRS.tex`) và các Activity Diagrams chuẩn hóa.
* Khớp 100% với WBS và kế hoạch 10 Sprints Scrum trong Project Plan (`02_PP.tex`).
* Khớp 100% với kiến trúc lưu trữ đa môi trường: MinIO S3 tại Dev và Neon Serverless PostgreSQL tại Staging/Production.
* Khớp 100% với hệ sinh thái kiểm thử thực tế trong mã nguồn: Selenium WebDriver (Node.js POM), Excel Master Test Matrix, Qase Platform, Vitest, JUnit 5, Pytest, k6.
* Khớp 100% với 35 thẻ công việc QA/Testing trên Trello board `Project1` và quy chuẩn thẩm quyền nghiệm thu của Tester.

Tài liệu sẵn sàng phục vụ việc biên tập Báo cáo Tổng kết Dự án (`04_FR.tex`) trong bước tiếp theo.
