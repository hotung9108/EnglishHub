# [FE][Student Quiz] Câu SHORT_ANSWER hiển thị lựa chọn A/B/C/D thay vì ô nhập

Issue: https://github.com/hotung9108/EnglishHub/issues/182

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: High.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-013, QA30-014, QA30-015.
Tách phạm vi từ #173; không coi là phát hiện mới hoặc root cause mới.

## Tiền điều kiện

1. Student QA #698 thuộc lớp #150. Reading #1555/module #2066/question #1737 là SHORT_ANSWER; bài Reading biến thể #1560/question #1739 và Listening #1556/question #1738 cùng loại.
2. Nội dung câu hỏi: “QA30: type the phrase daily practice.” Đáp án chuẩn: daily practice. Fixture và response role Teacher/Student xác nhận questionType=SHORT_ANSWER.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA, vào Danh sách bài tập, chọn lớp #150.
2. Tìm QA30-READING-reading-2026-10-19T11-31-26-025Z; mở Tổng quan rồi Bắt đầu làm bài.
3. Quan sát vùng trả lời câu hỏi, thử tìm ô nhập câu trả lời ngắn.
4. Đối chiếu questionType qua GET /modules/2066/questions bằng role Student; có thể dùng Teacher để xác minh fixture, không đưa đáp án Teacher vào UI Student.
5. Lặp lại với Listening #1556 để kiểm tra cùng lỗi renderer ở kỹ năng khác.

## Kỳ vọng

SHORT_ANSWER phải có ô nhập văn bản; không render thành câu trắc nghiệm.

## Thực tế

UI hiển thị các lựa chọn mẫu A/B/C/D, không có ô nhập câu trả lời ngắn. Các case dừng tại bước này, chưa nộp/chấm điểm.

## Bằng chứng

- QA30-013: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-013.json`; ảnh `QA30-013.png`, DOM `QA30-013.html` trong cùng thư mục run.
- QA30-014: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-014.json`; ảnh `QA30-014.png`, DOM `QA30-014.html` trong cùng thư mục run.
- QA30-015: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-015.json`; ảnh `QA30-015.png`, DOM `QA30-015.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-013",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/reading/1555?submissionId=1510",
    "reason": "READING SHORT_ANSWER question must render a text input; UI displays choices instead"
  },
  {
    "id": "QA30-014",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/reading/1560?submissionId=1511",
    "reason": "READING SHORT_ANSWER question must render a text input; UI displays choices instead"
  },
  {
    "id": "QA30-015",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/listening/1556?submissionId=1512",
    "reason": "LISTENING SHORT_ANSWER question must render a text input; UI displays choices instead"
  }
]
```

</details>

## Giới hạn và hướng xử lý

Đây là lỗi render loại câu hỏi, không phải lỗi chấm đáp án đúng/sai. Tách từ #173 theo một lỗi/issue. Source tham chiếu 321ce42/develop 3ced11c có thay đổi liên quan. Bundle staging khảo sát là index-BBK5DcPN.js, SHA-256 360e7a7e5c37c9bb3cc1e610ebebe007ff6187b27bde4aef2e39ded98fc8356c. Đây là thông tin hỗ trợ đối chiếu artifact, không khẳng định SHA source đang deploy hoặc dùng “deploy cũ” để gộp nhiều lỗi.

## Tiêu chí hoàn tất và retest

Reading và Listening SHORT_ANSWER có ô nhập, giữ câu trả lời và cho đi tiếp; case nộp/chấm điểm chạy lại riêng sau khi renderer sửa.
