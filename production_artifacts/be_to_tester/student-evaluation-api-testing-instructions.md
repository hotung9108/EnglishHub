# Student Evaluation API (#58–#62) — Tester Handoff and CHECK Report (BE-TASK-10)

## Scope

**Phạm vi:** chỉ đọc và đối chiếu diff của Student Evaluations #58–#62. Không sửa code trong bước CHECK. File report này là artifact mới theo yêu cầu; không thuộc diff triển khai BE-TASK-10.

## Convention checks

### Nguồn quy tắc đã đọc

- `.agents/rules/convention-be.md:121-123` cấm liên kết object graph xuyên bounded context bằng `@ManyToOne`.
- `docs/Agent_Coding_Workflow.md:71` nêu ví dụ từ khóa cần grep (`JdbcTemplate`, `createNativeQuery`, `SELECT * FROM`); các dòng `76-79` nêu quy tắc không dùng field `@Autowired`, không dùng native `@Query` nếu chưa hỏi PM/tech lead, và yêu cầu rõ cascade/orphanRemoval nếu dùng quan hệ JPA.
- `production_artifacts/be_to_tester/grading-api-testing-instructions.md:92` là danh sách quét của lần CHECK Cụm 6, gồm `JdbcTemplate`, `SELECT * FROM`, `@ManyToOne`, `@PreAuthorize`, `@AuthenticationPrincipal`, và cách phân biệt match `createNativeQuery` thuộc baseline.

`convention-be.md` không liệt kê riêng các API JDBC/native-query theo tên; danh sách scan bên dưới lấy từ ví dụ/quy tắc trong workflow hiện có và danh sách CHECK Cụm 6 đã lưu trong repo.

### Kết quả scan trên toàn bộ file mới của package, hai file persistence đã sửa và toàn bộ 4 test mới

| Từ khóa/pattern | Kết quả | Diễn giải |
|---|---:|---|
| `JdbcTemplate` | 0 | Không có match trong diff task. |
| `createNativeQuery` | 0 | Không có match trong diff task. |
| `SELECT * FROM` | 0 | Không có match trong diff task. |
| `@ManyToOne` | 0 | Không có quan hệ JPA kiểu này trong module hoặc test mới. |
| `@PreAuthorize` | 0 | Không có match trong diff task. |
| `@AuthenticationPrincipal` | 0 | Không có match trong diff task. |
| Native `@Query` / `nativeQuery = true` | 0 | Không có native query trong diff task. |
| Field `@Autowired` | **0** | **Đã fix:** chuyển toàn bộ 16 field trong hai integration test sang constructor injection. |

Hai test dùng `@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)` và constructor nhận dependencies: API integration `StudentEvaluationApiIntegrationTest.java:47,63-92`; persistence integration `StudentEvaluationPersistenceIntegrationTest.java:38,54-77`. Quy tắc được sửa theo là `docs/Agent_Coding_Workflow.md:75-76` (“Không dùng `@Autowired` trên thuộc tính, chỉ dùng constructor injection”).

**Lưu ý convention:** hai test Grading được yêu cầu đối chiếu hiện vẫn dùng field injection (`GradingApiIntegrationTest.java:89-105`, `GradingPersistenceIntegrationTest.java:82-97`), trái với rule trên. Vì vậy hai test Student Evaluation đã làm theo rule tường minh của project; code mẫu Grading hiện tại chưa đồng bộ với rule.

`StudentEvaluationService`, adapter, mapper, controller, DTOs và hai persistence file đã sửa không có các từ khóa/pattern bị cấm ở trên. Reference: `docs/Agent_Coding_Workflow.md:75-79`.

## Scope and plan compliance

### File mới trong diff triển khai

**Domain**

- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/domain/model/StudentEvaluation.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/domain/model/StudentEvaluationFilter.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/domain/model/StudentEvaluationPage.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/domain/repository/StudentEvaluationRepository.java:1`

**Application**

- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/command/CreateStudentEvaluationCommand.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/command/UpdateStudentEvaluationCommand.java:1`

**Infrastructure**

- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/adapter/StudentEvaluationJpaAdapter.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/mapper/StudentEvaluationPersistenceMapper.java:1`

**Presentation**

- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/dto/CreateStudentEvaluationRequest.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/dto/UpdateStudentEvaluationRequest.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/dto/StudentEvaluationResponse.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/dto/StudentEvaluationListResponse.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/dto/PaginationResponse.java:1`
- `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/dto/MessageResponse.java:1`

