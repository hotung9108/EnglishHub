# ADR-003: Sử Dụng Tailscale Mesh VPN Trong Tự Động Hóa Triển Khai (CD)

- **Trạng thái**: Đã chấp thuận (Accepted)
- **Ngày quyết định**: 2026-09-22
- **Người đề xuất**: Đội ngũ DevOps
- **Phạm vi tác động**: Các workflow Continuous Delivery (`cd-backend.yml`, `cd-backend-development.yml`), cấu hình an ninh máy chủ

---

## 1. Bối cảnh và Thách thức
Hệ thống Backend của EnglishHub được triển khai trên máy chủ VPS và máy chủ thử nghiệm (Home-Server). Để tự động hóa quy trình Continuous Delivery (CD) từ GitHub Actions:
- Cách truyền thống đòi hỏi máy chủ phải mở cổng SSH (Port 22) ra ngoài Internet công cộng và cấu hình mở cổng mạng (Port Forwarding trên Router nhà mạng).
- Việc mở cổng SSH công khai khiến máy chủ đối mặt với hàng nghìn cuộc tấn công dò quét cổng tự động và vét cạn mật khẩu mỗi ngày.
- Nếu triển khai trên Home-Server sau mạng NAT của nhà mạng (CGNAT), việc cấp phát IP tĩnh công khai rất tốn kém và phức tạp.

---

## 2. Quyết định
Nhóm quyết định tích hợp công nghệ **Mạng riêng ảo Tailscale Mesh VPN** (dựa trên giao thức mã hóa WireGuard) vào quy trình triển khai tự động:

1. **Kết nối mạng động (Ephemeral Tailscale Node)**:
   - Trong workflow GitHub Actions, sử dụng action chính thức `tailscale/github-action@v2` kết hợp khóa xác thực dùng một lần `TAILSCALE_AUTHKEY`.
   - Mỗi lần workflow chạy, runner tạm thời trở thành một nút mạng trong mạng riêng ảo (Tailnet) của dự án.
2. **Triển khai qua IP nội bộ**:
   - Bước triển khai SSH sử dụng địa chỉ IP nội bộ của Tailscale (dải `100.x.y.z`) thay vì IP công khai của máy chủ.
   - Toàn bộ cổng SSH của máy chủ trên giao diện mạng công cộng (`eth0`) đều được đóng kín bằng tường lửa (UFW / Firewall), chỉ cho phép kết nối từ giao diện mạng `tailscale0`.

---

## 3. Hệ quả và Đánh giá

### Ưu điểm:
- **An toàn tuyệt đối**: Loại bỏ hoàn toàn nguy cơ bị quét cổng SSH từ Internet công cộng.
- **Hoạt động xuyên tường lửa / CGNAT**: Tự động vượt qua các lớp NAT phức tạp của router gia đình mà không cần mở cổng modem.
- **Mã hóa đầu cuối**: Toàn bộ lưu lượng deploy giữa GitHub Actions runner và máy chủ được mã hóa bằng giao thức WireGuard hiện đại.

### Nhược điểm & Biện pháp khắc phục:
- Thời gian chạy pipeline tăng thêm khoảng 5-10 giây để thiết lập kết nối VPN.
- *Biện pháp*: Mức tăng thời gian này là không đáng kể so với lợi ích bảo mật vượt trội mà giải pháp mang lại.
