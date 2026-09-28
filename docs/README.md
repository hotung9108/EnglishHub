# Thư Mục Tài Liệu Kỹ Thuật (Documentation Index) - EnglishHub

Chào mừng bạn đến với kho tài liệu kỹ thuật của dự án EnglishHub. Toàn bộ tài liệu được phân loại theo từng phân vùng nghiệp vụ và kỹ thuật bên dưới.

---

## 1. Cấu trúc thư mục tài liệu

```text
docs/
├── README.md                                  # Bản đồ chỉ mục tài liệu (tệp hiện tại)
├── core/                                      # Tài liệu nền tảng học phần & dự án (PI, SRS, PP, TP)
│   ├── 00.PI.md                               # Project Initiation (Khởi tạo dự án & Bối cảnh)
│   ├── 01.SRS.md                              # Software Requirements Specification (Đặc tả yêu cầu)
│   ├── 02.PP.md                               # Project Plan (Kế hoạch dự án & Phân bổ nguồn lực)
│   └── 03.TP.md                               # Test Plan (Kế hoạch kiểm thử & Tiêu chuẩn chất lượng)
├── supplements/                               # Phụ lục kỹ thuật bổ sung & cập nhật tiến hóa (Addenda & ADRs)
│   ├── README.md                              # Tổng quan & Ma trận đối chiếu tiến hóa kỹ thuật
│   ├── 01.SRS_ADDENDUM.md                     # Phụ lục SRS: Kiến trúc DDD & S3 Provider-Agnostic Storage
│   ├── 02.DEVOPS_DEPLOY_ADDENDUM.md           # Phụ lục PP: Git Flow, CI/CD, Tailscale Mesh VPN
│   ├── 03.QA_TESTING_ADDENDUM.md              # Phụ lục TP: 286 Tests JUnit 5 + Testcontainers, TruffleHog
│   └── adr/                                   # Architecture Decision Records (Bản ghi quyết định kiến trúc)
│       ├── ADR-001-ddd-hexagonal-backend.md   # Quyết định áp dụng kiến trúc DDD & Hexagonal
│       ├── ADR-002-s3-presigned-url-upload.md # Quyết định chuẩn hóa lưu trữ S3 Presigned URL
│       └── ADR-003-tailscale-mesh-vpn-cd.md   # Quyết định tích hợp Tailscale Mesh VPN trong CD
├── api/                                       # Đặc tả giao diện lập trình ứng dụng (API Contracts & Specs)
│   ├── api_overview_v3.md                     # Tổng quan danh mục API phiên bản 3
│   ├── api_v3_design.pdf                      # Bản vẽ thiết kế kiến trúc API v3 (PDF)
│   └── api_v4_design_chapter_6_submissions_answers.md # Đặc tả API nộp bài và câu trả lời (v4)
├── database/                                  # Thiết kế cơ sở dữ liệu (Database Schema)
│   ├── database_schema_dbdiagram_v6.dbml      # Lược đồ quan hệ định dạng DBML (dbdiagram.io) v6
│   └── database_schema_v6_description.md      # Thuyết minh chi tiết các bảng và quan hệ v6
├── devops/                                    # Vận hành, CI/CD, Lưu trữ đám mây & Máy chủ
│   ├── GITHUB_WORKFLOW_GUIDE.md               # Cẩm nang quy trình Git Flow và 8 GitHub Actions Workflows
│   ├── CI_CD_GUIDE.md                         # Hướng dẫn thiết lập SSH, Secrets và triển khai VPS
│   ├── CI_CD_PLAN.md                          # Kế hoạch và kiến trúc tổng thể pipeline CI/CD
│   ├── SELF_HOST_PC_GUIDE.md                  # Hướng dẫn biến máy tính cá nhân thành máy chủ thử nghiệm
│   └── s3-config-guide.md                     # Hướng dẫn cấu hình S3-compatible Object Storage (R2/S3/MinIO)
├── setup/                                     # Hướng dẫn thiết lập môi trường phát triển & Dữ liệu mẫu
│   ├── DEV_ENVIRONMENT_GUIDE.md               # Hướng dẫn thiết lập môi trường lập trình cục bộ
│   ├── dev-environment-setup.pdf              # Hướng dẫn trực quan cài đặt công cụ phát triển (PDF)
│   └── DATAMOCK_GUIDE.md                      # Hướng dẫn nạp và đồng bộ dữ liệu mẫu (Seeder)
├── guidelines/                                # Quy chuẩn làm việc nhóm & Quy trình Agent AI
│   └── AGENT_GUIDE_VI.md                      # Hướng dẫn tương tác hệ thống Multi-Agent AI
├── features/                                  # Tài liệu phân tích yêu cầu tính năng (PRD & Use Cases)
│   └── feature-template.md                    # Biểu mẫu chuẩn để Product Manager viết spec tính năng mới
└── architecture/                              # Tài liệu kiến trúc chuyên sâu (DDD, Hexagonal)
```

