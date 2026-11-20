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
GRD_013:scenario('student',async(ctx,ui,{items})=>{for(const [i,item] of items.entries())await ctx.step(`Nộp bộ đáp án ${i+1}: kỳ vọng ${[0,5,10][i]}/10; giáo viên xem lại`,async()=>{await start(ctx,ui,item);for(let q=0;q<2;q++){await answer(ctx,ui,item,q<i?'apple':'wrong');if(q===0)await ui.button(/^Câu sau$/i);}await submit(ctx,ui,item);const detail=await verifySubmitted(ctx,item);let grading;await ctx.driver.wait(async()=>{grading=await ctx.pool.get('teacher',`/submission-modules/${detail.modules[0].id}/grading`);return grading.finalScore!==null;},30000);assert.equal(Number(grading.finalScore),[0,5,10][i]);await ctx.evidence(`reading-score-${i}`,grading);});},async ctx=>{const items=[];for(let i=0;i<3;i++)items.push(await ctx.pool.assignment('READING',{questions:2}));return{items};}),
GRD_015:scenario('student',async(ctx,ui,{item})=>{await ctx.step('Nộp câu hỏi chưa có đáp án chuẩn; không crash, phải chờ chấm',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item);await submit(ctx,ui,item);const detail=await verifySubmitted(ctx,item);const grading=await ctx.pool.get('teacher',`/submission-modules/${detail.modules[0].id}/grading`);await ctx.evidence('missing-key-grading',grading);assert.equal(grading.status,'PENDING');assert.equal(grading.finalScore,null);});},async ctx=>{const item=await ctx.pool.assignment('READING',{status:'DRAFT'});await ctx.pool.request('teacher','PUT',`/questions/${item.questions[0].id}`,{content:'Question without answer key',questionType:'SHORT_ANSWER',score:10,orderIndex:1,correctAnswer:{}});await ctx.pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'PUBLISHED'});return{item};})
};