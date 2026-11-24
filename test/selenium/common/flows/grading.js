import assert from 'node:assert/strict';
import { By } from 'selenium-webdriver';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { scenario } from "../ui/ui.js";
import { Blocked } from "../runner/core.js";
import { openAssignment } from "./support/teacher/assignments.js";
import { start, answer, submit, verifySubmitted } from "./support/student/attempts.js";
import {csvRows} from "../csv-evidence.js";
const score='main input[type=number][placeholder="0.0"]';
const feedback='textarea.tsd-feedback-textarea,main textarea';
const save=/^(Lưu & Gửi điểm cho học sinh|Save & Send score|Hoàn thành chấm bài)$/i;
const reason='textarea[placeholder*="lý do"],textarea[placeholder*="reason"]';
const escapeRegex=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
async function aiSuggestion(ctx,data){return ctx.pool.get('teacher',`/submission-modules/${data.submissionModuleId}/grading/ai-suggestion`);}
async function annotationCard(ctx,annotation){
  for(const card of await ctx.driver.findElements(By.css('.tsd-annotation-item')))if(await card.isDisplayed()){
    const text=await card.getText();if(text.includes(annotation.suggestedFix)&&text.includes(annotation.comment))return card;
  }return false;
}
async function gradingFixture(ctx,skill='WRITING',options={}){
  const item=await ctx.pool.assignment(skill,options);const submission=await ctx.pool.submitted(item,ctx.test.id==='GRD_008'?{text:Array(10).fill('Yesterday he go to school and she do not likes the lesson. The students was excited because learning English are useful. I has studied for two years but I still makes mistakes. This essay contain deliberate grammar errors for the teacher to review.').join(' ')}:{});
  const grading=await ctx.pool.get('teacher',`/submission-modules/${submission.submissionModuleId}/grading`);
  return{item,...submission,grading,publicData:{assignmentId:item.id,title:item.title,submissionId:submission.submissionId,skill,maxScore:10}};
}
async function editor(ctx,ui,data){await openAssignment(ctx,ui,data.item);await ui.button(/^Quản lý bài nộp|^Manage Submissions/i);await ui.ready();await ui.rowAction(ctx.pool.users.student.fullName,/Chấm bài ngay|Grade now|Xem bài nộp|View submission|Chấm bài|Grade|Xem chi tiết|View Details/i);await ui.visible(score);}
async function grade(ctx,ui,data,value,text='Good'){
  await ui.fill(score,value);await ui.fill(feedback,text);await ui.button(save);
  await ctx.driver.wait(async()=>(await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)).status==='COMPLETED',15000);
  const actual=await ctx.pool.get('teacher',`/gradings/${data.grading.id}`);await ctx.evidence('final-grade',actual);assert.equal(Number(actual.finalScore),value);assert.equal(actual.finalFeedback,text);return actual;
}
const manual=(run,skill='WRITING')=>scenario('teacher',async(ctx,ui,data)=>{await ctx.step('Mở bài nộp fixture để chấm',()=>editor(ctx,ui,data));await run(ctx,ui,data);},ctx=>gradingFixture(ctx,skill));
async function classProgress(ctx,ui){await ui.nav('/teacher/classes');await ui.fill('.teacher-search-input',ctx.pool.class.name);let card;await ctx.driver.wait(async()=>{for(const e of await ctx.driver.findElements(By.css('.teacher-class-card')))if((await e.getText()).includes(ctx.pool.class.name)){card=e;return true;}return false;},10000,'Exact class card');await(await card.findElement(By.css('button.btn-primary'))).click();await ui.visible('.tcd-table');await ui.ready();await ui.has(new RegExp(ctx.pool.class.name));}
export { score, feedback, save, reason, escapeRegex, aiSuggestion, annotationCard, gradingFixture, editor, grade, manual, classProgress };
