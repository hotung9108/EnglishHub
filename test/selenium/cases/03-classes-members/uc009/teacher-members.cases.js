import assert from 'node:assert/strict';

import { By, Key } from 'selenium-webdriver';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { reserve, readUser } from "../../../common/flows/support/admin/accounts.js";

import { businessDate } from "../../../common/time.js";

import { openPerson, createPerson, classForm, reserveClass, classRead, openClass, members, admin, dateCase } from "../../../common/flows/management.js";



export const cases = {
MEM_005:scenario('teacher',async(ctx,ui)=>{await ctx.step('Mở thành viên lớp giáo viên khác; không được lộ danh sách',async()=>{await ctx.driver.get(new URL(`/teacher/classes/${ctx.pool.foreignClass.id}`,ctx.baseUrl).href);const denial=await ctx.pool.request('teacher','GET',`/classes/${ctx.pool.foreignClass.id}/members`,undefined,{allowError:true});await ctx.evidence('foreign-members-denial',denial);assert.ok([403,404].includes(denial.status));await ctx.driver.wait(async()=>!!(await ui.text('body')).trim(),10000,'Denied page must finish rendering');const visible=await ui.text('body');assert.ok(visible.trim());assert.ok(!visible.includes(ctx.pool.foreignClass.name));assert.ok(!visible.includes(ctx.pool.users.other.fullName));});})
};