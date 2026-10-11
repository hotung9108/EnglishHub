import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  QuestionService, 
  buildMcqPayload, 
  buildShortAnswerPayload, 
  extractMcqOptions, 
  extractShortAnswerText,
  type MultipleChoiceOptionDto
} from '../services/question.service';
import { MockHttpClient } from './helpers/mock-http-client';

test('buildMcqPayload - generates exactly 4 options with positive IDs and single correct answer', () => {
  const payload = buildMcqPayload({
    content: 'What is green architecture?',
    options: ['Eco design', 'High rise', 'Wooden only', 'None of above'],
    correctOptionIndexOrText: 'Eco design',
    score: 2,
    orderIndex: 1,
  });

  assert.strictEqual(payload.questionType, 'MULTIPLE_CHOICE');
  assert.strictEqual(payload.content, 'What is green architecture?');
  assert.strictEqual(payload.score, 2);
  assert.strictEqual(payload.orderIndex, 1);

  const opts = (payload.correctAnswer as { options: MultipleChoiceOptionDto[] }).options;
  assert.strictEqual(opts.length, 4);
  assert.deepStrictEqual(opts.map(o => o.id), [1, 2, 3, 4]);

  // First option is correct
  assert.strictEqual(opts[0].isCorrect, true);
  assert.strictEqual(opts[0].content, 'Eco design');
  assert.strictEqual(opts[1].isCorrect, false);
  assert.strictEqual(opts[2].isCorrect, false);
  assert.strictEqual(opts[3].isCorrect, false);
});

test('buildMcqPayload - pads missing options and matches correct option by letter or index', () => {
  const payload = buildMcqPayload({
    content: 'Question with few options',
    options: ['Choice 1', 'Choice 2'],
    correctOptionIndexOrText: 'B', // should match second option
    score: 1,
    orderIndex: 3,
  });

  const opts = (payload.correctAnswer as { options: MultipleChoiceOptionDto[] }).options;
  assert.strictEqual(opts.length, 4);
  assert.strictEqual(opts[0].content, 'Choice 1');
  assert.strictEqual(opts[1].content, 'Choice 2');
  assert.strictEqual(opts[1].isCorrect, true);
  assert.strictEqual(opts[0].isCorrect, false);
  assert.strictEqual(opts[2].isCorrect, false);
  assert.strictEqual(opts[3].isCorrect, false);
});

test('buildShortAnswerPayload - builds valid payload with trimmed answer and score', () => {
  const payload = buildShortAnswerPayload({
    content: 'Fill in the blank: [ _____ ]',
    answerText: 'Renewable Energy',
    score: 1.5,
    orderIndex: 2,
  });

  assert.strictEqual(payload.questionType, 'SHORT_ANSWER');
  assert.strictEqual(payload.content, 'Fill in the blank: [ _____ ]');
  assert.strictEqual(payload.score, 1.5);
  assert.strictEqual(payload.orderIndex, 2);
  assert.strictEqual((payload.correctAnswer as { correctAnswer: string }).correctAnswer, 'Renewable Energy');
});

test('extractMcqOptions - parses options and identifies correct answer from response', () => {
  const rawCorrectAnswer = {
    options: [
      { id: 1, content: 'Opt A', isCorrect: false },
      { id: 2, content: 'Opt B', isCorrect: true },
      { id: 3, content: 'Opt C', isCorrect: false },
      { id: 4, content: 'Opt D', isCorrect: false },
    ],
  };

  const extracted = extractMcqOptions(rawCorrectAnswer);
  assert.strictEqual(extracted.options.length, 4);
  assert.strictEqual(extracted.options[0], 'Opt A');
  assert.strictEqual(extracted.options[1], 'Opt B');
  assert.strictEqual(extracted.correctOptionContent, 'Opt B');
  assert.strictEqual(extracted.correctOptionIndex, 1);
});

test('extractShortAnswerText - parses string answer from correctAnswer object', () => {
  assert.strictEqual(extractShortAnswerText({ correctAnswer: 'Cambridge' }), 'Cambridge');
  assert.strictEqual(extractShortAnswerText({ correct_answer: 'Oxford' }), 'Oxford');
  assert.strictEqual(extractShortAnswerText(null), '');
});

test('QuestionService - listQuestions calls GET /modules/:moduleId/questions', async () => {
  const mockHttp = new MockHttpClient();
  const service = new QuestionService(mockHttp);
  mockHttp.mockResponse = {
    questions: [
      { id: 10, content: 'Q1', questionType: 'MULTIPLE_CHOICE', score: 1, orderIndex: 1 }
    ]
  };

  const res = await service.listQuestions(5);
  assert.strictEqual(mockHttp.calls.length, 1);
  assert.strictEqual(mockHttp.calls[0].method, 'GET');
  assert.strictEqual(mockHttp.calls[0].url, '/modules/5/questions');
  assert.strictEqual(res.questions?.length, 1);
  assert.strictEqual(res.data?.length, 1);
});

test('QuestionService - listQuestions normalizes response when backend returns { data: [...] }', async () => {
  const mockHttp = new MockHttpClient();
  const service = new QuestionService(mockHttp);
  mockHttp.mockResponse = {
    data: [
      { id: 101, content: 'Data Q1', questionType: 'MULTIPLE_CHOICE', score: 1, orderIndex: 1 },
      { id: 102, content: 'Data Q2', questionType: 'MULTIPLE_CHOICE', score: 1, orderIndex: 2 }
    ]
  };

  const res = await service.listQuestions(8);
  assert.strictEqual(res.questions?.length, 2);
  assert.strictEqual(res.data?.length, 2);
  assert.strictEqual(res.questions?.[0].content, 'Data Q1');
  assert.strictEqual(res.data?.[1].content, 'Data Q2');
});

test('QuestionService - createQuestion calls POST /modules/:moduleId/questions with payload', async () => {
  const mockHttp = new MockHttpClient();
  const service = new QuestionService(mockHttp);
  mockHttp.mockResponse = { id: 15, message: 'Tạo câu hỏi thành công.' };

  const payload = buildMcqPayload({
    content: 'Q1',
    options: ['A', 'B', 'C', 'D'],
    correctOptionIndexOrText: 0,
    orderIndex: 1,
  });

  const res = await service.createQuestion(5, payload);
  assert.strictEqual(mockHttp.calls.length, 1);
  assert.strictEqual(mockHttp.calls[0].method, 'POST');
  assert.strictEqual(mockHttp.calls[0].url, '/modules/5/questions');
  assert.strictEqual(mockHttp.calls[0].data, payload);
  assert.strictEqual(res.id, 15);
});

test('QuestionService - updateQuestion and deleteQuestion call correct endpoints', async () => {
  const mockHttp = new MockHttpClient();
  const service = new QuestionService(mockHttp);
  mockHttp.mockResponse = { message: 'Success' };

  await service.updateQuestion(20, { content: 'Updated statement' });
  assert.strictEqual(mockHttp.calls[0].method, 'PUT');
  assert.strictEqual(mockHttp.calls[0].url, '/questions/20');

  await service.deleteQuestion(20);
  assert.strictEqual(mockHttp.calls[1].method, 'DELETE');
  assert.strictEqual(mockHttp.calls[1].url, '/questions/20');
});
