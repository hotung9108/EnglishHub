import assert from 'node:assert/strict';
import test from 'node:test';
import { MockHttpClient } from './helpers/mock-http-client';
import {
  AnswerAnnotationService,
  type GradingAnnotation,
  type ReviewGradingAnnotationRequest,
} from '../services/answer-annotation.service';
import { resolveAudioUrl } from '../../utils/audioUrl.utils';

test('Teacher Annotation Review - listAnnotations returns AI annotations for speaking answer', async () => {
  const mockHttp = new MockHttpClient();
  const service = new AnswerAnnotationService(mockHttp);

  const mockAnnotations: GradingAnnotation[] = [
    {
      id: 101,
      source: 'AI',
      startOffset: 0,
      endOffset: 12,
      errorType: 'PRONUNCIATION',
      comment: 'Mispronounced vowel sound in introductory word.',
      suggestedFix: 'Focus on open vowel /æ/',
      reviewStatus: 'PENDING',
    },
    {
      id: 102,
      source: 'AI',
      startOffset: 25,
      endOffset: 34,
      errorType: 'GRAMMAR',
      comment: 'Subject-verb agreement error.',
      suggestedFix: 'Use "has" instead of "have"',
      reviewStatus: 'PENDING',
    },
  ];

  mockHttp.mockResponse = { data: mockAnnotations };

  const result = await service.listAnnotations(55);

  assert.strictEqual(mockHttp.calls.length, 1);
  assert.strictEqual(mockHttp.calls[0].method, 'GET');
  assert.strictEqual(mockHttp.calls[0].url, '/answers/55/annotations');
  assert.strictEqual(result.data.length, 2);
  assert.strictEqual(result.data[0].errorType, 'PRONUNCIATION');
  assert.strictEqual(result.data[1].errorType, 'GRAMMAR');
});

test('Teacher Annotation Review - reviewAnnotation accepts an annotation', async () => {
  const mockHttp = new MockHttpClient();
  const service = new AnswerAnnotationService(mockHttp);

  mockHttp.mockResponse = { message: 'Đã cập nhật trạng thái duyệt.' };

  const payload: ReviewGradingAnnotationRequest = { reviewStatus: 'ACCEPTED' };
  const result = await service.reviewAnnotation(101, payload);

  assert.strictEqual(mockHttp.calls.length, 1);
  assert.strictEqual(mockHttp.calls[0].method, 'PATCH');
  assert.strictEqual(mockHttp.calls[0].url, '/annotations/101/review');
  assert.deepStrictEqual(mockHttp.calls[0].data, { reviewStatus: 'ACCEPTED' });
  assert.strictEqual(result.message, 'Đã cập nhật trạng thái duyệt.');
});

test('Teacher Annotation Review - reviewAnnotation rejects an annotation', async () => {
  const mockHttp = new MockHttpClient();
  const service = new AnswerAnnotationService(mockHttp);

  mockHttp.mockResponse = { message: 'Đã cập nhật trạng thái duyệt.' };

  const payload: ReviewGradingAnnotationRequest = { reviewStatus: 'REJECTED' };
  const result = await service.reviewAnnotation(102, payload);

  assert.strictEqual(mockHttp.calls.length, 1);
  assert.strictEqual(mockHttp.calls[0].method, 'PATCH');
  assert.strictEqual(mockHttp.calls[0].url, '/annotations/102/review');
  assert.deepStrictEqual(mockHttp.calls[0].data, { reviewStatus: 'REJECTED' });
  assert.strictEqual(result.message, 'Đã cập nhật trạng thái duyệt.');
});

test('Teacher Annotation Filter & Counts - verifies filtering and status badge mapping', () => {
  const sampleAnnotations: GradingAnnotation[] = [
    {
      id: 1,
      source: 'AI',
      startOffset: 0,
      endOffset: 5,
      errorType: 'GRAMMAR',
      comment: null,
      suggestedFix: null,
      reviewStatus: 'PENDING',
    },
    {
      id: 2,
      source: 'AI',
      startOffset: 10,
      endOffset: 15,
      errorType: 'VOCABULARY',
      comment: null,
      suggestedFix: null,
      reviewStatus: 'ACCEPTED',
    },
    {
      id: 3,
      source: 'AI',
      startOffset: 20,
      endOffset: 25,
      errorType: 'PRONUNCIATION',
      comment: null,
      suggestedFix: null,
      reviewStatus: 'REJECTED',
    },
  ];

  const counts = {
    all: sampleAnnotations.length,
    pending: sampleAnnotations.filter(a => a.reviewStatus === 'PENDING').length,
    accepted: sampleAnnotations.filter(a => a.reviewStatus === 'ACCEPTED').length,
    rejected: sampleAnnotations.filter(a => a.reviewStatus === 'REJECTED').length,
  };

  assert.strictEqual(counts.all, 3);
  assert.strictEqual(counts.pending, 1);
  assert.strictEqual(counts.accepted, 1);
  assert.strictEqual(counts.rejected, 1);

  // Status filtering checks
  const pendingOnly = sampleAnnotations.filter(a => a.reviewStatus === 'PENDING');
  assert.strictEqual(pendingOnly.length, 1);
  assert.strictEqual(pendingOnly[0].id, 1);

  const acceptedOnly = sampleAnnotations.filter(a => a.reviewStatus === 'ACCEPTED');
  assert.strictEqual(acceptedOnly.length, 1);
  assert.strictEqual(acceptedOnly[0].id, 2);

  const rejectedOnly = sampleAnnotations.filter(a => a.reviewStatus === 'REJECTED');
  assert.strictEqual(rejectedOnly.length, 1);
  assert.strictEqual(rejectedOnly[0].id, 3);
});

test('Teacher Speaking Submission - audio URL is accurately resolved without fake toast', () => {
  const speakingKey = 'submissions/88/module-150/audio.webm';
  const url = resolveAudioUrl(speakingKey);

  assert.strictEqual(url, '/s3-upload/englishhub-dev/submissions/88/module-150/audio.webm');

  // MinIO internal host URL rewritten to Vite dev proxy
  const minioUrl = 'http://minio:9000/englishhub-dev/submissions/88/module-150/audio.webm';
  assert.strictEqual(
    resolveAudioUrl(minioUrl),
    '/s3-upload/englishhub-dev/submissions/88/module-150/audio.webm'
  );

  // Empty audio key returns empty string
  assert.strictEqual(resolveAudioUrl(''), '');
  assert.strictEqual(resolveAudioUrl(null), '');
  assert.strictEqual(resolveAudioUrl(undefined), '');
});
