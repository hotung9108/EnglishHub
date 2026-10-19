# QA30 — đánh giá chất lượng test sau lượt người dùng chạy

## Kết luận

Bộ test đi qua UI thật và đã phát hiện dấu hiệu lỗi có giá trị, nhưng chưa đủ tin cậy hoặc bao phủ để chốt DoD QA30. Cần sửa harness, làm rõ các nhánh điều hướng theo trạng thái bài và bổ sung case trước lượt người dùng chạy tiếp. Không xem 16 case Fail là 16 bug sản phẩm.

Phạm vi review: chỉ đọc report, source snapshot, ảnh/text/evidence đã lưu và contract/source ứng dụng local. Không mở browser, gọi staging, chạy lại Selenium, tạo issue hoặc sửa kết quả lịch sử trong bước review này.

## Bằng chứng được review

- [Report](../../../test/selenium/reports/qa30-2026-10-17T11-04-24-292Z/report.html), từ 18:04:24 đến 18:12:22 ngày 17/10/2026 (UTC+07).
- 24/24 case có kết quả: **8 Passed / 16 Failed / 0 Blocked / 0 Aborted / 0 chưa chạy**. Setup ready; không có evidenceError/cleanupError ghi nhận trong 24 case.
- Source hashes của 24 file snapshot đều khớp source hiện tại tại lúc review. Vì vậy các nhận xét code dưới đây áp dụng đúng bản người dùng vừa chạy.
- Đã xem ảnh QA30-013, QA30-018, QA30-021 cùng text/evidence của các nhóm Fail và case đánh giá định kỳ Pass.

## Phát hiện về bộ test, theo ưu tiên

### 1. P1 — đọc sai contract cho bài IN_PROGRESS gây Fail giả

`support/student/fixtures.js:96` gọi `GET /submission-modules/{id}` vô điều kiện trong `latestAttempt`. Backend `SubmissionService.java:394` chỉ trả detail khi cả submission và module đã SUBMITTED/GRADED; ngược lại trả HTTP 400 với ý nghĩa chưa nộp.

QA30-008, QA30-009 và QA30-010 đều gặp đúng 400 này. QA30-009 chết ở readback trước khi bấm Nộp bài trống, nên validation chưa được thực thi. QA30-010 đã nhập/lưu/mở lại nháp và qua kiểm tra editor, nhưng fail ở readback cuối. Những failure này không đủ cơ sở tạo bug web.

Cần tách đọc trạng thái lượt đang làm qua submission detail khỏi đọc answers/assets của module đã nộp. Với QA30-016, phải lưu trạng thái submission/module trước khi đọc endpoint yêu cầu đã nộp, để phân biệt lỗi nộp Speaking với lỗi quan sát.

### 2. P1 — fixture tái sử dụng và điều hướng cứng làm case không tới đúng bước

`pages/student/StudentPage.js:65` ép route Overview. Lượt mới dùng lại bài/lượt làm từ lượt thử trước; QA30-007 thực tế được mở thẳng vào Writing. Frontend có nhánh bắt đầu/resume/xem kết quả khác nhau theo trạng thái. Không thể chỉ dùng timeout Overview để kết luận web điều hướng sai.

QA30-017 và QA30-024 dừng tại trang Reading thay vì tới kiểm tra điểm/lịch sử. Ở đây còn có khả năng lỗi ánh xạ trạng thái bài đã chấm của web; cần tách case kiểm tra điều hướng thẻ bài khỏi case xem kết quả/lịch sử. Không đổi locator để bỏ qua lỗi điều hướng mà không ghi nhận riêng.

Cần fixture rõ trạng thái (chưa bắt đầu/đang làm/đã nộp/đã chấm), xác minh trạng thái trước case và đi theo control hiện có đúng nghiệp vụ. `--fresh-fixtures` hiện là tùy chọn, không bảo đảm mọi lượt full bắt đầu từ trạng thái sạch.

### 3. P1 — chưa ràng buộc readback với chính lượt thao tác UI

