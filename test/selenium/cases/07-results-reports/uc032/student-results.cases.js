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
RES_003:scenario('student',async(ctx,ui,data)=>{await ctx.step('Xem bài chữa đã chấm; có bài làm, đáp án và nhận xét giáo viên',async()=>{await ui.open(`/student/submissions/${data.submissionId}`);await ui.has(/apple/);await ui.has(/Good SRS feedback/);await ui.has(/đáp án|correct answer|answer key/i);});},async ctx=>{const data=await gradingFixture(ctx,'READING');await ctx.pool.request('teacher','PUT',`/gradings/${data.grading.id}`,{finalScore:8,finalFeedback:'Good SRS feedback',note:'SRS fixture reviewed score'});return data;}),
RES_004:scenario('student',async(ctx,ui,data)=>{await ctx.step('Mở bài chữa khi chưa chấm; phải chặn và giải thích',async()=>{await ui.open(`/student/submissions/${data.submissionId}`);await ui.has(/chưa.*chấm|chờ chấm|not graded|pending grading/i);assert.equal((await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)).finalScore,null);});},ctx=>gradingFixture(ctx))
};