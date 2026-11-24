# [FE][Student Speaking] Đã ghi và nộp bài nhưng bài nộp không có audio được lưu

Issue: https://github.com/hotung9108/EnglishHub/issues/176

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: High.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-016.

## Tiền điều kiện

1. Student QA #698 thuộc lớp #150. Speaking #1557/module #2068, RECORDING, còn lượt và cho phép micro.
2. Run Selenium dùng Chromium fake media tạo tín hiệu âm thanh tổng hợp; không đánh giá mic vật lý hoặc chất lượng phát âm.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Đăng nhập Student QA, mở bài QA30-SPEAKING-speaking-2026-10-19T11-31-31-994Z từ lớp #150 và bắt đầu làm bài.
2. Cho phép micro, bấm bắt đầu ghi; chờ timer chạy ít nhất 3 giây.
3. Dừng ghi, xác nhận UI có bản ghi/timer, rồi bấm Nộp bài.
4. Sau khi UI chuyển kết quả, đọc đúng submission/module/answers qua API; kiểm tra audioStorageKey và upload status.

## Kỳ vọng

Audio được upload và READY trước khi nộp hoàn tất; nếu lỗi upload thì báo lỗi và không hoàn tất bài không có audio.

## Thực tế

Submission #1513/module #2685 đều SUBMITTED. Answer #980 có audioStorageKey=null, audioMimeType=null, audioUploadStatus=UPLOADING. Không ghi nhận request upload audio trong metadata lượt này.

## Bằng chứng

- QA30-016: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-016.json`; ảnh `QA30-016.png`, DOM `QA30-016.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-016",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/submissions/1513",
    "reason": "No READY audio recording stored after Speaking UI submission",
    "readback": {
      "submissionId": 1513,
      "submissionStatus": "SUBMITTED",
      "moduleId": 2685,
      "moduleStatus": "SUBMITTED",
      "answers": [
        {
          "id": 980,
          "questionId": null,
          "content": null,
          "docStorageKey": null,
          "docMimeType": null,
          "docUploadStatus": null,
          "audioStorageKey": null,
          "audioMimeType": null,
          "audioUploadStatus": "UPLOADING"
        }
      ],
      "grading": {
        "id": 1817,
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

Đã có thao tác ghi/dừng qua UI; khác lỗi nút nộp bật khi chưa ghi âm. Chưa khẳng định nguyên nhân nằm ở storage, BE hay FE; timer tự nó không chứng minh có asset được lưu.

## Tiêu chí hoàn tất và retest

Ghi, dừng, nộp bằng UI rồi mở lại: audio phát được và API READY. Thử lỗi upload phải không làm mất bản ghi hoặc báo hoàn tất sai.
