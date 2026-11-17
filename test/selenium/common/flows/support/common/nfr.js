import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { scenario, UI } from "../../../ui/ui.js";

import { Blocked } from "../../../runner/core.js";

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { gradingFixture, editor, grade } from "../../grading.js";

import { creation } from "../teacher/assignments.js";

import { start, answer, submit, verifySubmitted } from "../student/attempts.js";


async function loginUi(ctx,ui){await ctx.driver.get(new URL('/login',ctx.baseUrl).href);await ctx.driver.executeScript('localStorage.clear();sessionStorage.clear()');await ctx.driver.get(new URL('/login',ctx.baseUrl).href);await ui.visible('#login-email');}

async function forms(ctx,ui,data,visit){
  await loginUi(ctx,ui);await visit('login','form.login-form');await ctx.screenshot('login-form');
  await ui.login('admin');await ui.nav('/admin/classes');await ui.button(/^(Tạo lớp học mới|Create New Class)$/i);await ui.visible('main form');await visit('class-step1','main form');await ctx.screenshot('class-form');
  await ui.fill('main form input[type=text]','Selenium Layout Sample');await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);await visit('class-step2','main form');await ctx.screenshot('class-step2');
  await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);await visit('class','main form');await ctx.screenshot('class-step3');
  await ui.login('teacher');await ui.nav('/teacher/classes');await ui.button(/^(Giao bài tập mới|Create Assignment)$/i);await ui.visible('.assignment-edit-title-input');await visit('assignment','main');await ctx.screenshot('assignment-form');
  await editor(ctx,ui,data);await visit('grading','main');await ctx.screenshot('grading-form');
}

async function labels(ctx,scope){return ctx.driver.executeScript(`
  const root=document.querySelector(arguments[0]);
  return Array.from(root.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select')).filter(e=>e.getClientRects().length&&!e.readOnly&&!e.disabled).map(e=>{
    const label=e.labels?.[0]||e.closest('label')||e.closest('.adm-form-group')?.querySelector('label')||e.parentElement.querySelector('label');
    return {type:e.type,placeholder:e.placeholder,required:e.required,label:label?.innerText?.trim()||'',visible:!!label?.getClientRects().length};
  });`,scope);}

const admin=(run,prepare)=>scenario('admin',run,prepare);

export { loginUi, forms, labels, admin };
