# ADR-002: Chuẩn Hóa Lớp Lưu Trữ Tệp S3-Compatible và Presigned URL

- **Trạng thái**: Đã chấp thuận (Accepted)
- **Ngày quyết định**: 2026-09-20
- **Người đề xuất**: Đội ngũ Backend & DevOps
- **Phạm vi tác động**: Phân hệ nộp bài Nói (Speaking) và Viết (Writing), cấu hình hạ tầng lưu trữ

---

## 1. Bối cảnh và Thách thức
Học sinh cần nộp các tệp ghi âm giọng nói định dạng lớn (`.mp3`, `.wav`, `.webm`) và tệp tài liệu bài luận (`.pdf`, `.docx`). 

Nếu sử dụng phương thức truyền thống (Client gửi `multipart/form-data` trực tiếp lên Backend Spring Boot):
- Server backend phải chịu tải nặng về băng thông mạng, bộ nhớ RAM và tiêu tốn luồng xử lý (thread starvation) khi nhiều học sinh nộp bài cùng lúc.
- Rủi ro nghẽn cổ chai tại máy chủ ứng dụng khi tệp âm thanh có dung lượng lớn.
- Khó mở rộng hệ thống nếu lưu trữ trực tiếp trên ổ đĩa cục bộ của máy chủ (Local File System).

---

## 2. Quyết định
Nhóm quyết định áp dụng giải pháp **Lưu trữ Đối tượng Đám mây (Object Storage) chuẩn Amazon S3 API** kết hợp cơ chế **Presigned PUT URL**:

1. **Lớp trừu tượng độc lập nhà cung cấp (Provider-Agnostic)**:
   - Xây dựng cổng giao tiếp `StorageService` với phương thức `generatePresignedPutUrl` và `objectExists`.
   - Sử dụng AWS SDK v2 kết hợp tính năng `endpointOverride` và `path-style`, cho phép cấu hình linh hoạt để chạy với bất kỳ nhà cung cấp tương thích S3 nào: **Cloudflare R2**, **AWS S3**, **Neon Storage**, hoặc **MinIO**.
2. **Cơ chế tải tệp trực tiếp (Direct-to-Cloud Upload)**:
   - Client yêu cầu URL tải lên có chữ ký số tạm thời (hết hạn sau 15 phút).
   - Client tải tệp trực tiếp từ trình duyệt lên Bucket lưu trữ đám mây qua giao thức HTTP PUT.
   - Khi hoàn tất, Client gửi thông báo nộp bài, Backend chỉ cần kiểm tra sự tồn tại của tệp (`objectExists`) mà không cần xử lý luồng byte dữ liệu.
3. **Cơ chế dự phòng (Graceful Degradation)**:
   - Triển khai `UnavailableStorageService` tự động kích hoạt khi `app.storage.s3.enabled=false`, giúp ứng dụng khởi động bình thường trên máy tính của lập trình viên chưa có tài khoản cloud.

---

## 3. Hệ quả và Đánh giá

### Ưu điểm:
- Giảm tải 100% gánh nặng băng thông và CPU lưu trữ cho máy chủ Backend Spring Boot.
- An toàn tuyệt đối: Khóa bảo mật của Bucket (Access Key / Secret Key) chỉ lưu trên server, client chỉ nhận được URL tạm thời với quyền hạn và thời gian giới hạn.
- Có thể kiểm thử tự động toàn diện trên CI bằng container MinIO thông qua Testcontainers mà không tốn chi phí thuê cloud thật.

### Nhược điểm & Biện pháp khắc phục:
- Luồng nộp bài phía Frontend chia thành 2 bước (lấy URL -> upload lên cloud -> nộp bài lên backend).
- *Biện pháp*: Tạo tài liệu hướng dẫn tích hợp chi tiết tại `production_artifacts/be_to_tester/submissions-api-phase1-testing.md` để lập trình viên Frontend dễ dàng hiện thực.
