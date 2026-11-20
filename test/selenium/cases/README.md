# Mục lục Selenium theo chức năng và UC

170 mã: 168 procedure, 2 ca ngoài phạm vi. Case nhiều UC chỉ đặt ở UC đầu tiên; các tham chiếu khác giữ trong catalog. Vai trò được lọc bằng `npm run find -- --role=teacher`; tra UC bằng `npm run find -- --requirement=UC012`.

## Xác thực và hồ sơ

- [UC001 — Đăng nhập](01-auth-profile/uc001/README.md): 25 ca.
- [UC002 — Đăng xuất](01-auth-profile/uc002/README.md): 5 ca.
- [UC003 — Quản lý tài khoản cá nhân](01-auth-profile/uc003/README.md): 12 ca.
## Tài khoản và phân quyền

- [UC004 — Quản lý tài khoản người dùng](02-users-permissions/uc004/README.md): 13 ca.
- [UC005 — Phân quyền người dùng](02-users-permissions/uc005/README.md): 6 ca.
- [UC006 — Quản lý giáo viên](02-users-permissions/uc006/README.md): 4 ca.
- [UC007 — Quản lý học viên](02-users-permissions/uc007/README.md): 4 ca.
## Lớp học và thành viên

- [UC008 — Quản lý lớp học](03-classes-members/uc008/README.md): 8 ca.
- [UC009 — Quản lý thành viên lớp học](03-classes-members/uc009/README.md): 5 ca.
- [UC010 — Xem danh sách lớp học](03-classes-members/uc010/README.md): 3 ca.
## Quản lý bài tập

- [UC011 — Quản lý bài tập](04-assignments/uc011/README.md): 4 ca.
- [UC012 — Tạo bài tập](04-assignments/uc012/README.md): 13 ca.
- [UC013 — Mởbài tập](04-assignments/uc013/README.md): 3 ca.
- [UC014 — Khóa bài tập](04-assignments/uc014/README.md): 2 ca.
## Làm bài và nộp bài

- [UC015 — Xem bài tập](05-attempts-submissions/uc015/README.md): 2 ca.
- [UC016 — Làm bài tập viết](05-attempts-submissions/uc016/README.md): 3 ca.
- [UC017 — Làm bài tập nói](05-attempts-submissions/uc017/README.md): 3 ca.
- [UC018 — Làm bài tập đọc](05-attempts-submissions/uc018/README.md): 2 ca.
- [UC019 — Làm bài tập nghe](05-attempts-submissions/uc019/README.md): 2 ca.
- [UC020 — Xem lại bài làm](05-attempts-submissions/uc020/README.md): 1 ca.
- [UC021 — Nộp bài tập](05-attempts-submissions/uc021/README.md): 5 ca.
- [UC022 — Quản lý lần làm và làm lại bài](05-attempts-submissions/uc022/README.md): 3 ca.
- [UC023 — Xem trạng thái bài làm](05-attempts-submissions/uc023/README.md): 1 ca.
## Chấm bài và điểm số

- [UC024 — Chấm bài thủcông](06-grading-scores/uc024/README.md): 8 ca.
- [UC025 — Hỗtrợchấm chữa bài viết bằng AI](06-grading-scores/uc025/README.md): 3 ca.
- [UC026 — Hỗtrợchấm chữa bài nói bằng AI](06-grading-scores/uc026/README.md): 1 ca.
- [UC027 — Chấm bài đọc](06-grading-scores/uc027/README.md): 2 ca.
- [UC028 — Chấm bài nghe](06-grading-scores/uc028/README.md): 1 ca.
- [UC029 — Xem điểm số](06-grading-scores/uc029/README.md): 3 ca.
- [UC030 — Quản lý điểm số](06-grading-scores/uc030/README.md): 2 ca.
## Kết quả và báo cáo

- [UC031 — Xem kết quảhọc tập](07-results-reports/uc031/README.md): 2 ca.
- [UC032 — Xem bài chữa](07-results-reports/uc032/README.md): 2 ca.
- [UC033 — Xem và đánh giá kết quảhọc viên](07-results-reports/uc033/README.md): 2 ca.
- [UC034 — Theo dõi tiến độhọc tập](07-results-reports/uc034/README.md): 1 ca.
- [UC035 — Xem báo cáo và thống kê học tập](07-results-reports/uc035/README.md): 3 ca.

## NFR

9 ca tại [08-nfr/nfr.cases.js](08-nfr/nfr.cases.js).

## Ngoài phạm vi

DO_017 và GRD_012 giữ trong catalog với scope exclusion; không có procedure.

## Dữ liệu và code dùng chung

`common/flows/`, `common/ui/`, `common/fixtures/` và `common/runner/`. `catalog/source-migration.json` ghi đường dẫn cũ → mới. Không chỉnh expected trong đợt sắp xếp.
