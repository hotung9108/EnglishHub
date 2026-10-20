// Read-only staging survey: login + GET only; no fixture setup or submit actions.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {By} from 'selenium-webdriver';
import {root,loadConfig,loadLocalEnv} from '../config/env.js';
import {createDriver} from '../utils/browser-factory.js';
import {LoginPage} from '../pages/auth/LoginPage.js';
import {prepareAdminRuntime} from '../support/admin/runtime.js';
import {StagingApi} from '../support/teacher/expanded-api.js';
import {sanitize} from '../utils/reporter.js';
loadLocalEnv();const config={...loadConfig(),headless:true};
const api=new StagingApi(config);const request=api.request.bind(api);
api.request=(role,method,endpoint,...args)=>{if(method!=='GET'&&endpoint!=='/auth/login')throw new Error('Survey forbids mutation');return request(role,method,endpoint,...args);};
const dir=path.join(root,'.cache',`qa31-ui-map-${new Date().toISOString().replace(/[:.]/g,'-')}`);await fs.mkdir(dir,{recursive:true});
const result={capturedAt:new Date().toISOString(),pages:[],api:{}};let driver,runtime;
try{
 runtime=await prepareAdminRuntime(root);
 await api.login('admin');
 for(const [key,url] of Object.entries({users:'/admin/users?limit=1',classes:'/classes?limit=1',gradings:'/gradings?limit=1'})){
  try{const data=await api.get('admin',url);result.api[key]={pagination:data.pagination,firstId:data.data?.[0]?.id,firstFields:data.data?.[0]?Object.keys(data.data[0]):[]};}catch(e){result.api[key]={status:e.status,error:e.message};}
 }
 driver=await createDriver(config);const login=new LoginPage(driver,config);await login.open();await login.login(config.users.admin,'admin');await login.waitForRole('admin');
 const scripts=await driver.executeScript('return [...document.scripts].map(s=>s.src).filter(Boolean)');result.bundles=[];
 for(const src of scripts){if(new URL(src).origin!==config.baseUrl)continue;const r=await fetch(src);const b=Buffer.from(await r.arrayBuffer());const name=path.basename(new URL(src).pathname);await fs.writeFile(path.join(dir,name),b);result.bundles.push({name,sha256:crypto.createHash('sha256').update(b).digest('hex')});}
 const allPages=[['dashboard','/admin/dashboard'],['accounts','/admin/accounts'],['classes','/admin/classes'],['teachers','/admin/teachers'],['students','/admin/students'],['reports','/admin/reports'],['audit','/admin/audit/gradings'],['settings','/admin/settings'],['class-create','/admin/classes/create','/admin/classes',/Tạo.*lớp|Thêm.*lớp|Add.*Class|Create.*Class/i],['teacher-create','/admin/teachers/create','/admin/teachers',/Thêm.*(giảng|giáo).*viên|Add.*Teacher/i],['student-create','/admin/students/create','/admin/students',/Thêm.*học viên|Add.*Student/i],['class-archive','/admin/classes/archive','/admin/classes',/lưu trữ|Archive/i]];
 const details=[['account-drawer','/admin/accounts','/admin/accounts',/^Sửa$|^Edit$/i],['class-detail','/admin/classes/','/admin/classes',/Quản lý lớp|Manage Class|Chi tiết/i],['teacher-detail','/admin/teachers/','/admin/teachers',/Xem chi tiết|View Details/i],['student-detail','/admin/students/','/admin/students',/^Chi tiết$|View Details/i],['audit-drawer','/admin/audit/gradings','/admin/audit/gradings',/Xem lịch sử sửa điểm|Audit Logs/i]];
 const pages=process.argv.includes('--details-only')?details:process.argv.includes('--forms-only')?allPages.slice(8):allPages.slice(0,8);
 for(const [name,route,entry,buttonPattern] of pages){
  console.log('Survey: '+name);
  for(const close of await driver.findElements(By.css('.adm-drawer-header button'))) if(await close.isDisplayed()) await close.click();
  await driver.wait(async()=>!(await driver.findElements(By.css('.adm-drawer-backdrop'))).length,10000);
  const link=await driver.findElement(By.css(`aside a[href="${entry||route}"]`));await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',link);await link.click();
  if(entry){await driver.wait(async()=>new URL(await driver.getCurrentUrl()).pathname===entry,30000);let action;await driver.wait(async()=>{for(const button of await driver.findElements(By.css('main button,main a')))if(buttonPattern.test((await button.getText())||await button.getAttribute('title')||'')){action=button;return true;}return false;},20000,'Read-only entry '+name);await action.click();}
  await driver.wait(async()=>{const p=new URL(await driver.getCurrentUrl()).pathname;return route.endsWith('/')?p.startsWith(route)&&/^\d+$/.test(p.slice(route.length)):p===route;},30000);
  let prior='',same=0;
  await driver.wait(async()=>{const text=await driver.findElement(By.css('main')).getText();const loading=await driver.findElements(By.css('main .animate-spin,main .animate-pulse,main .eh-skeleton'));same=text===prior&&!loading.length&&text.length>50&&!/Đang tải|Loading/.test(text)?same+1:0;prior=text;return same>=2;},25000,'Survey readiness',500).catch(()=>{});
  const snap=await driver.executeScript(`const main=document.querySelector('main');const c=main.cloneNode(true);c.querySelectorAll('script,input[type=password]').forEach(e=>e.remove());return {text:main.innerText,html:c.outerHTML,controls:[...main.querySelectorAll('input,select,textarea,button,a')].map(e=>({tag:e.tagName,id:e.id,classes:e.className,type:e.type,label:e.innerText||e.getAttribute('aria-label')||e.title,placeholder:e.getAttribute('placeholder'),href:e.getAttribute('href'),options:e.tagName==='SELECT'?[...e.options].map(o=>({value:o.value,label:o.text})):undefined}))};`);
  await fs.writeFile(path.join(dir,name+'.txt'),sanitize(snap.text,config.users));await fs.writeFile(path.join(dir,name+'.html'),sanitize(snap.html,config.users));await fs.writeFile(path.join(dir,name+'.png'),await driver.takeScreenshot(),'base64');result.pages.push({name,route,actualRoute:new URL(await driver.getCurrentUrl()).pathname,controls:snap.controls});
 }
}catch(e){result.error=sanitize(e.message,config.users);process.exitCode=1;}
finally{await driver?.quit().catch(()=>{});await runtime?.cleanup();await fs.writeFile(path.join(dir,'inventory.json'),sanitize(JSON.stringify(result,null,2),config.users));console.log(JSON.stringify({saved:path.relative(root,dir),pages:result.pages.length,error:result.error}));}
