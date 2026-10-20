# [FE][Admin Accounts] Không tìm thấy tài khoản mới dù API có bản ghi

Issue: https://github.com/hotung9108/EnglishHub/issues/189

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-003**.
Mức độ đề xuất: **Medium**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Có phiên Admin và một Teacher QA mới. GET user xác nhận email, role TEACHER, trạng thái ACTIVE; có thể tìm Teacher này tại màn Giáo viên.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Vào Quản lý tài khoản (Accounts).
2. Nhập chính xác email Teacher QA vừa được API xác minh.
3. Chờ tải/tìm kiếm hoàn tất và kiểm tra danh sách.
4. Đối chiếu cùng email tại màn Giáo viên và API đọc user.

## Kết quả mong đợi

Accounts tìm được đúng tài khoản mới theo email.

## Kết quả thực tế và bằng chứng đã quan sát

Accounts trả 0 dòng, trong khi API có bản ghi ACTIVE và màn Giáo viên tìm được cùng Teacher.

Nguồn kiểm chứng: Selenium headless full run r6 (50 case: 35 Pass / 9 Fail / 6 Blocked), đối chiếu evidence API/DOM/network và report đã lưu.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Chưa xác định root cause ở truy vấn, phân trang hay đồng bộ. QA31-006/007/008 bị chặn bởi lỗi này; không mở thành ba bug mới.

## Tiêu chí hoàn tất và retest

- [ ] Tìm chính xác và một phần email của Teacher/Student mới và cũ.
- [ ] Từ tài khoản tìm được, kiểm tra tiếp các case sửa/khóa đang bị chặn.

<!-- QA31-issue-key:accounts-search -->
