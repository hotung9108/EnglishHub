# SPECIFICATION HANDOFF: [BE-77] Ngăn Chặn Học Viên Xem Và Truy Cập Bài Tập Ở Trạng Thái Nháp (DRAFT)

> **Mã nhiệm vụ:** `[BE-77]`  
> **Trello Card:** [https://trello.com/c/cLQYfPmd](https://trello.com/c/cLQYfPmd)  
> **Cột trạng thái:** `Ongoing`  
> **Người thực hiện:** Thái Sơn Đoàn (`@doanthaison2706` / Trello: `@thaisndoan`)  
> **Vai trò:** Backend Developer Primary  
> **Nhánh Git:** `fix/BE-77-hide-draft-assignments-from-students`  
> **Target Branch:** `develop`  
> **Tài liệu đặc tả:** [`docs/features/BE-77-hide-draft-assignments-from-students.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/features/BE-77-hide-draft-assignments-from-students.md)  

---

## 1. MÔ TẢ VẤN ĐỀ VÀ PHÂN TÍCH HIỆN TRẠNG

### 1.1. Lỗi bảo mật bài tập DRAFT
- Khi giáo viên tạo bài tập mới ở trạng thái Nháp (`DRAFT`), bài tập này vẫn xuất hiện trong kết quả API `GET /api/v1/classes/{classId}/assignments` khi học viên truy vấn danh sách bài tập lớp.
- Học viên cũng có thể đọc toàn bộ chi tiết bài tập bằng `GET /api/v1/assignments/{id}` và đọc cấu trúc đề thi qua `GET /api/v1/assignments/{id}/modules` hoặc `GET /api/v1/modules/{id}`.

### 1.2. Nguyên nhân kỹ thuật
1. `AssignmentService.listAssignments()`: Khi học viên không truyền tham số `status`, query `findPageWithTotalElements` không loại bỏ `status = DRAFT`. Khi học viên truyền `status=DRAFT`, backend vẫn trả về kết quả.
2. `AssignmentService.getAssignmentDetail()`: Chưa có lớp phòng thủ kiểm tra vai trò `STUDENT` đối với bài tập `status = DRAFT`.
3. `ModuleService.requireReadAccess()`: Chỉ kiểm tra học sinh có trong lớp mà không chặn bài tập `DRAFT`.

---

## 2. QUY TRÌNH THỰC HIỆN TỪNG BƯỚC CHO DEVELOPER (THÁI SƠN)

### Bước 1: Tạo nhánh Git làm việc
```bash
git checkout develop
git pull origin develop
git checkout -b fix/BE-77-hide-draft-assignments-from-students
```

### Bước 2: Cập Nhật Truy Vấn Trong `AssignmentRepository` & Adapter
1. Trong `com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository`:
   Thêm query loại trừ `DRAFT`:
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
2. Trong `AssignmentRepository` (domain interface) và `AssignmentJpaAdapter`:
   Hỗ trợ cờ loại trừ nháp hoặc phương thức riêng cho học viên.

### Bước 3: Cập Nhật `AssignmentService.java`
1. Trong `listAssignments()`:
   ```java
   AssignmentStatus status = parseStatusFilter(statusValue);
   if (caller.role() == UserRole.STUDENT) {
       if (status == AssignmentStatus.DRAFT) {
           throw ApiException.forbidden("Bạn không có quyền thực hiện thao tác này.");
       }
   }
   ```
   Nếu `caller.role() == UserRole.STUDENT` và `status == null`: Sử dụng query loại trừ `DRAFT`.
2. Trong `getAssignmentDetail()`:
   ```java
   Assignment assignment = findAssignmentOrThrow(assignmentId);
   requireClassAccess(assignment.classId(), caller);
   if (caller.role() == UserRole.STUDENT && assignment.status() == AssignmentStatus.DRAFT) {
       throw ApiException.forbidden("Bạn không có quyền thực hiện thao tác này.");
   }
   ```

### Bước 4: Cập Nhật `ModuleService.java`
Trong `requireReadAccess()`:
```java
if (caller.role() == UserRole.STUDENT
    && classMemberRepository.existsByClassIdAndStudentId(assignment.classId(), caller.id())) {
    if (assignment.status() == AssignmentStatus.DRAFT) {
        throw ApiException.forbidden(FORBIDDEN_MESSAGE);
    }
    return;
}
```

### Bước 5: Bổ Sung Test Coverage
1. `AssignmentServiceTest.java`:
   - Test học viên lấy danh sách bài tập lớp không thấy bài tập DRAFT.
   - Test học viên gọi filter `status=DRAFT` bị ném 403 Forbidden.
   - Test học viên xem chi tiết bài tập DRAFT bị ném 403 Forbidden.
2. `ModuleServiceTest.java`:
   - Test học viên đọc module của bài tập DRAFT bị ném 403 Forbidden.
3. Chạy toàn bộ test suite:
   ```bash
   mvn clean test
   ```

---

## 3. TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)
- [ ] Học viên 100% không thấy bài tập DRAFT khi gọi `GET /api/v1/classes/{id}/assignments`.
- [ ] Học viên nhận HTTP 403 khi gọi `GET /api/v1/classes/{id}/assignments?status=DRAFT`.
- [ ] Học viên nhận HTTP 403 khi gọi `GET /api/v1/assignments/{draftId}`.
- [ ] Học viên nhận HTTP 403 khi gọi `GET /api/v1/modules/{draftModuleId}`.
- [ ] Giáo viên và Admin vẫn xem, quản lý và chỉnh sửa bài tập DRAFT bình thường.
- [ ] Toàn bộ unit tests backend (`mvn test`) pass 100%.
- [ ] Project Doctor (`mvn compile`) biên dịch 0 lỗi.
- [ ] Mở PR `fix/BE-77-hide-draft-assignments-from-students` vào `develop` và chuyển card sang `Review`.
