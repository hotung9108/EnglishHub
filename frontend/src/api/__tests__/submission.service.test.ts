import assert from 'node:assert/strict';
import test from 'node:test';
import { MockHttpClient } from './helpers/mock-http-client';
import type { ApiRequestOptions } from '../interfaces/http.interface';
import {
  findInProgressAttempt,
  getRemainingAttempts,
  normalizeSubmissionListParams,
  SubmissionService,
  type StartSubmissionResponse,
  type SubmissionDetail,
  type SubmissionListItem,
  type SubmissionListResponse,
  type SubmitResponse,
} from '../services/submission.service';

test('SubmissionService #37 - starts an attempt without a body and forwards options', async () => {
  const http = new MockHttpClient();
  const options = { signal: new AbortController().signal };
  const response: StartSubmissionResponse = {
    id: 81,
    assignmentId: 12,
    attemptNumber: 1,
    status: 'IN_PROGRESS',
    createdAt: '2026-10-03T10:00:00Z',
    modules: [{ id: 91, moduleId: 32, skill: 'READING', status: 'IN_PROGRESS' }],
  };
  http.mockResponse = response;

  const result = await new SubmissionService(http).startAttempt(12, options);

  assert.strictEqual(result, response);
  assert.deepStrictEqual(http.calls, [
    {
      method: 'POST',
      url: '/assignments/12/submissions',
      data: undefined,
      options,
    },
  ]);
});

test('SubmissionService #38 - gets a submission and forwards options', async () => {
  const http = new MockHttpClient();
  const options = { signal: new AbortController().signal };
  const response: SubmissionDetail = {
    id: 81,
    assignmentId: 12,
    studentId: 25,
    attemptNumber: 1,
    status: 'IN_PROGRESS',
    submittedAt: null,
    createdAt: '2026-10-03T10:00:00Z',
    modules: [
      {
        id: 91,
        moduleId: 32,
        skill: 'READING',
        taskType: 'QUIZ',
        status: 'IN_PROGRESS',
        grading: {
          id: 101,
          method: 'AUTO',
          status: 'PENDING',
          finalScore: null,
          maxScoreSnapshot: null,
          aiFeedback: null,
          finalFeedback: null,
        },
      },
    ],
  };
  http.mockResponse = response;

  const result = await new SubmissionService(http).getSubmission(81, options);

  assert.strictEqual(result, response);
  assert.deepStrictEqual(http.calls, [
    { method: 'GET', url: '/submissions/81', options },
  ]);
});

test('SubmissionService #39 - lists attempts with normalized query and forwards options', async () => {
  const http = new MockHttpClient();
  const options = { signal: new AbortController().signal };
  const response: SubmissionListResponse = {
    data: [
      {
        id: 81,
        assignmentId: 12,
        studentId: 25,
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        submittedAt: null,
        modules: [
          {
            id: 91,
            moduleId: 32,
            skill: 'READING',
            taskType: 'QUIZ',
            status: 'IN_PROGRESS',
            grading: {
              finalScore: null,
              maxScoreSnapshot: null,
              status: 'PENDING',
            },
          },
        ],
      },
    ],
    pagination: { page: 1, limit: 100, total: 1 },
  };
  http.mockResponse = response;

  const result = await new SubmissionService(http).listSubmissions(
    {
      classId: 1,
      assignmentId: 12,
      studentId: undefined,
      status: undefined,
      page: 1,
      limit: 100,
    },
    options
  );

  assert.strictEqual(result, response);
  assert.deepStrictEqual(http.calls, [
    {
      method: 'GET',
      url: '/submissions',
      options: {
        ...options,
        params: { classId: 1, assignmentId: 12, page: 1, limit: 100 },
      },
    },
  ]);
});

test('listAllSubmissions uses one request for zero to 100 submissions and forwards classId/options', async () => {
  const options = { signal: new AbortController().signal };
  for (const total of [0, 1, 100]) {
    const http = new MockHttpClient();
    const data: SubmissionListItem[] = Array.from({ length: total }, (_, index) => ({
      id: 81 + index,
      assignmentId: 12,
      studentId: 25,
      attemptNumber: 1,
      status: 'SUBMITTED',
      submittedAt: null,
      modules: [],
    }));
    http.mockResponse = { data, pagination: { page: 1, limit: 100, total } };

    const result = await new SubmissionService(http).listAllSubmissions({ classId: 1 }, options);

    assert.deepStrictEqual(result, data);
    assert.deepStrictEqual(http.calls, [{
      method: 'GET',
      url: '/submissions',
      options: { ...options, params: { classId: 1, page: 1, limit: 100 } },
    }]);
  }
});

