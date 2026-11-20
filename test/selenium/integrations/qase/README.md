# Qase

Cấu trúc Qase và source: nhóm chức năng → UC → case. Xem [mục lục UC](UC-NAVIGATION.md) và `uc-layout.json`. Vai trò chuyển thành nhãn; source thực tế ở `cases/<nhóm>/<uc>/`. 170 cập nhật đã được Qase xác nhận; lượt đọc lại toàn bộ chưa hoàn tất do phản hồi chậm.

Đã nhập 170 định nghĩa ca vào dự án EAM ngày 17/11/2026, suite 243.
`mapping.json` lưu ánh xạ localCaseId → Qase case ID đã đọc lại và xác minh. Dùng ID này để cập nhật; không nhập lại thành ca mới.
168 ca ở Draft để duyệt nội dung; DO_017 và GRD_012 ở Deprecated vì ngoài phạm vi. Nhãn `needs-review` đánh dấu 40 ca cần ưu tiên rà soát, không phải kết luận lỗi sản phẩm.
536 ca UI cũ nằm trong suite lưu trữ 267, giữ nguyên ID và lịch sử chạy. Backup riêng tại `D:/ki7/prj1/backups/qase-ui-before-replacement-20261117/`; không đưa backup chứa dữ liệu cũ lên Git.
Tra ca bằng `npm run find -- ASG_009`; xem `catalog/case-index.csv`.
Nội dung ca do `catalog/cases.json` quản lý; kết quả thực thi thuộc từng run riêng.
Chạy `node tools/build-case-index.js` từ thư mục selenium để cập nhật chỉ mục kèm Qase ID. Lệnh này không ghi lên Qase.
Chưa bật tự động đồng bộ hoặc gửi kết quả CI. Bản nhập này không tạo Test Run hay chuyển kết quả lịch sử thành kết quả mới.
