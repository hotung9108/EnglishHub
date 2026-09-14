---
name: convention-be
description: Backend DDD (Domain-Driven Design) coding conventions, architecture patterns, and engineering standards for Spring Boot Java backend.
---

# EnglishHub Backend Conventions (Java 21 / Spring Boot / Domain-Driven Design)

Tài liệu quy chuẩn kiến trúc và phát triển Backend cho dự án **EnglishHub** áp dụng **Domain-Driven Design (DDD)** kết hợp **Hexagonal / Clean Architecture**. Tất cả Backend Agents (`@be-primary`, `@be-secondary`) và lập trình viên Backend phải tuân thủ nghiêm ngặt các nguyên tắc dưới đây, đồng thời tuân thủ hợp đồng giao tiếp chung tại [.agents/rules/common-conventions.md](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/common-conventions.md).


---

## 1. Công nghệ & Nền tảng kỹ thuật
- **Ngôn ngữ**: Java 21 (LTS).
- **Framework**: Spring Boot 3.x / 4.x (Spring WebMVC, Spring Data JPA, Spring Validation).
- **Cơ sở dữ liệu**: PostgreSQL.
- **Migration**: Flyway (`src/main/resources/db/migration`).
- **Build Tool**: Gradle.
- **Kiểm thử**: JUnit 5, Mockito, AssertJ, MockMvc.

---

## 2. Kiến trúc Tổng thể DDD (Bounded Contexts & Layered Structure)

Hệ thống được tổ chức theo **Bounded Contexts (Modules nghiệp vụ)** thay vì nhóm kỹ thuật thuần túy (package-by-feature / context). 

### 2.1. Cây thư mục chuẩn (`com.english_hub.backend`)

```text
com.english_hub.backend/
├── shared/                         # Shared Kernel (dùng chung cho các context)
│   ├── domain/                     # BaseAggregateRoot, BaseEntity, ValueObject, DomainEvent
│   ├── application/                # Common DTOs, PagedResult, BaseUseCase
│   ├── infrastructure/             # GlobalExceptionHandler, SecurityUtils, CommonConfigs
│   └── presentation/               # ApiResponse wrapper
│
└── modules/                        # Các Bounded Contexts
    ├── identity/                   # Context Quản lý tài khoản, phân quyền, xác thực
    ├── classroom/                  # Context Lớp học, học viên, phân công giáo viên
    ├── assignment/                 # Context Quản lý bài tập (Writing, Speaking, Reading, Listening)
    └── grading/                    # Context Nộp bài, chấm điểm AI, nhận xét & phản hồi
        ├── domain/                 # CORE DOMAIN (Không phụ thuộc framework)
        │   ├── model/              # Aggregate Roots, Entities
        │   ├── valueobject/        # Value Objects (Score, FeedbackCriteria, AudioMetadata)
        │   ├── event/              # Domain Events (SubmissionGradedEvent, ...)
        │   ├── repository/         # Repository Interfaces (Domain Ports)
        │   └── service/            # Domain Services (logic đa aggregate)
        │
        ├── application/            # USE CASES (Điều phối luồng nghiệp vụ)
        │   ├── usecase/            # Use Case Interfaces & Implementations
        │   └── dto/                # Request (Commands/Queries) & Response DTOs
        │
        ├── infrastructure/         # ADAPTERS NGOÀI & KỸ THUẬT
        │   ├── persistence/        # Spring Data JPA Repositories, JPA Entities, EntityMapper
        │   └── external/           # AI Engine Clients (OpenAI, Whisper API, Cloud Storage)
        │
        └── presentation/           # ADAPTER GIAO DIỆN (REST API)
            └── controller/         # REST Controllers, API Requests Validation
```

---

## 3. Nguyên tắc 4 Tầng trong DDD (The 4 Layers)

