# Frontend Test Guide: Redesigned Teacher Class Details & 4-Skill Gradebook

**Author**: @fe-primary  
**Recipient**: @tester  
**Feature**: Redesigned Teacher Class Details & Progress Page (`/teacher/classes/:id` & `/teacher/classes/:id/progress`)  
**Branch / Commit**: `feature/teacher-class-details-redesign`  
**Date**: 2026-09-27  

---

## 1. Feature Overview
The Teacher Class Details and Progress page (`/teacher/classes/:id` and `/teacher/classes/:id/progress`) has been completely overhauled:
1. **Dynamic Class Switcher & Metadata**: Supports dynamic `:id` lookup (`ENG-IELTS-6.5A`, `ENG-GRAM-ADV`, `ENG-TOEIC-750`, `ENG-SPEAK-PRO`), syllabus progress bar (e.g. Session 14/24), target band badge, and export actions.
2. **4 KPI Metrics Strip**:
   - Assignment Completion Rate (88.3%)
   - On-time Submission Rate (91.5%)
   - Overall Class Band Average (Band 7.1)
   - Target Attainment Rate (87.5% - 21/24 students on track)
3. **4-Tab Navigation**:
   - **Tab 1: Gradebook & Roster**: Student table with individual 4-skill score chips (Writing, Speaking, Reading, Listening), attendance %, assignment progress, status chips (*Exceeding*, *On-track*, *Needs Support*), and quick search/filter pills.
   - **Tab 2: Class Assignments**: Card grid showing active homework with deadline countdowns, submission stats, and direct grading links.
   - **Tab 3: 4-Skill Analytics & AI Insights**: Class strengths, common weaknesses, AI recommendations, and at-risk student intervention alerts.
   - **Tab 4: Syllabus Timeline**: 24-session lesson tracking with attached materials and homework.
4. **Student Profile Drawer**: Interactive slide-out drawer displaying an individual student's complete 4-skill profile, attendance, recent feedback, and direct teacher messaging.
5. **Code Quality**: 100% elimination of inline styles and embedded style tags in JSX; pure CSS tokens in `src/styles/teacher-class-details.css`; 0 ESLint errors; 0 build errors.

---

## 2. URLs and Routes
- **Primary URL**: `http://localhost:5173/teacher/classes/ENG-IELTS-6.5A/progress`
- **Alias URL**: `http://localhost:5173/teacher/classes/ENG-IELTS-6.5A`
- **Global redirect**: `http://localhost:5173/progress` redirects to `/teacher/classes/ENG-IELTS-6.5A/progress`.

---

## 3. Test Cases (Verification Steps)

| Test ID | Test Item | Action / Steps | Expected Result |
|---------|-----------|----------------|-----------------|
| **TC-CD-01** | Header & Dynamic Class Lookup | 1. Navigate to `/teacher/classes`.<br>2. Click "Tiến độ & Bảng điểm" on class `ENG-IELTS-6.5A`. | Navigates to `/teacher/classes/ENG-IELTS-6.5A/progress`. Header displays code badge, target band `Band 6.5 - 7.5`, schedule, room, and syllabus bar (Session 14/24). |
| **TC-CD-02** | Class Switcher Dropdown | 1. Select `ENG-GRAM-ADV` in the class dropdown in the hero header. | URL updates to `/teacher/classes/ENG-GRAM-ADV/progress` and the dashboard dynamically reloads with `ENG-GRAM-ADV` metadata. |
| **TC-CD-03** | 4 KPI Cards | 1. Observe the top 4 KPI cards. | Correctly displays Completion Rate (88.3%), On-time Rate (91.5%), Average Band (Band 7.1), and Target Attainment (87.5%). |
| **TC-CD-04** | Gradebook Search & Filter Pills | 1. Type "Alice" in search box.<br>2. Clear search, click "Cần hỗ trợ" filter pill.<br>3. Click "Vượt trội".<br>4. Click "Tất cả". | - Search filters table immediately to Alice Johnson.<br>- "Cần hỗ trợ" displays 3 at-risk students with highlighted row styling.<br>- "Vượt trội" displays 3 exceeding students.<br>- "Tất cả" resets to all 24 students. |
| **TC-CD-05** | Student Profile Drawer | 1. Click the Eye icon on Alice Johnson's row. | Slide-out drawer opens from the right, displaying: Overall Band 8.2, 4-skill breakdown (W: 8.0, S: 8.5, R: 8.5, L: 8.0), attendance (100%), and teacher feedback note. Clicking "Đóng" closes the drawer. |
| **TC-CD-06** | Tab 2: Class Assignments | 1. Click Tab "Danh sách Bài tập lớp". | Displays grid of assignments with skill badges, deadline countdowns, submission rates, and "Chấm & Quản lý bài" action button. |
| **TC-CD-07** | Tab 3: 4-Skill Analytics & AI Insights | 1. Click Tab "Phân tích 4KN & AI Insights". | Displays 4 skill cards (Writing, Speaking, Reading, Listening) with class average vs benchmark, green class strength tags, red weakness tags, and the amber at-risk student intervention alert. |
| **TC-CD-08** | Tab 4: Syllabus & Sessions | 1. Click Tab "Lộ trình & Buổi học". | Displays 24-session lesson timeline with session badges, topic titles, dates, materials counts, attached homework chips, and status chips (Completed, Current, Upcoming). |
| **TC-CD-09** | Excel Export Action | 1. Click "Xuất Excel" button in hero header. | Toast notification appears: "Đang xuất bảng điểm Excel của lớp...". |
| **TC-CD-10** | Responsive & Zero Inline Styles | 1. Resize viewport from Desktop to Tablet/Mobile. | Layout wraps smoothly, tabs remain scrollable, and styling strictly follows design system in `teacher-class-details.css`. |

---

## 4. Relevant Files
- `frontend/src/types/teacher-class.types.ts`: TypeScript models for class details, gradebook, assignments, and syllabus.
- `frontend/src/styles/teacher-class-details.css`: Dedicated CSS stylesheet for Teacher Class Details.
- `frontend/src/pages/TeacherClassProgress.tsx`: Master component for redesigned class details.
- `frontend/src/App.tsx`: Registered routes for `/teacher/classes/:id`, `/teacher/classes/:id/progress`, and `/progress`.
- `frontend/src/main.tsx`: Imported `teacher-class-details.css`.
