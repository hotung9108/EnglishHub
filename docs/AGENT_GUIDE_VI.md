# Hướng Dẫn Sử Dụng Hệ Thống Agent AI - Dự Án EnglishHub

Tài liệu này cung cấp hướng dẫn chi tiết cách các thành viên trong nhóm phát triển dự án **EnglishHub** tương tác với hệ thống Agent AI. Hệ thống được thiết kế theo mô hình đa tác nhân (Multi-Agent) phân quyền theo tài khoản Git và cấu trúc thư mục riêng biệt nhằm **loại bỏ 100% xung đột Git (Merge Conflicts)**.

---

## 1. Bảng Phân Quyền Thành Viên (Team Roster Mapping)

Hệ thống tự động phát hiện danh tính của bạn thông qua lệnh `git config user.name`:

| Thành viên (Git User) | Vai trò chính thức | Thư mục Task sở hữu |
| :--- | :--- | :--- |
| **`doanthaison2706`** | Backend Primary (`@be-primary`) | `.agents/tasks/be-primary/` |
| **`tuanpham21105`** | Backend Secondary (`@be-secondary`) & DevOps Primary (`@devops-primary`) | `.agents/tasks/be-secondary/`<br>`.agents/tasks/devops-primary/` |
| **`Zawn-Tsu`** | QA / Tester (`@tester`) | `.agents/tasks/tester/`<br>`.agents/tasks/bugs/` |
| **`Maloque18705`** | Frontend (`@fe-primary`, `@fe-secondary`) | `.agents/tasks/fe-primary/`<br>`.agents/tasks/fe-secondary/` |
| **`hotung9108`** | Product Manager (`@pm`) & DevOps Secondary (`@devops-secondary`) | `.agents/tasks/pm/`<br>`.agents/tasks/devops-secondary/` |

---

## 2. Cơ Chế Nhận Diện Vai Trò & Cách Prompt

### 2.1. Đối với thành viên có 1 vai trò (`doanthaison2706`, `Zawn-Tsu`, `Maloque18705`)
- **Không cần gõ `@`**: Agent tự động nhận diện tài khoản Git trên máy và mặc định đóng đúng vai trò của bạn.
- Bạn chỉ cần nhập lệnh tự nhiên:
  - `doanthaison2706`: *"Viết API chấm điểm Writing Task 2 theo chuẩn DDD"* -> Agent tự hiểu vai trò BE Primary.
  - `Zawn-Tsu`: *"Viết kịch bản test tính năng nộp bài và log bug"* -> Agent tự hiểu vai trò Tester.
  - `Maloque18705`: *"Làm giao diện danh sách bài tập bằng React 19"* -> Agent tự hiểu vai trò Frontend.

### 2.2. Đối với thành viên có 2 vai trò (`hotung9108`, `tuanpham21105`)
- **Tự động theo ngữ cảnh (Context-aware)**:
  - Khi `hotung9108` hỏi về *yêu cầu, chia task, viết spec, tiến độ* -> Agent tự đóng vai **PM**.
  - Khi `hotung9108` hỏi về *Docker, GitHub Actions, CI/CD, deploy* -> Agent tự đóng vai **DevOps Secondary**.
  - Tương tự với `tuanpham21105`: hỏi về *Spring Boot, API, DB* -> **BE Secondary**; hỏi về *Pipeline, deploy* -> **DevOps Primary**.
- **Chỉ định khi cần thiết (Explicit Override)**: Bạn có thể gõ `@pm` hoặc `@devops-secondary` ở đầu câu nếu muốn ép chính xác vai trò.
- **Hộp thoại lựa chọn tương tác (Interactive Selection Modal)**: Nếu câu lệnh của bạn quá ngắn hoặc mơ hồ (ví dụ: *"kiểm tra hệ thống cho tôi"*), Agent sẽ tự động bật hộp thoại tương tác với các nút bấm để bạn chọn vai trò mong muốn chỉ bằng 1 cú click chuột trước khi tiến hành thực hiện.


---

## 3. Cấu Trúc Quản Lý Task & Quy Trình Chuyền Gậy (Handoff)

### 3.1. Cấu trúc thư mục `.agents/tasks/`
Mỗi vai trò sở hữu thư mục riêng, tuyệt đối không chỉnh sửa thư mục của người khác để tránh xung đột Git:
- `.agents/tasks/{role}/active/`: Chứa các task đang thực hiện hoặc chờ xử lý.
- `.agents/tasks/{role}/done/`: Chứa các task đã hoàn thành (`Done`).
- `.agents/tasks/bugs/`: Chứa các file lỗi do Tester tạo (`BUG-X.yaml`).

### 3.2. Quy trình bàn giao (Handoff Flow)
1. **PM (`hotung9108`)**:
   - Viết spec tính năng vào `docs/features/` và `production_artifacts/pm_to_dev/`.
   - Tạo file task mới trong thư mục của Dev (ví dụ: `.agents/tasks/be-primary/active/BE-TASK-1.yaml`).
2. **Backend (`doanthaison2706`, `tuanpham21105`)**:
   - Đọc task trong thư mục `active/` của mình, code theo chuẩn DDD ([`.agents/rules/convention-be.md`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/convention-be.md)).
   - Khi hoàn thành, tạo file hướng dẫn test thả vào `production_artifacts/be_to_tester/`, cập nhật task và chuyển sang `done/`.
3. **Frontend (`Maloque18705`)**:
   - Đọc task trong `.agents/tasks/fe-primary/active/`, code theo chuẩn ([`.agents/rules/convention-fe.md`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/convention-fe.md)).
   - Thả hướng dẫn test vào `production_artifacts/fe_to_tester/` và chuyển task sang `done/`.
4. **Tester (`Zawn-Tsu`)**:
   - Đọc hướng dẫn test, kiểm thử chức năng và AI grading.
   - Thả báo cáo vào `production_artifacts/test_reports/`. Nếu có lỗi, tạo file `.agents/tasks/bugs/BUG-X.yaml`.
5. **DevOps (`tuanpham21105`, `hotung9108`)**:
   - Quản lý pipeline GitHub Actions, Docker Compose và triển khai máy chủ theo [`docs/CI_CD_GUIDE.md`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/CI_CD_GUIDE.md).

---

## 4. Các Lệnh & Kỹ Năng Tiện Ích

### 4.1. Báo cáo tiến độ hàng ngày (`/daily-sync`)
Gõ trực tiếp vào chat: `/daily-sync`.  
Agent sẽ tự động duyệt toàn bộ các thư mục task trong `.agents/tasks/` và in ra bảng tổng hợp tiến độ của từng thành viên kèm theo các bug đang tồn đọng.

### 4.2. Báo cáo lỗi (`bug-report`)
Khi phát hiện lỗi, Tester chỉ cần chat:
> "Tạo bug report: Chức năng nộp bài Speaking bị lỗi 500 khi upload file lớn hơn 10MB."  
Agent sẽ tự động sinh file `BUG-X.yaml` chuẩn vào `.agents/tasks/bugs/`.

### 4.3. Nghiệm thu tính năng (`pm-review-checklist`)
Trước khi phát hành, PM yêu cầu:
> "PM hãy dùng review checklist kiểm tra tính năng Writing trước khi nghiệm thu."
