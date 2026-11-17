import assert from 'node:assert/strict';

import { By, Key } from 'selenium-webdriver';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { reserve, readUser } from "../../../common/flows/support/admin/accounts.js";

import { businessDate } from "../../../common/time.js";

import { openPerson, createPerson, classForm, reserveClass, classRead, openClass, members, admin, dateCase } from "../../../common/flows/management.js";



export const cases = {
CLV_001:scenario('student',async(ctx,ui)=>{await ctx.step('Danh sách lớp chỉ gồm lớp đã tham gia; đối chiếu API',async()=>{await ui.nav('/student/classes');await ui.has(new RegExp(ctx.pool.class.name));assert.doesNotMatch(await ui.text(),new RegExp(ctx.pool.foreignClass.name));const response=await ctx.pool.get('student','/classes?limit=100');await ctx.evidence('student-classes',response);assert.deepEqual(response.data.map(c=>c.id),[ctx.pool.class.id]);});}),
CLV_003:scenario('empty',async(ctx,ui)=>{await ctx.step('Học viên chưa thuộc lớp: thông báo và gợi ý liên hệ',async()=>{await ui.nav('/student/classes');await ui.has(/chưa.*lớp|No classes|not enrolled/i);await ui.has(/liên hệ|contact/i);});})
};