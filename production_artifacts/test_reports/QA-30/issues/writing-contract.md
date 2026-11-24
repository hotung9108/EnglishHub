# [FE][Student Writing] Nộp bài chỉ có văn bản xong nhưng nội dung bài luận bị mất

Issue: https://github.com/hotung9108/EnglishHub/issues/174

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Contract gap FE–BE cần thống nhất. Ưu tiên đề xuất: High.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-011.

## Tiền điều kiện

1. Student QA #698 thuộc lớp #150. Bài Writing #1554, module #2065, skill=WRITING, taskType=ESSAY, còn lượt và đang mở.
2. Chuẩn bị một đoạn luận QA riêng trong ô soạn thảo; không chọn file. Bài fixture không chứa dữ liệu người học thật.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA, mở Danh sách bài tập → lớp #150 → bài QA30-WRITING-writing-2026-10-19T11-31-24-269Z.
2. Mở Tổng quan → Bắt đầu làm bài, nhập bài luận vào ô soạn thảo; không đính kèm file.
3. Bấm Nộp bài và chờ UI chuyển trang kết quả.
4. Đọc đúng submission ID vừa tạo qua GET /submissions/{id} và answers của submission-module; so với đoạn vừa nhập.

## Kỳ vọng

Nếu UI hỗ trợ nộp văn bản, phải giữ nguyên bài luận. Nếu ESSAY bắt buộc file, UI phải chặn nộp text-only và yêu cầu file rõ ràng; không hoàn tất một bài mất nội dung.

## Thực tế

Run tạo submission #1508, module nộp #2680, cả hai SUBMITTED. Answer #978 có content=null, docStorageKey=null, docUploadStatus=UPLOADING; UI đã chuyển kết quả.

## Bằng chứng

- QA30-011: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-011.json`; ảnh `QA30-011.png`, DOM `QA30-011.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-011",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/submissions/1508",
    "reason": "Writing UI offers text-only submission, but WRITING/ESSAY API stores files and did not retain the essay. Review the FE/BE contract; UI success alone is not a pass.",
    "readback": {
      "submissionId": 1508,
      "submissionStatus": "SUBMITTED",
      "moduleId": 2680,
      "moduleStatus": "SUBMITTED",
      "answers": [
        {
          "id": 978,
          "questionId": null,
          "content": null,
          "docStorageKey": null,
          "docMimeType": null,
          "docUploadStatus": "UPLOADING",
          "audioStorageKey": null,
          "audioMimeType": null,
          "audioUploadStatus": null
        }
      ],
      "grading": {
        "id": 1812,
        "method": "TEACHER_MANUAL",
        "status": "PENDING",
        "finalScore": null,
        "maxScoreSnapshot": 10,
        "aiFeedback": null,
        "finalFeedback": null
      }
    }
  }
]
```

</details>

## Giới hạn và hướng xử lý

CONTRACT_GAP_REVIEW: ESSAY backend hiện lưu file còn UI cho nhập/nộp text. Không khẳng định riêng DB/BE sai hoặc đã xác định nguyên nhân upload. Chỉ xử lý text-only; PDF là #175.

## Tiêu chí hoàn tất và retest

Thống nhất text/file contract, rồi nộp lại bằng UI; văn bản không mất hoặc bị chặn hợp lệ trước khi hoàn tất.
