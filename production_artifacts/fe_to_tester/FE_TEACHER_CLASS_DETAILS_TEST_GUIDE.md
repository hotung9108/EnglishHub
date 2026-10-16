# Frontend Test Guide: Clean & Schema-Aligned Teacher Class Details & Progress

**Author**: @fe-primary  
**Recipient**: @tester  
**Feature**: Teacher Class Details & Progress Page (`/teacher/classes/:id` & `/teacher/classes/:id/progress`)  
**Branch**: `develop`  
**Date**: 2026-10-16  

---

## 1. Feature Overview & Refactoring Summary
In accordance with backend schema alignment and UI/UX modernization guidelines, the Teacher Class Details & Progress page has been refactored to remove unnecessary badges, fake metrics, dummy subtitles, and mock syllabus/AI components:

1. **Removed Non-Schema / Unnecessary Elements**:
   - **Hero Card**:
     - Removed fake class code badge (`CLASS-XX`) - classes are identified by their real name.
     - Removed fake "Lịch cố định" subtitle - replaced with real class `level`, start/end dates, or teacher info when available.
     - Removed duplicate lesson turnout progress bar from the hero header.
   - **KPI Metrics Strip**:
     - Removed arbitrary "On-time submission rate" (`Math.round(* 0.9)`) and fake "Xuất sắc" tags.
     - Removed confusing "Band" prefix on 10-point scale scores and fake "Khá - Giỏi" subtitle tags.
     - Standardized to 4 real, backend-calculated metrics:
       1. **Tổng số học viên** (Total enrolled students)
       2. **Tỷ lệ hoàn thành** (Assignment completion rate)
       3. **Điểm trung bình lớp** (Class average score on 10-point scale)
       4. **Cần theo dõi & hỗ trợ** (Count of students with avg < 6.0 or turnout < 50%)
   - **Tabs**:
     - Removed **Tab 4 (Lộ trình & Buổi học / Syllabus)**: Backend has no syllabus or session schema; fake lesson sessions and materials counts were eliminated.
     - Refactored **Tab 3 to "Đánh giá 4 kỹ năng" (4-Skill Performance)**: Removed fake AI diagnostic block, hardcoded strength/weakness bullet tags, and fake tutoring invitation buttons. Now displays clean skill overview cards (Writing, Speaking, Reading, Listening) with average scores, completion rates, assignment counts, and graded counts.
   - **Gradebook Table**:
     - Removed fake "Chuyên cần" (Attendance) column (attendance is not tracked in the schema).
     - Removed fake `@englishhub.edu.vn` emails generated in the student cells.
     - Removed redundant icons (`Sparkles`, `CheckCircle2`, `AlertCircle`) inside table status chips; replaced with sleek, clean status badges.
   - **Student Profile Drawer**:
     - Removed fake attendance percentage and fake email subtitle.
     - Cleaned up score displays to standard 10-point scale (removed "Band" prefix).
     - Retained real evaluation submission via `studentEvaluationService.create`.

2. **Visual Consistency & Design Tokens**:
   - Colors synchronous with the primary brand palette (`var(--primary, #1b4d3e)`).
   - Clean, lightweight styles in `frontend/src/styles/teacher-class-details.css`.
   - 0 ESLint errors, 0 TypeScript errors, production build passing.

---

## 2. URLs and Routes
- **Primary URL**: `/teacher/classes/:id/progress`
- **Alias URL**: `/teacher/classes/:id`

---

## 3. Test Cases (Verification Steps)

| Test ID | Test Item | Action / Steps | Expected Result |
|---------|-----------|----------------|-----------------|
| **TC-CD-01** | Clean Header | Navigate to `/teacher/classes/:id/progress` | Displays clean class status pill (`Đang hoạt động` / `Đã hoàn thành`), class name, student count, level/dates (if present), and quick class switcher. No fake code badge or fake "Lịch cố định". |
| **TC-CD-02** | 4 Clean KPI Cards | Check the top 4 metric cards | Displays 4 truthful cards: Total Students, Completion Rate, Average Score (X/10), and Needs Support count. No fake "On-time rate" or "Band" labels. |
| **TC-CD-03** | 3-Tab Structure | Verify tab bar | Exactly 3 tabs: **Sổ điểm & Học viên**, **Danh sách Bài tập**, and **Đánh giá 4 kỹ năng**. Tab 4 (Syllabus) is absent. |
| **TC-CD-04** | Gradebook Table | View Tab 1 (Gradebook & Students) | Columns: Học viên, Tiến độ nộp, Writing, Speaking, Reading, Listening, Điểm TB, Trạng thái, Chi tiết. No fake "Chuyên cần" column. Status chips are clean with no cluttered icons. |
| **TC-CD-05** | Search & Filter | Filter by "Cần hỗ trợ", "Đạt chuẩn", "Vượt trội", or search student name | Table filters dynamically and pagination resets to page 1 without cascading render warnings. |
| **TC-CD-06** | Student Drawer & Evaluation | Click Eye icon on student row, enter feedback and submit | Opens drawer with clean student code, 4-skill breakdown, submission stats (no fake attendance), and saves evaluation via real API. |
| **TC-CD-07** | 4-Skill Performance | Click Tab 3 (Đánh giá 4 kỹ năng) | Displays 4 clean cards for Writing, Speaking, Reading, Listening with real average score, completion rate, assignment count, and graded count. No fake AI diagnosis box or fake tutoring invite banner. |
| **TC-CD-08** | Assignment List | Click Tab 2 (Danh sách Bài tập) | Shows assignment cards with skill badges, due date, submission rate, to-grade count, and avg score. No fake "HW-01" codes. |
| **TC-CD-09** | Export CSV | Click "Xuất CSV" | Downloads accurate CSV file with real student data, real scores, without fake attendance or fake emails. |

---

## 4. Modified Files
- `frontend/src/types/teacher-class.types.ts`
- `frontend/src/pages/TeacherClassProgress.tsx`
- `frontend/src/styles/teacher-class-details.css`
