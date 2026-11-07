# Cẩm Nang Xử Lý Sự Cố & Gỡ Lỗi (Troubleshooting & FAQ)

Tài liệu này tổng hợp các tình huống lỗi thường gặp trong quá trình vận hành bộ kiểm thử [`test_reborn`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn) và hướng dẫn khắc phục nhanh chóng, chuẩn xác.

---

## 1. Các Lỗi Thường Gặp Về Môi Trường & Trình Duyệt

### 1.1. Lỗi Chrome Updater Pipe: `Access is denied. (0x5)`
- **Hiện tượng**: Khi khởi chạy Selenium trên Windows, console xuất hiện cảnh báo:
  ```text
  [ERROR:chrome\updater\ipc\update_service_dialer_win.cc:77] Failed to open named pipe server process: Access is denied. (0x5)
  ```
- **Nguyên nhân**: Tiến trình cập nhật tự động của Chrome cố gắng mở Windows Named Pipe của dịch vụ hệ thống nhưng bị chặn bởi quyền người dùng thông thường. Lỗi này không ảnh hưởng đến luồng kiểm thử giao diện.
- **Cách khắc phục**: Đã được xử lý tự động trong [`browser-factory.js`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/black-box/e2e/common/support/browser-factory.js) bằng cách bổ sung:
  ```javascript
  options.addArguments(
    '--disable-component-update',
    '--disable-background-networking',
    '--log-level=3'
  );
  options.excludeSwitches('enable-logging');
  ```

---

### 1.2. Tiến trình ChromeDriver bị kẹt (Zombie Processes)
- **Hiện tượng**: Khi runner bị ngắt đột ngột (Ctrl+C), nhiều cửa sổ Chrome ngầm vẫn chạy, gây tốn RAM và xung đột port khi chạy lần kế tiếp.
- **Cách khắc phục**: Chạy lệnh PowerShell sau để dọn dẹp sạch sẽ:
  ```powershell
  Stop-Process -Name "chromedriver", "chrome" -Force -ErrorAction SilentlyContinue
  ```

---

## 2. Các Lỗi Về Kết Nối & Môi Trường Staging

### 2.1. Lỗi Timeout Kết Nối Staging (504 Gateway Timeout hoặc ECONNREFUSED)
- **Hiện tượng**: Runner báo lỗi `TimeoutError: Waiting for selector ... timed out after 15000ms`.
- **Kiểm tra**:
  1. Thử mở trình duyệt truy cập `https://staging.hotung9108.me`.
  2. Kiểm tra trạng thái API: `curl -I https://api-staging.hotung9108.me/api/v1/auth/login`.
- **Cách khắc phục**: 
  - Đảm bảo kết nối Internet ổn định và server Staging đang hoạt động bình thường.
  - Sử dụng cờ retry tự động: Runner đã tích hợp sẵn cơ chế thử lại tối đa 2 lần cho các ca kiểm thử mạng chập chờn.

---

### 2.2. Lỗi Thiếu File Fixture Dữ Liệu (`fixtures/staging.json missing`)
- **Hiện tượng**: Runner báo lỗi `ENOENT: no such file or directory, open 'fixtures/staging.json'`.
- **Nguyên nhân**: File ledger dữ liệu bài tập/lớp học mẫu bị xóa hoặc chưa được khởi tạo.
- **Cách khắc phục**: Khởi tạo lại dữ liệu mẫu bằng cách chạy script seeding:
  ```powershell
  node black-box/e2e/teacher/support/fixtures.js --seed
  ```

---

## 3. Các Lỗi Giao Diện & Selenium Flakiness

### 3.1. Lỗi `StaleElementReferenceException: element is not attached to the page document`
- **Nguyên nhân**: Phần tử DOM đã bị trang web React re-render lại trong lúc Selenium đang chuẩn bị click.
- **Cách khắc phục**: Không lưu biến WebElement lâu. Luôn dùng các hàm bọc an toàn trong `BasePage.js`:
  ```javascript
  // KHÔNG NÊN:
  const btn = await driver.findElement(By.css('.btn-submit'));
  await doSomethingElse();
  await btn.click(); // Rất dễ bị Stale Element

  // NÊN DÙNG:
  await this.click(By.css('.btn-submit')); // Tự động tìm lại và click an toàn
  ```

---

### 3.2. Lỗi Phần Tử Bị Che Khuất: `element click intercepted`
- **Nguyên nhân**: Nút bấm bị thanh thông báo (Toast notification) hoặc backdrop của modal che phủ tạm thời.
- **Cách khắc phục**:
  1. Sử dụng `waitClickable(locator)` để đợi thanh thông báo biến mất.
  2. Sử dụng `scrollIntoView` trước khi tương tác:
     ```javascript
     const elem = await this.waitVisible(locator);
     await this.driver.executeScript('arguments[0].scrollIntoView({ block: "center" });', elem);
     await elem.click();
     ```

---

## 4. Các Lỗi Khi Đồng Bộ Qase TMS

### 4.1. Lỗi `Qase API Token Invalid / 401 Unauthorized`
- **Hiện tượng**: Runner không thể tạo Test Run trên Qase, log báo `Qase sync failed: Invalid token`.
- **Cách khắc phục**:
  - Kiểm tra biến `QASE_API_TOKEN` trong [`common/config/.env`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/common/config/.env).
  - Đảm bảo token vẫn còn hạn sử dụng trên `https://app.qase.io/user/api/tokens`.

---

### 4.2. Lỗi `Rate Limit 429 Too Many Requests`
- **Nguyên nhân**: Gửi quá 300 request / phút lên Qase REST API.
- **Cách khắc phục**:
  - `QaseAdapter` đã tích hợp cơ chế gom nhóm (Batching) và độ trễ an toàn `150ms` giữa các request.
  - Khi đồng bộ số lượng lớn ca kiểm thử, sử dụng endpoint bulk: `POST /v1/case/{code}/bulk` (tối đa 100 cases trong 1 request).