**Bốn test đã duyệt**

- `backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:1`
- `backend/src/test/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationControllerMockMvcTest.java:1`
- `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:1`
- `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationPersistenceIntegrationTest.java:1`

### Hai file có sẵn được sửa

- `backend/src/main/java/com/english_hub/core/infrastructure/persistence/entity/StudentEvaluation.java:37-59` — thêm mapping `created_at`, lifecycle initialization và method cập nhật content.
- `backend/src/main/java/com/english_hub/core/infrastructure/persistence/repository/StudentEvaluationRepository.java:7-10` — thêm `JpaSpecificationExecutor`, giữ `existsByClassId`.

Danh sách gồm đúng 20 file mới theo PLAN và 2 file persistence có sẵn được phép sửa. Không thấy file triển khai nào ngoài danh sách đã duyệt. Reference: `git diff --name-only` và `git ls-files --others --exclude-standard`; các đường dẫn tương ứng ở trên.

### Các mục cấm/ngoài scope

- `StudentEvaluationCleanupPort`: **không có trong diff**, không có file/class cùng tên trong module hoặc test của task. Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:1`.
- `AdminUserService`: **không sửa**; không có đường dẫn này trong diff. File có sẵn: `backend/src/main/java/com/english_hub/core/modules/user/application/service/AdminUserService.java:1`.
- `AdminUserServiceTest`: **không thuộc diff và không sửa**. File test vẫn tồn tại từ trước trong repo, nên xác nhận đúng là “không xuất hiện trong diff”, không phải “không tồn tại”. Reference: `backend/src/test/java/com/english_hub/core/features/user/application/service/AdminUserServiceTest.java:38`.
- Migration mới: **không có** trong diff; các migration hiện có dừng ở V4. Reference: `backend/src/main/resources/db/migration/V4__upgrade_jsonb_columns.sql:1`.
- Không tạo JPA entity thứ hai map `student_evaluations`: mapping `@Entity`/`@Table(name = "student_evaluations")` duy nhất vẫn là entity persistence có sẵn. Domain `StudentEvaluation` là Java record thuần, không có JPA annotation. Reference: `backend/src/main/java/com/english_hub/core/infrastructure/persistence/entity/StudentEvaluation.java:15-19`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/domain/model/StudentEvaluation.java:5-12`.

## API scenarios and business rule verification

### a. #58/#60 role

Hai API gọi `requireReader()`. Hàm chỉ cho phép `TEACHER` hoặc `STUDENT`; role khác, gồm `ADMIN`, nhận 403.

```java
if (caller.role() != UserRole.TEACHER && caller.role() != UserRole.STUDENT) {
    throw ApiException.forbidden(FORBIDDEN_MESSAGE);
}
```

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:51`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:102-108`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:137-142`.

### b. #58/#60 STUDENT chỉ xem dữ liệu của mình

```java
if (caller.role() == UserRole.STUDENT && !Objects.equals(caller.id(), studentId)) { ... }
if (caller.role() == UserRole.STUDENT && !Objects.equals(caller.id(), evaluation.studentId())) { ... }
```

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:52-54`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:104-107`.

### c. TEACHER xem học viên bất kỳ ở #58/#60

Trong #58, sau role gate, service chỉ kiểm tra student tồn tại rồi gọi filter theo `studentId` và `classId` được request truyền vào; không so `teacherId` hoặc teacher phụ trách lớp với current user. Trong #60, ngoài role gate chỉ có kiểm tra chủ thể khi caller là STUDENT; không có giới hạn lớp/giáo viên cho TEACHER.

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:50-67`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:102-108`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/adapter/StudentEvaluationJpaAdapter.java:75-84`.

### d. #58 sort và Specification

```java
PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
```

Specification luôn thêm predicate `studentId`, chỉ thêm `classId` khi khác `null`. Integration test assert phần tử `newestId` trước `otherClassId`, và filter class trả `[newestId, oldestId]`.

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/adapter/StudentEvaluationJpaAdapter.java:44-52`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/adapter/StudentEvaluationJpaAdapter.java:75-84`; `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationPersistenceIntegrationTest.java:78-102`.

### e. #59 tồn tại, giáo viên hiện tại và membership hiện tại

