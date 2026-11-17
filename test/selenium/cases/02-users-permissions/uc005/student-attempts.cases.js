import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
RBAC_005:scenario('student',async(ctx,ui,{item,foreign})=>{await ctx.step('Truy cập URL bài làm của học viên khác; UI/API đều phải từ chối',async()=>{await ctx.driver.get(new URL(`/student/submissions/${foreign.submissionId}`,ctx.baseUrl).href);await ui.has(/không có quyền|không tìm thấy|không thể|not found|forbidden|denied|unauthorized/i);assert.doesNotMatch(await ui.text(),/apple/);const response=await ctx.pool.request('student','GET',`/submissions/${foreign.submissionId}`,undefined,{allowError:true});await ctx.evidence('idor-response',response);assert.ok([403,404].includes(response.status));});},async ctx=>{const item=await ctx.pool.assignment('READING');return{item,foreign:await ctx.pool.submitted(item,{student:'other'})};})
};