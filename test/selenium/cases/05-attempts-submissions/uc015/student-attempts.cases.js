import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_001:student(async(ctx,ui,{item})=>{await ctx.step('Mở tổng quan từ danh sách; kiểm tra tên, hạn, kỹ năng, lượt và lịch sử',async()=>{await overview(ctx,ui,item);const text=await ui.text();assert.match(text,/Writing|Viết/);assert.match(text,/Hạn|Deadline|Due/i);assert.match(text,/Số lượt|Số lần|Attempts|Submissions/i);await ui.visible('.overview-attempts-section');assert.equal((await attempts(ctx,item)).length,0,'Viewing overview must not consume an attempt');});}),
DO_002:student(async(ctx,ui,{item})=>{await ctx.step('Bài bị khóa chỉ cho xem tổng quan; CTA không được bật',async()=>{await ctx.pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'CLOSED'});await overview(ctx,ui,item);assert.equal(await (await ui.visible('.overview-cta-btn')).isEnabled(),false);assert.equal((await attempts(ctx,item)).length,0);});})
};