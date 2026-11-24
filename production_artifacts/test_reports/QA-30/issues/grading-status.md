# [FE][Student Feedback] Không có thẻ nhận xét chính thức dù grading đã COMPLETED

Issue: https://github.com/hotung9108/EnglishHub/issues/179

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: High.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-022.
Case bị chặn bởi lỗi này, chưa thực hiện action: QA30-034.

## Tiền điều kiện

1. Student QA #698 đã ghi danh lớp #150, tên lớp QA30-Student-2026-10-19T11-31-23-337Z. Bài Reading #1561 (QA30-READING-graded-2026-10-19T11-31-40-237Z), submission #1506, submission-module #2678, grading #1810. Teacher phụ trách #4 đã lưu chính thức 7.5/10 và nhận xét: QA30 official feedback 2026-10-19T11-31-23-337Z: clear response; practise examples.
2. Đối chứng retest riêng: assignment #1548/submission #1500/grading #1804; parent SUBMITTED, module GRADED, grading COMPLETED và finalFeedback khớp fixture.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Teacher chấm và Lưu & Gửi điểm/nhận xét chính thức cho bài Student QA đã nộp; xác minh finalFeedback thật sự tồn tại qua GET /gradings/{id}.
2. Đăng nhập Student QA; mở kết quả đúng submission qua lịch sử để kiểm tra nhận xét đọc được ở trang kết quả.
3. Vào Nhận xét/Feedback qua sidebar; chờ tải xong, để bộ lọc phù hợp và tìm nguyên văn đoạn nhận xét hoặc mã run.
4. So sánh danh sách thẻ với finalFeedback và grading COMPLETED của cùng bài.

## Kỳ vọng

Thẻ nhận xét chính thức của đúng bài xuất hiện trong Feedback khi grading hoàn tất, không phụ thuộc riêng parent status GRADED.

## Thực tế

Full run không có thẻ cho grading #1810. Đối chứng #1804 có finalFeedback, module GRADED nhưng parent SUBMITTED; UI Feedback không có thẻ. Bundle lọc sub.status===GRADED nên loại bài.

## Bằng chứng

- QA30-022: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-022.json`; ảnh `QA30-022.png`, DOM `QA30-022.html` trong cùng thư mục run.
- QA30-034: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-034.json`; ảnh `QA30-034.png`, DOM `QA30-034.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-022",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/feedback",
    "reason": "Expected exactly one official feedback from grading 1810; found 0 cards\n\n0 !== 1\n"
  }
]
```

</details>

## Giới hạn và hướng xử lý

Chỉ báo lỗi thiếu thẻ Feedback. Lịch sử lượt làm hiển thị “Chờ chấm” và tab Đã có kết quả được tách riêng. QA30-034 Blocked trước click do thiếu thẻ; chưa có bằng chứng link của thẻ chính thức sai. QA30-033 filter đã Pass độc lập. Khác #151 của QA29 là Teacher editor không hiển thị lại nhận xét.

## Tiêu chí hoàn tất và retest

Sau grading COMPLETED, Student thấy đúng một thẻ chứa nguyên văn nhận xét; sau đó retest QA30-034 khi thẻ tồn tại.

## Các lỗi đã tách khỏi issue này

- [[FE][Student Overview] Lịch sử hiện Chờ chấm điểm dù cùng lượt đã có điểm chính thức 7.5/10](https://github.com/hotung9108/EnglishHub/issues/185)
- [[FE][Student Assignments] Bài đã có điểm chính thức không xuất hiện ở tab Đã có kết quả](https://github.com/hotung9108/EnglishHub/issues/186)
