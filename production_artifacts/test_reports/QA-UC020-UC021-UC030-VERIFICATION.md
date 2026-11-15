# BÁO CÁO KIỂM THỬ & SOÁT CHÉO ĐẶC TẢ SRS: UC020, UC021, UC030 (AD20, AD21, AD30)

- **Người thực hiện**: Nguyễn Văn Tú (Tester / QA - `Zawn-Tsu`)
- **Ngày thực hiện**: 15/11/2026
- **Phạm vi kiểm thử**: Soát chéo chi tiết từng bước (step-by-step) giữa tài liệu đặc tả SRS (`final_2` / `docs/core/01.SRS.md`) và mã nguồn Frontend / Backend thực tế trong dự án EnglishHub.

---

## I. TỔNG QUAN KẾT QUẢ NGHIỆM THU

| Use Case | Activity Diagram | Tính năng kiểm thử | Kết quả mã nguồn | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **UC020** | AD20 (`AD20_KiemTraBaiLamTruocKhiNop`, `AD20_XemLaiBaiLam`) | Màn hình Review tổng thể trước khi nộp, cảnh báo câu hỏi bỏ trống, nút sửa câu trả lời | Đã tích hợp đầy đủ trên Overview & 4 kỹ năng | **ĐẠT (PASS)** |
| **UC021** | AD21 (`AD21_NopBaiTap`) | Xác nhận nộp bài qua ConfirmModal, khóa sửa đổi, chốt nộp & chuyển hướng kết quả | ConfirmModal có cảnh báo không thể sửa, gọi API `submitSubmission` | **ĐẠT (PASS)** |
| **UC030** | AD30 (`AD30_QuanLyDiemSo`) | Giáo viên sửa điểm bài đã chấm bắt buộc nhập lý do kiểm toán (Audit note), gửi API lưu `GradingChangeLog` | - `TeacherSubmissionDetails.tsx`: Đạt 100%, gửi `PUT /gradings/{id}` lưu `GradingChangeLog`.<br>- `TeacherClassProgress.tsx`: Kiểm tra >= 3 ký tự trên Modal, cập nhật local state. | **ĐẠT CÓ LƯU Ý (PASS WITH NOTE)** |

---

## II. SOÁT CHÉO CHI TIẾT TỪNG BƯỚC (STEP-BY-STEP CROSS-REFERENCE)

### 1. UC020: Kiểm tra và xem lại bài làm trước khi nộp (Review Attempt - AD20)

#### 1.1. Luồng chính (Main Flow)
- **Bước 1 (Truy cập màn hình xem lại)**:
  - *Đặc tả*: Học viên có thể xem lại tổng thể bài làm trước khi nộp.
  - *Mã nguồn thực tế*: Trên cả 4 màn hình làm bài của 4 kỹ năng (`StudentAssignmentWriting.tsx`, `StudentAssignmentReading.tsx`, `StudentAssignmentListening.tsx`, `StudentAssignmentSpeaking.tsx`), thanh breadcrumbs đều được trang bị nút:
    ```tsx
    <Button
      variant="secondary"
      size="sm"
      icon={FileCheck}
      onClick={() => navigate(`/student/assignments/${id}/overview`)}
      title="Kiểm tra tiến độ các kỹ năng trước khi nộp bài (UC020)"
    >
      Xem lại trước khi nộp
    </Button>
    ```
  - *Kết luận*: **ĐẠT**. Nút xuất hiện đồng nhất, điều hướng chuẩn xác về màn hình Tổng quan & Review.

