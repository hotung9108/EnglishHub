import assert from 'node:assert/strict';

import { By, Key } from 'selenium-webdriver';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { reserve, readUser } from "../../../common/flows/support/admin/accounts.js";

import { businessDate } from "../../../common/time.js";

import { openPerson, createPerson, classForm, reserveClass, classRead, openClass, members, admin, dateCase } from "../../../common/flows/management.js";



export const cases = {
STDT_001:admin(async(ctx,ui)=>{await ctx.step('Thêm học viên từ wizard; đối chiếu vai trò và email',()=>createPerson(ctx,ui,'students'));}),
STDT_002:admin(async(ctx,ui)=>{await ctx.step('Nhập email học viên đã tồn tại; không được lưu',()=>createPerson(ctx,ui,'students',true));}),
STDT_003:admin(async(ctx,ui)=>{await ctx.step('Mở hồ sơ học viên và sửa tên qua UI',async()=>{const user=await ctx.pool.createUser('STUDENT','Editable');await ui.nav('/admin/students');await ui.fill('main input.adm-search-input',user.email);await openPerson(ctx,ui,'students',user);await ui.button(/^(Chỉnh sửa|Sửa thông tin|Edit Profile|Edit)$/i);await ui.fill('main form input[type=text]','Selenium Student Edited');await ui.button(/^(Lưu|Lưu thay đổi|Save Changes|Save)$/i);await ctx.driver.wait(async()=>(await readUser(ctx,user)).fullName==='Selenium Student Edited',10000);await ctx.driver.navigate().refresh();await ui.has(/Selenium Student Edited/);});}),
STDT_004:admin(async(ctx,ui)=>{await ctx.step('Tìm học viên không tồn tại; phải có thông báo rỗng',async()=>{await ui.nav('/admin/students');await ui.fill('main input.adm-search-input','zzzzz');await ui.has(/Không tìm thấy|No students found|No results/i);assert.equal((await ctx.driver.findElements(By.css('main tbody tr'))).length,0);});})
};