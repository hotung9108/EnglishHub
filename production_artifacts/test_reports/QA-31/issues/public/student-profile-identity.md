# [FE][Admin Student Profile] URL của học viên được chọn nhưng hồ sơ hiển thị người khác

Issue: https://github.com/hotung9108/EnglishHub/issues/191

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-020**.
Mức độ đề xuất: **High**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Có Student QA trong roster lớp QA; đã biết đúng ID và danh tính bằng API. Dùng dữ liệu QA riêng.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Đăng nhập Admin, mở quản lý lớp QA.
2. Tìm dòng Student QA trong roster.
3. Bấm mở hồ sơ từ đúng dòng đó.
4. Kiểm tra URL /admin/students/<studentId> và so tên/email/mã học viên trên hồ sơ với Student đã chọn.

## Kết quả mong đợi

URL và toàn bộ thông tin hồ sơ thuộc cùng Student được chọn.

## Kết quả thực tế và bằng chứng đã quan sát

URL mang đúng ID Student được chọn nhưng phần danh tính hiển thị người khác. Không tiếp tục thao tác khóa/reset trên hồ sơ sai.

Nguồn kiểm chứng: Selenium headless full run r6 (50 case: 35 Pass / 9 Fail / 6 Blocked), đối chiếu evidence API/DOM/network và report đã lưu.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Đây là lỗi danh tính hiển thị đã quan sát; chưa kết luận API trả dữ liệu người khác hay FE dùng dữ liệu mẫu. QA31-042 bị chặn bởi cùng lỗi.

## Tiêu chí hoàn tất và retest

- [ ] Mở hai Student QA khác nhau và kiểm tra toàn bộ thông tin theo đúng ID.
- [ ] Reload và điều hướng qua lại không giữ danh tính của người khác.

<!-- QA31-issue-key:student-profile-identity -->
