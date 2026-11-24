# Hướng Dẫn Sử Dụng Hệ Thống Agent AI - Dự Án EnglishHub

Tài liệu này cung cấp hướng dẫn chi tiết cách các thành viên trong nhóm phát triển dự án **EnglishHub** tương tác với hệ thống Agent AI. Hệ thống được thiết kế theo mô hình đa tác nhân (Multi-Agent) phân quyền theo tài khoản Git, tuân thủ Spec-Driven Development và quy trình CI/CD tự động hóa nhằm **loại bỏ 100% xung đột Git (Merge Conflicts)**.

---

## 1. Bảng Phân Quyền Thành Viên (Team Roster Mapping)

Hệ thống tự động phát hiện danh tính của bạn thông qua lệnh `git config user.name`:

| Thành viên (Git User) | Vai trò chính thức | Tiền tố nhánh (Branch Prefix) | Phạm vi phụ trách chính |
| :--- | :--- | :--- | :--- |
| **`doanthaison2706`** | Backend Primary (`@be-primary`) | `feat/BE-*`, `fix/BE-*` | Domain Driven Design, Spring Boot API, Database Migration |
| **`tuanpham21105`** | Backend Secondary (`@be-secondary`) & DevOps Primary (`@devops-primary`) | `feat/BE-*`, `feat/OPS-*` | AI Service integration, CI/CD Pipeline, Docker Staging |
| **`Zawn-Tsu`** | QA / Tester (`@tester`) | `feat/QA-*`, `fix/QA-*` | Kiểm thử tính năng, duyệt PR duy nhất, nghiệm thu Trello |
| **`Maloque18705`** | Frontend (`@fe-primary`, `@fe-secondary`) | `feat/FE-*`, `fix/FE-*` | Giao diện React 19, TypeScript, Vitest coverage > 80% |
| **`hotung9108`** | Product Manager (`@pm`) & DevOps Secondary (`@devops-secondary`) | `docs/*`, `feat/OPS-*` | Backlog Trello, Feature Specs, GitHub Ruleset, Production |

---

## 2. Cơ Chế Nhận Diện Vai Trò & Cách Prompt

### 2.1. Đối với thành viên có 1 vai trò (`doanthaison2706`, `Zawn-Tsu`, `Maloque18705`)
- **Không cần gõ `@`**: Agent tự động nhận diện tài khoản Git trên máy và mặc định đóng đúng vai trò của bạn.
- Bạn chỉ cần nhập lệnh tự nhiên:
  - `doanthaison2706`: *"Viết API chấm điểm Writing Task 2 theo chuẩn DDD"* -> Agent tự hiểu vai trò BE Primary.
  - `Zawn-Tsu`: *"Viết kịch bản test tính năng nộp bài và thẩm định kết quả"* -> Agent tự hiểu vai trò Tester.
  - `Maloque18705`: *"Làm giao diện danh sách bài tập bằng React 19"* -> Agent tự hiểu vai trò Frontend.

### 2.2. Đối với thành viên có 2 vai trò (`hotung9108`, `tuanpham21105`)
- **Tự động theo ngữ cảnh (Context-aware)**:
  - Khi `hotung9108` hỏi về *yêu cầu, chia task, viết spec, tiến độ* -> Agent tự đóng vai **PM**.
  - Khi `hotung9108` hỏi về *Docker, GitHub Actions, CI/CD, deploy* -> Agent tự đóng vai **DevOps Secondary**.
  - Tương tự với `tuanpham21105`: hỏi về *Spring Boot, API, DB* -> **BE Secondary**; hỏi về *Pipeline, deploy* -> **DevOps Primary**.
- **Chỉ định khi cần thiết (Explicit Override)**: Bạn có thể gõ `@pm` hoặc `@devops-secondary` ở đầu câu nếu muốn ép chính xác vai trò.
- **Hộp thoại lựa chọn tương tác (Interactive Selection Modal)**: Nếu câu lệnh của bạn quá ngắn hoặc mơ hồ, Agent sẽ tự động hiển thị lựa chọn vai trò tương ứng để xác nhận.

---

## 3. Quy Trình Phát Triển & Bàn Giao (Spec-Driven Development & Zero-MCP)

Dự án áp dụng mô hình quản lý tập trung trên Trello và GitHub, loại bỏ hoàn toàn các tệp task trung gian:

```
[PM: Trello & docs/features/]
          │
          ▼
[Dev: Code branch & Chạy /doctor]
          │
          ▼
[Mở GitHub PR targeting develop] ──(GitHub Actions Trello Bot)──► [Trello Card chuyển sang Review]
          │
          ▼
[Tester: Duyệt PR & Chuyển Card sang Done]
```

### 3.1. Các bước thực hiện của Developer
1. **Tiếp nhận yêu cầu**: Đọc đặc tả tính năng tại `docs/features/` hoặc tệp tóm tắt bàn giao tại `production_artifacts/pm_to_dev/`.
2. **Khởi tạo nhánh**: Tạo nhánh từ `develop` theo quy chuẩn:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/FE-84-teacher-audio-player
   ```
3. **Phát triển mã nguồn**: Lập trình và viết Unit Test (Coverage > 80%).
4. **Tự kiểm tra bằng Project Doctor**:
   ```bash
   # Gõ /doctor trong chat hoặc chạy các lệnh test tương ứng
   ```
5. **Mở Pull Request**: Mở PR nhắm vào nhánh `develop`. Điền PR title đúng chuẩn `feat(FE-84): mô tả`. Hệ thống GitHub Actions sẽ tự động liên kết và chuyển thẻ trên Trello sang cột `Review`.
6. **Bàn giao kiểm thử**: Gửi hướng dẫn test vào `production_artifacts/fe_to_tester/` hoặc `production_artifacts/be_to_tester/`.

### 3.2. Quy trình nghiệm thu của Tester (`Zawn-Tsu`)
- Tester là người **duy nhất có quyền approve PR** trên GitHub và kéo thẻ Trello vào `Done (Sprint X)`.
- Kết quả nghiệm thu được ghi nhận trong `production_artifacts/test_reports/`.

---

## 4. Công Cụ Tự Kiểm Tra Chất Lượng: Project Doctor (`/doctor`)

Trước khi tạo commit hoặc mở PR, Developer và Agent sử dụng Project Doctor để đảm bảo mã nguồn vượt qua 100% Quality Gates:
- **Trong Chat**: Gõ `/doctor`.
- **Trong Terminal**: Chạy trực tiếp `npm run lint` / `./gradlew test`.
- Xem hướng dẫn chi tiết tại [DEVELOPER_DOCTOR_GUIDE.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/guidelines/DEVELOPER_DOCTOR_GUIDE.md).

---

## 5. Các Tiện Ích & Kỹ Năng Bổ Trợ

### 5.1. Báo cáo tiến độ (`/daily-sync`)
Gõ `/daily-sync` trong chat để Agent tổng hợp nhanh tiến độ Sprint từ Trello và trạng thái các Pull Request hiện hành trên GitHub.

### 5.2. Nghiệm thu tính năng (`pm-review-checklist`)
Trước khi chốt bàn giao tính năng lớn, PM kích hoạt checklist:
> "PM hãy dùng review checklist kiểm tra tính năng Writing trước khi nghiệm thu."

### 5.3. Quy định an toàn Git
Tuyệt đối tuân thủ quy tắc không tự ý commit/push mã nguồn khi chưa có sự xác nhận của người dùng.
