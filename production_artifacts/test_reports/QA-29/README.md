# QA29 — bàn giao kiểm thử luồng Giáo viên

Task đã hoàn tất kiểm thử và bàn giao issue/Trello theo xác nhận của tester. PR tích hợp source QA29 vào framework Selenium chung, không thay đổi source ứng dụng và không đóng các issue sản phẩm.

- Lượt staging: `qa29-2026-10-15T14-39-05-249Z`, từ 21:39:05 đến 21:56:57 ngày 15/10/2026 (UTC+07).
- Kết quả: **41 Passed / 7 Failed / 3 Blocked**, đủ 51 case; run status `FAILED` phản ánh kết quả assertions, không phải trạng thái bàn giao task.
- [Tóm tắt thực thi](execution-summary.json) được trích từ summary gốc, giữ ID/kết quả/phân loại/thời gian và source hashes, không đưa ledger, tài khoản hoặc token vào repo.
- Report HTML/PNG/evidence gốc được giữ nguyên tại workspace QA của tester; bằng chứng issue được bàn giao trên GitHub/Trello. Không coi phân loại tự động của report là kết luận bug.
- Không chạy lại Selenium/staging trong bước tích hợp này. UI develop đã có thay đổi sau lượt test; không suy ra bộ 51 case vẫn đạt cùng kết quả trên build mới.
- Kiểm tra tích hợp ngày 17/10/2026: `npm.cmd ci --offline` cài thành công từ lockfile; `npm.cmd run check` đạt 31/31; 28 module JavaScript qua syntax/import checks; launcher PowerShell qua parser; đường dẫn tài liệu hợp lệ. Đã rà soát credential local và ignore ledger/report/environment nhạy cảm. Coverage chưa đo, không tuyên bố đạt ngưỡng 80%.

| Case | Kết quả lịch sử | Issue bàn giao |
| --- | --- | --- |
| QA29-010 | Failed | [#151 — Nhận xét trống khi mở lại](https://github.com/hotung9108/EnglishHub/issues/151) |
| QA29-021 | Blocked | [#152 — Thao tác đóng bài](https://github.com/hotung9108/EnglishHub/issues/152) |
| QA29-032, QA29-033 | Failed | [#153 — AI suggestion trả 403, cần điều tra](https://github.com/hotung9108/EnglishHub/issues/153) |
| QA29-038 | Failed | [#154 — Export không tạo file](https://github.com/hotung9108/EnglishHub/issues/154) |
| QA29-039 | Failed | [#149 — API đọc lớp ngoài quyền](https://github.com/hotung9108/EnglishHub/issues/149), [#159 — Hosting trả 404 đường dẫn con](https://github.com/hotung9108/EnglishHub/issues/159) |
| QA29-045 | Blocked | [#155 — Cài đặt thông báo](https://github.com/hotung9108/EnglishHub/issues/155) |
| QA29-046 | Blocked | [#156 — Tùy chọn giao diện](https://github.com/hotung9108/EnglishHub/issues/156) |
| QA29-047 | Failed | [#157 — Logout còn access token](https://github.com/hotung9108/EnglishHub/issues/157) |
| QA29-048 | Failed | [#158 — Điều hướng ngân hàng đề](https://github.com/hotung9108/EnglishHub/issues/158) |

Các link mô tả vấn đề tại thời điểm bàn giao, không tuyên bố trạng thái mở/đóng hiện tại. Trước retest cần xác minh build và fixture vì ID staging có thể đổi sau cleanup.

[Hướng dẫn chạy](../../../test/selenium/QA29-README.md) · [51 case](../../../test/selenium/QA29-TEST-CASES.md).
