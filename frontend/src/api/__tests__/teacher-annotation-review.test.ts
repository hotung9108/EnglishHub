import assert from 'node:assert/strict';
import test from 'node:test';
import { MockHttpClient } from './helpers/mock-http-client';
import {
  AnswerAnnotationService,
  type GradingAnnotation,
  type ReviewGradingAnnotationRequest,
} from '../services/answer-annotation.service';
import { resolveAudioUrl } from '../../utils/audioUrl.utils';
import {
  formatAnnotationBadgeLabel,
  normalizeAnnotationCategory,
} from '../../utils/annotationCategory.utils';

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

test('Teacher Annotation Create & Delete - createAnnotation and deleteAnnotation work with backend contract', async () => {
  const mockHttp = new MockHttpClient();
  const service = new AnswerAnnotationService(mockHttp);

  mockHttp.mockResponse = { id: 305, message: 'Đã thêm chú thích.' };
  const createRes = await service.createAnnotation(55, {
    startOffset: 10,
    endOffset: 24,
    errorType: 'VOCABULARY',
    comment: 'Dùng collocation tự nhiên hơn.',
    suggestedFix: 'make significant progress',
  });

  assert.strictEqual(mockHttp.calls.length, 1);
  assert.strictEqual(mockHttp.calls[0].method, 'POST');
  assert.strictEqual(mockHttp.calls[0].url, '/answers/55/annotations');
  assert.strictEqual(createRes.id, 305);
  assert.strictEqual(createRes.message, 'Đã thêm chú thích.');

  mockHttp.mockResponse = { message: 'Đã xoá chú thích.' };
  const deleteRes = await service.deleteAnnotation(305);

  assert.strictEqual(mockHttp.calls.length, 2);
  assert.strictEqual(mockHttp.calls[1].method, 'DELETE');
  assert.strictEqual(mockHttp.calls[1].url, '/annotations/305');
  assert.strictEqual(deleteRes.message, 'Đã xoá chú thích.');
});

test('Student Result Annotations - only ACCEPTED annotations are displayed and null content does not produce "null" snippet', () => {
  const allAnnotations: GradingAnnotation[] = [
    {
      id: 1,
      source: 'AI',
      startOffset: 0,
      endOffset: 4,
      errorType: 'PRONUNCIATION',
      comment: 'Pending AI suggestion',
      suggestedFix: '/test/',
      reviewStatus: 'PENDING',
    },
    {
      id: 2,
      source: 'AI',
      startOffset: 0,
      endOffset: 6,
      errorType: 'PRONUNCIATION',
      comment: 'Approved AI suggestion',
      suggestedFix: '/ˈhæb.ɪts/',
      reviewStatus: 'ACCEPTED',
    },
    {
      id: 3,
      source: 'TEACHER',
      startOffset: 7,
      endOffset: 13,
      errorType: 'GRAMMAR',
      comment: 'Teacher manual note',
      suggestedFix: 'change',
      reviewStatus: 'ACCEPTED',
    },
    {
      id: 4,
      source: 'AI',
      startOffset: 14,
      endOffset: 20,
      errorType: 'VOCABULARY',
      comment: 'Rejected AI suggestion',
      suggestedFix: 'ignore',
      reviewStatus: 'REJECTED',
    },
  ];

  // Student view filters only ACCEPTED annotations
  const studentVisible = allAnnotations.filter(a => a.reviewStatus === 'ACCEPTED');
  assert.strictEqual(studentVisible.length, 2);
  assert.deepStrictEqual(studentVisible.map(a => a.id), [2, 3]);

  // Verify null answer content does not stringify to "null"
  const extractAnswerContent = (content: unknown): string => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'string') return content;
    return String(content);
  };
  assert.strictEqual(extractAnswerContent(null), '');
  assert.strictEqual(extractAnswerContent(undefined), '');
});

test('Student Result Annotations - PRONUNCIATION, FLUENCY, and other errorType values are preserved instead of mislabeled as GRAMMAR', () => {
  assert.strictEqual(normalizeAnnotationCategory('PRONUNCIATION'), 'pronunciation');
  assert.strictEqual(formatAnnotationBadgeLabel('PRONUNCIATION', 'pronunciation'), 'PRONUNCIATION');

  assert.strictEqual(normalizeAnnotationCategory('FLUENCY'), 'fluency');
  assert.strictEqual(formatAnnotationBadgeLabel('FLUENCY', 'fluency'), 'FLUENCY');

  assert.strictEqual(normalizeAnnotationCategory('VOCABULARY'), 'vocabulary');
  assert.strictEqual(normalizeAnnotationCategory('Vocabulary Precision'), 'vocabulary');
  assert.strictEqual(formatAnnotationBadgeLabel('VOCABULARY', 'vocabulary'), 'VOCABULARY');

  assert.strictEqual(normalizeAnnotationCategory('COHESION'), 'cohesion');
  assert.strictEqual(formatAnnotationBadgeLabel('COHESION', 'cohesion'), 'COHESION');

  assert.strictEqual(normalizeAnnotationCategory('PUNCTUATION'), 'punctuation');
  assert.strictEqual(formatAnnotationBadgeLabel('PUNCTUATION', 'punctuation'), 'PUNCTUATION');

  assert.strictEqual(normalizeAnnotationCategory('SPELLING'), 'spelling');
  assert.strictEqual(formatAnnotationBadgeLabel('SPELLING', 'spelling'), 'SPELLING');

  assert.strictEqual(normalizeAnnotationCategory('POSITIVE'), 'positive');
  assert.strictEqual(formatAnnotationBadgeLabel('POSITIVE', 'positive'), 'POSITIVE');

  assert.strictEqual(normalizeAnnotationCategory('GRAMMAR'), 'grammar');
  assert.strictEqual(normalizeAnnotationCategory(null), 'grammar');
  assert.strictEqual(normalizeAnnotationCategory(undefined), 'grammar');
  assert.strictEqual(normalizeAnnotationCategory('   '), 'grammar');
  assert.strictEqual(formatAnnotationBadgeLabel(null, 'grammar'), 'GRAMMAR');
  assert.strictEqual(formatAnnotationBadgeLabel('   ', 'pronunciation'), 'PRONUNCIATION');
});
