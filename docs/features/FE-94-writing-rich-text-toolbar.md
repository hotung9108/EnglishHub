# Feature: [FE-94] Tích Hợp Rich Text Toolbar Hoạt Động Thật Cho Bài Thi Writing

## 1. Tổng quan
- **Mã công việc**: FE-94
- **Thẻ Trello**: `[FE-94] Tích hợp Rich Text Toolbar Hoạt Động Thật Cho Bài Thi Writing` (`6af7e31f23c8d470f5afffdd`)
- **Người thực hiện**: Trần Tiến Sơn (`@tinsntrn` / `Maloque18705` - Frontend Developer Primary)
- **Nhánh phát triển**: `feat/FE-94-writing-rich-text-toolbar`
- **Mục tiêu**: Kích hoạt thanh công cụ soạn thảo định dạng phong phú (Rich Text Toolbar) hoạt động thực sự trong bài làm Writing của Học viên (`StudentAssignmentWriting.tsx`), hỗ trợ bôi đen áp dụng định dạng (In đậm, In nghiêng, Gạch chân, Danh sách dấu đầu dòng, Danh sách đánh số, Căn lề, Hoàn tác/Làm lại, Phím tắt Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z, Ctrl+Y), tab Chuyển đổi Soạn thảo / Xem trước (MarkdownView), và bộ đếm từ chính xác theo thời gian thực (bỏ qua cú pháp định dạng).

---

## 2. Chi tiết kỹ thuật đã hiện thực
1. **Các thao tác định dạng văn bản**:
   - **In đậm (Ctrl+B)**: Bọc đoạn văn bản chọn bằng `**...**` hoặc mở bọc nếu đã in đậm.
   - **In nghiêng (Ctrl+I)**: Bọc đoạn văn bản chọn bằng `*...*` hoặc mở bọc nếu đã in nghiêng.
   - **Gạch chân (Ctrl+U)**: Bọc đoạn văn bản chọn bằng `<u>...</u>` hoặc mở bọc nếu đã gạch chân.
   - **Danh sách dấu đầu dòng**: Thêm/xóa tiền tố `- ` cho từng dòng trong vùng chọn.
   - **Danh sách đánh số**: Thêm/xóa tiền tố `1. `, `2. ` cho từng dòng trong vùng chọn.
   - **Căn lề**: Hỗ trợ căn trái và căn giữa (bọc khối `<div align="center">...</div>`).
   - **Hoàn tác (Undo - Ctrl+Z) & Làm lại (Redo - Ctrl+Y)**: Quản lý stack lịch sử `history` lưu trữ các trạng thái văn bản, tự động khôi phục con trỏ chuột.
2. **Tab Xem trước định dạng (Preview mode)**:
   - Cho phép học viên chuyển đổi qua lại giữa tab "Soạn thảo" và "Xem trước" (Preview) bằng component `MarkdownView`.
   - Vô hiệu hóa các nút định dạng khi ở chế độ xem trước để tránh nhầm lẫn.
   - Trạng thái trống (Empty state) thân thiện khi chưa có nội dung.
3. **Bộ đếm từ thời gian thực (Real-time Word Counter)**:
   - Tách logic sang `frontend/src/utils/writingEditor.utils.ts` (`countWritingWords`).
   - Loại bỏ các thẻ HTML và cú pháp markdown (như asterisks, list bullets) để tính toán số từ thực tế, công bằng và chính xác tuyệt đối.
4. **Bảo toàn dữ liệu & nộp bài**:
   - Lưu trữ bản nháp kèm đầy đủ định dạng vào `localStorage` (`eh_draft_writing_{id}`).
   - Đóng gói nội dung định dạng khi nộp bài và tải lên kho lưu trữ MinIO/S3 dưới dạng tệp văn bản.

---

## 3. Kiểm thử & Độ bao phủ (Coverage)
- **File test**: `frontend/src/__tests__/components/StudentAssignmentWriting.test.tsx`
- **Số lượng test**: 55/55 passed (100% pass)
- **Branch coverage**: > 80% (Statements: 90.18%, Branch: 80.15%, Funcs: 89.53%, Lines: 91.35%)
- **Lint & Build**: `npm run lint` đạt 0 errors, `npm run build` thành công 100%.