test('listAllSubmissions awaits each page and concatenates all pages in order', async () => {
  const http = new MockHttpClient();
  const options = { signal: new AbortController().signal };
  const data: SubmissionListItem[] = Array.from({ length: 201 }, (_, index) => ({
    id: 81 + index,
    assignmentId: 12,
    studentId: 25,
    attemptNumber: 1,
    status: 'SUBMITTED',
    submittedAt: null,
    modules: [],
  }));
  let releaseSecondPage!: () => void;
  const secondPageGate = new Promise<void>((resolve) => { releaseSecondPage = resolve; });
  let notifySecondPage!: () => void;
  const secondPageStarted = new Promise<void>((resolve) => { notifySecondPage = resolve; });
  http.get = async <T>(url: string, requestOptions?: ApiRequestOptions): Promise<T> => {
    http.calls.push({ method: 'GET', url, options: requestOptions });
    const page = Number(requestOptions?.params?.page);
    if (page === 2) {
      notifySecondPage();
      await secondPageGate;
    }
    return {
      data: data.slice((page - 1) * 100, page * 100),
      pagination: { page, limit: 100, total: data.length },
    } as T;
  };

  const pending = new SubmissionService(http).listAllSubmissions({ classId: 1 }, options);
  await secondPageStarted;
  try {
    // Page 3 must not start while page 2 is still pending.
    assert.deepStrictEqual(http.calls.map((call) => call.options?.params?.page), [1, 2]);
  } finally {
    releaseSecondPage();
  }

  assert.deepStrictEqual(await pending, data);
  assert.deepStrictEqual(http.calls, [1, 2, 3].map((page) => ({
    method: 'GET',
    url: '/submissions',
    options: { ...options, params: { classId: 1, page, limit: 100 } },
  })));
});

test('listAllSubmissions rejects on a later page without returning partial data or requesting further pages', async () => {
  const http = new MockHttpClient();
  const failure = new Error('page 2 failed');
  const firstItem: SubmissionListItem = {
    id: 81, assignmentId: 12, studentId: 25, attemptNumber: 1,
    status: 'SUBMITTED', submittedAt: null, modules: [],
  };
  http.get = async <T>(url: string, options?: ApiRequestOptions): Promise<T> => {
    http.calls.push({ method: 'GET', url, options });
    if (options?.params?.page === 2) throw failure;
    return {
      data: Array.from({ length: 100 }, (_, index) => ({ ...firstItem, id: firstItem.id + index })),
      pagination: { page: 1, limit: 100, total: 201 },
    } as T;
  };

  await assert.rejects(
    new SubmissionService(http).listAllSubmissions({ classId: 1 }),
    (error: unknown) => error === failure
  );
  assert.deepStrictEqual(http.calls.map((call) => call.options?.params), [
    { classId: 1, page: 1, limit: 100 },
    { classId: 1, page: 2, limit: 100 },
  ]);
});

test('listAllSubmissions rejects duplicate submission IDs across pages', async () => {
  const http = new MockHttpClient();
  const data: SubmissionListItem[] = Array.from({ length: 100 }, (_, index) => ({
    id: 81 + index, assignmentId: 12, studentId: 25, attemptNumber: 1,
    status: 'SUBMITTED', submittedAt: null, modules: [],
  }));
  http.get = async <T>(url: string, options?: ApiRequestOptions): Promise<T> => {
    http.calls.push({ method: 'GET', url, options });
    const page = Number(options?.params?.page);
    return {
      data: page === 1 ? data : [data[0]],
      pagination: { page, limit: 100, total: 101 },
    } as T;
  };

  await assert.rejects(
    new SubmissionService(http).listAllSubmissions({ classId: 1 }),
    { message: 'Dữ liệu phân trang không nhất quán' }
  );
  assert.strictEqual(http.calls.length, 2);
});

for (const invalidTotal of [undefined, NaN, Infinity, -1, 1.5]) {
  for (const invalidPage of [1, 2]) {
    test(`listAllSubmissions rejects total=${String(invalidTotal)} on page ${invalidPage}`, async () => {
      const http = new MockHttpClient();
      http.get = async <T>(url: string, options?: ApiRequestOptions): Promise<T> => {
        http.calls.push({ method: 'GET', url, options });
        const page = Number(options?.params?.page);
        return {
          data: Array.from({ length: 100 }, (_, index) => ({
            id: index + 1, assignmentId: 12, studentId: 25, attemptNumber: 1,
            status: 'SUBMITTED', submittedAt: null, modules: [],
          })),
          pagination: { page, limit: 100, total: page === invalidPage ? invalidTotal : 101 },
        } as T;
      };

      await assert.rejects(
        new SubmissionService(http).listAllSubmissions({ classId: 1 }),
        { message: 'Dữ liệu phân trang không nhất quán' }
      );
      assert.strictEqual(http.calls.length, invalidPage);
    });
  }
}

