import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSkill,
  getSkillRoute,
  getSkillLabel,
  resolveEffectiveModules,
  isModuleSubmittedOrGraded,
  isModuleAccessible,
  getNextIncompleteModule,
  isAllModulesCompleted,
  calculateExamSteps,
  getStudentAssignmentActionRoute,
  getExamPageRedirectRoute,
  type ExamModuleItem,
  type SubmissionModuleItem
} from '../../utils/examStepper.utils';

test('normalizeSkill correctly identifies all 4 English skills and variants', () => {
  assert.strictEqual(normalizeSkill('LISTENING'), 'listening');
  assert.strictEqual(normalizeSkill('listening'), 'listening');
  assert.strictEqual(normalizeSkill('Nghe'), 'listening');
  assert.strictEqual(normalizeSkill('ls'), 'listening');

  assert.strictEqual(normalizeSkill('READING'), 'reading');
  assert.strictEqual(normalizeSkill('reading'), 'reading');
  assert.strictEqual(normalizeSkill('Đọc'), 'reading');
  assert.strictEqual(normalizeSkill('rd'), 'reading');

  assert.strictEqual(normalizeSkill('WRITING'), 'writing');
  assert.strictEqual(normalizeSkill('writing'), 'writing');
  assert.strictEqual(normalizeSkill('Viết'), 'writing');

  assert.strictEqual(normalizeSkill('SPEAKING'), 'speaking');
  assert.strictEqual(normalizeSkill('speaking'), 'speaking');
  assert.strictEqual(normalizeSkill('Nói'), 'speaking');
  assert.strictEqual(normalizeSkill('spk'), 'speaking');

  assert.strictEqual(normalizeSkill('OTHER'), 'unknown');
  assert.strictEqual(normalizeSkill(null), 'unknown');
  assert.strictEqual(normalizeSkill(undefined), 'unknown');
});

test('getSkillRoute generates uniform and correct routes with query parameters', () => {
  assert.strictEqual(
    getSkillRoute('LISTENING', 42, 100),
    '/student/assignments/listening/42?submissionId=100'
  );
  assert.strictEqual(
    getSkillRoute('READING', 42, 100),
    '/student/assignments/reading/42?submissionId=100'
  );
  assert.strictEqual(
    getSkillRoute('WRITING', 42, 100),
    '/student/assignments/writing/42?submissionId=100'
  );
  assert.strictEqual(
    getSkillRoute('SPEAKING', 42, 100),
    '/student/assignments/speaking/42?submissionId=100'
  );
  assert.strictEqual(
    getSkillRoute('WRITING', 42),
    '/student/assignments/writing/42'
  );
});

test('getSkillLabel returns standard labels', () => {
  assert.strictEqual(getSkillLabel('LISTENING'), 'Nghe (Listening)');
  assert.strictEqual(getSkillLabel('READING'), 'Đọc (Reading)');
  assert.strictEqual(getSkillLabel('WRITING'), 'Viết (Writing)');
  assert.strictEqual(getSkillLabel('SPEAKING'), 'Nói (Speaking)');
});

test('isModuleSubmittedOrGraded recognizes SUBMITTED and GRADED as completed', () => {
  assert.strictEqual(isModuleSubmittedOrGraded({ id: 1, moduleId: 10, status: 'SUBMITTED' }), true);
  assert.strictEqual(isModuleSubmittedOrGraded({ id: 1, moduleId: 10, status: 'GRADED' }), true);
  assert.strictEqual(isModuleSubmittedOrGraded({ id: 1, moduleId: 10, status: 'IN_PROGRESS' }), false);
  assert.strictEqual(isModuleSubmittedOrGraded(undefined), false);
});

