# [FE-82] Hướng dẫn kiểm thử: Chấm điểm đa module, thang điểm động, polling AI Speaking & Hướng dẫn nhận xét

- **Task Trello**: `[FE-82] Chuẩn hóa chấm điểm đa module: Bộ nhớ nháp, thang điểm động, AI Speaking polling & Hướng dẫn nhận xét`
- **Trello URL**: https://trello.com/c/M2O14pG1
- **Branch**: `feat/FE-82-teacher-multimodule-grading-and-feedback-guide`
- **Người thực hiện (Assignee)**: Tiến Sơn Trần (`tinsntrn`)
- **Người kiểm thử (QA/Tester)**: @tester (`Zawn-Tsu`)

---

## 1. Mục tiêu & Các tính năng đã hoàn thiện

### A. Giao diện chấm điểm giáo viên (`TeacherSubmissionDetails.tsx`)
1. **Thang điểm tối đa động (`dynamicMaxScore`)**:
   - Thay thế hoàn toàn giá trị hardcode `10` bằng thang điểm thực tế lấy từ `gradingDetail.maxScoreSnapshot`, `activeModule.grading.maxScoreSnapshot`, hoặc `module.maxScore` (fallback về 10 nếu không có).
   - Input điểm hỗ trợ `max={dynamicMaxScore}`, placeholder và label hiển thị tỉ lệ thực tế (ví dụ: `/ 3`, `/ 10`).
   - Validate form báo lỗi chuẩn xác theo thang điểm: `Điểm số không hợp lệ (thang 0.0 - {dynamicMaxScore})!`.

2. **Cơ chế lưu nháp đa module (In-Memory Drafts & LocalStorage Persistence)**:
   - Khi giáo viên chấm bài tập gồm nhiều module (Writing, Speaking, Reading, Listening), nếu nhập điểm hoặc nhận xét ở module hiện tại rồi chuyển tab sang module khác mà chưa lưu, toàn bộ dữ liệu (điểm số, nhận xét) được lưu tự động vào `moduleDraftsRef`.
   - Hiển thị badge trực quan **"Nháp"** (`tsd-module-tab-draft-badge`) trên tab của module có dữ liệu chưa submit.
   - Khi chuyển lại module đó, dữ liệu nháp được khôi phục nguyên vẹn.
   - Khi đóng/tải lại trang, sự kiện `beforeunload` tự động đồng bộ bản nháp vào `localStorage` (`eh_draft_grading_{moduleId}`).
   - Khi nộp điểm chính thức thành công cho module (`handleSaveGrade(true)`), bản nháp của module đó được xóa sạch khỏi bộ nhớ và `localStorage`.

3. **Điều hướng chấm module tiếp theo thuận tiện (`autoNavigateNext`)**:
   - Khi bài tập có nhiều module và còn module chưa được chấm điểm, xuất hiện thêm nút **"Lưu & Chuyển phần tiếp"** (Save & Grade Next) cạnh nút "Lưu & Gửi điểm cho học sinh".
   - Bấm nút này sẽ lưu điểm và trả bài cho module hiện tại, đồng thời tự động chuyển ngay sang tab module chưa chấm tiếp theo mà không bị đẩy văng về trang danh sách bài tập.
   - Nút "Lưu & Gửi điểm cho học sinh" vẫn duy trì hành vi hoàn tất và điều hướng về trang chi tiết bài tập.

4. **Polling & Cập nhật tự động kết quả AI Speaking**:
   - Sau khi bấm "Chấm bài bằng AI" hoặc "Chấm lại bằng AI", hệ thống bắt đầu polling dữ liệu module chi tiết.
   - Khi AI hoàn tất (`status === 'COMPLETED'`), tự động cập nhật điểm đề xuất AI (`aiSuggestion.suggestedScore`), nhận xét AI (`aiSuggestion.aiFeedback`), và hiển thị transcript lời nói của học viên cùng chú thích lỗi.

5. **Khung hướng dẫn cấu trúc nhận xét chuẩn sư phạm (Pedagogical Feedback Guide)**:
   - Bổ sung nút **"Hướng dẫn nhận xét"** dạng toggle accordion ngay cạnh nhãn "Nhận xét của giáo viên".
   - Hướng dẫn cấu trúc 3 phần chuẩn sư phạm:
     1. *Khen ngợi & Điểm mạnh*: Ghi nhận nỗ lực, phát âm rõ ràng, từ vựng phong phú.
     2. *Điểm cần khắc phục*: Chỉ rõ các lỗi ngữ pháp, phát âm (dựa trên transcript và chú thích AI).
     3. *Đề xuất luyện tập*: Đưa ra bài tập, phương pháp cụ thể để học viên tiến bộ.
   - Nút **"Chèn mẫu"** (Template) và nút **"Áp dụng mẫu ngay"** giúp giáo viên chèn nhanh mẫu Markdown chuẩn sư phạm vào ô phản hồi chỉ với 1 cú click.
   - Hỗ trợ xem trước định dạng Markdown trực quan qua tab **"Xem trước (MD)"**.

