import test from 'node:test';
import assert from 'node:assert/strict';
import { getBackendDocumentMimeType, getStudentAssignmentActionRoute } from '../../utils/examStepper.utils';
import { SubmissionService, type SubmitModuleResponse } from '../services/submission.service';
import { MockHttpClient } from './helpers/mock-http-client';

test('getBackendDocumentMimeType - normalizes PDF files and types', () => {
  assert.strictEqual(
    getBackendDocumentMimeType({ name: 'essay.pdf', type: 'application/pdf' }),
    'application/pdf'
  );
  assert.strictEqual(
    getBackendDocumentMimeType({ name: 'ESSAY_SAMPLE.PDF', type: '' }),
    'application/pdf'
  );
  assert.strictEqual(
    getBackendDocumentMimeType({ name: 'writing.pdf', type: 'application/octet-stream' }),
    'application/pdf'
  );
});

test('getBackendDocumentMimeType - normalizes DOCX Word files and types', () => {
  const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  assert.strictEqual(
    getBackendDocumentMimeType({ name: 'assignment.docx', type: docxMime }),
    docxMime
  );
  assert.strictEqual(
    getBackendDocumentMimeType({ name: 'MY_ESSAY.DOCX', type: '' }),
    docxMime
  );
  assert.strictEqual(
    getBackendDocumentMimeType({ name: 'doc1.docx', type: 'application/msword' }),
    docxMime
  );
  assert.strictEqual(
    getBackendDocumentMimeType({ name: 'essay.docx', type: 'application/octet-stream' }),
    docxMime
  );
});

test('SubmissionService - submitModule sends document storageKey and answers for Writing', async () => {
  const http = new MockHttpClient();
  const response: SubmitModuleResponse = {
    message: 'Nộp phần thi bài viết thành công.',
    submissionModuleId: 88,
    status: 'SUBMITTED',
    answers: [
      {
        id: 201,
        questionId: 1,
        content: { text: 'My essay content' },
        docStorageKey: 'submissions/12/module-88/essay.pdf',
        docMimeType: 'application/pdf',
        docUploadStatus: 'READY',
      },
    ],
  };
  http.mockResponse = response;

  const result = await new SubmissionService(http).submitModule(88, {
    storageKey: 'submissions/12/module-88/essay.pdf',
    answers: [
      {
        questionId: 1,
        content: {
          text: 'My essay content',
          fileName: 'essay.pdf',
          hasAttachedFile: true,
        },
      },
    ],
  });

  assert.strictEqual(result, response);
  assert.deepStrictEqual(http.calls, [
    {
      method: 'POST',
      url: '/submission-modules/88/submit',
      data: {
        storageKey: 'submissions/12/module-88/essay.pdf',
        answers: [
          {
            questionId: 1,
            content: {
              text: 'My essay content',
              fileName: 'essay.pdf',
              hasAttachedFile: true,
            },
          },
        ],
      },
      options: undefined,
    },
  ]);
});

test('getStudentAssignmentActionRoute - routes completed and pending submissions to review', () => {
  // Pending grading
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 10,
      status: 'pending',
      type: 'Writing',
      submissionId: 259,
    }),
    '/student/submissions/259'
  );

  // AI processing
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 11,
      status: 'ai_processing',
      type: 'Speaking',
      submissionId: 260,
    }),
    '/student/submissions/260'
  );

  // Graded with submissionId
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'graded',
      type: 'Reading',
      submissionId: 261,
    }),
    '/student/submissions/261'
  );

  // Completed without submissionId fallbacks to result
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'graded',
      type: 'Writing',
    }),
    '/student/assignments/12/result'
  );
});

test('getStudentAssignmentActionRoute - routes not started and in-progress assignments correctly', () => {
  // Not started -> overview
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 15,
      status: 'not_started',
      type: 'Writing',
    }),
    '/student/assignments/15/overview'
  );

  // In progress Writing -> taking page with submissionId
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 15,
      status: 'in_progress',
      type: 'Writing',
      submissionId: 300,
    }),
    '/student/assignments/writing/15?submissionId=300'
  );

  // In progress Speaking -> speaking test page with submissionId
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 16,
      status: 'in_progress',
      type: 'Speaking',
      submissionId: 301,
    }),
    '/student/assignments/speaking/16?submissionId=301'
  );
});

