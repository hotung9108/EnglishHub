import assert from 'node:assert/strict';

/**
 * Common Authentication & Smoke UI Specifications
 * Standardized for test_reborn following COM-xxx convention
 */

export const commonCases = [];

const add = (id, title, steps, expected, run) => {
  commonCases.push({ id, title, steps, expected, run });
};

add(
  'COM-001',
  'Giao diện đăng nhập dùng chung: hiển thị đầy đủ trường email, mật khẩu ẩn và nút gửi',
  'Mở URL gốc hệ thống → chờ form đăng nhập xuất hiện → kiểm tra các trường input và nút đăng nhập.',
  'URL thuộc domain hệ thống; email có thể chỉnh sửa; password bị che giấu type=password; nút submit được bật và có nhãn rõ ràng.',
  async page => {
    await page.assertReady();
  }
);

export function roleLoginCase(role) {
  return {
    id: `COM-LOGIN-${role.toUpperCase()}`,
    title: `Đăng nhập hệ thống với vai trò ${role.toUpperCase()}`,
    steps: `Mở form đăng nhập → chọn vai trò ${role} (nếu có tab) → nhập email/password hợp lệ → bấm Đăng nhập → chờ chuyển hướng đúng role.`,
    expected: `Đăng nhập thành công, điều hướng đến dashboard của vai trò ${role}.`,
    async run(page, user) {
      await page.assertReady();
      await page.login(user, role);
      await page.waitForRole(role);
    }
  };
}
