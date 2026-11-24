# [FE][Student Feedback] Nút xem đánh giá định kỳ mở kết quả bài không liên quan

Issue: https://github.com/hotung9108/EnglishHub/issues/180

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: Medium.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-021.

## Tiền điều kiện

1. Student QA #698 thuộc lớp #150. Teacher #4 đã tạo evaluation #52 cho lớp này.
2. Nội dung để tìm: QA30 periodic evaluation 2026-10-19T11-31-23-337Z: steady progress in all four skills.
3. Đây là evaluation định kỳ cấp lớp, không phải nhận xét chấm một submission.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA, mở Feedback/Nhận xét qua sidebar.
2. Tìm đoạn “QA30 periodic evaluation 2026-10-19T11-31-23-337Z”, chọn bộ lọc Từ Giảng viên.
3. Xác nhận đúng thẻ evaluation của lớp #150, đọc nội dung/lớp.
4. Bấm action “Xem bài làm & Lời giải chi tiết” trên đúng thẻ và ghi URL đích.

## Kỳ vọng

Action mở ngữ cảnh đánh giá/lớp #150 tương ứng, hoặc không có action bài nộp nếu evaluation không gắn submission. Không điều hướng tới assignment cố định không liên quan.

## Thực tế

Action chuyển đến /student/assignments/1/result thay vì ngữ cảnh lớp #150. QA30-020 đọc nội dung/lớp thành công; QA30-021 phát hiện link sai.

## Bằng chứng

- QA30-021: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-021.json`; ảnh `QA30-021.png`, DOM `QA30-021.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-021",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/1/result",
    "reason": "Evaluation action must open its class, not an unrelated submission\n+ actual - expected\n\n+ '/student/assignments/1/result'\n- '/student/classes/150'\n            ^\n"
  }
]
```

</details>

## Giới hạn và hướng xử lý

Mặc định test đề nghị /student/classes/150; đường dẫn cụ thể có thể theo thiết kế nhưng phải giữ đúng ngữ cảnh. Không coi evaluation là submission. Source mới đã phân biệt hai loại, cần xác nhận artifact deploy.

## Tiêu chí hoàn tất và retest

Hai evaluation ở hai lớp khác nhau mở đúng ngữ cảnh riêng; feedback từ grading vẫn mở đúng bài nộp.
