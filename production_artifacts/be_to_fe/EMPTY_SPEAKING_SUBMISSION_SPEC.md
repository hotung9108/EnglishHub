# Backend Handover Spec: Cho Phép Nộp Phần Thi Speaking Rỗng (Empty Submission)

**Người thực hiện**: Backend Developer  
**Đối tượng nhận**: Frontend Developers (`@fe-primary`, `@fe-secondary`)  
**Ngày cập nhật**: 2026-11-07  
**Phạm vi**: `POST /api/v1/submission-modules/{id}/submit` đối với phần thi **Speaking (RECORDING)**

---

## 1. Bối cảnh & Vấn đề đã giải quyết

### Trước đây:
- Khi học viên nộp phần thi **Speaking**, nếu chưa có file âm thanh ghi âm trên S3 (`audio && found == null`), Backend chặn cứng và trả về lỗi:
  ```json
  HTTP 400 Bad Request
  {
    "error": "Vui lòng tải lên file ghi âm trước khi nộp bài."
  }
  ```
- **Hệ quả**: Nếu học viên gặp sự cố micro, không có thiết bị thu âm hoặc không làm được bài nói, học viên sẽ bị kẹt vĩnh viễn ở phần thi Speaking (trạng thái `IN_PROGRESS`) và **không thể bấm nộp bài chung (Final Submit) của toàn bộ bài thi**.

### Thay đổi mới ở Backend:
- **Backend đã gỡ bỏ điều kiện chặn bắt buộc có file âm thanh**.
- Học viên giờ đây có thể gọi `POST /api/v1/submission-modules/{id}/submit` cho module Speaking ngay cả khi chưa thực hiện ghi âm.
- Backend sẽ:
  1. Kiểm tra S3. Nếu không tìm thấy file ghi âm:
     - Tạo bản ghi `Answer` với `audioStorageKey = null`, `audioMimeType = null`, `audioUploadStatus = UPLOADING`.
  2. Đánh dấu trạng thái của module Speaking là **`SUBMITTED`**.
  3. Cho phép học viên tiếp tục chuyển sang các phần thi tiếp theo hoặc bấm nộp bài toàn bộ đề thi (`POST /api/v1/submissions/{id}/submit`).

---

## 2. Hợp đồng API (API Contract)

### Endpoint:
`POST /api/v1/submission-modules/{submissionModuleId}/submit`

### Headers:
- `Authorization: Bearer <token_hoc_vien>`
- `Content-Type: application/json`

### Body khi nộp Speaking trống:
```json
{}
```
*(hoặc `{"answers": []}`)*

### Response trả về (HTTP 200 OK):
```json
{
  "message": "Đã nộp phần làm bài.",
  "submissionModuleId": 103,
  "status": "SUBMITTED",
  "answers": [
    {
      "id": 501,
      "questionId": null,
      "content": null,
      "audioStorageKey": null,
      "audioMimeType": null,
      "audioUploadStatus": "UPLOADING",
      "docStorageKey": null,
      "docMimeType": null,
      "docUploadStatus": null
    }
  ]
}
```

---

## 3. Hướng dẫn Frontend Dev khi Migrate Giao Diện

Hiện tại giao diện [`StudentAssignmentSpeaking.tsx`](file:///home/tuan-pham/Documents/School_Projects/EnglishHub/frontend/src/pages/StudentAssignmentSpeaking.tsx) vẫn đang giữ validation chặn cũ:
```typescript
if (!audioBlob) {
  setError('Vui lòng thực hiện ghi âm bài nói trước khi nộp bài.');
  return;
}
```

Khi đội FE tiến hành cập nhật giao diện, khuyến nghị xử lý như sau:

### Kịch bản 1: Học viên có ghi âm
- Vẫn thực hiện luồng bình thường:
  1. `await submissionService.uploadAudio(subModuleId, audioBlob, backendMimeType)`
  2. `await submissionService.submitModule(subModuleId, { audioStorageKey: storageKey })`

### Kịch bản 2: Học viên KHÔNG ghi âm (bỏ trống bài nói)
- Khi học viên bấm nút "Nộp bài", nếu `!audioBlob`:
  - Hiển thị Modal/Popup cảnh báo thân thiện:
    > **Xác nhận nộp bài không ghi âm**  
    > "Bạn chưa thực hiện ghi âm bài nói. Bạn có chắc chắn muốn nộp bài trống (nhận 0 điểm phần này) để tiếp tục không?"
  - Nếu học viên bấm **"Tiếp tục nộp bài"**:
    - Bỏ qua bước gọi API upload file.
    - Gọi thẳng:
      ```typescript
      await submissionService.submitModule(subModuleId);
      ```
    - Module Speaking sẽ chuyển sang trạng thái `SUBMITTED`, học viên có thể tiếp tục luồng chuyển câu / hoàn tất bài thi bình thường.
