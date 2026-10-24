import assert from 'node:assert/strict';
import { By, until, Key } from 'selenium-webdriver';
import { BasePage } from '../BasePage.js';

// Locators match EnglishHub/frontend/src/pages/Teacher*.tsx and locales/teacher.ts.
// XPath literals also support fixture names containing single/double quotes.
export const literal = value => {
  const text = String(value);
  if (!text.includes("'")) return `'${text}'`;
  if (!text.includes('"')) return `"${text}"`;
  return `concat(${text.split("'").map(part => `'${part}'`).join(', "\'", ')})`;
};
const cls = name => `contains(concat(' ', normalize-space(@class), ' '), ' ${name} ')`;
const button = labels => By.xpath(`//main//button[${labels.map(text => `normalize-space(.)=${literal(text)}`).join(' or ')}]`);

export class TeacherPage extends BasePage {
  async waitForData(locator, label) {
    const started = Date.now();
    const limitMs = this.config.dataTimeoutMs || 180000;
    const observe = status => this.config.onEvidence?.({
      type: 'data-wait', label, status, elapsedMs: Date.now() - started, limitMs,
      exceededNormalWait: Date.now() - started > this.config.timeout,
    });
    this.config.onStep?.(`Chờ ${label} (tối đa ${limitMs / 1000} giây, tiếp tục ngay khi dữ liệu hiện)`);
    try {
      const element = await this.driver.wait(async () => {
        for (const candidate of await this.driver.findElements(locator)) {
          try { if (await candidate.isDisplayed()) return candidate; }
          catch (error) { if (error.name !== 'StaleElementReferenceError') throw error; }
        }
        return false;
      }, limitMs, `Chưa tải được ${label} trong ${limitMs / 1000} giây; không đồng nghĩa fixture đã bị xóa`);
      observe('READY');
      return element;
    } catch (error) {
      observe('FAILED');
      if (error.name === 'TimeoutError') error.code = 'QA29_DATA_TIMEOUT';
      throw error;
    }
  }

  async click(locator) {
    const element = await this.visible(locator);
    await this.driver.wait(until.elementIsEnabled(element), this.config.timeout);
    await this.clickElement(element);
  }

  async fill(locator, text) {
    const element = await this.visible(locator);
    await this.step((await element.getAttribute('placeholder')) || 'Điền thông tin vào ô nhập liệu', element);
    // Keyboard events update React controlled inputs, including an empty value.
    await element.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
    if (String(text)) await element.sendKeys(String(text));
    await this.driver.wait(async () => (await element.getAttribute('value')) === String(text), this.config.timeout, 'Input must contain the requested value before continuing');
  }

  async path(expected) {
    await this.driver.wait(async () => {
      const url = new URL(await this.driver.getCurrentUrl());
      return url.origin === this.config.baseUrl && (expected instanceof RegExp ? expected.test(url.pathname) : url.pathname === expected);
    }, this.config.timeout, `Expected route ${expected}`);
  }

  async section(name) {
    await this.click(By.css(`a[href="/teacher/${name}"]`));
    await this.path(`/teacher/${name}`);
    await this.waitForData(By.css(`.teacher-${name === 'classes' ? 'classes-grid' : 'assignments-list'}`), name === 'classes' ? 'vùng danh sách lớp' : 'vùng danh sách bài tập');
  }

  classCard(name) {
    return By.xpath(`//div[${cls('teacher-class-card')}][.//h3[normalize-space(.)=${literal(name)}]]`);
  }

  assignmentCard(title) {
    return By.xpath(`//div[${cls('teacher-assignment-card')}][.//h3[normalize-space(.)=${literal(title)}]]`);
  }

  async searchClass(name) {
    await this.section('classes');
    await this.fill(By.css('.teacher-search-input'), name);
    await this.visible(this.classCard(name));
    const titles = await this.driver.findElements(By.css('.teacher-class-title'));
    assert.equal(titles.length, 1, 'Fixture class name must identify exactly one class');
    assert.equal((await titles[0].getText()).trim(), name);
    await this.fill(By.css('.teacher-search-input'), `QA29-no-match-${Date.now()}`);
    await this.driver.wait(async () => (await this.driver.findElements(By.css('.teacher-class-card'))).length === 0, this.config.timeout);
    await this.fill(By.css('.teacher-search-input'), name);
    await this.visible(this.classCard(name));
  }

