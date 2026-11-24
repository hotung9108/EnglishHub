import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { scenario, UI } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { businessDateTime } from "../../../common/time.js";

import {writeFile} from 'node:fs/promises';

import {join} from 'node:path';

import {fileURLToPath} from 'node:url';

import { prompt, reserve, form, created, openAssignment, publishDraft, teacher, fixture, creation, withCoverage, requiredTitle, attemptLimit } from "../../../common/flows/support/teacher/assignments.js";

export const cases = {
ASG_017:teacher(async(ctx,ui,{item})=>{await ctx.step('Mở bài Nháp bằng UI; phải có hộp xác nhận',async()=>{await publishDraft(ctx,ui,item);await ui.confirm();await ctx.driver.wait(async()=>(await ctx.pool.get('teacher',`/assignments/${item.id}`)).status==='PUBLISHED',10000);});await ctx.step('Học viên phải thấy bài đã mở',async()=>{await ctx.driver.executeScript('localStorage.clear();sessionStorage.clear()');await ui.login('student');await ui.nav('/student/assignments');await ui.fill('main input[type=text]',item.title);await ui.has(new RegExp(item.title));});},fixture({status:'DRAFT'})),
ASG_018:teacher(async(ctx,ui,{item})=>{await ctx.step('Mở bài Nháp có hạn quá khứ; phải yêu cầu cập nhật hạn',async()=>{await publishDraft(ctx,ui,item);await ui.error(/hạn|deadline|past|quá hạn/i);assert.equal((await ctx.pool.get('teacher',`/assignments/${item.id}`)).status,'DRAFT');});},fixture({status:'DRAFT',closeAt:new Date(Date.now()-3600000).toISOString()})),
ASG_021:teacher(async(ctx,ui,{item})=>{await ctx.step('Mở lại bài đã khóa qua UI; phải cho học viên tiếp tục',async()=>{await openAssignment(ctx,ui,item);await ui.button(/^(Mở lại bài tập|Mở bài tập|Reopen Assignment|Open Assignment)$/i);await ui.confirm();await ctx.driver.wait(async()=>(await ctx.pool.get('teacher',`/assignments/${item.id}`)).status==='PUBLISHED',10000);});},async ctx=>{const item=await ctx.pool.assignment();await ctx.pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'CLOSED'});return{item};})
};