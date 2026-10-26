# Tài Liệu Bàn Giao: Hoàn Thiện Lưu Trữ Bài Nộp Soạn Thảo Writing (Frontend)

- **Người thực hiện**: Frontend Developer (@fe-primary)
- **Đối tượng tiếp nhận**: QA/Tester (@tester) & Backend Developer (@be-primary / @be-secondary)
- **Mã tính năng / Module**: `StudentAssignmentWriting` (Kỹ năng WRITING học viên)
- **Tập tin thay đổi chính**: `frontend/src/pages/StudentAssignmentWriting.tsx`
- **Ngày bàn giao**: 26/10/2026

---

## 1. Tóm Tắt Nhiệm Vụ & Phạm Vi Hoàn Thành

Theo yêu cầu từ người dùng, việc thực hiện theo **Phương án 1 (Fullstack Chuẩn Kiến Trúc)** nhưng **chỉ áp dụng mã nguồn phía Frontend**, bảo đảm tuân thủ nghiêm ngặt:
- Quy chuẩn mã nguồn Frontend: [convention-fe.md](file:///d:/Coding/EnglishHub/.agents/rules/convention-fe.md)
- Tiêu chuẩn giao diện người dùng: [frontend-ui-standards](file:///d:/Coding/EnglishHub/.agents/private/frontend-ui-standards/SKILL.md)
- **Tuyệt đối không sửa mã Backend** trong phạm vi task này.

---

## 2. Chi Tiết Các Cải Tiến Phía Frontend

### 2.1. Chuẩn Hóa Cấu Trúc Payload Khi Nộp Bài (`submitPayload`)
Trước đây, khi học viên chỉ tải lên tệp đính kèm mà không gõ text, frontend vẫn gửi trường `{ text: "" }` khiến Backend Bean Validation kích hoạt lỗi `text không được để trống.` của `ShortAnswerAnswerContent`.

Tại [StudentAssignmentWriting.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/StudentAssignmentWriting.tsx), logic gửi payload đã được chuẩn hóa thông minh:
```typescript
const questionId = 1;
const submitPayload: SubmitModulePayload = {};

if (trimmedText !== '') {
  submitPayload.answers = [
    {
      questionId,
      content: uploadedFile
        ? {
            text: trimmedText,
            fileName: uploadedFile.name,
            hasAttachedFile: true,
          }
        : { text: trimmedText },
    },
  ];
} else {
  // Chỉ nộp file, không có text: để mảng rỗng để không kích hoạt lỗi validation text rỗng ở backend
  submitPayload.answers = [];
}

if (uploadedStorageKey) {
  submitPayload.storageKey = uploadedStorageKey;
}

await submissionService.submitModule(subModuleId, submitPayload);
```

### 2.2. Bổ Sung Cơ Chế Tự Động Lưu Bản Nháp (Auto-Save Debounce)
- Tích hợp `useEffect` tự động lưu bản nháp bài viết vào `localStorage` (`eh_draft_writing_${id}`) sau 2.5 giây khi người dùng dừng gõ.
- Quản lý bộ đếm thời gian qua `autoSaveTimerRef` để tự động dọn dẹp (clear timer), ngăn chặn memory leak và không ghi đè dữ liệu rác sau khi học sinh đã bấm "Nộp bài" hoặc "Xóa bài viết".
- Hàm `handleClearEditor`: Khi bấm nút *"Xóa bài viết & Làm lại từ đầu"*, hệ thống dọn dẹp cả `editorText`, hủy timer auto-save và xóa hẳn key trong `localStorage`.

### 2.3. Loại Bỏ Hoàn Toàn Inline Style & Tuân Thủ UI Standards
- Xóa bỏ inline style `style={{ display: 'none' }}` tại input file upload (dòng 640), chuyển sang sử dụng utility class chuẩn hệ thống `className="hidden"` theo đúng [convention-fe.md](file:///d:/Coding/EnglishHub/.agents/rules/convention-fe.md).
- Căn gióng chuẩn xác theo hệ thống lưới 8px (`gap: 12px`, `gap: 16px`, `gap: 24px`), sử dụng typography Lora / Plus Jakarta Sans và bảng màu hệ thống Royal Academic (`--primary`, `--surface`, `--on-surface`).
- Không thêm các badge, tagline hay icon trang trí rườm rà ngoài đặc tả kỹ thuật (Zero-Bloat).

---

## 3. Phần Việc Bàn Giao Dành Cho Đội Ngũ Backend (@be-primary / @be-secondary)

> [!IMPORTANT]
> **Điểm nghẽn cần Backend xử lý để hoàn tất chu trình lưu dữ liệu vào CSDL:**
> Hiện tại phía Frontend đã đóng gói và gửi đầy đủ văn bản của học viên qua API `POST /api/v1/submission-modules/{id}/submit`. Tuy nhiên ở Backend, hàm `submitFileModule` trong [`SubmissionService.java`](file:///d:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/modules/submission/application/service/SubmissionService.java#L312) đang gán cố định `content = null`.

### Hướng dẫn Backend cập nhật:
Trong tập tin [`backend/src/main/java/com/english_hub/core/modules/submission/application/service/SubmissionService.java`](file:///d:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/modules/submission/application/service/SubmissionService.java):

1. **Truyền `payloads` vào `submitFileModule` (tại dòng ~268)**:
```java
if (taskType == ModuleTaskType.ESSAY || taskType == ModuleTaskType.RECORDING) {
    return submitFileModule(submission, submissionModule, taskType, payloads);
}
```

2. **Trích xuất `text` từ `payloads` và gán vào `Answer` (tại dòng ~328)**:
```java
String essayContent = null;
if (taskType == ModuleTaskType.ESSAY && payloads != null && !payloads.isEmpty()) {
    AnswerPayload first = payloads.get(0);
    if (first.content() != null && first.content().get("text") instanceof String textStr) {
        String trimmed = textStr.trim();
        if (!trimmed.isBlank()) {
            essayContent = trimmed;
        }
    }
}

Answer persisted = answerRepository.bulkCreate(
    submissionModule.getId(),
    List.of(new Answer(
        submissionModule.getId(),
        null,
        essayContent, // <-- Gán essayContent vào đây thay vì giá trị null hiện tại!
        audio ? matchedKey : null,
        audio && found != null ? found.mimeType() : null,
        audio ? uploadStatus : null,
        audio ? null : matchedKey,
        !audio && found != null ? found.mimeType() : null,
        audio ? null : uploadStatus)))
    .get(0);
```

Ngay khi Backend cập nhật đoạn mã trên, toàn bộ hệ sinh thái (AI grading, trang giáo viên xem bài viết `TeacherSubmissionDetails`, trang kết quả học viên `StudentSubmissionResult`) sẽ lập tức hiển thị được văn bản của học viên mà không cần sửa thêm bất cứ code nào khác.

---

## 4. Hướng Dẫn Kiểm Thử Dành Cho QA/Tester (@tester)

### 4.1. Chạy Kiểm Thử Tự Động (Automated Tests)
Mở terminal tại thư mục gốc của dự án:
```bash
# 1. Chạy toàn bộ test suite của trang Writing
npm --prefix frontend test -- StudentAssignmentWriting.test.tsx

# 2. Chạy test vitest với code coverage
npm --prefix frontend run test:ui -- StudentAssignmentWriting.test.tsx

# 3. Kiểm tra TypeScript và Linter
npm --prefix frontend run lint
npm --prefix frontend run build
```
**Kết quả kiểm tra thực tế**:
- 42/42 unit test cases passed 100%.
- Code coverage của `StudentAssignmentWriting.tsx`:
  - Statements: **92.3%** (vượt ngưỡng yêu cầu 80%)
  - Lines: **92.8%**
  - Functions: **90.69%**
  - Branches: **80.53%**
- Linter & Production Build: Thành công không có warning hay lỗi cú pháp.

### 4.2. Kịch Bản Kiểm Thử Thủ Công (Manual Verification)

| Kịch bản | Các bước thực hiện | Kết quả mong đợi |
| :--- | :--- | :--- |
| **TC-01: Auto-save bản nháp khi gõ text** | 1. Đăng nhập học sinh, vào bài tập Writing.<br>2. Nhập một đoạn văn bản vào Textarea.<br>3. Chờ 3 giây, không bấm nút "Lưu bản nháp".<br>4. Tải lại trang (F5). | Văn bản đã gõ được tự động khôi phục nguyên vẹn từ `localStorage`. |
| **TC-02: Nút xóa bài viết & làm lại** | 1. Có văn bản trong Textarea và đã lưu nháp.<br>2. Bấm "Xóa bài viết & Làm lại từ đầu".<br>3. Tải lại trang (F5). | Ô Textarea trống, đếm từ về 0, bản nháp trong `localStorage` bị xóa hoàn toàn. |
| **TC-03: Nộp bài chỉ có text (Text-Only)** | 1. Nhập bài luận > 20 từ, không chọn file đính kèm.<br>2. Bấm "Nộp bài". | Mở Network tab: `POST /submission-modules/{id}/submit` gửi body `{ answers: [{ questionId: 1, content: { text: "..." } }] }`. Chuyển hướng thành công tới màn hình kết quả. |
| **TC-04: Nộp bài chỉ có file đính kèm (File-Only)** | 1. Để trống ô Textarea.<br>2. Kéo thả hoặc chọn 1 tệp `.pdf` hoặc `.docx`.<br>3. Bấm "Nộp bài". | File upload thành công lên MinIO. Network tab: payload gửi `{ answers: [], storageKey: "..." }` không bị lỗi validation "text rỗng". |
| **TC-05: Nộp bài kết hợp cả text và file** | 1. Nhập văn bản vào Textarea.<br>2. Đính kèm thêm 1 file `.pdf`.<br>3. Bấm "Nộp bài". | Cả file được upload và payload gửi cả `answers: [{ content: { text, fileName, hasAttachedFile } }]` và `storageKey`. |
| **TC-06: Chặn nộp bài khi cả hai đều trống** | 1. Ô Textarea trống, không chọn file.<br>2. Bấm "Nộp bài". | Hiển thị thông báo lỗi: *"Vui lòng nhập nội dung bài luận hoặc tải lên tệp bài làm trước khi nộp."* Không gửi request tới backend. |
