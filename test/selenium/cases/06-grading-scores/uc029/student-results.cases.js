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
SCR_001:scenario('student',async(ctx,ui)=>{await ctx.step('Mở điểm cá nhân và đối chiếu chủ sở hữu từng bài nộp',async()=>{await ui.nav('/student/grades');const response=await ctx.pool.get('student','/submissions?limit=100');await ctx.evidence('my-submissions',response);for(const row of response.data)assert.equal(row.studentId,ctx.pool.users.student.id);assert.doesNotMatch(await ui.text(),new RegExp(ctx.pool.users.other.fullName));});}),
SCR_003:scenario('student',async(ctx,ui,data)=>{await ctx.step('Bài chưa chấm phải hiện trạng thái Đang chấm, không dùng điểm 0',async()=>{await ui.nav('/student/grades');await ui.has(new RegExp(data.item.title));const row=await ui.row(data.item.title);assert.match(await row.getText(),/Đang chấm|Chờ chấm|Grading|Pending/i);assert.equal((await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)).finalScore,null);});},ctx=>gradingFixture(ctx))
};