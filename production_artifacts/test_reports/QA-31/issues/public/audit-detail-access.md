# [Integration][Admin Audit] Không mở được chi tiết lịch sử chấm điểm vì API detail trả 403

Issue: https://github.com/hotung9108/EnglishHub/issues/194

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-031**.
Mức độ đề xuất: **High**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Có grading QA COMPLETED, điểm 8 và lịch sử sửa điểm 7.5 → 8; phiên Admin có quyền xem Audit theo FE-23.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Đăng nhập Admin, mở lịch sử chấm điểm/Audit.
2. Tìm đúng grading QA.
3. Bấm xem chi tiết để mở drawer.
4. Kiểm tra request detail và change-logs của cùng grading trong Network.

## Kết quả mong đợi

Admin mở được chi tiết cùng lịch sử sửa điểm theo chức năng Audit trong FE-23.

## Kết quả thực tế và bằng chứng đã quan sát

Request detail trả HTTP 403, trong khi change-logs trả 200 và có lịch sử sửa điểm; drawer không hiển thị được chi tiết.

Nguồn kiểm chứng: Selenium headless full run r6 (50 case: 35 Pass / 9 Fail / 6 Blocked), đối chiếu evidence API/DOM/network và report đã lưu.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Lỗi tích hợp truy cập chi tiết. Chưa kiểm tra được render từng dòng log phía sau bước bị chặn.

## Tiêu chí hoàn tất và retest

- [ ] Admin mở được detail và logs của grading QA.
- [ ] Kiểm tra đúng danh tính bài, điểm và lịch sử; tài khoản không được phép vẫn bị chặn.

<!-- QA31-issue-key:audit-detail-access -->
