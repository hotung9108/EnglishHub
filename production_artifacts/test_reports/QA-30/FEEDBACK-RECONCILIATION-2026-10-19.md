# QA30 — cập nhật sau phản biện gói AI ngày 19/10/2026

Đây là phần bổ sung cho RUN-REVIEW-2026-10-18-2053.md, không phải một lượt test mới. Giữ nguyên report, TRIAGE và Pass/Fail lịch sử; chưa tạo issue.

**Sau đó đã kiểm tra GET bổ sung lúc 17:43 ngày 19/10:** xem [kết quả chỉ đọc mới](READONLY-RECHECK-2026-10-19.md). Có thêm bằng chứng mapping sai assignmentId ở bảng điểm, bộ lọc parent status của Feedback và policy của các endpoint 403. Những mục “chưa xác minh” bên dưới mô tả thời điểm nhận feedback; dùng tài liệu bổ sung để xem kết luận mới nhất.

## Phân loại được điều chỉnh/làm rõ

- **R01 (007/045), R04 (013–015), R11 (039):** lỗi hành vi của bản staging có bằng chứng, nhưng source tham chiếu 321ce42 đã đọc maxSubmissions thật, có input SHORT_ANSWER và khóa Speaking khi chưa ghi âm. Xếp vào nhóm cần xác nhận commit/artifact đang deploy trước khi báo dev sửa logic hoặc mở issue trùng. Việc deploy cũ là giải thích phù hợp bằng chứng, chưa phải xác nhận commit build cụ thể. Không coi lỗi đã được khắc phục trên staging chỉ vì source đã sửa.
- **R02 (011):** tiếp tục CONTRACT_GAP_REVIEW. UI cho nhập/nộp văn bản, contract ESSAY lưu file; không gộp nguyên nhân với PDF hoặc tự kết luận lỗi database.
- **R03 (012):** ngoài evidence không có file READY, source Writing còn bắt lỗi upload bằng console.warn rồi tiếp tục submit. Không kiểm tra response.ok của PUT; cần kiểm tra contract upload hoàn tất/READY. Deploy lại riêng frontend chưa bảo đảm giải quyết việc báo nộp thành công dù upload thất bại.
- **R06 (016):** dữ liệu audio không lưu được theo evidence. Ưu tiên cùng Writing, nhưng chưa khẳng định cùng root cause.
- **R05 (025–027):** giữ là khoảng lệch options cần xác minh đường dữ liệu. DTO câu hỏi phía module và DTO phía submission không nhất thiết cùng trường; cần response Student đúng endpoint mà editor thực sự dùng. Chưa gán trách nhiệm FE hoặc BE, chưa xác nhận chấm điểm.
- **R08 (022/024/030/033/034):** bất nhất trạng thái/nhận xét giữa các màn có evidence; parent SUBMITTED không tự nó chứng minh fixture sai. 033/034 bị chặn bởi thiếu thẻ của 022, chưa kiểm tra được filter/link.
- **R09 (017/018/019/028/031/032):** sáu case không phải sáu bug. Chưa đủ để xác nhận bug thiếu bài, filter, action hoặc mẫu số của chính fixture #1466 chỉ từ timeout tìm dòng. Phân trang/mapping vẫn cần xác minh. Quan sát gán tên lớp mới cho bài cũ là triệu chứng riêng cần đối chiếu DTO. Source có pageSize=10 và slice phía UI; request listSubmissions không truyền page/limit tại call site. Vì vậy không khẳng định API chỉ lấy 10 bản ghi hay phân trang là nguyên nhân đã được chứng minh.
- **045:** chỉ xác nhận chênh lệch maxSubmissions; lịch sử đang loading, assertion hết lượt chưa được thực hiện.
- **038:** mới thấy UI nhận tên TXT/không báo lỗi, chưa gửi TXT để chứng minh backend chấp nhận.
- **403 progress/AI suggestion:** chưa đủ căn cứ issue quyền hoặc lỗi hạ tầng.

Không công bố số root cause từ 25 Fail hay 11 nhóm review. Nhiều triệu chứng có thể do cùng artifact staging cũ; các nhóm vẫn là phạm vi điều tra.

## Đính chính hash bundle trong ZIP v1

- File gốc khảo sát (chưa làm sạch): SHA-256 `360e7a7e5c37c9bb3cc1e610ebebe007ff6187b27bde4aef2e39ded98fc8356c`, 987409 byte.
- File trong ZIP v1: SHA-256 `45fde6109f8f1227f303848cb8fc620a093fc23e6eea85ff8e574b2a1d327cf6`, 987424 byte.
- Đã xác minh offline: chỉ thay các chuỗi khớp email bằng `[REDACTED_EMAIL]` trên file gốc là tạo ra chính xác toàn bộ byte của bản ZIP. Có 12 marker email. Không phải bằng chứng hai bản deploy khác nhau.
- Câu “bundle cùng hash” trong READ-FIRST v1 thiếu điều kiện, dễ gây hiểu nhầm. Nó chỉ đúng cho hai lần tải **bản gốc** 18/10 và 19/10 trước làm sạch. Bản ZIP là bản biến đổi, không thể so trực tiếp hash với bản gốc.
- ZIP v2 có `BUNDLE-PROVENANCE.json` ghi originalSha256, packagedSha256, số byte và phép biến đổi; MANIFEST.json mô tả file thực được đóng gói. Verification JSON cũ giữ hash gốc và được giải thích rõ. Không đưa credentials trở lại ZIP để giữ hash.

## Thứ tự tiếp theo

1. Xác nhận build commit/artifact frontend/backend đang được staging phục vụ; so với 321ce42 và thay đổi liên quan. Không mở issue sửa lại code đã có trước khi kiểm tra issue/deploy hiện hữu.
2. Xử lý contract Writing text và luồng lưu PDF/audio: upload lỗi phải chặn nộp hoặc báo lỗi rõ, xác nhận dữ liệu READY trước khi coi nộp hoàn tất.
3. Sửa wait/prerequisite của test, đặc biệt Overview loading và các case filter không cần phụ thuộc grading fixture.
4. Retest nhóm sai khác deploy, MCQ options, bảng điểm và feedback bằng fixture sạch; giữ response đúng endpoint, phân biệt bước chưa tới với assertion thất bại.

Chưa chạy lại Selenium, chưa thay đổi staging hoặc logic ứng dụng trong bước tiếp nhận feedback này.
