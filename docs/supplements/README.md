# Phụ Lục Kỹ Thuật Bổ Sung & Tiến Hóa Hệ Thống (Technical Addenda & Evolution)

Thư mục này chứa các tài liệu bổ sung, đặc tả nâng cấp kiến trúc và ghi nhận quyết định kỹ thuật (Architecture Decision Records - ADR) của dự án **EnglishHub**.

---

## 1. Mục đích và Nguyên tắc tổ chức

- **Bảo toàn tài liệu Core (`docs/core/`)**: Bộ tài liệu nền tảng ban đầu (00.PI, 01.SRS, 02.PP, 03.TP) được giữ nguyên vẹn 100% làm mốc đối chiếu học thuật chính thức theo đề cương môn học.
- **Tiến hóa kỹ thuật độc lập (`docs/supplements/`)**: Mọi nâng cấp về công nghệ, kiến trúc backend (DDD), lớp lưu trữ (S3-compatible storage), quy trình kiểm thử tự động (Testcontainers) và hạ tầng CI/CD đa tầng (Vercel, Tailscale, Docker Compose) được cập nhật tại thư mục này.
- **Khả năng thích ứng dài hạn**: Khi phương thức triển khai hoặc công nghệ thay đổi trong tương lai (ví dụ: chuyển đổi sang Kubernetes, thay đổi nhà cung cấp đám mây, nâng cấp framework), đội ngũ chỉ cần tạo thêm bản phụ lục hoặc cập nhật tại đây mà không làm xáo trộn tài liệu gốc.

---

## 2. Bảng Đối Chiếu Tiến Hóa Kỹ Thuật (Evolution Matrix)

| Hạng mục kỹ thuật | Tài liệu Core ban đầu (`docs/core/`) | Hiện thực nâng cấp tại Phụ lục (`docs/supplements/`) | Tài liệu chi tiết |
| :--- | :--- | :--- | :--- |
| **Kiến trúc mã nguồn Backend** | Mô hình phân tầng Spring Boot MVC 3 lớp cơ bản. | Kiến trúc Lục giác (Hexagonal Architecture) kết hợp Thiết kế Hướng Tên miền (DDD) với 7 Cụm API nghiệp vụ độc lập. | [01.SRS_ADDENDUM.md](01.SRS_ADDENDUM.md), [ADR-001](adr/ADR-001-ddd-hexagonal-backend.md) |
| **Lưu trữ tệp (Audio / Essay)** | Gắn chặt với nhà cung cấp Cloudflare R2. | Lớp trừu tượng Storage chuẩn S3 API (Provider-agnostic), hỗ trợ hoán đổi linh hoạt giữa AWS S3, Cloudflare R2, Neon Storage và MinIO qua cấu hình môi trường. | [01.SRS_ADDENDUM.md](01.SRS_ADDENDUM.md), [ADR-002](adr/ADR-002-s3-presigned-url-upload.md) |
| **Giao diện người dùng (Frontend)** | ReactJS, Vite, TypeScript, Ant Design, Shadcn. | React 19, Vite, TypeScript, Lucide React, React Router v7, Tailwind CSS / Vanilla CSS (loại bỏ Ant Design). | [01.SRS_ADDENDUM.md](01.SRS_ADDENDUM.md) |
| **Hạ tầng CI/CD & Deploy** | Triển khai thủ công hoặc script đơn giản lên VPS/Cloud. | 8 GitHub Actions Pipelines tự động hóa: Secret Scan (TruffleHog), CI Backend/Frontend, CD Vercel (Frontend) và CD VPS/Home-Server qua mạng an toàn Tailscale Mesh VPN. | [02.DEVOPS_DEPLOY_ADDENDUM.md](02.DEVOPS_DEPLOY_ADDENDUM.md), [ADR-003](adr/ADR-003-tailscale-mesh-vpn-cd.md) |
| **Chiến lược Kiểm thử (QA)** | Đề xuất kiểm thử giao diện bằng Selenium, TestNG. | 286 automated tests: JUnit 5, Mockito, Testcontainers (PostgreSQL 16 Alpine, MinIO S3 round-trip), ESLint và TruffleHog. | [03.QA_TESTING_ADDENDUM.md](03.QA_TESTING_ADDENDUM.md) |
| **Quản trị Task & Lỗi** | Sử dụng Trello quản lý task; Excel ghi nhận bug. | Quản lý task dựa trên Git (`.agents/tasks/`), phân quyền theo Git username, theo dõi lỗi định dạng tệp chuẩn YAML (`BUG-X.yaml`). | [02.DEVOPS_DEPLOY_ADDENDUM.md](02.DEVOPS_DEPLOY_ADDENDUM.md), [03.QA_TESTING_ADDENDUM.md](03.QA_TESTING_ADDENDUM.md) |

