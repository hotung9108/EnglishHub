import test from 'node:test';
import assert from 'node:assert';
import {
  extractAnnotationSnippet,
  extractAnswerContentText,
  extractTranscriptText,
} from '../../utils/annotationSnippet.utils';
import type { SubmittedAnswerItem } from '../services/submission.service';

test('extractAnnotationSnippet - extracts snippet at beginning of text', () => {
  const text = 'EnglishHub provides automated grading and AI annotations.';
  const snippet = extractAnnotationSnippet(text, 0, 10, 'Fallback');
  assert.strictEqual(snippet, 'EnglishHub');
});

test('extractAnnotationSnippet - extracts snippet in the middle of text', () => {
  const text = 'EnglishHub provides automated grading and AI annotations.';
  const snippet = extractAnnotationSnippet(text, 11, 19, 'Fallback');
  assert.strictEqual(snippet, 'provides');
});

test('extractAnnotationSnippet - handles out-of-bounds start offset safely without crash', () => {
  const text = 'EnglishHub provides automated grading and AI annotations.';
  const snippet = extractAnnotationSnippet(text, 9999, 10050, '(Đoạn văn bản không khả dụng)');
  assert.strictEqual(snippet, '(Đoạn văn bản không khả dụng)');
});

test('extractAnnotationSnippet - safely handles end offset exceeding text length', () => {
  const text = 'Short text';
  const snippet = extractAnnotationSnippet(text, 6, 9999, 'Fallback');
  assert.strictEqual(snippet, 'text');
});

test('extractAnnotationSnippet - handles negative startOffset safely without crash', () => {
  const text = 'EnglishHub';
  const snippet = extractAnnotationSnippet(text, -5, 7, 'Fallback');
  assert.strictEqual(snippet, 'English');
});

test('extractAnnotationSnippet - returns fallback when endOffset <= startOffset', () => {
  const text = 'EnglishHub';
  assert.strictEqual(extractAnnotationSnippet(text, 5, 5, 'Fallback'), 'Fallback');
  assert.strictEqual(extractAnnotationSnippet(text, 8, 3, 'Fallback'), 'Fallback');
});

test('extractAnnotationSnippet - returns fallback for empty, null, or undefined text', () => {
  assert.strictEqual(extractAnnotationSnippet('', 0, 5, 'Fallback'), 'Fallback');
  assert.strictEqual(extractAnnotationSnippet(null, 0, 5, 'Fallback'), 'Fallback');
  assert.strictEqual(extractAnnotationSnippet(undefined, 0, 5, 'Fallback'), 'Fallback');
});

test('extractAnnotationSnippet - returns fallback for undefined or non-finite offsets', () => {
  const text = 'Hello world';
  assert.strictEqual(extractAnnotationSnippet(text, undefined, 5, 'Fallback'), 'Fallback');
  assert.strictEqual(extractAnnotationSnippet(text, 0, undefined, 'Fallback'), 'Fallback');
  assert.strictEqual(extractAnnotationSnippet(text, NaN, 5, 'Fallback'), 'Fallback');
});

test('extractAnswerContentText - extracts plain string content', () => {
  const answers: SubmittedAnswerItem[] = [
    { id: 1, questionId: 1, content: 'This is my essay submission.' },
  ];
  assert.strictEqual(extractAnswerContentText(answers), 'This is my essay submission.');
});

test('extractAnswerContentText - extracts object content with text/essay/answer keys', () => {
  const answers: SubmittedAnswerItem[] = [
    { id: 10, questionId: 1, content: { text: 'Essay body from text key' } },
  ];
  assert.strictEqual(extractAnswerContentText(answers), 'Essay body from text key');

  const essayAnswers: SubmittedAnswerItem[] = [
    { id: 11, questionId: 1, content: { essay: 'Essay body from essay key' } },
  ];
  assert.strictEqual(extractAnswerContentText(essayAnswers), 'Essay body from essay key');

  const answerAnswers: SubmittedAnswerItem[] = [
    { id: 12, questionId: 1, content: { answer: 'Body from answer key' } },
  ];
  assert.strictEqual(extractAnswerContentText(answerAnswers), 'Body from answer key');
});

test('extractAnswerContentText - prioritizes targetAnswerId when multiple answers exist', () => {
  const answers: SubmittedAnswerItem[] = [
    { id: 1, questionId: 1, content: 'Question 1 text' },
    { id: 2, questionId: 2, content: 'Question 2 target essay' },
  ];
  assert.strictEqual(extractAnswerContentText(answers, 2), 'Question 2 target essay');
  assert.strictEqual(extractAnswerContentText(answers, 1), 'Question 1 text');
});

test('extractAnswerContentText - handles null and undefined gracefully', () => {
  assert.strictEqual(extractAnswerContentText(undefined), '');
  assert.strictEqual(extractAnswerContentText([]), '');
  assert.strictEqual(extractAnswerContentText([{ id: 1, questionId: 1, content: null }]), '');
});


test('extractTranscriptText - extracts words from serialized JSON string from Spring Boot backend', () => {
  const serializedJson = JSON.stringify({
    modelUsed: 'google/gemini-2.5-flash',
    transcript: [
      { word: 'My', start: 1.77, end: 2.01 },
      { word: 'family', start: 2.19, end: 2.68 },
      { word: 'is', start: 2.87, end: 3.01 },
      { word: 'have', start: 3.23, end: 3.51 },
      { word: 'four', start: 3.91, end: 4.29 },
      { word: 'people.', start: 4.38, end: 5.09 },
    ],
    providerUsed: 'openrouter',
    criteriaScores: { overallScore: 6.25 },
  });

  const extracted = extractTranscriptText(serializedJson);
  assert.strictEqual(extracted, 'My family is have four people.');
});

test('extractTranscriptText - extracts words from parsed object with transcript array', () => {
  const obj = {
    transcript: [
      { word: 'My' },
      { word: 'father' },
      { word: 'is' },
      { word: 'work' },
    ],
  };
  const extracted = extractTranscriptText(obj);
  assert.strictEqual(extracted, 'My father is work');
});

test('extractTranscriptText - extracts words from direct array of WordTimestamp', () => {
  const arr = [{ word: 'English' }, { word: 'Hub' }];
  const extracted = extractTranscriptText(arr);
  assert.strictEqual(extracted, 'English Hub');
});

test('extractTranscriptText - preserves plain string transcript', () => {
  const plain = 'My family is have four people.';
  assert.strictEqual(extractTranscriptText(plain), plain);
});

test('extractTranscriptText - returns empty string for null, undefined, or empty structures', () => {
  assert.strictEqual(extractTranscriptText(null), '');
  assert.strictEqual(extractTranscriptText(undefined), '');
  assert.strictEqual(extractTranscriptText({}), '');
  assert.strictEqual(extractTranscriptText(''), '');
});
