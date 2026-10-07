# EnglishHub

Hệ thống Quản lý và Chấm chữa Bài tập Tiếng Anh Hỗ trợ AI (English Assignment Management & Smart Grading Platform).

---

## Mục lục

1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Tính năng cốt lõi](#2-tính-năng-cốt-lõi)
3. [Kiến trúc kỹ thuật và Công nghệ sử dụng](#3-kiến-trúc-kỹ-thuật-và-công-nghệ-sử-dụng)
4. [Yêu cầu hệ thống](#4-yêu-cầu-hệ-thống)
5. [Hướng dẫn cài đặt và khởi chạy cục bộ](#5-hướng-dẫn-cài-đặt-và-khởi-chạy-cục-bộ)
6. [Tài khoản thử nghiệm](#6-tài-khoản-thử-nghiệm)
7. [Kiểm thử và Đảm bảo chất lượng](#7-kiểm-thử-và-đảm-bảo-chất-lượng)
8. [Quy trình phát triển và CI/CD](#8-quy-trình-phát-triển-và-cicd)
9. [Danh mục tài liệu kỹ thuật](#9-danh-mục-tài-liệu-kỹ-thuật)

---

## 1. Giới thiệu dự án

EnglishHub là nền tảng quản lý học tập chuyên sâu cho việc giao bài, làm bài và chấm chữa bài tập Tiếng Anh cho cả 4 kỹ năng: Nghe (Listening), Nói (Speaking), Đọc (Reading) và Viết (Writing). 

Hệ thống kết hợp giữa quy trình chấm điểm chuẩn mực của giáo viên và khả năng hỗ trợ phân tích ngôn ngữ tự động bằng AI, giúp học sinh nhận phản hồi nhanh chóng, chi tiết, đồng thời giảm tải áp lực chấm bài cho giáo viên.

---

## 2. Tính năng cốt lõi

### Phân hệ Giáo viên (Teacher)
- Quản lý ngân hàng câu hỏi và module bài tập theo từng kỹ năng và dạng bài (Multiple Choice, Short Answer, Essay, Speaking Audio).
- Tạo và phát hành bài tập theo khung thời gian (Assignment Window), cài đặt số lượt nộp và điều kiện làm bài.
- Giao diện chấm bài tập trung: xem bài làm, nghe file ghi âm, đọc bài luận, chấm điểm từng phần, tạo ghi chú chấm (Annotation) và ghi nhận nhật ký thay đổi điểm (Grading Change Logs).
- Theo dõi tiến độ và xuất đánh giá định kỳ theo lớp học.

### Phân hệ Học sinh (Student)
- Làm bài tập đa kỹ năng trực tuyến với giao diện tối ưu hóa trải nghiệm làm bài.
- Nộp bài thi trắc nghiệm, bài viết tự luận và ghi âm phát âm trực tiếp hoặc tải tệp âm thanh/tài liệu lên hệ thống lưu trữ đối tượng đám mây an toàn qua Presigned URL.
- Tra cứu lịch sử nộp bài, điểm số chính thức, nhận xét chi tiết của giáo viên và phản hồi phân tích từ AI.

### Phân hệ Quản trị viên (Admin)
- Quản lý tài khoản, phân quyền người dùng (Admin, Teacher, Student).
- Quản lý danh mục lớp học, phân công giảng dạy và phân bổ học sinh vào lớp.
- Giám sát toàn bộ dữ liệu bài tập và nhật ký hệ thống.

---

## 3. Kiến trúc kỹ thuật và Công nghệ sử dụng

Hệ thống được xây dựng theo mô hình Modular Monolith áp dụng nguyên lý Thiết kế Hướng Tên miền (Domain-Driven Design - DDD) và Kiến trúc Lục giác (Hexagonal Architecture / Ports and Adapters).

### Backend
- Ngôn ngữ & Nền tảng: Java 21, Spring Boot 3.x
- Truy xuất dữ liệu: Spring Data JPA, Hibernate, PostgreSQL 16
- Quản lý phiên bản cơ sở dữ liệu: Flyway Migration
- Lưu trữ tệp tin: S3-compatible Object Storage (hỗ trợ Cloudflare R2, AWS S3, Neon Storage, MinIO)
- Kiểm thử tự động: JUnit 5, Mockito, Testcontainers (PostgreSQL, MinIO/LocalStack)

### Frontend
- Ngôn ngữ & Nền tảng: TypeScript, React 19, Vite
- Quản lý điều hướng: React Router v7
- Bộ icon và kiểu dáng: Lucide React, CSS Module / Tailwind CSS

### Hạ tầng và Vận hành
- Đóng gói ứng dụng: Docker, Docker Compose đa môi trường (dev, prod)
- Mạng riêng ảo triển khai: Tailscale Mesh VPN
- CI/CD: GitHub Actions (Frontend CI, Backend CI, Security Secret Scanning, Auto-deploy Vercel & VPS)
- Quản lý Image: GitHub Container Registry (ghcr.io)

---

## 4. Yêu cầu hệ thống

Trước khi cài đặt môi trường phát triển cục bộ, máy tính cần cài sẵn:
- Git
- Docker và Docker Compose (phiên bản v2 trở lên)
- Java Development Kit (JDK) 21 (khuyến nghị Eclipse Temurin hoặc OpenJDK)
- Node.js phiên bản 20 hoặc 22 LTS
- Trình quản lý gói npm (đi kèm Node.js)

---

## 5. Hướng dẫn cài đặt và khởi chạy cục bộ

### 5.1. Khởi chạy nhanh bằng Docker Compose

Cách nhanh nhất để dựng toàn bộ hệ thống (Database, Backend, Frontend) là dùng Docker Compose:

1. Sao chép tệp cấu hình môi trường mẫu:
   ```bash
   cp env.dev.example .env
   ```

2. Khởi động tất cả các dịch vụ:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

3. Truy cập hệ thống:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8080/api/v1`
   - PostgreSQL: `localhost:5432`

---

### 5.2. Khởi chạy từng dịch vụ thủ công (Dành cho Lập trình viên)

#### Bước 1: Khởi chạy cơ sở dữ liệu PostgreSQL
Chỉ khởi chạy container PostgreSQL nền:
```bash
docker compose -f docker-compose.dev.yml up -d postgres
```

#### Bước 2: Khởi chạy Backend (Spring Boot)
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Chạy ứng dụng thông qua Gradle Wrapper:
   - Trên Linux/macOS:
     ```bash
     ./gradlew bootRun
     ```
   - Trên Windows (PowerShell/CMD):
     ```powershell
     .\gradlew.bat bootRun
     ```
   Backend sẽ lắng nghe tại cổng `8080`. Flyway sẽ tự động đồng bộ hóa các tệp migration vào cơ sở dữ liệu.

#### Bước 3: Khởi chạy Frontend (React + Vite)
1. Mở cửa sổ dòng lệnh mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động máy chủ phát triển:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và truy cập `http://localhost:5173`.

---

## 6. Tài khoản thử nghiệm

Hệ thống tích hợp dữ liệu mẫu (Mock Data) phục vụ kiểm thử phân quyền Role-Based Access Control:

| Vai trò | Email đăng nhập | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| Quản trị viên (Admin) | `admin@eh.com` | Bất kỳ | Toàn quyền quản trị hệ thống |
| Giáo viên (Teacher) | `teacher@eh.com` | Bất kỳ | Tạo bài tập, cấu hình module, chấm bài |
| Học sinh (Student) | `student@eh.com` | Bất kỳ | Làm bài, nộp bài trắc nghiệm và file ghi âm |

---

## 7. Kiểm thử và Đảm bảo chất lượng

### Kiểm thử Backend
Chạy toàn bộ bộ kiểm thử tự động (Unit Tests, Slice Tests, Testcontainers Integration Tests):
```bash
cd backend
./gradlew test
```
Kiểm tra đóng gói bản phát hành JAR:
```bash
./gradlew bootJar -x test
```

### Kiểm tra Frontend
Kiểm tra quy chuẩn mã nguồn (Linting) và tính toàn vẹn kiểu dữ liệu (TypeScript Typecheck):
```bash
cd frontend
npm run lint
npm run build
```

### Quét bảo mật và rò rỉ mã bí mật
Dự án sử dụng TruffleHog OSS để kiểm tra tự động toàn bộ lịch sử commit, ngăn chặn tình trạng vô tình đưa API keys hoặc mật khẩu lên repository.

---

## 8. Quy trình phát triển và CI/CD

Dự án áp dụng mô hình phân nhánh Git Flow cải tiến kết hợp hệ thống tích hợp và triển khai liên tục tự động hóa hoàn toàn bằng GitHub Actions:

- `main`: Nhánh production. Kích hoạt đóng gói Docker image lên GHCR và triển khai tự động lên VPS Production cũng như Vercel Production.
- `staging`: Nhánh tiền phát hành (Pre-release). Tự động triển khai lên môi trường kiểm thử máy chủ Dev và Vercel Staging.
- `develop`: Nhánh tích hợp tính năng hàng ngày. Kích hoạt kiểm thử tự động toàn diện (Backend CI, Frontend CI, Security Scan).
- `feat/*`, `bugfix/*`: Nhánh làm việc của từng thành viên, rẽ nhánh từ `develop` và tạo Pull Request để kiểm duyệt.

Quy ước thông điệp commit tuân thủ chuẩn Conventional Commits (`feat(...)`, `fix(...)`, `refactor(...)`, `test(...)`, `docs(...)`, `ci(...)`).

---

## 9. Danh mục tài liệu kỹ thuật

Toàn bộ tài liệu chi tiết của dự án được lưu trữ trong thư mục `docs/`:

- [Bộ tài liệu kỹ thuật cốt lõi (PI, SRS, PP, TP)](docs/core/): Tài liệu khởi tạo, đặc tả yêu cầu, kế hoạch dự án và kế hoạch kiểm thử ban đầu.
- [Phụ lục kỹ thuật bổ sung & Tiến hóa hệ thống (Addenda & ADRs)](docs/supplements/): Bản đồ đối chiếu tiến hóa kỹ thuật, phụ lục DDD, S3 Storage, CI/CD và các quyết định kiến trúc.
- [Cẩm nang GitHub Workflow & CI/CD](docs/devops/GITHUB_WORKFLOW_GUIDE.md): Quy trình phân nhánh, danh sách 8 workflows, secrets và hướng dẫn release.
- [Cẩm nang Thiết lập & Vận hành VPS](docs/devops/CI_CD_GUIDE.md): Hướng dẫn cài đặt Docker, cấu hình SSH và bảo trì máy chủ triển khai.
- [Hướng dẫn cấu hình môi trường phát triển](docs/setup/DEV_ENVIRONMENT_GUIDE.md): Hướng dẫn chi tiết thiết lập IDE, SDK và công cụ phát triển cục bộ.
- [Hướng dẫn cấu hình lưu trữ S3/R2](docs/devops/s3-config-guide.md): Hướng dẫn thiết lập lưu trữ đối tượng và cơ chế Presigned URL cho audio và bài luận.
- [Tổng quan thiết kế API v3](docs/api/api_overview_v3.md): Tài liệu đặc tả danh mục API toàn hệ thống.
- [Thiết kế API Nộp bài và Câu trả lời v4](docs/api/api_v4_design_chapter_6_submissions_answers.md): Chi tiết hợp đồng API cho phân hệ Submissions và Answers.
- [Lược đồ cơ sở dữ liệu v6](docs/database/database_schema_v6_description.md): Mô tả chi tiết các bảng, quan hệ và kiểu dữ liệu PostgreSQL.
- [Hướng dẫn vận hành hệ thống Agent AI](docs/guidelines/AGENT_GUIDE_VI.md): Cơ chế phân quyền và luồng làm việc đa tác nhân trong dự án.
- [Danh mục toàn bộ tài liệu (Docs Index)](docs/README.md): Bản đồ phân loại chi tiết toàn bộ kho tài liệu của EnglishHub.
