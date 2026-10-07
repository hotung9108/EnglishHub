import assert from 'node:assert/strict';
import test from 'node:test';
import { MockHttpClient } from './helpers/mock-http-client';
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
        params: { assignmentId: 12, page: 1, limit: 100 },
      },
    },
  ]);
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
    studentId: 25,
    attemptNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-10-03T09:00:00Z',
    modules: [],
  };
  const olderInProgressAttempt: SubmissionListItem = {
    id: 80,
    studentId: 25,
    attemptNumber: 2,
    status: 'IN_PROGRESS',
    submittedAt: null,
    modules: [],
  };
  const newerInProgressAttempt: SubmissionListItem = {
    id: 95,
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

