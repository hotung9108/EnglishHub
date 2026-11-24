# [FE][Student Assignments] Bài đã có điểm chính thức không xuất hiện ở tab Đã có kết quả

Issue: https://github.com/hotung9108/EnglishHub/issues/186

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: Medium.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-030.
Tách phạm vi từ #179; không coi là phát hiện mới hoặc root cause mới.

## Tiền điều kiện

1. Student QA #698 đã ghi danh lớp #150, tên lớp QA30-Student-2026-10-19T11-31-23-337Z. Bài Reading #1561 (QA30-READING-graded-2026-10-19T11-31-40-237Z), submission #1506, submission-module #2678, grading #1810. Teacher phụ trách #4 đã lưu chính thức 7.5/10 và nhận xét: QA30 official feedback 2026-10-19T11-31-23-337Z: clear response; practise examples.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA; mở Danh sách bài tập, chọn lớp #150.
2. Ở Tất cả, xác nhận có bài QA30-READING-graded-2026-10-19T11-31-40-237Z.
3. Chọn tab Đã có kết quả; chờ bộ lọc ổn định và tìm lại đúng bài đó.
4. Đối chiếu grading #1810 COMPLETED và finalScore=7.5; không chỉ dựa parent SUBMITTED.
5. Có thể chuyển Chưa bắt đầu để đối chứng loại trừ; ghi kết quả riêng, không suy ra lỗi ở tab này nếu chỉ tab kết quả thiếu.

## Kỳ vọng

Bài đã có điểm chính thức xuất hiện trong Đã có kết quả; không thuộc Chưa bắt đầu.

## Thực tế

QA30-030 đã tới bước lọc và ghi lỗi “Officially graded assignment is missing from Results tab”. Nhánh loại khỏi Chưa bắt đầu cũng được kiểm tra; lỗi xác nhận ở issue này chỉ là thiếu khỏi Đã có kết quả.

## Bằng chứng

- QA30-030: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-030.json`; ảnh `QA30-030.png`, DOM `QA30-030.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-030",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments",
    "reason": "Officially graded assignment is missing from Results tab; Not-started exclusion was also checked\n\nfalse !== true\n",
    "assertionScope": "Missing from Results tab; do not infer it appeared in Not-started"
  }
]
```

</details>

## Giới hạn và hướng xử lý

Không khẳng định bài nằm trong Chưa bắt đầu. Tách khỏi #179 vì đây là hành vi bộ lọc danh sách bài, không phải danh sách thẻ Feedback.

## Tiêu chí hoàn tất và retest

Bài với grading hoàn tất hiện ở tab kết quả, loại khỏi tab chưa bắt đầu; retest cả bài đang làm và bài chưa có lượt để tránh hồi quy.