Service tải lớp theo `classId`, kiểm tra học viên tồn tại qua `ClassRepository.studentExists`, trả 404 message gộp nếu thiếu lớp hoặc học viên; sau đó so `teacher.id()` với `englishClass.getTeacherId()`; cuối cùng gọi đúng `existsByClassIdAndStudentId(classId, studentId)`. Đây là kiểm tra sự tồn tại của membership hiện tại, không truy vấn lịch sử hoặc membership đã xoá.

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:79-87`; `backend/src/main/java/com/english_hub/core/modules/classroom/infrastructure/adapter/ClassJpaAdapter.java:125-127`; `backend/src/main/java/com/english_hub/core/modules/classroom/domain/repository/ClassMemberRepository.java:17`; `backend/src/main/java/com/english_hub/core/modules/classroom/infrastructure/adapter/ClassMemberJpaAdapter.java:104-106`; `backend/src/main/java/com/english_hub/core/infrastructure/persistence/repository/ClassMemberRepository.java:6-8`.

### f. #59 message khi không thuộc lớp

Constant là chính xác `"Học viên không thuộc lớp học này."`; service dùng constant này khi membership check trả false. Unit và API integration test cũng so khớp nguyên chuỗi.

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:28,86-87`; `backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:178-190`; `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:111-116`.

### g. #60 response chỉ có `id`, `content`

`StudentEvaluationResponse` chỉ khai báo hai record component `id` và `content`; mapper tạo response chỉ từ hai giá trị này. Test kiểm tra `classId`, `teacherName`, `createdAt` không xuất hiện.

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/dto/StudentEvaluationResponse.java:5-9`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:58-61`; `backend/src/test/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationControllerMockMvcTest.java:96-108`; `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:145-152`.

### h. #61/#62 quyền theo người viết gốc

```java
if (!Objects.equals(evaluation.teacherId(), teacher.id())) { ... }
```

Update/delete tải evaluation rồi chỉ gọi `requireAuthor`; hai luồng này không tải lớp và không so với `class.teacherId`. Việc so `class.teacherId` chỉ nằm trong luồng tạo #59.

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:112-128`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:153-157`.

### i. #61 content rỗng và response thành công

`content == null || content.isBlank()` trả 400 `"Nội dung đánh giá không được để trống."`; controller trả 200 `"Cập nhật đánh giá thành công."`.

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:29,112-116`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:63-69`; `backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:248-258`.

### j. #62 role và message

Delete gọi `requireTeacher()` trước khi tìm evaluation; `requireTeacher()` chỉ cho role `TEACHER`, nên STUDENT không thể xoá kể cả evaluation của mình. Thành công trả `"Đã xoá đánh giá."`.

Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:122-128`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:145-151`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:71-75`.

### k. Message chung 401/403/500

- 401: `"Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."` trong `AuthenticatedUserProvider` và `ApiAuthenticationEntryPoint`.
- 403: `"Bạn không có quyền thực hiện thao tác này."` trong service và security/access-denied handlers.
- 500: các handler lỗi database và unexpected exception trả `"Lỗi máy chủ."`.

Reference: `backend/src/main/java/com/english_hub/core/modules/user/infrastructure/security/AuthenticatedUserProvider.java:18-36`; `backend/src/main/java/com/english_hub/core/infrastructure/security/ApiAuthenticationEntryPoint.java:29-33`; `backend/src/main/java/com/english_hub/core/infrastructure/security/ApiAccessDeniedHandler.java:29-32`; `backend/src/main/java/com/english_hub/core/common/GlobalExceptionHandler.java:55-68`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:24`.

## Automated checks and test coverage

Đã chạy lại suite Student Evaluation: **33 test, 33 pass, 0 failure, 0 error, 0 skipped** (service 18, controller MockMvc 8, API integration 5, persistence integration 2). Full `./gradlew build` cũng thành công; kết quả test toàn backend có **469 test, 0 failure, 0 error, 0 skipped**. Reference: `backend/build/test-results/test/TEST-com.english_hub.core.modules.student_evaluation.application.service.StudentEvaluationServiceTest.xml:2`; `backend/build/test-results/test/TEST-com.engl-V50U4LGI5I48Q.core.modules.student_evaluation.presentation.rest.StudentEvaluationControllerMockMvcTest.xml:2`; `backend/build/test-results/test/TEST-com.english_hub.core.modules.student_evaluation.integration.StudentEvaluationApiIntegrationTest.xml:2`; `backend/build/test-results/test/TEST-com.engli-NTM8E40VB64I2.core.modules.student_evaluation.integration.StudentEvaluationPersistenceIntegrationTest.xml:2`; full build summary: `backend/build/reports/tests/test/index.html:1`.

