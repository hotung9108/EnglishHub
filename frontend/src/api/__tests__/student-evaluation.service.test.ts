import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiClientError } from '../core/errors';
import { MockHttpClient } from './helpers/mock-http-client';
import { StudentEvaluationService } from '../services/student-evaluation.service';

test('StudentEvaluationService #58 - GET list with class and pagination params', async () => {
  const http = new MockHttpClient();
  const service = new StudentEvaluationService(http);
  const response = {
    data: [{
      id: 40,
      classId: 3,
      teacherName: 'Lan Nguyen',
      content: 'Good progress.',
      createdAt: '2026-10-01T00:00:00Z',
    }],
    pagination: { page: 2, limit: 2, total: 3 },
  };
  http.mockResponse = response;

  assert.deepStrictEqual(await service.list(30, { classId: 3, page: 2, limit: 2 }), response);
  assert.deepStrictEqual(http.calls, [{
    method: 'GET',
    url: '/students/30/evaluations',
    options: { params: { classId: 3, page: 2, limit: 2 } },
  }]);
  const params = http.calls[0].options?.params as Record<string, unknown>;
  assert.strictEqual(typeof params.classId, 'number');
  assert.strictEqual(typeof params.page, 'number');
  assert.strictEqual(typeof params.limit, 'number');
});

test('StudentEvaluationService #58 - omits undefined query params', async () => {
  const http = new MockHttpClient();
  const service = new StudentEvaluationService(http);

  await service.list(30, { classId: undefined, page: 1, limit: 20 });

  const params = http.calls[0].options?.params as Record<string, unknown>;
  assert.deepStrictEqual(params, { page: 1, limit: 20 });
  assert.strictEqual('classId' in params, false);
});

test('StudentEvaluationService #59 - POST creates an evaluation and returns its id', async () => {
  const http = new MockHttpClient();
  const service = new StudentEvaluationService(http);
  const payload = { classId: 3, content: 'Good progress.' };
  const response = { message: 'Đã lưu đánh giá.', id: 40 };
  http.mockResponse = response;

  assert.deepStrictEqual(await service.create(30, payload), response);
  assert.deepStrictEqual(http.calls, [{
    method: 'POST',
    url: '/students/30/evaluations',
    data: payload,
    options: undefined,
  }]);
});

test('StudentEvaluationService #60 - GET returns only id and content', async () => {
  const http = new MockHttpClient();
  const service = new StudentEvaluationService(http);
  const response = { id: 40, content: 'Good progress.' };
  http.mockResponse = response;

  assert.deepStrictEqual(await service.getById(40), response);
  assert.deepStrictEqual(Object.keys(response).sort(), ['content', 'id']);
  assert.deepStrictEqual(http.calls, [{
    method: 'GET',
    url: '/evaluations/40',
    options: undefined,
  }]);
});

test('StudentEvaluationService #61 - PUT updates evaluation content', async () => {
  const http = new MockHttpClient();
  const service = new StudentEvaluationService(http);
  const payload = { content: 'Updated feedback.' };
  const response = { message: 'Cập nhật đánh giá thành công.' };
  http.mockResponse = response;

  assert.deepStrictEqual(await service.update(40, payload), response);
  assert.deepStrictEqual(http.calls, [{
    method: 'PUT',
    url: '/evaluations/40',
    data: payload,
    options: undefined,
  }]);
});

test('StudentEvaluationService #62 - DELETE removes an evaluation', async () => {
  const http = new MockHttpClient();
  const service = new StudentEvaluationService(http);
  const response = { message: 'Đã xoá đánh giá.' };
  http.mockResponse = response;

  assert.deepStrictEqual(await service.delete(40), response);
  assert.deepStrictEqual(http.calls, [{
    method: 'DELETE',
    url: '/evaluations/40',
    options: undefined,
  }]);
});

test('StudentEvaluationService - preserves 400, 401, 403, and 404 errors from the HTTP client', async () => {
  for (const status of [400, 401, 403, 404]) {
    const http = new MockHttpClient();
    const failure = new ApiClientError(`Request failed with ${status}.`, status);
    http.get = async <T>(): Promise<T> => {
      throw failure;
    };
    const service = new StudentEvaluationService(http);

    await assert.rejects(service.getById(999), error => error === failure);
  }
});
