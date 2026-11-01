# Tài liệu Bàn giao Kỹ thuật Frontend -> Backend: Cấp quyền Admin đọc Bài tập Lớp học

## 1. Thông tin chung

| Mục | Nội dung |
| :--- | :--- |
| **Mã Issue liên quan** | [#192](https://github.com/hotung9108/EnglishHub/issues/192) (`[FE][Admin Class Assignments] API trả 403 nhưng giao diện báo lớp chưa có bài tập`) |
| **Testcase ID** | `QA31-021` (`test/selenium/tests/admin/cases.js:111-117`) |
| **Người bàn giao** | Frontend Team (`@fe-primary`) |
| **Người tiếp nhận** | Backend Team (`@be-primary`, `@be-secondary`) |
| **Mục tiêu kỹ thuật** | Thực thi Kịch bản A: Cho phép tài khoản `ADMIN` xem danh sách bài tập của lớp học để phục vụ việc giám sát chất lượng đào tạo |

---

## 2. Tình trạng Hiện tại & Vấn đề

- **Hiện tại**: Endpoint `GET /api/v1/classes/{classId}/assignments` được cấu hình trong [`ApiRoutePolicy.java`](file:///D:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/infrastructure/security/ApiRoutePolicy.java#L58-L62) với danh sách quyền: `List.of("TEACHER", "STUDENT")`.
- Khi tài khoản `ADMIN` truy cập trang Quản lý lớp học (`/admin/classes/:id`), tab "Bài tập & Điểm số", request `GET /api/v1/classes/<classId>/assignments` bị Spring Security chặn và phản hồi **HTTP 403 Forbidden**.
- **Frontend đã cập nhật**:
  - Frontend đã triển khai hoàn thiện Async State Machine tại [`ClassDetails.tsx`](file:///D:/Coding/EnglishHub/frontend/src/pages/ClassDetails.tsx).
  - Khi Backend trả về 403, UI hiển thị rõ trạng thái "Giới hạn quyền truy cập", KPI hiển thị `—`, không còn tình trạng nhầm lẫn sang "Chưa có bài tập nào".
  - Khi Backend cấp quyền thành công (trả HTTP 200 OK), UI sẽ hiển thị bảng bài tập, mã bài, tiêu đề và trạng thái `PUBLISHED` / `DRAFT` / `CLOSED`.

---

## 3. Yêu cầu Chi tiết cho Backend

### 3.1. Cập nhật Security Route Policy
File: [`backend/src/main/java/com/english_hub/core/infrastructure/security/ApiRoutePolicy.java`](file:///D:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/infrastructure/security/ApiRoutePolicy.java#L58-L62)

Bổ sung `"ADMIN"` vào danh sách role được phép gọi `GET /api/v1/classes/{classId}/assignments`:

```diff
// Assignment
new RouteRule(
        HttpMethod.GET,
        "/api/v1/classes/{classId}/assignments",
-       List.of("TEACHER", "STUDENT")),
+       List.of("ADMIN", "TEACHER", "STUDENT")),
```

### 3.2. Cập nhật Tài liệu Hợp đồng API (API Contract)
File: [`docs/api/EnglishHub_API_docs _v2.md`](file:///D:/Coding/EnglishHub/docs/api/EnglishHub_API_docs%20_v2.md#L253)

Cập nhật mô tả quyền của endpoint:
- **Roles được phép**: `ADMIN`, `TEACHER`, `STUDENT`.
- **Mô tả nghiệp vụ**: Giảng viên quản lý bài tập lớp mình; Học viên xem bài tập lớp đã ghi danh; Quản trị viên giám sát bài tập của mọi lớp học.

---

## 4. Kế hoạch Kiểm thử & Nghiệm thu (Acceptance Criteria)

1. **Integration Test Backend**:
   - Viết hoặc cập nhật test Spring Boot MockMvc:
     ```java
     mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
             .header("Authorization", "Bearer " + adminAccessToken))
             .andExpect(status().isOk())
             .andExpect(jsonPath("$.data").isArray());
     ```
2. **Nghiệm thu Selenium E2E Testcase `QA31-021`**:
   - Testcase gốc tại `test/selenium/tests/admin/cases.js:111-117`:
     ```javascript
     test('Admin xem nội dung bài tập trong lớp','Mở lớp QA, tab Bài tập & Điểm số; kiểm tra bài đã PUBLISHED.','Bài PUBLISHED QA xuất hiện đúng tiêu đề; nếu Admin API trả 403 cần review contract quyền.', ['content'],async(p,d,r)=>{
       r.readback={fixture:d.content};
       await p.openClass(d.baseClass);await p.button(/^Bài tập & Điểm số|Assignments/);await p.ready();
       r.readback.adminAssignments=await d.api.get('admin',`/classes/${d.baseClass.id}/assignments`);
       assert.ok(r.readback.adminAssignments.data?.some(a=>a.id===d.content.id),'API class assignments mismatch');
       assert.ok((await p.text()).includes(d.content.title),'Không thấy nội dung QA đã publish');
     });
     ```
   - Sau khi Backend cập nhật, testcase này sẽ **PASS 100%** mà không cần sửa bất kỳ dòng test nào!
