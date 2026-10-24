import test from 'node:test';
import assert from 'node:assert/strict';
import type { AssignmentSkill } from '../services/assignment.service';
import { matchesSkillFilter, toSkillBadgeTypes } from '../../utils/assignmentSkills';

test('assignment skills preserve every badge in API order and match each selected skill', () => {
  const skills: AssignmentSkill[] = ['SPEAKING', 'READING', 'WRITING', 'LISTENING'];
  const originalSkills = [...skills];

  assert.deepStrictEqual(toSkillBadgeTypes(skills), ['speaking', 'reading', 'writing', 'listening']);
  assert.strictEqual(matchesSkillFilter(skills, 'all'), true);
  assert.strictEqual(matchesSkillFilter(skills, 'speaking'), true);
  assert.strictEqual(matchesSkillFilter(skills, 'reading'), true);
  assert.strictEqual(matchesSkillFilter(skills, 'writing'), true);
  assert.strictEqual(matchesSkillFilter(skills, 'listening'), true);
  assert.strictEqual(matchesSkillFilter(['READING'], 'writing'), false);
  assert.strictEqual(matchesSkillFilter(['WRITING'], 'reading'), false);
  assert.deepStrictEqual(toSkillBadgeTypes([]), []);
  assert.strictEqual(matchesSkillFilter([], 'all'), true);
  assert.strictEqual(matchesSkillFilter([], 'writing'), false);
  assert.strictEqual(matchesSkillFilter([], 'speaking'), false);
  assert.strictEqual(matchesSkillFilter([], 'reading'), false);
  assert.strictEqual(matchesSkillFilter([], 'listening'), false);
  assert.deepStrictEqual(skills, originalSkills);
});
