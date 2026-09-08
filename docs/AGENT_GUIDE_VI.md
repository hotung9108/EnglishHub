# Hướng Dẫn Sử Dụng Hệ Thống Agent AI - Dự Án EnglishHub

Tài liệu này cung cấp hướng dẫn chi tiết cách bạn (Người quản lý / Lập trình viên) tương tác với hệ thống Agent trong dự án **EnglishHub**. Hệ thống được thiết kế theo mô hình đa tác nhân (Multi-Agent), nơi mỗi Agent đóng một vai trò chuyên biệt và phối hợp với nhau qua các thư mục và file cấu hình chung.

---

## 1. Nguyên Lý Hoạt Động (Handoff Pattern)

Hệ thống hoạt động dựa trên cơ chế "chuyền gậy" (Handoff) thông qua 2 thành phần chính:
1. **Thư mục `tasks/`**: Nguồn dữ liệu duy nhất (Source of Truth) chứa trạng thái toàn bộ các task và bug, mỗi task là một file riêng biệt để tránh conflict:
   - `tasks/active/`: Chứa các file task đang làm hoặc sắp làm (ví dụ `FE-TASK-1.yaml`).
   - `tasks/done/`: Chứa các file task đã hoàn thành (`Done`).
   - `tasks/bugs/`: Chứa các file bug (ví dụ `BUG-1.yaml`).
2. **`production_artifacts/`**: Thư mục dùng để chứa các file "bàn giao" giữa các Agent (ví dụ: PM viết specs thả vào đây để BE/FE đọc, BE/FE code xong thả file test vào đây để Tester đọc).

---

## 2. Hướng Dẫn Tương Tác Từng Role (Agent Personas)

Do hiện tại Antigravity IDE chưa hỗ trợ gọi tên Agent qua menu `@` (như `@pm`, `@fe`), bạn sẽ cần truyền đạt ngữ cảnh bằng cách **nhắc đến tên file persona** hoặc **yêu cầu AI đóng vai**.

### Product Manager (`@pm` / `pm.md`)
**Nhiệm vụ:** Phân tích yêu cầu, chia task, viết đặc tả (specifications).
* **Cách yêu cầu:** 
  > "Đọc file `pm.md` để lấy bối cảnh vai trò của bạn. Hãy phân tích tính năng chấm điểm Speaking AI thành các task nhỏ và cập nhật vào `tasks/board.yaml`."
* **Cách PM bàn giao:** Khi PM làm xong, hệ thống sẽ tự sinh ra file spec (ví dụ: `spec-speaking.md`) và thả vào thư mục `production_artifacts/pm_to_dev/`.

### Backend Developer (`@be-primary`, `@be-secondary` / `be-primary.md`, `be-secondary.md`)
**Nhiệm vụ:** Viết API, thiết kế Database, tích hợp AI chấm điểm. Primary và Secondary có quyền hạn và kỹ năng **ngang nhau**.
* **Luồng nhận việc (Task Pulling):** Cả hai sẽ theo dõi các task được gắn mác chung là `@be` trong `tasks/active/`. 
* **Nhận task (Claiming):** Khi bắt đầu làm, người nào nhận sẽ đổi `assignee` thành tên đích danh của mình (ví dụ `@be-primary`) để người kia biết mà không làm trùng.
* **Cách BE bàn giao:** Sau khi code xong API, BE sẽ tạo hướng dẫn test và thả vào `production_artifacts/be_to_tester/`, đồng thời chuyển task sang `Ready for FE` hoặc `In Review`.

### Frontend Developer (`@fe-primary`, `@fe-secondary` / `fe-primary.md`, `fe-secondary.md`)
**Nhiệm vụ:** Cắt HTML/CSS, làm UI/UX bằng React/Vue, tích hợp API từ BE. Primary và Secondary có kỹ năng **ngang nhau**.
* **Luồng nhận việc:** Tương tự như BE, ai rảnh sẽ vào `tasks/active/` tìm các task `@fe` hoặc đích danh mình, đổi assignee để "nhận thầu" task đó.
* **Cách FE bàn giao:** Tương tự BE, tạo file hướng dẫn test thả vào `production_artifacts/fe_to_tester/`.

### QA / Tester (`@tester` / `tester.md`)
**Nhiệm vụ:** Kiểm thử tính năng, kiểm tra độ chính xác của AI.
* **Cách yêu cầu:** 
  > "Với vai trò Tester (`tester.md`), hãy đọc hướng dẫn test của team Dev trong `production_artifacts/fe_to_tester/`, lên kịch bản test và tạo bug report nếu AI chấm sai."
