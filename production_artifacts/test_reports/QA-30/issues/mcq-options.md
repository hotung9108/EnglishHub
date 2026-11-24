# [API/FE][Student Quiz] Câu trắc nghiệm chỉ hiện A/B/C/D, thiếu nội dung đáp án lựa chọn

Issue: https://github.com/hotung9108/EnglishHub/issues/177

Nguồn: QA-30 — Selenium luồng Học viên. Cấu trúc theo QA29 #149/#151/#159; mỗi issue chỉ mô tả một hành vi lỗi.
Loại: Bug ứng viên đã có bằng chứng staging; chưa khẳng định root cause. Ưu tiên đề xuất: High.
Môi trường: https://staging.hotung9108.me; API https://api-staging.hotung9108.me/api/v1.
Nguồn full run: qa30-2026-10-19T11-31-19-695Z, 19/10/2026, 18:31–18:42 UTC+7.
Test case chính: QA30-025, QA30-026, QA30-027.

## Tiền điều kiện

1. Đối chứng API đã lưu: run riêng qa30-2026-10-19T11-09-05-074Z, module #2060/question #1735, MULTIPLE_CHOICE. Teacher response có bốn lựa chọn: daily practice; once a year; never study; skip feedback.
2. Full run còn tái hiện ở bài Reading #1562/question #1741, Reading #1563/question #1742 và Listening #1564/question #1743 thuộc lớp #150, Student #698. Không trộn ID giữa hai run.

Các ID là fixture tại thời điểm run, không khẳng định còn nguyên sau các lượt cleanup. Nếu không còn, tạo fixture tương đương đúng role/lớp/type/điều kiện; không dùng tài khoản hoặc bài của người học thật. Tài khoản test được cấp qua kênh riêng, không đăng password/token lên issue.

## Các bước tái hiện

1. Với Student QA thuộc lớp tương ứng, mở bài Reading/Listening MULTIPLE_CHOICE qua Danh sách bài tập và Bắt đầu làm bài.
2. Đọc nội dung bốn lựa chọn trên UI; chưa chọn/nộp nếu chỉ có nhãn mẫu.
3. Với fixture đối chứng module #2060, dùng Student gọi GET /modules/2060/questions; kiểm tra dữ liệu lựa chọn công khai.
4. Dùng Teacher sở hữu cùng module gọi cùng endpoint để xác minh fixture thực sự có đủ bốn nội dung, không lấy response Teacher làm dữ liệu Student.

## Kỳ vọng

Student thấy đủ nội dung các lựa chọn và có thể chọn. Response công khai cung cấp options phù hợp mà không lộ isCorrect/đáp án chuẩn.

## Thực tế

Student response question #1735 có id/content/questionType/score/orderIndex nhưng không có options; Teacher response cùng question có đủ options trong correctAnswer. UI chỉ hiện Lựa chọn A/B/C/D.

## Bằng chứng

- QA30-025: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-025.json`; ảnh `QA30-025.png`, DOM `QA30-025.html` trong cùng thư mục run.
- QA30-026: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-026.json`; ảnh `QA30-026.png`, DOM `QA30-026.html` trong cùng thư mục run.
- QA30-027: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/evidence/QA30-027.json`; ảnh `QA30-027.png`, DOM `QA30-027.html` trong cùng thư mục run.
- Report: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`.

Các đường dẫn trên là artifact local, **không phải attachment/URL công khai GitHub**. Report/ảnh nằm trong gói QA30 tester bàn giao; trích dữ liệu cần đối chiếu được chép ngay dưới để issue vẫn có bằng chứng đọc được. Không có retest mới trong lượt chỉnh tài liệu này.

<details>
<summary>Trích kết quả testcase từ run đã lưu</summary>

```json
[
  {
    "id": "QA30-025",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/reading/1562?submissionId=1514",
    "reason": "MCQ option 1 must show the real API option text, not placeholder A/B/C/D"
  },
  {
    "id": "QA30-026",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/reading/1563",
    "reason": "MCQ option 1 must show the real API option text, not placeholder A/B/C/D"
  },
  {
    "id": "QA30-027",
    "status": "FAILED",
    "actualUrl": "https://staging.hotung9108.me/student/assignments/listening/1564?submissionId=1516",
    "reason": "MCQ option 1 must show the real API option text, not placeholder A/B/C/D"
  }
]
```

</details>

Đối chứng role Teacher/Student (trích cùng câu hỏi, không chứa token):

```json
{
  "id": "QA30-025",
  "run": "qa30-2026-10-19T11-09-05-074Z",
  "fixture": {
    "assignmentId": 1549,
    "moduleId": 2060,
    "questionId": 1735,
    "questionType": "MULTIPLE_CHOICE",
    "options": [
      "daily practice",
      "once a year",
      "never study",
      "skip feedback"
    ]
  },
  "studentQuestions": {
    "data": [
      {
        "id": 1735,
        "content": "QA30: choose the phrase daily practice.",
        "questionType": "MULTIPLE_CHOICE",
        "score": 10,
        "orderIndex": 1
      }
    ]
  },
  "teacherQuestions": {
    "data": [
      {
        "id": 1735,
        "content": "QA30: choose the phrase daily practice.",
        "questionType": "MULTIPLE_CHOICE",
        "score": 10,
        "orderIndex": 1,
        "correctAnswer": {
          "options": [
            {
              "id": 1,
              "content": "daily practice",
              "isCorrect": true
            },
            {
              "id": 2,
              "content": "once a year",
              "isCorrect": false
            },
            {
              "id": 3,
              "content": "never study",
              "isCorrect": false
            },
            {
              "id": 4,
              "content": "skip feedback",
              "isCorrect": false
            }
          ]
        }
      }
    ]
  }
}
```

## Giới hạn và hướng xử lý

Chưa chọn/nộp/chấm điểm MCQ 10/0 vì dừng ở bước hiển thị. Không sửa bằng cách trả toàn bộ correctAnswer cho Student. Cần đối chiếu DTO/endpoint mà UI dùng và artifact BE trước khi quy lỗi cho một lớp duy nhất.

## Tiêu chí hoàn tất và retest

Đọc được đủ public options ở Reading và Listening, không lộ đáp án chuẩn; sau đó retest chọn/nộp/chấm đúng/sai riêng.