---

## 2. Chi tiết từng phân mục

### 2.1. Phân mục Tài liệu Nền tảng Dự án (`docs/core/`)
Chứa bộ 4 tài liệu gốc chuẩn mực kỹ thuật phần mềm:
- [00.PI.md](core/00.PI.md): **Project Initiation (PI)** - Khởi tạo dự án, tính cấp thiết, mục tiêu đề tài, phân công nhiệm vụ thành viên.
- [01.SRS.md](core/01.SRS.md): **Software Requirements Specification (SRS)** - Đặc tả chi tiết các yêu cầu chức năng (FR), yêu cầu phi chức năng (NFR), Use Case và quy tắc nghiệp vụ.
- [02.PP.md](core/02.PP.md): **Project Plan (PP)** - Kế hoạch triển khai dự án, phân rã công việc WBS, quản lý rủi ro và các mốc thời gian sprint.
- [03.TP.md](core/03.TP.md): **Test Plan (TP)** - Chiến lược kiểm thử, phạm vi kiểm thử (Unit, Integration, E2E, AI Grading), tiêu chí chấp nhận và quản lý khiếm khuyết.

### 2.2. Phân mục Phụ lục Kỹ thuật Tiến hóa (`docs/supplements/`)
Chứa các bản cập nhật nâng cấp thực tế và bản ghi quyết định kiến trúc:
- [README.md](supplements/README.md): Bản đồ đối chiếu tiến hóa kỹ thuật (Evolution Matrix) và hướng dẫn bảo trì dài hạn.
- [01.SRS_ADDENDUM.md](supplements/01.SRS_ADDENDUM.md): Phụ lục bổ sung cho SRS về kiến trúc Domain-Driven Design, lưu trữ tệp tin S3 Presigned URL và chuẩn hóa Frontend React 19.
- [02.DEVOPS_DEPLOY_ADDENDUM.md](supplements/02.DEVOPS_DEPLOY_ADDENDUM.md): Phụ lục bổ sung cho PP về hạ tầng triển khai thực tế đa tầng (Vercel + VPS/Home-Server), mạng an toàn Tailscale Mesh VPN và lộ trình chuyển đổi Kubernetes.
- [03.QA_TESTING_ADDENDUM.md](supplements/03.QA_TESTING_ADDENDUM.md): Phụ lục bổ sung cho TP về bộ kiểm thử tự động 286 tests, Testcontainers (Postgres, MinIO), TruffleHog Secret Scanning và quy trình log lỗi dạng tệp YAML.
- **Thư mục ADR (`docs/supplements/adr/`)**:
  - [ADR-001](supplements/adr/ADR-001-ddd-hexagonal-backend.md): Áp dụng kiến trúc DDD và Hexagonal cho Backend.
  - [ADR-002](supplements/adr/ADR-002-s3-presigned-url-upload.md): Chuẩn hóa lớp lưu trữ tệp S3-compatible và Presigned URL.
  - [ADR-003](supplements/adr/ADR-003-tailscale-mesh-vpn-cd.md): Sử dụng Tailscale Mesh VPN trong tự động hóa triển khai (CD).

### 2.3. Phân mục API (`docs/api/`)
Chứa các bản đặc tả kỹ thuật của tầng dịch vụ API Backend:
- [api_overview_v3.md](api/api_overview_v3.md): Bản tổng hợp các endpoints thuộc 7 cụm nghiệp vụ của hệ thống.
- [api_v3_design.pdf](api/api_v3_design.pdf): Thiết kế giao thức, mã lỗi HTTP và luồng nghiệp vụ chi tiết.
- [api_v4_design_chapter_6_submissions_answers.md](api/api_v4_design_chapter_6_submissions_answers.md): Hợp đồng API chi tiết cho phân hệ nộp bài thi, lưu trữ câu trả lời và tích hợp tải file qua S3 Presigned URL.


