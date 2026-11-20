import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_022:student(async(ctx,ui,{item})=>{await ctx.step('Nộp bài rồi mở lại qua lịch sử; phải hiển thị đúng câu trả lời',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item);await submit(ctx,ui,item);const detail=await verifySubmitted(ctx,item);await overview(ctx,ui,item);const history=await ctx.driver.findElements(By.css('.overview-table tbody tr'));assert.equal(history.length,1);await(await history[0].findElement(By.css('button'))).click();await ui.path(`/student/submissions/${detail.id}`);await ui.has(/apple/);await ui.has(/Đã chấm|Chờ chấm|Graded|Pending/i);});},'READING')
};