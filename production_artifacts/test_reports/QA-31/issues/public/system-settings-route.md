# [FE][Admin Settings] Trang cấu hình hệ thống theo FE-23 đang mở hồ sơ cá nhân

Issue: https://github.com/hotung9108/EnglishHub/issues/197

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-048**.
Mức độ đề xuất: **Medium**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Có phiên Admin. Đối chiếu FE-23 TC-05 yêu cầu cấu hình hệ thống gồm model chấm Writing và thao tác Lưu/Khôi phục.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Đăng nhập Admin.
2. Bấm Cài đặt trên sidebar.
3. Chờ URL /admin/settings tải xong.
4. Tìm form model chấm Writing cùng nút Lưu/Khôi phục theo FE-23.

## Kết quả mong đợi

Mở được form cấu hình hệ thống theo FE-23 TC-05.

## Kết quả thực tế và bằng chứng đã quan sát

Trang hiển thị Hồ sơ cá nhân/Bảo mật tài khoản và trường profile; không có form cấu hình model cùng Lưu/Khôi phục cấu hình hệ thống.

Nguồn kiểm chứng: Selenium headless full run r6 (50 case: 35 Pass / 9 Fail / 6 Blocked), đối chiếu evidence API/DOM/network và report đã lưu.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Sai lệch chức năng so với FE-23. Nếu phạm vi đã đổi cần cập nhật đặc tả được phê duyệt. QA31-049 chưa kiểm tra được save/reload/reset vì thiếu form.

## Tiêu chí hoàn tất và retest

- [ ] Mở đúng form cấu hình theo yêu cầu.
- [ ] Chạy tiếp QA31-049 để xác minh lưu, reload và khôi phục.

<!-- QA31-issue-key:system-settings-route -->
