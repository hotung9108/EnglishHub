import assert from 'node:assert/strict';
import {By,Key,until} from 'selenium-webdriver';
import {BasePage} from '../BasePage.js';

export class AdminPage extends BasePage {
  async step(label,element) { this.config.onStep?.(label); if(this.config.observeMs) {const cb=this.config.onStep; this.config.onStep=undefined;try{await super.step(label,element);}finally{this.config.onStep=cb;}} }
  async text(scope='main') { return (await this.visible(By.css(scope))).getText(); }
  async ready() {
    let old='',stable=0;
    await this.driver.wait(async()=>{
      const t=await this.text();
      const spinning=(await this.driver.findElements(By.css('main .animate-spin,main .animate-pulse'))).length;
      stable=t===old&&!spinning&&!/Đang tải|Loading\.\.\./i.test(t)?stable+1:0;old=t;return stable>=2;
    },this.config.timeout,'Admin page did not finish loading',300);
    assert.doesNotMatch(await this.text(),/404_NOT_FOUND|This page doesn.t exist/,'Hosting returned 404');
  }
  async nav(section) {
    for(const close of await this.driver.findElements(By.css('.adm-drawer-header button')))if(await close.isDisplayed())await this.clickElement(close,'Đóng bảng chi tiết');
    const route='/admin/'+section;
    await this.clickElement(await this.visible(By.css(`aside a[href="${route}"]`)),`Mở ${route}`);
    await this.driver.wait(async()=>new URL(await this.driver.getCurrentUrl()).pathname===route,this.config.timeout);
    await this.ready();
  }
  async button(pattern,scope='main',click=true) {
    let found;
    await this.driver.wait(async()=>{
      const matches=[];
      for(const e of await this.driver.findElements(By.css(`${scope} button,${scope} a`))) {
        if(!await e.isDisplayed())continue;
        const label=(await e.getText()).trim()||await e.getAttribute('title')||await e.getAttribute('aria-label')||'';
        if(pattern.test(label)) matches.push(e);
      }
      assert.ok(matches.length<=1,`Ambiguous button ${pattern}: ${matches.length}`);
      found=matches[0];return !!found;
    },this.config.timeout,`Missing button ${pattern}`);
    if(click)await this.clickElement(found,`Bấm ${pattern}`);return found;
  }
  async fill(element,value,label='Nhập dữ liệu QA') {await this.step(label,element);await element.sendKeys(Key.chord(Key.CONTROL,'a'),Key.BACK_SPACE);if(value)await element.sendKeys(value);}
  async fillDate(element,iso) {
    assert.match(iso,/^\d{4}-\d{2}-\d{2}$/);
    await this.step(`Chọn ngày ${iso}`,element);
    // Native date segments depend on Windows locale and WebDriver focus behavior.
    // Set the UI control through its native setter and emit the same input/change
    // events React observes. No API calls, state injection, or result manipulation.
    await this.driver.executeScript(`
      const input=arguments[0];
      if(input.type!=='date')throw new Error('Expected a native date input');
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      setter.call(input,arguments[1]);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      input.blur();`,element,iso);
    if(await element.getAttribute('value')===iso)return;
    throw Object.assign(new Error(`Browser chưa nhập đúng ngày ${iso}; dừng trước khi đánh giá filter`),{code:'QA31_HARNESS'});
  }
  async field(pattern) {
    for(const label of await this.driver.findElements(By.css('main label,.adm-drawer label')))if(await label.isDisplayed()&&pattern.test(await label.getText())) {
      const fields=await label.findElements(By.xpath('./parent::*//*[self::input or self::select or self::textarea]'));
      if(fields.length===1)return fields[0];
    }
    throw new Error(`Missing or ambiguous labelled field ${pattern}`);
  }
  async select(element,value) {
    let found;
    // Filter options have a separate API lifecycle from report metrics/page text.
    await this.driver.wait(async()=>{
      found=undefined;
      for(const o of await element.findElements(By.css('option')))if(await o.getAttribute('value')===String(value)) {found=o;return true;}
      return false;
    },this.config.timeout,`Dropdown chưa có option ${value} sau khi chờ dữ liệu API`,250);
    await this.clickElement(found,`Chọn giá trị ${value}`);
  }
  async validationErrors() {
    const messages=[];
    for(const e of await this.driver.findElements(By.css('main .adm-alert-banner,main [role=alert],main .field-error,main .input-error-text')))if(await e.isDisplayed())messages.push((await e.getText()).trim());
    return messages.filter(Boolean).join('\n');
  }
  async search(value) {await this.fill(await this.visible(By.css('main input.adm-search-input')),value,'Tìm đúng dữ liệu QA');await this.ready();}
  async rows(scope='main') {const rows=[];for(const r of await this.driver.findElements(By.css(`${scope} tbody tr`)))if(await r.isDisplayed())rows.push(r);return rows;}
  async exactRow(value,scope='main') {
    let target;
    await this.driver.wait(async()=>{for(const r of await this.rows(scope))if((await r.getText()).includes(value)){target=r;return true;}return false;},this.config.timeout,`Không thấy dòng QA ${value}`);return target;
  }
  async rowAction(row,pattern) {
    const found=[];for(const e of await row.findElements(By.css('button,a')))if(pattern.test((await e.getText()).trim()||await e.getAttribute('title')||''))found.push(e);
    assert.equal(found.length,1,`Expected one row action ${pattern}`);await this.clickElement(found[0],`Thao tác trên đúng dòng QA: ${pattern}`);
  }
  async createForm(section) {await this.nav(section);await this.button(section==='classes'?/Tạo lớp học mới|Create New Class/:/Thêm.*(giáo viên|giảng viên|học viên)|Add (Teacher|Student)/);await this.ready();}
  async next() {await this.button(/^Tiếp theo|^Next/);await this.ready();}
  async openClass(c) {
    await this.nav('classes');await this.search(c.name);
    const headers=await this.driver.findElements(By.css('main h3,main h2'));
    let card;
    for(const h of headers)if((await h.getText()).trim()===c.name){card=await h.findElement(By.xpath('./ancestor::*[.//button[contains(.,"Quản lý") or contains(.,"Manage")]][1]'));break;}
    assert.ok(card,`Không thấy thẻ lớp ${c.name}`);
    const buttons=await card.findElements(By.css('button'));let action;
    for(const b of buttons)if(/Quản lý|Manage/.test(await b.getText()))action=b;
    assert.ok(action);await this.clickElement(action,'Quản lý đúng lớp QA');
    await this.driver.wait(async()=>new URL(await this.driver.getCurrentUrl()).pathname===`/admin/classes/${c.id}`,this.config.timeout);
    await this.ready();assert.ok((await this.text()).includes(c.name),'Class identity mismatch');
  }
  async assertIdentity(user,scope='main') {
    const t=await this.text(scope);assert.ok(t.includes(user.email),`Không xác minh được email QA ${user.email}; không thao tác tài khoản`);
    assert.ok(t.includes(user.name),'Tên tài khoản QA không khớp');
  }
  async acceptOptionalConfirm() {
    try {await this.driver.wait(until.alertIsPresent(),1200);await (await this.driver.switchTo().alert()).accept();}
    catch(e){if(e.name!=='TimeoutError'&&e.name!=='NoSuchAlertError')throw e;}
  }
  async selectContainingValue(value,defaultPattern) {
    const found=[];
    for(const s of await this.driver.findElements(By.css('main select'))) {
      for(const o of await s.findElements(By.css('option'))) if(defaultPattern.test(await o.getText())) {found.push(s);break;}
    }
    assert.equal(found.length,1,`Missing/ambiguous select ${defaultPattern}`);await this.select(found[0],value);
  }
  async gradingRow(id) {
    let found;
    await this.driver.wait(async()=>{for(const row of await this.rows()){const cells=await row.findElements(By.css('td'));if(cells.length&&(await cells[0].getText()).trim()===`GR-${id}`){found=row;return true;}}return false;},this.config.timeout,`Missing exact grading GR-${id}`);return found;
  }
  async drawerReady() {
    await this.visible(By.css('.adm-drawer'));
    await this.driver.wait(async()=>!(await this.driver.findElements(By.css('.adm-drawer .animate-spin,.adm-drawer .animate-pulse'))).length&&!/Đang tải|Loading/i.test(await this.text('.adm-drawer')),this.config.timeout,'Drawer did not finish loading',250);
  }
  async metric(pattern) {
    const matches=[];
    for(const label of await this.driver.findElements(By.css('.adm-drawer .label-sm')))if(await label.isDisplayed()&&pattern.test((await label.getText()).trim()))matches.push(label);
    assert.equal(matches.length,1,`Missing/ambiguous drawer metric ${pattern}`);
    return (await (await matches[0].findElement(By.xpath('./following-sibling::*[1]'))).getText()).trim();
  }
}