* **Cách Tester bàn giao:** Báo cáo kiểm thử đặt ở `production_artifacts/test_reports/`. Nếu có lỗi, Tester tự tạo bug file mới trong `tasks/bugs/` hoặc đổi trạng thái task file về `To Do` và báo lỗi cho Dev. Nếu test pass, chuyển task file sang `tasks/done/`.

### DevOps (`@devops-primary`, `@devops-secondary` / `devops-primary.md`, `devops-secondary.md`)
**Nhiệm vụ:** Cấu hình server, CI/CD pipeline, deploy dự án. Cả hai có kỹ năng **ngang nhau**.
* **Luồng nhận việc:** Theo dõi task `@devops` trong `tasks/active/`. Đổi assignee thành `@devops-primary` hoặc `@devops-secondary` khi bắt đầu làm để báo hiệu cho người còn lại.

---

## 3. Hướng Dẫn Sử Dụng Các Kỹ Năng (Skills)

Các Skills là những hướng dẫn thu nhỏ để Agent biết cách thực hiện các thao tác mang tính quy trình. Antigravity tự động kích hoạt Skill khi nó thấy câu lệnh của bạn phù hợp. Tuy nhiên, để đảm bảo Agent chắc chắn sử dụng, bạn có thể nhắc nhẹ trong prompt.

### `task-board`
* **Công dụng:** Giúp Agent đọc, cập nhật, đổi trạng thái hoặc chuyển người phụ trách (assignee) an toàn qua lại giữa các thư mục trong `tasks/` (như tạo file mới, chuyển file từ active sang done).
* **Cách kích hoạt:**
  > "Hãy cập nhật tiến độ công việc của tính năng X vào bảng task." hoặc "Dùng skill task-board để tạo 3 task mới."

### `bug-report`
* **Công dụng:** Khởi tạo file lỗi theo chuẩn YAML và đưa vào `tasks/bugs/`. Khi bug được fix xong, agent tự đổi status trong file đó thành `Fixed`.
* **Cách kích hoạt:**
  > "Tôi phát hiện lỗi: upload file audio lớn hơn 5MB bị văng app. Hãy tạo bug report cho lỗi này."

### `pm-review-checklist`
* **Công dụng:** Bắt buộc PM kiểm tra qua 5 bước (UX, AI test, Docs, v.v.) trước khi nghiệm thu một tính năng.
* **Cách kích hoạt:**
  > "Tính năng Writing đã code xong, PM hãy dùng review checklist để kiểm tra và duyệt task này sang Done."

---

## 4. Hướng Dẫn Kích Hoạt Workflows (Luồng Tự Động)

Workflows là tập hợp nhiều bước thao tác đã được lập trình sẵn. Bạn có thể gọi Workflow bằng cách gõ câu lệnh có chứa từ khóa của Workflow đó.

### Báo cáo hằng ngày (`/daily-sync`)
Đây là workflow quan trọng giúp bạn (hoặc sếp/quản lý) nắm bắt tiến độ dự án mà không cần mở code lên xem.

* **Cách dùng:** Gõ trực tiếp vào khung chat: 
  > `/daily-sync` hoặc "Hãy chạy workflow daily-sync".
* **Luồng chạy của Agent:**
  1. Agent tự động tìm và đọc toàn bộ các file `.yaml` trong các thư mục con của `tasks/`.
  2. Nó tổng hợp xem có bao nhiêu task To Do, In Progress, Done.
  3. Nó sẽ tự động tô đỏ cảnh báo nếu có Bug nào đang ở mức "High" / "Critical".
  4. Nó in ra một bảng báo cáo gọn gàng trên màn hình chat và đề xuất Dev nào nên làm gì tiếp theo hôm nay.

---

### Mẹo nhỏ (Best Practices)
- **Đừng quên cập nhật board:** Bất cứ khi nào bạn yêu cầu Agent code xong một file lớn, hãy kèm theo câu chốt: *"Nhớ cập nhật trạng thái trên `tasks/board.yaml`"*.
- **Giữ `production_artifacts/` sạch sẽ:** Sau mỗi đợt release, bạn có thể yêu cầu Agent tự động dọn dẹp các tệp bàn giao cũ.
- **Nếu Agent quên vai:** Cứ nhắc lại *"Đọc lại rule trong file AGENTS.md và vai trò của bạn trong be.md"*.
