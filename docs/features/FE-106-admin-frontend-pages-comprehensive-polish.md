# Feature Specification: FE-106 Admin Frontend Pages Comprehensive Polish

> **Feature ID:** FE-106  
> **Module:** Admin Frontend System  
> **Status:** Ready for Development  
> **Assignee:** Trần Tiến Sơn (`Maloque18705`)  
> **Tester:** Nguyễn Văn Tú (`Zawn-Tsu`)  
> **Target Branch:** `develop`  
> **Sprint:** 10  
> **Deadline:** 22/11/2026 23:59:00 (UTC+7)  

## 1. Business Objective
Rà soát, chuẩn hóa giao diện, sửa lỗi tương tác và hoàn thiện trải nghiệm người dùng (UI/UX) trên toàn bộ các trang thuộc phân hệ Quản trị viên (Admin Frontend: Dashboard, Reports, Accounts, Classes, Settings, Grading Audit Logs).

## 2. Technical Scope
- **Trang Quản trị:** Dashboard, Reports, Accounts, Profile, Classes, ClassDetails, Teachers, Students, AdminSettings, AdminGradingAuditLogs.
- **Styling & CSS:** Đồng bộ `admin-modern.css`, responsive layout, empty states, loading skeleton, badge trạng thái.
- **Tích hợp API:** Nối API đổi mật khẩu Admin, API Cài đặt hệ thống, bộ lọc thời gian báo cáo, xuất CSV tiếng Việt.
- **Tests:** Viết bổ sung Vitest unit tests cho các component Admin đạt coverage >= 80%.

## 3. Definition of Done
1. 100% trang Admin hoạt động trơn tru không lỗi console.
2. Loại bỏ mock data / local storage tạm bợ.
3. Project Doctor pass 100% Quality Gates.
4. Unit tests pass 100% và coverage >= 80%.
5. Pull Request develop linked.
6. Tester nghiệm thu trên Staging.