---

### B. Giao diện làm bài học viên (`StudentAssignment*.tsx`)
1. **Minh bạch hóa phạm vi nộp bài cho từng module**:
   - Đổi nhãn nút nộp bài rõ ràng trên cả 4 kỹ năng:
     - Reading: `Hoàn thành & Nộp phần Đọc (Submit Reading)`
     - Listening: `Hoàn thành & Nộp phần Nghe (Submit Listening)`
     - Writing: `Nộp bài (Submit Writing)`
     - Speaking: `Nộp bài Nói (Submit Speaking)`
   - Bổ sung dòng ghi chú nổi bật ngay dưới nút:
     - `Lưu ý: Nộp bài cho riêng phần thi này (không nộp toàn bộ bài tập).`

---

## 2. Kịch bản kiểm thử (Test Scenarios)

### Scenario 1: Kiểm tra thang điểm động theo Module
1. Mở bài làm của học viên có bài Quiz Reading gồm 3 câu hỏi (maxScore = 3.0).
2. Quan sát ô nhập điểm: label hiển thị `/ 3`.
3. Nhập `3.5` và bấm Lưu điểm: hiển thị thông báo lỗi `Điểm số không hợp lệ (thang 0.0 - 3.0)!`.
4. Nhập `3.0` và bấm Lưu: hợp lệ.

### Scenario 2: Kiểm tra lưu nháp khi chuyển đổi Module
1. Vào bài thi có cả Writing và Speaking.
2. Tại tab Writing, nhập điểm `8.5` và nhận xét: `Bài viết có cấu trúc tốt.` (chưa bấm Lưu).
3. Bấm chuyển sang tab Speaking.
4. Quan sát: Tab Writing xuất hiện badge màu vàng cam **"Nháp"**.
5. Tại tab Speaking, nhập điểm `7.0` và nhận xét: `Phát âm rõ ràng.`.
6. Bấm quay lại tab Writing: Điểm `8.5` và nhận xét `Bài viết có cấu trúc tốt.` vẫn còn nguyên vẹn.
7. Bấm "Lưu & Chuyển phần tiếp": Điểm Writing được lưu thành công, badge "Nháp" trên tab Writing biến mất, giao diện tự động chuyển sang tab Speaking.

### Scenario 3: Kiểm tra Khung hướng dẫn nhận xét & Chèn mẫu
1. Tại phần nhận xét của giáo viên, bấm vào nút **"Hướng dẫn nhận xét"**.
2. Quan sát: Bảng hướng dẫn cấu trúc 3 phần (Khen ngợi, Điểm cần khắc phục, Đề xuất luyện tập) mở ra.
3. Bấm **"Chèn mẫu"** hoặc **"Áp dụng mẫu ngay"**: Mẫu Markdown được tự động điền vào khung soạn thảo.
4. Bấm tab **"Xem trước (MD)"**: Nhận xét hiển thị định dạng tiêu đề, danh sách gạch đầu dòng rõ ràng, đẹp mắt.

### Scenario 4: Kiểm tra cập nhật AI Speaking
1. Tại tab Speaking, bấm **"Chấm điểm bằng AI"**.
2. Toast thông báo hiển thị AI đang phân tích.
3. Khi hoàn tất, giao diện hiển thị:
   - Điểm AI đề xuất (kèm thang điểm động).
   - Bản ghi lời nói của học viên (AI Transcript).
   - Danh sách chú thích phát âm/ngữ pháp do AI gắn thẻ.

### Scenario 5: Kiểm tra nhãn nút nộp bài phía học viên
1. Đăng nhập tài khoản học viên, vào làm bài tập đa kỹ năng.
2. Quan sát nút nộp bài ở từng kỹ năng: nhãn ghi rõ kỹ năng tương ứng (ví dụ: `Hoàn thành & Nộp phần Đọc (Submit Reading)`).
3. Đọc dòng lưu ý bên dưới nút: xác nhận học viên hiểu rõ chỉ nộp riêng cho kỹ năng đang làm.

---

## 3. Kết quả xác minh kỹ thuật (Quality Gates)
- **Unit Tests**:
  - `TeacherSubmissionDetails.test.tsx`: **141/141 PASS** (Coverage: Statement 93.42%, Branch 80.05%, Functions 94.57%, Lines 95.60%).
  - `StudentAssignmentQuiz.test.tsx`: **288/288 PASS**.
  - `StudentAssignmentWriting.test.tsx`: **45/45 PASS**.
  - Toàn bộ UI component tests: **1022/1022 PASS** across 18 test files (Coverage: Statements 92.87%, Branch 80.92%).
  - API unit tests: **212/212 PASS**.
- **Build**: `npm run build` (`tsc -b && vite build`) hoàn thành thành công trong 1.15s, 0 lỗi TypeScript.
- **Lint**: `npm run lint` (`eslint .`) hoàn thành với **0 errors, 0 warnings**.
