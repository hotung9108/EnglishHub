import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiClientError } from '../core/errors';
import type { ApiRequestOptions } from '../interfaces/http.interface';
import { MockHttpClient } from './helpers/mock-http-client';
import {
  GradingService,
  type GradingDetailResponse,
  type GradingListParams,
  type GradingStatus,
  type SubmissionModuleGradingResponse,
  type ReviewGradingAnnotationRequest,
} from '../services/grading.service';

async function assertEndpointCall(
  action: (service: GradingService) => Promise<unknown>,
  expectedCall: MockHttpClient['calls'][number]
): Promise<void> {
  const http = new MockHttpClient();
  const service = new GradingService(http);

  await action(service);
  assert.deepStrictEqual(http.calls, [expectedCall]);
}

function createDetail(status: GradingStatus): GradingDetailResponse {
  return {
    id: 5,
    submissionModuleId: 7,
    method: 'TEACHER_MANUAL',
    status,
    aiFeedback: 'private AI feedback',
    aiTranscript: { private: true },
    finalScore: 8.5,
    finalFeedback: 'Published feedback',
    maxScoreSnapshot: 10,
    reviewedBy: 9,
    reviewedAt: '2026-10-01T00:00:00Z',
    gradedAt: '2026-10-01T00:00:00Z',
    aiInstructionSnapshot: 'private AI instruction',
  };
}

class StubGradingService extends GradingService {
  readonly calls: Array<{
    endpoint: 'submission-module' | 'grading';
    id: number;
    options: ApiRequestOptions | undefined;
  }> = [];
  summary: SubmissionModuleGradingResponse = {
    id: 5,
    method: 'TEACHER_MANUAL',
    status: 'PENDING',
    finalScore: null,
  };
  detail = createDetail('COMPLETED');
  summaryError: ApiClientError | null = null;
  detailError: ApiClientError | null = null;

  override async getBySubmissionModuleId(
    id: number,
    options?: ApiRequestOptions
  ): Promise<SubmissionModuleGradingResponse> {
    this.calls.push({ endpoint: 'submission-module', id, options });
    if (this.summaryError) {
      throw this.summaryError;
    }
    return this.summary;
  }

  override async getById(id: number, options?: ApiRequestOptions): Promise<GradingDetailResponse> {
    this.calls.push({ endpoint: 'grading', id, options });
    if (this.detailError) {
      throw this.detailError;
    }
    return this.detail;
  }
}

test('GradingService #48 - GET grading by submission module', async () => {
  const options = { signal: new AbortController().signal };
  await assertEndpointCall(service => service.getBySubmissionModuleId(7, options), {
    method: 'GET',
    url: '/submission-modules/7/grading',
    options,
  });
});

test('GradingService #49 - POST AI analysis without a body', async () => {
  await assertEndpointCall(service => service.requestAiAnalysis(7), {
    method: 'POST',
    url: '/submission-modules/7/grading/ai-analyze',
    data: undefined,
    options: undefined,
  });
});

test('GradingService #50 - PUT final grade with request body', async () => {
  const payload = { finalScore: 8.5, finalFeedback: 'Good work', note: 'Reviewed' };
  await assertEndpointCall(service => service.submitGrade(5, payload), {
    method: 'PUT',
    url: '/gradings/5',
    data: payload,
    options: undefined,
  });
});

test('GradingService #51 - GET grading detail', async () => {
  const options = { signal: new AbortController().signal };
  await assertEndpointCall(service => service.getById(5, options), {
    method: 'GET',
    url: '/gradings/5',
    options,
  });
});

test('GradingService #52 - GET gradings with the backend query names', async () => {
  const params: GradingListParams = { classId: 1, studentId: 23, status: 'COMPLETED', page: 2, limit: 10 };
  const options = { signal: new AbortController().signal };
  await assertEndpointCall(service => service.listGradings(params, options), {
    method: 'GET',
    url: '/gradings',
    options: { ...options, params },
  });
});

test('GradingService #53 - GET annotations for one answer', async () => {
  const options = { signal: new AbortController().signal };
  await assertEndpointCall(service => service.listAnnotations(39, options), {
    method: 'GET',
    url: '/answers/39/annotations',
    options,
  });
});

