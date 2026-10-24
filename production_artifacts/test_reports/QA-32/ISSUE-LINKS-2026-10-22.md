# QA-32 — Issue và bàn giao ngày 22/10/2026

Đã đăng và đọc lại xác minh 9 issue mới ở trạng thái Open: 7 bug, 1 feature gap, 1 cần chốt spec. Bằng chứng là component/jsdom trên develop e8e85a4, không phải retest staging.

| Mục | Issue |
|---|---|
| FINALIZE | [[FE][Student Writing] Báo nộp thành công và xóa nháp khi hoàn tất submission thất bại](https://github.com/hotung9108/EnglishHub/issues/207) |
| ATTEMPT | [[FE][Student Writing] Báo nộp thành công khi không tải được lượt nộp](https://github.com/hotung9108/EnglishHub/issues/208) |
| CREATE | [[FE][Teacher Create Assignment] Vẫn phát hành bài khi tạo module thất bại](https://github.com/hotung9108/EnglishHub/issues/209) |
| SCHEDULE | [[FE][Teacher Create Assignment] Cho gửi lịch đóng bài trước lịch mở](https://github.com/hotung9108/EnglishHub/issues/210) |
| TIMEZONE | [[FE][Teacher Create Assignment] Giá trị datetime-local mặc định dùng giờ UTC](https://github.com/hotung9108/EnglishHub/issues/211) |
| GRADE | [[FE][Grading] Lưu bản nháp nhận xét gọi endpoint hoàn tất chấm điểm](https://github.com/hotung9108/EnglishHub/issues/212) |
| ROUTE | [[FE][Student Writing] Assignment ID không hợp lệ âm thầm tải bài số 1](https://github.com/hotung9108/EnglishHub/issues/213) |
| ANNOTATION | [[FE][Feature gap][QA-32] Bổ sung luồng duyệt annotation trên TeacherSubmissionDetails](https://github.com/hotung9108/EnglishHub/issues/214) |
| SCORE | [[Spec][QA-32] Làm rõ bước điểm 0.5 hay điểm thập phân bất kỳ trong thang 0–10](https://github.com/hotung9108/EnglishHub/issues/215) |
| Module submit thất bại | [#184 — dùng lại lỗi đã ghi QA-30](https://github.com/hotung9108/EnglishHub/issues/184) |
| questionId=1 / text-only contract | [#174 — liên quan hợp đồng Writing, cần thống nhất](https://github.com/hotung9108/EnglishHub/issues/174) |

9 ca known-bugs: WRITING 4 ca (#184/#207/#208/#174), CREATE/SCHEDULE/TIMEZONE 3 ca (#209–211), GRADE 1 ca (#212), ROUTE 1 ca (#213). #214 và #215 là 2 todo, không nằm trong 9 ca đỏ.

Không đóng #174/#175/#177 từ test mock. #205 là lỗi DOCX backend đã có issue riêng; QA-32 không xác nhận backend đã sửa.

## Comment dán Trello

Nội dung bên dưới đã chuẩn bị, **chưa đăng lên Trello**.

```text
[QA-32] Bàn giao bộ Vitest + React Testing Library trên develop e8e85a4.
Acceptance: 102 Pass / 2 todo; known-bugs riêng: 9 Fail đã ghi nhận.
Coverage từng màn hình/từng chỉ số >=80%; tổng statements 94.64%, branches 85.3%, functions 90%, lines 95.08%.
139 API client/utility tests Pass; typecheck/build Pass; lint exit 0 với 1 warning có sẵn.
Issue đã đăng và xác minh:
- [FE][Student Writing] Báo nộp thành công và xóa nháp khi hoàn tất submission thất bại
  https://github.com/hotung9108/EnglishHub/issues/207
- [FE][Student Writing] Báo nộp thành công khi không tải được lượt nộp
  https://github.com/hotung9108/EnglishHub/issues/208
- [FE][Teacher Create Assignment] Vẫn phát hành bài khi tạo module thất bại
  https://github.com/hotung9108/EnglishHub/issues/209
- [FE][Teacher Create Assignment] Cho gửi lịch đóng bài trước lịch mở
  https://github.com/hotung9108/EnglishHub/issues/210
- [FE][Teacher Create Assignment] Giá trị datetime-local mặc định dùng giờ UTC
  https://github.com/hotung9108/EnglishHub/issues/211
- [FE][Grading] Lưu bản nháp nhận xét gọi endpoint hoàn tất chấm điểm
  https://github.com/hotung9108/EnglishHub/issues/212
- [FE][Student Writing] Assignment ID không hợp lệ âm thầm tải bài số 1
  https://github.com/hotung9108/EnglishHub/issues/213
- [FE][Feature gap][QA-32] Bổ sung luồng duyệt annotation trên TeacherSubmissionDetails
  https://github.com/hotung9108/EnglishHub/issues/214
- [Spec][QA-32] Làm rõ bước điểm 0.5 hay điểm thập phân bất kỳ trong thang 0–10
  https://github.com/hotung9108/EnglishHub/issues/215
Dùng lại lỗi module submit: https://github.com/hotung9108/EnglishHub/issues/184
Hợp đồng text-only/question ID: https://github.com/hotung9108/EnglishHub/issues/174
Giữ In Progress vì annotation chưa có UI và cần chốt ngoại lệ DoD. Chỉ sửa test/config/tài liệu, không sửa app.
PR: https://github.com/hotung9108/EnglishHub/pull/216
Report: production_artifacts/test_reports/QA-32/README.md
Chạy: cd frontend; npm ci; npm run test:ui
Giới hạn: API mock/jsdom; chưa retest staging/Selenium.
```
