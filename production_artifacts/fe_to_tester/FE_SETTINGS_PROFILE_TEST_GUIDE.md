# QA / Test Guide: Personal Settings & Profile Page (All Roles)

**Component**: Settings & Profile (`src/pages/Settings.tsx`, `src/pages/Profile.tsx`, `src/styles/settings.css`)  
**Assignee**: @fe-primary (Maloque18705)  
**Target Roles**: Admin, Teacher, Student  

---

## 1. Scope of Implementation
- **Unified & Role-Adaptive Settings**: Dedicated settings and profile interface adapting automatically to Admin, Teacher, and Student roles with custom identity metadata, status metrics, and operational preferences.
- **Modern Clean SaaS Hero Card**: Displays user avatar with initials or image, verified status pill, role badge, copyable identifier code, contact row, and role-tailored stats widget.
- **4 Comprehensive Tabs**:
  1. **Personal Profile (`profile`)**: Edit Full Name, Email, Phone, Role-specific attributes (Admin: Department; Teacher: Specialization, Bio, Online Room; Student: Class, Target Band, School, DOB) with preset avatars and form validation.
  2. **Account Security (`security`)**: Change Password with real-time password strength meter & criteria checklist, Two-Factor Authentication (2FA) toggle, Active Sessions list with "Revoke Other Devices" action.
  3. **Notifications (`notifications`)**: Role-categorized toggle switches (Admin: Security & system errors; Teacher: Submissions & deadlines; Student: New assignments & grading results).
  4. **System Preferences (`preferences`)**: System language (VI/EN synchronized with `LanguageContext`), Theme selector (Light / Dark / Auto), Reading font size, and role-tailored operational toggles (AI grading assist, daily study goal, auto-play audio, IPA phonetics).
- **Navigation & RBAC Integration**:
  - `App.tsx`: Routes registered for `/admin/settings`, `/teacher/settings`, `/student/settings`, and `/profile`.
  - `Sidebar.tsx`: Dynamic footer settings link according to active user role.
  - `TopBar.tsx`: Interactive user avatar chip with dropdown menu linking to Profile, Security, Preferences, and Logout.

---

## 2. Test Scenarios

### Test Case 1: Route Access & Role Specialization
1. Log in as **Admin** (`admin@eh.com` / `password123`) $\rightarrow$ Navigate to `/admin/settings`.
   - Verify Hero Card displays "AD-2026-001", Department "Ban Quản trị Hệ thống", 2FA stat, and Dark Slate role accent.
2. Switch to **Teacher** via sandbox toolbar or login as `teacher@eh.com`.
   - Verify Hero Card displays "GV-2026-088", Specialization "IELTS Academic & Speaking/Writing", AI Assistant stat, and Emerald accent.
3. Switch to **Student** via sandbox toolbar or login as `student@eh.com`.
   - Verify Hero Card displays "HV-2026-402", Class "IELTS Intensive K24", Target Band "7.5+ IELTS", and Royal Blue accent.

### Test Case 2: Profile Update & Avatar Presets
1. On the **Profile** tab, click an avatar preset or change the Full Name.
2. Click **Lưu thay đổi** (Save Changes).
3. Verify toast notification appears: *"Đã lưu thay đổi hồ sơ thành công!"*.
4. Verify updated name and avatar reflect immediately in the TopBar and Hero Card.

### Test Case 3: Password Strength & Validation
1. Switch to **Bảo mật tài khoản** (Security) tab.
2. In **Mật khẩu mới** (New Password), type `abc` $\rightarrow$ verify indicator shows **Yếu (Weak)** and red progress bar.
3. Type `Abc12345!` $\rightarrow$ verify indicator shows **Rất mạnh (Strong)** and all checklist criteria turn green.
4. Click **Cập nhật mật khẩu** $\rightarrow$ verify success confirmation.

### Test Case 4: TopBar Dropdown & Mobile Responsiveness
1. Click the user profile chip in the top right TopBar.
2. Verify dropdown menu displays user name, email, and direct links to Profile, Security, Preferences, and Logout.
3. Resize viewport to $< 768px$ $\rightarrow$ verify hero card and grid columns stack cleanly without horizontal overflow.