### Danh sách 33 test theo file

- **Service (18):** `teacherCanListAnyStudentWithOptionalClassFilterAndTeacherName` (69); `studentCanOnlyListTheirOwnEvaluations` (87); `adminCannotListStudentEvaluations` (99); `listingReturnsNotFoundWhenStudentDoesNotExist` (111); `createStoresTheCurrentTeacherAsAuthorWhenStudentIsCurrentlyAMember` (124); `createRejectsBlankContentWithContractMessage` (151); `createRejectsTeacherWhoDoesNotCurrentlyTeachTheClass` (164); `createRejectsStudentWhoIsNotCurrentlyInTheClass` (179); `createReturnsCombinedNotFoundWhenStudentOrClassDoesNotExist` (194); `getByIdAllowsStudentToReadTheirOwnEvaluation` (207); `getByIdRejectsStudentReadingAnotherStudentsEvaluation` (216); `getByIdReturnsNotFoundWhenEvaluationDoesNotExist` (227); `updateChangesContentWhenCurrentTeacherIsTheAuthor` (237); `updateRejectsEmptyContentWithContractMessage` (249); `updateReturnsNotFoundBeforeOwnershipCheck` (261); `updateRejectsTeacherOtherThanOriginalAuthor` (274); `deleteRemovesEvaluationWhenCurrentTeacherIsTheAuthor` (288); `deleteRejectsTeacherOtherThanOriginalAuthor` (299). Reference: `backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:69,87,99,111,124,151,164,179,194,207,216,227,237,249,261,274,288,299`.
- **Controller MockMvc (8):** `listReturnsOnlyTheContractDataAndPaginationEnvelope` (47); `listUsesDefaultPageAndLimit` (71); `createReturns201WithMessageAndId` (84); `detailResponseContainsOnlyIdAndContent` (97); `updateReturnsContractMessage` (111); `deleteReturnsContractMessage` (123); `serviceAuthorizationErrorUsesTheExistingErrorEnvelope` (133); `missingAuthenticationUsesTheExisting401Contract` (144). Reference: `backend/src/test/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationControllerMockMvcTest.java:47,71,84,97,111,123,133,144`.
- **API integration (5):** `createChecksCurrentTeacherAndMembershipThenOriginalAuthorCanEditAndDelete` (124); `createRejectsStudentWhoBelongsToAnotherClassButNotRequestedClass` (187); `listFiltersAndPaginatesForTeachersAndRestrictsStudentsAndAdmins` (199); `adminCannotGetEvaluationDetail` (244); `unauthenticatedRequestUsesTheConfigured401Message` (255). Reference: `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:124,187,199,244,255`.
- **Persistence integration (2):** `specificationRequiresStudentIdAddsOptionalClassFilterAndSortsByCreatedAtDescending` (97); `adapterMapsAndUpdatesContentAndDeletesWithoutChangingTheAuthorOrClass` (124). Reference: `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationPersistenceIntegrationTest.java:97,124`.

### Các case bắt buộc trong checklist

