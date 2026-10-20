# QA31 — Issue đã đăng ngày 20/10/2026

Đã đăng và đọc lại xác minh 9 issue, trạng thái Open, nhãn bug. Bản công khai dùng placeholder thay URL staging và định danh dữ liệu. Không chạy lại staging trong lượt đăng issue.

| Case | Issue | Các case bị chặn liên quan |
|---|---|---|
| QA31-003 | [#189 — [FE][Admin Accounts] Không tìm thấy tài khoản mới dù API có bản ghi](https://github.com/hotung9108/EnglishHub/issues/189) | QA31-006, QA31-007, QA31-008 |
| QA31-014 | [#190 — [FE][Admin Students] Không tìm thấy học viên mới dù đã tồn tại và ghi danh vào lớp](https://github.com/hotung9108/EnglishHub/issues/190) | QA31-041 |
| QA31-020 | [#191 — [FE][Admin Student Profile] URL của học viên được chọn nhưng hồ sơ hiển thị người khác](https://github.com/hotung9108/EnglishHub/issues/191) | QA31-042 |
| QA31-021 | [#192 — [FE][Admin Class Assignments] API trả 403 nhưng giao diện báo lớp chưa có bài tập](https://github.com/hotung9108/EnglishHub/issues/192) | — |
| QA31-025 | [#193 — [FE][Admin Reports] Chọn một lớp nhưng bảng báo cáo vẫn hiển thị các lớp khác](https://github.com/hotung9108/EnglishHub/issues/193) | — |
| QA31-031 | [#194 — [Integration][Admin Audit] Không mở được chi tiết lịch sử chấm điểm vì API detail trả 403](https://github.com/hotung9108/EnglishHub/issues/194) | — |
| QA31-036 | [#195 — [FE][Admin Accounts] Chọn vai trò Admin nhưng tài khoản mới được tạo thành Student](https://github.com/hotung9108/EnglishHub/issues/195) | — |
| QA31-036 (API diagnostic riêng) | [#196 — [BE][Admin Users] API tạo tài khoản từ chối role ADMIN hợp lệ bằng HTTP 400](https://github.com/hotung9108/EnglishHub/issues/196) | — |
| QA31-048 | [#197 — [FE][Admin Settings] Trang cấu hình hệ thống theo FE-23 đang mở hồ sơ cá nhân](https://github.com/hotung9108/EnglishHub/issues/197) | QA31-049 |

Report gốc r6: **35 Pass / 9 Fail / 6 Blocked**. Case 050 chưa xác nhận bug vì chỉ khảo sát sidebar. Không mở issue riêng cho các bước bị chặn. Hai issue liên quan 036 phân biệt UI lưu sai role với API từ chối ADMIN.

## Comment dán Trello

```text
[QA-31] Đã chạy Selenium Admin trên staging và review kết quả.
Full run r6 ngày 20/10/2026: 50 case — 35 Pass / 9 Fail / 6 Blocked.
Đã tạo 9 issue riêng có tiền điều kiện, bước tái hiện, Expected/Actual, bằng chứng quan sát và tiêu chí retest:
- QA31-003: [FE][Admin Accounts] Không tìm thấy tài khoản mới dù API có bản ghi
  https://github.com/hotung9108/EnglishHub/issues/189
- QA31-014: [FE][Admin Students] Không tìm thấy học viên mới dù đã tồn tại và ghi danh vào lớp
  https://github.com/hotung9108/EnglishHub/issues/190
- QA31-020: [FE][Admin Student Profile] URL của học viên được chọn nhưng hồ sơ hiển thị người khác
  https://github.com/hotung9108/EnglishHub/issues/191
- QA31-021: [FE][Admin Class Assignments] API trả 403 nhưng giao diện báo lớp chưa có bài tập
  https://github.com/hotung9108/EnglishHub/issues/192
- QA31-025: [FE][Admin Reports] Chọn một lớp nhưng bảng báo cáo vẫn hiển thị các lớp khác
  https://github.com/hotung9108/EnglishHub/issues/193
- QA31-031: [Integration][Admin Audit] Không mở được chi tiết lịch sử chấm điểm vì API detail trả 403
  https://github.com/hotung9108/EnglishHub/issues/194
- QA31-036: [FE][Admin Accounts] Chọn vai trò Admin nhưng tài khoản mới được tạo thành Student
  https://github.com/hotung9108/EnglishHub/issues/195
- QA31-036: [BE][Admin Users] API tạo tài khoản từ chối role ADMIN hợp lệ bằng HTTP 400
  https://github.com/hotung9108/EnglishHub/issues/196
- QA31-048: [FE][Admin Settings] Trang cấu hình hệ thống theo FE-23 đang mở hồ sơ cá nhân
  https://github.com/hotung9108/EnglishHub/issues/197
Case 050 cần làm rõ luồng quản lý nội dung; chưa đủ chứng cứ mở bug từ việc không thấy menu sidebar.
Các case Blocked chưa thực hiện được bước chính; sẽ retest sau khi sửa lỗi phụ thuộc.
Đính kèm report HTML và review chi tiết.
```
