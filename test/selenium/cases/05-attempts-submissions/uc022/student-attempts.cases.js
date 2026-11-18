import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_019:student(async(ctx,ui,{item})=>{for(let i=1;i<=2;i++)await ctx.step(`Làm và nộp lượt ${i}/2`,async()=>{await start(ctx,ui,item);await answer(ctx,ui,item);await submit(ctx,ui,item);await verifySubmitted(ctx,item,i);});await ctx.step('Hết lượt: không cho làm lại; nút Xem kết quả vẫn được dùng',async()=>{
    await overview(ctx,ui,item);const cta=await ui.visible('.overview-cta-btn');const label=await cta.getText();const enabled=await cta.isEnabled();
    if(enabled){assert.match(label,/Xem kết quả|View.*result/i);await cta.click();await ctx.driver.wait(async()=>new URL(await ctx.driver.getCurrentUrl()).pathname.startsWith('/student/submissions/'),10000);}
    const denied=await ctx.pool.request('student','POST',`/assignments/${item.id}/submissions`,undefined,{allowError:true});const history=await attempts(ctx,item);
    await ctx.evidence('exhausted-attempts',{label,enabled,denied,history});assert.ok([400,403,409,422].includes(denied.status));assert.equal(history.length,2);
    await overview(ctx,ui,item);await ui.has(/hết.*lượt|hết số lần|đạt.*giới hạn|No attempts|limit reached/i);
  });},'READING',{maxSubmissions:2}),
DO_020:student(async(ctx,ui,{item})=>{await ctx.step('Đã có bài nộp; giáo viên khóa bài; học viên không làm lại được',async()=>{await ctx.pool.submitted(item);await ctx.pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'CLOSED'});await overview(ctx,ui,item);assert.doesNotMatch(await(await ui.visible('.overview-cta-btn')).getText(),/Bắt đầu|Làm lại|Tiếp tục|Start|Retry|Continue/i);await ui.has(/đã.*(khóa|đóng)|closed|not open/i);const denied=await ctx.pool.request('student','POST',`/assignments/${item.id}/submissions`,undefined,{allowError:true});assert.ok([400,403,409,422].includes(denied.status));});},'READING'),
DO_021:student(async(ctx,ui,{item})=>{await ctx.step('Xem lịch sử hai lần nộp; mỗi lần khớp API và còn đúng số lượt',async()=>{await ctx.pool.submitted(item);await ctx.pool.submitted(item);await overview(ctx,ui,item);const rows=await ctx.driver.findElements(By.css('.overview-table tbody tr'));assert.equal(rows.length,2);const list=await attempts(ctx,item);assert.equal(list.length,2);for(const row of rows)assert.match(await row.getText(),/\d{1,2}[:/]\d{2}/);await ui.has(/hết số lần|0 lượt|no attempts|0 remaining/i,'.overview-cta-box');await ctx.evidence('attempt-history',list);});},'READING')
};