### 2.4. Phân mục Cơ sở dữ liệu (`docs/database/`)
Chứa tài liệu thiết kế tầng dữ liệu PostgreSQL:
- [database_schema_dbdiagram_v6.dbml](database/database_schema_dbdiagram_v6.dbml): Mã nguồn DBML trực quan hóa lược đồ cơ sở dữ liệu phiên bản 6.
- [database_schema_v6_description.md](database/database_schema_v6_description.md): Giải thích chi tiết ý nghĩa các trường, khóa ngoại, ràng buộc và chỉ mục (indexes).

### 2.5. Phân mục DevOps & Vận hành (`docs/devops/`)
Chứa toàn bộ tài liệu về tự động hóa tích hợp, bảo mật và triển khai:
- [GITHUB_WORKFLOW_GUIDE.md](devops/GITHUB_WORKFLOW_GUIDE.md): Chi tiết cơ chế hoạt động của 8 workflow files GitHub Actions, phân nhánh Git Flow, quy tắc Conventional Commits và các biến Secrets cần thiết.
- [CI_CD_GUIDE.md](devops/CI_CD_GUIDE.md): Cẩm nang thiết lập máy chủ VPS, cấu hình Docker Compose production và kiểm tra sức khỏe dịch vụ sau khi deploy.
- [CI_CD_PLAN.md](devops/CI_CD_PLAN.md): Bản đề xuất và kế hoạch lộ trình xây dựng kiến trúc CI/CD hoàn chỉnh.
- [SELF_HOST_PC_GUIDE.md](devops/SELF_HOST_PC_GUIDE.md): Hướng dẫn cấu hình máy tính cá nhân làm home-server để chạy thử nghiệm môi trường staging qua Cloudflare Tunnel và Tailscale.
- [s3-config-guide.md](devops/s3-config-guide.md): Hướng dẫn kết nối dịch vụ lưu trữ đối tượng đám mây (Cloudflare R2, AWS S3, Neon Storage) cho tính năng upload file ghi âm và bài luận.

### 2.6. Phân mục Môi trường & Dữ liệu (`docs/setup/`)
Hỗ trợ thành viên mới gia nhập dự án thiết lập môi trường lập trình nhanh nhất:
- [DEV_ENVIRONMENT_GUIDE.md](setup/DEV_ENVIRONMENT_GUIDE.md): Các bước cài đặt JDK 21, Node.js 22, Docker, Docker Compose và cấu hình file `.env`.
- [dev-environment-setup.pdf](setup/dev-environment-setup.pdf): Bản vẽ hướng dẫn cài đặt trực quan.
- [DATAMOCK_GUIDE.md](setup/DATAMOCK_GUIDE.md): Hướng dẫn cấu hình seeder nạp dữ liệu mẫu cho bài tập, lớp học, học sinh và giáo viên.

### 2.7. Phân mục Quy chuẩn & Hướng dẫn đội ngũ (`docs/guidelines/`)
- [AGENT_GUIDE_VI.md](guidelines/AGENT_GUIDE_VI.md): Hướng dẫn các thành viên trong nhóm làm việc với hệ thống AI Coding Assistant, phân chia vai trò theo tài khoản Git và cách bàn giao deliverables qua `production_artifacts/`.

### 2.8. Phân mục Tính năng (`docs/features/`)
- [feature-template.md](features/feature-template.md): Mẫu tài liệu chuẩn dành cho Product Manager khi phân tích và đặc tả một tính năng mới trước khi bàn giao cho đội ngũ phát triển.

---

## 3. Quy định cập nhật tài liệu

1. Khi thêm mới tài liệu, bắt buộc phải đặt vào đúng thư mục chuyên mục tương ứng nêu trên.
2. Các cải tiến kỹ thuật theo thời gian cần được ghi nhận vào `docs/supplements/` thay vì sửa đổi `docs/core/`.
3. Cập nhật liên kết tham chiếu tương ứng vào tệp `docs/README.md` này và tệp `README.md` ở thư mục gốc.
4. Giữ nguyên phong cách tài liệu rõ ràng, chuẩn mực và không lạm dụng biểu tượng cảm xúc để đảm bảo tính chuyên nghiệp của hệ thống.
