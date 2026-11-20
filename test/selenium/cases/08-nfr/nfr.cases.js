import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { scenario, UI } from "../../common/ui/ui.js";

import { Blocked } from "../../common/runner/core.js";

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { gradingFixture, editor, grade } from "../../common/flows/grading.js";

import { creation } from "../../common/flows/support/teacher/assignments.js";

import { start, answer, submit, verifySubmitted } from "../../common/flows/support/student/attempts.js";

import { cases as loginCases } from "../01-auth-profile/uc001/auth.cases.js";

import { loginUi, forms, labels, admin } from "../../common/flows/support/common/nfr.js";

export const cases = {
NFR_001:admin(async(ctx,ui,data)=>{const collected={};await ctx.step('Kiểm tra nhãn và dấu bắt buộc trên bốn form trong phạm vi USA01',async()=>{
    await forms(ctx,ui,data,async(name,scope)=>{const fields=await labels(ctx,scope);collected[name]=fields;assert.ok(fields.length,`${name}: fields must exist`);for(const field of fields){assert.ok(field.visible&&field.label,`${name}: missing visible label for ${field.type}/${field.placeholder}`);if(field.required)assert.match(field.label,/\*|bắt buộc|required/i,`${name}: required indicator missing`);}});
    await ctx.evidence('labels-audit',collected);
  });},ctx=>gradingFixture(ctx)),
NFR_002:admin(async(ctx,ui,data)=>{
    const states={};const collect=async(label,route)=>{states[label]=await ctx.driver.executeScript('return window.__srsUiStates||[]');await ctx.evidence(`loading-${label}`,states[label]);assert.ok(states[label].some(s=>route.test(s.route)&&s.buttons.some(b=>b.disabled&&(b.spinner||/Đang|Loading|Saving|Signing|Submitting/i.test(b.text)))),`${label}: must expose real loading/disabled state`);};
    await ctx.step('Đăng nhập: disabled, loading và chống gửi lặp bằng request thật',async()=>{await loginUi(ctx,ui);await loginCases.LOGIN_019.run(ctx,ctx.pool.users.admin);await collect('login',/^\/login$/);});
    await ctx.step('Tạo bài tập qua UI: kết quả đúng và có phản hồi trạng thái',async()=>{await creation('WRITING').run(ctx);await collect('create',/\/teacher\/assignments\/create/);});
    await ctx.step('Nộp bài qua UI: kết quả đúng và có phản hồi trạng thái',async()=>{await ui.login('student');await start(ctx,ui,data.quiz);await answer(ctx,ui,data.quiz);await submit(ctx,ui,data.quiz);await verifySubmitted(ctx,data.quiz);await collect('submit',/\/student\/assignments\//);});
    await ctx.step('Lưu điểm qua UI: dữ liệu đúng, trạng thái đã chấm',async()=>{await ui.login('teacher');await editor(ctx,ui,data);await grade(ctx,ui,data,7,'SRS feedback status check');await collect('grading',/\/teacher\/assignments\/\d+\/submissions/);});
  },async ctx=>({...await gradingFixture(ctx),quiz:await ctx.pool.assignment('READING')})),
NFR_003:admin(async(ctx,ui,data)=>{
    for(const role of ['admin','teacher','student'])await ctx.step(`Điều hướng menu ${role}; từng nhãn phải mở đúng URL`,async()=>{
      await ui.login(role);const routes=await ctx.driver.executeScript('return Array.from(document.querySelectorAll("aside a[href]"),e=>({href:e.getAttribute("href"),text:e.innerText.trim()})).filter(e=>e.href.startsWith("/'+role+'/"))');assert.ok(routes.length);
      for(const route of routes){assert.ok(route.text,'Menu needs visible name');await ui.nav(route.href);assert.doesNotMatch(await ui.text(),/404_NOT_FOUND|This page doesn.t exist/);await ctx.screenshot(`${role}-menu`);}
    });
    await ctx.step('Trang chi tiết lớp, bài, kết quả phải có nút quay lại',async()=>{
      await ui.login('teacher');await ui.nav('/teacher/classes');await ui.fill('.teacher-search-input',ctx.pool.class.name);await(await ui.visible('.teacher-class-card button.btn-primary')).click();await ui.ready();await ui.button(/^(Lớp học của tôi|My Classes)$/i);await ui.path('/teacher/classes');
      await editor(ctx,ui,data);await(await ui.visible('.tsd-back-link')).click();await ui.path(`/teacher/assignments/${data.item.id}`);
      await ui.login('student');await ui.open(`/student/submissions/${data.submissionId}`);await(await ui.visible('.result-back-btn')).click();await ui.path('/student/assignments');
    });
  },ctx=>gradingFixture(ctx,'READING')),
NFR_004:admin(async(ctx,ui,data)=>{const actions={};await ctx.step('Ghi nhãn Lưu/Hủy/Sửa/Xóa trên bốn màn; đối chiếu cùng hành động',async()=>{
    await forms(ctx,ui,data,async(name,scope)=>{if(name==='login'||name.startsWith('class-step'))return;actions[name]=await ctx.driver.executeScript('return Array.from(document.querySelector(arguments[0]).querySelectorAll("button"),e=>e.innerText.trim()).filter(t=>/Lưu|Hủy|Xóa|Sửa|Save|Cancel|Delete|Edit/i.test(t))',scope);});
    await ui.login('admin');await ui.nav('/admin/accounts');await ui.button(/^(Thêm tài khoản mới|Add New User)$/i);actions.account=await ctx.driver.executeScript('return Array.from(document.querySelectorAll(".adm-drawer button"),e=>e.innerText.trim()).filter(Boolean)');
    await ctx.evidence('action-label-checklist',actions);
    // Compare shared intents; publishing, creating an account and sending a
    // grade have different effects and need not share one exact label.
    const groups={
      draft:['assignment','grading'].map(screen=>({screen,labels:actions[screen].filter(t=>/^Lưu bản nháp(?: nhận xét)?$|^Save (?:Feedback )?Draft$/i.test(t))})),
      cancel:['assignment','account'].map(screen=>({screen,labels:actions[screen].filter(t=>/^Hủy(?: bỏ)?$|^Cancel$/i.test(t))}))
    };
    await ctx.evidence('same-intent-action-groups',groups);
    for(const [intent,group] of Object.entries(groups)){
      assert.ok(group.every(g=>g.labels.length===1),`Each compared screen must expose the shared ${intent} action`);
      const verbs=group.map(g=>g.labels[0].replace(/ nhận xét$/i,'').replace(/^Save Feedback Draft$/i,'Save Draft').replace(/^Hủy bỏ$/i,'Hủy'));
      assert.equal(new Set(verbs).size,1,`Inconsistent wording for the same ${intent} action`);
    }
  });},ctx=>gradingFixture(ctx)),
NFR_005:admin(async(ctx,ui)=>{const icons={};await ctx.step('Thu biểu tượng cùng hành động từ tài khoản, lớp, bài; so sánh SVG',async()=>{
    for(const [role,route] of [['admin','accounts'],['admin','classes'],['teacher','assignments']]){await ui.login(role);await ui.nav(`/${role}/${route}`);icons[route]=await ctx.driver.executeScript(`return Array.from(document.querySelectorAll('main button[title],main button[aria-label]'),e=>({action:e.title||e.getAttribute('aria-label'),svg:e.querySelector('svg')?.innerHTML})).filter(e=>e.svg)`);await ctx.screenshot(`${route}-icons`);}
    await ctx.evidence('icons-checklist',icons);
    for(const action of [/Sửa|Edit/i,/Xóa|Delete/i,/Khóa|Lock/i]){const groups=Object.values(icons).map(list=>list.filter(i=>action.test(i.action)));if(groups.some(g=>!g.length))throw new Blocked(`Chưa đủ biểu tượng ${action} ở ba danh sách để so sánh. Cần checklist thủ công hoặc chốt lại các màn có cùng hành động; không suy ra icon thiếu là icon không nhất quán.`);assert.equal(new Set(groups.map(g=>g[0].svg)).size,1,`Inconsistent icon ${action}`);}
  });}),
NFR_006:admin(async(ctx,ui)=>{await ctx.step('Đối chiếu nhãn trạng thái danh sách và chi tiết của tài khoản/lớp/bài',async()=>{
    await ui.nav('/admin/accounts');await ui.fill('main input.adm-search-input',ctx.pool.users.locked.email);const row=await ui.row(ctx.pool.users.locked.email);const before=await row.getText();assert.match(before,/Bị khóa|Blocked|Locked/i);await ui.rowAction(ctx.pool.users.locked.email,/Sửa|Edit/i);const option=await ui.visible('.adm-drawer select:has(option[value=LOCKED]) option:checked');const detail=await option.getText();await ctx.evidence('status-checklist',{list:before,detail});assert.ok(before.includes(detail),'Same account status must have the same text in list/detail');
  });}),
NFR_007:admin(async(ctx,ui,{items})=>{await ctx.step('Badge tài khoản và bài tập đều có chữ khi chuyển thang xám',async()=>{
    const snapshots={};for(const [role,route] of [['admin','accounts'],['teacher','assignments']]){await ui.login(role);await ui.nav(`/${role}/${route}`);if(route==='accounts'){await ui.fill('main input.adm-search-input',ctx.pool.prefix.toLowerCase());await ui.select('select.eh-pagination-select','50');await ui.row(ctx.pool.users.locked.email);}else{await ui.select('.teacher-hero-actions select',ctx.pool.class.id);await ui.has(new RegExp(items[0].title));}await ctx.driver.executeScript('document.documentElement.style.filter="grayscale(1)"');const badges=await ctx.driver.executeScript('return Array.from(document.querySelectorAll("main .badge,main .tcd-status-badge,main .teacher-assignment-card-status"),e=>e.innerText.trim()).filter((_,i,a)=>true)');assert.ok(badges.length,`${route}: badges required`);for(const text of badges)assert.ok(text&&/[A-Za-zÀ-ỹ]/u.test(text),'Status cannot be color only');snapshots[route]=badges;await ctx.screenshot(`${route}-grayscale`);}await ctx.evidence('text-status-badges',snapshots);
  });},async ctx=>{const items=[];for(const status of ['DRAFT','PUBLISHED'])items.push(await ctx.pool.assignment('WRITING',{status}));const closed=await ctx.pool.assignment();await ctx.pool.request('teacher','PATCH',`/assignments/${closed.id}/status`,{status:'CLOSED'});items.push(closed);return{items};}),
NFR_008:admin(async(ctx,ui,data)=>{const collected={};await ctx.step('Kiểm tra bố cục desktop 1920x1080 và 1366x768, zoom 100%',async()=>{
    for(const browser of ['chrome','edge']){
      let driver;try{driver=await ctx.buildDriver(ctx.test,browser);}catch(error){throw new Blocked(`${browser} WebDriver unavailable: ${error.message}`);}
      ctx.registerCleanup(`Close desktop ${browser}`,()=>driver.quit());
      const local={...ctx,driver,screenshot:async label=>{const name=`${browser}-${Date.now()}-${label}.png`;await writeFile(join(ctx.output,ctx.test.id,name),await driver.takeScreenshot(),'base64');ctx.result.screenshots.push(`${ctx.test.id}/${name}`);}};
      const browserUi=new UI(local);
      for(const [width,height] of [[1920,1080],[1366,768]]){await driver.manage().window().setRect({width,height});await forms(local,browserUi,data,async(name,scope)=>{
        const issues=await driver.executeScript(`document.body.style.zoom='100%';return Array.from(document.querySelector(arguments[0]).querySelectorAll('input,select,textarea,button[type=submit]')).filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{e.scrollIntoView({block:'center',inline:'center'});const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {tag:e.tagName,text:e.innerText||e.placeholder||e.type,clipped:r.left<0||r.right>innerWidth,covered:!!hit&&!(e===hit||e.contains(hit))}}).filter(e=>e.clipped||e.covered);`,scope);collected[`${browser}-${width}x${height}-${name}`]=issues;await ctx.evidence('desktop-layout',collected);assert.deepEqual(issues,[],`${browser}: ${name} has clipped/covered controls at ${width}x${height}`);});}
    }
  });},ctx=>gradingFixture(ctx)),
NFR_009:admin(async(ctx,ui)=>{await ctx.step('Danh sách tài khoản/lớp/bài: tìm rỗng, xóa bộ lọc và xác nhận khôi phục',async()=>{
    const empty=/Không tìm thấy|không có.*kết quả|Chưa có bài tập nào|No .*found|No results|No assignments/i;
    for(const [role,route] of [['admin','accounts'],['admin','classes'],['teacher','assignments']]){await ui.login(role);await ui.nav(`/${role}/${route}`);const selector=role==='teacher'?'.teacher-search-input':'.adm-search-input';await ui.fill(selector,'zzzzz');assert.equal(await(await ui.visible(selector)).getAttribute('value'),'zzzzz');await ui.has(empty);await ctx.screenshot(`${route}-empty`);await ui.clearSearch(selector);await ctx.driver.wait(async()=>!empty.test(await ui.text()),10000,'Clearing the search must restore the nonempty fixture list');await ctx.screenshot(`${route}-restored`);}
  });})
};
