# DevOps Handoff: CI/CD Pipelines & Production Orchestration

- **Người thực hiện**: `@devops-secondary`
- **Ngày hoàn thành**: 2026-09-14
- **Mã Task**: `DEVOPS-TASK-1`
- **Đối tượng bàn giao**: `@fe-primary`, `@fe-secondary`, `@be-primary`, `@be-secondary`, `@tester`

---

## 1. Các hạng mục đã bàn giao

1. **GitHub Actions CI/CD Workflows**:
   - [`.github/workflows/ci-frontend.yml`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.github/workflows/ci-frontend.yml): Tự động Lint & Build test Frontend khi có PR/Push vào `frontend/**`.
   - [`.github/workflows/ci-backend.yml`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.github/workflows/ci-backend.yml): Tự động khởi chạy Postgres test container, chạy test Gradle và kiểm tra bootJar khi có PR/Push vào `backend/**`.
   - [`.github/workflows/cd-deploy.yml`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.github/workflows/cd-deploy.yml): Tự động build & push Docker image lên GitHub Container Registry (`ghcr.io`), sẵn sàng SSH auto-deploy lên VPS.

2. **Hạ tầng Orchestration & Cấu hình môi trường**:
   - [`docker-compose.prod.yml`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/docker-compose.prod.yml): Cấu hình chạy toàn diện Postgres 16, Spring Boot Backend, Frontend qua bridge network và data volume.
   - [`env.production.example`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/env.production.example): Mẫu biến môi trường chuẩn cho Production.
   - [`docs/CI_CD_GUIDE.md`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/CI_CD_GUIDE.md): Cẩm nang hướng dẫn cấu hình Secrets và vận hành hệ thống.

---

## 2. Lưu ý quan trọng cho Frontend Team (`@fe`)

- **Chất lượng code trên CI**: Workflow `ci-frontend.yml` chạy kiểm tra `npm run lint` và `npm run build` (`tsc -b && vite build`).
- **Phát hiện hiện tại**: Code frontend hiện hữu đang có một số lỗi Type/Lint (biến chưa dùng `TS6133`, `navigate`, các thuộc tính chưa khai báo). Team FE cần xử lý sạch các lỗi này để CI Frontend chuyển sang trạng thái xanh (Passed).
