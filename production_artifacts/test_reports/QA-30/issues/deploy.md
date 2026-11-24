# [FE][Student Overview] Hiển thị giới hạn 3 lượt thay vì maxSubmissions từ API

Issue: https://github.com/hotung9108/EnglishHub/issues/173

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: Medium.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-007, QA30-045.

## Tiền điều kiện

1. Student QA #698 thuộc lớp QA #150; bài Writing #1554 có maxSubmissions=10, chưa có lượt nộp.
2. Biến thể hết lượt: bài #1561 có maxSubmissions=1 và đã có đúng một submission #1506.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA, mở Danh sách bài tập và chọn lớp QA #150.
2. Tìm bài QA30-WRITING-writing-2026-10-19T11-31-24-269Z, bấm Tổng quan.
3. Chờ dữ liệu tải xong, đọc phần số lượt nộp và đối chiếu GET /assignments/1554.
4. Với biến thể hết lượt, mở Tổng quan bài QA30-READING-graded-2026-10-19T11-31-40-237Z; chờ lịch sử các lần làm bài hết “Đang tải”.
5. Đối chiếu số lượt đã làm/giới hạn và trạng thái nút Bắt đầu lần tiếp theo; không bấm tạo thêm lượt.

## Kỳ vọng

Hiển thị đúng 0/10 với bài #1554. Với bài #1561 đã dùng 1/1 lượt, không đề nghị bắt đầu lượt 2.

## Thực tế

Bài #1554 hiện “0 / 3 lần (Còn 3 lượt)”. Bài #1561 hiện “1 / 3 lần (Còn 2 lượt)” và nút “Bắt đầu làm bài (Lần 2)” vẫn bật sau khi lịch sử tải xong.

## Bằng chứng

- QA30-007: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-007.json`; ảnh `QA30-007.png`, DOM `QA30-007.html` trong cùng thư mục run.
- QA30-045: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-045.json`; ảnh `QA30-045.png`, DOM `QA30-045.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-007",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/1554/overview",
    "reason": "Overview attempt limit differs from API: UI=3, API=10; display=\"0 / 3 lần (Còn 3 lượt)\"\n\n3 !== 10\n",
    "readback": {
      "assignmentId": 1554,
      "uiAttemptRule": "0 / 3 lần (Còn 3 lượt)",
      "apiMaxSubmissions": 10,
      "apiAttemptCount": 0,
      "startLabel": "Bắt đầu làm bài (Lần 1)"
    }
  },
  {
    "id": "QA30-045",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/1561/overview",
    "reason": "Exhausted Overview contract failed after history loaded; see readback.failedChecks and actions\n+ actual - expected\n\n+ [\n+   'Overview attempt limit differs from API: UI=3, API=1; display=\"1 / 3 lần (Còn 2 lượt)\"\\n' +\n+     '\\n' +\n+     '3 !== 1\\n',\n+   'Exhausted assignment offers an enabled start/resume action'\n+ ]\n- []\n",
    "readback": {
      "uiAttemptRule": "1 / 3 lần (Còn 2 lượt)",
      "maxSubmissions": 1,
      "historyFinishedLoading": true,
      "historyText": "Lịch sử các lần làm bài (Attempts History)\nĐã làm 1 lần\nLần nộp Thời gian nộp Điểm số (Thang 10) Trạng thái Thao tác\nLần 1Điểm cao nhất 18:32:00 19/10/2026 7.5 / 10\nChờ chấm điểm\nXem kết quả bài nộp",
      "attempts": [
        {
          "id": 1506,
          "status": "SUBMITTED"
        }
      ],
      "actions": [
        {
          "label": "Bắt đầu làm bài (Lần 2)",
          "visible": true,
          "enabled": true
        }
      ],
      "failedChecks": [
        "Overview attempt limit differs from API: UI=3, API=1; display=\"1 / 3 lần (Còn 2 lượt)\"\n\n3 !== 1\n",
        "Exhausted assignment offers an enabled start/resume action"
      ]
    }
  }
]
```

</details>

## Giới hạn và hướng xử lý

Chỉ xác nhận lỗi giới hạn/CTA UI. Chưa bấm vượt lượt, chưa xác nhận backend cho nộp quá giới hạn. Không còn bao gồm SHORT_ANSWER hoặc Speaking chưa ghi âm. Source tham chiếu 321ce42/develop 3ced11c có thay đổi liên quan. Bundle staging khảo sát là index-BBK5DcPN.js, SHA-256 360e7a7e5c37c9bb3cc1e610ebebe007ff6187b27bde4aef2e39ded98fc8356c. Đây là thông tin hỗ trợ đối chiếu artifact, không khẳng định SHA source đang deploy hoặc dùng “deploy cũ” để gộp nhiều lỗi.

## Tiêu chí hoàn tất và retest

Đối chiếu maxSubmissions=1 và 10 ở bài chưa có lượt/còn lượt/hết lượt; lịch sử tải xong; giới hạn và CTA khớp API.

## Các lỗi đã tách khỏi issue này

- [[FE][Student Quiz] Câu SHORT_ANSWER hiển thị lựa chọn A/B/C/D thay vì ô nhập](https://github.com/hotung9108/EnglishHub/issues/182)
- [[FE][Student Speaking] Nút nộp bật khi chưa có bản ghi âm](https://github.com/hotung9108/EnglishHub/issues/183)
