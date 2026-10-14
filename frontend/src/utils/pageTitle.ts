/**
 * EnglishHub - Page Title Utility
 * Maps application route paths to localized page titles and formats document titles.
 */

export const APP_NAME = 'EnglishHub';
export const DEFAULT_FULL_TITLE = 'EnglishHub — Royal Academic E-Learning';

export interface RouteTitleRule {
  pattern: RegExp;
  titleVi: string;
  titleEn: string;
}

export const ROUTE_TITLE_RULES: RouteTitleRule[] = [
  // --- Auth & Public Routes ---
  { pattern: /^\/login\/?$/, titleVi: 'Đăng nhập', titleEn: 'Login' },
  { pattern: /^\/forgot-password\/?$/, titleVi: 'Quên mật khẩu', titleEn: 'Forgot Password' },
  { pattern: /^\/reset-password\/?$/, titleVi: 'Đặt lại mật khẩu', titleEn: 'Reset Password' },
  { pattern: /^\/(404|not-found)\/?$/, titleVi: 'Không tìm thấy trang', titleEn: 'Page Not Found' },
  { pattern: /^\/(403|unauthorized)\/?$/, titleVi: 'Truy cập bị từ chối', titleEn: 'Access Denied' },

  // --- Admin Nested & Parametric Routes ---
  { pattern: /^\/admin\/accounts\/profile\/?$/, titleVi: 'Hồ sơ cá nhân', titleEn: 'Profile' },
  { pattern: /^\/admin\/classes\/create\/?$/, titleVi: 'Tạo lớp học mới', titleEn: 'Create Class' },
  { pattern: /^\/admin\/classes\/archive\/?$/, titleVi: 'Kho lưu trữ lớp học', titleEn: 'Class Archive' },
  { pattern: /^\/admin\/classes\/[^/]+\/?$/, titleVi: 'Chi tiết lớp học', titleEn: 'Class Details' },
  { pattern: /^\/admin\/teachers\/create\/?$/, titleVi: 'Thêm giáo viên mới', titleEn: 'Add Teacher' },
  { pattern: /^\/admin\/teachers\/[^/]+\/?$/, titleVi: 'Chi tiết giáo viên', titleEn: 'Teacher Details' },
  { pattern: /^\/admin\/students\/create\/?$/, titleVi: 'Thêm học viên mới', titleEn: 'Add Student' },
  { pattern: /^\/admin\/students\/[^/]+\/?$/, titleVi: 'Chi tiết học viên', titleEn: 'Student Details' },
  { pattern: /^\/admin\/audit\/gradings\/?$/, titleVi: 'Nhật ký chấm điểm', titleEn: 'Grading Audit Logs' },

  // --- Admin Static Routes ---
  { pattern: /^\/admin(\/dashboard)?\/?$/, titleVi: 'Bảng điều khiển Quản trị', titleEn: 'Admin Dashboard' },
  { pattern: /^\/admin\/accounts\/?$/, titleVi: 'Quản lý tài khoản', titleEn: 'Manage Accounts' },
  { pattern: /^\/admin\/classes\/?$/, titleVi: 'Quản lý lớp học', titleEn: 'Manage Classes' },
  { pattern: /^\/admin\/teachers\/?$/, titleVi: 'Quản lý giáo viên', titleEn: 'Teachers' },
  { pattern: /^\/admin\/students\/?$/, titleVi: 'Quản lý học viên', titleEn: 'Students' },
  { pattern: /^\/admin\/reports\/?$/, titleVi: 'Báo cáo & Thống kê', titleEn: 'Reports & Analytics' },
  { pattern: /^\/admin\/settings\/?$/, titleVi: 'Cài đặt hệ thống', titleEn: 'System Settings' },
  { pattern: /^\/admin\/profile\/?$/, titleVi: 'Hồ sơ cá nhân', titleEn: 'Profile' },

  // --- Teacher Nested & Parametric Routes ---
  { pattern: /^\/teacher\/classes\/[^/]+(\/progress)?\/?$/, titleVi: 'Tiến độ lớp học', titleEn: 'Class Progress' },
  { pattern: /^\/teacher\/assignments\/create\/?$/, titleVi: 'Tạo bài tập mới', titleEn: 'Create Assignment' },
  { pattern: /^\/teacher\/assignments\/(edit\/[^/]+|[^/]+\/edit)\/?$/, titleVi: 'Chỉnh sửa bài tập', titleEn: 'Edit Assignment' },
  { pattern: /^\/teacher\/assignments\/[^/]+\/submissions\/[^/]+\/?$/, titleVi: 'Chi tiết bài nộp', titleEn: 'Submission Details' },
  { pattern: /^\/teacher\/assignments\/[^/]+\/?$/, titleVi: 'Chi tiết bài tập', titleEn: 'Assignment Details' },

  // --- Teacher Static Routes ---
  { pattern: /^\/teacher(\/dashboard)?\/?$/, titleVi: 'Bảng điều khiển Giáo viên', titleEn: 'Teacher Dashboard' },
  { pattern: /^\/teacher\/classes\/?$/, titleVi: 'Lớp học phụ trách', titleEn: 'My Classes' },
  { pattern: /^\/teacher\/assignments\/?$/, titleVi: 'Quản lý bài tập', titleEn: 'Manage Assignments' },
  { pattern: /^\/teacher\/settings\/?$/, titleVi: 'Cài đặt', titleEn: 'Settings' },
  { pattern: /^\/teacher\/profile\/?$/, titleVi: 'Hồ sơ cá nhân', titleEn: 'Profile' },

  // --- Student Nested & Skill Routes ---
  { pattern: /^\/student\/classes\/[^/]+\/?$/, titleVi: 'Chi tiết lớp học', titleEn: 'Class Details' },
  { pattern: /^\/student\/assignments\/[^/]+\/overview\/?$/, titleVi: 'Tổng quan bài tập', titleEn: 'Assignment Overview' },
  { pattern: /^\/student\/assignments\/[^/]+\/result\/?$/, titleVi: 'Kết quả bài làm', titleEn: 'Submission Result' },
  { pattern: /^\/student\/submissions\/[^/]+\/?$/, titleVi: 'Kết quả bài làm', titleEn: 'Submission Result' },
  { pattern: /^\/student\/assignments\/speaking\/[^/]+\/?$/, titleVi: 'Luyện nói Speaking', titleEn: 'Speaking Assignment' },
  { pattern: /^\/student\/assignments\/reading\/[^/]+\/?$/, titleVi: 'Luyện đọc Reading', titleEn: 'Reading Assignment' },
  { pattern: /^\/student\/assignments\/listening\/[^/]+\/?$/, titleVi: 'Luyện nghe Listening', titleEn: 'Listening Assignment' },
  { pattern: /^\/student\/assignments\/[^/]+\/?$/, titleVi: 'Luyện viết Writing', titleEn: 'Writing Assignment' },

  // --- Student Static Routes ---
  { pattern: /^\/student(\/dashboard)?\/?$/, titleVi: 'Bảng điều khiển Học viên', titleEn: 'Student Dashboard' },
  { pattern: /^\/student\/classes\/?$/, titleVi: 'Lớp học của tôi', titleEn: 'My Classes' },
  { pattern: /^\/student\/assignments\/?$/, titleVi: 'Danh sách bài tập', titleEn: 'My Assignments' },
  { pattern: /^\/student\/feedback\/?$/, titleVi: 'Xem bài chữa & Feedback', titleEn: 'Feedback & Corrections' },
  { pattern: /^\/student\/grades\/?$/, titleVi: 'Bảng điểm & Trạng thái', titleEn: 'Grades & Status' },
  { pattern: /^\/student\/analytics\/?$/, titleVi: 'Phân tích năng lực 4KN', titleEn: 'Skills Analytics' },
  { pattern: /^\/student\/settings\/?$/, titleVi: 'Cài đặt', titleEn: 'Settings' },
  { pattern: /^\/student\/profile\/?$/, titleVi: 'Hồ sơ cá nhân', titleEn: 'Profile' },
];

/**
 * Resolves the page title for a given pathname and language.
 */
export function getPageTitle(pathname: string, language: 'vi' | 'en' = 'vi'): string | null {
  if (!pathname) return null;
  const cleanPath = pathname.trim().toLowerCase();

  for (const rule of ROUTE_TITLE_RULES) {
    if (rule.pattern.test(cleanPath)) {
      return language === 'vi' ? rule.titleVi : rule.titleEn;
    }
  }

  return null;
}

/**
 * Formats the browser tab title according to EnglishHub conventions.
 * Pattern: "{Page Title} | EnglishHub" or default branding title.
 */
export function formatDocumentTitle(pageTitle?: string | null): string {
  if (!pageTitle || !pageTitle.trim()) {
    return DEFAULT_FULL_TITLE;
  }
  return `${pageTitle.trim()} | ${APP_NAME}`;
}
