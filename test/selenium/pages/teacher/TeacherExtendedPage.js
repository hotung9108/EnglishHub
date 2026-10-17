import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { By, until } from 'selenium-webdriver';
import { TeacherPage, literal } from './TeacherPage.js';

export function blocked(message) { const error = new Error(message); error.code = 'QA29_BLOCKED'; return error; }
const productFailure = message => { const error = new Error(message); error.code = 'QA29_PRODUCT_CANDIDATE'; return error; };
const exactButton = (...labels) => By.xpath(`//button[${labels.map(label => `normalize-space(.)=${literal(label)}`).join(' or ')}]`);
const skillLabel = { WRITING: 'Writing (Kỹ năng Viết)', SPEAKING: 'Speaking (Kỹ năng Nói)', READING: 'Reading (Kỹ năng Đọc)', LISTENING: 'Listening (Kỹ năng Nghe)' };
const contentField = skill => By.css({ WRITING: 'textarea[placeholder="Nhập chủ đề đề bài, ngữ cảnh và câu hỏi chỉ thị..."],textarea[placeholder="Enter prompt statement..."]', SPEAKING: '[placeholder="Describe a memorable trip you took or an environmental problem..."]', READING: '[placeholder="THE EVOLUTION OF PRINTING & TYPOGRAPHY"]', LISTENING: 'textarea[placeholder^="Nhập lời thoại nghe"],textarea[placeholder^="Paste transcript"]' }[skill]);

