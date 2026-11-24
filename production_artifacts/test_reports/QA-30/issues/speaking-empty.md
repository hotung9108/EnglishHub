# [FE][Student Speaking] Nút nộp bật khi chưa có bản ghi âm

Issue: https://github.com/hotung9108/EnglishHub/issues/183

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: Medium.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-039.
Tách phạm vi từ #173; không coi là phát hiện mới hoặc root cause mới.

## Tiền điều kiện

1. Student QA #698 thuộc lớp #150. Bài Speaking #1565, module #2076, taskType=RECORDING; bắt đầu một lượt mới chưa ghi âm.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA, chọn lớp #150 và bài QA30-SPEAKING-speakingValidation-2026-10-19T11-31-51-763Z.
2. Mở Tổng quan → Bắt đầu làm bài.
3. Không bấm bắt đầu ghi âm và không tải file audio.
4. Quan sát nút Nộp bài và thuộc tính disabled/enabled của nút.

## Kỳ vọng

Nút nộp bị khóa khi chưa có bản ghi âm hợp lệ, hoặc có kiểm tra chặn tương đương được đặc tả rõ.

## Thực tế

Nút nộp hiển thị và enabled dù chưa ghi âm. Run riêng qa30-2026-10-19T11-09-30-935Z cũng ghi nhận tương tự.

## Bằng chứng

- QA30-039: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-039.json`; ảnh `QA30-039.png`, DOM `QA30-039.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-039",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/speaking/1565?submissionId=1517",
    "reason": "Expected values to be strictly equal:\n\ntrue !== false\n"
  }
]
```

</details>

## Giới hạn và hướng xử lý

Không bấm nộp rỗng, không khẳng định server nhận bài rỗng. Đây khác lỗi mất audio sau khi đã ghi/nộp ở #176. Source tham chiếu 321ce42/develop 3ced11c có thay đổi liên quan. Bundle staging khảo sát là index-BBK5DcPN.js, SHA-256 360e7a7e5c37c9bb3cc1e610ebebe007ff6187b27bde4aef2e39ded98fc8356c. Đây là thông tin hỗ trợ đối chiếu artifact, không khẳng định SHA source đang deploy hoặc dùng “deploy cũ” để gộp nhiều lỗi.

## Tiêu chí hoàn tất và retest

Chưa ghi: nút khóa; sau khi ghi/dừng có audio hợp lệ: nút hoạt động; xóa bản ghi: nút khóa lại.
