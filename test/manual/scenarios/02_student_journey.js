const { By } = require('selenium-webdriver');
const config = require('../config/manual_config');
const visualLogger = require('../lib/visual_logger');
const evaluator = require('../lib/ux_evaluator');

async function runStudentJourneyScenario(driverManager) {
  const driver = driverManager.driver;
  console.log('\n====================================================');
  console.log('>>> [SCENARIO 2] ĐÓNG VAI HỌC VIÊN (STUDENT JOURNEY)');
  console.log('====================================================');

  await driverManager.setViewport(config.viewports.desktop.width, config.viewports.desktop.height);

  // 1. Đăng nhập với tài khoản Học viên
  await driver.get(`${config.baseUrl}/login`);
  await driverManager.safeType('input[type="email"]', config.accounts.student.email);
  await driverManager.safeType('input[type="password"]', config.accounts.student.password);
  await driverManager.safeClick('button[type="submit"]');
  await driverManager.sleep(2500);

  // 2. Chụp Dashboard Học viên
  await visualLogger.captureScreenshot(
    driver,
    '02_student',
    '01_student_dashboard',
    'Dashboard Học viên: Thẻ bài tập cần nộp & Lịch học (Desktop 1920x1080)',
    { srs: 'UC10, USA-01, USA-06' }
  );

  // 3. Mở Danh sách lớp học (/student/classes)
  await driver.get(`${config.baseUrl}/student/classes`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '02_student',
    '02_student_classes_list',
    'Danh sách lớp học đã ghi danh của học viên',
    { srs: 'UC10, USA-06' }
  );

  // Click vào lớp đầu tiên để vào Chi tiết lớp học
  const clickedClass = await driverManager.safeClickAny([
    '//div[contains(@class, "student-class-card")]//button',
    '//div[contains(@class, "student-class-card")]//a',
    '//main//a[contains(@href, "/student/classes/")]',
    '//main//table//tbody//tr[1]',
    '//div[contains(@class, "card")]//button[contains(., "Xem") or contains(., "lớp")]'
  ]);
  await driverManager.sleep(2000);
  await visualLogger.captureScreenshot(
    driver,
    '02_student',
    '03_student_class_details',
    'Chi tiết lớp học: Giảng viên phụ trách, Lộ trình & Danh sách bài',
    { srs: 'UC10, USA-06' }
  );

  // 4. Mở Danh sách bài tập (/student/assignments)
  await driver.get(`${config.baseUrl}/student/assignments`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '02_student',
    '04_student_assignments_list',
    'Trung tâm bài tập: Bộ lọc theo 4 kỹ năng & Trạng thái làm bài',
    { srs: 'UC15, USA-01' }
  );

  // Click vào bài tập để vào Không gian làm bài thi (Workspace)
  const clickedAssignment = await driverManager.safeClickAny([
    '//button[contains(., "Làm bài") or contains(., "Bắt đầu") or contains(., "Tiếp tục")]',
    '//a[contains(., "Làm bài") or contains(., "Chi tiết") or contains(., "Xem bài")]',
    '//div[contains(@class, "std-asg-card")]//button',
    '//div[contains(@class, "std-asg-card")]//a',
    '//main//table//tbody//tr[1]//button',
    '//main//table//tbody//tr[1]//a'
  ]);
  await driverManager.sleep(2000);
  await visualLogger.captureScreenshot(
    driver,
    '02_student',
    '05_student_assignment_workspace',
    'Không gian làm bài thi của học viên (Editor / MCQ / Media Player)',
    { srs: 'UC16..UC19, USA-04' }
  );

  // 5. Mở Bảng điểm cá nhân (/student/grades)
  await driver.get(`${config.baseUrl}/student/grades`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '02_student',
    '06_student_grades_table',
    'Bảng điểm cá nhân tổng hợp điểm số 4 kỹ năng',
    { srs: 'UC30, USA-02' }
  );

  // 6. Mở Trang nhận xét / phản hồi (/student/feedback)
  await driver.get(`${config.baseUrl}/student/feedback`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '02_student',
    '07_student_feedback_view',
    'Nhận xét chi tiết và đánh giá từ giáo viên',
    { srs: 'UC33, UC34, USA-03' }
  );

  // 7. Mở Trang hồ sơ cá nhân (/student/profile)
  await driver.get(`${config.baseUrl}/student/profile`);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '02_student',
    '08_student_profile',
    'Hồ sơ học viên và thiết lập tài khoản cá nhân',
    { srs: 'UC03, USA-01' }
  );

  // 8. Chụp Responsive trên Mobile (375x812)
  await driver.get(`${config.baseUrl}/student/dashboard`);
  await driverManager.setViewport(config.viewports.mobile.width, config.viewports.mobile.height);
  await driverManager.sleep(1500);
  await visualLogger.captureScreenshot(
    driver,
    '05_responsive_mobile',
    '02_student_dashboard_mobile',
    'Dashboard Học viên trên giao diện điện thoại (375x812)',
    { srs: 'USA-05' }
  );

  // Phục hồi lại Desktop
  await driverManager.setViewport(config.viewports.desktop.width, config.viewports.desktop.height);

  // Đăng xuất dọn phiên
  await driver.get(`${config.baseUrl}/login`);
  await driver.executeScript('localStorage.clear(); sessionStorage.clear();');

  // Ghi nhận đánh giá & phê bình Heuristics cho Student
  evaluator.setRoleScore('student', { aesthetics: 8.0, usability: 7.5, completeness: 7.0 });
}

module.exports = runStudentJourneyScenario;