### 3.1. Domain Layer (Tầng lõi - Pure Java)
- **Độc lập tuyệt đối**: Không chứa code phụ thuộc vào Spring Data, Hibernate, HTTP hay thư viện bên ngoài (ngoại trừ Jakarta Validation hoặc Lombok nếu cần thiết).
- **Rich Domain Model (Mô hình nghiệp vụ giàu có)**:
  - **Cấm Anemic Domain Model**: Không tạo Entity chỉ gồm thuộc tính và getter/setter rỗng tuếch.
  - Mọi thay đổi trạng thái, kiểm tra ràng buộc (invariants) phải nằm trong chính Entity / Aggregate Root thông qua các phương thức nghiệp vụ mang ý nghĩa ngôn ngữ chung (Ubiquitous Language).
  - *Ví dụ chuẩn*:
    ```java
    // Đúng: Đóng gói logic trong Aggregate Root
    public void submitAssignment(StudentId studentId, SubmissionContent content) {
        if (this.status != AssignmentStatus.OPEN) {
            throw new DomainException("Assignment is not open for submission");
        }
        if (LocalDateTime.now().isAfter(this.deadline.value())) {
            throw new DomainException("Submission deadline has passed");
        }
        // Thêm submission và bắn domain event
        registerEvent(new AssignmentSubmittedEvent(this.id, studentId));
    }
    ```
- **Value Objects (Đối tượng giá trị)**:
  - Bất biến (Immutable - nên dùng Java `record`).
  - Không có identity riêng, so sánh bằng giá trị.
  - Ví dụ: `Score` (giá trị 0.0 - 10.0), `Email`, `Deadline`, `RubricItem`.
- **Repository Interface**:
  - Khai báo tại Domain Layer dưới dạng Interface thuần Java đại diện cho một bộ sưu tập (Collection-like interface), ví dụ: `SubmissionRepository`.
  - Không kế thừa `JpaRepository` của Spring Data ở đây.

### 3.2. Application Layer (Tầng ứng dụng / Use Cases)
- **Nhiệm vụ**: Điều phối luồng xử lý của hệ thống, không chứa nghiệp vụ lõi (business rules).
- **Trách nhiệm**:
  - Nhận Command hoặc Query từ Presentation.
  - Quản lý ranh giới giao dịch (`@Transactional`).
  - Gọi Repository để tải Aggregate Root lên.
  - Kích hoạt các phương thức nghiệp vụ trên Aggregate.
  - Lưu lại Aggregate thông qua Repository.
  - Phát hành Domain Events hoặc gọi Infrastructure notification nếu cần.
- **DTO Transformation**: Chuyển đổi dữ liệu giữa Domain Entities và Response DTOs. Tuyệt đối không để Domain Entity lọt ra ngoài Application Layer.

### 3.3. Infrastructure Layer (Tầng hạ tầng kỹ thuật)
- **Triển khai Repository (Persistence Adapter)**:
  - Tách biệt rõ giữa **Domain Entity** (phục vụ nghiệp vụ) và **JPA Entity** (phục vụ lưu trữ bảng database).
  - Sử dụng Mapper (hoặc MapStruct) để chuyển đổi qua lại giữa `DomainModel <-> JpaEntity`.
  - Chứa `SpringDataJpaSubmissionRepository` và lớp hiện thực `SubmissionRepositoryImpl` cài đặt interface từ domain.
- **External Services**:
  - Kết nối dịch vụ bên ngoài: AI Grading Service (OpenAI GPT, Whisper API), Cloud File Storage, Mail Service.
  - Tách qua Interface Port để dễ dàng mock hoặc thay đổi nhà cung cấp mà không sửa Domain logic.

### 3.4. Presentation Layer (Tầng Web / REST API)
- **Controller**:
  - Chỉ làm nhiệm vụ đón HTTP request, validate cú pháp với `@Valid`, gọi Use Case tương ứng của Application Layer và đóng gói kết quả vào `ApiResponse<T>`.
  - Không chứa logic nghiệp vụ hay logic tính toán.

---

## 4. Giao tiếp giữa các Bounded Contexts