  async openClass(name) {
    await this.section('classes');
    await this.fill(By.css('.teacher-search-input'), name);
    const card = await this.waitForData(this.classCard(name), 'lớp QA cần mở');
    assert.equal((await this.driver.findElements(this.classCard(name))).length, 1, 'Fixture class name must be unique');
    await this.clickElement(await card.findElement(By.css('button.btn-primary')));
    await this.path(/^\/teacher\/classes\/[^/]+\/progress$/);
    await this.waitForData(By.css('.tcd-table'), 'bảng điểm và dữ liệu lớp');
  }

  studentRow(name) {
    return By.xpath(`//table[contains(@class,'tcd-table')]//tbody/tr[.//span[${cls('tcd-student-name')} and normalize-space(.)=${literal(name)}]]`);
  }

  async studentReport(name) {
    await this.fill(By.css('.tcd-search-input'), name);
    const row = await this.visible(this.studentRow(name));
    assert.equal((await this.driver.findElements(this.studentRow(name))).length, 1, 'Fixture student name must be unique in this class');
    const scores = await row.findElements(By.css('.tcd-score-pill'));
    assert.equal(scores.length, 4, 'Roster must display four skills');
    await this.clickElement(await row.findElement(By.css('button.tcd-btn-action-icon')));
    const drawer = await this.visible(By.css('.tcd-drawer-box'));
    // The drawer slides in; located/displayed can be true before its text is
    // inside the viewport. Wait for actual content, not the animation duration.
    await this.driver.wait(async () => (await drawer.getText()).includes(name), this.config.timeout, 'Student report must identify selected student');
    assert.ok((await drawer.getText()).includes(name), 'Student report must identify selected student');
    await this.driver.wait(async () => {
      const text = await drawer.getText();
      return ['Writing', 'Speaking', 'Reading', 'Listening'].every(skill => text.includes(skill));
    }, this.config.timeout, 'Student report must finish rendering all four skill labels');
    await this.step('Báo cáo học viên: Writing, Speaking, Reading, Listening');
    await this.click(button(['Đóng', 'Close']));
    await this.driver.wait(async () => (await this.driver.findElements(By.css('.tcd-drawer-box'))).length === 0, this.config.timeout);
  }

  async analytics() {
    await this.click(button(['Phân tích 4KN & AI Insights', '4-Skill Analytics & AI']));
    await this.visible(By.css('.tcd-analytics-grid'));
    assert.equal((await this.driver.findElements(By.css('.tcd-analytics-skill-card'))).length, 4);
  }

  async openAssignment(title) {
    await this.section('assignments');
    await this.fill(By.css('.teacher-search-input'), title);
    const card = await this.waitForData(this.assignmentCard(title), 'bài tập QA đúng tiêu đề trong danh sách');
    assert.equal((await this.driver.findElements(this.assignmentCard(title))).length, 1, 'Fixture assignment title must be unique');
    await this.clickElement(await card.findElement(By.css('h3')), 'Mở chi tiết bài tập');
    await this.path(/^\/teacher\/assignments\/[^/]+$/);
    await this.driver.wait(async () => {
      const headings = await this.driver.findElements(By.css('main h1'));
      return headings.length > 0 && (await headings[0].getText()).endsWith(`: ${title}`);
    }, this.config.timeout, 'Detail must display the selected assignment');
  }

  async createForm(className) {
    this.selectedClassName = className;
    await this.section('classes');
    await this.click(button(['Giao bài tập mới', 'Create Assignment']));
    await this.path('/teacher/assignments/create');
    const option = By.xpath(`//div[${cls('assignment-edit-header')}]//select/option[normalize-space(.)=${literal(`Lớp: ${className}`)}]`);
    await this.click(option);
    const select = await this.visible(By.css('.assignment-edit-header select'));
    assert.ok(await select.getAttribute('value'), 'Class must be selected');
    await this.visible(By.css('.skill-tab-btn.active-writing'));
  }

  async emptyTitle() {
    await this.fill(By.css('.assignment-edit-title-input'), '');
    await this.click(button(['Giao bài tập', 'Create & Publish']));
    await this.visible(By.xpath(`//div[contains(@class,'edit-toast')][contains(.,'Tiêu đề bài tập không được để trống') or contains(.,'Title cannot be empty')]`));
    await this.path('/teacher/assignments/create');
  }