export class TeacherExtendedPage extends TeacherPage {
  async buttonStarts(label) {
    const locator = By.xpath(`//main//button[starts-with(normalize-space(.),${literal(label)})]`);
    await this.click(locator);
  }
  async feature(locator, name) {
    const elements = await this.driver.findElements(locator);
    if (!elements.length) throw blocked(`${name}: chưa có control trên giao diện staging hiện tại`);
    return elements[0];
  }
  async selectSkill(skill) { await this.click(exactButton(skillLabel[skill])); await this.visible(contentField(skill)); }
  async createSkill(data, skill, result) {
    const title = `QA29X-${skill}-UI-${data.runId}`;
    result.createdAssignmentTitle = title;
    await this.createForm(data.className); await this.selectSkill(skill);
    await this.fill(By.css('.assignment-edit-title-input'), title);
    const text = `QA29 ${skill} content ${data.runId}`;
    await this.fill(contentField(skill), text);
    const questionText = `QA29 ${skill} question ${data.runId}`;
    if (skill === 'READING') {
      await this.click(exactButton('Thêm đoạn văn mới', 'Add Paragraph'));
      await this.fill(By.css('textarea[placeholder^="Nhập nội dung văn bản cho đoạn"],textarea[placeholder^="Enter text for Paragraph"]'), 'Daily practice improves English vocabulary and confidence. This is a synthetic QA reading passage.');
      await this.click(By.xpath(`//main//button[contains(.,'Điền từ') or contains(.,'Gap Fill')]`));
      await this.fill(By.css('[placeholder="Enter question statement..."]'), questionText);
      await this.fill(By.css('[placeholder="e.g. dummy text"]'), 'daily practice');
    }
    if (skill === 'LISTENING') {
      await this.fill(By.css('[placeholder="listening_track_01.mp3"]'), `QA29 listening ${data.runId}`);
      if (!data.extra.speaking) throw blocked('Không có file WAV QA để chuẩn bị Listening hợp lệ');
      const audio = await data.api.get('teacher', `/submission-modules/${data.extra.speaking.submissionModuleId}`);
      const key = audio.answers.find(answer => answer.audioUploadStatus === 'READY')?.audioStorageKey;
      assert.ok(key, 'A real uploaded WAV fixture is required');
      await this.fill(By.css('[placeholder="https://cdn.englishhub.edu.vn/audio/listening/track-01.mp3"]'), key);
      await this.click(exactButton('Thêm câu hỏi mới', 'Add Question'));
      await this.fill(By.css('[placeholder="Enter question text or sentence with blank [ _____ ]..."]'), questionText);
      await this.fill(By.xpath(`//main//label[contains(.,'Correct Answer')]/following-sibling::input`), 'daily practice');
    }
    await this.click(exactButton('Giao bài tập', 'Create & Publish')); await this.path('/teacher/assignments');
    await this.openAssignment(title);
    const id = Number(new URL(await this.driver.getCurrentUrl()).pathname.split('/').pop());
    const detail = await data.api.get('teacher', `/assignments/${id}`);
    const modules = await data.api.get('teacher', `/assignments/${id}/modules`);
    assert.equal(detail.status, 'PUBLISHED'); assert.equal(modules.data.length, 1); assert.equal(modules.data[0].skill, skill);
    const module = await data.api.get('teacher', `/modules/${modules.data[0].id}`);
    assert.ok(module.instructions.includes(text), 'Selected skill content must persist in module instructions (including skill context)');
    if (skill !== 'SPEAKING') {
      const response = await data.api.get('teacher', `/modules/${modules.data[0].id}/questions`);
      const questions = response.data || response.questions;
      assert.ok(Array.isArray(questions) && questions.some(question => question.content === questionText), 'Question builder content must persist through API');
    }
    await this.click(exactButton('Chỉnh sửa bài tập', 'Edit Assignment')); await this.path(/^\/teacher\/assignments\/\d+\/edit$/);
    await this.visible(contentField(skill));
    assert.ok((await (await this.visible(contentField(skill))).getAttribute('value')).includes(text), 'Edit must load saved skill content');
  }
  async preview(data, skill) {
    await this.createForm(data.className); await this.selectSkill(skill);
    const text = `QA29 preview ${skill}`; await this.fill(contentField(skill), text);
    if (skill === 'LISTENING') await this.fill(By.css('[placeholder="listening_track_01.mp3"]'), text);
    await this.click(exactButton('Xem thử giao diện học viên', 'Preview as Student'));
    const modal = await this.visible(By.css('.preview-modal-box'));
    await this.driver.wait(async () => (await modal.getText()).includes(text), this.config.timeout, 'Preview must show edited skill content');
    await this.click(exactButton('Đóng xem thử', 'Close Preview'));
    await this.driver.wait(async () => (await this.driver.findElements(By.css('.preview-modal-box'))).length === 0, this.config.timeout);
    assert.equal(await (await this.visible(contentField(skill))).getAttribute('value'), text, 'Preview must preserve editor state');
  }
  async editForm(title) { await this.openAssignment(title); await this.click(exactButton('Chỉnh sửa bài tập', 'Edit Assignment')); await this.visible(By.css('.assignment-edit-title-input')); }
  async editWriting(data) {
    const item = data.extra.edit;
    await this.editForm(item.title);
    const title = `QA29X-WRITING-Edited-${data.runId}`; const text = `QA29 changed instructions ${data.runId}`;
    await this.fill(By.css('.assignment-edit-title-input'), title); await this.fill(contentField('WRITING'), text);
    await this.click(exactButton('Cập nhật & Xuất bản', 'Update & Publish', 'Lưu thay đổi', 'Save Changes')); await this.path('/teacher/assignments');
    item.title = title; await this.openAssignment(title);
    const detail = await data.api.get('teacher', `/assignments/${item.id}`); const module = await data.api.get('teacher', `/modules/${item.moduleId}`);
    assert.equal(detail.title, title); assert.equal(detail.status, 'PUBLISHED'); assert.equal(module.instructions, text);
  }
  async dates(data, invalid = false) {
    const title = invalid ? `QA29X-InvalidSchedule-${data.runId}` : data.extra.edit.title;
    if (invalid) { await this.createForm(data.className); await this.fill(By.css('.assignment-edit-title-input'), title); await this.fill(contentField('WRITING'), 'QA29 dates'); }
    else await this.editForm(title);
    const fields = await this.driver.findElements(By.css('input[type="datetime-local"]')); assert.equal(fields.length, 2);
    const target = new Date(Date.now() + (invalid ? -2 : 14) * 86400000);
    const local = new Date(target.getTime() - target.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    await this.driver.executeScript(`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(arguments[0],arguments[1]);arguments[0].dispatchEvent(new Event('input',{bubbles:true}));`, fields[1], local);
    await this.click(invalid ? exactButton('Giao bài tập', 'Create & Publish') : exactButton('Cập nhật & Xuất bản', 'Update & Publish', 'Lưu thay đổi', 'Save Changes'));
    if (invalid) {
      await this.visible(By.css('.edit-toast')); assert.ok(new URL(await this.driver.getCurrentUrl()).pathname.endsWith('/create'));
      const list = await data.api.get('teacher', `/classes/${data.fixture.classId}/assignments?limit=100`);
      assert.ok(!list.data.some(item => item.title === title), 'Invalid schedule must not create an assignment');
    } else {
      await this.path('/teacher/assignments'); const list = await data.api.get('teacher', `/classes/${data.fixture.classId}/assignments?limit=100`);
      assert.equal(new Date(list.data.find(item => item.id === data.extra.edit.id).closeAt).getTime(), new Date(local).getTime(), 'Due date must persist through API readback');
    }
  }
  async closeAssignment(data) {
    await this.openAssignment(data.extra.edit.title);
    const control = await this.feature(exactButton('Đóng bài tập', 'Close Assignment'), 'Đóng bài tập');
    await this.clickElement(control);
    const alert = await this.driver.switchTo().alert().catch(() => null); if (alert) await alert.accept();
    await this.driver.wait(async () => (await data.api.get('teacher', `/assignments/${data.extra.edit.id}`)).status === 'CLOSED', this.config.timeout);
  }
  async skillFilter() {
    await this.section('assignments'); await this.buttonStarts('Writing');
    await this.waitForData(By.css('.teacher-assignment-card'), 'bài Writing sau khi lọc kỹ năng');
    const cards = await this.driver.findElements(By.css('.teacher-assignment-card')); assert.ok(cards.length > 0);
    for (const card of cards) assert.match(await card.getText(), /Writing/i);
  }
  async rosterFilter(data) {
    await this.openAssignment(data.assignmentTitle); await this.buttonStarts('Đã nộp bài');
    const text = await (await this.visible(By.css('main table'))).getText(); assert.ok(text.includes(data.studentName));
    await this.buttonStarts('Chưa nộp bài');
    assert.ok(!(await (await this.visible(By.css('main table'))).getText()).includes(data.studentName));
  }
  async gradeScore(data, score, skill = 'writing') {
    const item = skill === 'writing' ? data.fixture : data.extra[skill];
    const title = skill === 'writing' ? data.assignmentTitle : item.title;
    await this.openSubmission(title, data.studentName); await this.grade(score, `QA29 ${skill} score ${score}`);
    await this.openSubmission(title, data.studentName);
    const saved = await (await this.visible(By.css('main input[type="number"][placeholder="0.0"]'))).getAttribute('value');
    assert.ok(saved.trim().length, 'Saved grade must not be an empty input (especially score zero)');
    assert.equal(Number(saved), score);
    const readback = await data.api.get('teacher', `/gradings/${item.gradingId}`);
    this.config.onEvidence?.({ type: 'grade', skill, expectedScore: score, uiScore: Number(saved), apiScore: readback.finalScore });
    assert.equal(readback.finalScore, score);
  }
  async invalidGrade(data, value) {
    const before = await data.api.get('teacher', `/gradings/${data.fixture.gradingId}`);
    await this.openSubmission(data.assignmentTitle, data.studentName);
    await this.fill(By.css('main input[type="number"][placeholder="0.0"]'), value);
    const field = await this.visible(By.css('main input[type="number"][placeholder="0.0"]'));
    assert.equal(await field.getAttribute('value'), String(value), 'The invalid score must actually be present before submitting');
    const nativeInvalid = await this.driver.executeScript('return !arguments[0].checkValidity();', field);
    await this.click(exactButton('Lưu & Gửi điểm cho học sinh', 'Save & Send score'));
    let validationError;
    try {
      if (!nativeInvalid) await this.visible(By.xpath(`//main//*[contains(text(),'Điểm số không hợp lệ') or contains(text(),'Invalid score') or contains(text(),'Vui lòng nhập điểm') or contains(text(),'Please enter a score')]`));
      assert.match(new URL(await this.driver.getCurrentUrl()).pathname, /\/submissions\//, 'Rejected grade must keep submission editor open');
    } catch (error) { validationError = error; }
    const after = await data.api.get('teacher', `/gradings/${data.fixture.gradingId}`);
    this.config.onEvidence?.({ type: 'grade-validation', value: String(value), beforeScore: before.finalScore, afterScore: after.finalScore, feedbackUnchanged: after.finalFeedback === before.finalFeedback });
    if (after.finalScore !== before.finalScore || after.finalFeedback !== before.finalFeedback) throw productFailure('Nhập điểm không hợp lệ nhưng dữ liệu chấm điểm đã thay đổi trong API.');
    if (validationError) throw validationError;
  }
  async ai(data, skill = 'writing') {
    const item = skill === 'writing' ? data.fixture : data.extra[skill];
    const suggestion = await data.api.get('teacher', `/submission-modules/${item.submissionModuleId}/grading/ai-suggestion`);
    await this.openSubmission(skill === 'writing' ? data.assignmentTitle : item.title, data.studentName);
    if (!suggestion.canTriggerAi && skill === 'writing') {
      assert.equal(await (await this.visible(By.css('main input[placeholder="0.0"]'))).isEnabled(), true);
      throw blocked('AI Writing không sẵn sàng theo API canTriggerAi=false; editor chấm thủ công vẫn truy cập được');
    }
    await this.click(exactButton('Phân tích lại với AI', 'Re-run AI Analysis'));
    if (skill === 'reading') {
      await this.visible(By.xpath(`//main//*[contains(text(),'Lỗi khi kích hoạt AI') or contains(text(),'Failed to trigger AI')]`));
      assert.equal(await (await this.visible(By.css('main input[placeholder="0.0"]'))).isEnabled(), true);
    } else {
      await this.visible(By.xpath(`//main//*[contains(text(),'AI Engine đã nhận') or contains(text(),'AI Engine is processing')]`));
      await this.driver.wait(async () => {
        const value = await data.api.get('teacher', `/submission-modules/${item.submissionModuleId}/grading/ai-suggestion`);
        return value.aiFeedback && value.suggestedScore !== null;
      }, 60000, 'AI must produce suggestion within 60 seconds');
      await this.driver.navigate().refresh(); await this.visible(By.css('main input[placeholder="0.0"]'));
    }
  }
  async reportNumbers(data) {
    const list = await data.api.get('teacher', `/classes/${data.fixture.classId}/assignments?limit=100`);
    const scores = { WRITING: [], SPEAKING: [], READING: [], LISTENING: [] };
    for (const assignment of list.data) {
      const response = await data.api.get('teacher', `/submissions?assignmentId=${assignment.id}&limit=100`);
      for (const submission of response.data.filter(item => item.studentId === data.fixture.studentId)) for (const module of submission.modules) {
        if (scores[module.skill] && module.grading?.finalScore !== null && module.grading?.finalScore !== undefined) scores[module.skill].push(module.grading.finalScore);
      }
    }
    await this.openClass(data.className); await this.fill(By.css('.tcd-search-input'), data.studentName);
    const row = await this.visible(this.studentRow(data.studentName)); const pills = await row.findElements(By.css('.tcd-score-pill'));
    assert.equal(pills.length, 4);
    for (const [index, skill] of ['WRITING', 'SPEAKING', 'READING', 'LISTENING'].entries()) {
      const values = scores[skill]; const expected = values.length ? Math.round(values.reduce((sum, score) => sum + score, 0) / values.length * 10) / 10 : null;
      const text = (await pills[index].getText()).trim(); const actual = /[0-9]/.test(text) ? Number(text.replace(/[^\d.]/g, '')) : null;
      this.config.onEvidence?.({ type: 'gradebook', skill, scores: values, expected, actual });
      assert.equal(actual, expected, `${skill} gradebook must match independent API average`);
    }
  }
  async memberCount(data) {
    const members = await data.api.get('teacher', `/classes/${data.fixture.classId}/members`);
    await this.openClass(data.className);
    assert.equal(Number(await (await this.visible(By.css('.tcd-tab-item .tcd-tab-count'))).getText()), members.data.length, 'Roster member count matches API');
  }
  async reportNoMatch(data) {
    await this.openClass(data.className); await this.fill(By.css('.tcd-search-input'), 'QA29-no-student-' + data.runId);
    assert.equal((await this.driver.findElements(By.css('.tcd-student-name'))).length, 0);
    await this.fill(By.css('.tcd-search-input'), data.studentName); await this.visible(this.studentRow(data.studentName));
  }
  async download(data, type) {
    if (type === 'class') await this.openClass(data.className); else await this.openAssignment(data.assignmentTitle);
    const locator = By.xpath(`//main//button[contains(.,'Xuất') or contains(.,'Export')]`);
    const control = await this.feature(locator, 'Xuất báo cáo ' + type); await this.clickElement(control);
    try {
      await this.driver.wait(async () => {
        const names = await fs.readdir(this.config.downloadDir);
        return !names.some(name => /\.(crdownload|part|tmp)$/i.test(name)) && names.some(name => /\.(csv|xlsx|xls|pdf|zip)$/i.test(name));
      }, 60000, 'Export must produce a completed file within 60 seconds');
    } catch (error) {
      this.config.onEvidence?.({ type: 'export', waitedMs: 60000, files: await fs.readdir(this.config.downloadDir) });
      throw productFailure('Không có file export hoàn tất sau 60 giây. Cần đối chiếu handler/network; toast không chứng minh tải file.');
    }
    const names = (await fs.readdir(this.config.downloadDir)).filter(name => /\.(csv|xlsx|xls|pdf|zip)$/i.test(name));
    for (const name of names) { const bytes = (await fs.stat(this.config.downloadDir + '/' + name)).size; assert.ok(bytes > 0); this.config.onEvidence?.({ type: 'download', file: name, bytes }); }
  }
  async outside(data, type) {
    if (type === 'class') return this.outsideClass(data);
    const id = type === 'class' ? data.extra.foreignClass : data.extra.foreignAssignment.id;
    const endpoint = `/${type === 'class' ? 'classes' : 'assignments'}/${id}`;
    let denied = false;
    try { await data.api.get('teacher', endpoint); }
    catch (error) { if ([403, 404].includes(error.status)) denied = true; else throw error; }
    this.config.onEvidence?.({ type: 'authorization', endpoint, denied });
    if (!denied) throw productFailure('API cho giáo viên chính đọc tài nguyên ngoài quyền.');
    const route = `/teacher/${type === 'class' ? 'classes' : 'assignments'}/${id}${type === 'class' ? '/progress' : ''}`;
    await this.driver.get(this.config.baseUrl + route);
    await this.visible(By.css('main')); // A generic hosting 404 is not an authorization pass.
    await this.driver.wait(async () => {
      const body = await this.driver.findElement(By.css('body')); const text = await body.getText();
      return /Không thể tải|Không tìm thấy|không có quyền|Forbidden|Access denied|Not found|Failed to load|403|404/i.test(text);
    }, this.config.timeout, 'Outside-teacher resource must be denied on UI');
    const body = await this.driver.findElement(By.css('body'));
    assert.ok(!(await body.getText()).includes(data.extra.foreignAssignment.title), 'Do not expose foreign assignment title');
  }
  async outsideClass(data) {
    const endpoint = `/classes/${data.extra.foreignClass}`;
    const requester = await data.api.get('teacher', '/users/me');
    const foreign = await data.api.get('admin', endpoint);
    const ownerId = foreign.teacherId ?? foreign.teacher?.id;
    const teacherId = data.api.sessions.teacher?.user?.id;
    const outsiderId = data.api.sessions.outsider?.user?.id;
    if (!teacherId || !outsiderId || requester.id !== teacherId || ownerId !== outsiderId || teacherId === ownerId) {
      throw blocked('Fixture phân quyền không hợp lệ: cần token giáo viên chính và lớp thuộc giáo viên khác.');
    }
    this.config.onEvidence?.({ type: 'authorization-identity', requesterId: requester.id, ownerId, classId: foreign.id });
    await this.step(`Kiểm tra API lớp ${foreign.id}: giáo viên ${requester.id}, chủ lớp ${ownerId}`);
    let apiDenied = false, apiStatus = 200;
    try { await data.api.get('teacher', endpoint); }
    catch (error) {
      if (![403, 404].includes(error.status)) throw error;
      apiDenied = true; apiStatus = error.status;
    }
    this.config.onEvidence?.({ type: 'authorization-api', endpoint, requesterId: requester.id, ownerId, status: apiStatus, denied: apiDenied });
    // API access must not prevent Watch from exercising the UI route.
    await this.step(`API ${apiStatus}; tiếp tục mở lớp ngoài quyền trên giao diện`);
    const route = `/teacher/classes/${foreign.id}/progress`;
    await this.driver.get(this.config.baseUrl + route);
    let uiDenied = false, uiError;
    try {
      await this.visible(By.css('main'));
      await this.driver.wait(async () => {
        const body = await this.driver.findElement(By.css('body'));
        const text = await body.getText();
        const denial = /Không thể tải|Không tìm thấy|không có quyền|Forbidden|Access denied|Not found|Failed to load|403|404/i.test(text);
        const leaked = [foreign.name, data.extra.foreignAssignment?.title].filter(Boolean).some(value => text.includes(value));
        // Generic hosting failures are not evidence of application authorization.
        return denial && !leaked && !/404_NOT_FOUND|This page doesn.t exist/.test(text);
      }, this.config.timeout, 'UI phải từ chối lớp ngoài quyền và không lộ tên lớp/bài QA');
      uiDenied = true;
    } catch (error) { uiError = error; }
    this.config.onEvidence?.({ type: 'authorization-ui', route, denied: uiDenied });
    if (!apiDenied) throw productFailure(`API GET ${endpoint} cho giáo viên ${requester.id} đọc lớp của giáo viên ${ownerId} (HTTP ${apiStatus}); UI ${uiDenied ? 'đã chặn' : 'chưa xác minh chặn'}. Cần đối chiếu contract/build staging.`);
    if (uiError) throw uiError;
  }
  async profile() {
    await this.click(By.css('a[href="/teacher/profile"]')); await this.path('/teacher/profile');
    await this.visible(By.css('main input[type="email"]'));
  }
  async profileRead(data) {
    await this.profile(); const profile = await data.api.get('profile', '/users/me');
    assert.equal(await (await this.visible(By.css('main input[type="email"]'))).getAttribute('value'), profile.email);
    assert.ok(await (await this.visible(By.css('main input[type="email"]'))).getAttribute('readonly'));
  }
  async phone(data, settings = false) {
    const before = await data.api.get('profile', '/users/me');
    const openForm = async () => {
      if (settings) { await this.click(By.css('a[href="/teacher/settings"]')); await this.path('/teacher/settings'); await this.visible(By.css('.settings-page')); }
      else await this.profile();
    };
    let operationError;
    try {
      await openForm();
      await this.fill(By.css(settings ? 'main input[type="tel"]' : 'main input[placeholder="0987 654 321"]'), '0900000029');
      await this.click(exactButton('Lưu thay đổi', 'Save Changes'));
      await this.driver.wait(async () => (await data.api.get('profile', '/users/me')).phone === '0900000029', this.config.timeout, 'Profile phone must persist');
      this.config.onEvidence?.({ type: 'phone-save', apiReadback: 'MATCHED', screen: settings ? 'settings' : 'profile' });
      await this.click(By.css('a[href="/teacher/dashboard"]'));
      await this.path('/teacher/dashboard');
      await openForm();
      assert.equal(await (await this.visible(By.css(settings ? 'main input[type="tel"]' : 'main input[placeholder="0987 654 321"]'))).getAttribute('value'), '0900000029');
      this.config.onEvidence?.({ type: 'phone-reopen', navigation: 'menu', uiReadback: 'MATCHED', screen: settings ? 'settings' : 'profile' });
    } catch (error) { operationError = error; throw error; }
    finally {
      try { await data.api.request('profile', 'PUT', '/users/me', { fullName: before.fullName, phone: before.phone || '', avatarUrl: before.avatarUrl || '' }); }
      catch (cleanupError) {
        if (operationError) operationError.cleanupError = cleanupError.message;
        else { cleanupError.code = 'QA29_CLEANUP'; throw cleanupError; }
      }
    }
  }
  async password(data, valid = false) {
    await this.profile(); await this.click(exactButton('Bảo mật & Mật khẩu', 'Security & Password'));
    const fields = await this.driver.findElements(By.css('main form input[type="password"]')); assert.equal(fields.length, 3);
    const original = this.config.users.profile.password; const next = `Qa29!${crypto.randomBytes(10).toString('hex')}Aa7`;
    this.config.users.changedPassword = { password: next };
    for (const [index, value] of [[0, original], [1, next], [2, valid ? next : 'DoesNotMatch!1']]) { await this.step('Nhập trường mật khẩu test (ẩn)', fields[index]); await fields[index].sendKeys(value); }
    await this.click(exactButton('Cập nhật mật khẩu', 'Update Password'));
    if (!valid) {
      await this.visible(By.xpath(`//main//*[contains(text(),'không khớp') or contains(text(),'do not match') or contains(text(),'không trùng')]`)); return;
    }
    let changed = false;
    try {
      await this.visible(By.xpath(`//main//*[contains(text(),'thành công') or contains(text(),'successfully')]`));
      const login = await data.api.request('profile', 'POST', '/auth/login', { email: this.config.users.profile.email, password: next });
      assert.equal(login.user.id, data.extra.profileId); changed = true;
      data.api.sessions.profile = login;
    } finally {
      if (changed) await data.api.request('profile', 'PATCH', '/users/me/password', { currentPassword: next, newPassword: original });
      else {
        // Attempt restoration using the new password if the UI timed out after committing.
        let login;
        try { login = await data.api.request('profile', 'POST', '/auth/login', { email: this.config.users.profile.email, password: next }); }
        catch (error) {
          if (error.status !== 401) throw new Error('Không xác minh được việc khôi phục mật khẩu tài khoản QA riêng; cần kiểm tra user ID trong fixture-ledger.');
        }
        if (login) {
          data.api.sessions.profile = login;
          await data.api.request('profile', 'PATCH', '/users/me/password', { currentPassword: next, newPassword: original });
        }
      }
      this.config.users.profile.password = original;
    }
  }
  async settingsFeature(name) {
    await this.click(By.css('a[href="/teacher/settings"]')); await this.path('/teacher/settings'); await this.visible(By.css('.settings-page'));
    const labels = name === 'notifications' ? ['Thông báo', 'Notifications'] : ['Tùy chọn', 'Preferences'];
    const control = await this.feature(exactButton(...labels), 'Cài đặt ' + name); await this.clickElement(control);
    const toggle = await this.visible(By.css('main input[type="checkbox"]')); const initial = await toggle.isSelected();
    try {
      await this.clickElement(toggle, 'Đổi tùy chọn thử nghiệm'); await this.click(exactButton('Lưu thay đổi', 'Save Changes'));
      await this.driver.navigate().refresh();
      const tab = await this.feature(exactButton(...labels), name); await this.clickElement(tab);
      const current = await this.visible(By.css('main input[type="checkbox"]')); assert.equal(await current.isSelected(), !initial);
    } finally {
      const current = await this.visible(By.css('main input[type="checkbox"]'));
      if (await current.isSelected() !== initial) {
        await this.clickElement(current, 'Khôi phục tùy chọn'); await this.click(exactButton('Lưu thay đổi', 'Save Changes'));
      }
    }
  }
  async logout() {
    await this.click(By.css('a.sidebar-link-logout[href="/login"]')); await this.path('/login'); await this.visible(By.css('form input[type="email"]'));
    const hasToken = () => this.driver.executeScript('return !!localStorage.getItem("eh_access_token");');
    try { await this.driver.wait(async () => !(await hasToken()), this.config.timeout, 'Sidebar logout must clear the access token'); }
    catch { this.config.onEvidence?.({ type: 'logout', accessTokenPresent: await hasToken() }); throw productFailure('Bấm Đăng xuất trên sidebar đã về login nhưng access token vẫn còn.'); }
  }
  async examBank() {
    await this.section('assignments');
    const link = await this.feature(By.xpath(`//main//button[contains(.,'Ngân hàng đề') or contains(.,'Exam Bank')]`), 'Ngân hàng đề / giao nhanh');
    await this.clickElement(link); await this.path('/teacher/exam-bank'); await this.visible(By.css('.exam-bank-container'));
    const action = await this.visible(By.xpath(`//div[contains(@class,'exam-card-actions')]//button[.//span[normalize-space(.)='Giao cho lớp' or normalize-space(.)='Assign']]`));
    await this.clickElement(action); await this.visible(By.css('.exam-modal-overlay .exam-modal-box'));
  }
  async cancelCreate(data) {
    const title = `QA29X-Cancel-${data.runId}`; await this.createForm(data.className); await this.fill(By.css('.assignment-edit-title-input'), title);
    await this.click(exactButton('Hủy bỏ', 'Cancel')); await this.path('/teacher/assignments');
    const list = await data.api.get('teacher', `/classes/${data.fixture.classId}/assignments?limit=100`); assert.ok(!list.data.some(item => item.title === title));
  }
  async syllabus(data) {
    await this.openClass(data.className); await this.buttonStarts('Lộ trình');
    await this.visible(By.css('.tcd-syllabus-list,.tcd-syllabus-timeline,.tcd-card-section'));
    assert.match(await (await this.visible(By.css('main'))).getText(), /Lộ trình|Buổi học|Syllabus|sessions/i);
  }
}
