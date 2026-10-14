import test from 'node:test';
import assert from 'node:assert/strict';
import { getPageTitle, formatDocumentTitle, APP_NAME, DEFAULT_FULL_TITLE } from '../../utils/pageTitle';

test('pageTitle - formatDocumentTitle formats title with APP_NAME correctly', () => {
  assert.strictEqual(formatDocumentTitle('Đăng nhập'), `Đăng nhập | ${APP_NAME}`);
  assert.strictEqual(formatDocumentTitle('  Bảng điều khiển  '), `Bảng điều khiển | ${APP_NAME}`);
  assert.strictEqual(formatDocumentTitle(''), DEFAULT_FULL_TITLE);
  assert.strictEqual(formatDocumentTitle(null), DEFAULT_FULL_TITLE);
  assert.strictEqual(formatDocumentTitle(undefined), DEFAULT_FULL_TITLE);
});

test('pageTitle - getPageTitle resolves public and auth routes', () => {
  assert.strictEqual(getPageTitle('/login', 'vi'), 'Đăng nhập');
  assert.strictEqual(getPageTitle('/login', 'en'), 'Login');
  assert.strictEqual(getPageTitle('/forgot-password', 'vi'), 'Quên mật khẩu');
  assert.strictEqual(getPageTitle('/forgot-password', 'en'), 'Forgot Password');
  assert.strictEqual(getPageTitle('/reset-password', 'vi'), 'Đặt lại mật khẩu');
  assert.strictEqual(getPageTitle('/reset-password', 'en'), 'Reset Password');
  assert.strictEqual(getPageTitle('/404', 'vi'), 'Không tìm thấy trang');
  assert.strictEqual(getPageTitle('/not-found', 'en'), 'Page Not Found');
  assert.strictEqual(getPageTitle('/403', 'vi'), 'Truy cập bị từ chối');
  assert.strictEqual(getPageTitle('/unauthorized', 'en'), 'Access Denied');
});

test('pageTitle - getPageTitle resolves admin routes (static and parametric)', () => {
  assert.strictEqual(getPageTitle('/admin/dashboard', 'vi'), 'Bảng điều khiển Quản trị');
  assert.strictEqual(getPageTitle('/admin', 'en'), 'Admin Dashboard');
  assert.strictEqual(getPageTitle('/admin/accounts', 'vi'), 'Quản lý tài khoản');
  assert.strictEqual(getPageTitle('/admin/accounts/profile', 'vi'), 'Hồ sơ cá nhân');
  assert.strictEqual(getPageTitle('/admin/classes', 'vi'), 'Quản lý lớp học');
  assert.strictEqual(getPageTitle('/admin/classes/create', 'vi'), 'Tạo lớp học mới');
  assert.strictEqual(getPageTitle('/admin/classes/archive', 'vi'), 'Kho lưu trữ lớp học');
  assert.strictEqual(getPageTitle('/admin/classes/101', 'vi'), 'Chi tiết lớp học');
  assert.strictEqual(getPageTitle('/admin/teachers', 'vi'), 'Quản lý giáo viên');
  assert.strictEqual(getPageTitle('/admin/teachers/create', 'vi'), 'Thêm giáo viên mới');
  assert.strictEqual(getPageTitle('/admin/teachers/202', 'vi'), 'Chi tiết giáo viên');
  assert.strictEqual(getPageTitle('/admin/students', 'vi'), 'Quản lý học viên');
  assert.strictEqual(getPageTitle('/admin/students/create', 'vi'), 'Thêm học viên mới');
  assert.strictEqual(getPageTitle('/admin/students/303', 'vi'), 'Chi tiết học viên');
  assert.strictEqual(getPageTitle('/admin/reports', 'vi'), 'Báo cáo & Thống kê');
  assert.strictEqual(getPageTitle('/admin/audit/gradings', 'vi'), 'Nhật ký chấm điểm');
  assert.strictEqual(getPageTitle('/admin/settings', 'vi'), 'Cài đặt hệ thống');
  assert.strictEqual(getPageTitle('/admin/profile', 'vi'), 'Hồ sơ cá nhân');
});

