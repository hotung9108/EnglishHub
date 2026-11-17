import assert from 'node:assert/strict';
import { By, Key, until } from 'selenium-webdriver';
import { Select } from 'selenium-webdriver/lib/select.js';

export const literal = value => `'${String(value).replaceAll("'", "',\"'\",'")}'`;
export class UI {
  constructor(ctx) { this.ctx = ctx; this.driver = ctx.driver; this.timeout = 10000; }
  async visible(css) {
    return this.driver.wait(async()=>{for(const el of await this.driver.findElements(By.css(css)))try{if(await el.isDisplayed())return el;}catch(e){if(e.name!=='StaleElementReferenceError')throw e;}return false;},this.timeout,`Missing visible control ${css}`);
  }
  async text(css = 'main') { return (await this.visible(css)).getText(); }
  async has(pattern, css = 'main') { return this.driver.wait(async () => pattern.test(await this.text(css)), this.timeout, `Expected visible text ${pattern}`); }
  async button(pattern, scope = 'main', click = true) {
    let match;
    await this.driver.wait(async () => {
      try {
      const matches = [];
      for (const el of await this.driver.findElements(By.css(`:is(${scope}) button,:is(${scope}) a`))) {
        if (await el.isDisplayed()) {
          const names = [(await el.getText()).trim(), await el.getAttribute('title'), await el.getAttribute('aria-label')].filter(Boolean);
          if (names.some(name => pattern.test(name))) matches.push(el);
        }
      }
      assert.ok(matches.length <= 1, `Ambiguous action ${pattern}: ${matches.length}`); match = matches[0]; return !!match;
      } catch(e){if(e.name==='StaleElementReferenceError')return false;throw e;}
    }, this.timeout, `Missing action ${pattern}`);
    if (click) {await this.driver.wait(until.elementIsEnabled(match),this.timeout);await this.driver.executeScript('arguments[0].scrollIntoView({block:"center",inline:"center"})',match);await match.click();}return match;
  }
  async fill(css, value) {
    const el=await this.visible(css);await this.driver.wait(until.elementIsEnabled(el),this.timeout);
    // React controlled fields may rerender/reset selection between keystrokes.
    // Commit the complete value using native DOM setters, as date() does, and
    // dispatch input/change plus real focus/blur so validation is exercised.
    await this.driver.executeScript(`const e=arguments[0];e.scrollIntoView({block:'center'});e.focus();const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,arguments[1]);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur();`,el,String(value));
    return el;
  }
  async clearSearch(css) {
    const input=await this.visible(css);
    await input.click();await input.sendKeys(Key.chord(Key.CONTROL,'a'),Key.BACK_SPACE,Key.TAB);
    await this.driver.wait(async()=>(await this.visible(css)).getAttribute('value').then(value=>value===''),this.timeout,'Search conditions must be removable by keyboard');
    await this.ready();
  }
  async date(el, value) { await this.driver.executeScript(`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(arguments[0],arguments[1]);arguments[0].dispatchEvent(new Event('input',{bubbles:true}));arguments[0].dispatchEvent(new Event('change',{bubbles:true}));`, el, value); assert.equal(await el.getAttribute('value'), value); }
  async select(css, value) { await this.driver.wait(async()=>{const el=await this.visible(css);return this.driver.executeScript('return Array.from(arguments[0].options).some(o=>o.value===arguments[1])',el,String(value));},this.timeout,`Dropdown must load option ${value}`);const el=await this.visible(css);await new Select(el).selectByValue(String(value)); }
  async nav(route) { await this.driver.wait(async()=>{try{await(await this.visible(`aside a[href="${route}"]`)).click();return true;}catch(e){if(e.name==='StaleElementReferenceError')return false;throw e;}},this.timeout);await this.path(route);await this.ready(); }
  async ready() {
    let previous='',stable=0;
    await this.driver.wait(async()=>{const snapshot=await this.driver.executeScript('const m=document.querySelector("main");return m?{text:m.innerText,busy:!!m.querySelector("[aria-busy=true],.eh-skeleton")}:null');if(!snapshot)return false;stable=snapshot.text===previous&&!snapshot.busy&&!/Đang tải|Đang nạp|Loading\\.\\.\\./i.test(snapshot.text)?stable+1:0;previous=snapshot.text;return stable>=2;},this.timeout,'UI must finish loading',150);
  }
  async path(route) { await this.driver.wait(async () => new URL(await this.driver.getCurrentUrl()).pathname === route, this.timeout, `Expected route ${route}`); }
  async open(route) { await this.driver.get(new URL(route, this.ctx.baseUrl).href); await this.path(route); await this.visible('main');await this.ready(); }
  async login(role = 'admin') {
    const user = this.ctx.pool.users[role]; assert.ok(user, `Fixture ${role} missing`);
    await this.driver.get(new URL('/login', this.ctx.baseUrl).href);
    await this.driver.executeScript('localStorage.clear();sessionStorage.clear()');
    await this.driver.get(new URL('/login', this.ctx.baseUrl).href);
    await this.fill('#login-email', user.email); await this.fill('#login-password', user.password);
    await (await this.visible('form.login-form button[type=submit]')).click();
    await this.path(`/${user.role.toLowerCase()}/dashboard`);
    const identity = await this.driver.executeScript(`try{return JSON.parse(localStorage.getItem('eh_user'))}catch{return null}`);
    assert.equal(identity?.email, user.email, 'UI login must bind the exact fixture account');
  }
  async error(pattern) {
    await this.driver.wait(async () => {
      const text = [];
      for (const el of await this.driver.findElements(By.css('[role=alert],main div:has(>svg.lucide-circle-alert):has(>span),main div:has(>svg.lucide-alert-circle):has(>span),.tsd-toast,.fixed.bottom-24.right-8,.tsd-error-card,.tsd-audio-error,.analytics-error-banner,.settings-field-error,.settings-alert-error,.adm-alert-error,.text-error,.adm-alert-banner,.edit-toast,.input-error-text,.field-error,.text-red-500,.text-red-600'))) if (await el.isDisplayed()) text.push(await el.getText());
      return pattern.test(text.join('\n'));
    }, this.timeout, `Missing validation error ${pattern}`);
  }
  async row(value) {
    let found;
    await this.driver.wait(async () => {
      try {
      const matches = [];
      for (const row of await this.driver.findElements(By.css('main tbody tr'))) if ((await row.getText()).includes(value)) matches.push(row);
      assert.ok(matches.length <= 1, 'Row identity must be unique'); found = matches[0]; return !!found;
      }catch(e){if(e.name==='StaleElementReferenceError')return false;throw e;}
    }, this.timeout, `Missing fixture row ${value}`); return found;
  }
  async rowAction(value, pattern) {
    let target;await this.driver.wait(async()=>{try{const row=await this.row(value);const found=[];for(const el of await row.findElements(By.css('button,a')))if(pattern.test((await el.getText()).trim()||await el.getAttribute('title')||''))found.push(el);assert.ok(found.length<=1,`Ambiguous row action ${pattern}`);target=found[0];return !!target;}catch(e){if(e.name==='StaleElementReferenceError')return false;throw e;}},this.timeout,`Missing row action ${pattern}`);await target.click();
  }
  async confirm(accept = true) {
    // Both native dialogs and accessible application dialogs are supported.
    let alert;
    try { alert = await this.driver.switchTo().alert(); } catch (e) { if (e.name !== 'NoSuchAlertError') throw e; }
    if (alert) { if (accept) await alert.accept(); else await alert.dismiss(); return; }
    const scope = '[role=dialog],.adm-modal,.confirm-dialog,.modal-overlay,.tad-modal-overlay';
    await this.visible(scope);
    await this.button(accept ? /^(Xác nhận|Confirm|Đóng bài tập|Close Assignment|Khóa tài khoản|Mở khóa tài khoản|Mở khóa|Xóa khỏi lớp|Xóa|Remove|Delete|Confirm.*)$/i : /^(Hủy|Hủy bỏ|Cancel)$/i, scope);
  }
}
export function scenario(role, run, prepare) {
  return {
    data: { role, isolation: 'unique fixture per run/case' },
    prepare: async (cleanup, ctx) => {
      if (ctx.setupError) throw new Error(ctx.setupError);
      assert.ok(ctx.pool?.users[role], `Missing ${role} fixture`);
      return prepare?.(ctx, cleanup);
    },
    async run(ctx, fixture) {
      const ui = new UI(ctx);
      await ctx.step(`Login as dedicated ${role} fixture`, () => ui.login(role));
      await run(ctx, ui, fixture);
    }
  };
}
