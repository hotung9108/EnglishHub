import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Kịch bản Kiểm thử Tải Nộp bài tập đồng thời (Submission Burst Load)
 * Mô phỏng tình huống cả lớp 30-40 học viên cùng nộp bài trước giờ đóng bài (Deadline)
 */
export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 35 }, // Đột biến học viên nộp bài đồng thời
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2500'], // 95% request dưới 2.5s khi có xử lý dữ liệu lớn
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://api-staging.hotung9108.me/api/v1';
const TOKEN = __ENV.STUDENT_TOKEN || 'mock-token';

export default function () {
  const payload = JSON.stringify({
    submissionModuleId: 1,
    content: 'This is an essay written under load testing condition with sufficient words to validate system stability.',
    submittedAt: new Date().toISOString()
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
  };

  const res = http.post(`${BASE_URL}/submissions/modules/1/submit`, payload, params);

  check(res, {
    'submission received (200 or 201)': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}
