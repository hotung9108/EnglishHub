import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {root,loadConfig,loadLocalEnv} from './config/env.js';
import {createDriver} from './utils/browser-factory.js';
import {LoginPage} from './pages/auth/LoginPage.js';
import {AdminPage} from './pages/admin/AdminPage.js';
import {adminCases} from './tests/admin/cases.js';
import {prepareFixtures,assertStaging} from './support/admin/fixtures.js';
import {parseOptions,classify} from './support/admin/options.js';
import {prepareAdminRuntime,probeStudentBrowser} from './support/admin/runtime.js';
import {checkStagingAvailability} from './support/admin/staging-health.js';
import {summarizeNetwork} from './support/admin/network.js';
import {writeSuiteReport} from './utils/suite-reporter.js';
import {sanitize} from './utils/reporter.js';

loadLocalEnv();
const options=parseOptions(process.argv.slice(2),adminCases);
if(options.list||options.checkOnly) {
  for(const t of options.selected)console.log(`${t.id} | ${t.title}`);
  if(options.checkOnly){assertStaging(loadConfig());console.log('CHECK OK: registry/config only. No network, browser, fixture or staging tests executed.');}
} else {
  await run();
}
async function run() {
 const config={...loadConfig(),captureNetwork:true,headless:!options.watch};assertStaging(config);
 config.observeMs=options.watch?options.observeMs:0;
 const startedAt=new Date().toISOString(), directory=path.join(root,'reports',`qa31-${startedAt.replace(/[:.]/g,'-')}`);
 const report={suite:{id:'QA-31',role:'Admin',key:'QA31.Admin'},testRevision:'2026-10-20-admin-r7',startedAt,status:'RUNNING',mode:'STAGING Selenium UI',baseUrl:config.baseUrl,browser:config.browser,headless:config.headless,observeMs:config.observeMs,selectedCases:options.selected.map(t=>t.id),cases:[],scope:'Admin account role creation/search, classes/roster/content read, Reports date/class/teacher filters, Audit status/history, owned QA Student status, system settings availability/persistence and Admin content entry. Content CRUD scope remains documented; failed cases require review and no issues are published automatically.'};
 const safe=v=>sanitize(String(v),config.users);
 let runtime,driver,lock,data,stop=false;
 const lockPath=path.join(root,'.cache/qa31.lock');
 process.once('SIGINT',()=>{stop=true;driver?.quit().catch(()=>{});});
 try {
  await fs.mkdir(path.dirname(lockPath),{recursive:true});
  try {lock=await fs.open(lockPath,'wx');await lock.writeFile(JSON.stringify({pid:process.pid,startedAt}));}
  catch(e){if(e.code==='EEXIST')throw new Error('QA31 đang chạy hoặc còn lock sau lần dừng đột ngột. Đóng tiến trình QA31 cũ trước; xem .cache/qa31.lock.');throw e;}
  await fs.mkdir(directory,{recursive:true});
  runtime=await prepareAdminRuntime(root);report.runtime={storage:runtime.storage};report.phase='preflight';
  console.log('Preflight: kiểm tra staging và Chrome trước khi tạo dữ liệu...');
  report.health=await checkStagingAvailability(config);report.browserProbe=await probeStudentBrowser(config);
  report.sourceHashes={};
  async function snapshot(relative) {
   const source=path.join(root,relative), stat=await fs.stat(source);
   if(stat.isDirectory()){for(const item of await fs.readdir(source))await snapshot(path.join(relative,item));}
   else {const bytes=await fs.readFile(source),dest=path.join(directory,'source-snapshot',relative);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,bytes);report.sourceHashes[relative.replaceAll('\\','/')]=crypto.createHash('sha256').update(bytes).digest('hex');}
  }
  for(const f of ['run-admin.js','tests/admin','pages/admin','pages/auth','pages/BasePage.js','support/admin','utils/browser-factory.js','utils/suite-reporter.js','support/teacher/expanded-api.js','config/env.js','utils/reporter.js'])await snapshot(f);
  report.phase='fixtures';console.log('Chuẩn bị dữ liệu QA31 riêng cho các case đã chọn; không sửa dữ liệu thật...');
  data=await prepareFixtures(config,options.selected,directory);report.fixtureErrors=data.errors;
  for(const test of options.selected) {
   if(stop)break;
   const result={id:test.id,title:test.title,steps:test.steps,expected:test.expected,issueRefs:test.issueRefs,startedAt:new Date().toISOString(),evidence:[]};report.cases.push(result);
   config.observeCase=test.id;config.onStep=label=>{console.log(`[${test.id}] ${label}`);result.evidence.push({at:new Date().toISOString(),step:label});};
   console.log(`\n${test.id} ${test.title}`);const apiStart=data.api.events.length;
   try {
    const missing=(test.resources||[]).filter(k=>!data[k]);
    if(missing.length)throw Object.assign(new Error(`Fixture chưa sẵn sàng: ${missing.map(k=>k+': '+(data.errors[k]||'missing')).join('; ')}`),{code:'QA31_FIXTURE'});
    result.phase='driver';driver=await createDriver(config);result.browserVersion=(await driver.getCapabilities()).get('browserVersion');
    result.phase='login';const login=new LoginPage(driver,config);await login.open();await login.login(config.users.admin,'admin');await login.waitForRole('admin');
    const page=new AdminPage(driver,config);await page.ready();
    if(!report.stagingScripts) {
     report.stagingScripts=await driver.executeScript('return [...document.scripts].map(s=>s.src).filter(Boolean)');report.stagingBundles=[];
     for(const url of report.stagingScripts)if(new URL(url).origin===config.baseUrl) {
      try {const response=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const bytes=Buffer.from(await response.arrayBuffer());report.stagingBundles.push({url,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
      catch(e){report.stagingBundles.push({url,error:safe(e.message)});}
     }
    }
    result.phase='scenario';await test.run(page,data,result);result.status='PASSED';result.classification='ASSERTIONS_PASSED';
   } catch(e) {
    result.status=stop?'ABORTED':['QA31_BLOCKED','QA31_FIXTURE','QA31_SCOPE'].includes(e.code)?'BLOCKED':'FAILED';result.classification=classify(e,result.phase);result.reason=safe(e.message);result.dependsOn=e.dependsOn;
    if(e.status)result.httpError={status:e.status,endpoint:e.endpoint,method:e.method};
    if(result.phase==='driver'||result.phase==='login')stop=true;
   } finally {
    if(driver) {
     try {
      result.actualUrl=await driver.getCurrentUrl();
      await driver.executeScript(`document.querySelectorAll('input[type=password]').forEach(e=>{e.value='';e.setAttribute('value','');});document.getElementById('qa29-observer')?.remove();`);
      result.screenshot=`${test.id}.png`;await fs.writeFile(path.join(directory,result.screenshot),await driver.takeScreenshot(),'base64');
      const dom=await driver.executeScript(`const c=document.documentElement.cloneNode(true);c.querySelectorAll('script').forEach(e=>e.remove());c.querySelectorAll('input[type=password]').forEach(e=>e.removeAttribute('value'));return c.outerHTML;`);
      result.dom=`${test.id}.html`;await fs.writeFile(path.join(directory,result.dom),safe(dom));
     }catch(e){result.evidenceError=safe(e.message);}
     try{result.browserNetwork=summarizeNetwork(await driver.manage().logs().get('performance'));}catch(e){result.networkEvidenceError=safe(e.message);}
     try{await driver.quit();}catch(e){result.cleanupError=safe(e.message);}driver=undefined;
    }
    result.apiObservations=data.api.events.slice(apiStart).filter(e=>e.endpoint!=='/auth/login');result.finishedAt=new Date().toISOString();
    console.log(`${result.status} ${result.reason||''}`);
    await fs.writeFile(path.join(directory,'fixture-ledger.json'),JSON.stringify({resources:data.ledger,errors:data.errors},null,2));
    await writeSuiteReport(directory,report,config.users);
   }
  }
  report.status=stop?'INTERRUPTED':'COMPLETED';
 } catch(e) {report.status='BLOCKED';report.reason=safe(e.message);report.classification=classify(e,report.phase);report.health=e.healthChecks||report.health;console.log(report.reason);}
 finally {
  await driver?.quit().catch(()=>{});await runtime?.cleanup().catch(e=>{report.runtimeCleanupError=safe(e.message);});
  if(lock){await lock.close();await fs.unlink(lockPath).catch(()=>{});}
  report.finishedAt=new Date().toISOString();await writeSuiteReport(directory,report,config.users);
  if(lock)await fs.writeFile(path.join(root,'reports/latest-qa31.json'),JSON.stringify({directory,report:path.join(directory,'report.html'),status:report.status},null,2));
  console.log(`REPORT: ${path.join(directory,'report.html')}`);
  process.exitCode=report.cases.some(c=>c.status==='FAILED')?1:report.status!=='COMPLETED'||report.cases.some(c=>c.status!=='PASSED')?2:0;
 }
}