for (const shortPage of [1, 2]) {
  test(`listAllSubmissions rejects an incomplete non-final page ${shortPage}`, async () => {
    const http = new MockHttpClient();
    http.get = async <T>(url: string, options?: ApiRequestOptions): Promise<T> => {
      http.calls.push({ method: 'GET', url, options });
      const page = Number(options?.params?.page);
      return {
        data: Array.from({ length: page === shortPage ? 50 : 100 }, (_, index) => ({
          id: (page - 1) * 100 + index + 1, assignmentId: 12, studentId: 25, attemptNumber: 1,
          status: 'SUBMITTED', submittedAt: null, modules: [],
        })),
        pagination: { page, limit: 100, total: 201 },
      } as T;
    };

    await assert.rejects(
      new SubmissionService(http).listAllSubmissions({ classId: 1 }),
      { message: 'Dữ liệu phân trang không nhất quán' }
    );
    assert.strictEqual(http.calls.length, shortPage);
  });
}

test('listAllSubmissions does not enforce the final page length', async () => {
  const http = new MockHttpClient();
  const data: SubmissionListItem[] = Array.from({ length: 100 }, (_, index) => ({
    id: 81 + index, assignmentId: 12, studentId: 25, attemptNumber: 1,
    status: 'SUBMITTED', submittedAt: null, modules: [],
  }));
  http.get = async <T>(url: string, options?: ApiRequestOptions): Promise<T> => {
    http.calls.push({ method: 'GET', url, options });
    const page = Number(options?.params?.page);
    return { data: page === 1 ? data : [], pagination: { page, limit: 100, total: 101 } } as T;
  };

  assert.deepStrictEqual(await new SubmissionService(http).listAllSubmissions({ classId: 1 }), data);
  assert.strictEqual(http.calls.length, 2);
});

test('SubmissionService #40 - submits without a body and forwards options', async () => {
  const http = new MockHttpClient();
  const options = { signal: new AbortController().signal };
  const response: SubmitResponse = {
    message: 'Nộp bài thành công.',
    status: 'SUBMITTED',
    submittedAt: '2026-10-03T10:30:00Z',
  };
  http.mockResponse = response;

  const result = await new SubmissionService(http).submitSubmission(81, options);

  assert.strictEqual(result, response);
  assert.deepStrictEqual(http.calls, [
    {
      method: 'POST',
      url: '/submissions/81/submit',
      data: undefined,
      options,
    },
  ]);
});

test('normalizeSubmissionListParams defaults and clamps pagination', () => {
  assert.deepStrictEqual(normalizeSubmissionListParams(), { page: 1, limit: 20 });
  assert.deepStrictEqual(
    normalizeSubmissionListParams({ page: 0, limit: 101, assignmentId: 12 }),
    { assignmentId: 12, page: 1, limit: 100 }
  );
  assert.deepStrictEqual(
    normalizeSubmissionListParams({ page: 2.5, limit: 0 }),
    { page: 1, limit: 1 }
  );
  assert.deepStrictEqual(
    normalizeSubmissionListParams({ limit: Number.POSITIVE_INFINITY }),
    { page: 1, limit: 100 }
  );
  assert.deepStrictEqual(
    normalizeSubmissionListParams({ limit: Number.NEGATIVE_INFINITY }),
    { page: 1, limit: 1 }
  );
  assert.deepStrictEqual(
    normalizeSubmissionListParams({ page: 3, limit: 10, studentId: 25, status: 'SUBMITTED' }),
    { studentId: 25, status: 'SUBMITTED', page: 3, limit: 10 }
  );
});

test('normalizeSubmissionListParams omits undefined filters from query params', async () => {
  const http = new MockHttpClient();
  http.mockResponse = { data: [], pagination: { page: 1, limit: 20, total: 0 } };

  await new SubmissionService(http).listSubmissions({
    classId: undefined,
    assignmentId: undefined,
    studentId: undefined,
    status: undefined,
    page: undefined,
    limit: undefined,
  });

  assert.deepStrictEqual(http.calls[0].options?.params, { page: 1, limit: 20 });
});

test('getRemainingAttempts preserves unknown and unlimited as distinct results', () => {
  assert.strictEqual(getRemainingAttempts(undefined, 0), undefined);
  assert.notStrictEqual(getRemainingAttempts(undefined, 0), getRemainingAttempts(null, 0));
  assert.strictEqual(getRemainingAttempts(null, 4), null);
});

