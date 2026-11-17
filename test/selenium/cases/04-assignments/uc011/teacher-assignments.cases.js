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
ASG_001:teacher(async(ctx,ui,{items})=>{await ctx.step('Lọc lần lượt bốn kỹ năng; từng thẻ phải đúng kỹ năng',async()=>{await ui.nav('/teacher/assignments');await ui.select('.teacher-hero-actions select',ctx.pool.class.id);await ui.ready();for(const skill of ['Writing','Speaking','Reading','Listening']){await ui.button(new RegExp(`^${skill}(\\s*\\(?\\d*\\)?)?$`));await ctx.driver.wait(async()=>{const cards=await ctx.driver.findElements(By.css('.teacher-assignment-card'));if(!cards.length)return false;for(const c of cards)if(!(await c.getText()).includes(skill))return false;return true;},10000);}});},async ctx=>{const items=[];for(const skill of ['WRITING','SPEAKING','READING','LISTENING'])items.push(await ctx.pool.assignment(skill));return {items};}),
ASG_002:teacher(async(ctx,ui,{item})=>{await ctx.step('Lọc trạng thái, tìm chính xác tiêu đề rồi xóa lọc',async()=>{await ui.nav('/teacher/assignments');await ui.fill('input.teacher-search-input',item.title);await ui.button(/^(Đang mở|Open)(\s*\(?\d*\)?)?$/i);await ui.has(new RegExp(item.title));const cards=await ctx.driver.findElements(By.css('.teacher-assignment-card'));assert.equal(cards.length,1);await ui.fill('input.teacher-search-input','zzzzz');await ui.has(/Không tìm thấy|No assignments|No results/i);await ui.button(/^(Xóa bộ lọc|Clear filters)$/i);assert.equal(await (await ui.visible('input.teacher-search-input')).getAttribute('value'),'');await ui.has(new RegExp(item.title));});},fixture()),
ASG_003:teacher(async(ctx,ui,{item})=>{await ctx.step('Bấm Xóa bài có bài nộp, kiểm cảnh báo; Hủy phải giữ bài',async()=>{await openAssignment(ctx,ui,item);await ui.button(/^(Xóa bài tập|Delete Assignment)$/i);await ui.has(/bài nộp|submissions|dữ liệu|data/i,'[role=dialog],.tad-modal');await ui.confirm(false);assert.equal((await ctx.pool.get('teacher',`/assignments/${item.id}`)).id,item.id);});await ctx.step('Bấm Xóa lần nữa và Xác nhận; kiểm DELETE, đọc lại và danh sách',async()=>{const index=ctx.pool.events.length;await ui.button(/^(Xóa bài tập|Delete Assignment)$/i);await ui.confirm(true);await ctx.driver.wait(async()=>{const r=await ctx.pool.request('teacher','GET',`/assignments/${item.id}`,undefined,{allowError:true});return r.status===404;},10000,'Confirmed deletion must make assignment unavailable');const list=await ctx.pool.get('teacher',`/classes/${item.classId}/assignments?limit=100`);assert.ok(!list.data.some(a=>a.id===item.id));await ctx.evidence('confirmed-delete-readback',{assignmentId:item.id,events:ctx.pool.events.slice(index),listed:false});});},async ctx=>{const item=await ctx.pool.assignment('READING');await ctx.pool.submitted(item);return{item};}),
ASG_022:scenario('student',async(ctx,ui,{item})=>{await ctx.step('Tìm bài Nháp trong danh sách học viên; không được hiển thị',async()=>{await ui.nav('/student/assignments');await ui.fill('main input[type=text]',item.title);await ui.has(/Không tìm thấy|No assignments|No results/i);assert.doesNotMatch(await ui.text(),new RegExp(item.title));const detail=await ctx.pool.request('student','GET',`/assignments/${item.id}`,undefined,{allowError:true});assert.ok([403,404].includes(detail.status));});},async ctx=>({item:await ctx.pool.assignment('WRITING',{status:'DRAFT'})}))
};