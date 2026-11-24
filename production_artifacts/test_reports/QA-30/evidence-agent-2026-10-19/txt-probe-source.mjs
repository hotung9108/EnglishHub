// Explicitly authorized diagnostic: submits only a synthetic TXT on a fresh QA30 assignment.
import fs from 'node:fs/promises';
import path from 'node:path';
import {By} from 'selenium-webdriver';
import {root,loadConfig,loadLocalEnv} from '../config/env.js';
import {prepareStudent,latestAttempt} from '../support/student/fixtures.js';
import {prepareStudentRuntime,probeStudentBrowser} from '../support/student/runtime.js';
import {checkStagingAvailability} from '../support/student/staging-health.js';
import {createDriver} from '../utils/browser-factory.js';
import {LoginPage} from '../pages/auth/LoginPage.js';
import {StudentPage} from '../pages/student/StudentPage.js';
import {sanitize} from '../utils/reporter.js';
import {summarizeNetwork} from '../support/student/network.js';
loadLocalEnv(); const config={...loadConfig(),headless:true,captureNetwork:true,dataTimeoutMs:30000};
const dir=path.join(root,'reports',`qa30-diagnostic-txt-${new Date().toISOString().replace(/[:.]/g,'-')}`);
await fs.mkdir(dir,{recursive:true});
let runtime,driver,data;
const result={kind:'DIAGNOSTIC_OBSERVATIONS_NOT_A_SUITE_VERDICT',startedAt:new Date().toISOString(),steps:[],scope:'Fresh synthetic QA30 TXT through UI; determine validation versus missing upload. No claim that SUBMITTED implies TXT stored.'};
try{
  runtime=await prepareStudentRuntime(root);await checkStagingAvailability(config);await probeStudentBrowser(config);
  data=await prepareStudent(config,{fresh:true,caseId:'QA30-038',progress:m=>console.log(m)});
  result.fixture={classId:data.classId,assignmentId:data.assignments.draft.id,moduleId:data.assignments.draft.moduleId};
  driver=await createDriver(config);const login=new LoginPage(driver,config);
  await login.open();await login.login(config.users.student,'student');await login.waitForRole('student');
  const page=new StudentPage(driver,config,data);await page.start(data.assignments.draft);
  const startRoute=new URL(await driver.getCurrentUrl()).pathname;
  await driver.findElement(By.css('input[type="file"]')).sendKeys(path.join(root,'fixtures/qa30-invalid-upload.txt'));
  await page.waitFor(async()=> (await page.text()).includes('qa30-invalid-upload.txt') || /Định dạng.*không.*hỗ trợ/i.test(await page.text()),'TXT selection settled',5000);
  result.beforeText=await page.text();result.submissionId=page.activeSubmissionId;
  await fs.writeFile(path.join(dir,'before-submit.png'),await driver.takeScreenshot(),'base64');
  result.steps.push('Selected only synthetic TXT; editor left blank to isolate selected-file handling');
  await page.clickButton('Nộp bài');result.steps.push('Clicked UI Submit once');
  try{await page.waitFor(async()=>new URL(await driver.getCurrentUrl()).pathname!==startRoute || /Vui lòng|Định dạng.*không.*hỗ trợ/i.test(await page.text()),'submit redirect or validation',15000);}catch(e){result.navigationWait=e.message;}
  const snapshot=await latestAttempt(data,data.assignments.draft,{submissionId:page.activeSubmissionId});
  result.readback={submissionId:snapshot.submission.id,status:snapshot.submission.status,moduleStatus:snapshot.module.status,answers:snapshot.module.answers||[]};
  result.afterText=await page.text();result.actualUrl=await driver.getCurrentUrl();
  const answers=result.readback.answers;
  result.txtStorageConfirmed=answers.some(a=>a.docStorageKey&&a.docUploadStatus==='READY'&&a.docMimeType==='text/plain');
  result.interpretation=result.txtStorageConfirmed?'API reports a READY text/plain document; inspect storage/contract before declaring forbidden format accepted.': 'No READY text/plain document in readback. SUBMITTED alone does not prove TXT was uploaded or accepted by storage.';
}catch(e){result.error={message:e.message,status:e.status};process.exitCode=1;}
finally{
  if(driver){
    try{result.network=summarizeNetwork(await driver.manage().logs().get('performance'));await fs.writeFile(path.join(dir,'after-submit.png'),await driver.takeScreenshot(),'base64');const dom=await driver.executeScript('return document.querySelector("main")?.outerHTML||""');await fs.writeFile(path.join(dir,'after-submit.html'),sanitize(dom,config.users));}catch(e){result.evidenceError=e.message;}
    await driver.quit().catch(()=>{});
  }
  await runtime?.cleanup();result.finishedAt=new Date().toISOString();
  const safe=JSON.parse(sanitize(JSON.stringify(result),config.users));
  await fs.writeFile(path.join(dir,'observations.json'),JSON.stringify(safe,null,2));
  console.log(JSON.stringify({directory:dir,error:safe.error,readback:safe.readback,txtStorageConfirmed:safe.txtStorageConfirmed,mutations:safe.network?.filter(n=>['POST','PUT','PATCH'].includes(n.method)),interpretation:safe.interpretation},null,2));
}