test('GradingService #54 - POST an annotation', async () => {
  const payload = {
    startOffset: 2,
    endOffset: 8,
    errorType: 'GRAMMAR',
    comment: 'Check the tense.',
    suggestedFix: 'Use past tense.',
  };
  await assertEndpointCall(service => service.createAnnotation(39, payload), {
    method: 'POST',
    url: '/answers/39/annotations',
    data: payload,
    options: undefined,
  });
});

test('GradingService #55 - PATCH annotation review status', async () => {
  const payload: ReviewGradingAnnotationRequest = { reviewStatus: 'ACCEPTED' };
  await assertEndpointCall(service => service.reviewAnnotation(14, payload), {
    method: 'PATCH',
    url: '/annotations/14/review',
    data: payload,
    options: undefined,
  });
});

test('GradingService #56 - DELETE an annotation', async () => {
  await assertEndpointCall(service => service.deleteAnnotation(14), {
    method: 'DELETE',
    url: '/annotations/14',
    options: undefined,
  });
});

test('GradingService #57 - GET grading change logs', async () => {
  const options = { signal: new AbortController().signal };
  await assertEndpointCall(service => service.getChangeLogs(5, options), {
    method: 'GET',
    url: '/gradings/5/change-logs',
    options,
  });
});

test('getStudentGradingResult - non-completed grading calls only #48 and returns null', async () => {
  const service = new StubGradingService();
  service.summary.status = 'AI_GRADED';
  service.summary.finalScore = 8.5;

  assert.strictEqual(await service.getStudentGradingResult(7), null);
  assert.deepStrictEqual(service.calls, [{ endpoint: 'submission-module', id: 7, options: undefined }]);
});

test('getStudentGradingResult - completed grading returns only the allowlisted fields', async () => {
  const service = new StubGradingService();
  service.summary.status = 'COMPLETED';

  const result = await service.getStudentGradingResult(7);
  if (result === null) {
    throw new Error('Expected a completed grading result.');
  }

  assert.deepStrictEqual(service.calls, [
    { endpoint: 'submission-module', id: 7, options: undefined },
    { endpoint: 'grading', id: 5, options: undefined },
  ]);
  assert.deepStrictEqual(Object.keys(result).sort(), [
    'finalFeedback',
    'finalScore',
    'gradedAt',
    'id',
    'maxScoreSnapshot',
    'method',
    'submissionModuleId',
  ]);
  assert.deepStrictEqual(result, {
    id: 5,
    submissionModuleId: 7,
    method: 'TEACHER_MANUAL',
    finalScore: 8.5,
    maxScoreSnapshot: 10,
    finalFeedback: 'Published feedback',
    gradedAt: '2026-10-01T00:00:00Z',
  });
});

test('getStudentGradingResult - returns null if detail is no longer completed', async () => {
  const service = new StubGradingService();
  service.summary.status = 'COMPLETED';
  service.detail = createDetail('AI_GRADED');

  assert.strictEqual(await service.getStudentGradingResult(7), null);
  assert.deepStrictEqual(service.calls, [
    { endpoint: 'submission-module', id: 7, options: undefined },
    { endpoint: 'grading', id: 5, options: undefined },
  ]);
});

test('getStudentGradingResult - preserves errors from #48 and #51', async () => {
  const summaryFailure = new ApiClientError('Summary failed.', 403);
  const summaryService = new StubGradingService();
  summaryService.summaryError = summaryFailure;
  await assert.rejects(summaryService.getStudentGradingResult(7), (error: unknown) => error === summaryFailure);
  assert.deepStrictEqual(summaryService.calls, [
    { endpoint: 'submission-module', id: 7, options: undefined },
  ]);

  const detailFailure = new ApiClientError('Detail failed.', 404);
  const detailService = new StubGradingService();
  detailService.summary.status = 'COMPLETED';
  detailService.detailError = detailFailure;
  await assert.rejects(detailService.getStudentGradingResult(7), (error: unknown) => error === detailFailure);
  assert.deepStrictEqual(detailService.calls, [
    { endpoint: 'submission-module', id: 7, options: undefined },
    { endpoint: 'grading', id: 5, options: undefined },
  ]);
});
