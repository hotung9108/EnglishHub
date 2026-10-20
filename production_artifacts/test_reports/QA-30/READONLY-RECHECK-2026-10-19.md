# QA30 — kiểm tra bổ sung bằng GET và code, 19/10/2026

Thời điểm API: khoảng 17:43–17:44 UTC+7. Không chạy Selenium, tạo fixture, bấm nộp bài hoặc tạo issue. Đây là trạng thái kiểm tra hiện tại, không thay thế dữ liệu run 18/10.

## Bảng điểm — thêm bằng chứng mapping

- GET submissions của Student #698 mặc định trả page=1, limit=20, total=45; #1466 có ngay trang này. limit=100 trả 45 bản ghi; lọc assignmentId=1519 trả đúng một lượt #1466.
- List item #1466 **không có assignmentId**. GET detail #1466 có assignmentId=1519. Module #2638 là GRADED, grading COMPLETED, finalScore=7.5, maxScoreSnapshot=10.
- Bundle staging đã khảo sát và source StudentGrades đều dùng `String(sub.assignmentId || sub.id)` để tìm assignment. Với response này, nó dùng **1466** thay vì **1519**.
- GET assignment #1466 trả tiêu đề `QA30-READING-reading-2026-10-17T12-29-48-315Z`; GET #1519 mới là bài graded của run 18/10. Vì ID dự phòng còn trùng một assignment có thật, dòng có thể mang tên bài khác, khiến tìm tiêu đề đúng hoặc `#1466` đều không tìm ra.
- Đây là bằng chứng cụ thể cho khoảng lệch list DTO/mapping ID; không còn chỉ suy đoán phân trang. Không kết luận tất cả lỗi missing-row trong mọi run đều cùng nguyên nhân hoặc action/filter đã được kiểm tra. Sáu case vẫn chỉ đóng góp evidence cho một nhóm R09.
- Source pageSize=10 là phân trang phía UI; API mặc định lần kiểm tra này là 20. Phân trang chưa được loại trừ cho dữ liệu khác.

## Feedback — backend có nội dung, frontend staging lọc parent status

- GET grading #1770 trả COMPLETED, 7.5/10 và finalFeedback khớp fixture. GET submission #1466 có module GRADED/grading COMPLETED nhưng parent status vẫn SUBMITTED.
- Bundle staging lọc danh sách Feedback bằng `sub.status === GRADED`, vì vậy loại bài này trước khi tạo thẻ. Source mới dùng isSubmissionGraded để xét cả grading/module.
- Có bằng chứng logic giải thích thẻ nhận xét bị thiếu ở 022. 033/034 vẫn là các bước bị chặn, không phải hai bug filter/link độc lập. Cần xác nhận deploy và retest UI để chứng minh sửa xong.

## 403 — đã phân biệt hai nhóm

- GET `/reports/students/698/progress` vẫn 403 bằng chính tài khoản Student #698. Code ApiRoutePolicy chỉ cho ADMIN/TEACHER vào `/reports/**`; ReportService cũng chỉ cho hai role đó. Backend trả 403 khớp policy hiện tại. Cần điều chỉnh frontend/contract nếu màn Student cần progress; không tự mở quyền hoặc gọi đó là lỗi auth/session.
- GET `/submission-modules/2640/grading/ai-suggestion` (Writing của chính Student) vẫn 403; GET tương tự #2638 cũng 403. Code controller/service có endpoint và cho Student sở hữu bài đọc, nhưng ApiRoutePolicy không khai báo GET ai-suggestion và SecurityConfig có `anyRequest().denyAll()`.
- Thiếu route policy là nguyên nhân phù hợp source và status quan sát được. Chưa có log backend/cấu hình artifact đang deploy để xác nhận lớp từ chối thực tế trên staging. Không đánh đồng endpoint READING #2638 với Writing: sau khi qua quyền, service có thể trả 400 vì chỉ hỗ trợ Speaking/Writing. Không sửa config hoặc tạo issue trong bước này.

## Phần vẫn cần lượt UI mới

- 045: phải chờ lịch sử tải xong rồi mới kiểm tra count/CTA hết lượt. GET không thay thế hành vi nút UI.
- 038: GET không thể chứng minh server chấp nhận TXT. Có thể tự động hóa việc nộp TXT trên dữ liệu QA mới; theo quy trình hiện tại người dùng bấm chạy test, không bắt buộc kiểm thử thủ công. Cần tách kiểm tra chọn file/validation UI và backend từ chối file, không để upload thất bại bị UI nuốt lỗi thành bằng chứng backend nhận TXT.
- Không chạy lại các case bảng điểm/feedback nên chưa đổi Pass/Fail cũ hoặc khẳng định bản deploy đã sửa.

Evidence API local: `test/selenium/.cache/qa30-report-readback.json`, `.cache/qa30-mapping-access-check.json`. Đây là các GET có auth local; output không chứa credential/token.