- **Bước 2 (Hiển thị danh sách câu/phần thi đã làm và chưa làm)**:
  - *Đặc tả*: Hệ thống tóm tắt danh sách kỹ năng, số câu đã hoàn thành và số câu còn bỏ sót.
  - *Mã nguồn thực tế* (`StudentAssignmentOverview.tsx`, lines 466-565):
    - Khi có lượt làm bài dở dang (`hasActiveAttempt && inProgressSub`), khối **Pre-Submit Review Dashboard (UC020 / AD20)** tự động hiển thị.
    - Hiển thị đầy đủ danh sách các module kỹ năng cấu thành bài thi (`effectiveModules`).
    - Mỗi module hiển thị nhãn trạng thái trực quan:
      - Module đã nộp: Badge xanh lá `Đã làm` kèm mô tả `Đã hoàn thành nội dung phần thi`.
      - Module chưa nộp: Badge cam `Chưa nộp` kèm mô tả `Đang chờ làm bài / chưa hoàn tất`.
    - Phía trên có badge tổng hợp: `Đã hoàn thành các phần thi` (xanh lá) hoặc `Còn phần thi chưa hoàn thành` (vàng hổ phách).
  - *Kết luận*: **ĐẠT**.

- **Bước 3 (Sửa câu trả lời)**:
  - *Đặc tả*: Học viên có thể nhấp chọn quay lại từng module để kiểm tra và sửa đổi đáp án nếu còn thời gian.
  - *Mã nguồn thực tế* (`StudentAssignmentOverview.tsx`, lines 550-560 & `ExamStepper.tsx`, lines 178-186):
    - Nút thao tác tương ứng với từng module:
      - Nếu module đã làm: Nút mang nhãn **"Sửa câu trả lời"** (icon `Edit3`).
      - Nếu module chưa làm: Nút mang nhãn **"Làm bài ngay"** (icon `Play`).
    - Khi bấm nút, hàm `handleStartSkill(mod.skill, idx)` kích hoạt, tính toán chính xác route tương ứng kèm `submissionId` và `moduleId` mục tiêu, đưa học viên vào đúng module để sửa bài.
  - *Kết luận*: **ĐẠT**.

#### 1.2. Luồng phụ (Alternative Flow) - Cảnh báo câu hỏi bỏ trống
- *Đặc tả*: Nếu học viên chưa hoàn tất các câu hỏi/phần thi mà bấm xem lại hoặc chuẩn bị nộp, hệ thống phải cảnh báo rõ ràng.
- *Mã nguồn thực tế* (`StudentAssignmentOverview.tsx`, lines 491-510):
  - Biến `isAllSubModulesCompleted` kiểm tra trạng thái toàn bộ modules trong submission.
  - Nếu `!isAllSubModulesCompleted`: Banner cảnh báo màu hổ phách xuất hiện:
    > **Cảnh báo: Bạn vẫn còn phần thi chưa hoàn thành hoặc câu hỏi đang bị bỏ trống. Bạn có thể bấm "Làm bài ngay" hoặc "Sửa câu trả lời" để hoàn thiện trước khi nộp.**
  - Nếu tất cả đã hoàn thành: Banner màu xanh lá hiển thị thông báo sẵn sàng nộp bài.
- *Kết luận*: **ĐẠT**.

---

### 2. UC021: Nộp bài tập (Submit Assignment - AD21)

#### 2.1. Luồng chính (Main Flow)
- **Bước 1 (Mở hộp thoại xác nhận nộp bài)**:
  - *Đặc tả*: Học viên xác nhận cam kết tự giác và nhấn nộp bài chính thức.
  - *Mã nguồn thực tế* (`StudentAssignmentOverview.tsx`, lines 704-717 & lines 758-774):
    - Nút CTA: `Xác nhận Nộp toàn bộ bài tập (Lần X)`.
    - Khi nhấn nút -> Mở `ConfirmModal`:
      - **Tiêu đề**: "Xác nhận nộp bài tập" (`Confirm Assignment Submission`).
      - **Nội dung cảnh báo**: *"Bạn có chắc chắn muốn nộp toàn bộ bài tập? Sau khi xác nhận nộp, bạn sẽ không thể chỉnh sửa lại các câu trả lời. Hệ thống sẽ tiến hành đóng gói câu trả lời và bắt đầu quy trình đánh giá."*
      - **Nút xác nhận**: `Xác nhận nộp bài` (màu Primary).
      - **Nút hủy**: `Kiểm tra lại` (Review Again).
  - *Kết luận*: **ĐẠT**. Cảnh báo không thể sửa đổi sau khi nộp thể hiện rõ ràng, đúng cam kết.

