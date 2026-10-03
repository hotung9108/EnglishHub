import assert from 'node:assert/strict';
import test from 'node:test';
import { MockHttpClient } from './helpers/mock-http-client';
import {
  AnswerAnnotationService,
  type ReviewGradingAnnotationRequest,
} from '../services/answer-annotation.service';

async function assertEndpointCall(
  action: (service: AnswerAnnotationService) => Promise<unknown>,
  expectedCall: MockHttpClient['calls'][number]
): Promise<void> {
  const http = new MockHttpClient();
  const service = new AnswerAnnotationService(http);

  await action(service);
  assert.deepStrictEqual(http.calls, [expectedCall]);
}

test('AnswerAnnotationService #53 - GET annotations for one answer', async () => {
  const options = { signal: new AbortController().signal };
  await assertEndpointCall(service => service.listAnnotations(39, options), {
    method: 'GET',
    url: '/answers/39/annotations',
    options,
  });
});

test('AnswerAnnotationService #54 - POST an annotation', async () => {
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

test('AnswerAnnotationService #55 - PATCH annotation review status', async () => {
  const payload: ReviewGradingAnnotationRequest = { reviewStatus: 'ACCEPTED' };
  await assertEndpointCall(service => service.reviewAnnotation(14, payload), {
    method: 'PATCH',
    url: '/annotations/14/review',
    data: payload,
    options: undefined,
  });
});

test('AnswerAnnotationService #56 - DELETE an annotation', async () => {
  await assertEndpointCall(service => service.deleteAnnotation(14), {
    method: 'DELETE',
    url: '/annotations/14',
    options: undefined,
  });
});
