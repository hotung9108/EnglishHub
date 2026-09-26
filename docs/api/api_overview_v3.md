# Tổng quan API — V3

*Bản V3 = áp dụng schema V6 (V4 → V5 → V6) lên api_overview_v2. Chi tiết các thay đổi xem Changelog bên dưới. Vẫn chỉ ở mức sương sương: method + endpoint + mục đích, chưa thiết kế request/response chi tiết.*

**Tổng: 62 endpoint** (giảm từ 63 của V2, do bỏ endpoint PATCH class_members không còn nghiệp vụ sau khi xoá member_type).

---

## Changelog áp dụng từ schema V5 + V6

| # | Thay đổi schema | Tác động API |
|---|---|---|
| A | `class_members`: bỏ cột `status` (ACTIVE/ENDED) + `ended_at` — rời lớp = xoá cứng (đã áp dụng từ V2, V5 confirm ở DB) | Không đổi thêm — đã xử lý ở V2 |
| B | `questions`: tách `correct_answer` ra cột riêng; `content` giờ là plain text đề bài thuần tuý (không còn JSON gộp) | Cập nhật ghi chú CỤM 4 + mô tả endpoint #34, #36 |
| C | `submission_modules`: bỏ cột `audio_play_count` — (đã xử lý ở V2 ở tầng API, V5 confirm ở DB) | Không đổi thêm |
| D | `class_members`: bỏ cột `member_type` (PRIMARY/SUPPLEMENTARY) và enum `class_member_type` — thành viên lớp không còn phân loại | Bỏ endpoint #19 (PATCH member — đổi loại/chuyển lớp). Cập nhật mô tả #18. **−1 endpoint** |

**Lưu ý về thay đổi B (ảnh hưởng thiết kế request):** Từ V5, `questions.content` là plain text đề bài; danh sách lựa chọn (options) và đáp án đúng được tách ra cột `correct_answer` (text lưu JSON). Khi tạo hoặc sửa câu hỏi, body phải gửi 2 trường riêng biệt: `content` (chuỗi text) và `correct_answer` (JSON — với MULTIPLE_CHOICE gồm danh sách options + is_correct, với SHORT_ANSWER là đáp án mẫu).

---

## Changelog từ các bản trước (giữ lại để tham chiếu)

| # | Thay đổi (từ V2) | Tác động |
|---|---|---|
| 1 | Tách cụm Auth và cụm User | Tổ chức lại 2 cụm, không đổi tổng số endpoint |
| 2 | Bỏ `register` + `register/verify` | Hệ thống không có tự đăng ký học viên — tài khoản chỉ tạo qua Admin (`POST /admin/users`). **−2 endpoint** |
| 3 | Tách API sửa thông tin cá nhân thành 2: sửa info riêng, đổi mật khẩu riêng | Tách trách nhiệm rõ ràng. **+1 endpoint** |
| 4 | Rời lớp (`class_members`) đổi thành xoá cứng | Đổi hành vi từ soft (set `ended_at`) sang xoá dòng thật |
| 5 | Bỏ API đếm lượt nghe audio | Không cần track `audio_play_count` nữa. **−1 endpoint** |

---

## CỤM 1 — Auth (3 endpoint)

| # | Method + Endpoint | Mục đích |
|---|---|---|
| 1 | POST /auth/login | Đăng nhập, trả access token + tạo refresh token |
| 2 | POST /auth/refresh | Cấp access token mới từ refresh token |
| 3 | POST /auth/logout | Set `revoked_at` cho refresh token đang dùng |

---

## CỤM 2 — User (8 endpoint)

| # | Method + Endpoint | Mục đích |
|---|---|---|
| 4 | GET /users/me | Xem thông tin bản thân (mọi role) |
| 5 | PUT /users/me | Sửa thông tin cá nhân (tên, phone, avatar...) |
| 6 | PATCH /users/me/password | Đổi mật khẩu riêng (tách khỏi sửa thông tin) |
| 7 | GET /admin/users | Admin xem danh sách + search user |
| 8 | POST /admin/users | Admin tạo tài khoản giáo viên/học viên |
| 9 | PUT /admin/users/{id} | Admin sửa thông tin 1 user |
| 10 | DELETE /admin/users/{id} | Admin xoá (hoặc soft-delete) user |
| 11 | PATCH /admin/users/{id}/status | Admin khoá/mở khoá tài khoản |

