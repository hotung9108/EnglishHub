import assert from 'node:assert/strict';

import { By, Key } from 'selenium-webdriver';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { reserve, readUser } from "../../../common/flows/support/admin/accounts.js";

import { businessDate } from "../../../common/time.js";

import { openPerson, createPerson, classForm, reserveClass, classRead, openClass, members, admin, dateCase } from "../../../common/flows/management.js";



export const cases = {
MEM_001:admin(async(ctx,ui)=>{await ctx.step('Thêm học viên chưa thuộc lớp qua modal và kiểm tra roster',async()=>{await members(ctx,ui);await ui.button(/^(Chọn học viên có sẵn|Thêm học viên|Thêm học viên có sẵn|Add Student|Select Existing Students)$/i);await ui.fill('input[placeholder^="Tìm kiếm học viên theo tên"],input[placeholder^="Search by name, email, student ID"]',ctx.pool.users.empty.email);const checkbox=await ui.visible('input[type=checkbox]');await(await checkbox.findElement(By.xpath('./parent::div/parent::div'))).click();await ui.button(/^(Thêm 1 học viên vào lớp|Add 1 to Class)$/i,'main');await ctx.driver.wait(async()=>(await ctx.pool.get('admin',`/classes/${ctx.pool.class.id}/members`)).data.some(m=>m.studentId===ctx.pool.users.empty.id),10000);await ui.has(new RegExp(ctx.pool.users.empty.fullName));});}),
MEM_002:admin(async(ctx,ui)=>{await ctx.step('Picker không cho chọn thêm người đã ghi danh; kiểm thêm trùng thực sự bằng API và giữ nguyên roster',async()=>{
    await members(ctx,ui);await ui.button(/^(Chọn học viên có sẵn|Thêm học viên|Thêm học viên có sẵn|Add Student|Select Existing Students)$/i);
    const search='input[placeholder^="Tìm kiếm học viên theo tên"],input[placeholder^="Search by name, email, student ID"]';
    await ctx.driver.wait(async()=>await(await ui.visible(search)).isEnabled(),10000);await ui.fill(search,ctx.pool.users.student.email);
    await ui.has(/Đã tham gia|Đã có trong lớp|Enrolled|already|Không tìm thấy học viên|No students found/i,'body');
    const before=await ctx.pool.get('admin',`/classes/${ctx.pool.class.id}/members`);
    const duplicate=await ctx.pool.request('admin','POST',`/classes/${ctx.pool.class.id}/members`,{studentId:ctx.pool.users.student.id},{allowError:true});
    if(duplicate.status<300&&duplicate.data.memberId){ctx.pool.resources.push({type:'member',id:duplicate.data.memberId,classId:ctx.pool.class.id,studentId:ctx.pool.users.student.id,state:'CREATED'});await ctx.pool.journal();}
    const after=await ctx.pool.get('admin',`/classes/${ctx.pool.class.id}/members`);
    await ctx.evidence('duplicate-membership',{before,duplicate,after,ui:await ui.text('body')});
    assert.equal(duplicate.status,409);assert.match(duplicate.data.error,/đã có trong lớp|already/i);
    assert.deepEqual(after.data.map(m=>m.memberId).sort(),before.data.map(m=>m.memberId).sort());assert.equal(after.data.filter(m=>m.studentId===ctx.pool.users.student.id).length,1);
  });}),
MEM_003:admin(async(ctx,ui)=>{await ctx.step('Xóa học viên fixture: Hủy giữ nguyên, Xác nhận mới xóa',async()=>{const c=await ctx.pool.createClass('RemoveMember');await ctx.pool.request('admin','POST',`/classes/${c.id}/members`,{studentId:ctx.pool.users.other.id});await openClass(ctx,ui,c);await ui.rowAction(ctx.pool.users.other.fullName,/Xóa khỏi lớp|Remove from class/i);await ui.confirm(false);assert.equal((await ctx.pool.get('admin',`/classes/${c.id}/members`)).data.length,1);await ui.rowAction(ctx.pool.users.other.fullName,/Xóa khỏi lớp|Remove from class/i);await ui.confirm(true);await ctx.driver.wait(async()=>(await ctx.pool.get('admin',`/classes/${c.id}/members`)).data.length===0,10000);});}),
MEM_004:admin(async(ctx)=>{await ctx.step('Đối chiếu giới hạn sĩ số',()=>{throw new Blocked('Excel ghi nếu có giới hạn; UC009 không quy định giá trị max hoặc quan hệ với metadata Sĩ số. Cần xác nhận giới hạn trước khi sinh dữ liệu biên.');});})
};