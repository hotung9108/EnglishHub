import assert from 'node:assert/strict';

import { By, Key } from 'selenium-webdriver';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { reserve, readUser } from "../../../common/flows/support/admin/accounts.js";

import { businessDate } from "../../../common/time.js";

import { openPerson, createPerson, classForm, reserveClass, classRead, openClass, members, admin, dateCase } from "../../../common/flows/management.js";



export const cases = {
TCHR_001:admin(async(ctx,ui)=>{await ctx.step('Tìm giáo viên fixture và kiểm tra danh sách đúng',async()=>{await ui.nav('/admin/teachers');await ui.fill('main input.adm-search-input',ctx.pool.users.teacher.email);await ui.has(new RegExp(ctx.pool.users.teacher.fullName));assert.doesNotMatch(await ui.text(),new RegExp(ctx.pool.users.outsider.email));});}),
TCHR_002:admin(async(ctx,ui)=>{await ctx.step('Thêm giáo viên từ form chuyên biệt và đối chiếu API',()=>createPerson(ctx,ui,'teachers'));}),
TCHR_003:admin(async(ctx,ui)=>{
    const failures=[];
    for(const missing of ['name','email']){try{await ctx.step(`Thêm giáo viên thiếu trường bắt buộc ${missing}; phải đánh dấu lỗi và không tạo tài khoản`,async()=>{
      const user=await reserve(ctx,'TEACHER');await ui.nav('/admin/teachers');await ui.button(/^(Thêm giáo viên|Thêm giảng viên|Add Teacher)$/i);
      const selectors={name:'main input[placeholder="Nguyễn Văn A..."]',email:'main input[type=email]',password:'main input[type=password]'};
      for(const [key,value] of Object.entries({name:user.fullName,email:user.email,password:user.password}))await ui.fill(selectors[key],key===missing?'':value);
      const field=await ui.visible(selectors[missing]);await ctx.driver.executeScript('window.__teacherInvalid=0;arguments[0].addEventListener("invalid",()=>window.__teacherInvalid++)',field);
      const next=await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i,'main',false);if(await next.isEnabled())await next.click();
      const validation=await ctx.driver.executeScript('return {missing:arguments[0].validity.valueMissing,message:arguments[0].validationMessage,invalidEvents:window.__teacherInvalid}',field);await ctx.evidence(`teacher-missing-${missing}`,validation);
      if(validation.invalidEvents)assert.ok(validation.message);else await ui.has(missing==='name'?/Vui lòng nhập họ và tên|name.*required|enter.*name/i:/Vui lòng nhập.*email|email.*bắt buộc|email.*required|email.*hợp lệ|valid.*email/i);
      const users=await ctx.pool.get('admin',`/admin/users?q=${encodeURIComponent(user.email)}&limit=100`);assert.ok(!users.data.some(u=>u.email===user.email));
    });}catch(error){failures.push({scope:`missing-${missing}`,message:error.message});}}
    try{await ctx.step('Thêm giáo viên trùng email khác với thiếu dữ liệu; phải báo lỗi',()=>createPerson(ctx,ui,'teachers',true));}catch(error){failures.push({scope:'duplicate-email',message:error.message});}
    await ctx.evidence('teacher-validation-coverage',{requiredFields:['name','email'],duplicateEmailChecked:true,failures});
    await ctx.step('Tất cả nhánh thiếu dữ liệu và trùng email phải đạt; không bỏ qua nhánh lỗi',()=>assert.deepEqual(failures,[]));
  }),
TCHR_004:admin(async(ctx,ui)=>{
    const user=await ctx.pool.createUser('TEACHER','Lockable');
    await ctx.step('Mở hồ sơ giáo viên fixture và khóa',async()=>{await ui.nav('/admin/teachers');await ui.fill('main input.adm-search-input',user.email);await openPerson(ctx,ui,'teachers',user);await ui.button(/^(Khóa tài khoản|Lock Account)$/i);await ui.confirm();});
    await ctx.step('Kiểm tra không đăng nhập được, rồi mở khóa lại',async()=>{await ctx.driver.wait(async()=>(await readUser(ctx,user)).status==='LOCKED',10000);const auth=await ctx.pool.request(null,'POST','/auth/login',{email:user.email,password:user.password},{allowError:true});assert.ok([400,401,403].includes(auth.status));await ui.button(/^(Mở khóa tài khoản|Mở khóa|Unlock Account)$/i);await ui.confirm();await ctx.driver.wait(async()=>(await readUser(ctx,user)).status==='ACTIVE',10000);const session=await ctx.pool.request(null,'POST','/auth/login',{email:user.email,password:user.password});assert.equal(session.user.id,user.id);});
  })
};