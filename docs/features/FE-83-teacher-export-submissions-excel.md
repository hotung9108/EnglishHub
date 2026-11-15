# FE-83: Khắc Phục Và Tối Ưu Hóa Luồng Xuất File Excel Danh Sách Bài Nộp Giáo Viên

> **Mã tính năng:** `FE-83`  
> **Dự án:** EnglishHub  
> **Người thực hiện:** Phạm Minh Tuấn (`@tuanpham21105` / Trello: `@tunnguyn601`)  
> **Người kiểm thử (QA):** Zawn-Tsu  
> **Trello Card:** `[FE-83][ISSUE #154]` ([https://trello.com/c/z8Pj9pLK](https://trello.com/c/z8Pj9pLK))  
> **Tài liệu bàn giao:** `production_artifacts/pm_to_dev/FE-83-teacher-export-submissions-excel.md`  
> **GitHub Issue:** [#154](https://github.com/hotung9108/EnglishHub/issues/154)  
> **Nhánh Git dự kiến:** `fix/FE-83-teacher-export-submissions-excel`  
> **Nhánh đích (Target):** `develop`  

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN LỖI (ROOT CAUSE)

### 1.1. Hiện trạng lỗi (Issue #154)
- Khi giáo viên truy cập trang chi tiết bài tập (`TeacherAssignmentDetails.tsx`) và bấm nút **"Xuất danh sách (Excel)"**, tiến trình xuất tệp không tạo ra file tải về sau 60 giây, gây timeout hoặc không có phản hồi tải xuống trên trình duyệt.
- Bằng chứng QA-29 (`QA29-038=FAILED`): Giáo viên mở chi tiết bài tập -> bấm Xuất danh sách (Excel) -> kiểm tra thư mục tải xuống trong 60 giây không thấy tệp tin được sinh ra.

### 1.2. Phân tích kỹ thuật
- **Endpoint Backend**: `GET /api/v1/assignments/{id}/submissions/export` (hoặc qua `reportService`). Endpoint trả về stream nhị phân (Binary Blob) định dạng `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- **Nguyên nhân phía Frontend**:
  - Thiếu cờ `responseType: 'blob'` trong cấu hình gọi Axios khiến response bị parse thành chuỗi string hoặc JSON gây lỗi định dạng.
  - Xử lý tạo thẻ `<a>` tạm thời với `URL.createObjectURL(blob)` chưa thu hồi bộ nhớ (`URL.revokeObjectURL`).
  - Thiếu trạng thái loading và cơ chế chặn click kép (debounce/disable) khi người dùng bấm liên tục.
  - Thiếu cấu hình timeout hợp lý (cần xử lý timeout 10s và thông báo Toast rõ ràng nếu xảy ra lỗi).

---

## 2. QUY CHUẨN THỰC THI (TECHNICAL IMPLEMENTATION)

### 2.1. Chuẩn hóa API Client Call
Đảm bảo service gọi API xuất Excel trả về đúng Blob:
```typescript
export const assignmentService = {
  // ...
  exportSubmissionsExcel: async (assignmentId: number): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`/assignments/${assignmentId}/submissions/export`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      timeout: 15000
    });
    return response.data;
  }
};
```

### 2.2. Xử lý tải xuống file an toàn trong UI Component
```typescript
const [isExporting, setIsExporting] = useState<boolean>(false);

const handleExportSubmissions = async () => {
  if (isExporting || !assignmentId) return;
  setIsExporting(true);

  try {
    const blob = await assignmentService.exportSubmissionsExcel(Number(assignmentId));
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `submissions-assignment-${assignmentId}-${dateStr}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toastSuccess(isVi ? 'Xuất danh sách bài nộp thành công!' : 'Submissions exported successfully!');
  } catch (error) {
    console.error('Export submissions failed:', error);
    toastError(isVi ? 'Không thể xuất danh sách bài nộp. Vui lòng thử lại!' : 'Failed to export submissions. Please try again!');
  } finally {
    setIsExporting(false);
  }
};
```

---

## 3. CHECKLIST KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (DoD)
- [ ] Bấm nút "Xuất danh sách (Excel)" tải về file `.xlsx` thành công trong vòng 5 giây.
- [ ] Tên file tải về đúng chuẩn `submissions-assignment-{id}-{date}.xlsx`.
- [ ] Nút xuất hiển thị trạng thái loading spinner và bị disable trong lúc tiến trình đang chạy.
- [ ] Hiển thị Toast thông báo lỗi nếu API trả về mã lỗi hoặc timeout.
- [ ] Bổ sung unit test trong `TeacherAssignmentDetails.test.tsx` kiểm thử hành vi export.
- [ ] Project Doctor (`npm run build`) biên dịch 0 lỗi.
- [ ] Mở PR `fix/FE-87-teacher-export-submissions-excel` vào `develop`.
