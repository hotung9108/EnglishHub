# [FE][Admin Students] Không tìm thấy học viên mới dù đã tồn tại và ghi danh vào lớp

Issue: https://github.com/hotung9108/EnglishHub/issues/190

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-014**.
Mức độ đề xuất: **Medium**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Có Student QA mới ACTIVE; API đọc user và roster xác nhận Student đã ghi danh vào lớp QA.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Đăng nhập Admin, vào danh sách Học viên.
2. Tìm bằng email chính xác của Student QA.
3. Chờ tải/tìm kiếm hoàn tất.
4. Đối chiếu với API user và roster của lớp QA.

## Kết quả mong đợi

Danh sách trả đúng Student phù hợp với email đã nhập.

## Kết quả thực tế và bằng chứng đã quan sát

Sau thời gian chờ tìm kiếm 30 giây vẫn không tìm được Student; API và roster có bản ghi tương ứng.

Nguồn kiểm chứng: Selenium headless full run r6 (50 case: 35 Pass / 9 Fail / 6 Blocked), đối chiếu evidence API/DOM/network và report đã lưu.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Tìm Student cũ đã Pass không loại trừ lỗi tìm Student mới. QA31-041 bị chặn trước bước khóa.

## Tiêu chí hoàn tất và retest

- [ ] Tìm Student mới bằng email/tên và kiểm tra kết quả sau reload.
- [ ] Kiểm tra Student cũ và trường hợp không có kết quả.

<!-- QA31-issue-key:students-search -->
