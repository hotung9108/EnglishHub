---
id: TASK-FE-FULLNAME-VALIDATION-RULES
title: "Apply User Full Name Validation Rules Across Frontend and Backend"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-30T19:20:00+07:00
updated_at: 2026-09-30T19:45:00+07:00
completed_at: 2026-09-30T19:45:00+07:00
priority: P0
tags: [frontend, backend, validation, user-profile, auth, full-name, regex, i18n]
---

# TASK-FE-FULLNAME-VALIDATION-RULES: Apply User Full Name Validation Rules

## 1. Context & Objective
Implement comprehensive validation rules for user full names (`fullName` / `name`) across both frontend forms and backend services:
- Ký tự cho phép: Chữ cái Unicode tiếng Việt có dấu, chữ cái Latin, dấu cách đơn giữa các từ, dấu gạch nối (`-`), và dấu nháy đơn (`'`).
- Ký tự cấm: Ký tự đặc biệt, ký tự thẻ HTML/script (chống XSS), chữ số (`0-9`), khoảng trắng thừa/liên tiếp.
- Giới hạn độ dài: 2 - 50 ký tự (chuẩn hóa tự động trim).

## 2. Implementation Summary
- **Frontend Utility (`frontend/src/utils/nameValidation.ts`)**:
  - `FULL_NAME_PATTERN`: `/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u`
  - `normalizeFullName`: trim và rút gọn khoảng trắng liên tiếp.
  - `validateFullName`: kiểm tra chi tiết theo từng lỗi (bắt buộc, quá ngắn/dài, có số, có ký tự đặc biệt, sai định dạng phân cách) với thông điệp song ngữ (VI/EN).
- **Frontend Pages Integration**:
  - `Profile.tsx`: Validate real-time và on-submit cho `userService.updateMyProfile`, hiển thị hướng dẫn và lỗi.
  - `Settings.tsx`: Validate real-time và on-submit cho form cài đặt thông tin cá nhân.
  - `Accounts.tsx`: Validate trong drawer tạo mới / chỉnh sửa tài khoản người dùng Admin.
  - `AddStudent.tsx` & `AddTeacher.tsx`: Validate thông tin họ tên học viên và giảng viên, chặn chuyển bước / gửi form nếu không hợp lệ.
- **Frontend i18n (`frontend/src/locales/auth.ts`)**:
  - Bổ sung `fullNameHint`, `fullNameRequired`, `fullNameTooShort`, `fullNameTooLong`, `fullNameNoDigits`, `fullNameNoSpecial`.
- **Backend Domain & Services**:
  - `FullNameValidator.java`: Domain validator chuẩn hóa và kiểm tra regex Unicode `\p{L}`, độ dài, chữ số, ký tự đặc biệt.
  - `UserProfileService.java`: Tích hợp validator trong `updateMyProfile`.
  - `AdminUserService.java`: Tích hợp validator trong `createUser` và `updateUser`.
  - `UserCrudService.java`: Tích hợp validator trong `create` và `update`.

## 3. Definition of Done (DoD) Fulfillment
- [x] Code compiles and runs without errors.
- [x] Unit tests:
  - Frontend: `frontend/src/api/__tests__/nameValidation.test.ts` (23 tests passing).
  - Backend: `FullNameValidatorTest.java`, `UserProfileServiceTest.java`, `AdminUserServiceTest.java` (100% passing).
- [x] Frontend build: `tsc -b && vite build` (0 errors).
- [x] Documentation & Task file updated in `.agents/tasks/fe-primary/done/`.
