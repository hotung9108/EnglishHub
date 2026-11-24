# [FE][Admin Reports] Chọn một lớp nhưng bảng báo cáo vẫn hiển thị các lớp khác

Issue: https://github.com/hotung9108/EnglishHub/issues/193

Nguồn: **QA-31 — kiểm thử Admin trên staging**, ngày 20/10/2026. Testcase: **QA31-025**.
Mức độ đề xuất: **Medium**. Một issue mô tả một hành vi lỗi.

## Tiền điều kiện

Có lớp QA với dữ liệu đối chứng: một bài đã chấm 8/10, hoàn thành 100%; hệ thống còn lớp khác.

Dùng fixture QA riêng; các giá trị `<...>` là placeholder cần thay bằng dữ liệu QA của lần tái hiện. Không dùng dữ liệu người dùng thật.

## Các bước tái hiện

1. Đăng nhập Admin, mở Báo cáo.
2. Chọn đúng lớp QA trong bộ lọc lớp.
3. Chờ dữ liệu và KPI cập nhật.
4. Kiểm tra mọi dòng trong bảng kết quả theo lớp đã chọn.

## Kết quả mong đợi

Bảng chỉ hiển thị lớp đã chọn, đồng bộ với bộ lọc và KPI.

## Kết quả thực tế và bằng chứng đã quan sát

Dòng lớp QA đúng 1 bài / 80% / 100%, nhưng bảng vẫn hiển thị 89 dòng có cả lớp khác.

Nguồn kiểm chứng: Selenium headless full run r6 (50 case: 35 Pass / 9 Fail / 6 Blocked), đối chiếu evidence API/DOM/network và report đã lưu.

Bản công khai đã lược URL môi trường, tên/email tài khoản, ID dữ liệu thực và artifact thô. Không đính kèm thông tin đăng nhập. Report/evidence gốc được bàn giao riêng cho nhóm dự án; các quan sát ở trên không phải kết quả chạy mới.

## Phạm vi và ảnh hưởng

Không phải lỗi quy đổi thang điểm. Root cause chưa được khẳng định; assertion Fail ở phạm vi dòng sau khi lọc.

## Tiêu chí hoàn tất và retest

- [ ] Chọn lần lượt hai lớp, mọi dòng thuộc lớp đang chọn.
- [ ] Xóa bộ lọc khôi phục bảng và KPI toàn hệ thống.

<!-- QA31-issue-key:reports-class-filter -->
