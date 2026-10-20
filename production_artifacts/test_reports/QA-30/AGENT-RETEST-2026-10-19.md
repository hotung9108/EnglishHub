# QA30 — review full run mới và retest do agent chạy ngày 19/10

## Phạm vi và ủy quyền

Người dùng cho phép agent tự chạy kiểm chứng từ tin nhắn “hiện tại còn 1 số bug thì bạn có thể tự chạy rồi kiểm tra, nhớ là phải đúng đắn”. Từ thời điểm này, retest có chọn lọc được phép; quy định cũ chỉ người dùng bấm Run được thay thế trong phạm vi này. Không sửa staging/app, không tạo issue/PR.

Full run người dùng: `qa30-2026-10-19T10-50-38-265Z` (17:50–18:02 UTC+7), v6: **20 Pass / 25 Fail**, đủ 45 case, không Blocked. Cùng các case Pass/Fail và triệu chứng với full run ngày 18/10. Không coi đây là 25 root cause.

Agent chạy 6 case riêng, mỗi case có lớp/bài QA mới: 045, 038, 017, 022, 025, 039; thêm một diagnostic chọn/nộp TXT riêng. Không chạy lại toàn bộ 45 case sau sửa wait. Các run độc lập không cộng vào full run.

## Chỉnh test trước khi kiểm chứng

- Revision `v7-review-waits`: 045 chờ lịch sử không còn loading, ghi lại rule, hàng lịch sử, trạng thái tất cả CTA trước khi đánh giá; thu đồng thời lỗi maxSubmissions và lỗi bật nút. Không bấm CTA hết lượt để tránh đánh đồng trạng thái nút với bypass backend.
- 038 không chờ nguyên văn một thông báo trong 60 giây. Đợi UI xử lý chọn file, ghi tên TXT hiện trên màn và API IN_PROGRESS; không chỉ dựa `.writing-file-name` vốn không tồn tại ở bundle staging. Lần sửa đầu vẫn timeout do khác locator, được giữ làm evidence harness và sửa tiếp; không coi đó là bug sản phẩm mới.
- Thêm regression kiểm tra section lịch sử đã xuất hiện nhưng còn loading không được coi ready. **66/66 kiểm tra local đạt**; syntax và diff whitespace kiểm tra riêng. Không có assertion nào được nới để nhận kết quả nghiệp vụ sai là Pass.

## Kết quả có bằng chứng mới

| Case/nhóm | Run/evidence | Kết luận và giới hạn |
| --- | --- | --- |
| 045 | `qa30-2026-10-19T11-07-06-072Z` | Đã chờ xong, UI/API đều có 1 lượt; API max=1, UI 1/3 còn 2; CTA “Bắt đầu làm bài (Lần 2)” visible/enabled. Xác nhận sai giới hạn **và trạng thái nút**, không còn chỉ snapshot loading. Không click nên chưa xác nhận backend cho vượt lượt. |
| 038 | Bản kiểm tra cuối: `qa30-2026-10-19T11-10-31-596Z` | TXT hiển thị trong vùng chọn file, không có cảnh báo định dạng, API vẫn IN_PROGRESS; case không bấm nộp. Đây là lỗi validation chọn file, chưa phải backend nhận TXT. Run `11-07-51-400Z` là bản locator chưa sửa xong, không dùng làm kết luận cuối. |
| 017 / R09 | `qa30-2026-10-19T11-08-22-390Z` + API audit | Fixture submission #1499, assignment #1547. List mặc định 20 dòng có #1499 nhưng không có assignmentId; detail có assignmentId=1547. Bundle dùng fallback sub.id -> tra assignment 1499 thay vì 1547. Tái hiện mapping sai; không cần quy cho phân trang ở fixture này. Case vẫn dừng trước action xem kết quả; không tạo issue cho từng filter/score assertion chưa đến. |
| 022 / R08 | `qa30-2026-10-19T11-08-48-713Z` + API audit | Submission #1500/assignment #1548 parent SUBMITTED; module GRADED, grading #1804 COMPLETED, 7.5/10, feedbackMatches=true. UI không tìm thấy thẻ; bundle lọc parent GRADED loại bài này. Bằng chứng fixture grading hợp lệ. 033/034 chưa được retest độc lập và không coi là hai lỗi mới. |
| 025 / R05 | `qa30-2026-10-19T11-09-05-074Z` + Teacher/Student GET | Question #1735/module #2060: Teacher trả đủ 4 nội dung choices đúng fixture; Student trả MULTIPLE_CHOICE nhưng không có options/correctAnswer. UI chỉ hiện lựa chọn mẫu. Xác nhận thiếu dữ liệu lựa chọn trong response Student; không sửa frontend để lấy đáp án Teacher hoặc làm lộ isCorrect. Cần public options không chứa cờ đáp án đúng. Chưa chọn/nộp/chấm điểm. |
| 039 | `qa30-2026-10-19T11-09-30-935Z` | Với Speaking mới, chưa ghi, nút vẫn enabled. Không click nộp rỗng nên không khẳng định server chấp nhận nộp rỗng. Source tham chiếu có khóa nút, cần đối chiếu artifact deploy. |

