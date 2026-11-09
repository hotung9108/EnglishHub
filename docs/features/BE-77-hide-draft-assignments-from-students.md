# BE-77: Ngăn Chặn Học Viên Xem Và Truy Cập Bài Tập Ở Trạng Thái Nháp (DRAFT)

> **Mã tính năng:** `BE-77`  
> **Dự án:** EnglishHub  
> **Người thực hiện:** Thái Sơn Đoàn (`@doanthaison2706` / Trello: `@thaisndoan`)  
> **Vai trò:** Backend Developer Primary  
> **Trello Card:** [https://trello.com/c/cLQYfPmd](https://trello.com/c/cLQYfPmd) (Cột: `Ongoing`)  
> **Tài liệu bàn giao:** `production_artifacts/pm_to_dev/BE-77-hide-draft-assignments-from-students.md`  
> **Nhánh Git:** `fix/BE-77-hide-draft-assignments-from-students`  
> **Nhánh đích (Target):** `develop`  

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

### 1.1. Hiện tượng lỗi
- Giáo viên tạo bài tập mới ở trạng thái Nháp (`status = DRAFT`) để chuẩn bị câu hỏi và cấu hình bài thi trước khi công bố.
- Tuy nhiên, học viên trong lớp vẫn thấy bài tập nháp này hiển thị trên danh sách bài tập lớp (`GET /api/v1/classes/{classId}/assignments`).
- Khi học viên bấm vào xem, backend vẫn trả về toàn bộ thông tin chi tiết bài tập (`GET /api/v1/assignments/{id}`) và danh sách modules/câu hỏi (`GET /api/v1/assignments/{id}/modules`, `GET /api/v1/modules/{id}`).
- Điều này vi phạm nghiêm trọng tính bảo mật đề thi, làm lộ trước câu hỏi và bài làm kiểm tra trước khi giáo viên chính thức công bố.

### 1.2. Phân tích nguyên nhân gốc rễ trong mã nguồn
1. **Tại `AssignmentService.listAssignments()`**:
   ```java
   AssignmentStatus status = parseStatusFilter(statusValue);
   AssignmentPage assignmentPage = assignmentRepository.findPage(classId, status, pageRequest);
   ```
   - Khi học sinh gọi API không truyền `status`, giá trị `status` là `null`. Query `findPageWithTotalElements` trong `AssignmentRepository.java` chỉ lọc `where classId = :classId and deleted = false`, hoàn toàn không lọc bỏ `status = DRAFT`.
   - Nếu học sinh cố tình truyền `status=DRAFT`, backend vẫn thực hiện truy vấn và trả về các bài tập nháp.
2. **Tại `AssignmentService.getAssignmentDetail()`**:
   ```java
   Assignment assignment = findAssignmentOrThrow(assignmentId);
   requireClassAccess(assignment.classId(), caller);
   ```
   - Chỉ kiểm tra xem học sinh có thuộc lớp không (`requireClassAccess`), không kiểm tra trạng thái bài tập có phải là `DRAFT` hay không.
3. **Tại `ModuleService.requireReadAccess()`**:
   ```java
   if (caller.role() == UserRole.STUDENT
       && classMemberRepository.existsByClassIdAndStudentId(assignment.classId(), caller.id())) {
       return;
   }
   ```
   - Cho phép học viên truy cập đọc module của bài tập ngay cả khi bài tập ở trạng thái `DRAFT`.

---

## 2. QUY CHUẨN KỸ THUẬT VÀ PHƯƠNG ÁN XỬ LÝ

### 2.1. Cập nhật `AssignmentService.listAssignments()`
- Thêm kiểm tra vai trò người gọi:
  ```java
  User caller = currentUserProvider.requireActiveUser();
  ...
  AssignmentStatus status = parseStatusFilter(statusValue);
  if (caller.role() == UserRole.STUDENT) {
      if (status == AssignmentStatus.DRAFT) {
          throw ApiException.forbidden(FORBIDDEN_MESSAGE);
      }
  }
  ```
- Nếu `caller.role() == UserRole.STUDENT` và `status == null`:
  - Thực hiện truy vấn danh sách loại trừ trạng thái `DRAFT` (chỉ trả về các bài tập có trạng thái khác DRAFT, tức `PUBLISHED` và `CLOSED`).

### 2.2. Cập nhật `AssignmentRepository` & `AssignmentJpaAdapter`
- Bổ sung phương thức truy vấn JPQL:
  ```java
  @Query("""
      select assignment, count(*) over ()
      from Assignment assignment
      where assignment.classId = :classId
        and assignment.deleted = false
        and assignment.status <> com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.DRAFT
      order by assignment.id desc
      """)
  List<Object[]> findPageExcludingDraftWithTotalElements(
      @Param("classId") Long classId,
      Pageable pageable);
  ```
- Định nghĩa trong domain repository:
  ```java
  AssignmentPage findPage(Long classId, AssignmentStatus status, boolean excludeDraft, AssignmentPageRequest pageRequest);
  ```
  Hoặc phân tách logic rõ ràng trong adapter theo cờ `excludeDraft`.

### 2.3. Cập nhật `AssignmentService.getAssignmentDetail()`
- Kiểm tra phân quyền truy cập chi tiết:
  ```java
  Assignment assignment = findAssignmentOrThrow(assignmentId);
  requireClassAccess(assignment.classId(), caller);
  if (caller.role() == UserRole.STUDENT && assignment.status() == AssignmentStatus.DRAFT) {
      throw ApiException.forbidden(FORBIDDEN_MESSAGE);
  }
  ```

### 2.4. Cập nhật `ModuleService.requireReadAccess()`
- Trong `ModuleService.java`:
  ```java
  if (caller.role() == UserRole.STUDENT
      && classMemberRepository.existsByClassIdAndStudentId(assignment.classId(), caller.id())) {
      if (assignment.status() == AssignmentStatus.DRAFT) {
          throw ApiException.forbidden(FORBIDDEN_MESSAGE);
      }
      return;
  }
  ```

---

## 3. CHECKLIST KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (QA CHECKLIST)
- [ ] Giáo viên tạo bài tập mới ở trạng thái `DRAFT`.
- [ ] Học viên cùng lớp gọi API `GET /api/v1/classes/{classId}/assignments` -> Bài tập nháp hoàn toàn không xuất hiện trong danh sách.
- [ ] Học viên gọi API `GET /api/v1/classes/{classId}/assignments?status=DRAFT` -> Nhận phản hồi HTTP 403 Forbidden.
- [ ] Học viên gửi request trực tiếp `GET /api/v1/assignments/{draftAssignmentId}` -> Nhận phản hồi HTTP 403 Forbidden.
- [ ] Học viên gửi request trực tiếp `GET /api/v1/assignments/{draftAssignmentId}/modules` hoặc `GET /api/v1/modules/{moduleId}` của bài tập nháp -> Nhận phản hồi HTTP 403 Forbidden.
- [ ] Giáo viên phụ trách lớp và Admin vẫn truy cập và chỉnh sửa bài tập `DRAFT` bình thường không bị ảnh hưởng.
