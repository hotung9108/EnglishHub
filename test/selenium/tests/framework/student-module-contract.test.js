import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from '../../config/env.js';
import { ensureStudentAssignment } from '../../support/student/fixtures.js';
import { studentPlan } from '../../support/student/scenario-plan.js';

test('Every QA30 fixture uses a skill/taskType pair allowed by the actual backend whitelist', async () => {
  const filename = path.resolve(root, '../../backend/src/main/java/com/english_hub/core/modules/module/application/service/ModuleService.java');
  const source = await fs.readFile(filename, 'utf8');
  const supported = new Set([...source.matchAll(/skill\s*==\s*ModuleSkill\.(\w+)\s*&&\s*taskType\s*==\s*ModuleTaskType\.(\w+)/g)].map(m => `${m[1]}/${m[2]}`));
  assert.ok(supported.size >= 5, 'Cannot read the backend supported-pair whitelist');
  const data = {classId:1, assignments:{}};
  let id = 10;
  const api = {request:async (_role, method, endpoint, body) => {
    if (method === 'POST' && /\/assignments\/\d+\/modules$/.test(endpoint)) {
      assert.ok(supported.has(`${body.skill}/${body.taskType}`), `Backend rejects fixture pair ${body.skill}/${body.taskType}`);
    }
    return {id:id++};
  }};
  for (const key of studentPlan().assignments) await ensureStudentAssignment(api, data, key, async () => {});
});