| Case | Trạng thái trong 33 test |
|---|---|
| STUDENT gọi #58 với path id khác → 403 | **Có.** Service test 87-95 và API test 228-231. Reference: `StudentEvaluationServiceTest.java:87-95`; `StudentEvaluationApiIntegrationTest.java:228-231`. |
| STUDENT gọi #60 với evaluation của người khác → 403 | **Có.** Service test 216-223 và API test 170-173. Reference: `StudentEvaluationServiceTest.java:216-223`; `StudentEvaluationApiIntegrationTest.java:170-173`. |
| STUDENT gọi #58 với id của mình → 200 | **Có.** API integration test 221-226. Reference: `StudentEvaluationApiIntegrationTest.java:221-226`. |
| STUDENT gọi #60 với evaluation của mình → 200 | **Có.** Service test 207-213 và API integration test 161-168. Reference: `StudentEvaluationServiceTest.java:207-213`; `StudentEvaluationApiIntegrationTest.java:161-168`. |
| ADMIN gọi #58 → 403 | **Có.** Service test 99-108 và API integration test 233-235. Reference: `StudentEvaluationServiceTest.java:99-108`; `StudentEvaluationApiIntegrationTest.java:233-235`. |
| ADMIN gọi #60 → 403 | **Đã fix — bổ sung test.** Integration test đăng nhập bằng ADMIN và xác nhận 403 cùng message đúng. Reference: `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:244-252`. |
| TEACHER không phụ trách lớp gọi #59 → 403 | **Có.** Unit test 164-176 và API integration test 127-132. Reference: `StudentEvaluationServiceTest.java:164-176`; `StudentEvaluationApiIntegrationTest.java:127-132`. |
| Học viên đã thuộc lớp khác, nhưng không thuộc lớp được đánh giá, gọi #59 → 400 | **Đã fix — bổ sung test.** `studentTwoId` được thêm vào classTwo, sau đó gọi #59 với classOne; test xác nhận 400 và đúng message. Reference: `backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:116-120,187-195`. |
| Giáo viên khác gọi #61 → 403 | **Có.** Service test 274-285; API test đổi giáo viên hiện tại rồi xác nhận giáo viên mới không sửa được ở 148-152. Reference: `StudentEvaluationServiceTest.java:274-285`; `StudentEvaluationApiIntegrationTest.java:144-152`. |
| Giáo viên khác gọi #62 → 403 | **Có.** Service test 299-308. Reference: `StudentEvaluationServiceTest.java:299-308`. |
| #59 content blank → 400 đúng message | **Đã bổ sung.** Test gửi content gồm spaces và xác nhận status/message 400 đúng như #61. Reference: `backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:151-161`. |
| #61 content blank → 400 đúng message | **Có.** Test truyền chuỗi khoảng trắng và so khớp message. Reference: `StudentEvaluationServiceTest.java:249-259`. |
| Sort DESC có assert thứ tự phần tử | **Có.** Persistence test assert trang đầu là `newestId`, trang kế tiếp là `otherClassId`, và class filter trả `[newestId, oldestId]`; API test cũng assert newest là phần tử đầu. Reference: `StudentEvaluationPersistenceIntegrationTest.java:97-120`; `StudentEvaluationApiIntegrationTest.java:199-226`. |

**Coverage gaps bổ sung:** chưa có test riêng STUDENT gọi #61/#62 dù code gate `requireTeacher()` chặn; chưa có test 500 xác nhận `"Lỗi máy chủ."`. Đây là thiếu coverage, không phải sai message/logic trong code đã đọc. Reference: `StudentEvaluationService.java:112-151`; `GlobalExceptionHandler.java:55-68`.

## Worktree note

Các thay đổi sau đã có trong worktree trước khi bắt đầu code BE-TASK-10; status hiện tại vẫn còn như vậy và chúng không thuộc diff triển khai task này:

- `.gitignore` — đã là tracked modification từ trước. Reference: task-start `git status --short --branch`; `production_artifacts/be_to_tester/grading-api-testing-instructions.md:95-97`; `.gitignore:1`.
- `docs/DATAMOCK_GUIDE.md` — đã là tracked modification từ trước. Reference: task-start `git status --short --branch`; `production_artifacts/be_to_tester/grading-api-testing-instructions.md:95-97`; `docs/DATAMOCK_GUIDE.md:1`.
- `production_artifacts/be_to_tester/mock-data-task-06.md` — đã là tracked modification từ trước. Reference: task-start `git status --short --branch`; `production_artifacts/be_to_tester/grading-api-testing-instructions.md:95-97`; `production_artifacts/be_to_tester/mock-data-task-06.md:1`.
- `docs/Agent_Coding_Workflow.md` — đã là untracked file từ trước; task chỉ đọc nó làm quy tắc CHECK, không tạo file này. Reference: task-start `git status --short --branch`; `production_artifacts/be_to_tester/grading-api-testing-instructions.md:95-97`; `docs/Agent_Coding_Workflow.md:1`.

Không add, commit hoặc push trong bước CHECK. Reference: `git status --short --branch`.

## Additional pre-commit review

Phạm vi vòng này: đọc service/controller/adapter/entity, migration liên quan, exception handlers chung và toàn bộ test của module. Không sửa code, không chạy thêm test, không add/commit/push.

### A. IDOR / phân quyền

