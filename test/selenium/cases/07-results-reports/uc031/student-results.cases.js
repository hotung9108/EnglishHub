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
RES_001:scenario('student',async(ctx,ui,data)=>{await ctx.step('Kết quả học tập có biểu đồ và số liệu khớp sổ điểm',async()=>{await ui.open('/student/analytics');assert.doesNotMatch(await ui.text(),/không có quyền|forbidden|unauthorized/i,'Student must be allowed to view own learning results');await ui.has(/Reading|Đọc/);const response=await ctx.pool.get('teacher',`/reports/students/${ctx.pool.users.student.id}/progress?classId=${ctx.pool.class.id}`);await ctx.evidence('student-progress',response);assert.ok(response.skillAverages.length);for(const entry of response.skillAverages){assert.ok(Number.isFinite(entry.averageScorePercent));assert.match(await ui.text(),new RegExp(String(Number((entry.averageScorePercent/10).toFixed(1)))));}await ui.visible('main svg');});},async ctx=>{const data=await gradingFixture(ctx,'READING');return data;}),
RES_002:scenario('empty',async(ctx,ui)=>{await ctx.step('Học viên mới chưa có điểm; phải báo chưa đủ dữ liệu',async()=>{await ui.open('/student/analytics');await ui.has(/chưa.*dữ liệu|chưa.*kết quả|no data|not enough|no results/i);});})
};