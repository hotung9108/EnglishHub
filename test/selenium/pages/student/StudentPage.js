import assert from 'node:assert/strict';
import { By, Key } from 'selenium-webdriver';
import { BasePage } from '../BasePage.js';
import { literal } from '../teacher/TeacherPage.js';
import { latestAttempt, listAttempts } from '../../support/student/fixtures.js';
import { normalizeLabel, historyAttemptNumber } from '../../support/student/ui-contract.js';

export class StudentPage extends BasePage {
  constructor(driver, config, data) { super(driver, config); this.data = data; }
  async step(label, element) {
    this.config.onEvidence?.({ type: 'ui-step', label });
    return super.step(label, element);
  }
  async waitFor(check, label, timeout = this.config.dataTimeoutMs || 90000) {
    const start = Date.now();
    try {
      const value = await this.driver.wait(check, timeout, `QA30 data wait: ${label}`, 500);
      this.config.onEvidence?.({ type: 'data-wait', label, status: 'READY', elapsedMs: Date.now() - start, limitMs: timeout });
      return value;
    } catch (error) {
      this.config.onEvidence?.({ type: 'data-wait', label, status: 'FAILED', elapsedMs: Date.now() - start, limitMs: timeout });
      throw error;
    }
  }
  async text() { return (await this.visible(By.css('main'))).getText(); }
  async hasText(text, label = text) { return this.waitFor(async () => (await this.text()).includes(text), label); }
  async button(label) {
    return this.visible(By.xpath(`//main//button[contains(normalize-space(.),${literal(label)})]`));
  }
  async clickButton(label) { await this.clickElement(await this.button(label), label); }
  async nav(route) {
    await this.clickElement(await this.visible(By.css(`aside a[href="${route}"]`)), route);
    await this.waitFor(async () => new URL(await this.driver.getCurrentUrl()).pathname === route, `route ${route}`, this.config.timeout);
  }
  async fill(locator, value) {
    const element = await this.visible(locator);
    await element.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
    if (value) await element.sendKeys(value);
    return element;
  }
  async search(value) { return this.fill(By.css('main input[type="text"]'), value); }
  async routeIs(route, label = route) {
    await this.waitFor(async () => new URL(await this.driver.getCurrentUrl()).pathname === route, label, this.config.timeout);
  }
  async selectOption(select, value) {
    await this.clickElement(await select.findElement(By.css(`option[value="${value}"]`)), `Filter ${value}`);
  }
  async selectWithValue(value) {
    const selects = await this.driver.findElements(By.xpath(`//main//select[option[@value=${literal(value)}]]`));
    if (selects.length !== 1) throw Object.assign(new Error(`Expected one select with option ${value}; found ${selects.length}`), {code:'QA30_UI_CONTRACT'});
    return selects[0];
  }
  async actionWithin(container, pattern) {
    for (const el of await container.findElements(By.css('button, a'))) {
      if (pattern.test((await el.getText()).trim())) return el;
    }
    throw Object.assign(new Error(`Expected action ${pattern}; available text: ${await container.getText()}`), { code: 'QA30_UI_CONTRACT' });
  }
  async overviewRule(label) {
    // staging uses rule-item, develop uses rule-card; getText can be uppercase via CSS.
    const containers = await this.driver.findElements(By.css('.overview-rule-item, .overview-rule-card'));
    for (const container of containers) {
      const labels = await container.findElements(By.css('.overview-rule-label'));
      if (labels.length && normalizeLabel(await labels[0].getText()) === normalizeLabel(label)) {
        return container.findElement(By.css('.overview-rule-val'));
      }
    }
    throw Object.assign(new Error(`Overview field is missing: ${label}; inspect DOM/version before reporting a product bug`), { code: 'QA30_UI_CONTRACT' });
  }
  async exactCard(selector, title) {
    return this.waitFor(async () => {
      const found = [];
      for (const card of await this.driver.findElements(By.css(selector))) {
        if ((await card.getText()).includes(title)) found.push(card);
      }
      assert.ok(found.length <= 1, `Ambiguous cards for ${title}`);
      return found[0] || false;
    }, `exact card ${title}`);
  }
  async classList(data) {
    await this.nav('/student/classes');
    await this.hasText(data.className, 'QA30 enrolled class');
    await this.search(data.className);
    await this.hasText(data.className);
    return this.waitFor(async () => {
      const cards = await this.driver.findElements(By.css('.student-class-card'));
      return cards.length === 1 && (await cards[0].getText()).includes(data.className) ? cards[0] : false;
    }, 'class search returns only the dedicated QA30 class');
  }
  async classDetail(data) {
    const card = await this.classList(data);
    await this.clickElement(await this.actionWithin(card, /Xem lớp|View Class/i), 'Open QA30 class');
    await this.waitFor(async () => new URL(await this.driver.getCurrentUrl()).pathname === `/student/classes/${data.classId}`, 'QA30 class route');
    const first = Object.values(data.assignments)[0];
    if (first) await this.hasText(first.title, 'QA30 class assignment list');
  }
  async assignmentList(item) {
    await this.nav('/student/assignments');
    await this.waitFor(async () => (await this.driver.findElements(By.css('.std-asg-card'))).length > 0, 'assignment cards');
    const classFilters = await this.driver.findElements(By.css('#student-class-select'));
    if (classFilters.length !== 1) throw Object.assign(new Error('Assignment class filter is missing or ambiguous'), {code:'QA30_UI_CONTRACT'});
    await this.selectOption(classFilters[0], String(this.data.classId));
    assert.equal(await classFilters[0].getAttribute('value'), String(this.data.classId), 'Assignment class filter did not select the fixture class');
    await this.search(item.title);
    await this.waitFor(async () => {
      const cards = await this.driver.findElements(By.css('.std-asg-card'));
      return cards.length === 1 && (await cards[0].getText()).includes(item.title);
    }, 'exact QA30 assignment card');
  }
  async openAssignment(item) {
    await this.assignmentList(item);
    const card = await this.visible(By.css('.std-asg-card'));
    await this.clickElement(card, 'Open QA30 assignment');
    await this.waitFor(async () => new URL(await this.driver.getCurrentUrl()).pathname !== '/student/assignments', 'open assignment route');
  }
  async overview(item, { entry = 'assignments' } = {}) {
    if (entry === 'class') {
      await this.classDetail(this.data);
      await this.clickElement(await this.exactCard('.std-asg-card', item.title), 'Open assignment from class');
      await this.waitFor(async () => new URL(await this.driver.getCurrentUrl()).pathname !== `/student/classes/${this.data.classId}`, 'class assignment navigation');
    } else await this.openAssignment(item);
    if (/\/student\/submissions\//.test(new URL(await this.driver.getCurrentUrl()).pathname)) {
      const crumb = await this.visible(By.xpath(`//span[contains(@class,'result-crumb-link') and contains(normalize-space(.),${literal(item.title)})]`));
      await this.clickElement(crumb, 'Open attempt history');
    }
    assert.equal(new URL(await this.driver.getCurrentUrl()).pathname, `/student/assignments/${item.id}/overview`, 'Assignment did not open Overview; inspect fixture state and card navigation');
    await this.hasText(item.title);
    await this.visible(By.css('.overview-attempts-section'));
  }
  async waitForHistory() {
    await this.waitFor(async () => {
      const section = await this.driver.findElement(By.css('.overview-attempts-section'));
      return !/dang tai|loading/.test(normalizeLabel(await section.getText()));
    }, 'Overview attempt history finished loading', 20000);
  }
  async historyResult(data) {
    const item = data.assignments.graded;
    await this.overview(item, { entry: 'class' });
    await this.waitFor(async () => (await this.driver.findElements(By.css('.overview-table tbody tr button, .overview-table tbody tr a'))).length > 0, 'history result action');
    const attempts = await listAttempts(data, item);
    const target = attempts.find(a => a.id === item.submissionId);
    assert.ok(target, 'Graded fixture attempt must exist in API');
    const row = await this.waitFor(async () => {
      for (const row of await this.driver.findElements(By.css('.overview-table tbody tr'))) {
        const cell = await row.findElement(By.css('td:first-child'));
        if (historyAttemptNumber(await cell.getText()) === target.attemptNumber) return row;
      }
      return false;
    }, 'exact graded history row', 10000);
    await this.clickElement(await this.actionWithin(row, /Xem|View|Review/i), 'View exact history submission');
    await this.waitFor(async () => !(await this.driver.getCurrentUrl()).includes('/overview'), 'history result navigation');
    assert.equal(new URL(await this.driver.getCurrentUrl()).pathname, `/student/submissions/${item.submissionId}`, 'History action must use the correct submission ID');
    await this.hasText(item.title, 'result assignment title');
  }
  async start(item) {
    const before = await listAttempts(this.data, item);
    if (before.length && !before.some(attempt => attempt.status === 'IN_PROGRESS')) {
      throw Object.assign(new Error('This editor case needs an unsubmitted fixture. Re-run this case with --fresh-fixtures.'), { code: 'QA30_PREREQUISITE' });
    }
    await this.openAssignment(item);
    if (new URL(await this.driver.getCurrentUrl()).pathname.endsWith('/overview')) {
      const button = await this.visible(By.css('.overview-cta-btn'));
      const label = await button.getText();
      assert.match(label, /Bắt đầu|Tiếp tục|Start|Continue/, 'A writable attempt must be available');
      await this.clickElement(button, 'Start/resume assignment');
    }
    const quiz = ['READING', 'LISTENING'].includes(item.skill);
    const selector = item.skill === 'WRITING' ? '.writing-textarea' : item.skill === 'SPEAKING' ? '.speaking-btn-record' : '.exam-options-group, .exam-short-answer-input';
    if (quiz) await this.hasText(item.questionText, 'real quiz question loaded');
    await this.visible(By.css(selector));
    await this.hasText(`QA30 ${item.skill}: daily practice.`, 'real module instructions loaded');
    const snapshot = await latestAttempt(this.data, item, { includeAnswers: false });
    const resumed = before.find(attempt => attempt.status === 'IN_PROGRESS');
    if (resumed) assert.equal(snapshot.submission.id, resumed.id, 'Resume must retain the same attempt ID');
    else {
      assert.ok(!before.some(attempt => attempt.id === snapshot.submission.id), 'UI reused an old completed attempt');
      assert.equal(snapshot.attempts.length, before.length + 1, 'Starting must create exactly one attempt');
    }
    assert.equal(snapshot.submission.status, 'IN_PROGRESS', 'Editor must be bound to an in-progress attempt');
    const queryId = new URL(await this.driver.getCurrentUrl()).searchParams.get('submissionId');
    if (queryId) assert.equal(Number(queryId), snapshot.submission.id, 'Editor URL points at a different attempt');
    this.activeSubmissionId = snapshot.submission.id;
    this.config.onEvidence?.({ type: 'attempt-binding', assignmentId: item.id, submissionId: this.activeSubmissionId, action: resumed ? 'resume' : 'new', beforeIds: before.map(attempt => attempt.id) });
  }
  async submitWriting(item, text, { file } = {}) {
    await this.start(item);
    await this.fill(By.css('.writing-textarea'), text);
    if (file) await this.driver.findElement(By.css('input[type="file"]')).sendKeys(file);
    if (file) await this.hasText(file.split(/[\\/]/).at(-1), 'chosen document filename');
    await this.clickButton('Nộp bài');
    await this.submissionNavigation(item);
  }
  async submitQuiz(item, answer) {
    await this.start(item);
    if (item.questionType === 'MULTIPLE_CHOICE') {
      const choices = await this.driver.findElements(By.css('.exam-option-item'));
      assert.equal(choices.length, 4, 'MCQ must render exactly four options');
      for (let index = 0; index < choices.length; index++) {
        assert.ok((await choices[index].getText()).includes(item.options[index]), `MCQ option ${index + 1} must show the real API option text, not placeholder A/B/C/D`);
      }
      await this.clickElement(choices[Number(answer) - 1], `Select option ${answer}`);
    } else {
      const inputs = await this.driver.findElements(By.css('.exam-short-answer-input'));
      assert.ok(inputs.length, `${item.skill} SHORT_ANSWER question must render a text input; UI displays choices instead`);
      await this.fill(By.css('.exam-short-answer-input'), answer);
    }
    await this.clickButton('Hoàn thành & Nộp bài');
    await this.submissionNavigation(item);
  }
  async submissionNavigation(item) {
    await this.waitFor(async () => {
      const route = new URL(await this.driver.getCurrentUrl()).pathname;
      return /\/student\/submissions\/\d+$/.test(route) || route === `/student/assignments/${item.id}/result`;
    }, 'UI redirect after submitting', 30000);
    const match = new URL(await this.driver.getCurrentUrl()).pathname.match(/^\/student\/submissions\/(\d+)$/);
    if (match) assert.equal(Number(match[1]), this.activeSubmissionId, 'Result URL does not match the attempt submitted through UI');
  }
  async persistedAttempt(item) {
    assert.ok(this.activeSubmissionId, 'No UI attempt was captured');
    return latestAttempt(this.data, item, { submissionId: this.activeSubmissionId });
  }
  async feedback(data) {
    return this.feedbackCard(data.evaluation.content, 'periodic evaluation from API');
  }
  async gradingFeedback(data) {
    return this.feedbackCard(data.feedback, `official feedback from grading ${data.assignments.graded.gradingId}`);
  }
  async feedbackCard(term, label) {
    await this.nav('/student/feedback');
    const empty = async () => /khong tim thay nhan xet|chua co nhan xet|no feedback/.test(normalizeLabel(await this.text()));
    await this.waitFor(async () => (await this.driver.findElements(By.css('.feedback-card'))).length > 0 || await empty(), 'feedback data or empty state loaded');
    await this.search(term);
    await this.waitFor(async () => {
      const cards = await this.driver.findElements(By.css('.feedback-card'));
      for (const card of cards) if (!(await card.getText()).includes(term)) return false;
      return cards.length > 0 || await empty();
    }, `search applied: ${label}`, 10000);
    const cards = await this.driver.findElements(By.css('.feedback-card'));
    assert.equal(cards.length, 1, `Expected exactly one ${label}; found ${cards.length} cards`);
    assert.ok((await cards[0].getText()).includes(term), `${label} differs from API`);
    return cards[0];
  }
  async gradeRow(data) {
    await this.nav('/student/grades');
    await this.waitFor(async () => (await this.driver.findElements(By.css('tbody tr'))).length > 0, 'grades loaded');
    // Always search the actual title first, including when it is on another page.
    await this.search(data.assignments.graded.title);
    const foundTitle = await this.waitFor(async () => {
      const rows = await this.driver.findElements(By.css('.grades-table tbody tr'));
      for (const row of rows) if ((await row.getText()).includes(data.assignments.graded.title)) return { found: true };
      return (await this.driver.findElements(By.css('.grades-table tbody td[colspan]'))).length ? { found: false } : false;
    }, 'grade title search applied', 10000);
    if (!foundTitle.found) {
      // Isolate score/action assertions from the missing-title defect; 028 checks the title itself.
      this.config.onEvidence?.({ type: 'grade-title-fallback', submissionId: data.assignments.graded.submissionId });
      await this.search(`#${data.assignments.graded.submissionId}`);
    }
    try { return await this.findGradeRow(data); }
    catch (error) {
      if (!/QA30 data wait: exact graded assignment row/.test(error.message)) throw error;
      const submission = await data.api.get('student', `/submissions/${data.assignments.graded.submissionId}`);
      assert.equal(submission.assignmentId, data.assignments.graded.id, 'Grade fixture ownership differs from API');
      this.config.onEvidence?.({type:'product-dependency',dependsOn:['QA30-028'],submissionId:submission.id,assignmentId:submission.assignmentId,reason:'API submission exists but UI cannot identify its grade row by actual title or submission ID'});
      throw Object.assign(new Error(`Cannot exercise this grade-row action: submission #${submission.id} exists for assignment #${submission.assignmentId}, but UI cannot identify its row. See QA30-028 (grade metadata/mapping).`), {code:'QA30_PRODUCT_BLOCKED',dependsOn:['QA30-028']});
    }
  }
  async gradesList() {
    await this.nav('/student/grades');
    await this.visible(By.css('.grades-table'));
    await this.waitFor(async () => !/dang tai|loading/.test(normalizeLabel(await this.text())) && (await this.driver.findElements(By.css('.grades-table tbody tr'))).length > 0, 'grade table settled');
  }
  async findGradeRow(data) {
    return this.waitFor(async () => {
      const rows = await this.driver.findElements(By.css('.grades-table tbody tr'));
      for (const row of rows) {
        const text = await row.getText();
        if (text.includes(data.assignments.graded.title) || text.includes(`#${data.assignments.graded.submissionId}`)) return row;
      }
      return false;
    }, 'exact graded assignment row', 10000);
  }
  async result(data) {
    const row = await this.gradeRow(data);
    const actions = await row.findElements(By.css('button, a'));
    assert.ok(actions.length, 'Grade row must provide a result action');
    await this.clickElement(await this.actionWithin(row, /Xem lời giải|Xem bài nộp|Review Result|View Submission/i), 'View this graded submission');
    await this.waitFor(async () => new URL(await this.driver.getCurrentUrl()).pathname !== '/student/grades', 'grade row navigation');
    assert.equal(new URL(await this.driver.getCurrentUrl()).pathname, `/student/submissions/${data.assignments.graded.submissionId}`, 'Grade result action navigated to the wrong submission/route');
    await this.hasText(data.assignments.graded.title, 'result title loaded');
  }
  async resultScore() {
    return this.waitFor(async () => {
      const value = (await (await this.driver.findElement(By.css('.result-score-number'))).getText()).trim().replace(',', '.');
      return /^\d+(?:\.\d+)?$/.test(value) ? { value: Number(value) } : false;
    }, 'result score loaded', 15000).then(result => result.value);
  }
}
