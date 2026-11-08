import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  createDefaultModuleItem,
  type WritingConfig,
  type ReadingConfig,
  type ListeningConfig,
  type SpeakingConfig
} from '../../types/assignment-editor.types';
import { 
  getSkillRoute,
  calculateExamSteps,
  isModuleAccessible,
  isAllModulesCompleted,
  type ExamModuleItem,
  type SubmissionModuleItem
} from '../../utils/examStepper.utils';

describe('FE-78 Multi-Module Assignment Creation & Execution', () => {
  it('createDefaultModuleItem generates distinct modules with appropriate default configs', () => {
    const modWriting = createDefaultModuleItem('writing', 1, 'Task 1: Chart');
    const modReading = createDefaultModuleItem('reading', 2, 'Passage 1');
    const modListening = createDefaultModuleItem('listening', 3, 'Section 1');
    const modSpeaking = createDefaultModuleItem('speaking', 4, 'Part 2 Cue Card');

    assert.equal(modWriting.skill, 'writing');
    assert.equal(modWriting.orderIndex, 1);
    assert.equal(modWriting.title, 'Task 1: Chart');
    assert.equal((modWriting.config as WritingConfig).taskType, 'task2');
    assert.equal(modWriting.maxScore, 10);

    assert.equal(modReading.skill, 'reading');
    assert.equal(modReading.orderIndex, 2);
    assert.ok(Array.isArray((modReading.config as ReadingConfig).questions));

    assert.equal(modListening.skill, 'listening');
    assert.equal(modListening.orderIndex, 3);
    assert.equal((modListening.config as ListeningConfig).playbackLimit, 'double');

    assert.equal(modSpeaking.skill, 'speaking');
    assert.equal(modSpeaking.orderIndex, 4);
    assert.equal((modSpeaking.config as SpeakingConfig).partType, 'part2');

    // IDs should be unique
    assert.notEqual(modWriting.id, modReading.id);
  });

  it('getSkillRoute properly incorporates moduleId and submissionId', () => {
    const routeNoMod = getSkillRoute('writing', 10, 5);
    assert.equal(routeNoMod, '/student/assignments/writing/10?submissionId=5');

    const routeWithMod = getSkillRoute('reading', 10, 5, 42);
    assert.equal(routeWithMod, '/student/assignments/reading/10?submissionId=5&moduleId=42');

    const routeOnlyMod = getSkillRoute('speaking', 10, undefined, 88);
    assert.equal(routeOnlyMod, '/student/assignments/speaking/10?moduleId=88');
  });

  it('calculateExamSteps accurately numbers and disambiguates multi-modules of the same skill', () => {
    const modules: ExamModuleItem[] = [
      { id: 101, skill: 'READING', orderIndex: 1 },
      { id: 102, skill: 'READING', orderIndex: 2 },
      { id: 103, skill: 'WRITING', orderIndex: 3 },
      { id: 104, skill: 'WRITING', orderIndex: 4 },
    ];

    const submissionModules: SubmissionModuleItem[] = [
      { id: 1, moduleId: 101, skill: 'READING', status: 'SUBMITTED' },
      { id: 2, moduleId: 102, skill: 'READING', status: 'IN_PROGRESS' },
      { id: 3, moduleId: 103, skill: 'WRITING', status: 'IN_PROGRESS' },
      { id: 4, moduleId: 104, skill: 'WRITING', status: 'IN_PROGRESS' },
    ];

    const steps = calculateExamSteps(modules, submissionModules, 'READING', 10, 5, true);
    assert.equal(steps.length, 4);

    // Step 1: Reading 1 -> COMPLETED
    assert.equal(steps[0].module.id, 101);
    assert.equal(steps[0].skillName, 'Đọc (Reading) (Phần 1)');
    assert.equal(steps[0].status, 'COMPLETED');
    assert.equal(steps[0].route, '/student/assignments/reading/10?submissionId=5&moduleId=101');

    // Step 2: Reading 2 -> ACTIVE (since currentSkill is READING and Reading 2 is not completed)
    assert.equal(steps[1].module.id, 102);
    assert.equal(steps[1].skillName, 'Đọc (Reading) (Phần 2)');
    assert.equal(steps[1].status, 'ACTIVE');
    assert.equal(steps[1].route, '/student/assignments/reading/10?submissionId=5&moduleId=102');

    // Step 3: Writing 1 -> locked or available
    assert.equal(steps[2].module.id, 103);
    assert.equal(steps[2].skillName, 'Viết (Writing) (Phần 1)');
    assert.equal(steps[2].route, '/student/assignments/writing/10?submissionId=5&moduleId=103');

    // Step 4: Writing 2
    assert.equal(steps[3].module.id, 104);
    assert.equal(steps[3].skillName, 'Viết (Writing) (Phần 2)');
    assert.equal(steps[3].route, '/student/assignments/writing/10?submissionId=5&moduleId=104');
  });

  it('isModuleAccessible locks future modules until all prior modules in sequence are completed', () => {
    const modules: ExamModuleItem[] = [
      { id: 101, skill: 'READING', orderIndex: 1 },
      { id: 102, skill: 'READING', orderIndex: 2 },
      { id: 103, skill: 'WRITING', orderIndex: 3 },
    ];

    // Module 1 is SUBMITTED, Module 2 is IN_PROGRESS
    const subModules: SubmissionModuleItem[] = [
      { id: 1, moduleId: 101, skill: 'READING', status: 'SUBMITTED' },
      { id: 2, moduleId: 102, skill: 'READING', status: 'IN_PROGRESS' },
      { id: 3, moduleId: 103, skill: 'WRITING', status: 'IN_PROGRESS' },
    ];

    assert.equal(isModuleAccessible(0, modules, subModules), true); // Reading 1 is accessible
    assert.equal(isModuleAccessible(1, modules, subModules), true); // Reading 2 is accessible (Reading 1 done)
    assert.equal(isModuleAccessible(2, modules, subModules), false); // Writing is NOT accessible (Reading 2 pending)

    // Mark Module 2 as SUBMITTED
    subModules[1].status = 'SUBMITTED';
    assert.equal(isModuleAccessible(2, modules, subModules), true); // Writing is now accessible!
  });

  it('isAllModulesCompleted returns true only when every single module is completed', () => {
    const modules: ExamModuleItem[] = [
      { id: 1, skill: 'WRITING' },
      { id: 2, skill: 'WRITING' },
    ];

    const subModules: SubmissionModuleItem[] = [
      { id: 11, moduleId: 1, skill: 'WRITING', status: 'SUBMITTED' },
      { id: 12, moduleId: 2, skill: 'WRITING', status: 'IN_PROGRESS' },
    ];

    assert.equal(isAllModulesCompleted(modules, subModules), false);

    subModules[1].status = 'GRADED';
    assert.equal(isAllModulesCompleted(modules, subModules), true);
  });
});