1. **Ranh giới Aggregate (Aggregate Boundaries)**:
   - Các Aggregate khác nhau chỉ được liên kết với nhau qua **ID (Identity)**, không liên kết object graph trực tiếp (`@ManyToOne` xuyên context bị cấm).
   - Ví dụ: `Submission` trong context `grading` chỉ lưu `AssignmentId` và `StudentId`, không trỏ trực tiếp đến object `Assignment` hay `Student`.
2. **Giao tiếp bất đồng bộ qua Events**:
   - Ưu tiên sử dụng Domain Events / Application Events (`ApplicationEventPublisher`) để xử lý các tác vụ không cần đồng bộ (ví dụ: khi học viên nộp bài -> bắn event để AI Grading Engine tiến hành chấm ngầm).

---

## 5. Quy chuẩn Đặt tên theo Ubiquitous Language

| Đối tượng | Quy chuẩn đặt tên | Ví dụ |
| :--- | :--- | :--- |
| **Aggregate Root** | PascalCase, danh từ nghiệp vụ | `Assignment`, `Submission`, `Classroom` |
| **Value Object** | PascalCase, Java `record` | `Score`, `TimeRange`, `Feedback` |
| **Use Case (Command/Query)** | Động từ + Danh từ + `UseCase` | `CreateAssignmentUseCase`, `GradeSubmissionUseCase` |
| **Request DTO** | Tên hành động + `Request` / `Command` | `SubmitAssignmentRequest`, `UpdateRubricCommand` |
| **Response DTO** | Danh từ + `Response` | `AssignmentDetailResponse`, `GradingResultResponse` |
| **Domain Event** | Danh từ quá khứ + `Event` | `AssignmentPublishedEvent`, `GradingCompletedEvent` |
| **Repository Interface (Domain)** | Tên Aggregate + `Repository` | `AssignmentRepository`, `SubmissionRepository` |
| **JPA Repository (Infra)** | `SpringData` + Tên Aggregate + `Repository` | `SpringDataAssignmentRepository` |
| **Database Table** | snake_case, số nhiều | `assignments`, `student_submissions` |

---

## 6. Định dạng Chuẩn API Response

Mọi Controller phải bọc kết quả trả về trong `ResponseEntity<ApiResponse<T>>`:

```json
{
  "success": true,
  "message": "Submission graded successfully",
  "data": {
    "submissionId": "sub-101",
    "overallScore": 7.5,
    "aiFeedback": "Good cohesion and coherence, minor lexical errors.",
    "status": "GRADED"
  },
  "timestamp": "2026-09-14T20:55:00Z"
}
```

Nếu có lỗi (Exception), `GlobalExceptionHandler` bắt và trả về:
```json
{
  "success": false,
  "message": "Assignment deadline has passed",
  "errors": [],
  "timestamp": "2026-09-14T20:55:00Z"
}
```

---

## 7. Quy định Cơ sở dữ liệu & Migration (Flyway)
- Cơ sở dữ liệu là chi tiết cài đặt của Infrastructure Layer, phải phục vụ cho Domain Model.
- Tất cả schema script phải lưu tại `src/main/resources/db/migration/V{Version}__{Description}.sql`.
- Khóa chính khuyến khích sử dụng UUID hoặc `BIGINT GENERATED ALWAYS AS IDENTITY`.

---

## 8. Chiến lược Kiểm thử trong DDD (Testing Strategy)

1. **Unit Test cho Domain Layer (Ưu tiên cao nhất)**:
   - Test toàn bộ Invariants, logic tính điểm, chuyển trạng thái của Aggregate Roots và Value Objects.
   - Không cần dùng Spring context, chạy thuần túy bằng JUnit 5 -> Tốc độ cực nhanh.
2. **Unit Test cho Application Layer**:
   - Sử dụng Mockito để mock các Repository và External Services.
   - Kiểm tra xem Use Case có điều phối đúng thứ tự và bắn đúng Events hay không.
3. **Integration Test cho Infrastructure & API**:
   - Test Repository với `@DataJpaTest` hoặc Testcontainers.
   - Test Controller với `@WebMvcTest` và `MockMvc` để đảm bảo API contract.
