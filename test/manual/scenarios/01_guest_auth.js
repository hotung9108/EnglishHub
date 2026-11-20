const { By } = require('selenium-webdriver');
const config = require('../config/manual_config');
const visualLogger = require('../lib/visual_logger');
const evaluator = require('../lib/ux_evaluator');

async function runGuestAuthScenario(driverManager) {
  const driver = driverManager.driver;
  console.log('\n====================================================');
  console.log('>>> [SCENARIO 1] ĐÓNG VAI KHÁCH & XÁC THỰC (GUEST / AUTH)');
  console.log('====================================================');

  await driverManager.setViewport(config.viewports.desktop.width, config.viewports.desktop.height);

  // 1. Mở trang Login mặc định
  await driver.get(`${config.baseUrl}/login`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '01_auth',
    '01_login_default',
    'Màn hình đăng nhập mặc định (Desktop 1920x1080)',
    { srs: 'UC01, USA-01' }
  );

  // 2. Thử submit form trống để kích hoạt validation
  const submitBtn = await driverManager.safeFind('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await driverManager.sleep(800);
    await visualLogger.captureScreenshot(
      driver,
      '01_auth',
      '02_login_validation_empty',
      'Trạng thái cảnh báo khi gửi form đăng nhập trống',
      { srs: 'USA-03, USA-04' }
    );
  }

  // 3. Nhập email sai định dạng
  await driverManager.safeType('input[type="email"]', 'hocvien@@sai-dinh-dang..com');
  await driverManager.safeType('input[type="password"]', '123456');
  if (submitBtn) {
    await submitBtn.click();
    await driverManager.sleep(800);
    await visualLogger.captureScreenshot(
      driver,
      '01_auth',
      '03_login_validation_bad_email',
      'Cảnh báo lỗi định dạng email sai cú pháp',
      { srs: 'USA-04' }
    );
  }

  // 4. Nhập mật khẩu sai để kiểm tra phản hồi toast từ server
  await driverManager.safeType('input[type="email"]', config.accounts.student.email);
  await driverManager.safeType('input[type="password"]', 'WrongPassword999!');
  if (submitBtn) {
    await submitBtn.click();
    await driverManager.sleep(1500);
    await visualLogger.captureScreenshot(
      driver,
      '01_auth',
      '04_login_wrong_credentials',
      'Thông báo Toast cảnh báo đăng nhập sai mật khẩu',
      { srs: 'UC01, USA-03' }
    );
  }

  // 5. Mở trang Quên mật khẩu
  await driver.get(`${config.baseUrl}/forgot-password`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '01_auth',
    '05_forgot_password',
    'Giao diện khôi phục mật khẩu (Forgot Password)',
    { srs: 'UC01, USA-01' }
  );

  // 6. Kiểm tra giao diện Responsive trên Mobile (375x812)
  await driver.get(`${config.baseUrl}/login`);
  await driverManager.setViewport(config.viewports.mobile.width, config.viewports.mobile.height);
  await driverManager.sleep(1200);
  await visualLogger.captureScreenshot(
    driver,
    '05_responsive_mobile',
    '01_login_mobile_375px',
    'Độ tương thích màn hình Đăng nhập trên di động (iPhone 375x812)',
    { srs: 'USA-05' }
  );

  // Phục hồi lại viewport Desktop
  await driverManager.setViewport(config.viewports.desktop.width, config.viewports.desktop.height);

  // Ghi nhận đánh giá & phê bình Heuristics cho Auth
  evaluator.setRoleScore('guestAuth', { aesthetics: 7.5, usability: 8.0, completeness: 6.5 });
  evaluator.addAestheticCritique(
    'Màn hình Đăng nhập & Quên mật khẩu',
    'Bố cục dạng thẻ (card) sạch sẽ, tông màu xanh chủ đạo tạo cảm giác giáo dục tin cậy. Tuy nhiên nền ngoài hơi đơn điệu (plain background), thiếu hình ảnh minh họa sinh động (illustration) tạo cảm hứng học tập.',
    'Bổ sung background họa tiết hoặc banner đồ họa mang cảm hứng EdTech ở nửa bên trái theo layout split-screen (phổ biến ở các LMS hiện đại).'
  );
  evaluator.addUsabilityCritique(
    'Thiếu nút Ẩn/Hiện Mật khẩu (Show/Hide Password)',
    'Trường mật khẩu chỉ có type=password che giấu ký tự, không có icon con mắt (eye toggle) để người dùng xem lại mật khẩu vừa gõ.',
    'Người dùng thường xuyên gõ nhầm trên điện thoại hoặc mật khẩu phức tạp có ký tự đặc biệt, dẫn đến thất bại đăng nhập nhiều lần không rõ lý do.',
    'Bổ sung nút toggle ẩn/hiện mật khẩu tiêu chuẩn theo NFR USA-01.'
  );
  evaluator.addMissingFeature(
    'Xác thực (Auth)',
    'Đăng nhập qua Google / Microsoft SSO',
    'Là học viên trường đại học, tôi muốn đăng nhập 1-chạm bằng tài khoản email sinh viên (@utc.edu.vn / Google) thay vì phải nhớ thêm mật khẩu riêng.',
    'Giảm thiểu tối đa 90% khiếu nại quên mật khẩu và tăng tỷ lệ tiếp cận hệ thống.',
    'High'
  );
}

module.exports = runGuestAuthScenario;
