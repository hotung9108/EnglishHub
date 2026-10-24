# [FE][Admin Accounts] Chọn vai trò Admin nhưng tài khoản mới được tạo thành Student

Issue: https://github.com/hotung9108/EnglishHub/issues/195

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-036**.
Mức độ đề xuất: **High**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Admin được tạo tài khoản Admin theo yêu cầu nghiệp vụ đã xác nhận. Chuẩn bị email QA mới và dữ liệu hợp lệ.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Đăng nhập Admin, vào Accounts.
2. Bấm Thêm tài khoản.
3. Nhập họ tên, email QA mới, mật khẩu hợp lệ.
4. Chọn vai trò Admin.
5. Xác minh giá trị select là ADMIN trước khi lưu.
6. Bấm Lưu, ghi kết quả tạo.
7. Dùng API Admin tìm lại đúng email để kiểm tra role đã lưu.

## Kết quả mong đợi

User được tạo có role ADMIN, nhất quán với lựa chọn trong form.

## Kết quả thực tế và bằng chứng đã quan sát

UI chọn ADMIN trước khi submit; tạo tài khoản trả 201 nhưng đọc lại user có role STUDENT.

Nguồn kiểm chứng: Selenium headless full run r6 (50 case: 35 Pass / 9 Fail / 6 Blocked), đối chiếu evidence API/DOM/network và report đã lưu.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Không gộp với issue API từ chối payload ADMIN: đây là hành vi UI chọn một role nhưng lưu role khác. Teacher/Student creation riêng đã Pass.

## Tiêu chí hoàn tất và retest

- [ ] QA31-036 tạo Admin và đọc lại role ADMIN.
- [ ] QA31-037/038 tạo Teacher/Student vẫn lưu đúng role.

<!-- QA31-issue-key:admin-role-mapping -->