test('Sequential access control: isModuleAccessible locks future modules until prior modules are done', () => {
  const assignmentModules: ExamModuleItem[] = [
    { id: 101, skill: 'LISTENING', orderIndex: 1 },
    { id: 102, skill: 'READING', orderIndex: 2 },
    { id: 103, skill: 'WRITING', orderIndex: 3 },
    { id: 104, skill: 'SPEAKING', orderIndex: 4 }
  ];

  // At the start: only Module 0 (Listening) is accessible
  assert.strictEqual(isModuleAccessible(0, assignmentModules, []), true);
  assert.strictEqual(isModuleAccessible(1, assignmentModules, []), false);
  assert.strictEqual(isModuleAccessible(2, assignmentModules, []), false);
  assert.strictEqual(isModuleAccessible(3, assignmentModules, []), false);

  // When Module 0 is submitted: Module 1 becomes accessible, but 2 and 3 remain locked
  const subModulesStep1: SubmissionModuleItem[] = [
    { id: 1, moduleId: 101, skill: 'LISTENING', status: 'SUBMITTED' }
  ];
  assert.strictEqual(isModuleAccessible(0, assignmentModules, subModulesStep1), true);
  assert.strictEqual(isModuleAccessible(1, assignmentModules, subModulesStep1), true);
  assert.strictEqual(isModuleAccessible(2, assignmentModules, subModulesStep1), false);
  assert.strictEqual(isModuleAccessible(3, assignmentModules, subModulesStep1), false);

  // When Module 1 is also submitted: Module 2 becomes accessible, 3 remains locked
  const subModulesStep2: SubmissionModuleItem[] = [
    { id: 1, moduleId: 101, skill: 'LISTENING', status: 'SUBMITTED' },
    { id: 2, moduleId: 102, skill: 'READING', status: 'SUBMITTED' }
  ];
  assert.strictEqual(isModuleAccessible(2, assignmentModules, subModulesStep2), true);
  assert.strictEqual(isModuleAccessible(3, assignmentModules, subModulesStep2), false);

  // When Module 2 is also submitted: Module 3 becomes accessible
  const subModulesStep3: SubmissionModuleItem[] = [
    ...subModulesStep2,
    { id: 3, moduleId: 103, skill: 'WRITING', status: 'SUBMITTED' }
  ];
  assert.strictEqual(isModuleAccessible(3, assignmentModules, subModulesStep3), true);
});

test('getNextIncompleteModule advances through 4 modules in order', () => {
  const assignmentModules: ExamModuleItem[] = [
    { id: 101, skill: 'LISTENING', orderIndex: 1 },
    { id: 102, skill: 'READING', orderIndex: 2 },
    { id: 103, skill: 'WRITING', orderIndex: 3 },
    { id: 104, skill: 'SPEAKING', orderIndex: 4 }
  ];

  // Step 0: none completed -> next is 101 (Listening)
  assert.strictEqual(getNextIncompleteModule(assignmentModules, [])?.id, 101);

  // Step 1: Listening done -> next is 102 (Reading)
  const sub1: SubmissionModuleItem[] = [
    { id: 1, moduleId: 101, skill: 'LISTENING', status: 'SUBMITTED' }
  ];
  assert.strictEqual(getNextIncompleteModule(assignmentModules, sub1)?.id, 102);

  // Step 2: Reading done -> next is 103 (Writing)
  const sub2: SubmissionModuleItem[] = [
    ...sub1,
    { id: 2, moduleId: 102, skill: 'READING', status: 'SUBMITTED' }
  ];
  assert.strictEqual(getNextIncompleteModule(assignmentModules, sub2)?.id, 103);

  // Step 3: Writing done -> next is 104 (Speaking)
  const sub3: SubmissionModuleItem[] = [
    ...sub2,
    { id: 3, moduleId: 103, skill: 'WRITING', status: 'SUBMITTED' }
  ];
  assert.strictEqual(getNextIncompleteModule(assignmentModules, sub3)?.id, 104);

  // Step 4: All done -> null
  const sub4: SubmissionModuleItem[] = [
    ...sub3,
    { id: 4, moduleId: 104, skill: 'SPEAKING', status: 'SUBMITTED' }
  ];
  assert.strictEqual(getNextIncompleteModule(assignmentModules, sub4), null);
  assert.strictEqual(isAllModulesCompleted(assignmentModules, sub4), true);
});

test('resolveEffectiveModules recovers full module list from submissionModules when assignmentModules falls back to 1 item', () => {
  const fallbackAssignmentModules: ExamModuleItem[] = [{ id: 1, skill: 'LISTENING' }];
  const submissionModules: SubmissionModuleItem[] = [
    { id: 11, moduleId: 101, skill: 'LISTENING', status: 'SUBMITTED' },
    { id: 12, moduleId: 102, skill: 'READING', status: 'IN_PROGRESS' },
    { id: 13, moduleId: 103, skill: 'WRITING', status: 'IN_PROGRESS' },
    { id: 14, moduleId: 104, skill: 'SPEAKING', status: 'IN_PROGRESS' }
  ];

  const effective = resolveEffectiveModules(fallbackAssignmentModules, submissionModules);
  assert.strictEqual(effective.length, 4);
  assert.strictEqual(effective[0].skill, 'LISTENING');
  assert.strictEqual(effective[1].skill, 'READING');
  assert.strictEqual(effective[2].skill, 'WRITING');
  assert.strictEqual(effective[3].skill, 'SPEAKING');

  // After completing Listening, getNextIncompleteModule even with fallbackAssignmentModules finds READING!
  const nextMod = getNextIncompleteModule(fallbackAssignmentModules, submissionModules);
  assert.strictEqual(nextMod?.skill, 'READING');
});

