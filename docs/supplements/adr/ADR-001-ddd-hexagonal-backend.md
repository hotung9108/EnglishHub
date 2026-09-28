# ADR-001: Áp Dụng Kiến Trúc DDD và Hexagonal Cho Backend

- **Trạng thái**: Đã chấp thuận (Accepted)
- **Ngày quyết định**: 2026-09-15
- **Người đề xuất**: Đội ngũ Kỹ thuật Backend & Kiến trúc hệ thống
- **Phạm vi tác động**: Toàn bộ mã nguồn `backend/`

---

## 1. Bối cảnh và Thách thức
Trong tài liệu thiết kế ban đầu, hệ thống dự kiến sử dụng mô hình MVC 3 lớp truyền thống (Controller -> Service -> Repository / Entity). Tuy nhiên, EnglishHub có tính chất nghiệp vụ phức tạp liên quan đến 4 kỹ năng (Nghe, Nói, Đọc, Viết), quy trình chấm điểm đa bước (Pending -> In Progress -> Graded), nhật ký thay đổi điểm, và tích hợp AI.

Mô hình 3 lớp truyền thống thường dẫn đến:
- Tầng Service phình to (Anemic Domain Model & Fat Services).
- Logic nghiệp vụ bị phụ thuộc chặt chẽ vào Spring Data JPA và framework Spring Boot.
- Khó kiểm thử độc lập các quy tắc nghiệp vụ cốt lõi mà không cần khởi động toàn bộ ngữ cảnh Spring.

---

## 2. Quyết định
Nhóm quyết định tái cấu trúc và chuẩn hóa Backend theo mô hình **Modular Monolith** áp dụng nguyên lý **Domain-Driven Design (DDD)** kết hợp **Kiến trúc Lục giác (Hexagonal Architecture / Ports and Adapters)**:
1. **Tách biệt 4 phân tầng**:
   - `domain/`: Chứa các thực thể cốt lõi, đối tượng giá trị (Value Objects), quy tắc nghiệp vụ và ngoại lệ thuần Java (Pure Java, không phụ thuộc framework).
   - `application/`: Định nghĩa các Input Ports (Interfaces use case), Output Ports (Interfaces repository/storage) và Application Services điều phối luồng.
   - `infrastructure/`: Triển khai các Output Ports bằng JPA Adapters, Spring Data Repositories, S3 Storage Adapters.
   - `presentation/`: Các REST Controllers, DTO và Mappers nhận yêu cầu HTTP.
2. **Tách biệt 7 Cụm API**: Phân rã thành các mô-đun nghiệp vụ độc lập (`auth`, `teacher`, `class`, `assignment`, `module`, `submission`, `grading`).

---

## 3. Hệ quả và Đánh giá

### Ưu điểm:
- Logic nghiệp vụ được cô lập hoàn toàn, dễ dàng bảo trì và viết Unit Test với tốc độ thực thi chỉ vài mili-giây.
- Giảm thiểu tối đa xung đột mã nguồn khi nhiều lập trình viên cùng làm việc trên các mô-đun khác nhau.
- Tự do thay đổi cơ sở dữ liệu hoặc cơ chế lưu trữ ở tầng Infrastructure mà không cần chạm vào logic nghiệp vụ cốt lõi.

### Nhược điểm & Biện pháp khắc phục:
- Số lượng lớp và giao diện (Interfaces) tăng lên (cần mapper giữa Domain Entity và JPA Entity).
- *Biện pháp*: Sử dụng quy chuẩn đặt tên rõ ràng và các mapper chuyên trách (`SubmissionPersistenceMapper`,...) để tự động hóa việc chuyển đổi dữ liệu.