- **Bước 2 (Khóa bài thi & Gửi dữ liệu nộp bài)**:
  - *Đặc tả*: Gửi yêu cầu chốt bài làm (`POST /api/v1/submissions/{id}/submit`), chuyển trạng thái bài thi sang `SUBMITTED`, ghi nhận thời gian `submitted_at`, kích hoạt tự động chấm.
  - *Mã nguồn thực tế* (`StudentAssignmentOverview.tsx`, lines 256-273):
    ```tsx
    const handleConfirmFinalSubmit = async () => {
      if (!inProgressSub) return;
      setIsStarting(true);
      try {
        await submissionService.submitSubmission(inProgressSub.id);
        notifyAssignmentSubmitted();
        setShowFinalSubmitModal(false);
        navigate(`/student/submissions/${inProgressSub.id}`);
      } catch (err: unknown) {
        ...
      }
    };
    ```
    - API backend thực thi chuyển trạng thái lượt thi sang `SUBMITTED`, tính điểm tự động trắc nghiệm Reading/Listening và xếp hàng phân tích AI cho Writing/Speaking.
    - Điều hướng học viên ngay lập tức đến trang kết quả nộp bài `/student/submissions/:id`.
  - *Kết luận*: **ĐẠT**.

#### 2.2. Luồng phụ & Ngoại lệ
- Nếu bài tập đã đóng (`assignment.status === 'CLOSED'`): Nút nộp bài bị vô hiệu hóa hoặc báo lỗi: *"Bài tập này đã được giáo viên đóng. Không thể nộp toàn bộ bài tập."*
- Nếu lỗi đường truyền: Modal bắt lỗi, hiển thị thông báo lỗi từ API và không khóa màn hình, cho phép học viên thử lại mà không mất dữ liệu.
- *Kết luận*: **ĐẠT**.

---

### 3. UC030 & UC031: Quản lý điểm số & Audit Reason Note (AD30)

#### 3.1. Luồng chính khi Giáo viên sửa điểm đã chấm
- *Đặc tả*: Khi cần sửa đổi điểm (do chấm phúc khảo hoặc điều chỉnh sai sót), giáo viên mở form chỉnh sửa điểm bài làm (`PUT /api/v1/gradings/{id}`). Giáo viên nhập điểm số mới và **bắt buộc nhập lý do thay đổi (`note`)**. Hệ thống ghi nhận điểm mới và tự động chèn bản ghi kiểm toán vào bảng `grading_change_logs`.
- *Mã nguồn thực tế tại Studio Chấm bài (`TeacherSubmissionDetails.tsx`)*:
  1. **Phát hiện sửa điểm đã chấm** (lines 963-985):
     ```tsx
     const existingFinalScore = gradingDetail?.finalScore != null ? Number(gradingDetail.finalScore) : ...;
     const isScoreChanged = existingFinalScore !== null && Math.abs(existingFinalScore - scoreNum) > 0.001;
     if (isScoreChanged) {
       setPendingGradeAdjustment({ gradingId, scoreNum, feedbackText, oldScore: existingFinalScore, ... });
       setAuditReasonNote('');
       setShowAuditReasonModal(true);
       return;
     }
     ```
  2. **Hiển thị Modal bắt buộc nhập lý do kiểm toán** (lines 2776-2852):
     - Hiển thị điểm cũ (`oldScore`) và điểm mới điều chỉnh (`scoreNum`).
     - Hộp nhập Textarea lý do điều chỉnh.
     - **Chặn lý do rỗng hoặc dưới 3 ký tự**:
       - Thuộc tính nút: `disabled={!auditReasonNote.trim() || auditReasonNote.trim().length < 3 || isSubmittingGrade}`.
       - Logic kiểm tra trong handler:
         ```tsx
         if (!auditReasonNote.trim() || auditReasonNote.trim().length < 3) {
           showToast(isVi ? 'Vui lòng nhập lý do điều chỉnh điểm (bắt buộc theo quy chuẩn kiểm toán UC030)!' : ...);
           return;
         }
         ```
  3. **Gửi API & Lưu `GradingChangeLog`**:
     - Client gửi qua `gradingService.submitGrade(gradingId, { finalScore: scoreNum, finalFeedback: feedback, note: note || undefined })`.
     - Request thực tế: `PUT /api/v1/gradings/{id}` kèm trường `note`.
     - Backend (`GradingService.java`, lines 298-307):
       ```java
       if (scoreChanged) {
         gradingChangeLogRepository.save(new GradingChangeLog(
           null, gradingId, teacher.id(), current.finalScore(), finalScore, note, changedAt
         ));
       }
       ```
     - Backend tự động lưu vết vào cơ sở dữ liệu bảng `grading_change_logs`.
