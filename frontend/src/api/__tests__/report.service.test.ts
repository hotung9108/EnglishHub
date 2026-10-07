import assert from 'node:assert/strict';
import test from 'node:test';
import { MockHttpClient } from './helpers/mock-http-client';
import { ReportService } from '../services/report.service';

test('ReportService - GET overview with all params', async () => {
  const http = new MockHttpClient();
  const service = new ReportService(http);
  const response = {
    classCount: 5,
    assignedAssignmentCount: 20,
    completionRatePercent: 80,
    averageScorePercent: 72.5,
    pendingGradingCount: 3,
    pendingByStatus: { AI_GRADED: 2, PENDING: 1 },
  };
  http.mockResponse = response;

  const result = await service.getOverview({
    from: '2026-01-01',
    to: '2026-06-30',
    classId: 3,
    teacherId: 10,
  });

  assert.deepStrictEqual(result, response);
  assert.deepStrictEqual(http.calls, [{
    method: 'GET',
    url: '/reports/overview',
    options: {
      params: { from: '2026-01-01', to: '2026-06-30', classId: 3, teacherId: 10 },
    },
  }]);
});

test('ReportService - GET overview omits undefined query params', async () => {
  const http = new MockHttpClient();
  const service = new ReportService(http);

  await service.getOverview({ classId: 3 });

  const params = http.calls[0].options?.params as Record<string, unknown>;
  assert.deepStrictEqual(params, { classId: 3 });
  assert.strictEqual('from' in params, false);
  assert.strictEqual('to' in params, false);
  assert.strictEqual('teacherId' in params, false);
});

test('ReportService - GET class list with pagination params', async () => {
  const http = new MockHttpClient();
  const service = new ReportService(http);
  const response = {
    data: [{
      classId: 3,
      className: 'IELTS 6.5',
      status: 'ACTIVE',
      assignedAssignmentCount: 8,
      averageScorePercent: 70,
      completionRatePercent: 85,
    }],
    pagination: { page: 2, limit: 10, total: 25 },
  };
  http.mockResponse = response;

  const result = await service.listClasses({
    from: '2026-01-01',
    to: '2026-06-30',
    teacherId: 10,
    page: 2,
    limit: 10,
  });

  assert.deepStrictEqual(result, response);
  assert.deepStrictEqual(http.calls, [{
    method: 'GET',
    url: '/reports/classes',
    options: {
      params: { from: '2026-01-01', to: '2026-06-30', teacherId: 10, page: 2, limit: 10 },
    },
  }]);
});

test('ReportService - GET class progress with threshold', async () => {
  const http = new MockHttpClient();
  const service = new ReportService(http);
  const response = {
    classId: 3,
    completionRatePercent: 80,
    belowAverageRatePercent: 20,
    totalStudentCount: 10,
    scoredStudentCount: 8,
    belowAverageCount: 2,
    assignmentScores: [],
    laggingStudents: [],
    unscoredStudents: [],
  };
  http.mockResponse = response;

  const result = await service.getClassProgress(3, {
    from: '2026-01-01',
    to: '2026-06-30',
    threshold: 60,
  });

  assert.deepStrictEqual(result, response);
  assert.deepStrictEqual(http.calls, [{
    method: 'GET',
    url: '/reports/classes/3/progress',
    options: {
      params: { from: '2026-01-01', to: '2026-06-30', threshold: 60 },
    },
  }]);
});

test('ReportService - GET student progress omits undefined query params', async () => {
  const http = new MockHttpClient();
  const service = new ReportService(http);
  const response = {
    studentId: 40,
    studentName: 'Minh Anh',
    classId: 3,
    skillAverages: [],
    scoreTimeline: [],
  };
  http.mockResponse = response;

  const result = await service.getStudentProgress(40, { classId: 3 });

  assert.deepStrictEqual(result, response);
  assert.deepStrictEqual(http.calls, [{
    method: 'GET',
    url: '/reports/students/40/progress',
    options: { params: { classId: 3 } },
  }]);
});