`latestAttempt` chọn lượt có attemptNumber cao nhất, còn `submissionNavigation` chỉ kiểm tra route kết quả dạng bất kỳ. Chưa đối chiếu submissionId trên URL với submissionId đọc lại; chưa lưu trước/sau thao tác hoặc ID lượt vừa tạo để loại việc đọc lại lượt cũ.

Cần ràng buộc theo assignment/student/module và ID lượt UI thực tế, phân biệt tạo mới với resume; ghi trạng thái trước/sau. Nếu không, test có nguy cơ Pass nhờ dữ liệu cũ hoặc kết luận thiếu dữ liệu của một lượt khác.

### 4. P2 — một số assertion chưa khớp expected hoặc quá yếu

- QA30-007 kiểm tra số `10` ở toàn main, chưa đọc đúng giá trị giới hạn/số lượt còn lại.
- QA30-024 ghi danh sách attempts vào evidence nhưng chỉ assert có `7.5` trên trang; chưa so sánh số dòng, attemptNumber, trạng thái và submissionId giữa UI/API.
- QA30-017 cũng tìm `7.5` ở toàn main, chưa ràng buộc đúng ô điểm.
- QA30-019 fail ở kiểm tra skill trước khi chọn filter, nên chưa kiểm tra hoạt động lọc dù tên case nói về bộ lọc.
- QA30-020 xác nhận đúng nội dung evaluation và tên lớp, nhưng không kiểm tra nhãn loại đánh giá/skill/CTA. Ảnh vẫn có nhãn WRITING và các phần nội dung mẫu khác ngoài assertion.
- Văn bản Writing happy path chỉ 42 từ, trong khi UI mô tả 150–250 từ. Nên dùng nội dung hợp lệ cho happy path; tách min/max word-count thành case riêng sau khi xác nhận rule bắt buộc.

### 5. P2 — bằng chứng mạng chưa đủ để xác định nguyên nhân upload/submit

`apiObservations` là sự kiện của helper API trong harness, không phải request do frontend gửi trong browser. Vì thế không thấy payload submit, response lỗi, URL upload đã che hoặc status PUT storage của UI.

QA30-011/012 có bằng chứng dữ liệu cuối bị thiếu, nhưng chưa đủ để kết luận request nào gây ra. Cần lưu metadata/payload QA cần thiết qua browser network, che auth, credential và signed URL; lưu trạng thái trước/sau và thời điểm. Không đổi assertions để cho Pass khi file/audio chưa thực sự được lưu.

## Đánh giá từng nhóm case của lượt này

| Case | Report | Thực sự kiểm tra được / nhận xét |
| --- | --- | --- |
| 001–006 | 6 Pass | Login đúng role, sidebar, tìm lớp, mở lớp và tìm bài; là smoke hữu ích, chưa kiểm tra chi tiết số liệu/permission. |
| 007 | Fail | Chờ Overview nhưng đang ở editor; chưa xác minh giới hạn lượt. Có vấn đề trạng thái fixture/giả định route. |
| 008–009 | 2 Fail | Readback sai contract IN_PROGRESS; 009 chưa chạy thao tác validation. |
| 010 | Fail | UI lưu/mở lại nội dung nháp đã qua assertion; fail ở API detail chỉ dùng sau nộp. |
| 011 | Fail | Submission/module SUBMITTED nhưng content null; UI kết quả cũng không có nội dung bài viết. Dấu hiệu lỗi tích hợp thật, cần xác định contract và request UI. |
| 012 | Fail | Submission/module SUBMITTED, docStorageKey null và docUploadStatus UPLOADING. Cần phân biệt lỗi upload, quan sát storage và luồng báo thành công. |
| 013–015 | 3 Fail | Ảnh/text xác nhận SHORT_ANSWER hiển thị A–D. Bắt được vấn đề rendering nhưng chưa nhập, nộp hoặc kiểm tra điểm đúng/sai. |
| 016 | Fail | UI tới trang kết quả không có audio; readback module trả 400. Chưa đủ để báo verdict nộp/audio theo expected đầy đủ. |
| 017 | Fail | Dừng trước trang kết quả bài chấm sẵn; chưa kiểm tra điểm 7.5 ở trang kết quả. |
| 018 | Fail | Bằng chứng rõ: UI 7.5/100, API finalScore 7.5 và maxScoreSnapshot 10. Case có giá trị phát hiện bug. |
| 019 | Fail | UI gắn WRITING cho fixture READING; chưa tới bước chọn bộ lọc Reading. Không ghi nhận filter đã được test xong. |
| 020 | Pass | Tìm thấy evaluation đúng nội dung và lớp, nhưng các nhãn/CTA/số liệu khác chưa được xác minh. |
| 021 | Fail | Test tìm nút Xem thông tin lớp học; staging hiện Xem bài làm & Lời giải chi tiết. Chưa bấm được CTA để kiểm tra đích đến; cần phân biệt thiếu control nghiệp vụ và locator lệch phiên bản. |
| 022 | Fail | Không tìm thấy official feedback; setup đã kiểm tra API có nội dung. Có dấu hiệu lỗi hiển thị/phân loại bài chấm nhưng cần tách khỏi vấn đề nhận diện trạng thái và dựng case độc lập. |
| 023 | Pass | Tìm feedback không tồn tại cho trạng thái rỗng. |
| 024 | Fail | Dừng tại route Reading; không kiểm tra được danh sách lịch sử. Assertion hiện tại cũng chưa so khớp lịch sử UI/API. |

