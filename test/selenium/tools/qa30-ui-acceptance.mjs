import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import '../config/runtime.js';
import { FixturePool } from '../common/fixtures/pool.js';
import { executeCase, report } from '../common/runner/core.js';
import { scenario } from '../common/ui/ui.js';
import { start, answer, attempts, essay, verifySubmitted } from '../common/flows/support/student/attempts.js';
import { observerScript } from '../common/runner/browser-observer.js';

// QA-30 supplementary acceptance checks. All writes target newly created staging fixtures.
const baseUrl = 'https://staging.hotung9108.me';
const apiBase = 'https://api-staging.hotung9108.me/api/v1';
const runId = `qa30-ui-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const output = resolve('reports', runId);
await mkdir(output, { recursive: true });
const temporary = join(output, 'tmp');
await mkdir(temporary);
process.env.TEMP = process.env.TMP = process.env.TMPDIR = temporary;
const secrets = Object.entries(process.env).filter(([k]) => /PASSWORD|TOKEN|SECRET/.test(k)).map(([,v]) => v);
const pool = new FixturePool({apiBase, admin:{email:process.env.SELENIUM_ADMIN_EMAIL,password:process.env.SELENIUM_ADMIN_PASSWORD},output,secrets});
const buildDriver = async () => {
  const options = new chrome.Options().addArguments('--headless=new','--window-size=1440,1000','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  await driver.manage().setTimeouts({implicit:0,pageLoad:25000,script:30000});
  await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument',{source:observerScript});
  return driver;
};
const fresh = skill => async ctx => ({item:await ctx.pool.assignment(skill)});
const checks = [
  {id:'QA30-WORD50',requirement:'UC16 / EAM-4753',title:'Writing: exact 50-word count',procedure:scenario('student',async(ctx,ui,{item})=>{
    await ctx.step('Open Writing and enter exactly 50 words',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item,Array(50).fill('practice').join(' '));await ui.has(/Đếm từ:\s*50\b/);});
  },fresh('WRITING'))},
  {id:'QA30-PDF',requirement:'UC16 / EAM-4756',title:'Writing: attach PDF and verify persisted READY document',procedure:scenario('student',async(ctx,ui,{item})=>{
    await ctx.step('Attach synthetic PDF and verify visible filename',async()=>{await start(ctx,ui,item);const file=resolve('tools/test-essay.pdf');assert.ok((await readFile(file)).subarray(0,5).equals(Buffer.from('%PDF-')));await ctx.driver.findElement(By.css('input[type=file]')).sendKeys(file);await ui.has(/test-essay\.pdf/);});
    await ctx.step('Submit PDF through UI and read persisted storage status',async()=>{await ui.button(/^Nộp bài \(Submit Writing\)$|^Nộp bài$/i);const detail=await verifySubmitted(ctx,item);const stored=await ctx.pool.get('student',`/submission-modules/${detail.modules[0].id}`);await ctx.evidence('document-readback',stored);assert.ok(stored.answers?.some(a=>a.docStorageKey&&a.docUploadStatus==='READY'));});
  },fresh('WRITING'))},
  {id:'QA30-HIGHLIGHT',requirement:'UC18 / QA-30 card',title:'Reading: selected passage becomes persistently highlighted',procedure:scenario('student',async(ctx,ui,{item})=>{
    await ctx.step('Select passage text and click Highlight',async()=>{await start(ctx,ui,item);await ctx.driver.executeScript('const p=document.querySelector(".exam-paragraph-text");const r=document.createRange();r.selectNodeContents(p);const s=getSelection();s.removeAllRanges();s.addRange(r);');await ui.button(/^Highlight$/);await ctx.evidence('passage-after-highlight',{html:await ctx.driver.findElement(By.css('.exam-passage-paragraphs')).getAttribute('innerHTML')});assert.ok((await ctx.driver.findElements(By.css('.exam-passage-paragraphs mark,.exam-passage-paragraphs .highlight,.exam-passage-paragraphs [data-highlight]'))).length>0,'Highlight must mark the selected passage; button presence alone is insufficient');});
  },fresh('READING'))},
  {id:'QA30-FOUR-SKILL',requirement:'UC15-21 / FE-49 handoff',title:'One attempt transitions Reading → Writing → Speaking → Listening',procedure:scenario('student',async(ctx,ui,{item,modules})=>{
    let submission;
    await ctx.step('Start one attempt; verify four stepper entries and record accessibility',async()=>{submission=await start(ctx,ui,item);const steps=await ctx.driver.findElements(By.css('.eh-stepper-compact-step'));assert.equal(steps.length,4);await ctx.evidence('stepper-accessibility',await Promise.all(steps.map(async s=>({text:await s.getText(),enabled:await s.isEnabled(),title:await s.getAttribute('title')}))));await ctx.evidence('deployed-scripts',await ctx.driver.executeScript('return Array.from(document.scripts,s=>s.src).filter(Boolean)'));});
    for (const skill of ['READING','WRITING','SPEAKING','LISTENING']) {
      await ctx.step(`Complete ${skill} through UI and verify next module or final result`,async()=>{
        await ui.path(`/student/assignments/${skill.toLowerCase()}/${item.id}`);
        if(skill==='WRITING'){await answer(ctx,ui,{skill},essay);await ui.button(/^Nộp bài \(Submit Writing\)$|^Nộp bài$/i);}
        else if(skill==='SPEAKING'){
          await(await ui.visible('.speaking-btn-record')).click();await ctx.driver.wait(async()=>/00:0[2-9]/.test(await ui.text()),10000);await(await ui.visible('.speaking-btn-record')).click();await ctx.driver.wait(()=>ctx.driver.executeScript('return !!document.querySelector("audio")?.src'),10000);await ui.button(/^Nộp bài Nói/i);
        } else {
          if(skill==='LISTENING'){await ui.button(/^(Phát âm thanh|Phát|Play|Phát audio|Play Audio)$/i);await ctx.driver.wait(()=>ctx.driver.executeScript('return Array.from(document.querySelectorAll("audio")).some(a=>a.currentTime>0&&!a.error)'),10000);}
          await answer(ctx,ui,{skill});await ui.button(/^Hoàn thành & Nộp.*$/i);
        }
        const index=['READING','WRITING','SPEAKING','LISTENING'].indexOf(skill);
        const next=['READING','WRITING','SPEAKING','LISTENING'][index+1];
        await ui.path(next?`/student/assignments/${next.toLowerCase()}/${item.id}`:`/student/submissions/${submission.id}`);
        const detail=await ctx.pool.get('student',`/submissions/${submission.id}`);await ctx.evidence(`after-${skill}`,detail);assert.equal(detail.modules.length,4);assert.ok(['SUBMITTED','GRADED'].includes(detail.modules.find(m=>m.moduleId===modules[skill]).status));
        if(next)assert.equal(detail.status,'IN_PROGRESS','Parent must stay IN_PROGRESS until last module');
      });
    }
    await ctx.step('Read back all four answers and confirm only one attempt',async()=>{assert.equal((await attempts(ctx,item)).length,1);const detail=await verifySubmitted(ctx,item);for(const m of detail.modules){const stored=await ctx.pool.get('student',`/submission-modules/${m.id}`);await ctx.evidence(`stored-${m.skill}`,stored);assert.ok(stored.answers?.length);if(m.skill==='WRITING')assert.ok(stored.answers.some(a=>a.docStorageKey&&a.docUploadStatus==='READY'));else if(m.skill==='SPEAKING')assert.ok(stored.answers.some(a=>a.audioStorageKey&&a.audioUploadStatus==='READY'));else assert.ok(stored.answers.some(a=>a.content?.text==='apple'));}});
  },async ctx=>{
    const item=await ctx.pool.assignment('READING',{status:'DRAFT'});const modules={READING:item.moduleId};
    for(const [index,skill] of ['WRITING','SPEAKING','LISTENING'].entries()){
      const m=await ctx.pool.request('teacher','POST',`/assignments/${item.id}/modules`,{skill,taskType:skill==='WRITING'?'ESSAY':skill==='SPEAKING'?'RECORDING':'QUIZ',orderIndex:index+2,instructions:`QA30 ${skill} synthetic task`,maxScore:10});modules[skill]=m.id;
      if(skill==='LISTENING'){
        const u=await ctx.pool.request('teacher','POST',`/modules/${m.id}/audio`,{mimeType:'audio/wav'});const put=await fetch(u.uploadUrl,{method:'PUT',headers:{'Content-Type':'audio/wav'},body:await readFile(await ctx.pool.wav()),signal:AbortSignal.timeout(25000)});assert.ok(put.ok);await ctx.pool.request('teacher','POST',`/modules/${m.id}/audio/confirm`,{storageKey:u.storageKey});
        await ctx.pool.request('teacher','POST',`/modules/${m.id}/questions`,{content:'QA30 type apple',questionType:'SHORT_ANSWER',correctAnswer:{correctAnswer:'apple'},score:10,orderIndex:1});
      }
    }
    await ctx.pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'PUBLISHED'});return{item,modules};
  })}
];
for(const skill of ['READING','LISTENING'])checks.push({
  id:`QA30-${skill}-MCQ`,requirement:skill==='READING'?'UC18 / EAM-4761,4763':'UC19 / EAM-4764',title:`${skill}: MCQ choices, navigation, answer change and persisted submission`,
  procedure:scenario('student',async(ctx,ui,{item})=>{
    await ctx.step('Open dedicated MCQ attempt and verify all four options',async()=>{await ctx.driver.get(`${baseUrl}/student/assignments/${item.id}/overview`);await(await ui.visible('.overview-cta-btn')).click();await ui.visible('.exam-option-item');assert.equal((await ctx.driver.findElements(By.css('.exam-option-item'))).length,4);if(skill==='LISTENING'){await ui.button(/^(Phát âm thanh|Phát|Play|Phát audio|Play Audio)$/i);await ctx.driver.wait(()=>ctx.driver.executeScript('return Array.from(document.querySelectorAll("audio")).some(a=>a.currentTime>0&&!a.error)'),10000);}});
    await ctx.step('Select wrong option, change to correct option, navigate away and back',async()=>{let options=await ctx.driver.findElements(By.css('.exam-option-item'));await options[1].click();await ctx.driver.wait(async()=>/is-selected/.test(await options[1].getAttribute('class')),3000);await options[0].click();await ui.button(/^Câu sau$/);options=await ctx.driver.findElements(By.css('.exam-option-item'));await options[0].click();await ui.button(/^Câu trước$/);assert.match(await(await ui.visible('.exam-option-item')).getAttribute('class'),/is-selected/);});
    await ctx.step('Submit via UI; both persisted question IDs must contain option 1',async()=>{await ui.button(/^Hoàn thành & Nộp.*$/i);const detail=await verifySubmitted(ctx,item);const stored=await ctx.pool.get('student',`/submission-modules/${detail.modules[0].id}`);await ctx.evidence('mcq-readback',stored);assert.equal(stored.answers.length,2);for(const q of item.questions)assert.deepEqual(stored.answers.find(a=>a.questionId===q.id)?.content?.selectedOptionIds,[1]);});
  },async ctx=>{
    const item=await ctx.pool.assignment(skill,{status:'DRAFT',questions:0});
    for(let index=0;index<2;index++)item.questions.push(await ctx.pool.request('teacher','POST',`/modules/${item.moduleId}/questions`,{content:`QA30 MCQ ${index+1}: choose apple`,questionType:'MULTIPLE_CHOICE',correctAnswer:{options:['apple','orange','banana','pear'].map((content,i)=>({id:i+1,content,isCorrect:i===0}))},score:5,orderIndex:index+1}));
    await ctx.pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'PUBLISHED'});return{item};
  })
});
const requested=process.argv.slice(2);
for(const id of requested)assert.ok(checks.some(c=>c.id===id),`Unknown check ${id}`);
const selected=requested.length?checks.filter(c=>requested.includes(c.id)):checks;
const run={runId,baseUrl,apiBase,total:selected.length,results:[]};
try{
  await pool.init();
  for(const {procedure,...test} of selected){const result=await executeCase(test,procedure,{output,baseUrl,pool,secrets,buildDriver});run.results.push(result);await report(output,run);console.log(`${result.status} ${result.id} ${result.reason??''}`);}
}catch(error){run.setupError=error.message;}
finally{
  run.cleanupErrors=await pool.cleanup();run.retainedFixtures=pool.resources.filter(r=>r.state==='ARCHIVED');run.finishedAt=new Date().toISOString();run.status=run.setupError?'BLOCKED':run.results.some(r=>r.status!=='PASSED')?'FAILED':'PASSED';await report(output,run);await writeFile(join(output,'run.log'),run.results.map(r=>`${r.id} ${r.status} ${r.reason??''}`).join('\n'));console.log(output);process.exitCode=run.setupError||run.cleanupErrors.length||run.results.length!==selected.length||run.results.some(r=>r.status!=='PASSED')?1:0;
}
