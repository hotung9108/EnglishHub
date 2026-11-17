# UC005 — Phân quyền người dùng

Suite Qase: 279.

| Case | Nội dung | Vai trò fixture | Source | Qase |
|---|---|---|---|---|
| RBAC_001 | Đổi vai trò Học viên → Giáo viên | admin | [admin-accounts.cases.js](admin-accounts.cases.js) | EAM-4874 |
| RBAC_002 | Quản lý tự tước quyền quản trị của chính mình | shared | [admin-accounts.cases.js](admin-accounts.cases.js) | EAM-4875 |
| RBAC_003 | Giáo viên truy cập URL quản trị | teacher | [admin-accounts.cases.js](admin-accounts.cases.js) | EAM-4876 |
| RBAC_004 | Học viên truy cập URL giảng dạy (tạo bài tập) | student | [admin-accounts.cases.js](admin-accounts.cases.js) | EAM-4877 |
| RBAC_005 | IDOR: Học viên A xem bài làm của Học viên B qua URL/ID | student | [student-attempts.cases.js](student-attempts.cases.js) | EAM-4878 |
| RBAC_006 | API từ chối khi thiếu/giả token | student | [admin-accounts.cases.js](admin-accounts.cases.js) | EAM-4879 |
