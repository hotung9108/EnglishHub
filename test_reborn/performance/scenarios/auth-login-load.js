import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Kịch bản Kiểm thử Tải Đăng nhập (Auth Login Load Test)
 * Mục tiêu NFR: Xác nhận API xử lý tốt 20-50 concurrent users trong giờ cao điểm
 * Chuẩn: docs/core/01.SRS.md & 03.TP.md (NFR)
 */
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp-up lên 20 users
    { duration: '1m', target: 20 },  // Duy trì tải 20 users
    { duration: '30s', target: 50 }, // Spike lên 50 users
    { duration: '30s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% request phải phản hồi dưới 1.5 giây
    http_req_failed: ['rate<0.01'],    // Tỷ lệ lỗi dưới 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://api-staging.hotung9108.me/api/v1';

export default function () {
  const payload = JSON.stringify({
    email: 'teacher@test.com',
    password: 'Password123!',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/auth/login`, payload, params);

  check(res, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
  });

  sleep(1);
}
