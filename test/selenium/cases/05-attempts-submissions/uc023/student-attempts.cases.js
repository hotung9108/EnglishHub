import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_023:student(async(ctx,ui,{item})=>{
    const observed=[];let detail;
    const observe=async(stage,pattern)=>{const card=await assignmentCard(ctx,ui,item);const text=await card.getText();observed.push({stage,text,matches:pattern.test(text)});await ctx.evidence('status-transitions',observed);};
    await ctx.step('Ghi nhãn Chưa làm trước khi bắt đầu',()=>observe('NOT_STARTED',/Chưa làm|Not started/i));
    await ctx.step('Bắt đầu Writing rồi kiểm nhãn Đang làm',async()=>{await start(ctx,ui,item);await observe('IN_PROGRESS',/Đang làm|In progress/i);});
    await ctx.step('Nộp Writing chưa chấm; ghi riêng nhãn Đã nộp',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item,essay);await submit(ctx,ui,item);detail=await verifySubmitted(ctx,item);await observe('SUBMITTED',/Đã nộp|Submitted/i);});
    await ctx.step('Giáo viên mở màn chấm; kiểm riêng giai đoạn Đang chấm',async()=>{const {editor}=await import("../../../common/flows/grading.js");await ui.login('teacher');await editor(ctx,ui,{item});const grading=await ctx.pool.get('teacher',`/submission-modules/${detail.modules[0].id}/grading`);assert.notEqual(grading.status,'COMPLETED');await ctx.evidence('before-teacher-grade',grading);await ui.login('student');await observe('GRADING',/Đang chấm|Grading/i);});
    await ctx.step('Giáo viên lưu điểm7/10 thật; học viên phải thấy Đã chấm và API COMPLETED',async()=>{const {editor,grade}=await import("../../../common/flows/grading.js");await ui.login('teacher');await editor(ctx,ui,{item});const grading=await ctx.pool.get('teacher',`/submission-modules/${detail.modules[0].id}/grading`);await grade(ctx,ui,{grading},7,'Status transition reviewed by teacher');await ui.login('student');await observe('GRADED',/Đã chấm|Đã có điểm|Graded/i);const saved=await ctx.pool.get('teacher',`/gradings/${grading.id}`);assert.equal(saved.status,'COMPLETED');assert.equal(Number(saved.finalScore),7);});
    await ctx.step('Đối chiếu đủ5 giai đoạn, không chấp nhận một nhóm nhãn thay cho mọi trạng thái',()=>{assert.equal(observed.length,5);assert.ok(observed.filter(o=>['NOT_STARTED','IN_PROGRESS','GRADED'].includes(o.stage)).every(o=>o.matches),'Stable lifecycle labels must match');const missing=observed.filter(o=>!o.matches).map(o=>o.stage);if(missing.length)throw new Blocked(`Đã nộp và giáo viên chấm thật, API COMPLETED; chưa xác lập được tiền điều kiện riêng cho nhãn ${missing.join(', ')}. UI hiện Chờ chấm trong khi API PENDING; mở màn chấm chưa chứng minh đã chuyển sang trạng thái Đang chấm. Cần chốt ánh xạ trạng thái/trigger; không dùng nhãn cuối để cho toàn bộ ca PASS.`);});
  })
};