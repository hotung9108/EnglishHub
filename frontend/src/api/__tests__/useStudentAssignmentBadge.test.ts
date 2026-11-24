import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAssignmentBadge } from '../../hooks/useStudentAssignmentBadge';
import { ASSIGNMENT_SUBMITTED_EVENT, notifyAssignmentSubmitted } from '../../utils/assignmentEvents.utils';
import type { AssignmentSummary } from '../services/assignment.service';
import type { SubmissionListItem } from '../services/submission.service';
import { isSubmissionGraded } from '../services/submission.service';

// ==========================================
// 1. FORMAT ASSIGNMENT BADGE (ZERO-BLOAT RULES)
// ==========================================
test('formatAssignmentBadge returns undefined for count <= 0 to satisfy Zero-Bloat standard', () => {
  assert.strictEqual(formatAssignmentBadge(0), undefined);
  assert.strictEqual(formatAssignmentBadge(-1), undefined);
  assert.strictEqual(formatAssignmentBadge(-100), undefined);
  assert.strictEqual(formatAssignmentBadge(NaN), undefined);
  assert.strictEqual(formatAssignmentBadge(Number.NEGATIVE_INFINITY), undefined);
});

test('formatAssignmentBadge formats valid positive numbers as strings', () => {
  assert.strictEqual(formatAssignmentBadge(1), '1');
  assert.strictEqual(formatAssignmentBadge(7), '7');
  assert.strictEqual(formatAssignmentBadge(24), '24');
  assert.strictEqual(formatAssignmentBadge(99), '99');
});

test('formatAssignmentBadge caps numbers above 99 to 99+', () => {
  assert.strictEqual(formatAssignmentBadge(100), '99+');
  assert.strictEqual(formatAssignmentBadge(250), '99+');
  assert.strictEqual(formatAssignmentBadge(999), '99+');
});

// ==========================================
// 2. ASSIGNMENT SUBMISSION EVENT NOTIFIER
// ==========================================
test('ASSIGNMENT_SUBMITTED_EVENT has correct namespace and notifyAssignmentSubmitted dispatches event', () => {
  assert.strictEqual(ASSIGNMENT_SUBMITTED_EVENT, 'englishhub:assignment-submitted');

  let eventFired = false;
  const mockWindow = {
    dispatchEvent: (event: { type: string }) => {
      if (event.type === ASSIGNMENT_SUBMITTED_EVENT) {
        eventFired = true;
      }
      return true;
    },
  };

  const originalWindow = (globalThis as unknown as { window?: unknown }).window;
  try {
    (globalThis as unknown as { window?: unknown }).window = mockWindow;
    notifyAssignmentSubmitted();
    assert.strictEqual(eventFired, true, 'notifyAssignmentSubmitted should dispatch event on window');
  } finally {
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
  }
});

// ==========================================
// 3. PENDING ASSIGNMENT CALCULATION LOGIC
// ==========================================
function computePendingAssignmentCount(
  assignments: AssignmentSummary[],
  submissions: SubmissionListItem[]
): number {
  const uniqueAssignments = new Map<number, AssignmentSummary>();
  for (const item of assignments) {
    if (!uniqueAssignments.has(item.id)) {
      uniqueAssignments.set(item.id, item);
    }
  }

  const submittedAssignmentIds = new Set<number>();
  for (const s of submissions) {
    if (s.status === 'SUBMITTED' || s.status === 'GRADED' || isSubmissionGraded(s)) {
      submittedAssignmentIds.add(s.assignmentId);
    }
  }

  let pendingCount = 0;
  for (const [id] of uniqueAssignments) {
    if (!submittedAssignmentIds.has(id)) {
      pendingCount++;
    }
  }
  return pendingCount;
}

test('computePendingAssignmentCount correctly computes incomplete assignments', () => {
  const assignments: AssignmentSummary[] = [
    { id: 101, title: 'IELTS Essay 1', status: 'PUBLISHED', closeAt: '2026-11-01', skills: ['WRITING'] },
    { id: 102, title: 'Speaking Task 2', status: 'PUBLISHED', closeAt: '2026-11-02', skills: ['SPEAKING'] },
    { id: 103, title: 'Reading Passage 1', status: 'PUBLISHED', closeAt: '2026-11-03', skills: ['READING'] },
  ];

  // 1. When student has no submissions: all 3 are pending
  const countNoSubmissions = computePendingAssignmentCount(assignments, []);
  assert.strictEqual(countNoSubmissions, 3);
  assert.strictEqual(formatAssignmentBadge(countNoSubmissions), '3');

  // 2. When student submitted assignment 101 (SUBMITTED)
  const countWithOneSubmitted = computePendingAssignmentCount(assignments, [
    {
      id: 501,
      assignmentId: 101,
      studentId: 99,
      attemptNumber: 1,
      status: 'SUBMITTED',
      submittedAt: '2026-10-25T10:00:00Z',
      modules: [],
    },
  ]);
  assert.strictEqual(countWithOneSubmitted, 2);
  assert.strictEqual(formatAssignmentBadge(countWithOneSubmitted), '2');

  // 3. When student has an IN_PROGRESS submission on assignment 102 (attempt not yet submitted)
  // It must still be counted as pending!
  const countWithInProgress = computePendingAssignmentCount(assignments, [
    {
      id: 501,
      assignmentId: 101,
      studentId: 99,
      attemptNumber: 1,
      status: 'SUBMITTED',
      submittedAt: '2026-10-25T10:00:00Z',
      modules: [],
    },
    {
      id: 502,
      assignmentId: 102,
      studentId: 99,
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      submittedAt: null,
      modules: [{ id: 601, moduleId: 701, skill: 'SPEAKING', taskType: 'RECORDING', status: 'IN_PROGRESS', grading: null }],
    },
  ]);
  assert.strictEqual(countWithInProgress, 2);

  // 4. When all assignments are submitted/graded (Inbox Zero)
  const countAllDone = computePendingAssignmentCount(assignments, [
    {
      id: 501,
      assignmentId: 101,
      studentId: 99,
      attemptNumber: 1,
      status: 'SUBMITTED',
      submittedAt: '2026-10-25T10:00:00Z',
      modules: [],
    },
    {
      id: 502,
      assignmentId: 102,
      studentId: 99,
      attemptNumber: 1,
      status: 'GRADED',
      submittedAt: '2026-10-25T11:00:00Z',
      modules: [],
    },
    {
      id: 503,
      assignmentId: 103,
      studentId: 99,
      attemptNumber: 1,
      status: 'SUBMITTED',
      submittedAt: '2026-10-25T12:00:00Z',
      modules: [],
    },
  ]);
  assert.strictEqual(countAllDone, 0);
  assert.strictEqual(formatAssignmentBadge(countAllDone), undefined, 'Badge should be hidden when all done');
});

test('computePendingAssignmentCount deduplicates identical assignments across multiple classes', () => {
  const duplicateAssignments: AssignmentSummary[] = [
    { id: 201, title: 'Grammar Quiz', status: 'PUBLISHED', closeAt: '2026-11-01', skills: ['READING'] },
    { id: 201, title: 'Grammar Quiz', status: 'PUBLISHED', closeAt: '2026-11-01', skills: ['READING'] },
    { id: 202, title: 'Vocabulary Test', status: 'PUBLISHED', closeAt: '2026-11-02', skills: ['READING'] },
  ];

  const pending = computePendingAssignmentCount(duplicateAssignments, []);
  assert.strictEqual(pending, 2, 'Should deduplicate assignments with matching IDs');
});
