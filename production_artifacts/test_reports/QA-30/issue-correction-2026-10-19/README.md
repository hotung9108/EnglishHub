# QA30 — Chỉnh lại issue theo mẫu QA29, 19/10/2026

**QA30 đang In Progress/chờ review lại bàn giao.** Tuyên bố hoàn tất trước đó chưa được người dùng chấp nhận; không dùng gói Final-Handoff hoặc comment Trello cũ làm bản bàn giao hiện hành.

Đã sửa trực tiếp 8 issue #173–#180 và tách 5 lỗi từng bị gộp thành #182–#186. Đây là chuẩn hóa phạm vi của các phát hiện đã có, **không phải 5 phát hiện mới hoặc 13 root cause độc lập**. Tất cả 13 issue đã GET readback và so khớp title/body/label bug với tài liệu đã chuẩn bị.

Mỗi issue có tiền điều kiện/dữ liệu, bước tái hiện đánh số, expected/actual, bằng chứng JSON đọc được, giới hạn và tiêu chí retest. Các ảnh/report vẫn là artifact tester, chưa được upload làm attachment GitHub. ZIP đi kèm có ảnh, evidence trích và file PDF mẫu để review.

Mẫu đối chiếu: [QA29 #149](https://github.com/hotung9108/EnglishHub/issues/149), [#151](https://github.com/hotung9108/EnglishHub/issues/151), [#159](https://github.com/hotung9108/EnglishHub/issues/159).

| Issue | Một hành vi lỗi | Testcase chính |
| --- | --- | --- |
| [#173](https://github.com/hotung9108/EnglishHub/issues/173) | [FE][Student Overview] Hiển thị giới hạn 3 lượt thay vì maxSubmissions từ API | QA30-007, QA30-045 |
| [#182](https://github.com/hotung9108/EnglishHub/issues/182) | [FE][Student Quiz] Câu SHORT_ANSWER hiển thị lựa chọn A/B/C/D thay vì ô nhập | QA30-013, QA30-014, QA30-015 |
| [#183](https://github.com/hotung9108/EnglishHub/issues/183) | [FE][Student Speaking] Nút nộp bật khi chưa có bản ghi âm | QA30-039 |
| [#174](https://github.com/hotung9108/EnglishHub/issues/174) | [FE][Student Writing] Nộp bài chỉ có văn bản xong nhưng nội dung bài luận bị mất | QA30-011 |
| [#175](https://github.com/hotung9108/EnglishHub/issues/175) | [FE][Student Writing] Nộp PDF xong nhưng bài nộp không có tài liệu được lưu | QA30-012 |
| [#184](https://github.com/hotung9108/EnglishHub/issues/184) | [FE][Student Writing] Vẫn hoàn tất bài nộp sau khi submit-module trả HTTP 400 | QA30-038 |
| [#176](https://github.com/hotung9108/EnglishHub/issues/176) | [FE][Student Speaking] Đã ghi và nộp bài nhưng bài nộp không có audio được lưu | QA30-016 |
| [#177](https://github.com/hotung9108/EnglishHub/issues/177) | [API/FE][Student Quiz] Câu trắc nghiệm chỉ hiện A/B/C/D, thiếu nội dung đáp án lựa chọn | QA30-025, QA30-026, QA30-027 |
| [#178](https://github.com/hotung9108/EnglishHub/issues/178) | [FE/API][Student Grades] Bảng điểm không hiển thị đúng bài đã chấm do nhầm submissionId với assignmentId | QA30-028 |
| [#179](https://github.com/hotung9108/EnglishHub/issues/179) | [FE][Student Feedback] Không có thẻ nhận xét chính thức dù grading đã COMPLETED | QA30-022 |
| [#185](https://github.com/hotung9108/EnglishHub/issues/185) | [FE][Student Overview] Lịch sử hiện Chờ chấm điểm dù cùng lượt đã có điểm chính thức 7.5/10 | QA30-024 |
| [#186](https://github.com/hotung9108/EnglishHub/issues/186) | [FE][Student Assignments] Bài đã có điểm chính thức không xuất hiện ở tab Đã có kết quả | QA30-030 |
| [#180](https://github.com/hotung9108/EnglishHub/issues/180) | [FE][Student Feedback] Nút xem đánh giá định kỳ mở kết quả bài không liên quan | QA30-021 |

## Những chỗ đã sửa so với bản cũ

- #173 chỉ còn sai giới hạn lượt/CTA; renderer SHORT_ANSWER chuyển #182, nút Speaking chưa ghi chuyển #183.
- #175 chỉ còn nộp PDF mất file; tiếp tục final-submit sau module HTTP 400 chuyển #184. QA30-038 chỉ chọn file; bằng chứng nộp 400→200 nằm ở diagnostic bổ sung, không gán thành bước đã chạy của case 038.
- #179 chỉ còn thiếu thẻ Feedback; lịch sử vừa có 7.5 vừa “Chờ chấm” chuyển #185, thiếu bài ở tab “Đã có kết quả” chuyển #186. Không nói bài nằm trong “Chưa bắt đầu” nếu không có bằng chứng.
- #178 chỉ ghi QA30-028 là testcase chính; 017/018 Blocked. Các case filter/search 019/031/032 đã Pass không được liệt kê là bug.
- #179 ghi 034 Blocked vì thiếu thẻ; không quy thành lỗi action đã xác minh. Filter 033 đã Pass không được liệt kê là bug.
- Chuyển bằng chứng chính sang full run cuối #1506/#1561/#1810 khi phù hợp; các retest đối chứng giữ rõ run và bộ ID riêng, không trộn số liệu giữa lượt.
- Không đổi kết quả test gốc **24 Pass / 18 Fail / 3 Blocked**; không chạy lại staging trong lượt sửa tài liệu. Report gốc/source snapshot chứa liên kết theo thời điểm chạy; dùng bảng này/corrected-issue-map.json để theo issue sau khi tách.

## Trạng thái và giới hạn

Chưa đánh dấu QA30 Done lại. Cần người dùng review cách mô tả và truy vết, kiểm tra các phần còn Blocked/coverage theo yêu cầu rồi mới kết luận bàn giao đạt. Chưa push/PR, chưa gửi Trello, chưa sửa app hoặc dữ liệu staging.

Kết nối GitHub connector đọc được nhưng bị 403 khi ghi. Thay đổi đã thực hiện bằng tài khoản Git hiện có **Zawn-Tsu**, không mở login mới, không lưu/in token. `publication-journal.json` và before/after lưu dấu vết thay đổi.
