# Hướng dẫn Kiểm thử Frontend: Trang Lỗi 404 (Not Found) & Lỗi 403 (Forbidden)

**Người thực hiện**: @fe-primary  
**Người nhận**: @tester  
**Tính năng**: Giao diện trang lỗi 404 (Không tìm thấy trang) & 403 (Không có quyền truy cập)  
**Branch / Commit**: `feature/error-pages-404-403`  
**Ngày hoàn thành**: 2026-09-27  

---

## 1. Tổng quan tính năng
Hệ thống EnglishHub đã được bổ sung bộ đôi trang thông báo lỗi tiêu chuẩn **404 (Not Found)** và **403 (Forbidden)** với phong cách tối giản, tinh tế, đồng bộ với Design System hiện tại:
1. **Thiết kế tối giản & Tập trung**:
   - Nền sáng sạch sẽ đồng bộ với toàn bộ hệ thống EnglishHub.
   - Thẻ hiển thị trung tâm chứa đồ họa biểu tượng trực quan (Compass cho 404, ShieldAlert cho 403) với hiệu ứng animation nhẹ nhàng.
   - Tiêu đề và thông điệp giải thích rõ ràng, súc tích.
   - **Duy nhất một nút hành động chính**: "Quay về trang chủ" (tự động điều hướng thông minh dựa theo vai trò người dùng: Admin -> `/admin/dashboard`, Teacher -> `/teacher/dashboard`, Student -> `/student/dashboard`, Khách vãng lai -> `/login`).
2. **Cơ chế Phân quyền (RBAC Protection)**:
   - Tích hợp trực tiếp vào [ProtectedRoute.tsx](file:///d:/Coding/EnglishHub/frontend/src/components/auth/ProtectedRoute.tsx): Khi tài khoản đã đăng nhập nhưng cố gắng truy cập đường dẫn vượt quá quyền hạn (ví dụ: Học viên truy cập `/admin/accounts`), hệ thống tự động chặn và chuyển hướng sang `/403`.
3. **Bắt lỗi URL toàn cục (Catch-all 404 Wildcard)**:
   - Định tuyến `*` trong [App.tsx](file:///d:/Coding/EnglishHub/frontend/src/App.tsx) bắt toàn bộ các đường dẫn không tồn tại hoặc sai chính tả và hiển thị trang 404.

---

## 2. Đường dẫn và Kịch bản kiểm thử

| STT | Kịch bản | URL kiểm thử | Kết quả mong đợi |
|:---:|:---|:---|:---|
| **TC-ERR-01** | Bắt lỗi URL không tồn tại (404) | `http://localhost:5173/duong-dan-khong-ton-tai` hoặc `http://localhost:5173/404` | Hiển thị trang 404 sạch sẽ, tiêu đề "Trang bạn tìm kiếm không tồn tại", chỉ có nút "Quay về trang chủ". |
| **TC-ERR-02** | Điều hướng từ 404 về trang chủ | Bấm nút "Quay về trang chủ" trên trang 404 | Điều hướng chính xác về trang đăng nhập hoặc dashboard tương ứng của tài khoản đang đăng nhập. |
| **TC-ERR-03** | Truy cập trang lỗi 403 trực tiếp | `http://localhost:5173/403` hoặc `http://localhost:5173/unauthorized` | Hiển thị trang 403 màu đỏ cam bảo mật, tiêu đề "Bạn không có quyền truy cập vào trang này", chỉ có nút "Quay về trang chủ". |
| **TC-ERR-04** | Tự động chuyển hướng RBAC (Student -> Admin) | Đăng nhập tài khoản Student (`student@eh.com`), sau đó gõ URL `http://localhost:5173/admin/accounts` | ProtectedRoute lập tức chặn truy cập và chuyển hướng tự động sang `/403`. |
| **TC-ERR-05** | Tính tương thích Responsive | Co nhỏ kích thước màn hình về Mobile (< 600px) | Card nội dung tự động căn chỉnh lề, co dãn typography và nút bấm co full-width gọn gàng, không bị tràn màn hình. |

---

## 3. Ảnh chụp thực tế đã kiểm thử

- **Giao diện 404 (Not Found)**:
  `page_404_clean_1790506515114.png`
- **Giao diện 403 (Forbidden)**:
  `page_403_clean_1790506580372.png`
- **Video phiên tương tác**:
  `capture_error_pages_1790506470041.webp`
