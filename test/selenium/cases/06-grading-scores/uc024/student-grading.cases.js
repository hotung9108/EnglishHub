import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { readdir, readFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { openAssignment } from "../../../common/flows/support/teacher/assignments.js";

import { start, answer, submit, verifySubmitted } from "../../../common/flows/support/student/attempts.js";

import {csvRows} from "../../../common/csv-evidence.js";

import { score, feedback, save, reason, escapeRegex, aiSuggestion, annotationCard, gradingFixture, editor, grade, manual, classProgress } from "../../../common/flows/grading.js";



export const cases = {
GRD_016:scenario('outsider',async(ctx,ui,data)=>{await ctx.step('Giáo viên không phụ trách mở URL bài nộp; phải bị từ chối',async()=>{await ctx.driver.get(new URL(`/teacher/assignments/${data.item.id}/submissions/${ctx.pool.users.student.id}`,ctx.baseUrl).href);await ui.has(/không có quyền|không thể|forbidden|denied|unauthorized|not found/i);assert.equal((await ctx.driver.findElements(By.css(score))).length,0);const actual=await ctx.pool.request('outsider','PUT',`/gradings/${data.grading.id}`,{finalScore:9,finalFeedback:'Unauthorized mutation'},{allowError:true});await ctx.evidence('forbidden-grading',actual);assert.ok([403,404].includes(actual.status));assert.notEqual((await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)).finalScore,9);});},ctx=>gradingFixture(ctx))
};