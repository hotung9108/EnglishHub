# Kiểm thử component UI — QA-32

Chạy tại thư mục frontend, dùng Node.js 22.19+:

```sh
npm ci
npm run test:ui
npm run test:ui:types
npm test
npm run lint
npm run build
```

PowerShell bị chặn npm.ps1 có thể dùng npm.cmd. Mở frontend/coverage/index.html để xem coverage; dùng npm run test:ui:watch khi phát triển.

## Phạm vi

Vitest + React Testing Library + jest-dom + jsdom chạy bốn màn hình thật cùng router, provider ngôn ngữ và editor con thật. Mock ở ranh giới API service; file upload dùng fetch mock. Không cần backend, tài khoản hoặc token thật lúc chạy.

- Login: native validation email/password, submit, lỗi, chuyển hướng theo role/quyền truy cập và chống gửi lặp.
- TeacherCreateAssignment: validation form/bốn kỹ năng, lịch cụ thể, chọn lớp, nháp/phát hành, MCQ/short answer được gửi qua question service với payload chính xác.
- StudentAssignmentWriting: đếm từ, bài rỗng, nháp, file validation/upload, bài đóng, chuyển kỹ năng và bài nhiều module.
- TeacherSubmissionDetails: điểm 0.0/7.5/10.0, điểm âm/>10/rỗng, feedback/note, pending/error, roster, nhiều module, audio và chấm Speaking bằng AI.

Coverage liệt kê rõ bốn file src/pages tương ứng; ngưỡng 80% riêng từng file cho statements, branches, functions và lines. Không phải coverage toàn frontend hoặc editor con. Lệnh trả khác 0 nếu test lỗi hoặc thiếu coverage. Không hạ ngưỡng hoặc loại dòng để làm xanh kết quả.

npm test chạy suite API client/utility hiện có; không phải API integration với server thật. Selenium kiểm thử trình duyệt/tích hợp là tầng riêng, chưa chạy trong QA-32.

## Quy ước

Truy vấn theo role/tên; dùng placeholder khi input ứng dụng chưa liên kết label. user-event cho click/type/upload; fireEvent cho dữ liệu biên, drag/drop và thao tác tạo timer trong act. Deferred promise kiểm tra pending, fake timers kiểm tra chuyển trang. Cleanup DOM/localStorage sau mỗi test, restore mocks và real timers để cô lập.

Worker dùng TZ=Asia/Ho_Chi_Minh cho lịch có mốc cụ thể. Lỗi giá trị mặc định datetime-local lệch UTC vẫn có test tái hiện riêng #211. Điểm 10.01 chỉ kiểm tra vượt 10, không dùng làm bằng chứng precision. Chưa khẳng định hỗ trợ dấu phẩy thập phân.

## Lỗi tồn đọng và DoD

```sh
npm run test:ui:known-bugs
```

Lệnh chẩn đoán riêng chạy 9 ca tái hiện và hiện trả exit code 1 do assertion hành vi mong đợi thất bại. Không chạy như gate xanh của acceptance, không tính coverage, không dùng expect.fail. Khi dev sửa, giữ assertion, chạy lại và chuyển ca sang acceptance.

Acceptance có 102 Pass / 2 todo. Todo là UI duyệt annotation chưa triển khai (#214) và precision cần PM chốt (#215); không tính Pass. Nút lưu nháp grading không được acceptance khẳng định là gọi submitGrade; lỗi đó nằm riêng #212. Mapping question ID không khóa acceptance vào ID=1; liên quan hợp đồng #174.

CI chạy npm ci, API client tests, lint, typecheck UI test, acceptance+coverage và build. Suite known-bugs chạy thủ công khi chẩn đoán/retest; không coi CI xanh là sản phẩm không có bug.

Xem report và bảng issue: [README](../production_artifacts/test_reports/QA-32/README.md), [Issue links](../production_artifacts/test_reports/QA-32/ISSUE-LINKS-2026-10-22.md). Không đánh dấu QA-32 đạt toàn bộ DoD trước khi xử lý/được chấp thuận phần annotation còn thiếu.
