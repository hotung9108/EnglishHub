# Tài Liệu Bàn Giao Kỹ Thuật: [OPS-50] Cấu Hình GitHub Ruleset & PR Convention Linter

- **Mã nhiệm vụ**: `[OPS-50]`
- **Người thực hiện**: Hồ Việt Tùng (`@hotung9108` - DevOps Secondary & PM)
- **Người nghiệm thu**: Tester (`@Zawn-Tsu`)
- **Đối tượng áp dụng**: Toàn bộ thành viên phát triển dự án EnglishHub

---

## 1. Tóm Tắt Các Thay Đổi Kỹ Thuật Đã Triển Khai

1. **GitHub Rulesets 3 Tầng**:
   - `IMMUTABLE-CORE-BRANCHES` (Rule ID: `26606359`):
     - Áp dụng trên 3 nhánh cốt lõi: `main`, `develop`, `staging`.
     - Chặn tuyệt đối hành động Xóa nhánh (`deletion`) và Force-push (`non_fast_forward`).
     - `bypass_actors: []` (0 bypass - kể cả Admin và Repository Owner đều không thể xóa nhánh lõi).
   - `PROTECT-develop`, `PROTECT-staging`, `PROTECT-main`:
     - Yêu cầu ít nhất 1 review phê duyệt trước khi merge đối với thành viên thông thường.
     - Cấu hình quyền Bypass cho Admin (`hotung9108`, Role: 5 - Repository Admin) để có thể tự merge PR khi cần mà không bị chặn.
   - Thiết lập cấu hình kho lưu trữ: `delete_branch_on_merge: false` (ngăn GitHub tự động xóa nhánh gốc sau khi merge PR).

2. **Biểu Mẫu Pull Request Chuẩn Hóa**:
   - Tệp: `.github/pull_request_template.md`.
   - Bắt buộc điền: Tóm tắt thay đổi, liên kết thẻ Trello / GitHub Issue, phân loại commit, và checklist Definition of Done (DoD).

3. **Workflow PR Convention Linter**:
   - Tệp: `.github/workflows/pr-convention-lint.yml`.
   - Kích hoạt khi có PR nhắm vào: `develop`, `staging`, `main`.
   - Kiểm tra định dạng:
     - Tiêu đề PR: `^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)\((FE|BE|OPS|QA|AI|PM)-[0-9]+\):\s.+` (Ví dụ: `feat(FE-84): implement audio player`).
     - Tên nhánh: `^(feat|feature|fix|chore|docs|refactor)\/(FE|BE|OPS|QA|AI|PM)-[0-9]+-[a-z0-9-]+$` (Ví dụ: `feat/FE-84-audio-player` hoặc `feature/FE-84-audio-player`).

4. **Workflow Trello Auto-Sync Bot (Zero-MCP)**:
   - Tệp: `.github/workflows/trello-sync.yml`.
   - Tự động trích xuất mã thẻ `[ROLE-NUM]` từ PR, di chuyển thẻ sang cột **`Review`** trên Trello, đính kèm link PR và tag gọi Tester `@zawntsu`.

---

## 2. Kịch Bản Kiểm Thử Dành Cho Tester (@Zawn-Tsu)

### Kịch bản 1: Kiểm chứng bảo vệ nhánh cốt lõi (IMMUTABLE-CORE-BRANCHES)
- **Thao tác**: Thử xóa nhánh `develop` hoặc `staging` trên GitHub CLI / Git command:
  ```bash
  git push origin --delete develop
  ```
- **Kết quả mong đợi**: GitHub từ chối lệnh với thông báo lỗi:
  `remote: fatal: Cannot delete protected branch 'develop' due to ruleset 'IMMUTABLE-CORE-BRANCHES'.`

### Kịch bản 2: Kiểm chứng PR Convention Linter với PR sai định dạng
- **Thao tác**: Mở PR thử nghiệm với tiêu đề sai quy chuẩn (ví dụ: `update code`, `fix bug audio`) hoặc nhánh không có tiền tố `feat/ROLE-NUM-slug`.
- **Kết quả mong đợi**: Workflow `PR Convention Linter` trên GitHub Actions lập tức đánh **FAIL** với thông báo lỗi chi tiết.

### Kịch bản 3: Kiểm chứng PR Convention Linter với PR đúng định dạng
- **Thao tác**: Đặt tiêu đề PR đúng chuẩn `feat(OPS-50): configure pr convention linter` trên nhánh `feat/OPS-50-...` (hoặc `feature/OPS-50-...`).
- **Kết quả mong đợi**: Workflow `PR Convention Linter` chạy thành công đạt trạng thái **PASS**.

### Kịch bản 4: Kiểm chứng quyền Merge PR của Admin
- **Thao tác**: Tài khoản `hotung9108` kiểm tra nút Merge trên PR của chính mình.
- **Kết quả mong đợi**: Nút Merge khả dụng (nhờ quyền bypass review của Role Admin), và khi merge xong nhánh `develop`/`staging` không bị xóa.

---

## 3. Kết Quả Nghiệm Thu & Đóng Thẻ
Sau khi kiểm chứng đầy đủ 4 kịch bản trên:
1. Tester `@Zawn-Tsu` phê duyệt Pull Request trên GitHub.
2. Di chuyển thẻ `[OPS-50]` trên Trello từ `Ongoing` -> `Review` -> `Done (Sprint 8)`.
