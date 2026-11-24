# Handoff: FE-95 - Hoàn Thiện Tab Xem Bài Chữa & Đối Chiếu Đáp Án Chi Tiết (UC020, UC032)

- **Người thực hiện**: Trần Tiến Sơn (`Maloque18705` / `@tinsntrn`)
- **Người nhận bàn giao**: Tester (`Zawn-Tsu` / `@zawntsu`), Lead Reviewer (`hotung9108`)
- **Trello Card**: `[FE-95] Hoàn Thiện Tab Xem Bài Chữa & Đối Chiếu Đáp Án Chi Tiết (UC020, UC032)`
- **Nhánh phát triển**: `feat/FE-95-reading-highlighter-and-review-tab`
- **Target Branch**: `develop`

---

## 1. Nội Dung Bàn Giao

1. **Highlight Engine Cho Bài Đọc**:
   - Bôi đen văn bản trong đoạn đọc xuất hiện bảng màu nổi (Floating Palette).
   - Chọn màu Vàng (`#fef08a`), Xanh lá (`#bbf7d0`), hoặc Hồng (`#fbcfe8`).
   - Click trực tiếp vào highlight để xóa highlight đơn lẻ.
   - Nút "Xóa tất cả" trên Header bài đọc để xóa sạch toàn bộ highlight của bài.
   - Tự động lưu và tải lại từ `localStorage` (`eh_reading_highlights_${assignmentId}_${moduleId}`).
2. **Tab Xem Bài Chữa & Đối Chiếu Đáp Án (Review Mode)**:
   - Truy cập URL có `?mode=review` (hoặc nhấn từ Stepper / Overview sau khi nộp bài).
   - Banner thống kê điểm số: Số câu đúng, số câu sai, tỷ lệ phần trăm điểm.
   - Thanh Tab Bộ Lọc: `Tất cả`, `Đúng`, `Sai`, `Chưa làm` (click vào tab tự động chuyển câu hỏi tương ứng).
   - Ô câu hỏi:
     - Badge xanh lá `Đáp án đúng` trên phương án chuẩn.
     - Badge đỏ `Bạn đã chọn` trên phương án học sinh chọn sai.
     - Badge xanh `Đáp án đúng (Lựa chọn của bạn)` trên phương án học sinh chọn đúng.
     - Các phương án khác được làm mờ nhẹ (`is-dimmed`).
     - Hộp Giải thích chi tiết (`exam-explanation-card`) có icon bóng đèn, lời giải thích và trích dẫn dẫn chứng bài đọc.
   - Chặn chỉnh sửa đáp án và chặn nộp bài khi đang trong review mode.
   - Nút chuyển hướng `Quay lại tổng quan bài thi` ở chân trang.

---

## 2. Kịch Bản Kiểm Thử Dành Cho QA / Tester

| STT | Kịch bản kiểm thử | Các bước thực hiện | Kết quả mong đợi |
|---|---|---|---|
| 1 | Highlight 3 màu | Mở bài thi Reading, bôi đen 1 câu trong đoạn 1 -> Click chọn màu Vàng; bôi đoạn khác chọn Xanh lá; đoạn khác chọn Hồng. | Các đoạn văn bản đổi màu nền tương ứng thẻ `<mark>` (Vàng, Xanh lá, Hồng). |
| 2 | Xóa highlight | 1. Click chuột trái vào 1 đoạn đã highlight.<br>2. Nhấn nút "Xóa tất cả" trên Header bài đọc. | 1. Highlight được click lập tức biến mất.<br>2. Toàn bộ highlight còn lại bị xóa sạch. |
| 3 | Lưu trữ LocalStorage | Highlight vài đoạn văn bản -> F5 tải lại trang. | Toàn bộ highlight đã chọn vẫn hiển thị nguyên vẹn sau khi reload trang. |
| 4 | Xem bài chữa (Review Mode) | Hoàn thành bài thi hoặc truy cập URL `?mode=review`. | - Hiển thị Banner thống kê: Số câu đúng/tổng số câu, điểm số.<br>- Navigator đánh dấu màu xanh cho câu đúng, đỏ cho câu sai.<br>- Phương án đúng có badge `Đáp án đúng`.<br>- Lựa chọn của học sinh có badge `Bạn đã chọn`.<br>- Hiển thị khối Giải thích & Dẫn chứng. |
| 5 | Bộ lọc câu hỏi | Nhấn vào tab `Sai` hoặc `Đúng`. | Giao diện tự động nhảy sang câu hỏi sai hoặc đúng đầu tiên trong danh sách. |
| 6 | Khóa chỉnh sửa | Click vào các đáp án MCQ hoặc nhập vào ô Short Answer khi đang xem bài chữa. | Không thể thay đổi lựa chọn; nút nộp bài được thay bằng "Quay lại tổng quan bài thi". |

---

## 3. Lệnh Chạy Kiểm Thử Tự Động

```bash
# 1. Chạy bộ test mới cho Highlighter & Review Mode
npm --prefix frontend test:ui -- src/__tests__/components/StudentAssignmentReadingReview.test.tsx

# 2. Chạy bộ test hệ thống bài thi Quiz
npm --prefix frontend test:ui -- src/__tests__/components/StudentAssignmentQuiz.test.tsx

# 3. Kiểm tra TypeScript & Vite Build
npm --prefix frontend run build
```
