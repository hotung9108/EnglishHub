import assert from 'node:assert/strict';

import { By, Key } from 'selenium-webdriver';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { reserve, readUser } from "../../../common/flows/support/admin/accounts.js";

import { businessDate } from "../../../common/time.js";

import { openPerson, createPerson, classForm, reserveClass, classRead, openClass, members, admin, dateCase } from "../../../common/flows/management.js";



export const cases = {
CLV_002:scenario('teacher',async(ctx,ui)=>{await ctx.step('Chỉ thấy lớp phụ trách, không thấy lớp của outsider',async()=>{await ui.nav('/teacher/classes');await ui.has(new RegExp(ctx.pool.class.name));assert.doesNotMatch(await ui.text(),new RegExp(ctx.pool.foreignClass.name));const response=await ctx.pool.get('teacher','/classes?limit=100');await ctx.evidence('teacher-classes',response);assert.ok(response.data.some(c=>c.id===ctx.pool.class.id));assert.ok(!response.data.some(c=>c.id===ctx.pool.foreignClass.id));});})
};