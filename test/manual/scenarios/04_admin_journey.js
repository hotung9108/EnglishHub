const { By } = require('selenium-webdriver');
const config = require('../config/manual_config');
const visualLogger = require('../lib/visual_logger');
const evaluator = require('../lib/ux_evaluator');

async function runAdminJourneyScenario(driverManager) {
  const driver = driverManager.driver;
  console.log('\n====================================================');
  console.log('>>> [SCENARIO 4] ĐÓNG VAI QUẢN TRỊ VIÊN (ADMIN JOURNEY)');
  console.log('====================================================');

  await driverManager.setViewport(config.viewports.desktop.width, config.viewports.desktop.height);

  // 1. Đăng nhập với tài khoản Admin
  await driver.get(`${config.baseUrl}/login`);
  await driverManager.safeType('input[type="email"]', config.accounts.admin.email);
  await driverManager.safeType('input[type="password"]', config.accounts.admin.password);
  await driverManager.safeClick('button[type="submit"]');
  await driverManager.sleep(2500);

  // 2. Chụp Dashboard Quản trị
  await visualLogger.captureScreenshot(
    driver,
    '04_admin',
    '01_admin_dashboard',
    'Dashboard Quản trị: Chỉ số KPI toàn trường, Sĩ số & Hoạt động hệ thống',
    { srs: 'UC04, USA-01, USA-02' }
  );

  // 3. Mở Quản lý tài khoản (/admin/accounts)
  await driver.get(`${config.baseUrl}/admin/accounts`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '04_admin',
    '02_admin_accounts_management',
    'Quản lý người dùng: Bộ lọc vai trò (Admin, Giáo viên, Học viên) & Trạng thái',
    { srs: 'UC04..UC07, USA-01' }
  );

  // Thử mở Modal chi tiết / chỉnh sửa một tài khoản
  const clickedAccount = await driverManager.safeClickAny([
    '//main//table//tbody//tr[1]//button',
    '//main//table//tbody//tr[1]//a',
    '//button[contains(., "Sửa") or contains(., "Chi tiết") or contains(., "Xem")]'
  ]);
  if (clickedAccount) {
    await driverManager.sleep(1200);
    await visualLogger.captureScreenshot(
      driver,
      '04_admin',
      '08_admin_account_detail_modal',
      'Modal Chi tiết tài khoản & Cấu hình phân quyền',
      { srs: 'UC04, UC05, USA-01' }
    );
    // Đóng modal nếu có nút đóng/hủy
    await driverManager.safeClickAny([
      '//button[contains(., "Đóng") or contains(., "Hủy") or contains(., "Cancel")]',
      '.modal-close',
      'button[aria-label="Close"]'
    ]);
  }

  // 4. Mở Quản lý lớp học (/admin/classes)
  await driver.get(`${config.baseUrl}/admin/classes`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '04_admin',
    '03_admin_classes_management',
    'Quản lý danh sách lớp học toàn trường và phân công giảng viên',
    { srs: 'UC08, UC09, USA-06' }
  );

  // Thử mở chi tiết một lớp học
  const clickedClass = await driverManager.safeClickAny([
    '//main//table//tbody//tr[1]//a',
    '//main//table//tbody//tr[1]//button',
    '//a[contains(@href, "/admin/classes/")]'
  ]);
  if (clickedClass) {
    await driverManager.sleep(1500);
    await visualLogger.captureScreenshot(
      driver,
      '04_admin',
      '09_admin_class_detail_view',
      'Chi tiết lớp học Quản trị: Danh sách thành viên, Giáo viên & Sĩ số',
      { srs: 'UC08, UC09, USA-06' }
    );
  }

  // 5. Mở Kho lưu trữ lớp học (/admin/classes/archive)
  await driver.get(`${config.baseUrl}/admin/classes/archive`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '04_admin',
    '04_admin_classes_archive',
    'Kho lưu trữ lớp học đã hoàn thành (Archive Repository)',
    { srs: 'UC08, USA-06' }
  );

  // 6. Mở Báo cáo tổng hợp (/admin/reports)
  await driver.get(`${config.baseUrl}/admin/reports`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '04_admin',
    '05_admin_reports_analytics',
    'Báo cáo & Thống kê tiến độ đào tạo và tỷ lệ hoàn thành',
    { srs: 'UC36, USA-02' }
  );

  // 7. Mở Nhật ký Audit chấm điểm (/admin/audit/gradings)
  await driver.get(`${config.baseUrl}/admin/audit/gradings`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '04_admin',
    '06_admin_audit_logs',
    'Nhật ký Audit: Giám sát toàn vẹn sửa điểm và can thiệp kết quả',
    { srs: 'UC31, USA-06' }
  );

  // 8. Mở Cài đặt hệ thống (/admin/settings)
  await driver.get(`${config.baseUrl}/admin/settings`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '04_admin',
    '07_admin_settings_view',
    'Cài đặt hệ thống: Cấu hình tham số vận hành và bảo mật',
    { srs: 'UC03, USA-01' }
  );

  // 9. Chụp Responsive trên Mobile (375x812)
  await driver.get(`${config.baseUrl}/admin/dashboard`);
  await driverManager.setViewport(config.viewports.mobile.width, config.viewports.mobile.height);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '05_responsive_mobile',
    '04_admin_dashboard_mobile',
    'Dashboard Quản trị trên thiết bị di động (375x812)',
    { srs: 'USA-05' }
  );

  // Phục hồi lại Desktop
  await driverManager.setViewport(config.viewports.desktop.width, config.viewports.desktop.height);

  // Đăng xuất dọn phiên
  await driver.get(`${config.baseUrl}/login`);
  await driver.executeScript('localStorage.clear(); sessionStorage.clear();');

  // Ghi nhận đánh giá & phê bình Heuristics cho Admin
  evaluator.setRoleScore('admin', { aesthetics: 8.5, usability: 8.0, completeness: 8.0 });
}

module.exports = runAdminJourneyScenario;
