// Read-only follow-up: distinguish UI creation from search failures on the same users.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {root,loadConfig,loadLocalEnv} from '../config/env.js';
import {createDriver} from '../utils/browser-factory.js';
import {LoginPage} from '../pages/auth/LoginPage.js';
import {AdminPage} from '../pages/admin/AdminPage.js';
import {StagingApi} from '../support/teacher/expanded-api.js';
import {prepareAdminRuntime} from '../support/admin/runtime.js';
import {summarizeNetwork} from '../support/admin/network.js';
import {sanitize} from '../utils/reporter.js';

const run=process.argv[2];assert.match(run||'',/^qa31-\d{4}-\d{2}-\d{2}T[\dTZ-]+$/);
const directory=path.join(root,'reports',run);
const summary=JSON.parse(await fs.readFile(path.join(directory,'summary.json'),'utf8'));
assert.equal(summary.status,'COMPLETED','Wait for the original retest to finish');
const ledger=JSON.parse(await fs.readFile(path.join(directory,'fixture-ledger.json'),'utf8'));
const targets=ledger.resources.filter(x=>x.kind==='ui-user');assert.ok(targets.length);
for(const user of targets)assert.match(user.email,/^qa31-[a-f0-9]+-(admin|teacher|student)-accounts-ui@example\.invalid$/);
loadLocalEnv();const config={...loadConfig(),headless:true,captureNetwork:true,observeMs:0};
assert.equal(config.baseUrl,'https://staging.hotung9108.me');
const api=new StagingApi(config),request=api.request.bind(api);
api.request=(role,method,endpoint,...args)=>{assert.ok(method==='GET'||method==='POST'&&endpoint==='/auth/login','Follow-up forbids mutations');return request(role,method,endpoint,...args);};
const observations={startedAt:new Date().toISOString(),sourceRun:run,scope:'Read-only UI search on accounts already created by Selenium; no new fixtures or user mutations',checks:[]};
let driver,runtime;
try {
  runtime=await prepareAdminRuntime(root);await api.login('admin');driver=await createDriver(config);
  const login=new LoginPage(driver,config);await login.open();await login.login(config.users.admin,'admin');await login.waitForRole('admin');
  const page=new AdminPage(driver,config);await page.ready();
  for(const target of targets) {
    const list=await api.get('admin',`/admin/users?q=${encodeURIComponent(target.email)}&limit=100`);
    const user=list.data?.find(x=>x.id===target.id&&x.email===target.email);assert.ok(user,'Previously UI-created account is not readable');
    assert.equal(user.role,target.role);
    for(const section of ['accounts',user.role==='TEACHER'?'teachers':'students']) {
      await page.nav(section);await page.search(user.email);
      const text=await page.text(),found=text.includes(user.email)&&text.includes(user.fullName);
      const stem=`search-ui-created-${user.id}-${section}`;
      await fs.writeFile(path.join(directory,stem+'.png'),await driver.takeScreenshot(),'base64');
      observations.checks.push({user,section,url:await driver.getCurrentUrl(),found,screenshot:stem+'.png',capturedAt:new Date().toISOString()});
      console.log(`User ${user.id} role=${user.role}, ${section}: ${found?'FOUND':'NOT FOUND'} (API readback verified)`);
    }
  }
  observations.browserNetwork=summarizeNetwork(await driver.manage().logs().get('performance'));
} catch(error) {observations.error=sanitize(error.message,config.users);process.exitCode=1;}
finally {
  await driver?.quit().catch(()=>{});await runtime?.cleanup();observations.finishedAt=new Date().toISOString();
  observations.apiObservations=api.events.filter(e=>e.endpoint!=='/auth/login');
  await fs.writeFile(path.join(directory,'ui-created-user-search-verification.json'),sanitize(JSON.stringify(observations,null,2),config.users));
}
