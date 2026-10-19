# QA30 — Bản đồ giao diện và căn cứ viết test

Cập nhật **18/10/2026, 20:34 (UTC+7)**: API hoạt động trở lại, đăng nhập QA30 thành công và khảo sát lại đủ **11 màn** bên dưới, không lỗi điều hướng. Đọc develop `321ce42`; bundle staging vẫn cùng hash. Evidence mới lưu tại `.cache/qa30-ui-map-2026-10-18T13-34-34-673Z/` (inventory, DOM, text, ảnh), giữ nguyên evidence 17/10. Case 045 đã sửa để cho phép nút Xem lại kết quả khi hết lượt; chỉ cấm tạo/tiếp tục lượt mới. Xem [bàn giao hôm nay](../../production_artifacts/test_reports/QA-30/PREPARATION-2026-10-18.md). Đây là khảo sát chỉ đọc, chưa phải lượt chạy nghiệm thu 45 case.

Quan sát lại hôm nay: Overview bài Writing #1498 hiển thị giới hạn 3 trong khi API là 10; bài đã chấm #1505 hiển thị `1 / 3 lần` trong khi API giới hạn 1. Lịch sử hiện 7.5/10 nhưng trạng thái “Chờ chấm điểm”; vào đúng kết quả #1462 lại hiện đã chấm và 7.5/10. Bảng điểm vẫn có dòng thay tên bằng `Bài tập kiểm tra #...`, mẫu số 100 và trạng thái đang chấm. Feedback có evaluation định kỳ, nút ghi “Xem bài làm & Lời giải chi tiết”; khảo sát không bấm nút này. Các case 007, 017–024, 028, 034–036, 045 giữ expected nghiệp vụ/API để phát hiện chênh lệch, không sửa expected theo UI đang sai. Editor không mở lại vì có thể tự tạo lượt; căn cứ editor vẫn là source, bundle và evidence run 17/10, cần lượt người dùng chạy lại.

Ngày khảo sát: 17/10/2026. Phạm vi: vai trò Học viên và các luồng QA30; không phải kiểm thử toàn bộ Admin/Giáo viên.

## Nguồn đối chiếu

- Đã fetch `origin/develop`, commit `67fd528`; checkout riêng tại `../EnglishHub-qa30-source` để không trộn frontend/backend mới vào thay đổi QA30 chưa commit. Nhánh test hiện tại chưa merge develop, chưa push/PR QA30.
- Đọc router `frontend/src/App.tsx`, sidebar, toàn bộ các trang `Student*.tsx` có route thực, các service Assignment/Module/Question/Submission/Grading/Evaluation, hợp đồng backend Submit và hướng dẫn bàn giao Student Portal.
- Khảo sát trực tiếp 11 màn/view: dashboard, danh sách lớp, chi tiết lớp, danh sách bài, overview chưa làm, overview có lịch sử, bảng điểm, feedback, kết quả, profile, settings. Dùng tài khoản QA30 và dữ liệu đã có; không chạy suite 45 case, không bấm nộp bài.
- DOM/ảnh khảo sát lưu local trong `.cache/qa30-ui-map/`; các editor còn đối chiếu ảnh/text run người dùng `qa30-2026-10-17T12-29-45-229Z` và bundle staging công khai `index-BBK5DcPN.js`, SHA-256 `360e7a7e5c37c9bb3cc1e610ebebe007ff6187b27bde4aef2e39ded98fc8356c`.
- **Staging không đồng nhất với develop mới.** Ví dụ staging dùng `overview-rule-item`, timer `speaking-cue-timing`, chưa có `exam-short-answer-input`; develop dùng `overview-rule-card`, timer `speaking-card-timing`, đã có short-answer input. Locator hỗ trợ những layout đã đọc; kết quả nghiệp vụ vẫn phải khớp API.

## Màn hình, vị trí và chức năng

