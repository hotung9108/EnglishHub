import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../ui/ui.js";

import { Blocked } from "../../../runner/core.js";

const essay=Array(16).fill('Daily English practice develops vocabulary and confidence. Students read articles, listen carefully, write reflections and discuss ideas with teachers. Constructive feedback supports learning and helps learners improve their skills.').join(' ');

async function attempts(ctx,item,role='student'){const response=await ctx.pool.get(role,`/submissions?assignmentId=${item.id}&limit=100`);return response.data.filter(s=>s.assignmentId===item.id);}

async function assignmentCard(ctx,ui,item){
  await ui.nav('/student/assignments');await ui.fill('main input[type=text]',item.title);
  let card;await ctx.driver.wait(async()=>{try{for(const c of await ctx.driver.findElements(By.css('.std-asg-card')))if((await c.getText()).includes(item.title)){card=c;return true;}return false;}catch(e){if(e.name==='StaleElementReferenceError')return false;throw e;}},10000,'Dedicated assignment must be listed');
  return card;
}

async function overview(ctx,ui,item){
  const card=await assignmentCard(ctx,ui,item);await card.click();
  if(new URL(await ctx.driver.getCurrentUrl()).pathname.startsWith('/student/submissions/')){
    const crumb=await ctx.driver.wait(async()=>{for(const e of await ctx.driver.findElements(By.css('span.result-crumb-link')))if((await e.getText()).includes(item.title))return e;return false;},10000,'Result breadcrumb must identify the exact assignment');await crumb.click();
  }
  await ui.path(`/student/assignments/${item.id}/overview`);await ui.visible('.overview-cta-btn');await ui.ready();await ui.has(new RegExp(item.title));
}

async function start(ctx,ui,item){
  const previous=await attempts(ctx,item);
  if(previous.some(s=>s.status==='IN_PROGRESS')){const card=await assignmentCard(ctx,ui,item);await card.click();await ctx.driver.wait(async()=>new URL(await ctx.driver.getCurrentUrl()).pathname!=='/student/assignments',10000);}
  else await overview(ctx,ui,item);
  if(new URL(await ctx.driver.getCurrentUrl()).pathname.endsWith('/overview')){const cta=await ui.visible('.overview-cta-btn');assert.equal(await cta.isEnabled(),true);await cta.click();}
  const selector=item.skill==='WRITING'?'.writing-textarea':item.skill==='SPEAKING'?'.speaking-btn-record':'.exam-short-answer-input';await ui.visible(selector);await ui.has(new RegExp(item.instructions));
  const list=await attempts(ctx,item);const running=list.filter(s=>s.status==='IN_PROGRESS');assert.equal(running.length,1);return running[0];
}

async function answer(ctx,ui,item,value='apple'){
  const input=await ui.visible(item.skill==='WRITING'?'.writing-textarea':'.exam-short-answer-input');await input.sendKeys(value);
}

async function submit(ctx,ui,item,{confirm='if-present'}={}){
  await ui.button(item.skill==='WRITING'?/^Nộp bài \(Submit Writing\)$|^Nộp bài$/i:/^Hoàn thành & Nộp.*$/i);
  if(confirm===true)await ui.confirm(true);
  else if(confirm==='if-present'){
    let outcome;await ctx.driver.wait(async()=>{try{await ctx.driver.switchTo().alert();outcome='dialog';return true;}catch(e){if(e.name!=='NoSuchAlertError')throw e;}if((await ctx.driver.findElements(By.css('[role=dialog],.tad-modal-overlay,.modal-overlay'))).length){outcome='dialog';return true;}if(/\/student\/(submissions|assignments\/\d+\/result)/.test(new URL(await ctx.driver.getCurrentUrl()).pathname)){outcome='submitted';return true;}return false;},15000,'Submission must show confirmation or navigate to result');
    if(outcome==='dialog')await ui.confirm(true);
  }
}

async function verifySubmitted(ctx,item,expectedCount=1){
  let details;
  await ctx.driver.wait(async()=>{const list=await attempts(ctx,item);const completed=list.filter(s=>s.status!=='IN_PROGRESS');if(completed.length!==expectedCount)return false;details=await ctx.pool.get('student',`/submissions/${completed.at(-1).id}`);return !!details.submittedAt;},15000,'Submission must persist with timestamp');
  await ctx.evidence('submitted-readback',details);assert.equal(details.assignmentId,item.id);assert.ok(details.submittedAt);return details;
}

async function saveQuizAnswers(ctx,ui,item,attempt){
  const buttons=await ctx.driver.findElements(By.css('main button'));let save;
  for(const button of buttons)if(await button.isDisplayed()&&/^(Lưu câu trả lời|Lưu bài Đọc|Lưu bài Nghe|Save Answers|Save Reading|Save Listening)$/i.test((await button.getText()).trim())){save=button;break;}
  if(save)await save.click();else await ui.button(/^Hoàn thành & Nộp phần (Đọc|Nghe)|^Submit (Reading|Listening)/i);
  const moduleId=attempt.modules.find(m=>m.moduleId===item.moduleId).id;let stored;
  await ctx.driver.wait(async()=>{const response=await ctx.pool.request('student','GET',`/submission-modules/${moduleId}`,undefined,{allowError:true});if(response.status!==200)return false;stored=response.data;return stored.answers?.some(a=>a.questionId===item.questions[0].id&&a.content?.text==='apple');},15000,'The exact quiz answer must persist, regardless of the save button wording');
  await ctx.evidence('quiz-answer-readback',{assignmentId:item.id,submissionId:attempt.id,module:stored,submission:await ctx.pool.get('student',`/submissions/${attempt.id}`)});
}

const student=(run,skill='WRITING',options={})=>scenario('student',run,async ctx=>({item:await ctx.pool.assignment(skill,options),publicData:{skill,maxSubmissions:options.maxSubmissions??2,input:skill==='WRITING'?essay:skill==='SPEAKING'?'Chrome fake microphone, record at least two seconds':'apple'}}));

async function record(ctx,ui){
  await (await ui.visible('.speaking-btn-record')).click();
  await ctx.driver.wait(async()=>/00:0[2-9]/.test(await ui.text()),10000,'Record at least two seconds from fake microphone');
  await (await ui.visible('.speaking-btn-record')).click();
  await ctx.driver.wait(async()=>await ctx.driver.executeScript('return !!document.querySelector("audio")?.src'),10000);
}

export { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record };
