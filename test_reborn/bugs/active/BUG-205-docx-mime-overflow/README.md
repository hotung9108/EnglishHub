# Writing ESSAY: nộp DOCX trả HTTP 500; MIME dài hơn giới hạn cột doc_mime_type

**Ngày cập nhật:** 21/10/2026  
**GitHub issue:** [#205 — Nộp DOCX trả HTTP 500](https://github.com/hotung9108/EnglishHub/issues/205) — đã đăng theo form cũ; bản công khai lược định danh và evidence nội bộ.  
**Severity đề xuất:** High/Major  
**Priority đề xuất:** P1, chờ PM xác nhận  
**Trạng thái xác minh:** **Đã tái hiện HTTP 500 DOCX trên API staging**, hai request submit cùng module đều lỗi; PDF đối chứng submit HTTP 200. Nguyên nhân giới hạn cột phù hợp source/log gốc, chưa kiểm tra trực tiếp log/DB của lượt chạy mới.

## 1. Tóm tắt

Backend hỗ trợ tài liệu DOCX cho module Writing dạng ESSAY và sử dụng MIME `application/vnd.openxmlformats-officedocument.wordprocessingml.document` dài **71 ký tự**. Tuy nhiên, migration và entity hiện khai báo cột `answers.doc_mime_type` dài tối đa **50 ký tự**.

Khi backend tìm thấy `essay.docx` trong storage và ghi MIME này vào schema còn giới hạn 50 ký tự, dữ liệu vượt giới hạn. Báo cáo gốc cung cấp log PostgreSQL `SQLState 22001` cùng log backend trả HTTP 500 trong thao tác insert vào bảng `answers`. Cấu trúc source phù hợp với chuỗi sự kiện đó.

**Kết quả độc lập:** DOCX upload HTTP 200, submit HTTP 500 hai lần, submission/module vẫn IN_PROGRESS. PDF ở bài riêng upload/submit đều HTTP 200, module SUBMITTED và tài liệu READY.

**Giới hạn:** Chưa đọc trực tiếp schema/log staging hoặc xác nhận commit đang triển khai. Log gốc là bằng chứng người báo lỗi cung cấp, không phải log thu từ lượt xác minh mới.

## 2. Môi trường và phiên bản

| Hạng mục | Giá trị |
| --- | --- |
| Frontend mục tiêu | `https://staging.hotung9108.me` |
| Backend mục tiêu | `https://api-staging.hotung9108.me/api/v1` |
| Source tham chiếu | `origin/develop`, commit `f85d5e94624c59bfc2118f0a36f3c990982e534a` |
| Commit thực tế trên staging | Chưa xác minh được |
| Cách kiểm tra độc lập | API trực tiếp bằng script; chưa chạy browser UI |
| Thời gian kiểm tra mới | 21/10/2026, 23:08:26–23:08:44 giờ Việt Nam (UTC+7) |
| Dữ liệu đã dùng | Lớp QA 164; bài DOCX 1572, PDF 1573; Student QA 698; dữ liệu tổng hợp |

## 3. Bằng chứng kiểm tra staging thực tế

**Lượt mới:** 21/10/2026, 23:08:26–23:08:44 giờ Việt Nam. Frontend HTTP 200, API không đăng nhập trả 401 và health trả 200. Đăng nhập QA Admin/Teacher/Student đều HTTP 200.

| Hạng mục | DOCX | PDF đối chứng |
| --- | --- | --- |
| Assignment ID | 1572 | 1573 |
| Assignment module ID | 2083 | 2084 |
| Submission ID | 1522 | 1523 |
| Submission module ID | 2694 | 2695 |
| Dung lượng file | 923 bytes | 3120 bytes |
| MIME length | 71 | 15 |
| PUT file lên storage | HTTP 200 | HTTP 200 |
| POST submit module | **500, 500** | **200** |
| Module sau submit (GET readback) | IN_PROGRESS sau cả hai lần | SUBMITTED |
| Submission tổng sau thao tác | IN_PROGRESS | IN_PROGRESS, chưa gọi nộp toàn bài |
| Metadata trả về từ submit | Không có answer thành công | docMimeType application/pdf; docUploadStatus READY |

Hai lần DOCX là **hai request trên cùng module sau khi readback xác nhận vẫn IN_PROGRESS**, không phải hai người dùng/hai file độc lập. Hai bài DOCX/PDF được tạo riêng trong lớp QA 164 để tránh PDF che candidate DOCX.

**Request lỗi cụ thể:**

```http
POST https://api-staging.hotung9108.me/api/v1/submission-modules/2694/submit
Content-Type: application/json
Authorization: Bearer <REDACTED>

{}
```

Response cả hai lần:

```http
HTTP 500

{"error":"Lỗi máy chủ."}
```

- Lần 1 bắt đầu lúc **23:08:35.122**, response hoàn tất lúc **23:08:36.475** giờ Việt Nam.
- Lần 2 bắt đầu lúc **23:08:37.023**, response hoàn tất lúc **23:08:37.819** giờ Việt Nam.
- PDF submit `/api/v1/submission-modules/2695/submit` lúc **23:08:42.769**, trả HTTP 200 và answer ID 984.
- Storage key DOCX: `submissions/1522/module-2694/essay.docx`.
- Storage key PDF: `submissions/1523/module-2695/essay.pdf`.

**Bằng chứng:**

- [Run API DOCX/PDF mới: timeline, response, readback, ID và SHA256 file](evidence-2026-10-21T16-08-26-182Z.json).
- [Kết nối staging đã phục hồi](availability.json).
- [Preflight lịch sử bị chặn HTTP 530 lúc 22:27](evidence-2026-10-21T15-27-30-815Z.json). Lỗi kết nối đã hết trong lượt mới, không phải trạng thái hiện tại.

Giữ lại lớp/bài QA, DOCX và PDF để dev kiểm tra. Không sửa dữ liệu bài tập thật, không gọi submit toàn bài hoặc chủ động yêu cầu AI chấm. Chưa chạy UI trình duyệt hoặc đọc log/DB staging.

## 4. Tiền điều kiện để tái hiện sau khi staging hoạt động

1. Tài khoản Student QA đang ACTIVE, thuộc lớp có bài tập QA đang PUBLISHED, trong thời gian làm bài và còn lượt nộp.
2. Bài tập có module `skill=WRITING`, `taskType=ESSAY`; submission và submission module đang `IN_PROGRESS`.
3. Có file DOCX hợp lệ. Bộ thử có [sample.docx](sample.docx), tài liệu tổng hợp không chứa dữ liệu người học.
4. Dùng module/lượt nộp mới, không có `essay.pdf` tồn tại tại storage key tương ứng. Backend dò PDF trước DOCX, nên PDF cũ có thể làm backend không chọn DOCX và che lỗi.
5. Schema môi trường kiểm tra chưa được mở rộng cột `answers.doc_mime_type`. Cần xác nhận riêng nếu source và DB có khác biệt.

## 5. Các bước tái hiện API tối thiểu

1. Teacher QA tạo và phát hành bài Writing ESSAY trong lớp QA; Student QA bắt đầu lượt nộp mới.
2. Student gọi:

   ```http
   POST /api/v1/submission-modules/{submissionModuleId}/document-upload-url
   Content-Type: application/json
   Authorization: Bearer <REDACTED>

   {"mimeType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
   ```

3. PUT nội dung file DOCX vào `uploadUrl` nhận được với cùng Content-Type. Xác nhận upload trả 2xx; storage key dự kiến kết thúc bằng `/essay.docx`. Không công khai presigned URL.
4. Gọi submit module:

   ```http
   POST /api/v1/submission-modules/{submissionModuleId}/submit
   Content-Type: application/json
   Authorization: Bearer <REDACTED>

   {}
   ```

5. Ghi nhận HTTP status/body; GET `/api/v1/submissions/{submissionId}` để đối chiếu trạng thái sau lỗi. Nếu có quyền đọc log/DB, đối chiếu timestamp, SQLState, câu lệnh lỗi và schema thực tế.
6. Dùng bài/module mới khác làm đối chứng PDF với MIME `application/pdf`; thực hiện cùng quy trình. Không upload PDF vào module DOCX đang dùng để tái hiện.

**Thao tác UI theo báo cáo gốc:** Student mở Writing ESSAY, đính kèm DOCX, bấm Nộp bài. Cần thêm network evidence và trạng thái UI khi kiểm tra lại. API tái hiện thành công cũng không thay thế kiểm chứng nút Submit và thông báo trên UI.

## 6. Actual và Expected

### Actual được tái hiện độc lập trên API staging

- DOCX upload HTTP 200, submit module HTTP 500 với body `{"error":"Lỗi máy chủ."}` ở cả hai request.
- GET readback sau từng request: submission 1522 và module 2694 đều IN_PROGRESS.
- PDF đối chứng upload/submit HTTP 200; module 2695 SUBMITTED và metadata tài liệu READY.
- Chi tiết, ID và timestamp nằm ở mục 3.

### Log trong báo cáo gốc — chưa thu lại log backend/DB ở lượt mới

- Người báo lỗi ghi nhận upload `essay.docx` thành công.
- Submit module trả HTTP 500, body `{"error":"Lỗi máy chủ."}`.
- Log được cung cấp ghi:

  ```text
  2026-10-21 11:56:27.331 UTC
  ERROR: value too long for type character varying(50)
  SQLState: 22001
  insert into answers (...,doc_mime_type,...) values (...)
  Completed 500 INTERNAL_SERVER_ERROR
  ```

- Thời điểm log gốc tương ứng **18:56:27 ngày 21/10/2026 giờ Việt Nam**. Log chưa kèm URL môi trường, request ID, submission ID hoặc giá trị bind, nên cần bổ sung để truy vết chắc chắn lần chạy gốc.
- Báo cáo gốc chưa có readback. Lượt API độc lập mới đã bổ sung readback trạng thái sau lỗi; chưa truy vấn DB trực tiếp.

### Expected

- File DOCX hợp lệ được hỗ trợ phải nộp thành công; endpoint submit module trả 2xx.
- Answer lưu được storage key và MIME đầy đủ; trạng thái tài liệu `READY`; module chuyển `SUBMITTED`.
- Trạng thái submission tổng tuân theo luồng nộp toàn bài; không yêu cầu endpoint nộp một module tự hoàn tất toàn bộ bài nhiều module.
- Nếu upload/lưu/nộp thất bại, UI không báo hoàn tất sai hoặc làm mất nháp trái yêu cầu nghiệp vụ.

## 7. Đối chiếu nguyên nhân với source

| Vị trí | Kết quả kiểm tra |
| --- | --- |
| `backend/src/main/resources/db/migration/V1__init_schema.sql:377` | `doc_mime_type VARCHAR(50)` |
| `backend/src/main/java/com/english_hub/core/infrastructure/persistence/entity/Answer.java:69` | `@Column(name = "doc_mime_type", length = 50)` |
| `backend/src/main/java/com/english_hub/core/modules/submission/application/service/SubmissionService.java`, `documentCandidates()` | DOCX MIME dài 71 ký tự; đã đếm lại bằng script |
| Cùng service, `submitFileModule()` | Tìm file storage theo thứ tự PDF rồi DOCX; truyền MIME của candidate tìm được vào Answer trước khi persist |
| `backend/src/main/java/com/english_hub/core/common/GlobalExceptionHandler.java`, `handleConflict()` | Lỗi DataIntegrityViolation không thuộc unique violation trả HTTP 500 và `Lỗi máy chủ.` |

**Kết luận review source:** Độ dài khai báo không tương thích với MIME DOCX mà service hỗ trợ. Cơ chế này giải thích hợp lý log gốc. Chỉ từ HTTP 500 ngoài API chưa đủ chứng minh cột gây lỗi; để xác nhận nguyên nhân trên staging cần log/schema hoặc kết quả kiểm chứng bổ sung tương ứng.

## 8. Ảnh hưởng và mức ưu tiên

- Chặn nộp module ESSAY khi backend chọn DOCX và DB vẫn giới hạn MIME 50 ký tự.
- Không khẳng định mọi học sinh hay mọi thao tác upload DOCX đều lỗi: còn phụ thuộc file được chọn, trạng thái bài và schema triển khai.
- PDF có MIME dài 15 ký tự, không vượt giới hạn này; lượt đối chứng staging mới đã nộp module thành công và trả metadata READY.
- Đề xuất Severity High/Major vì chặn một loại bài nộp được hỗ trợ; Priority P1 để PM cân đối phạm vi và thời điểm release.

## 9. Hướng sửa và tiêu chí retest đề xuất

**Cho dev xem xét:** Thêm migration mới mở rộng `doc_mime_type` (ví dụ VARCHAR(255) hoặc TEXT theo quy ước dự án), đồng bộ mapping entity. Không chỉ sửa V1 đã chạy trên DB hiện hữu; không cắt ngắn MIME để né lỗi. Chưa sửa code/schema trong lần kiểm tra này.

**Retest:**

- [ ] DOCX: upload 2xx → submit module 2xx → readback đúng MIME/storage key và `READY`/`SUBMITTED`.
- [ ] PDF đối chứng tiếp tục hoạt động.
- [ ] Migration áp dụng được trên DB hiện hữu và schema mới; không làm mất metadata cũ.
- [ ] Có integration test với PostgreSQL thực cho DOCX MIME dài 71 ký tự để bắt hồi quy giới hạn cột.
- [ ] Kiểm tra UI DOCX riêng: chọn file → upload → submit → thông báo và dữ liệu lưu khớp nhau.
- [ ] Bổ sung build staging, submission/module ID, timestamp và log đã che thông tin nhạy cảm vào kết quả cuối.

## 10. Công cụ và bàn giao

- [Script kiểm tra kết nối](check-availability.mjs): chỉ GET công khai, không tạo dữ liệu.
- [Script tái hiện API DOCX/PDF](verify-staging.mjs): staging-only; cần cấu hình tài khoản QA local có sẵn trong checkout QA30. Khi chạy đủ sẽ tạo lớp/bài QA riêng và giữ lại bằng chứng; không tự cleanup tài nguyên để tránh mất dấu kiểm tra. Không tự retry mutation khi timeout.
- [Bản báo cáo gốc được giữ nguyên](original-report.md).

Chạy từ workspace root khi staging hoạt động:

```powershell
node docs/testing/bugs/docx-mime-length/check-availability.mjs
node docs/testing/bugs/docx-mime-length/verify-staging.mjs --run
```

**Kết luận bàn giao hiện tại:** **Đã tái hiện lỗi nộp DOCX HTTP 500 trên API staging**, với upload thành công và PDF đối chứng nộp module thành công. Có thể chuyển dev xử lý kèm bằng chứng. Nguyên nhân giới hạn cột phù hợp source/log gốc; cần dev đối chiếu log/DB của module 2694 tại timestamp trên để xác nhận nguyên nhân runtime. Kiểm thử UI và retest sau sửa chưa thực hiện.