---

## 3. Danh mục tài liệu trong thư mục Supplements

### 3.1. Các bản Phụ lục Kỹ thuật (Technical Addenda)
1. [01.SRS_ADDENDUM.md](01.SRS_ADDENDUM.md): Phụ lục Đặc tả Yêu cầu Phần mềm (SRS Addendum)
   - Đặc tả kiến trúc DDD & Hexagonal Ports/Adapters.
   - Đặc tả cơ chế Presigned URL và lớp S3 Object Storage trừu tượng.
   - Đặc tả danh mục công nghệ Frontend và cơ chế bảo mật (JWT + SHA-256 Token Hash).
2. [02.DEVOPS_DEPLOY_ADDENDUM.md](02.DEVOPS_DEPLOY_ADDENDUM.md): Phụ lục Vận hành & Triển khai (DevOps & Deploy Addendum)
   - Quy trình phân nhánh Git Flow đa tầng (Development, Staging, Production).
   - Kiến trúc 8 workflows GitHub Actions.
   - Mô hình mạng riêng ảo Tailscale Mesh VPN kết nối runner và máy chủ nội bộ.
   - Hướng dẫn mở rộng và chuyển đổi hạ tầng trong tương lai.
3. [03.QA_TESTING_ADDENDUM.md](03.QA_TESTING_ADDENDUM.md): Phụ lục Đảm bảo Chất lượng & Kiểm thử (QA & Testing Addendum)
   - Bộ kiểm thử tự động 286 test cases với Testcontainers và MinIO.
   - Cơ chế quét rò rỉ mã bí mật tự động bằng TruffleHog OSS.
   - Quy trình quản lý và ghi nhận lỗi chuẩn hóa dạng tệp YAML.

### 3.2. Bản ghi Quyết định Kiến trúc (Architecture Decision Records - ADR)
- [ADR-001: Áp dụng Kiến trúc DDD và Hexagonal cho Backend](adr/ADR-001-ddd-hexagonal-backend.md)
- [ADR-002: Chuẩn hóa Lớp Lưu trữ Tệp S3-Compatible và Presigned URL](adr/ADR-002-s3-presigned-url-upload.md)
- [ADR-003: Sử dụng Tailscale Mesh VPN trong Tự động hóa Triển khai (CD)](adr/ADR-003-tailscale-mesh-vpn-cd.md)

---

## 4. Hướng dẫn cập nhật tài liệu khi có thay đổi trong tương lai

Khi có sự điều chỉnh về công nghệ, kiến trúc hoặc phương thức triển khai, nhóm thực hiện theo các bước sau:

1. **Không sửa đổi `docs/core/`**: Giữ nguyên để phục vụ truy xuất lịch sử ban đầu.
2. **Tạo ADR mới (nếu có quyết định kiến trúc lớn)**: Thêm tệp `ADR-00X-ten-quyet-dinh.md` vào thư mục `adr/` nêu rõ bối cảnh, các phương án cân nhắc và lý do lựa chọn.
3. **Cập nhật Phụ lục tương ứng**: Bổ sung nội dung thay đổi vào tệp `01.SRS_ADDENDUM.md`, `02.DEVOPS_DEPLOY_ADDENDUM.md`, hoặc `03.QA_TESTING_ADDENDUM.md`.
4. **Cập nhật Bảng đối chiếu tiến hóa**: Thêm dòng mới hoặc chỉnh sửa cột "Hiện thực nâng cấp" trong bảng tại tệp `README.md` này.