test('calculateExamSteps accurately computes statuses for all 4 steps', () => {
  const assignmentModules: ExamModuleItem[] = [
    { id: 101, skill: 'LISTENING', orderIndex: 1 },
    { id: 102, skill: 'READING', orderIndex: 2 },
    { id: 103, skill: 'WRITING', orderIndex: 3 },
    { id: 104, skill: 'SPEAKING', orderIndex: 4 }
  ];

  const subModules: SubmissionModuleItem[] = [
    { id: 1, moduleId: 101, skill: 'LISTENING', status: 'SUBMITTED' }
  ];

  // Currently viewing Reading (Module 2)
  const steps = calculateExamSteps(assignmentModules, subModules, 'reading', 50, 999);

  assert.strictEqual(steps.length, 4);
  assert.strictEqual(steps[0].status, 'COMPLETED');
  assert.strictEqual(steps[0].isCompleted, true);
  assert.strictEqual(steps[0].isAccessible, true);

  assert.strictEqual(steps[1].status, 'ACTIVE');
  assert.strictEqual(steps[1].isCompleted, false);
  assert.strictEqual(steps[1].isAccessible, true);

  assert.strictEqual(steps[2].status, 'LOCKED');
  assert.strictEqual(steps[2].isCompleted, false);
  assert.strictEqual(steps[2].isAccessible, false);

  assert.strictEqual(steps[3].status, 'LOCKED');
  assert.strictEqual(steps[3].isCompleted, false);
  assert.strictEqual(steps[3].isAccessible, false);
});

test('calculateExamSteps: when all 4 modules are submitted and no active attempt, all show COMPLETED and none show ACTIVE', () => {
  const assignmentModules: ExamModuleItem[] = [
    { id: 101, skill: 'LISTENING', orderIndex: 1 },
    { id: 102, skill: 'READING', orderIndex: 2 },
    { id: 103, skill: 'WRITING', orderIndex: 3 },
    { id: 104, skill: 'SPEAKING', orderIndex: 4 }
  ];

  const completedSubModules: SubmissionModuleItem[] = [
    { id: 1, moduleId: 101, skill: 'LISTENING', status: 'SUBMITTED' },
    { id: 2, moduleId: 102, skill: 'READING', status: 'SUBMITTED' },
    { id: 3, moduleId: 103, skill: 'WRITING', status: 'SUBMITTED' },
    { id: 4, moduleId: 104, skill: 'SPEAKING', status: 'SUBMITTED' }
  ];

  // Overview screen after final submission (no currentSkill, hasActiveAttempt = false)
  const steps = calculateExamSteps(assignmentModules, completedSubModules, undefined, 50, 999, false);

  assert.strictEqual(steps.length, 4);
  assert.strictEqual(steps.every((s) => s.status === 'COMPLETED'), true);
  assert.strictEqual(steps.some((s) => s.status === 'ACTIVE'), false);
  assert.strictEqual(steps[0].status, 'COMPLETED');
  assert.strictEqual(steps[0].isCompleted, true);
});

test('calculateExamSteps: when no attempt has been started yet (hasActiveAttempt = false), step 0 is AVAILABLE, not ACTIVE', () => {
  const assignmentModules: ExamModuleItem[] = [
    { id: 101, skill: 'LISTENING', orderIndex: 1 },
    { id: 102, skill: 'READING', orderIndex: 2 },
    { id: 103, skill: 'WRITING', orderIndex: 3 },
    { id: 104, skill: 'SPEAKING', orderIndex: 4 }
  ];

  const steps = calculateExamSteps(assignmentModules, undefined, undefined, 50, undefined, false);

  assert.strictEqual(steps.length, 4);
  assert.strictEqual(steps[0].status, 'AVAILABLE');
  assert.strictEqual(steps[0].isCompleted, false);
  assert.strictEqual(steps[0].isAccessible, true);

  assert.strictEqual(steps[1].status, 'LOCKED');
  assert.strictEqual(steps[2].status, 'LOCKED');
  assert.strictEqual(steps[3].status, 'LOCKED');
  assert.strictEqual(steps.some((s) => s.status === 'ACTIVE'), false);
});