## Bao phủ cần bổ sung

| Phạm vi | Hiện tại | Bổ sung ưu tiên |
| --- | --- | --- |
| Lớp học | Một lớp active, search và mở chi tiết | Nhiều lớp, không được ghi danh, lớp completed, phân trang; đối chiếu số liệu/giáo viên. |
| Bắt đầu/resume/lượt nộp | Có case nhưng trạng thái chưa cô lập | Chưa bắt đầu, resume giữ cùng ID, còn/hết lượt, nhiều attempts và best score, không tạo lượt thừa khi mở lại. |
| Writing | Trống, nháp, text và PDF | Nội dung hợp lệ; DOCX; sai loại/quá dung lượng; bỏ/đổi file; draft qua reload/session; lỗi upload và không được báo nộp thành công giả. |
| Reading/Listening | Chỉ SHORT_ANSWER; dừng ở rendering | MCQ đúng/sai/điểm 0, short answer riêng, nhiều câu, bỏ trống, autoscore sau nộp; audio Listening có thể phát/dừng và tải được. |
| Speaking | Bật/tắt recorder, nộp, yêu cầu audio READY | Chờ thời lượng bản thu có ý nghĩa, file có bytes/duration, nghe lại/thu lại; không có audio; lỗi/quyền mic, lỗi upload. |
| Điểm/nhận xét | Một bài chấm sẵn 7.5 | Hiển thị điểm 0, pending khác completed, đúng title/class/skill; feedback trong trang kết quả; từng bộ lọc độc lập và nhiều record. |
| Đánh giá định kỳ | Một evaluation, tìm kiếm | Nhiều lớp/kỳ, phân trang, nội dung dài, rỗng thật, quyền đọc; đúng loại/giáo viên/đích link. |

Các phần analytics, workspace, export, responsive/accessibility và đánh giá chất lượng AI chưa có trong bộ này; không tuyên bố đã bao phủ. Ưu tiên bốn luồng DoD trước, rồi quyết định mở rộng theo yêu cầu task thay vì dùng hướng dẫn Student Portal để tự tuyên bố bao phủ toàn bộ web.

## Đề xuất lượt chỉnh tiếp theo

1. Sửa contract đọc IN_PROGRESS, cô lập trạng thái fixture và ràng buộc ID lượt UI/API.
2. Tách các failure sớm thành case rendering/navigation riêng; thêm đường đi trọn luồng bằng dữ liệu MCQ phù hợp, vẫn giữ SHORT_ANSWER để bắt bug.
3. Tăng độ chính xác assertions theo ô/dòng/ID, bổ sung case biên ưu tiên và bằng chứng mạng đã che thông tin nhạy cảm.
4. Giữ nguyên report hiện tại. Sau khi sửa bộ test, người dùng tự bấm chạy lượt mới; cùng review và chỉ tạo issue cho lỗi đã phân loại/xác nhận.
