---
name: trello-github-rules
description: Strict workflow rules for managing Trello cards, GitHub PRs/Issues, task handoff, DoD checklists, and Tester verification.
---

# Trello & GitHub Synchronization Rules for Agents

Tất cả các AI Agent (`@pm`, `@be-primary`, `@be-secondary`, `@fe-primary`, `@fe-secondary`, `@tester`, `@devops-primary`, `@devops-secondary`) khi làm việc với Trello hoặc GitHub **bắt buộc tuân thủ 100%** các quy tắc dưới đây. Chi tiết tài liệu xem tại [`docs/guidelines/TRELLO_GITHUB_CONVENTION.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/guidelines/TRELLO_GITHUB_CONVENTION.md) và [`docs/guidelines/DEVELOPER_DOCTOR_GUIDE.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/guidelines/DEVELOPER_DOCTOR_GUIDE.md).

---

## 1. Quy tắc Tạo và Đặt tên Thẻ Trello
- **Cú pháp bắt buộc**:
  - Task mới: `[<ROLE>-<NUMBER>] <Động từ> <Đối tượng> - <Mô tả ngắn>` (Ví dụ: `[FE-84] Tích hợp Audio Player Studio`)
  - Sửa lỗi: `[<ROLE>-<NUMBER>][ISSUE #<NUM>] <Mô tả lỗi>`
- **Tiền tố hợp lệ**: `FE`, `BE`, `OPS`, `QA`, `DOC`.
- **CẤM TUYỆT ĐỐI**: Không bao giờ tạo hoặc sử dụng thẻ gộp có tiền tố `[GOM]`. Mỗi task phải là một Atomic Task độc lập.
- **Hệ thống Nhãn (Labels)**: Bắt buộc gắn ít nhất 1 nhãn chuyên môn (`Frontend`, `Backend`, `Devops`, `Tester`, `Docs`, `Project Manager`) và thêm nhãn `Bug` nếu là sửa lỗi.
- **Checklist DoD bắt buộc**: Mọi thẻ khi tạo phải có checklist mang tên `Definition of Done (DoD)` gồm:
  - Chạy Project Doctor (`/doctor` hoặc lệnh test tương ứng) đạt 100% Quality Gates
  - Code compile & build không lỗi
  - Unit tests > 80% pass
  - Linting & typecheck sạch sẽ
  - Mở PR vào `develop`
  - Cập nhật docs / API contract liên quan

---

## 2. Quy tắc Nghiệm thu & Hoàn thành Nhiệm vụ (Strict Completion Protocol)
- **DEV KHÔNG ĐƯỢC TỰ Ý KÉO THẺ SANG DONE**:
  - Khi Developer hoàn thành code, chỉ được phép di chuyển thẻ từ `Ongoing` sang cột **`Review`**.
  - **Cơ chế Tự Động Hóa Zero-MCP**:
    - Đối với các thành viên không cài đặt Trello MCP, chỉ cần mở GitHub Pull Request với tiêu đề chuẩn `feat(ROLE-NUM): mô tả`.
    - GitHub Actions (`.github/workflows/trello-sync.yml`) sẽ tự động tìm thẻ `[ROLE-NUM]`, chuyển sang `Review`, đính kèm link PR và tag `@zawntsu`.
  - Nếu thao tác thủ công, comment trên card Trello cú pháp:
    ```markdown
    @Zawn-Tsu Đã hoàn thành nhiệm vụ, mời tester test lại!
    - PR: [Link Pull Request trên GitHub]
    - Branch: [Tên branch]
    - Hướng dẫn test nhanh: [Các bước kiểm tra và dữ liệu mẫu]
    ```
  - Gán thêm thành viên **`Zawn-Tsu`** vào thẻ.
- **CHỈ TESTER MỚI ĐƯỢC ĐÓNG TASK**:
  - Chỉ Agent `@tester` (hoặc thành viên `Zawn-Tsu`) sau khi kiểm thử thực tế và xác nhận ĐẠT mới được:
    1. Approve Pull Request trên GitHub.
    2. Comment xác nhận nghiệm thu thành công trên card Trello.
    3. Di chuyển thẻ sang cột **`Done (Sprint X)`** (ví dụ `Done (Sprint 8)`).

---

## 3. Quy tắc Git Flow & Pull Request
- **Nhánh tích hợp chính**: Luôn luôn target PR vào nhánh **`develop`** (không mở trực tiếp vào `staging` hay `main` ngoại trừ release deploy).
- **Quy tắc đặt tên nhánh**:
  - Tính năng: `feat/<ROLE>-<NUMBER>-<slug>` (tương thích ngược: `feature/<ROLE>-<NUMBER>-<slug>`)
  - Sửa lỗi: `fix/<ROLE>-<NUMBER>-<slug>`
  - Tài liệu: `docs/<slug>`
- **Conventional Commits**:
  - `feat(<ROLE>-<NUM>): <nội dung>`
  - `fix(<ROLE>-<NUM>): <nội dung>`
  - `ci(<ROLE>-<NUM>): <nội dung>`
- **Pull Request**: Tiêu đề mang mã thẻ `feat(FE-84): ...`, phần mô tả bắt buộc điền theo `.github/pull_request_template.md`.
