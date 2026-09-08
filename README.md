# EnglishHub

Hệ thống Quản lý & Chấm chữa bài tập Tiếng Anh (English Assignment Management & Smart Grading System).

## 🚀 Hướng dẫn cài đặt và chạy Frontend

Dự án Frontend được xây dựng bằng **Vite**, **React 19**, và **TypeScript**.

### Yêu cầu hệ thống
- Node.js (phiên bản 18+ hoặc mới nhất)
- npm (hoặc yarn/pnpm)

### Các bước cài đặt

1. Di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Khởi động môi trường phát triển (Development Server):
   ```bash
   npm run dev
   ```

4. Mở trình duyệt và truy cập vào địa chỉ mạng cục bộ được hiển thị trong terminal (thường là `http://localhost:5173/`).

### Các lệnh phổ biến khác trong Frontend

- **Build production**: Kiểm tra lỗi TypeScript và biên dịch mã nguồn để chuẩn bị triển khai.
  ```bash
  npm run build
  ```
- **Preview**: Xem thử giao diện của bản build production ngay trên máy tính (chạy sau khi build).
  ```bash
  npm run preview
  ```

### Tài khoản Mock (Đăng nhập thử nghiệm)

Hệ thống hiện tại đang sử dụng mock auth để kiểm tra phân quyền (Role-Based Access Control). Bạn có thể đăng nhập bằng các email sau (mật khẩu bất kỳ, hoặc dùng các nút Quick Login trên màn hình đăng nhập):
- **Admin**: `admin@eh.com`
- **Giáo viên**: `teacher@eh.com`
- **Học sinh**: `student@eh.com`

## 🛠 Công nghệ sử dụng
- [Vite](https://vitejs.dev/) - Trình đóng gói và server phát triển siêu tốc.
- [React](https://react.dev/) (v19) - Thư viện xây dựng giao diện người dùng.
- [TypeScript](https://www.typescriptlang.org/) - Đảm bảo code chặt chẽ và an toàn (Type-safe).
- [React Router](https://reactrouter.com/) - Quản lý điều hướng/Routing.
- [Lucide React](https://lucide.dev/) - Cung cấp bộ icon giao diện hiện đại.