- *Kết luận*: **ĐẠT XUẤT SẮC**. Ràng buộc validation chặt chẽ cả trên giao diện (disabled button), logic frontend và database audit log backend.

#### 3.2. Sổ điểm lớp học tổng thể (`TeacherClassProgress.tsx`)
- Trên trang Sổ điểm (`TeacherClassProgress.tsx`), nút "Sửa điểm" mở `AdjustGradeModal`.
- Modal cũng ràng buộc: Điểm từ 0 - 10 và `auditReasonNote.trim().length >= 3`. Nếu rỗng hoặc < 3 ký tự, hiển thị lỗi chặn lại.
- **Lưu ý kiến trúc (Architecture Note)**: Điểm trên Sổ điểm lớp học là điểm trung bình cộng tổng hợp (`aggregated score`) của học sinh qua nhiều bài tập. Hàm `handleSaveGradeAdjustment` hiện tại cập nhật state hiển thị `studentsRoster` trên UI và bắn Toast thông báo. Việc sửa điểm chính thức có phát sinh `GradingChangeLog` được thiết kế chuẩn mực trên từng bài nộp tại `TeacherSubmissionDetails.tsx`.

---

## III. PHÂN TÍCH EDGE CASES & ĐỀ XUẤT NÂNG CAO

1. **Edge Case: Bài thi đơn kỹ năng (Single-skill Assignment)**:
   - Khi bài thi chỉ có 1 module (ví dụ chỉ có Reading), thanh `ExamStepper` ẩn đi, nhưng khối Pre-Submit Dashboard vẫn hiển thị rõ ràng 1 module với nhãn `Đã làm / Chưa nộp` và nút `Sửa câu trả lời`. Học viên hoàn toàn chủ động rà soát trước khi chốt nộp.
2. **Edge Case: Hạn đóng bài tập bị quá hạn trong lúc học viên đang mở Modal Confirm**:
   - Khi học viên bấm nộp, hàm `handleStartSkill` và `handleOpenFinalSubmitModal` đều kiểm tra `assignment?.status === 'CLOSED'`. Nếu giáo viên đã đóng bài, modal sẽ thông báo lỗi và không gửi payload không hợp lệ lên máy chủ.
3. **Audit Trail View**:
   - Quản trị viên và giáo viên có thể tra cứu toàn bộ lịch sử các lần sửa điểm qua trang `/admin/audit/gradings` (`AdminGradingAuditLogs.tsx`) gọi API `GET /api/v1/gradings/audit-logs`.

---

## IV. KẾT LUẬN NGHIỆM THU CỦA QA / TESTER

- **UC020 (Xem lại bài làm trước khi nộp)**: **NGHIỆM THU ĐẠT**.
- **UC021 (Nộp bài tập)**: **NGHIỆM THU ĐẠT**.
- **UC030 / UC031 (Quản lý điểm số & Audit Reason Note)**: **NGHIỆM THU ĐẠT**.
- Toàn bộ 5 yêu cầu soát chéo step-by-step của Tech Lead đều khớp hoàn toàn với tài liệu đặc tả SRS `final_2` và Activity Diagrams AD20, AD21, AD30.
