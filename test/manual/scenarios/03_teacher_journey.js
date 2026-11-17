const { By } = require('selenium-webdriver');
const config = require('../config/manual_config');
const visualLogger = require('../lib/visual_logger');
const evaluator = require('../lib/ux_evaluator');

async function runTeacherJourneyScenario(driverManager) {
  const driver = driverManager.driver;
  console.log('\n====================================================');
  console.log('>>> [SCENARIO 3] ĐÓNG VAI GIÁO VIÊN (TEACHER JOURNEY)');
  console.log('====================================================');

  await driverManager.setViewport(config.viewports.desktop.width, config.viewports.desktop.height);

  // 1. Đăng nhập với tài khoản Giáo viên
  await driver.get(`${config.baseUrl}/login`);
  await driverManager.safeType('input[type="email"]', config.accounts.teacher.email);
  await driverManager.safeType('input[type="password"]', config.accounts.teacher.password);
  await driverManager.safeClick('button[type="submit"]');
  await driverManager.sleep(2500);

  // 2. Chụp Dashboard Giáo viên
  await visualLogger.captureScreenshot(
    driver,
    '03_teacher',
    '01_teacher_dashboard',
    'Dashboard Giáo viên: Thống kê lớp phụ trách & Bài nộp chờ chấm',
    { srs: 'UC11, USA-01, USA-06' }
  );

  // 3. Mở Quản lý lớp học (/teacher/classes)
  await driver.get(`${config.baseUrl}/teacher/classes`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '03_teacher',
    '02_teacher_classes_list',
    'Danh sách lớp học do giáo viên phụ trách',
    { srs: 'UC08, UC09, USA-01' }
  );

  // 4. Mở Tiến độ lớp học (/teacher/progress)
  await driver.get(`${config.baseUrl}/teacher/progress`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '03_teacher',
    '03_teacher_class_progress',
    'Báo cáo tiến độ học tập và phân tích 4 kỹ năng của lớp',
    { srs: 'UC35, USA-02' }
  );

  // 5. Mở Danh sách bài tập (/teacher/assignments)
  await driver.get(`${config.baseUrl}/teacher/assignments`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '03_teacher',
    '04_teacher_assignments_list',
    'Quản lý danh sách bài tập đã giao và trạng thái mở/đóng',
    { srs: 'UC11, USA-01' }
  );

  // Click vào bài tập để vào Studio Chấm bài (Grading Studio)
  const clickedGrading = await driverManager.safeClickAny([
    '//button[contains(., "Chấm bài") or contains(., "Xem bài nộp") or contains(., "Submissions")]',
    '//a[contains(., "Chấm bài") or contains(., "Xem bài nộp") or contains(@href, "/grading") or contains(@href, "/submissions")]',
    '//div[contains(@class, "teacher-assignment-card")]//button',
    '//div[contains(@class, "teacher-assignment-card")]//a'
  ]);
  await driverManager.sleep(2000);
  await visualLogger.captureScreenshot(
    driver,
    '03_teacher',
    '08_teacher_grading_studio',
    'Studio Chấm bài: Danh sách bài nộp của học viên và Khung cho điểm / Nhận xét',
    { srs: 'UC24..UC27, USA-01, USA-03' }
  );

  // 6. Mở Giao diện Tạo bài tập mới (/teacher/assignments/create)
  await driver.get(`${config.baseUrl}/teacher/assignments/create`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '03_teacher',
    '05_teacher_create_assignment_wizard',
    'Studio Khởi tạo bài tập đa kỹ năng (Writing/Reading/Listening/Speaking)',
    { srs: 'UC12, UC13, USA-04' }
  );

  // 7. Mở Ngân hàng đề thi (/teacher/exam-bank)
  await driver.get(`${config.baseUrl}/teacher/exam-bank`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '03_teacher',
    '06_teacher_exam_bank',
    'Ngân hàng đề thi mẫu và tài liệu tái sử dụng',
    { srs: 'UC11, USA-01' }
  );

  // 8. Mở Hồ sơ giáo viên (/teacher/profile)
  await driver.get(`${config.baseUrl}/teacher/profile`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '03_teacher',
    '07_teacher_profile',
    'Hồ sơ giáo viên, chuyên môn giảng dạy và đổi mật khẩu',
    { srs: 'UC03, USA-01' }
  );

  // 9. Chụp Responsive trên Mobile (375x812)
  await driver.get(`${config.baseUrl}/teacher/dashboard`);
  await driverManager.setViewport(config.viewports.mobile.width, config.viewports.mobile.height);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '05_responsive_mobile',
    '03_teacher_dashboard_mobile',
    'Dashboard Giáo viên trên màn hình di động (375x812)',
    { srs: 'USA-05' }
  );

  // Phục hồi lại Desktop
  await driverManager.setViewport(config.viewports.desktop.width, config.viewports.desktop.height);

  // Đăng xuất dọn phiên
  await driver.get(`${config.baseUrl}/login`);
  await driver.executeScript('localStorage.clear(); sessionStorage.clear();');

  // Ghi nhận đánh giá & phê bình Heuristics cho Teacher
  evaluator.setRoleScore('teacher', { aesthetics: 8.0, usability: 8.0, completeness: 7.5 });
}

module.exports = runTeacherJourneyScenario;
