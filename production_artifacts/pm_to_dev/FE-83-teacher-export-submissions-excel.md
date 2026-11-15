# SPECIFICATION HANDOFF: [FE-83] Khắc Phục Và Tối Ưu Hóa Luồng Xuất File Excel Danh Sách Bài Nộp Giáo Viên

> **Mã nhiệm vụ:** `[FE-83]`  
> **GitHub Issue:** [#154](https://github.com/hotung9108/EnglishHub/issues/154)  
> **Trello Card:** `[FE-83][ISSUE #154]` ([https://trello.com/c/z8Pj9pLK](https://trello.com/c/z8Pj9pLK))  
> **Cột trạng thái:** `Review`  
> **Người thực hiện:** Phạm Minh Tuấn (`@tuanpham21105` / Trello: `@tunnguyn601`)  
> **Người kiểm thử (QA):** Zawn-Tsu  
> **Nhánh Git:** `fix/FE-83-teacher-export-submissions-excel`  
> **Target Branch:** `develop`  
> **Tài liệu đặc tả:** [`docs/features/FE-83-teacher-export-submissions-excel.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/features/FE-83-teacher-export-submissions-excel.md)  

---

## 1. MÔ TẢ NHIỆM VỤ
- Khắc phục lỗi xuất file Excel danh sách bài nộp của học sinh trong màn hình chi tiết bài tập giáo viên (`TeacherAssignmentDetails.tsx`).
- Trước đây hệ thống không tạo tệp sau 60 giây (Issue #154).
- Nhiệm vụ: Tối ưu gọi API với `responseType: 'blob'`, kích hoạt tải file trình duyệt và hiển thị loading indicator.

---

## 2. CÁC BƯỚC THỰC HIỆN CHO DEVELOPER (PHẠM MINH TUẤN)

### Bước 1: Tạo nhánh Git
```bash
git checkout develop
git pull origin develop
git checkout -b fix/FE-87-teacher-export-submissions-excel
```

### Bước 2: Kiểm tra Service API & Export Handler
Tại `frontend/src/pages/TeacherAssignmentDetails.tsx` (hoặc `frontend/src/api/services/assignment.service.ts`):
1. Đảm bảo cấu hình gọi Axios có `responseType: 'blob'`.
2. Tạo hàm tải blob về máy client và giải phóng object URL.
3. Thêm cờ `isExporting` để disable nút và hiển thị spinner.

### Bước 3: Chạy Kiểm Thử & Quality Gates
```bash
npm --prefix frontend test
npm --prefix frontend run build
```

### Bước 4: Mở PR
Mở Pull Request `fix(FE-87): fix teacher export submissions excel file download timeout` vào nhánh `develop`, chuyển thẻ Trello sang `Review` và tag `@Zawn-Tsu`.