test('pageTitle - getPageTitle resolves teacher routes', () => {
  assert.strictEqual(getPageTitle('/teacher/dashboard', 'vi'), 'Bảng điều khiển Giáo viên');
  assert.strictEqual(getPageTitle('/teacher', 'en'), 'Teacher Dashboard');
  assert.strictEqual(getPageTitle('/teacher/classes', 'vi'), 'Lớp học phụ trách');
  assert.strictEqual(getPageTitle('/teacher/classes/12', 'vi'), 'Tiến độ lớp học');
  assert.strictEqual(getPageTitle('/teacher/classes/12/progress', 'vi'), 'Tiến độ lớp học');
  assert.strictEqual(getPageTitle('/teacher/assignments', 'vi'), 'Quản lý bài tập');
  assert.strictEqual(getPageTitle('/teacher/assignments/create', 'vi'), 'Tạo bài tập mới');
  assert.strictEqual(getPageTitle('/teacher/assignments/10/edit', 'vi'), 'Chỉnh sửa bài tập');
  assert.strictEqual(getPageTitle('/teacher/assignments/edit/10', 'vi'), 'Chỉnh sửa bài tập');
  assert.strictEqual(getPageTitle('/teacher/assignments/10/submissions/5', 'vi'), 'Chi tiết bài nộp');
  assert.strictEqual(getPageTitle('/teacher/assignments/10', 'vi'), 'Chi tiết bài tập');
  assert.strictEqual(getPageTitle('/teacher/settings', 'vi'), 'Cài đặt');
  assert.strictEqual(getPageTitle('/teacher/profile', 'vi'), 'Hồ sơ cá nhân');
});

test('pageTitle - getPageTitle resolves student routes with skill types', () => {
  assert.strictEqual(getPageTitle('/student/dashboard', 'vi'), 'Bảng điều khiển Học viên');
  assert.strictEqual(getPageTitle('/student', 'en'), 'Student Dashboard');
  assert.strictEqual(getPageTitle('/student/classes', 'vi'), 'Lớp học của tôi');
  assert.strictEqual(getPageTitle('/student/classes/8', 'vi'), 'Chi tiết lớp học');
  assert.strictEqual(getPageTitle('/student/assignments', 'vi'), 'Danh sách bài tập');
  assert.strictEqual(getPageTitle('/student/assignments/15/overview', 'vi'), 'Tổng quan bài tập');
  assert.strictEqual(getPageTitle('/student/assignments/15/result', 'vi'), 'Kết quả bài làm');
  assert.strictEqual(getPageTitle('/student/submissions/15', 'vi'), 'Kết quả bài làm');
  assert.strictEqual(getPageTitle('/student/assignments/speaking/15', 'vi'), 'Luyện nói Speaking');
  assert.strictEqual(getPageTitle('/student/assignments/reading/15', 'vi'), 'Luyện đọc Reading');
  assert.strictEqual(getPageTitle('/student/assignments/listening/15', 'vi'), 'Luyện nghe Listening');
  assert.strictEqual(getPageTitle('/student/assignments/15', 'vi'), 'Luyện viết Writing');
  assert.strictEqual(getPageTitle('/student/feedback', 'vi'), 'Xem bài chữa & Feedback');
  assert.strictEqual(getPageTitle('/student/grades', 'vi'), 'Bảng điểm & Trạng thái');
  assert.strictEqual(getPageTitle('/student/analytics', 'vi'), 'Phân tích năng lực 4KN');
  assert.strictEqual(getPageTitle('/student/settings', 'vi'), 'Cài đặt');
  assert.strictEqual(getPageTitle('/student/profile', 'vi'), 'Hồ sơ cá nhân');
});

test('pageTitle - edge cases (trailing slash, case insensitivity, unknown routes)', () => {
  assert.strictEqual(getPageTitle('/LOGIN/', 'vi'), 'Đăng nhập');
  assert.strictEqual(getPageTitle('/Student/Assignments/', 'vi'), 'Danh sách bài tập');
  assert.strictEqual(getPageTitle('/unknown/non-existing-path', 'vi'), null);
});
