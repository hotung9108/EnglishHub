Nguồn: feedback QA-32, cần quyết định sản phẩm; **chưa xác nhận là bug**.

## Bối cảnh

TeacherSubmissionDetails dùng input number min=0 max=10 step=0.5. DoD QA-32 nêu thang 0.0–10.0 nhưng không chốt độ chia. Band IELTS bước 0.5 có thể là chủ đích.

## Nội dung cần làm rõ

1. Điểm chính thức áp dụng bước 0.5 hay cho phép 0.1/0.01?
2. Quy tắc có khác theo kỹ năng/thang điểm không?
3. Có chấp nhận dấu phẩy thập phân hay yêu cầu dấu chấm?

## Bằng chứng và giới hạn

Test acceptance hiện xác minh 0.0, 7.5, 10.0 và chặn âm/>10/rỗng; không dùng 0.1 làm tiêu chí bug. Case 10.01 chỉ chứng minh vượt 10, không kết luận về step. Case dấu phẩy chưa được khẳng định từ user-event/jsdom.

## Tiêu chí hoàn tất

- [ ] PM chốt precision và quy tắc locale.
- [ ] FE/BE đồng bộ validation theo quyết định.
- [ ] Thay todo trong TeacherSubmissionDetails.test.tsx bằng test đúng spec.

<!-- QA32-issue-key:score -->
