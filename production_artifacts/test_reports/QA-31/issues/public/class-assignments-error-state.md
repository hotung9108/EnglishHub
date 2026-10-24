# [FE][Admin Class Assignments] API trả 403 nhưng giao diện báo lớp chưa có bài tập

Issue: https://github.com/hotung9108/EnglishHub/issues/192

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-021**.
Mức độ đề xuất: **Medium**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Lớp QA có ít nhất một assignment PUBLISHED, đã được xác minh bằng phiên Teacher; có phiên Admin.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Đăng nhập Admin, mở quản lý lớp QA.
2. Mở tab Bài tập & Điểm số.
3. Chờ hết loading, ghi lại số bài và thông báo.
4. Trong Network kiểm tra GET /api/v1/classes/<classId>/assignments.

## Kết quả mong đợi

Khi request bị từ chối hoặc lỗi, UI báo lỗi tải/giới hạn quyền; chỉ hiển thị lớp rỗng khi có response thành công xác nhận rỗng.

## Kết quả thực tế và bằng chứng đã quan sát

Request trả HTTP 403 nhưng UI đếm 0 và hiện “Chưa có bài tập nào được giao cho lớp này”, dù fixture có bài PUBLISHED.

Nguồn kiểm chứng: Selenium headless full run r6 (50 case: 35 Pass / 9 Fail / 6 Blocked), đối chiếu evidence API/DOM/network và report đã lưu.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Issue về UI trình bày lỗi thành dữ liệu rỗng. Không suy ra backend phải cho Admin đọc chỉ từ HTTP 403; quyền đọc cần đối chiếu contract.

## Tiêu chí hoàn tất và retest

- [ ] 403/5xx/mất mạng có thông báo lỗi đúng.
- [ ] Response 200 rỗng và 200 có bài hiển thị đúng từng trạng thái.

<!-- QA31-issue-key:class-assignments-error-state -->