test('getStudentAssignmentActionRoute routes pending, ai_processing, and graded to submission result page', () => {
  // Pending (Chờ chấm) with submissionId -> /student/submissions/:submissionId
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'pending',
      submissionId: 501
    }),
    '/student/submissions/501'
  );

  // Pending without submissionId -> fallback result route
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'pending'
    }),
    '/student/assignments/12/result'
  );

  // AI Processing -> /student/submissions/:submissionId
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'ai_processing',
      submissionId: 502
    }),
    '/student/submissions/502'
  );

  // Graded -> /student/submissions/:submissionId
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'graded',
      submissionId: 503
    }),
    '/student/submissions/503'
  );

  // In Progress with activeSkill -> skill exam route with submissionId
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'in_progress',
      submissionId: 504,
      activeSkill: 'reading'
    }),
    '/student/assignments/reading/12?submissionId=504'
  );

  // In Progress when all modules are done (activeSkill = null) -> overview page
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'in_progress',
      submissionId: 504,
      activeSkill: null
    }),
    '/student/assignments/12/overview'
  );

  // Not started -> overview page
  assert.strictEqual(
    getStudentAssignmentActionRoute({
      id: 12,
      status: 'not_started'
    }),
    '/student/assignments/12/overview'
  );
});

test('getExamPageRedirectRoute redirects completed submissions, completed modules, and locked modules away from exam pages', () => {
  const singleModule: ExamModuleItem[] = [{ id: 10, skill: 'SPEAKING', orderIndex: 1 }];
  const multiModules: ExamModuleItem[] = [
    { id: 10, skill: 'LISTENING', orderIndex: 1 },
    { id: 20, skill: 'READING', orderIndex: 2 },
    { id: 30, skill: 'WRITING', orderIndex: 3 },
    { id: 40, skill: 'SPEAKING', orderIndex: 4 }
  ];

  // 1. Parent submission is SUBMITTED -> redirect to /student/submissions/:id
  assert.strictEqual(
    getExamPageRedirectRoute(
      { id: 777, status: 'SUBMITTED', modules: [{ id: 1, moduleId: 10, skill: 'SPEAKING', status: 'SUBMITTED' }] },
      'SPEAKING',
      42,
      singleModule
    ),
    '/student/submissions/777'
  );

  // 2. Parent submission is GRADED -> redirect to /student/submissions/:id
  assert.strictEqual(
    getExamPageRedirectRoute(
      { id: 778, status: 'GRADED', modules: [{ id: 1, moduleId: 10, skill: 'SPEAKING', status: 'GRADED' }] },
      'SPEAKING',
      42,
      singleModule
    ),
    '/student/submissions/778'
  );

  // 3. Parent is IN_PROGRESS, Listening is SUBMITTED -> visiting Listening redirects to Reading
  assert.strictEqual(
    getExamPageRedirectRoute(
      {
        id: 779,
        status: 'IN_PROGRESS',
        modules: [
          { id: 1, moduleId: 10, skill: 'LISTENING', status: 'SUBMITTED' },
          { id: 2, moduleId: 20, skill: 'READING', status: 'IN_PROGRESS' },
          { id: 3, moduleId: 30, skill: 'WRITING', status: 'IN_PROGRESS' },
          { id: 4, moduleId: 40, skill: 'SPEAKING', status: 'IN_PROGRESS' }
        ]
      },
      'LISTENING',
      42,
      multiModules
    ),
    '/student/assignments/reading/42?submissionId=779'
  );

  // 4. Parent is IN_PROGRESS, Listening is IN_PROGRESS -> jumping ahead to Writing (LOCKED) redirects back to Listening
  assert.strictEqual(
    getExamPageRedirectRoute(
      {
        id: 779,
        status: 'IN_PROGRESS',
        modules: [
          { id: 1, moduleId: 10, skill: 'LISTENING', status: 'IN_PROGRESS' },
          { id: 2, moduleId: 20, skill: 'READING', status: 'IN_PROGRESS' },
          { id: 3, moduleId: 30, skill: 'WRITING', status: 'IN_PROGRESS' },
          { id: 4, moduleId: 40, skill: 'SPEAKING', status: 'IN_PROGRESS' }
        ]
      },
      'WRITING',
      42,
      multiModules
    ),
    '/student/assignments/listening/42?submissionId=779'
  );

  // 5. Parent is IN_PROGRESS, current module is SUBMITTED in a single-module exam -> redirect to result page
  assert.strictEqual(
    getExamPageRedirectRoute(
      {
        id: 780,
        status: 'IN_PROGRESS',
        modules: [{ id: 1, moduleId: 10, skill: 'SPEAKING', status: 'SUBMITTED' }]
      },
      'SPEAKING',
      42,
      singleModule
    ),
    '/student/submissions/780'
  );

  // 6. Parent is IN_PROGRESS and current module is IN_PROGRESS and unlocked -> returns null (allowed to take exam)
  assert.strictEqual(
    getExamPageRedirectRoute(
      {
        id: 781,
        status: 'IN_PROGRESS',
        modules: [{ id: 1, moduleId: 10, skill: 'SPEAKING', status: 'IN_PROGRESS' }]
      },
      'SPEAKING',
      42,
      singleModule
    ),
    null
  );
});
