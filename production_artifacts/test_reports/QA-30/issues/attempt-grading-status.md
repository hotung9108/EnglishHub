# [FE][Student Overview] Lịch sử hiện Chờ chấm điểm dù cùng lượt đã có điểm chính thức 7.5/10

Issue: https://github.com/hotung9108/EnglishHub/issues/185

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: Medium.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-024.
Tách phạm vi từ #179; không coi là phát hiện mới hoặc root cause mới.

## Tiền điều kiện

1. Student QA #698 đã ghi danh lớp #150, tên lớp QA30-Student-2026-10-19T11-31-23-337Z. Bài Reading #1561 (QA30-READING-graded-2026-10-19T11-31-40-237Z), submission #1506, submission-module #2678, grading #1810. Teacher phụ trách #4 đã lưu chính thức 7.5/10 và nhận xét: QA30 official feedback 2026-10-19T11-31-23-337Z: clear response; practise examples.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA và mở Tổng quan bài QA30-READING-graded-2026-10-19T11-31-40-237Z trong lớp #150.
2. Cuộn đến Lịch sử các lần làm bài và chờ hết trạng thái Đang tải.
3. Quan sát hàng Lần 1 của submission #1506, gồm điểm và nhãn trạng thái.
4. Đối chiếu grading #1810 COMPLETED, finalScore=7.5, maxScoreSnapshot=10; module #2678 GRADED.

## Kỳ vọng

Nhãn trạng thái phản ánh đã có điểm chính thức; nhất quán với 7.5/10 trên chính hàng đó.

## Thực tế

Cùng hàng hiển thị “7.5 / 10” nhưng bên dưới vẫn “Chờ chấm điểm”. Parent SUBMITTED không tự nó chứng minh bài chưa được chấm khi grading đã COMPLETED.

## Bằng chứng

- QA30-024: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-024.json`; ảnh `QA30-024.png`, DOM `QA30-024.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-024",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/1561/overview",
    "reason": "The input did not match the regular expression /Đã có điểm|Đã chấm|Graded/. Input:\n\n'Lần 1Điểm cao nhất 18:32:00 19/10/2026 7.5 / 10\\n' +\n  'Chờ chấm điểm\\n' +\n  'Xem kết quả bài nộp'\n",
    "readback": {
      "attempts": [
        {
          "id": 1506,
          "status": "SUBMITTED",
          "attemptNumber": 1
        }
      ],
      "uiRows": [
        "Lần 1Điểm cao nhất 18:32:00 19/10/2026 7.5 / 10\nChờ chấm điểm\nXem kết quả bài nộp"
      ]
    }
  }
]
```

</details>

## Giới hạn và hướng xử lý

Chỉ là trạng thái lịch sử tại Overview, không gộp thiếu thẻ Feedback hoặc filter danh sách bài. Không yêu cầu tự đổi parent status nếu contract không quy định.

## Tiêu chí hoàn tất và retest

Kiểm tra lượt chưa chấm và lượt chấm xong: nhãn phù hợp grading/module, điểm 0 và 7.5 đều không bị coi là chưa chấm.
