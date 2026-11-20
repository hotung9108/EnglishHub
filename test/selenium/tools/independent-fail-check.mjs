import '../config/runtime.js';
import {Builder,By,Key} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {FixturePool} from '../common/fixtures/pool.js';
import {UI} from '../common/ui/ui.js';
const output=resolve('test/selenium/reports/independent-fail-check-'+new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(output,{recursive:true});
const secrets=Object.entries(process.env).filter(([k])=>/PASSWORD|TOKEN|SECRET/.test(k)).map(([,v])=>v);
const pool=new FixturePool({apiBase:'https://api-staging.hotung9108.me/api/v1',admin:{email:process.env.SELENIUM_ADMIN_EMAIL,password:process.env.SELENIUM_ADMIN_PASSWORD},output,secrets});
let driver;const observations=[];
async function save(name,data){observations.push({name,at:new Date().toISOString(),data});await writeFile(join(output,'observations.json'),JSON.stringify(observations,null,2));console.log(name);}
async function capture(name){await writeFile(join(output,name+'.png'),await driver.takeScreenshot(),'base64');await save(name,{url:await driver.getCurrentUrl(),text:await driver.findElement(By.css('body')).getText()});}
async function type(css,value){const e=await driver.wait(async()=>{for(const e of await driver.findElements(By.css(css)))if(await e.isDisplayed())return e;return false},12000);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',e);await e.click();await e.sendKeys(Key.chord(Key.CONTROL,'a'));await e.sendKeys(Key.BACK_SPACE);if(value)await e.sendKeys(value);await e.sendKeys(Key.TAB);return e;}
async function button(pattern){for(const e of await driver.findElements(By.css('main button,main a')))if(await e.isDisplayed()&&pattern.test((await e.getText()).trim())){await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',e);await e.click();return;}throw Error('No button '+pattern);}
async function login(role){await driver.get('https://staging.hotung9108.me/login');await type('#login-email',pool.users[role].email);await type('#login-password',pool.users[role].password);await driver.findElement(By.css('form.login-form button[type=submit]')).click();await driver.wait(async()=>new URL(await driver.getCurrentUrl()).pathname===`/${role}/dashboard`,15000);}
async function inventory(name){await capture(name);const controls=[];for(const e of await driver.findElements(By.css('main button,main a')))if(await e.isDisplayed())controls.push({text:await e.getText(),title:await e.getAttribute('title'),label:await e.getAttribute('aria-label'),href:await e.getAttribute('href')});await save(name+'-controls',controls);}
try{
 await pool.init();driver=await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options().addArguments('--window-size=1440,1100')).build();await driver.manage().setTimeouts({pageLoad:30000});
 const ui=new UI({driver,pool,baseUrl:'https://staging.hotung9108.me'});
 if(!process.argv.includes('--mcq-only')){
 await login('admin');await ui.open('/admin/teachers');await button(/^(Thêm giáo viên|Thêm giảng viên|Add Teacher)$/i);
 await type('main input[placeholder="Nguyễn Văn A..."]','Independent Required Email');await type('main input[type=password]','Independent7Password');const email=await type('main input[type=email]','');
 await capture('teacher-empty-email-before');let next;for(const e of await driver.findElements(By.css('main button')))if(/Tiếp theo|Next/i.test(await e.getText()))next=e;
 await save('teacher-empty-email-control',{enabled:await next.isEnabled(),required:await email.getAttribute('required'),ariaInvalid:await email.getAttribute('aria-invalid')});
 if(await next.isEnabled())await next.click();await capture('teacher-empty-email-after-click');
 await email.click();await email.sendKeys(Key.ENTER);await capture('teacher-empty-email-after-enter');
 await login('teacher');const item=await pool.assignment('READING');await pool.submitted(item);
 await ui.open('/teacher/assignments');await ui.select('.teacher-hero-actions select',pool.class.id);await type('input.teacher-search-input',item.title);await ui.has(new RegExp(item.title));await inventory('delete-list');
 for(const e of await driver.findElements(By.css('.teacher-assignment-card h3')))if((await e.getText())===item.title){await e.click();break;}await ui.path(`/teacher/assignments/${item.id}`);await ui.ready();await inventory('delete-detail');
 await button(/^(Chỉnh sửa bài tập|Edit Assignment)$/i);await ui.visible('.assignment-edit-title-input');await inventory('delete-edit');
 }else await login('teacher');
 const resource={type:'assignment',title:pool.prefix+'-IndependentMCQ',classId:pool.class.id,owner:'teacher',state:'RESERVED'};pool.resources.push(resource);await pool.journal();
 await ui.open('/teacher/assignments/create');await ui.visible('.assignment-edit-title-input');await ui.select('.assignment-edit-header select',pool.class.id);await type('.assignment-edit-title-input',resource.title);await button(/^(Thêm module|Add Module)$/i);await button(/Thêm phần .*\(Reading\)|Add Reading Module/i);
 await driver.actions().move({origin:await ui.visible('.tae-module-chip.skill-writing')}).perform();await driver.findElement(By.css('.tae-module-chip.skill-writing button.delete')).click();
 await type('input[placeholder="THE EVOLUTION OF PRINTING & TYPOGRAPHY"],input[placeholder*="RENEWABLE ENERGY"]','Independent keyboard reading');
 let paras=await driver.findElements(By.css('textarea'));if(!paras.length)await button(/Thêm đoạn văn mới|Add Paragraph/i);
 // Read the actual form controls before selecting passage and MCQ fields.
 await save('reading-fields',await driver.executeScript('return Array.from(document.querySelectorAll("main input,main textarea")).map(e=>({tag:e.tagName,type:e.type,placeholder:e.placeholder,value:e.value}))'));
 const passage=await driver.findElements(By.css('main textarea'));for(const e of passage)if(await e.isDisplayed()){await e.click();await e.sendKeys('An apple is a fruit. Daily practice helps students.');break;}
 await button(/^Trắc nghiệm$|^Multiple Choice$/i);await type('input[placeholder="Enter question statement..."],input[placeholder="Nhập nội dung câu hỏi..."]','Which fruit is mentioned?');
 const opt=letter=>`input[placeholder^="Lựa chọn ${letter}"],input[placeholder^="Option ${letter}"]`;
 for(const [letter,value] of [['A','apple'],['B','banana'],['C','orange'],['D','pear']]){const e=await type(opt(letter),value);await save('keyboard-option-'+letter,{requested:value,actual:await e.getAttribute('value')});}
 await capture('mcq-keyboard-default-correct-A');
 const firstRadio=await driver.findElement(By.css('.question-option-row input[type=radio]'));await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',firstRadio);await firstRadio.click();
 await button(/^Lưu bản nháp$|^Save Draft$/i);await ui.path('/teacher/assignments');
 const list=await pool.get('teacher',`/classes/${pool.class.id}/assignments?limit=100`);const found=list.data.find(a=>a.title===resource.title);if(!found)throw Error('Draft was not saved');Object.assign(resource,{id:found.id,state:'CREATED'});await pool.journal();
 const modules=await pool.get('teacher',`/assignments/${found.id}/modules`);await save('keyboard-draft-readback',{assignment:await pool.get('teacher',`/assignments/${found.id}`),questions:await pool.get('teacher',`/modules/${modules.data[0].id}/questions`)});
 await ui.open(`/teacher/assignments/${found.id}/edit`);await ui.visible(opt('A'));await capture('mcq-persisted-reopened');
 const radios=await driver.findElements(By.css('.question-option-row input[type=radio]'));await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',radios[1]);await radios[1].click();await type(opt('A'),'apple');await capture('mcq-keyboard-A-while-B-correct');await save('keyboard-A-unselected',{actual:await driver.findElement(By.css(opt('A'))).getAttribute('value')});
 await radios[0].click();await capture('mcq-switch-correct-back-A');await save('keyboard-options-final',await driver.executeScript('return Array.from(document.querySelectorAll(".question-option-row")).map(e=>({text:e.innerText,values:Array.from(e.querySelectorAll("input")).map(i=>({type:i.type,value:i.value,checked:i.checked}))}))'));
}catch(e){await save('probe-error',{name:e.name,message:e.message});if(driver)await capture('probe-error-screen').catch(()=>{});}
finally{if(driver)await driver.quit();await save('cleanup',{errors:await pool.cleanup(),retained:pool.resources.filter(r=>r.state==='ARCHIVED'),remaining:pool.resources.filter(r=>!['DELETED','ARCHIVED'].includes(r.state))});}