test('getRemainingAttempts handles zero, available, exhausted, and overused limits', () => {
  assert.strictEqual(getRemainingAttempts(0, 0), 0);
  assert.strictEqual(getRemainingAttempts(3, 0), 3);
  assert.strictEqual(getRemainingAttempts(3, 2), 1);
  assert.strictEqual(getRemainingAttempts(3, 3), 0);
  assert.strictEqual(getRemainingAttempts(3, 5), 0);
});

test('findInProgressAttempt handles empty, absent, single, and unsorted multiple matches', () => {
  const completedAttempt: SubmissionListItem = {
    id: 70,
    assignmentId: 12,
    studentId: 25,
    attemptNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-10-03T09:00:00Z',
    modules: [],
  };
  const olderInProgressAttempt: SubmissionListItem = {
    id: 80,
    assignmentId: 12,
    studentId: 25,
    attemptNumber: 2,
    status: 'IN_PROGRESS',
    submittedAt: null,
    modules: [],
  };
  const newerInProgressAttempt: SubmissionListItem = {
    id: 95,
    assignmentId: 12,
    studentId: 25,
    attemptNumber: 3,
    status: 'IN_PROGRESS',
    submittedAt: null,
    modules: [],
  };

  assert.strictEqual(findInProgressAttempt([]), null);
  assert.strictEqual(findInProgressAttempt([completedAttempt]), null);
  assert.strictEqual(
    findInProgressAttempt([completedAttempt, olderInProgressAttempt]),
    olderInProgressAttempt
  );
  assert.strictEqual(
    findInProgressAttempt([
      olderInProgressAttempt,
      completedAttempt,
      newerInProgressAttempt,
    ]),
    newerInProgressAttempt
  );
});

test('SubmissionService preserves errors thrown by the HTTP client', async () => {
  const getFailure = new Error('get failed');
  const getHttp = new MockHttpClient();
  getHttp.get = async <T>(): Promise<T> => {
    throw getFailure;
  };

  await assert.rejects(
    new SubmissionService(getHttp).getSubmission(81),
    (error: unknown) => error === getFailure
  );

  const postFailure = new Error('post failed');
  const postHttp = new MockHttpClient();
  postHttp.post = async <T>(): Promise<T> => {
    throw postFailure;
  };

  await assert.rejects(
    new SubmissionService(postHttp).startAttempt(12),
    (error: unknown) => error === postFailure
  );
});

test('SubmissionService - submitModule posts answers and returns response', async () => {
  const http = new MockHttpClient();
  const options = { signal: new AbortController().signal };
  const response = {
    message: 'Đã nộp phần làm bài.',
    submissionModuleId: 44,
    status: 'SUBMITTED' as const,
    answers: [{ id: 101, questionId: 1, content: { selectedOptionIds: ['A'] } }],
  };
  http.mockResponse = response;

  const result = await new SubmissionService(http).submitModule(44, {
    answers: [{ questionId: 1, content: { selectedOptionIds: ['A'] } }],
  }, options);

  assert.strictEqual(result, response);
  assert.deepStrictEqual(http.calls, [
    {
      method: 'POST',
      url: '/submission-modules/44/submit',
      data: {
        answers: [{ questionId: 1, content: { selectedOptionIds: ['A'] } }],
      },
      options,
    },
  ]);
});

test('SubmissionService - getSubmissionModuleDetail gets module detail', async () => {
  const http = new MockHttpClient();
  const response = {
    id: 44,
    moduleId: 12,
    skill: 'READING' as const,
    taskType: 'QUIZ' as const,
    status: 'SUBMITTED' as const,
    grading: null,
    questions: [],
    answers: [],
  };
  http.mockResponse = response;

  const result = await new SubmissionService(http).getSubmissionModuleDetail(44);
  assert.strictEqual(result, response);
  assert.deepStrictEqual(http.calls, [
    {
      method: 'GET',
      url: '/submission-modules/44',
      options: undefined,
    },
  ]);
});

test('SubmissionService - audio and document upload URLs', async () => {
  const http = new MockHttpClient();
  const audioResponse = {
    uploadUrl: 'https://s3.example.com/audio.webm',
    storageKey: 'submissions/1/module-44/audio.webm',
    expiresAt: '2026-10-03T11:00:00Z',
  };
  http.mockResponse = audioResponse;

  const audioResult = await new SubmissionService(http).getAudioUploadUrl(44, 'audio/webm');
  assert.strictEqual(audioResult, audioResponse);

  const docResponse = {
    uploadUrl: 'https://s3.example.com/essay.pdf',
    storageKey: 'submissions/1/module-44/essay.pdf',
    expiresAt: '2026-10-03T11:00:00Z',
  };
  http.mockResponse = docResponse;

  const docResult = await new SubmissionService(http).getDocumentUploadUrl(44, 'application/pdf');
  assert.strictEqual(docResult, docResponse);
});

