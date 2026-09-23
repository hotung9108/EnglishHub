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
   - `MULTIPLE_CHOICE` phải có đúng 4 options, mỗi option có `id`, `content`, `isCorrect`, và đúng 1 option đúng.
   - `SHORT_ANSWER` phải có `correctAnswer` dạng chuỗi không rỗng.
3. `GET /questions/{questionId}`
   - Teacher owner nhận đầy đủ `correctAnswer`; student member nhận bản đã ẩn đáp án.
4. `PUT /questions/{questionId}`
   - Chỉ teacher owner được cập nhật `content`, `correctAnswer`, `score`, `orderIndex`.
   - `questionType` không có trong request và được giữ nguyên.
   - Không được trùng `orderIndex` với question khác trong cùng module.
5. `DELETE /questions/{questionId}`
   - Chỉ teacher owner được xóa cứng.
   - Nếu `answers.question_id` đang tham chiếu, trả `400` với message:
     `Không thể xoá câu hỏi đã có câu trả lời.`

## JSON naming

API dùng camelCase (`correctAnswer`, `isCorrect`). Persistence mapper chuyển đổi dữ liệu seed/DB snake_case (`correct_answer`, `is_correct`) sang camelCase khi trả response và ngược lại khi ghi JSONB.

## Automated checks

```bash
cd backend
./gradlew test --tests 'com.english_hub.core.modules.question.application.service.QuestionServiceTest'
./gradlew test --tests 'com.english_hub.core.modules.question.presentation.rest.QuestionControllerTest'
./gradlew test --tests 'com.english_hub.core.modules.question.integration.QuestionApiIntegrationTest'
```

Integration test dùng PostgreSQL Testcontainers và bao phủ quyền truy cập, JSON naming, validation, update giữ nguyên type và FK reference khi delete.
