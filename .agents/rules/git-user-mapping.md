---
name: git-user-mapping
description: Git user mapping rules and role allocation for team members in EnglishHub project.
---

# EnglishHub Team Roster & Git User Mapping

Tài liệu này định nghĩa cơ chế tự động nhận diện vai trò của lập trình viên và Agent dựa trên cấu hình tài khoản Git (`git config user.name`), đồng thời phân chia ranh giới quyền hạn để chống xung đột Git.

---

## 1. Bảng Ánh Xạ Tài Khoản Git (Team Roster)

| Git Username (`git config user.name`) | Vai trò chính thức (Roles) | Tiền tố nhánh (Branch Prefix) | Phạm vi phụ trách |
| :--- | :--- | :--- | :--- |
| **`doanthaison2706`** | `@be-primary` | `feature/BE-*`, `fix/BE-*` | Domain Driven Design, Spring Boot APIs, DB migrations |
| **`tuanpham21105`** | `@be-secondary`, `@devops-primary` | `feature/BE-*`, `feature/OPS-*` | AI Service integration, CI/CD pipelines, Docker staging |
| **`Zawn-Tsu`** | `@tester` | `feature/QA-*`, `fix/QA-*` | Duyệt PR duy nhất, nghiệm thu Trello, kiểm thử chức năng |
| **`Maloque18705`** | `@fe-primary`, `@fe-secondary` (Frontend Lead) | `feature/FE-*`, `fix/FE-*` | React 19 UI, Vitest unit testing, API consumption |
| **`hotung9108`** | `@pm`, `@devops-secondary` | `docs/*`, `feature/OPS-*` | Product Backlog Trello, Feature specs, GitHub Rulesets |

---

## 2. Cơ Chế Nhận Diện Vai Trò Thông Minh (Smart Role Detection)

Khi nhận prompt từ người dùng, Agent tự động chạy kiểm tra:
```bash
git config user.name
```

### 2.1. Đối với thành viên có 1 vai trò duy nhất (`doanthaison2706`, `Zawn-Tsu`, `Maloque18705`)
- Agent tự động nạp vai trò tương ứng mà **không bắt buộc người dùng phải gõ `@`**.
  - `doanthaison2706` -> Tự động đóng vai **Backend Primary**.
  - `Zawn-Tsu` -> Tự động đóng vai **Tester**.
  - `Maloque18705` -> Tự động đóng vai **Frontend**.

### 2.2. Đối với thành viên kiêm nhiệm 2 vai trò (`hotung9108`, `tuanpham21105`)
- **Tự động nhận diện theo ngữ cảnh (Context-aware)**:
  - **Với `hotung9108`**:
    - Khi prompt liên quan đến *quản trị sản phẩm, chia task, viết spec, tiến độ sprint*: Tự động đóng vai **PM (`@pm`)**.
    - Khi prompt liên quan đến *Docker, CI/CD GitHub Actions, deploy VPS, server environment*: Tự động đóng vai **DevOps Secondary (`@devops-secondary`)**.
  - **Với `tuanpham21105`**:
    - Khi prompt liên quan đến *Spring Boot, API, JPA, Database, logic backend*: Tự động đóng vai **Backend Secondary (`@be-secondary`)**.
    - Khi prompt liên quan đến *Docker, CI/CD, pipeline*: Tự động đóng vai **DevOps Primary (`@devops-primary`)**.
- **Chỉ định tường minh (Explicit Override)**:
  - Người dùng có thể gõ `@pm` hoặc `@devops-secondary` nếu muốn ép chính xác vai trò cho một tác vụ đặc thù.
- **Hộp thoại tương tác khi không xác định được ngữ cảnh (Interactive Modal Selection)**:
  - Nếu câu lệnh của người dùng quá ngắn hoặc mơ hồ, Agent **sẽ tự động kích hoạt hộp thoại tương tác (`ask_question`)** trên giao diện để người dùng bấm chọn 1 trong 2 vai trò của mình trước khi thực thi.

---

## 3. Rào Cản Phân Quyền (Role Guard)
- **Chống chéo vai**: Thành viên không được tự ý thực hiện hay đóng vai ngoài danh sách vai trò được phân công (ví dụ: tài khoản `doanthaison2706` không thể claim task của FE hay PM).
- **Phân lập nhánh Git**: Mỗi lập trình viên chỉ làm việc trên nhánh tính năng có tiền tố tương ứng (`feature/BE-*`, `feature/FE-*`, `feature/OPS-*`), loại bỏ 100% khả năng gây Git merge conflict khi làm việc song song.