---

## CỤM 3 — Lớp học (8 endpoint)

*Từ V3: bỏ endpoint PATCH member (đổi loại/chuyển lớp) do không còn `member_type` và không có nghiệp vụ chuyển lớp riêng — rời lớp + vào lớp mới = DELETE #20 + POST #18. Thêm/xem danh sách thành viên cũng không còn trường `member_type` trong request/response.*

| # | Method + Endpoint | Mục đích |
|---|---|---|
| 12 | GET /classes | Danh sách lớp (lọc theo giáo viên, trạng thái) |
| 13 | POST /classes | Tạo lớp mới |
| 14 | GET /classes/{id} | Xem chi tiết 1 lớp |
| 15 | PUT /classes/{id} | Sửa thông tin lớp |
| 16 | DELETE /classes/{id} | Xoá lớp |
| 17 | GET /classes/{id}/members | Danh sách học viên trong lớp |
| 18 | POST /classes/{id}/members | Thêm học viên vào lớp (body chỉ cần `student_id`, không còn `member_type`) |
| 19 | DELETE /classes/{id}/members/{memberId} | Học viên rời lớp — xoá cứng |

---

## CỤM 4 — Cấu trúc bài tập: Assignment / Module / Question (17 endpoint)

*Từ V3 (schema V5): `questions.content` là plain text đề bài thuần tuý. Danh sách lựa chọn (options) và đáp án đúng được tách ra cột `correct_answer` (JSON dạng text) — không còn gộp chung vào `content` như V4. Khi tạo/sửa câu hỏi, client gửi 2 trường riêng biệt: `content` (text) và `correct_answer` (JSON). Vẫn không có endpoint riêng cho option.*

| # | Method + Endpoint | Mục đích |
|---|---|---|
| 20 | GET /classes/{id}/assignments | Danh sách bài tập của 1 lớp |
| 21 | POST /classes/{id}/assignments | Giáo viên tạo bài tập mới (status DRAFT) |
| 22 | GET /assignments/{id} | Xem chi tiết bài tập |
| 23 | PUT /assignments/{id} | Sửa thông tin bài tập |
| 24 | DELETE /assignments/{id} | Soft-delete bài tập |
| 25 | PATCH /assignments/{id}/status | Đổi trạng thái DRAFT → PUBLISHED → CLOSED |
| 26 | GET /assignments/{id}/modules | Danh sách module (kỹ năng) trong bài tập |
| 27 | POST /assignments/{id}/modules | Thêm module (Reading/Listening/Writing/Speaking) |
| 28 | GET /modules/{id} | Xem chi tiết 1 module |
| 29 | PUT /modules/{id} | Sửa module (đổi `ai_instruction`, `max_score`...) |
| 30 | DELETE /modules/{id} | Xoá module (cascade luôn questions) |
| 31 | POST /modules/{id}/audio | Upload file audio đề bài (Listening) lên R2 |
| 32 | GET /modules/{id}/questions | Danh sách câu hỏi trong module (kèm `correct_answer` nếu là trắc nghiệm) |
| 33 | POST /modules/{id}/questions | Tạo câu hỏi mới — gửi `content` (plain text) + `correct_answer` (JSON options + đáp án nếu trắc nghiệm) |
| 34 | GET /questions/{id} | Xem chi tiết câu hỏi (kèm `correct_answer`) |
| 35 | PUT /questions/{id} | Sửa câu hỏi — sửa/thêm/xoá option = gửi lại toàn bộ `correct_answer` |
| 36 | DELETE /questions/{id} | Xoá câu hỏi |

---

## CỤM 5 — Bài làm học viên: Submission / SubmissionModule / Answer (11 endpoint)

