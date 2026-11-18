import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_009:student(async(ctx,ui,{item})=>{await ctx.step('Trả lời đủ câu Đọc, dùng thao tác ghi nhận hiện có và đọc lại đúng đáp án',async()=>{const attempt=await start(ctx,ui,item);await answer(ctx,ui,item);await saveQuizAnswers(ctx,ui,item,attempt);});},'READING'),
DO_010:student(async(ctx,ui,{item})=>{await ctx.step('Bỏ trống ba trong bốn câu; cảnh báo phải nêu đúng 3 câu',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item);await ui.button(/^Hoàn thành & Nộp/i);await ui.has(/3\s*(câu|questions)|(?:còn trống|unanswered).*3/i,'[role=dialog],main');const list=await attempts(ctx,item);assert.equal(list.filter(a=>a.status!=='IN_PROGRESS').length,0);});},'READING',{questions:4})
};