# Dùng bộ kiểm thử sau khi lấy code

## Cài đặt

Yêu cầu Node.js 22 trở lên và Chrome hoặc Edge. Python chỉ cần khi nhập lại case từ workbook; chạy catalog JSON có sẵn không cần Python.

Từ thư mục repository:

```powershell
cd test/selenium
npm ci
npm run check
npm run list
```

Hai lệnh cuối kiểm tra offline, không tạo dữ liệu staging. Không dùng `npm test` để chỉ kiểm tra cài đặt vì lệnh đó chạy bộ thật.

## Cấu hình và chạy một ca

```powershell
Copy-Item .env.example .env
# Điền tài khoản QA Admin riêng vào .env bằng editor.
npm run find -- ASG_009
npm test -- ASG_009
```

Runner tạo Teacher/Student và dữ liệu test riêng, ghi journal và thực hiện cleanup. Đọc kết quả cleanup; tài nguyên được archive vẫn còn tồn tại. Bộ fixture hiện chỉ cho phép host staging đã cấu hình trong source, không coi alias dev là bộ hỗ trợ local đầy đủ.

Không dùng `.env`, fixture hoặc Postman từ ba thư mục vai trò cũ. Mỗi thành viên tự cấu hình tài khoản QA; các file này không nằm trong Git.

## Source và báo cáo

- Tra source theo `cases/<chức năng>/<UC>/`; helper ở `common/`.
- Qase mapping và catalog nằm ở `catalog/`, hướng dẫn tích hợp ở `integrations/qase/`.
- Report mới được sinh trong `reports/`; `npm run reports:build` tạo trang tra cứu local.
- Report/TSR lịch sử được bàn giao riêng; clone mới không mặc nhiên có dữ liệu local hoặc backup cũ.
- API review: tại `test/`, chạy `npm run api:check`; đây là kiểm JSON/catalog, không chạy API.

Không commit `.env`, cache, report thô, fixture có tài khoản, runtime cài local hoặc backup private. Chỉ commit phần source/tài liệu đã rà trong `test/`; các thay đổi sản phẩm khác trong workspace cần được review riêng.
