# FE-59: Tối Ưu Hóa Toàn Diện Hiệu Năng Frontend & Khắc Phục Nghẽn Mạng Staging

> **Feature Key:** `FE-59`  
> **Dự án:** EnglishHub  
> **Người thực hiện:** Frontend Developer (`Maloque18705`)  
> **Mục tiêu:** Cắt giảm 80–94% lượng HTTP requests dư thừa, triệt tiêu bão N+1 requests, xóa bỏ thác tuần tự (waterfall), code splitting chia nhỏ bundle JS từ 1.14 MB xuống 153.5 kB, giúp web tải < 1s trên Staging.

---

## 1. TỔNG QUAN THAY ĐỔI
- **Tầng Core Networking & Cache:**
  - `frontend/src/api/core/cache.ts`: Quản lý in-memory RAM cache (TTL 30s) và gom in-flight requests (`dedupe`).
  - `frontend/src/api/core/client.ts`: Tự động xóa cache khi có mutation (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Debounce:**
  - `frontend/src/hooks/useDebounce.ts`: Delay 350ms ngăn chặn spam API khi gõ phím trên các ô tìm kiếm.
- **Hệ sinh thái Student:**
  - `StudentDashboard.tsx`: Khử N+1 submissions (giảm từ 50 requests xuống 3 requests).
  - `StudentAssignments.tsx`: Fetch 1 lần ở cấp trang, bỏ gọi `getAssignment(id)` bên trong vòng lặp.
  - `StudentWorkspace.tsx`: Tái sử dụng `sub.assignmentId`, xóa bỏ 100% lệnh gọi `getSubmission` cho từng bản nháp.
  - `StudentFeedback.tsx`: Cắt giảm còn 15 bài nộp mới nhất + chạy song song `Promise.all`.
  - `StudentGrades.tsx` & `StudentClasses.tsx`: Đặt `limit: 100`, khớp tên lớp chính xác theo mã bài tập.
  - `StudentClassDetails.tsx`: Bỏ fallback request thừa khi học sinh chưa nộp bài.
  - `StudentAssignmentOverview.tsx`, `StudentAssignmentListening.tsx`, `StudentAssignmentReading.tsx`, `StudentAssignmentSpeaking.tsx`, `StudentAssignmentWriting.tsx`, `StudentSubmissionResult.tsx`: Chuyển nạp module đề thi, câu hỏi và bài làm sang `Promise.allSettled` song song.
- **Hệ sinh thái Teacher:**
  - `TeacherAssignments.tsx`: Chuyển vòng lặp tuần tự `for...of` sang `Promise.all` song song giữa các lớp.
  - `TeacherDashboard.tsx`: Gom fetch members, assignments và submissions chạy đồng thời qua `Promise.all`.
  - `TeacherClasses.tsx`: Sử dụng `submissionService.listSubmissions({ classId: cls.id, limit: 100 })` duy nhất cho mỗi lớp.
  - `TeacherClassProgress.tsx`: Gom thác 4 bước tuần tự (`detail`, `members`, `assignments`, `subs`) thành 1 `Promise.allSettled`.
  - `TeacherAssignmentDetails.tsx`: Triệt tiêu thác tuần tự 18 bước thành 2–3 đợt chạy song song.
  - `TeacherSubmissionDetails.tsx`: Gom tải bài tập và bài nộp chạy đồng thời; ưu tiên lấy thông tin học sinh từ `routeState`.
  - `TeacherEditAssignment.tsx`: Gom tải bài tập, lớp học, module và câu hỏi chạy đồng thời qua `Promise.all`.
  - `TeacherDetails.tsx`: Truy vấn trực tiếp học viên/giảng viên theo ID (`getUserById`).
- **Code Splitting & Bundle:**
  - `frontend/src/App.tsx`: Chuyển 40 trang sang `React.lazy()` kết hợp `<Suspense>`.
  - `frontend/vite.config.ts`: Tách `vendor-react.js` riêng biệt. Initial bundle giảm từ 1.14 MB xuống 153.5 kB.

---

## 2. KẾT QUẢ KIỂM THỬ (QUALITY GATES)
1. `npm --prefix frontend run build`: **PASS (1.96s)**, 0 lỗi TypeScript, 0 chunks > 500 kB.
2. `npm --prefix frontend test`: **PASS 186/186 tests (100%)**.
3. `npm --prefix frontend run test:ui`: **PASS 16/16 test files, 841/841 tests (100%)**, coverage 84–95% (vượt chuẩn 80% DoD).
