# [FE][Student Writing] Nộp PDF xong nhưng bài nộp không có tài liệu được lưu

Issue: https://github.com/hotung9108/EnglishHub/issues/175

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: High.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-012.

## Tiền điều kiện

1. Student QA #698 thuộc lớp #150. Bài Writing #1559, module #2070, taskType=ESSAY.
2. File PDF QA hợp lệ có sẵn tại test/selenium/fixtures/qa29-writing-sample.pdf.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA, mở Danh sách bài tập → lớp #150 → bài QA30-WRITING-document-2026-10-19T11-31-35-897Z.
2. Bắt đầu một lượt mới, nhập đoạn luận QA và chọn PDF mẫu; kiểm tra tên file xuất hiện.
3. Bật Network rồi bấm Nộp bài một lần, chờ UI chuyển trang kết quả.
4. Đọc submission mới và answers bằng API; kiểm tra storage key và upload status của PDF.

## Kỳ vọng

File PDF được upload/lưu, answer có tài liệu hợp lệ và trạng thái READY trước khi coi nộp hoàn tất. Nếu upload lỗi, UI báo lỗi và không hoàn tất bài mất file.

## Thực tế

Submission #1509 và module #2681 đều SUBMITTED, nhưng answer #979 có docStorageKey=null, docMimeType=null, docUploadStatus=UPLOADING. Network không ghi nhận request upload tài liệu trong lượt này.

## Bằng chứng

- QA30-012: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-012.json`; ảnh `QA30-012.png`, DOM `QA30-012.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-012",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/submissions/1509",
    "reason": "No READY document stored after Writing UI upload",
    "readback": {
      "submissionId": 1509,
      "submissionStatus": "SUBMITTED",
      "moduleId": 2681,
      "moduleStatus": "SUBMITTED",
      "answers": [
        {
          "id": 979,
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
        "id": 1813,
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

Chỉ xác nhận mất PDF sau nộp UI. Lỗi frontend tiếp tục parent submit sau module HTTP 400 được tách riêng, không dùng TXT để khẳng định backend đã lưu file không hợp lệ.

## Tiêu chí hoàn tất và retest

Nộp PDF thật qua UI, mở lại đúng lượt: tài liệu tải/đọc được và API READY; lỗi upload phải được thể hiện đúng.

## Các lỗi đã tách khỏi issue này

- [[FE][Student Writing] Vẫn hoàn tất bài nộp sau khi submit-module trả HTTP 400](https://github.com/hotung9108/EnglishHub/issues/184)
