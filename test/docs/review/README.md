# Phần chọn từ test_reborn để rà và tận dụng

Các mục ở đây chưa được đưa vào bộ kiểm thử được duyệt và không tự chạy bằng runner Selenium.

| Nội dung | Nơi tìm | Cách dùng |
|---|---|---|
| 133 định nghĩa Selenium cũ còn trong source | [selenium-candidates.json](selenium-candidates.json) | So mục tiêu, điều kiện, expected với case theo UC hiện tại; lấy assertion hoặc tách case thiếu. Không nhập lại theo mã ADM/TEA/STU |
| 19 ý tưởng tình huống biên/ngoại lệ | [edge-candidates.json](edge-candidates.json) | Kiểm căn cứ đặc tả trước khi thêm procedure |
| Ma trận cũ nguyên văn | [legacy-edge-cases.md](legacy-edge-cases.md) | Tài liệu lịch sử, có expected mơ hồ và liên kết issue chưa kiểm lại |
| 110 thư mục bug lịch sử | [historical-bugs.json](historical-bugs.json) | Tra lại bằng chứng trong archive; nhãn OPEN/active cũ không xác nhận lỗi hiện tại |
| 8 collection API / 623 request | [API catalog](../../api/README.md) | Kiểm tra JSON và request count offline; không phải 623 test case đã duyệt |

133 là số định nghĩa trích tĩnh từ source hiện có, không lấy con số 146 trong README cũ; các định nghĩa bị comment/disable không tự phục hồi. Chưa lập kết luận bao phủ/trùng lặp đầy đủ từng case.

Từ thư mục `test/`, dùng `npm run find -- --scope=legacy "mật khẩu"`, `npm run find -- --scope=edges UC12`, hoặc `npm run find -- --scope=bugs ADM-048`.

Để nhận một mục vào bộ chính: ghi UC theo PDF Group-04, so case đã có, xác định expected cụ thể, chuyển assertion hữu ích sang module UC và giữ traceability tới source gốc. Việc này không được coi là hoàn tất chỉ nhờ đổi thư mục.