1. **Thứ tự load và kiểm tra quyền theo evaluation ID. Mức độ: Trung bình.** #60 gọi role gate requireReader() trước, sau đó load evaluation (404), rồi mới so studentId với caller (403). #61 gọi requireTeacher() trước, validate body, load evaluation (404), rồi mới so tác giả (403). #62 gọi requireTeacher(), load evaluation (404), rồi mới so tác giả (403). Vì vậy STUDENT gọi #60 và TEACHER gọi #61/#62 có thể phân biệt ID tồn tại (403) với ID không tồn tại (404); đây là oracle về sự tồn tại của evaluation cho caller đã qua role gate. Với #61 body blank, 400 xảy ra trước lookup. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:101-108,111-119,122-128,153-162; status được giữ theo exception tại backend/src/main/java/com/english_hub/core/common/GlobalExceptionHandler.java:18-20.

2. **Role gate cho #61/#62 chạy trước so sánh teacherId. Mức độ: Nhẹ - không đáng lo.** requireTeacher() chạy đầu method; caller không phải TEACHER bị 403 trước khi load evaluation hoặc gọi requireAuthor(). Do đó STUDENT không thể lọt qua bằng một ID trùng teacherId; code không thực hiện phép so sánh đó cho STUDENT. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:111-118,122-126,145-156.

3. **Role #59 được chặn ở service. Mức độ: Nhẹ - không đáng lo.** Controller không có @PreAuthorize; createForStudent() gọi requireTeacher() ngay đầu method. Vì guard nằm trong chính service nên gọi trực tiếp service vẫn chạy guard, không phụ thuộc controller; không thấy đường bypass trong implementation hiện tại. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:24-26,49-56; backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:69-73,145-151.

### B. Input validation / boundary

4. **Phân trang #58. Mức độ: Trung bình với page cực lớn; các biên đã nêu được chặn.** Default page=1, limit=20; page < 1, limit < 1 hoặc limit > 100 trả 400, nên page=0, page âm, limit=0, limit âm và limit=100000 đều bị chặn. limit có max 100. Không có max cho page dương: giá trị int rất lớn qua validation rồi được đổi thành offset qua PageRequest.of(page - 1, limit), có thể tạo truy vấn OFFSET rất lớn. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:34-40; backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:50-55,164-168; backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/adapter/StudentEvaluationJpaAdapter.java:43-47.

5. **Filter #58 với classId dương nhưng không tồn tại. Mức độ: Nhẹ - không đáng lo.** Service chỉ xác minh học viên; không truy vấn tồn tại của classId. Specification thêm điều kiện classId = filter.classId, nên lớp không tồn tại cho kết quả danh sách rỗng (200), không phải 404. Grading khác với caller TEACHER: #52 xác minh lớp tồn tại/quyền phụ trách trước filter nên lớp vắng mặt trả 404; caller ADMIN không chạy check đó và filter không khớp trả rỗng. Khác biệt của TEACHER phù hợp với rule Cụm 7 đã duyệt là TEACHER được lọc đánh giá của mọi học viên, không kiểm tra lớp họ phụ trách. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:55-66; backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/adapter/StudentEvaluationJpaAdapter.java:75-84; backend/src/main/java/com/english_hub/core/modules/grading/application/service/GradingService.java:133-145,243-249; backend/src/main/java/com/english_hub/core/modules/grading/infrastructure/adapter/GradingJpaAdapter.java:74-110.

6. **#59 nhận content chỉ có whitespace — đã fix theo xác nhận cuối. Mức độ ban đầu: Trung bình; hiện đã khắc phục.** Create giờ gọi isBlank() và trả cùng 400 message với #61 trước khi đọc lớp hoặc lưu. Cột DB vẫn là TEXT NOT NULL; validation nằm trong service. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:70-78,111-119; backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:151-161.

7. **#59 classId bằng 0/âm. Mức độ: Nhẹ - không đáng lo.** Create không kiểm tra classId > 0; giá trị không null được đưa vào classRepository.findById. Với 0/âm không khớp bản ghi, Optional rỗng được chuyển thành 404 “Không tìm thấy học viên hoặc lớp học.”, không đi tới lỗi server. Schema khai báo BIGSERIAL PRIMARY KEY nhưng không có CHECK dương; do đó code không cấm cứng ID không dương nếu DB được tạo bản ghi như vậy. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:72-82; backend/src/main/java/com/english_hub/core/modules/classroom/infrastructure/adapter/ClassJpaAdapter.java:64-67; backend/src/main/resources/db/migration/V1__init_schema.sql:154-166.