| Màn / đường vào | Nút, trường và vị trí | Hành vi cần kiểm tra | Case |
| --- | --- | --- | --- |
| Dashboard `/student/dashboard` | Hai nút đầu các khối bài tập/lớp: “Xem tất cả bài tập”, “Tất cả lớp học”; các thẻ lớp/bài | Đúng role, đi đúng danh sách | 001, 043 |
| Sidebar → Lớp học `/student/classes` | Tab Tất cả / Đang diễn ra / Đã hoàn thành ở trên; ô tìm kiếm; nút “Xem lớp học” trên từng thẻ | Tìm đúng lớp đã ghi danh; tìm rỗng; lọc trạng thái | 002–003, 029 |
| Thẻ lớp → `/student/classes/:id` | Nút quay lại trên đầu; thông tin lớp/GV; thống kê và thẻ bài; nút Bắt đầu/Xem kết quả của từng bài | Đúng lớp và bài; mở đúng assignment; mở Overview chưa được tạo lượt | 004, 042 |
| Sidebar → Danh sách bài `/student/assignments` | Tab trạng thái phía trên; dropdown `#student-class-select`; ô tìm kiếm; thẻ `.std-asg-card` và nút trong thẻ | Lọc theo lớp/trạng thái, tìm đúng/rỗng; đúng đường vào bài | 005–006, 030 |
| Overview `/student/assignments/:id/overview` | Nút quay lại ở đầu; thông tin bài; ô “SỐ LƯỢT NỘP CHO PHÉP” trong rules grid; bảng lịch sử phía dưới; CTA **cuối trang** | Đúng bài; giới hạn/số lượt so API; nút Bắt đầu/Tiếp tục; lịch sử; hết lượt | 007–008, 024, 041, 045 |
| Writing | Đề/hướng dẫn; `.writing-textarea`; bộ đếm từ ở đầu vùng soạn; chọn file và tên file; nút Nộp bài/Lưu bản nháp phía dưới | Trống, nháp cùng trình duyệt, chênh lệch text UI/API ESSAY, PDF, file sai định dạng, bộ đếm | 009–012, 038, 040 |
| Reading | Bảng số câu/đánh dấu; câu hỏi; các lựa chọn A–D hoặc input câu ngắn; Hoàn thành & Nộp bài ở cuối | Đúng nội dung lựa chọn API; đúng/sai và điểm 10/0; hủy xác nhận nộp trắng | 013–014, 025–026, 044 |
| Listening | Audio/player và vùng câu hỏi; điều hướng câu/đánh dấu; các lựa chọn/input; nút hoàn thành cuối trang | Nộp câu ngắn/MCQ và đọc lại đúng câu/lượt | 015, 027; player chưa có kiểm thử nội dung audio |
| Speaking | Phòng thu ở cột chính; Reset / Micro / Phát lại; timer ở header phòng thu; ghi chú; nút Nộp bài trong cột bài nộp | Chưa ghi không được nộp; start/stop ≥3 giây; upload thật phải READY | 016, 039 |
| Bảng điểm `/student/grades` | Lọc kỹ năng/lớp và tìm kiếm ở trên; bảng 8 cột; nút Xem lời giải/Xem bài nộp cuối dòng; xuất PDF trên đầu | Dòng gắn đúng tên/kỹ năng/trạng thái; thang điểm API; bộ lọc; nút đúng submissionId | 017–019, 028, 031–032 |
| Feedback `/student/feedback` | Tab Tất cả / Từ Giảng viên / Từ Trợ lý AI; lọc kỹ năng/tìm kiếm; nội dung và nút cuối mỗi thẻ | Evaluation khác nhận xét chấm bài; đúng nội dung/lớp; link lớp hoặc submission tương ứng | 020–023, 033–034 |
| Kết quả `/student/submissions/:id` | Breadcrumb đầu trang; dropdown lượt; điểm; Làm lại/Tải PDF/Xem bảng điểm; nút kỹ năng; 3 tab; lọc câu đúng/sai | Đúng lượt từ lịch sử; điểm 7.5; tab **“Nhận xét & Trao đổi”**; về bảng điểm | 035–037; link bảng điểm được kiểm tra riêng ở 017 |
| Profile / Settings | Hồ sơ, các trường tài khoản/cài đặt | Đã đọc và khảo sát; không sửa thông tin hay mật khẩu trong QA30 | Ngoài bộ nghiệp vụ QA30 hiện tại |
| Analytics / Workspace / Status | Router hiện tại chuyển Analytics tới unauthorized, Workspace về Assignments; Status dùng StudentAssignments | Không viết case giả định còn trang Analytics/Workspace riêng như tài liệu cũ | Chưa kiểm thử redirect/quyền |