  async createWriting(title, prompt, publish) {
    await this.fill(By.css('.assignment-edit-title-input'), title);
    await this.fill(By.css('textarea[placeholder="Nhập chủ đề đề bài, ngữ cảnh và câu hỏi chỉ thị..."], textarea[placeholder="Enter prompt statement..."]'), prompt);
    // datetime-local keyboard entry is locale dependent. Use the native input setter
    // and bubbling input event so React receives the same form change.
    const dates = await this.driver.findElements(By.css('input[type="datetime-local"]'));
    assert.equal(dates.length, 2);
    for (const [index, days] of [[0, -1], [1, 7]]) {
      await this.step(index === 0 ? 'Đặt thời gian mở bài' : 'Đặt hạn nộp bài', dates[index]);
      const date = new Date(Date.now() + days * 86400000);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      await this.driver.executeScript(`
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(arguments[0], arguments[1]);
        arguments[0].dispatchEvent(new Event('input', {bubbles:true}));
      `, dates[index], local);
    }
    await this.click(button(publish ? ['Giao bài tập', 'Create & Publish'] : ['Lưu bản nháp', 'Save Draft']));
    await this.path('/teacher/assignments');
    await this.openAssignment(title);
    const status = (await (await this.visible(By.xpath('//main//h1/../div/span[1]'))).getText()).trim();
    assert.ok(publish ? ['Đang mở (Open)', 'Open'].includes(status) : status === 'DRAFT', 'Assignment status must persist');
    await this.click(button(['Chỉnh sửa bài tập', 'Edit Assignment']));
    await this.path(/^\/teacher\/assignments\/[^/]+\/edit$/);
    const field = By.css('textarea[placeholder="Nhập chủ đề đề bài, ngữ cảnh và câu hỏi chỉ thị..."], textarea[placeholder="Enter prompt statement..."]');
    await this.driver.wait(async () => (await this.driver.findElements(field)).length > 0, this.config.timeout);
    assert.equal(await (await this.visible(By.css('.assignment-edit-title-input'))).getAttribute('value'), title);
    assert.equal((await (await this.visible(By.css('.assignment-edit-header select option:checked'))).getText()).trim(), this.selectedClassName, 'Assignment must belong to the selected QA class');
    assert.equal(await (await this.visible(field)).getAttribute('value'), prompt, 'Writing module instructions must be saved');
  }

  async openSubmission(title, student) {
    await this.openAssignment(title);
    const row = By.xpath(`//main//table/tbody/tr[.//td[1]//div[normalize-space(text())=${literal(student)}]]`);
    const element = await this.visible(row);
    assert.equal((await this.driver.findElements(row)).length, 1, 'Fixture student name must be unique in this assignment');
    const actions = await element.findElements(By.xpath(`.//button[normalize-space(.)='Chấm bài ngay' or normalize-space(.)='Grade now' or normalize-space(.)='Xem bài nộp' or normalize-space(.)='View submission']`));
    assert.equal(actions.length, 1, 'Fixture student needs a submitted module with grading record');
    await this.clickElement(actions[0]);
    await this.path(/^\/teacher\/assignments\/[^/]+\/submissions\/[^/]+$/);
    await this.visible(By.css('main input[type="number"][placeholder="0.0"]'));
  }

  async invalidScore() {
    const url = await this.driver.getCurrentUrl();
    await this.fill(By.css('main input[type="number"][placeholder="0.0"]'), 11);
    await this.click(button(['Lưu & Gửi điểm cho học sinh', 'Save & Send score']));
    await this.visible(By.xpath(`//main//*[contains(text(),'Điểm số không hợp lệ') or contains(text(),'Invalid score (range')]`));
    assert.equal(await this.driver.getCurrentUrl(), url, 'Invalid score must keep grading editor open');
  }

  async grade(score, feedback) {
    await this.fill(By.css('main input[type="number"][placeholder="0.0"]'), score);
    await this.fill(By.css('main textarea'), feedback);
    await this.click(button(['Lưu & Gửi điểm cho học sinh', 'Save & Send score']));
    await this.path(/^\/teacher\/assignments\/[^/]+$/);
  }

  async assertGrade(score, feedback) {
    const savedScore = await (await this.visible(By.css('main input[type="number"][placeholder="0.0"]'))).getAttribute('value');
    assert.ok(savedScore.trim(), 'Persisted score must not be an empty input');
    assert.equal(Number(savedScore), score, 'Final grade must persist after reopening');
    const field = await this.visible(By.css('main textarea'));
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"});', field);
    try {
      await this.driver.wait(async () => await field.getAttribute('value') === feedback, this.config.timeout, 'Waiting for persisted final feedback');
    } catch {
      assert.equal(await field.getAttribute('value'), feedback, 'Final feedback must persist after reopening and explicit load wait');
    }
  }
}
