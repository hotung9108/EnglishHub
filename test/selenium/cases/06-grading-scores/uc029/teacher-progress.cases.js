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
SCR_002:scenario('teacher',async(ctx,ui)=>{await ctx.step('Mở sổ điểm lớp; lọc bài và ngày, đối chiếu API',async()=>{await classProgress(ctx,ui);await ui.button(/^Sổ điểm & Học viên|^Gradebook & Students|^(Bảng điểm|Sổ điểm|Gradebook|Grades)$/i);await ui.select('main select:has(option[value="'+ctx.pool.class.id+'"])',ctx.pool.class.id);const dates=await ctx.driver.findElements(By.css('main input[type=date]'));assert.equal(dates.length,2,'Gradebook must expose date filter');await ui.date(dates[0],'2026-11-01');await ui.date(dates[1],'2026-11-30');await ui.has(new RegExp(ctx.pool.users.student.fullName));});})
};