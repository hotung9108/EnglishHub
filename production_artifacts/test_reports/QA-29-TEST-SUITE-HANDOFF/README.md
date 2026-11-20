# QA-29 - Bàn giao bộ test thật và tổ chức source

Task: [QA-29 trên Trello](https://trello.com/c/Zbv6a6Pw).

## Nội dung đợt bàn giao

- Một bộ Selenium chính: 170 ID trong catalog, 168 procedure và 2 case ngoài phạm vi; source theo chức năng → UC.
- Runner chạy browser/API staging, lưu ảnh/network/journal và cleanup; giữ phân loại FAIL/BLOCKED/SKIPPED, không đổi expected để làm đẹp số PASS.
- 28 kiểm tra offline dành cho chính runner, mapping và báo cáo. Đây không phải 28 ca nghiệm thu sản phẩm và không thay cho chạy thật trên staging.
- API catalog review có 8 collection / 623 request, chưa bật thực thi từ catalog.
- Bộ Reborn, scaffold chỉ assert true/status 0 và helper không dùng đã rút khỏi source chính; dữ liệu gốc được lưu backup riêng, không đưa credential/report thô lên Git.
- Hướng dẫn thành viên mới: [TEAM_SETUP](../../../test/docs/TEAM_SETUP.md).

## Minh chứng chọn lọc

- [TSR API PDF](TSR_API.pdf), [gói TSR và evidence đã che thông tin](TSR_API_ENGLISHHUB_2026-11-17.zip).
- [Kiểm tra cài từ source sạch](clean-install-verification.json).
- [Số liệu run Selenium R7 lịch sử](historical-r7-counts.json): 120 PASS / 29 FAIL / 19 BLOCKED / 2 SKIPPED. Không phải một lượt chạy phát sinh từ PR này; build staging khi chạy chưa được xác minh.

Các report đầy đủ và ảnh local được bàn giao riêng, tra trong `test/reports/` hoặc `test/selenium/reports/` trên máy quản lý. Không đưa report thô, database dump, `.env` hoặc ZIP private vào Git.

## Phần chưa hoàn tất

- Qase đã có 170 định nghĩa và mapping; 168 Draft, 2 Deprecated. Chưa bật tự gửi kết quả hoặc đồng bộ metadata source mới đầy đủ.
- Chưa kết luận toàn bộ FAIL là bug sản phẩm, chưa xác nhận mọi issue đã được xử lý và không tự đóng issue/task.
- Cần đối soát phạm vi UC trong mô tả thẻ cũ với đặc tả/catalog hiện hành trước khi nghiệm thu 100% phạm vi.
- Import Qase một lần của layout cũ không đưa vào source reusable. Chỉ cập nhật theo ID trong mapping, không nhập lại để tạo trùng case.
- Đợt PR này xác minh offline/cài đặt; cần chạy theo từng ca/suite trên môi trường được xác nhận trước khi phê duyệt nghiệp vụ.

Không thay code FE/BE/AI hoặc các bản SRS/PP/TP đang chỉnh riêng trên workspace. Đây là bản bàn giao tạm để review.