## Những điểm sửa để tránh kết luận sai

1. **007:** tìm rules theo label không phân biệt chữ hoa và cả hai layout; cuộn quan sát ô lượt và CTA cuối trang. API đọc được `maxSubmissions=10`, UI staging quan sát `0 / 3 lần (Còn 3 lượt)`. Case mới ghi rõ UI/API; không còn chờ XPath rule-card cũ. Đây là bằng chứng chênh lệch cần review, chưa tạo issue.
2. **Writing — đính chính sau lỗi setup 21:31–21:32:** whitelist `ModuleService.isSupportedPair` chỉ cho `WRITING/ESSAY`; `REWRITE` thuộc Reading. Bản đầu v4 suy luận sai nên bị HTTP 400 khi tạo module, chưa chạy case nào. Đã sửa tất cả fixture Writing về ESSAY và thêm regression test đọc trực tiếp whitelist backend cho đủ 14 loại fixture. API ESSAY lưu file; việc UI cho nhập/nộp text nhưng không giữ nội dung là khoảng lệch FE/BE cần review (`CONTRACT_GAP_REVIEW` ở 011), không được tạo module WRITING/REWRITE hoặc dùng questionId=1 giả để vượt contract. PDF vẫn bắt buộc file READY.
3. **Speaking:** timer staging là `speaking-cue-timing` bên trong section có Micro; không tìm `speaking-card-timing` đơn lẻ và không lấy timer câu hỏi khác. Trạng thái “đã ghi” chưa đủ Pass: audio phải READY ở API.
4. **Lịch sử:** dùng ô đầu/ô điểm theo cấu trúc bảng đã quan sát, không dùng class `overview-cell-attempt`/`overview-cell-score` vốn không tồn tại ở staging. “Lần 1Điểm cao nhất” phải đọc ra lượt 1. Nút Xem chọn trong đúng dòng số lượt từ API.
5. **Kết quả:** đã khảo sát mở từ lớp → Overview → đúng dòng lịch sử → kết quả thật `submissionId`, có tên bài Reading và 7.5/10. Không thay route sai của nút Bảng điểm bằng API/JavaScript để che lỗi; case 017 vẫn kiểm tra nút đó riêng.
6. **MCQ/short answer:** MCQ phải có đủ 4 **nội dung đáp án thật**, không chỉ 4 nhãn A/B/C/D. Short-answer không có input trên staging phải được ghi nhận là thiếu chức năng UI; không tự đổi sang MCQ.
7. **Setup:** schema fixture v3; chọn một case chỉ chuẩn bị các tài nguyên trong `scenario-plan.js`. Case 007 không tạo 13 bài khác, bài chấm sẵn hay evaluation. Chạy full tạo dữ liệu mới cho cả bộ; giữ report và dữ liệu cũ để review.

Lưu ý khảo sát: đường vào thẻ bài đã chấm trên staging có thể đi thẳng editor và phát sinh lượt đang làm; lần khảo sát đã gặp hành vi này trên bài QA30 cũ. Công cụ khảo sát hiện đi qua chi tiết lớp/lịch sử và không mở editor. Các lượt khảo sát không dùng làm kết quả nghiệm thu; v4 tạo fixture mới trước khi chạy.

## Giới hạn và việc còn phải xác minh

45 case chưa đồng nghĩa toàn bộ web được kiểm thử. Chưa có kiểm thử tự động cho nhiều module trong cùng bài, lịch mở/đóng và deadline, lượt không giới hạn, file quá 10 MB/DOCX, chất lượng/phát audio Listening, reset/playback/ghi chú Speaking, pagination nhiều trang, tải/in PDF, annotations AI, gửi trao đổi, quyền truy cập chéo học viên, responsive/accessibility và thay đổi profile/password.

Bản đồ nút không đồng nghĩa tất cả nút có API hoàn chỉnh. Không tính thao tác chỉ đổi state nội bộ thành bằng chứng đã lưu server. Cần người dùng chạy suite v4 và review ảnh/DOM/API trước khi khẳng định Pass/Fail sản phẩm hoặc tạo issue.