| # | Method + Endpoint | Mục đích |
|---|---|---|
| 37 | POST /assignments/{id}/submissions | Học viên bắt đầu 1 lần làm bài (tạo attempt mới) |
| 38 | GET /submissions/{id} | Xem chi tiết 1 lần làm bài |
| 39 | GET /submissions | Danh sách bài làm (lọc theo học viên/bài tập, cho giáo viên xem) |
| 40 | POST /submissions/{id}/submit | Học viên nộp bài chính thức (đổi status → SUBMITTED) |
| 41 | GET /submissions/{id}/modules | Danh sách phần làm bài theo từng module |
| 42 | GET /submission-modules/{id} | Xem chi tiết 1 phần làm bài (VD phần Listening) |
| 43 | POST /submission-modules/{id}/answers | Học viên nộp 1 câu trả lời |
| 44 | GET /submission-modules/{id}/answers | Danh sách câu trả lời trong 1 phần làm bài |
| 45 | GET /answers/{id} | Xem chi tiết 1 câu trả lời (kèm kết quả chấm tự động nếu có) |
| 46 | POST /answers/{id}/audio | Upload file ghi âm (Speaking) |
| 47 | POST /answers/{id}/document | Upload file bài viết .docx/.pdf (Writing) |

---

## CỤM 6 — Chấm điểm: Grading / Annotation / Change log (10 endpoint)

| # | Method + Endpoint | Mục đích |
|---|---|---|
| 48(Bỏ) | GET /submission-modules/{id}/grading | Xem bản chấm điểm của 1 phần làm bài |
| 49 | POST /submission-modules/{id}/grading/ai-analyze | Kích hoạt AI phân tích (Writing/Speaking) — chạy async |
| 50 | PUT /gradings/{id} | Giáo viên nhập/sửa điểm cuối (`final_score`, `final_feedback`) |
| 51(Bỏ) | GET /gradings/{id} | Xem chi tiết 1 bản chấm |
| 52(Bỏ) | GET /gradings | Danh sách bản chấm (lọc theo lớp/học viên/trạng thái) |
| 53 | GET /answers/{id}/annotations | Danh sách lỗi được đánh dấu (AI hoặc giáo viên) trong 1 câu trả lời |
| 54 | POST /answers/{id}/annotations | Giáo viên tự thêm 1 đánh dấu lỗi |
| 55 | PATCH /annotations/{id}/review | Giáo viên Accept/Reject 1 gợi ý lỗi do AI đưa ra |
| 56 | DELETE /annotations/{id} | Xoá 1 đánh dấu lỗi |
| 57 | GET /gradings/{id}/change-logs | Xem lịch sử các lần sửa điểm tay |

---

## CỤM 7 — Đánh giá tổng quan: Student Evaluation (5 endpoint)

| # | Method + Endpoint | Mục đích |
|---|---|---|
| 58 | GET /students/{id}/evaluations | Danh sách đánh giá tổng quan của 1 học viên (theo thời gian) |
| 59 | POST /students/{id}/evaluations | Giáo viên viết đánh giá mới cho học viên (trong ngữ cảnh 1 lớp) |
| 60 | GET /evaluations/{id} | Xem chi tiết 1 đánh giá |
| 61 | PUT /evaluations/{id} | Sửa nội dung đánh giá |
| 62 | DELETE /evaluations/{id} | Xoá đánh giá |

---

## Việc cần làm rõ trước khi viết docs chi tiết

1. **Xác nhận với PM** về việc bỏ lịch sử `class_members` (xoá cứng, không còn `status`/`ended_at`) — nếu PM đồng ý, ghi lại quyết định để tránh bị hỏi lại lúc bảo vệ đồ án.
2. Với việc bỏ tự đăng ký (thay đổi #2 từ V2), cần xác nhận `POST /admin/users` (#8) có cần OTP xác thực email cho tài khoản mới không, hay Admin tạo xong là dùng được ngay — ảnh hưởng tới việc có cần endpoint verify riêng hay không.