8. **ID path không chuyển được sang long. Mức độ: Nhẹ - không đáng lo.** Các path dùng primitive long; chữ hoặc số vượt miền Long gây MethodArgumentTypeMismatchException, được handler chuyển thành 400 {"error":"Dữ liệu không hợp lệ."}. Handler không đưa exception/stack trace vào body; unexpected exception cũng chỉ trả {"error":"Lỗi máy chủ."}. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:58-74; backend/src/main/java/com/english_hub/core/common/GlobalExceptionHandler.java:39-42,65-69.

### C. Data integrity / null-safety

9. **Nguồn và vòng đời teacherName #58. Mức độ: Trung bình về lịch sử hiển thị; nhẹ về null-safety.** Không có cột teacher_name trong entity/migration; mapper không lưu source.teacherName(). Khi list, service gọi classRepository.findTeacher(teacherId) cho từng evaluation và lấy User.fullName hiện tại. Vì vậy đổi tên giáo viên sẽ làm các đánh giá cũ hiển thị tên mới, không phải snapshot lúc viết. Soft-delete trong user repository đặt deleted=true nhưng giữ row; đường ClassJpaAdapter.findTeacher() dùng inherited UserRepository.findById() không kèm DeletedFalse, nên soft-delete không làm mất tên và không gây exception. Nếu lookup không có row, code chủ động dùng teacherName=null. Đây cũng là một lookup theo từng item (potential N+1 khi trang có nhiều teacher ID khác nhau; limit chặn tối đa 100 item). Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:60-66,90-98,130-135; backend/src/main/java/com/english_hub/core/modules/classroom/infrastructure/adapter/ClassJpaAdapter.java:112-117; backend/src/main/java/com/english_hub/core/infrastructure/persistence/repository/UserRepository.java:13-17; backend/src/main/java/com/english_hub/core/modules/user/infrastructure/persistence/JpaUserRepository.java:109-122; backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/mapper/StudentEvaluationPersistenceMapper.java:15-35; backend/src/main/resources/db/migration/V1__init_schema.sql:522-540.

10. **Tạo nhiều evaluation cùng studentId + classId. Mức độ: Nhẹ - không đáng lo theo spec hiện tại.** Service không tìm bản ghi trùng trước khi save; schema chỉ có PK, FK và các index, không có UNIQUE theo student/class. Nhiều POST hợp lệ liên tiếp vì thế tạo nhiều evaluation. Spec đã duyệt không cấm; chưa có quyết định nghiệp vụ khẳng định phải unique, nên đây là hành vi hiện tại chứ chưa kết luận là bug. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:86-98; backend/src/main/resources/db/migration/V1__init_schema.sql:522-550.

### D. Transaction & exception mapping

11. **Transaction cho create/update/delete. Mức độ: Nhẹ - không đáng lo.** Cả ba method đều có @Transactional; list/get có readOnly=true. Grading dùng @Transactional(readOnly=true) ở class và override method ghi bằng @Transactional; phạm vi Student Evaluation tương đương cho các write này. Reference: backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:49-50,69-70,101-123; backend/src/main/java/com/english_hub/core/modules/grading/application/service/GradingService.java:34-36,99-104.

12. **Exception 404/403/400 và envelope. Mức độ: Nhẹ - không đáng lo.** Service ném ApiException; GlobalExceptionHandler giữ status và tạo ApiError, response có field error. AccessDeniedException cũng được ánh xạ về 403; controller không tự try-catch hay trả envelope riêng. Type mismatch/JSON parse có 400 envelope chung. Không thấy nhánh trong module trả body lỗi khác. Reference: backend/src/main/java/com/english_hub/core/common/GlobalExceptionHandler.java:18-46; backend/src/main/java/com/english_hub/core/common/ApiException.java:18-32; backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:34-75; backend/src/test/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationControllerMockMvcTest.java:133-150; backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:180-195,248-251.

### E. Test coverage còn thiếu

13. **Các tình huống trong A-D chưa có test trực tiếp. Mức độ: Nhẹ - không đáng lo (coverage gap, không tự suy diễn thành lỗi runtime).** Đã đọc toàn bộ 33 test của module; các khoảng trống cụ thể:

