# QA30 — bàn giao bộ kiểm thử Học viên ngày 19/10/2026

> **Đính chính sau phản hồi người dùng:** tuyên bố hoàn tất trong tài liệu này chưa được chấp nhận; QA30 đã chuyển lại In Progress. Đây là bản lịch sử trước khi chuẩn hóa issue. Dùng [bản hiệu chỉnh hiện hành](issue-correction-2026-10-19/README.md): 8 issue đã viết lại, 5 hành vi đã tách riêng. Không đổi kết quả test gốc, không coi các bước Blocked đã đạt.

Full run cuối: `qa30-2026-10-19T11-31-19-695Z`, revision **v8-independent-checks**. UTC: 2026-10-19T11:31:19.696Z → 2026-10-19T11:42:29.003Z; giờ Việt Nam cộng 7 giờ.

**24 Pass / 18 Fail / 3 Blocked / 0 Aborted**, đủ 45 case, không case chưa chạy. Run status FAILED phản ánh lỗi ứng dụng, không đồng nghĩa task viết/chạy/bàn giao QA còn thiếu.

## Đã hoàn thiện

- 019, 031, 032 kiểm tra skill filter, tìm rỗng và class-label filter trực tiếp trên bảng điểm, độc lập lookup bài bị sai. Mapping/metadata vẫn do 028 kiểm tra; Pass filter không xác nhận mapping API đúng.
- 033 kiểm tra Reading/Writing trên thẻ feedback hiện có. Sự hiện diện finalFeedback vẫn do 022 kiểm tra; không dùng Pass filter để che lỗi mất thẻ.
- 030 kiểm tra cả tab kết quả và loại khỏi tab chưa bắt đầu, không dừng chờ trước nhánh thứ hai.
- 017/018/034 ghi PRODUCT_DEPENDENCY nếu thiếu dòng/thẻ để thao tác, liên kết primary case và issue, không tự tăng số bug action/score chưa thực hiện.
- 045 chờ lịch sử xong và thu rule/count/CTA; 038 dùng preview TXT thật trên staging. Diagnostic riêng đã thử nộp TXT: submit-module 400 nhưng UI vẫn nộp parent 200, answers rỗng; không chứng minh backend lưu TXT.
- 70 kiểm tra local đạt, bao gồm chờ loading, độc lập search, phân loại dependency và link issue trong HTML/evidence. Coverage phần trăm chưa đo, không tuyên bố đạt 80%.

## Blocked do sản phẩm

- QA30-017 → QA30-028: Cannot exercise this grade-row action: submission #1506 exists for assignment #1561, but UI cannot identify its row. See QA30-028 (grade metadata/mapping). https://github.com/hotung9108/EnglishHub/issues/178
- QA30-018 → QA30-028: Cannot exercise this grade-row action: submission #1506 exists for assignment #1561, but UI cannot identify its row. See QA30-028 (grade metadata/mapping). https://github.com/hotung9108/EnglishHub/issues/178
- QA30-034 → QA30-022: Cannot click official feedback action because its card is missing; see QA30-022. Expected exactly one official feedback from grading 1810; found 0 cards https://github.com/hotung9108/EnglishHub/issues/179

Đã tự động thử tới prerequisite và ghi bằng chứng. Không ghi Pass cho bước chưa đi tới; cũng không yêu cầu người dùng thao tác thủ công để vượt lỗi web. Retest các case này sau khi dev sửa issue chặn. Không giả dữ liệu UI hoặc nộp hộ bằng API để làm xanh kết quả.

## Issue đã bàn giao

| Issue | Case | Nhóm |
| --- | --- | --- |
| [#173](https://github.com/hotung9108/EnglishHub/issues/173) — [QA30][Staging] Student bundle dùng giới hạn 3 lượt, thiếu SHORT_ANSWER và khóa nộp Speaking | QA30-007, QA30-013, QA30-014, QA30-015, QA30-039, QA30-045 | deploy |
| [#174](https://github.com/hotung9108/EnglishHub/issues/174) — [QA30][Contract] Writing cho nộp văn bản nhưng ESSAY không giữ nội dung | QA30-011 | writing-contract |
| [#175](https://github.com/hotung9108/EnglishHub/issues/175) — [QA30][Writing] Nộp toàn bài tiếp tục sau lỗi module/upload và tạo kết quả rỗng | QA30-012, QA30-038 | writing-submit |
| [#176](https://github.com/hotung9108/EnglishHub/issues/176) — [QA30][Speaking] Nộp bản ghi qua UI không lưu audio READY | QA30-016 | speaking-upload |
| [#177](https://github.com/hotung9108/EnglishHub/issues/177) — [QA30][API contract] Response câu hỏi Student thiếu nội dung lựa chọn MCQ | QA30-025, QA30-026, QA30-027 | mcq-options |
| [#178](https://github.com/hotung9108/EnglishHub/issues/178) — [QA30][Grades] List thiếu assignmentId khiến bảng điểm tra nhầm assignment theo submission ID | QA30-017, QA30-018, QA30-019, QA30-028, QA30-031, QA30-032 | grade-mapping |
| [#179](https://github.com/hotung9108/EnglishHub/issues/179) — [QA30][Student] Feedback và trạng thái bỏ sót bài có grading COMPLETED khi parent còn SUBMITTED | QA30-022, QA30-024, QA30-030, QA30-033, QA30-034 | grading-status |
| [#180](https://github.com/hotung9108/EnglishHub/issues/180) — [QA30][Feedback] Evaluation định kỳ điều hướng tới kết quả bài không liên quan | QA30-021 | evaluation-link |

8 issue là nhóm triệu chứng đã review, không khẳng định 8 root cause. #173 cần xác nhận artifact deploy trước khi sửa logic đã có trong source. #174 là contract gap. #177 cần public options không lộ đáp án. Các 403 không tạo issue trùng; ai-suggestion đã có QA29 #153.

## Evidence và giới hạn

- Report gốc: `test/selenium/reports/qa30-2026-10-19T11-31-19-695Z/report.html`; cùng thư mục có JSON/JUnit/TRIAGE, fixture-ledger/source-snapshot, ảnh/DOM/text và API/network.
- `execution-summary.json`: tóm tắt để lưu repo, giữ test/status/dependency/issue link, không chứa credential.
- `issues/published.json`, `.agents/tasks/bugs/BUG-QA30-*.yaml`: liên kết ngược test case và vai trò xử lý.
- `AGENT-RETEST-2026-10-19.md`, `READONLY-RECHECK-2026-10-19.md`: GET đối chiếu và diagnostic đã review. Report lịch sử không sửa.
- Agent đã được người dùng cho phép chạy QA tự động. Không sửa app/deploy, không push/PR hoặc gửi Trello trong lượt này.
- Fail/Blocked còn lại là tình trạng sản phẩm; task QA bao gồm bộ test, chạy, review, issue và bàn giao đã hoàn tất. Không tuyên bố ứng dụng hết bug, test bị chặn đã Pass hoặc bao phủ các tính năng ngoài phạm vi (deadline/nhiều module/pagination toàn dữ liệu/mic vật lý).

## Nội dung báo hoàn thành

“QA30 hoàn tất viết và chạy 45 case Selenium luồng Học viên trên staging, lưu report và bàn giao 8 issue có truy vết test case. Các Fail/Blocked do sản phẩm được ghi rõ; retest sau khi dev xử lý. Hoàn thành QA không đồng nghĩa ứng dụng đạt toàn bộ kiểm thử.”
