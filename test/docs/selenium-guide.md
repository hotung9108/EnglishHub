# Hướng dẫn Selenium

Đọc [README bộ chính](../selenium/README.md) trước khi chạy. Case chia theo chức năng → UC trong [cases/](../selenium/cases/README.md); helper và runner ở `selenium/common/`.

Tại `test/selenium`:

```powershell
npm run find -- ASG_009
npm run list
npm run check
```

Ba lệnh trên làm việc offline. `npm test -- ASG_009` chạy ca thật, có thể tạo fixture trên môi trường đã cấu hình. Dùng `.env.example` và README để cấu hình tài khoản riêng.

Launcher hiện hành nằm ở [scripts/](../scripts/README.md). Hướng dẫn scaffold/POM cũ không còn mô tả đường dẫn của bộ chính.