### Diagnostic nộp TXT — thêm bằng chứng luồng nuốt lỗi

Evidence: `test/selenium/reports/qa30-diagnostic-txt-2026-10-19T11-10-57-470Z/` gồm observations.json, ảnh trước/sau và DOM. Đây là diagnostic, không phải một case Pass/Fail trong full suite.

- Fresh assignment #1552; không nhập text, chỉ chọn TXT tổng hợp rồi bấm UI Submit một lần.
- `POST /assignments/1552/submissions` -> 201, lượt #1504.
- `POST /submission-modules/2676/submit` -> **400**.
- Sau đó frontend vẫn gửi `POST /submissions/1504/submit` -> **200**, chuyển `/student/submissions/1504`.
- Readback submission/module SUBMITTED nhưng **answers=[]**. Trang kết quả hiển thị “AI đang xử lý chấm điểm” và “Chưa có nội dung văn bản bài nộp cho phần này”.
- Không có request upload-url/PUT/upload-complete trong metadata browser; không có document READY. **Không kết luận backend chấp nhận/lưu TXT.** Xác nhận luồng hoàn tất bài vẫn tiếp tục sau submit-module 400 và không giữ bài làm. Chưa có response body 400, không gán nguyên nhân 400 là kiểm tra đuôi TXT.
- Source Writing có catch rồi tiếp tục submit phù hợp triệu chứng. Có thể chung root cause với lỗi mất bài PDF/text; không tự tách thêm root cause chỉ vì khác file.

## Về tính đúng đắn và những việc chưa làm

Các fixture tạo qua API có chủ sở hữu QA riêng; UI thực hiện thao tác; readback dùng submission/module ID của chính lượt UI. Đối chiếu Teacher/Student cho MCQ, detail/list cho mapping, grading/feedback cho fixture. Không dùng API để nộp hộ nhằm làm case Pass.

Chưa sửa logic ứng dụng, deploy, mở issue hoặc xác nhận database. Chưa retest thành công luồng nộp bốn kỹ năng, chưa kiểm tra backend vượt lượt, chưa xác nhận việc lọc/link của 033/034. Các lỗi 403 giữ kết luận policy trong READONLY-RECHECK-2026-10-19.md, không mở lại issue chỉ từ status code.

Ưu tiên: xác nhận artifact deploy; sửa public MCQ options, mapping/list DTO, filter grading; sửa luồng upload/submit để không tiếp tục khi module thất bại; sau đó chạy lại test bị chặn và full suite. **Chưa đạt DoD QA30.**

API audit bổ sung: `evidence-agent-2026-10-19/api-audit.json`; diagnostic source được giữ cùng thư mục để reviewer xem chính xác thao tác. Các file báo cáo gốc không sửa.
