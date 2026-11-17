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
RES_005:scenario('teacher',async(ctx,ui)=>{await ctx.step('Nhập đánh giá năng lực đúng học viên và kiểm tra API lưu',async()=>{await classProgress(ctx,ui);await ui.rowAction(ctx.pool.users.student.fullName,/báo cáo|report|chi tiết|details/i);await ui.fill('.tcd-drawer-box textarea','SRS evaluation: improve vocabulary with daily reading.');await ui.button(/^(Lưu nhận xét|Lưu đánh giá|Save Evaluation|Save)$/i,'.tcd-drawer-box');await ui.has(/Đã lưu nhận xét|Evaluation saved/i);let response;await ctx.driver.wait(async()=>{response=await ctx.pool.get('teacher',`/students/${ctx.pool.users.student.id}/evaluations?classId=${ctx.pool.class.id}&limit=100`);return JSON.stringify(response).includes('SRS evaluation')},10000);await ctx.evidence('saved-evaluation',response);assert.match(JSON.stringify(response),/SRS evaluation/);for(const e of response.data??[]){if(String(e.content).includes('SRS evaluation')){ctx.pool.resources.push({type:'evaluation',id:e.id,studentId:ctx.pool.users.student.id,state:'CREATED'});await ctx.pool.journal();}}});}),
RES_006:scenario('teacher',async(ctx,ui)=>{await ctx.step('Học viên chưa nộp bài phải có cảnh báo dữ liệu hạn chế',async()=>{const user=await ctx.pool.createUser('STUDENT','NoData');await ctx.pool.member(ctx.pool.class.id,user.id);await classProgress(ctx,ui);await ui.rowAction(user.fullName,/báo cáo|report|chi tiết|details/i);await ui.has(/chưa.*dữ liệu|dữ liệu.*hạn chế|limited data|insufficient|not enough/i,'.tcd-drawer-box');});})
};