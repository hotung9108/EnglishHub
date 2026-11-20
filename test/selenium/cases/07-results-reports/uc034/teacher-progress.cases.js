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
RES_007:scenario('teacher',async(ctx,ui)=>{await ctx.step('Theo dõi tiến độ lớp; sĩ số và hoàn thành khớp API',async()=>{await classProgress(ctx,ui);const expected=await ctx.pool.get('teacher',`/reports/classes/${ctx.pool.class.id}/progress`);await ctx.evidence('class-progress',expected);const members=await ctx.pool.get('teacher',`/classes/${ctx.pool.class.id}/members`);assert.equal(expected.totalStudentCount,members.data.length);let rate;for(const card of await ctx.driver.findElements(By.css('.tcd-kpi-card')))if(/Tỷ lệ hoàn thành|Completion Rate/i.test(await(await card.findElement(By.css('.tcd-kpi-label'))).getText()))rate=Number((await(await card.findElement(By.css('.tcd-kpi-value'))).getText()).replace('%',''));assert.equal(rate,Math.round(expected.completionRatePercent));await ui.button(/^(Bài tập|Assignments)$/i);await ui.visible('main select');});})
};