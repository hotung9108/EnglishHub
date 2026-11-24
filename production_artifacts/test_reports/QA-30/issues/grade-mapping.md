# [FE/API][Student Grades] Bảng điểm không hiển thị đúng bài đã chấm do nhầm submissionId với assignmentId

Issue: https://github.com/hotung9108/EnglishHub/issues/178

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: High.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-028.
Case bị chặn bởi lỗi này, chưa thực hiện action: QA30-017, QA30-018.

## Tiền điều kiện

1. Student QA #698 đã ghi danh lớp #150, tên lớp QA30-Student-2026-10-19T11-31-23-337Z. Bài Reading #1561 (QA30-READING-graded-2026-10-19T11-31-40-237Z), submission #1506, submission-module #2678, grading #1810. Teacher phụ trách #4 đã lưu chính thức 7.5/10 và nhận xét: QA30 official feedback 2026-10-19T11-31-23-337Z: clear response; practise examples.
2. Đối chứng API riêng qa30-2026-10-19T11-08-22-390Z: submission #1499 thuộc assignment #1547; module #2671. Bản ghi có ngay trang API đầu, không thiếu vì UI đang ở trang khác.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Dùng Teacher lưu chính thức điểm/nhận xét của bài QA Reading; xác minh grading COMPLETED và biết chính xác assignmentId/submissionId.
2. Đăng nhập Student sở hữu bài; vào Bảng điểm qua sidebar, xóa các bộ lọc.
3. Tìm tiêu đề bài QA đã chấm; kiểm tra tên bài, kỹ năng và lớp của dòng tương ứng, kể cả phân trang UI nếu có.
4. Với fixture đối chứng, gọi GET /submissions (mặc định page=1, limit=20) và kiểm tra item #1499; gọi GET /submissions/1499 để đối chiếu assignmentId.
5. Đối chiếu ID frontend dùng để lookup assignment; không dùng submissionId thay thế assignmentId.

## Kỳ vọng

Dòng bảng điểm mang đúng tên/kỹ năng/lớp của assignment thật #1547 (đối chứng) hoặc #1561 (full run); link hành động theo đúng bài nộp.

## Thực tế

API list đối chứng có submission #1499 nhưng không có assignmentId; detail có assignmentId=1547. Source/bundle dùng sub.assignmentId || sub.id, nên lookup assignment 1499 thay vì 1547. Full run QA30-028 không xác định được dòng bài #1561 của submission #1506.

## Bằng chứng

- QA30-028: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-028.json`; ảnh `QA30-028.png`, DOM `QA30-028.html` trong cùng thư mục run.
- QA30-017: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-017.json`; ảnh `QA30-017.png`, DOM `QA30-017.html` trong cùng thư mục run.
- QA30-018: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-018.json`; ảnh `QA30-018.png`, DOM `QA30-018.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-028",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/grades",
    "reason": "Cannot exercise this grade-row action: submission #1506 exists for assignment #1561, but UI cannot identify its row. See QA30-028 (grade metadata/mapping)."
  }
]
```

</details>

## Giới hạn và hướng xử lý

QA30-017/018 Blocked trước action/score do thiếu dòng, không phải hai bug đã kiểm tra riêng. QA30-019/031/032 kiểm tra filter/search độc lập và đã Pass: không liệt kê chúng là testcase thất bại của lỗi mapping. Không khẳng định mọi missing-row đều cùng nguyên nhân.

## Tiêu chí hoàn tất và retest

API cung cấp liên kết assignment hoặc FE map detail đúng, không fallback sai ID; bảng điểm đúng metadata và chạy tiếp được 017/018.
