# Feature Specification: FE-99 / ISSUE #337 Teacher Profile Specialization Admin RBAC

> **Feature ID:** FE-99 / Issue #337  
> **Module:** Teacher Profile & Admin Teacher Management  
> **Status:** Ready for Development  
> **Assignee:** Trần Tiến Sơn (`Maloque18705`)  
> **Tester:** Nguyễn Văn Tú (`Zawn-Tsu`)  
> **Target Branch:** `develop`  
> **Sprint:** 10  
> **Deadline:** 20/11/2026 23:59:00 (UTC+7)  

## 1. Business Objective
Khắc phục lỗi Issue #337 (BUG-02): Dữ liệu chuyên môn giáo viên bị hardcode tĩnh (TESOL, IELTS 8.0+) mà không hiển thị giá trị thật từ CSDL/API. Chuẩn hóa quy tắc phân quyền: Giáo viên KHÔNG ĐƯỢC TỰ SỬA chuyên môn; Quản trị viên (ADMIN) ĐƯỢC TOÀN QUYỀN CHỈNH SỬA chuyên môn của giáo viên theo UC006.

## 2. Technical Scope
- `Teachers.tsx` & `TeacherDetails.tsx`: Hiển thị `specialization` từ dữ liệu thật, xóa bỏ badge TESOL/IELTS tĩnh.
- `Profile.tsx` & `Settings.tsx`: Khóa trường `specialization` ở chế độ `readOnly` / `disabled` đối với Giáo viên.
- Admin Teacher Drawer/Modal: Cung cấp ô nhập liệu cho phép Admin cập nhật `specialization` cho giáo viên.
- Hiển thị đúng nhãn `LOCKED` ("Đã khóa").

## 3. Definition of Done
1. Chuyên môn giáo viên hiển thị dữ liệu thật từ API.
2. Giáo viên không thể tự sửa chuyên môn (read-only).
3. Admin chỉnh sửa chuyên môn thành công.
4. Trạng thái LOCKED hiển thị chuẩn.
5. Project Doctor pass 100%.
6. Pull Request develop linked.
