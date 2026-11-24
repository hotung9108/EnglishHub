# [FE][Student Writing] Vẫn hoàn tất bài nộp sau khi submit-module trả HTTP 400

Issue: https://github.com/hotung9108/EnglishHub/issues/184

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: High.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-038.
Tách phạm vi từ #175; không coi là phát hiện mới hoặc root cause mới.

## Tiền điều kiện

1. Diagnostic riêng qa30-diagnostic-txt-2026-10-19T11-10-57-470Z; lớp #148, bài #1552/module #2063, Writing ESSAY.
2. Student QA đã ghi danh. File tổng hợp qa30-invalid-upload.txt; editor để trống để cô lập luồng xử lý file. QA30-038 tự động chỉ kiểm tra chọn file, không tự bấm nộp; bằng chứng HTTP 400→200 ở diagnostic bổ sung.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA, mở bài Writing #1552 từ lớp #148 và bắt đầu lượt mới (hoặc fixture tương đương nếu đã hết lượt).
2. Để editor trống, chọn file TXT tổng hợp; ghi lại tên file đang được UI giữ.
3. Mở Network/Preserve log và bấm Nộp bài một lần.
4. Quan sát lần lượt response submit-module và request final-submit của submission cha.
5. Đọc lại đúng submission vừa tạo, kiểm tra trạng thái và answers.

## Kỳ vọng

Nếu submit-module lỗi, frontend dừng luồng, báo lỗi và không hoàn tất submission cha như một bài hợp lệ.

## Thực tế

POST /submission-modules/2676/submit trả 400, nhưng tiếp đó POST /submissions/1504/submit trả 200; chuyển /student/submissions/1504. Readback SUBMITTED, module SUBMITTED, answers=[].

## Bằng chứng

- QA30-038: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-038.json`; ảnh `QA30-038.png`, DOM `QA30-038.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.
- Diagnostic gốc: `test/selenium/reports/qa30-diagnostic-txt-2026-10-19T11-10-57-470Z/observations.json`, ảnh before/after và DOM.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-038",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/1558",
    "reason": "Writing displays the invalid TXT as the selected upload; submission was not attempted\n\ntrue !== false\n",
    "readback": {
      "submissionId": 1507,
      "status": "IN_PROGRESS",
      "selectedFilenames": [],
      "invalidFilenameInVisibleText": true,
      "uiText": "Trang chủ\nDanh sách bài tập\nQA30-WRITING-draft-2026-10-19T11-31-33-933Z\nQA30 WRITING: daily practice. Synthetic fixture, no student work.\nTài liệu đính kèm & Đề bài mẫu\nwriting-instructions.docx\nHướng dẫn làm bài và tiêu chí đánh giá Writing\nTải xuống\nĐếm từ: 0 / 150-250 từ\nNội dung soạn thảo sẽ được bảo lưu khi bấm \"Lưu bản nháp\".\nXóa bài viết & Làm lại từ đầu\nqa30-invalid-upload.txt\n0.00 MB\nNộp bài (Submit Assignment)\nLưu bản nháp (Save Draft)\nBài làm sẽ được phân tích tự động qua Writing AI Grading Pipeline và gửi đến giảng viên chấm chi tiết.\nThông tin chấm điểm\nThang điểm:\n100 điểm (Quy đổi Band 9.0)\nLượt thi hiện tại:\nLần 1",
      "submittedByThisCase": false
    }
  }
]
```

</details>

Diagnostic bổ sung (không phải lượt submit của QA30-038 tự động):

```json
{
  "fixture": {
    "classId": 148,
    "assignmentId": 1552,
    "moduleId": 2063
  },
  "submissionId": 1504,
  "readback": {
    "submissionId": 1504,
    "status": "SUBMITTED",
    "moduleStatus": "SUBMITTED",
    "answers": []
  },
  "actualUrl": "https://staging.hotung9108.me/student/submissions/1504",
  "requests": [
    {
      "source": "browser",
      "method": "POST",
      "endpoint": "/api/v1/submission-modules/2676/submit",
      "at": "2026-10-19T11:11:19.875Z",
      "status": 400,
      "mimeType": "application/json"
    },
    {
      "source": "browser",
      "method": "POST",
      "endpoint": "/api/v1/submissions/1504/submit",
      "at": "2026-10-19T11:11:20.112Z",
      "status": 200,
      "mimeType": "application/json"
    }
  ]
}
```

## Giới hạn và hướng xử lý

Không có response body lỗi 400 nên không quy nguyên nhân 400 cho đuôi TXT. Không khẳng định backend chấp nhận/lưu TXT. Đây là lỗi xử lý thất bại của bước trước, không phải lỗi PDF của #175.

## Tiêu chí hoàn tất và retest

Tái tạo lỗi module/upload có kiểm soát trên dữ liệu QA: phải dừng parent submit, không chuyển thành kết quả thành công, giữ dữ liệu cho phép sửa và thử lại.
