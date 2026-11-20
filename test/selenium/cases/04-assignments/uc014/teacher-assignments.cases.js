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
ASG_019:teacher(async(ctx,ui,{item})=>{await ctx.step('Khóa bài qua UI và kiểm tra trạng thái CLOSED',async()=>{await openAssignment(ctx,ui,item);await ui.button(/^(Đóng bài tập|Close Assignment)$/i);await ui.confirm();await ctx.driver.wait(async()=>(await ctx.pool.get('teacher',`/assignments/${item.id}`)).status==='CLOSED',10000);});await ctx.step('Học viên không được bắt đầu/nộp mới',async()=>{await ctx.driver.executeScript('localStorage.clear();sessionStorage.clear()');await ui.login('student');await ui.open(`/student/assignments/${item.id}/overview`);const cta=await ui.visible('.overview-cta-btn');assert.equal(await cta.isEnabled(),false);const api=await ctx.pool.request('student','POST',`/assignments/${item.id}/submissions`,undefined,{allowError:true});assert.ok([400,403,409,422].includes(api.status));});},fixture()),
ASG_020:teacher(async(ctx,ui,{item})=>{await ctx.step('Hủy xác nhận khóa; bài phải giữ trạng thái mở',async()=>{await openAssignment(ctx,ui,item);await ui.button(/^(Đóng bài tập|Close Assignment)$/i);await ui.confirm(false);assert.equal((await ctx.pool.get('teacher',`/assignments/${item.id}`)).status,'PUBLISHED');});},fixture())
};