import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_011:student(async(ctx,ui,{item})=>{let attempt;await ctx.step('Phát audio thật, xác nhận thời gian phát tiến lên',async()=>{attempt=await start(ctx,ui,item);await ui.button(/^(Phát âm thanh|Phát|Play|Phát audio|Play Audio)$/i);await ctx.driver.wait(()=>ctx.driver.executeScript('return Array.from(document.querySelectorAll("audio")).some(a=>a.currentTime>0&&!a.error)'),10000);});await ctx.step('Nhập và ghi nhận đáp án Nghe, đọc lại đúng bài nộp/module',async()=>{await answer(ctx,ui,item);await saveQuizAnswers(ctx,ui,item,attempt);});},'LISTENING'),
DO_012:student(async ctx=>{await ctx.step('Kiểm tra phạm vi giới hạn lượt nghe',()=>{throw new Blocked('Excel ghi nếu bật giới hạn; UC019 không quy định max lượt nghe và API cấu hình module hiện không có giới hạn. Cần quy tắc/cấu hình được phê duyệt.');});},'LISTENING')
};