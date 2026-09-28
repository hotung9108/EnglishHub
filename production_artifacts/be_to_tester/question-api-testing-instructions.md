# Question API (#32–#36) — Tester Handoff

Question API được implement theo bounded context Question:

- Domain model/repository port: `backend/src/main/java/com/english_hub/core/modules/question/domain/`
- Application commands/service: `backend/src/main/java/com/english_hub/core/modules/question/application/`
- JPA adapter/mapper: `backend/src/main/java/com/english_hub/core/modules/question/infrastructure/`
- REST controller/DTO: `backend/src/main/java/com/english_hub/core/modules/question/presentation/`

## API surface

Base URL: `/api/v1`.

1. `GET /modules/{moduleId}/questions`
   - Teacher phụ trách lớp và student là thành viên lớp được đọc.
   - Kết quả sắp tăng dần theo `orderIndex`.
   - Teacher nhận `correctAnswer`; student không nhận field `correctAnswer` ở thời điểm hiện tại.
2. `POST /modules/{moduleId}/questions`
   - Chỉ teacher phụ trách lớp được tạo.
   - `score` mặc định `1`; `orderIndex` phải lớn hơn `0` và không trùng trong module.
   - `correctAnswer` bắt buộc, theo contract định kiểu bên dưới.
   - `MULTIPLE_CHOICE` phải có đúng 4 options, mỗi option có `id`, `content`, `isCorrect`, và đúng 1 option đúng.
   - `SHORT_ANSWER` phải có `correctAnswer` dạng chuỗi không rỗng.
3. `GET /questions/{questionId}`
   - Teacher owner nhận đầy đủ `correctAnswer`; student member nhận bản đã ẩn đáp án.
4. `PUT /questions/{questionId}`
   - Chỉ teacher owner được cập nhật `content`, `correctAnswer`, `score`, `orderIndex`.
   - `questionType` không có trong request và được giữ nguyên.
   - Bỏ trống `correctAnswer` ⇒ giữ nguyên đáp án cũ (partial update).
   - Không được trùng `orderIndex` với question khác trong cùng module.
5. `DELETE /questions/{questionId}`
   - Chỉ teacher owner được xóa cứng.
   - Nếu `answers.question_id` đang tham chiếu, trả `400` với message:
     `Không thể xoá câu hỏi đã có câu trả lời.`

## `correctAnswer` contract (đã định kiểu)

`correctAnswer` là **sealed interface** với đúng 2 shape, chọn theo cấu trúc payload — **không có
field discriminator**. Endpoint #33 và #35 dùng chung contract này. Sai shape ⇒ `400`.

**MULTIPLE_CHOICE** — `{"options": [...]}`

```json
"correctAnswer": {
  "options": [
    { "id": 1, "content": "Option A", "isCorrect": true },
    { "id": 2, "content": "Option B", "isCorrect": false },
    { "id": 3, "content": "Option C", "isCorrect": false },
    { "id": 4, "content": "Option D", "isCorrect": false }
  ]
}
```

**SHORT_ANSWER** — `{"correctAnswer": "..."}`

```json
"correctAnswer": { "correctAnswer": "English" }
```

### Case `400` mới cần test

| Input | `error` trả về |
|---|---|
| `correctAnswer` không có `options` lẫn `correctAnswer` (VD `{"answer":"A"}`, `{}`) | `correctAnswer phải là {"options": [...]} cho MULTIPLE_CHOICE hoặc {"correctAnswer": "..."} cho SHORT_ANSWER.` |
| `correctAnswer` không phải object (chuỗi, mảng) | như trên |
| `options` có 3 hoặc 5 phần tử | `options phải có đúng 4 lựa chọn.` |
| `options` có 0 hoặc 2 option `isCorrect: true` | `options phải có đúng một lựa chọn đúng và id không được trùng.` |
| `options` có 2 option cùng `id` | `options phải có đúng một lựa chọn đúng và id không được trùng.` |
| `id` bằng `0` / âm / thiếu | `id phải là số nguyên dương.` / `id là bắt buộc.` |
| `content` rỗng hoặc toàn khoảng trắng | `content không được để trống.` |
| `isCorrect` thiếu | `isCorrect là bắt buộc.` |
| `SHORT_ANSWER` với `correctAnswer` rỗng / khoảng trắng | `correctAnswer không được để trống.` |
| `correctAnswer` là JSON `null` | `correctAnswer là bắt buộc.` |

Các case trên trả `400` **ở tầng controller** (Bean Validation + Jackson), không phải từ
`QuestionService` — service không còn inspect cấu trúc `correctAnswer` nữa.

### Tương thích ngược

API vẫn nhận khoá snake_case legacy (`correct_answer`, `is_correct`) bên trong `correctAnswer`.
Server tự ghi cột JSONB `correct_answer` ở dạng snake_case. Test round-trip: POST payload
camelCase ⇒ đọc DB thấy `is_correct`; POST payload snake_case ⇒ `201`.

## JSON naming

API dùng camelCase (`correctAnswer`, `isCorrect`). Persistence mapper chuyển đổi dữ liệu seed/DB snake_case (`correct_answer`, `is_correct`) sang camelCase khi trả response và ngược lại khi ghi JSONB.

## Automated checks

```bash
cd backend
./gradlew test --tests 'com.english_hub.core.modules.question.application.service.QuestionServiceTest'
./gradlew test --tests 'com.english_hub.core.modules.question.presentation.rest.QuestionControllerTest'
./gradlew test --tests 'com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.*'
./gradlew test --tests 'com.english_hub.core.modules.question.integration.QuestionApiIntegrationTest'
```

Integration test dùng PostgreSQL Testcontainers và bao phủ quyền truy cập, JSON naming, validation, update giữ nguyên type và FK reference khi delete.