- A1: #60 có test existing-owner/other-student/missing; #61 có 404 và other-author 403 riêng. Chưa có test oracle gộp same caller + existing non-owned vs missing; #62 chưa có test ID không tồn tại → 404. Reference: backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:207-234,260-285,287-308; backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:161-183.
- A2/A3: chưa có test STUDENT/ADMIN gọi #61/#62 để xác nhận role rejection; chưa có test STUDENT/ADMIN gọi #59. Các test create hiện dùng TEACHER, kể cả trường hợp teacher không phụ trách lớp. Reference: backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:124-204,274-308; backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:124-159,187-195.
- B4/B5: có test pagination hợp lệ/default, nhưng chưa có boundary page/limit (0, âm, >100, cực lớn); chưa có filter classId dương không tồn tại trả danh sách rỗng. Reference: backend/src/test/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationControllerMockMvcTest.java:47-81; backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:199-240; backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationPersistenceIntegrationTest.java:97-120.
- B6/B7: #59 blank đã có test service mới; chưa test classId=0 hoặc classId âm. Test lớp không tồn tại dùng ID mock dương, không phải biên 0/âm. Reference: backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:151-161,194-204; backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:124-141,187-195.
- B8: chưa test chữ hoặc Long overflow cho GET/PUT/DELETE /evaluations/{id}; test detail dùng ID số hợp lệ. Reference: backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:161-183,244-259; handler tương ứng: backend/src/main/java/com/english_hub/core/common/GlobalExceptionHandler.java:39-42.
- C9/C10: teacherName chỉ được test với tên hiện tại; chưa test rename/soft-delete. Chưa test gọi POST lặp lại cho cùng student/class; fixture list có nhiều row cùng cặp do helper persistence tạo trực tiếp, không phải POST lặp. Reference: backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:199-219,287-290; backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:69-84.
- D11/D12: không có test riêng xác nhận transaction boundary; mapping 400 cho type mismatch và 500 "Lỗi máy chủ." chưa có test. Các envelope 403, membership 400 và missing evaluation 404 có test như mục 12. Reference: backend/src/test/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationControllerMockMvcTest.java:133-150; backend/src/test/java/com/english_hub/core/modules/student_evaluation/integration/StudentEvaluationApiIntegrationTest.java:180-195,248-259; backend/src/main/java/com/english_hub/core/common/GlobalExceptionHandler.java:39-69.

**Các quyết định nghiệp vụ/contract được chốt sau vòng rà soát** được ghi ở mục “Xác nhận 4 quyết định cuối trước commit” bên dưới; lưu ý hiệu năng lookup teacherName theo từng item vẫn là một quan sát, không đổi trong phạm vi này.

### Implementation decisions and fixes affecting this handoff

1. **403/404 của #60/#61/#62 giữ nguyên theo contract PDF.** Thứ tự role/load/ownership hiện tại không đổi. Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:101-108,111-119,122-128,153-162`.
2. **#59 content blank đã được fix.** `isBlank()` chặn spaces/tab/newline và dùng đúng 400 message “Nội dung đánh giá không được để trống.” như #61; test mới xác nhận content gồm spaces trả status/message đúng. Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:29,70-78`; `backend/src/test/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationServiceTest.java:151-161`.
3. **Page/limit #58 giữ đúng cùng logic #52 của Grading.** Hai bên default page=1, limit=20; page tối thiểu 1, limit 1–100; giá trị invalid trả 400 cùng message validation. Không thêm max page vì Grading cũng không đặt max cho page dương. Reference: `backend/src/main/java/com/english_hub/core/modules/grading/presentation/rest/GradingController.java:68-78`; `backend/src/main/java/com/english_hub/core/modules/grading/application/service/GradingService.java:298-305`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/presentation/rest/StudentEvaluationController.java:34-46`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:30,164-168`.
4. **teacherName giữ live lookup; không thêm snapshot column/migration.** Response đọc tên hiện tại từ User.fullName qua ClassRepository; schema student_evaluations không có teacher_name và mapper không persist teacherName. Reference: `backend/src/main/java/com/english_hub/core/modules/student_evaluation/application/service/StudentEvaluationService.java:130-135`; `backend/src/main/java/com/english_hub/core/modules/classroom/infrastructure/adapter/ClassJpaAdapter.java:112-117`; `backend/src/main/java/com/english_hub/core/modules/student_evaluation/infrastructure/mapper/StudentEvaluationPersistenceMapper.java:28-35`; `backend/src/main/resources/db/migration/V1__init_schema.sql:522-540`.

**Kết quả chạy mới nhất:** module student_evaluation 33/33 pass; `./gradlew build` toàn backend thành công với 469 test, 0 failure, 0 error, 0 skipped. Reference: các XML test reports ở mục 4, dòng 177; `backend/build/reports/tests/test/index.html:1`.
