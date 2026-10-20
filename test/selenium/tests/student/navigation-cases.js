import assert from 'node:assert/strict';
import path from 'node:path';
import { By, until } from 'selenium-webdriver';
import { root } from '../../config/env.js';
import { latestAttempt, listAttempts } from '../../support/student/fixtures.js';
import { normalizeLabel, verifyAttemptRule, verifyExhaustedActions } from '../../support/student/ui-contract.js';

export function addNavigationCases(add) {
  add(29, 'Lọc lớp đang học và đã hoàn thành', 'Tìm lớp QA30; chọn Đang diễn ra, rồi Đã hoàn thành.', 'Lớp ACTIVE chỉ xuất hiện ở bộ lọc đang học; không lọt vào lớp hoàn thành.', async (page, data) => {
    const cls = await data.api.get('student', `/classes/${data.classId}`);
    assert.equal(cls.status, 'ACTIVE', 'Fixture class must be active');
    await page.classList(data); await page.clickButton('Đang diễn ra');
    await page.hasText(data.className);
    await page.clickButton('Đã hoàn thành');
    await page.waitFor(async () => (await page.driver.findElements(By.css('.student-class-card'))).length === 0, 'active class excluded from completed filter', 5000);
  });
  add(30, 'Lọc bài theo lớp và trạng thái đã chấm', 'Lọc đúng lớp QA30, tìm bài đã chấm; chọn Đã có kết quả, rồi Chưa bắt đầu.', 'Bài GRADED xuất hiện đúng tab kết quả và không xuất hiện trong tab chưa bắt đầu.', async (page, data) => {
    const item = data.assignments.graded;
    await page.assignmentList(item);
    await page.clickButton('Đã có kết quả');
    await page.waitFor(async () => !/dang tai|loading/.test(normalizeLabel(await page.text())), 'assignment status filter settled', 10000);
    const resultCards = await page.driver.findElements(By.css('.std-asg-card'));
    let inResults = false;
    for (const card of resultCards) if ((await card.getText()).includes(item.title)) inResults = true;
    await page.clickButton('Chưa bắt đầu');
    await page.waitFor(async () => (await page.driver.findElements(By.css('.std-asg-card'))).length === 0, 'graded assignment excluded from not-started filter', 5000);
    assert.equal(inResults, true, 'Officially graded assignment is missing from Results tab; Not-started exclusion was also checked');
  });
  add(31, 'Bảng điểm: tìm kiếm không có kết quả', 'Tải Bảng điểm rồi tìm chuỗi không tồn tại.', 'Không còn dòng dữ liệu, có thông báo rỗng; không hiển thị dòng cũ.', async (page, data) => {
    await page.gradesList(); await page.search('QA30-NO-MATCH-000000');
    await page.waitFor(async () => (await page.driver.findElements(By.css('.grades-table tbody tr td[colspan]'))).length === 1, 'empty grades search', 5000);
    assert.equal((await page.driver.findElements(By.css('.grades-table tbody tr td:first-child:not([colspan])'))).length, 0);
    assert.match(await page.text(), /Không tìm thấy|No grade/);
  });
  add(32, 'Bảng điểm: lọc theo nhãn lớp', 'Tải bảng điểm; chọn lớp QA30, kiểm tra nhãn lớp các dòng hiển thị; không phụ thuộc tìm tên bài.', 'Dropdown nhận đúng giá trị lớp và mọi dòng hiển thị mang nhãn lớp đã chọn. Mapping bài/lớp theo API kiểm tra riêng ở 028.', async (page, data, result) => {
    await page.gradesList();
    const select = await page.selectWithValue(data.className);
    await page.selectOption(select, data.className);
    assert.equal(await select.getAttribute('value'), data.className);
    const rows = await page.driver.findElements(By.css('.grades-table tbody tr'));
    const labels = [];
    for (const row of rows) { const cells=await row.findElements(By.css('td')); if(cells.length>=8) labels.push(await cells[0].getText()); }
    result.readback={selectedClass:await select.getAttribute('value'),visibleLabels:labels,scope:'Displayed class-label filtering only; API identity/mapping checked in 028'};
    assert.ok(labels.length,'Class filter unexpectedly removed all existing grade rows');
    for(const label of labels) assert.ok(label.includes(data.className));
  });
  add(33, 'Nhận xét: bộ lọc kỹ năng', 'Tải các nhận xét; lần lượt chọn Reading và Writing, kiểm tra nhãn kỹ năng các thẻ hiển thị.', 'Bộ lọc chọn đúng và không giữ thẻ khác kỹ năng. Sự hiện diện finalFeedback kiểm tra riêng ở 022.', async (page, data, result) => {
    await page.feedback(data);
    await page.search('');
    await page.waitFor(async()=>(await page.driver.findElements(By.css('.feedback-card'))).length>0,'available feedback cards after clearing search',5000);
    const baseline=[];
    for(const card of await page.driver.findElements(By.css('.feedback-card'))) for(const tag of await card.findElements(By.css('.std-skill-tag'))) baseline.push(normalizeLabel(await tag.getText()));
    const select=await page.visible(By.css('select.select-input'));
    result.readback={baselineSkills:baseline,filters:[],scope:'Filter labels over available cards; official grading presence is checked in 022'};
    for(const skill of ['reading','writing']){
      await page.selectOption(select,skill);
      await page.waitFor(async()=> (await select.getAttribute('value'))===skill,'feedback filter selected',5000);
      await page.waitFor(async()=>{
        for(const tag of await page.driver.findElements(By.css('.feedback-card .std-skill-tag'))) if(normalizeLabel(await tag.getText())!==skill)return false;
        return true;
      },'feedback cards reflect selected skill',5000);
      const tags=[];
      for(const card of await page.driver.findElements(By.css('.feedback-card'))){const tag=await card.findElement(By.css('.std-skill-tag'));tags.push(normalizeLabel(await tag.getText()));}
      result.readback.filters.push({selected:skill,visibleSkills:tags});
      if(baseline.includes(skill))assert.ok(tags.length,`Filter removed every ${skill} card already visible before filtering`);
      for(const tag of tags) assert.equal(tag,skill);
    }
  });
  add(34, 'Nhận xét bài nộp: mở đúng bài làm', 'Tìm nhận xét chính thức; bấm nút xem bài của chính thẻ đó.', 'Đi tới đúng /student/submissions/{submissionId}, không mở bài khác.', async (page, data) => {
    const card = await page.gradingFeedback(data).catch(error=>{
      if(error.code==='ERR_ASSERTION' && /found 0 cards/.test(error.message)) throw Object.assign(new Error('Cannot click official feedback action because its card is missing; see QA30-022. '+error.message),{code:'QA30_PRODUCT_BLOCKED',dependsOn:['QA30-022']});
      throw error;
    });
    await page.clickElement(await page.actionWithin(card, /Xem bài|Review Submission/i), 'Open submission from its feedback');
    await page.routeIs(`/student/submissions/${data.assignments.graded.submissionId}`);
    await page.hasText(data.assignments.graded.title);
  });
  add(35, 'Lịch sử: mở kết quả đúng lượt', 'Lớp QA30 → bài đã chấm → dòng lịch sử đúng số lần → Xem.', 'URL chứa đúng submissionId, đúng tên bài và điểm 7.5.', async (page, data) => {
    await page.historyResult(data);
    assert.equal(await page.resultScore(), 7.5);
  });
  add(36, 'Kết quả: tab nhận xét của giáo viên', 'Mở kết quả từ lịch sử; chọn tab nhận xét giáo viên.', 'Tab được chọn và hiển thị finalFeedback chính thức từ API.', async (page, data) => {
    await page.historyResult(data);
    const tabs = await page.driver.findElements(By.css('.result-nav-tab'));
    let target;
    for (const tab of tabs) if (/nhan xet|giao vien|feedback|teacher/.test(normalizeLabel(await tab.getText()))) target = tab;
    assert.ok(target, 'Result must expose teacher feedback tab');
    await page.clickElement(target, 'Teacher feedback tab');
    assert.match(await target.getAttribute('class'), /active/);
    await page.hasText(data.feedback, 'official teacher feedback in result');
  });
  add(37, 'Kết quả: chuyển về Bảng điểm', 'Mở kết quả từ lịch sử rồi bấm nút Xem bảng điểm.', 'Đi đúng /student/grades và tải được bảng.', async (page, data) => {
    await page.historyResult(data); await page.clickButton('Xem bảng điểm');
    await page.routeIs('/student/grades'); await page.visible(By.css('.grades-table'));
  });
  add(38, 'Writing: từ chối file sai định dạng', 'Mở editor, chọn file TXT qua input tải bài.', 'Hiện lỗi chỉ nhận PDF/DOCX, không gắn file TXT; lượt vẫn IN_PROGRESS.', async (page, data, result) => {
    const item = data.assignments.draft; await page.start(item);
    await page.driver.findElement(By.css('input[type="file"]')).sendKeys(path.join(root, 'fixtures/qa30-invalid-upload.txt'));
    const invalidName = 'qa30-invalid-upload.txt';
    await page.waitFor(async () => {
      const text = await page.text();
      return /dinh dang.*khong.*ho tro|unsupported.*(file|format)/.test(normalizeLabel(text)) || text.includes(invalidName);
    }, 'file selection handled', 5000);
    const filenames = [];
    for (const element of await page.driver.findElements(By.css('.writing-file-name'))) filenames.push(await element.getText());
    const snapshot = await latestAttempt(data, item, {submissionId: page.activeSubmissionId, includeAnswers:false});
    const uiText = await page.text();
    const invalidPreview = uiText.includes(invalidName);
    result.readback = { submissionId: snapshot.submission.id, status: snapshot.submission.status, selectedFilenames: filenames, invalidFilenameInVisibleText: invalidPreview, uiText, submittedByThisCase: false };
    assert.equal(snapshot.submission.status, 'IN_PROGRESS');
    assert.equal(filenames.length, 0, 'Writing accepted a TXT filename in its selected-file display; submission was not attempted');
    assert.equal(invalidPreview, false, 'Writing displays the invalid TXT as the selected upload; submission was not attempted');
    assert.match(normalizeLabel(await page.text()), /dinh dang.*khong.*ho tro|chi.*(pdf|docx)|unsupported.*(file|format)/, 'A meaningful unsupported-file validation message must appear');
  });
  add(39, 'Speaking: chưa ghi âm không được nộp', 'Mở Speaking mới, chưa bấm thu âm.', 'Nút Nộp bài bị vô hiệu hóa; chưa có audio và lượt chưa nộp.', async (page, data, result) => {
    const item = data.assignments.speakingValidation; await page.start(item);
    assert.equal(await (await page.visible(By.css('.btn-submit-speaking'))).isEnabled(), false);
    assert.match(normalizeLabel(await (await page.visible(By.css('.submission-file-status'))).getText()), /chua|not|no recording/);
    const snapshot = await latestAttempt(data, item, {submissionId:page.activeSubmissionId, includeAnswers:false});
    result.readback = { submissionId:snapshot.submission.id, status:snapshot.submission.status };
    assert.equal(snapshot.submission.status, 'IN_PROGRESS');
  });
  add(40, 'Writing: đếm từ và xóa nội dung', 'Nhập 5 từ vào editor, kiểm tra bộ đếm rồi xóa về rỗng.', 'Đếm 5 rồi 0; nội dung chưa bị nộp.', async (page, data) => {
    await page.start(data.assignments.draft);
    await page.fill(By.css('.writing-textarea'), 'Daily practice improves English skills');
    await page.waitFor(async () => /dem tu:\s*5\b/.test(normalizeLabel(await page.text())), 'word count is five', 5000);
    await page.fill(By.css('.writing-textarea'), '');
    await page.waitFor(async () => /dem tu:\s*0\b/.test(normalizeLabel(await page.text())), 'empty word count is zero', 5000);
  });
  add(41, 'Tổng quan: nút quay về danh sách bài', 'Mở Overview bài navigation; bấm Quay lại danh sách bài tập ở đầu trang.', 'Đi đúng /student/assignments; sidebar vẫn hoạt động.', async (page, data) => {
    await page.overview(data.assignments.navigation);
    await page.clickElement(await page.visible(By.css('.overview-back-btn')), 'Back to assignments');
    await page.routeIs('/student/assignments');
    await page.visible(By.css('#student-class-select'));
  });
  add(42, 'Chi tiết lớp: nút mở đúng bài chưa làm', 'Mở lớp QA30; tìm đúng thẻ navigation, bấm Bắt đầu làm bài trên thẻ.', 'Đi tới Overview đúng assignmentId; chưa tự tạo lượt trước khi bấm CTA Overview.', async (page, data) => {
    const item = data.assignments.navigation;
    const before = await listAttempts(data, item);
    assert.equal(before.length, 0, 'Navigation fixture must be unused');
    await page.classDetail(data);
    const card = await page.exactCard('.std-asg-card', item.title);
    await page.clickElement(await page.actionWithin(card, /Bắt đầu|Start/i), 'Open exact class assignment');
    await page.routeIs(`/student/assignments/${item.id}/overview`);
    assert.equal((await listAttempts(data, item)).length, 0, 'Opening Overview must not create an attempt');
  });
  add(43, 'Dashboard: nút xem bài tập và lớp học', 'Từ Dashboard bấm Xem tất cả bài tập; quay lại Dashboard rồi bấm Tất cả lớp học.', 'Hai nút đi đúng danh sách tương ứng, không trỏ trang giả.', async page => {
    await page.clickButton('Xem tất cả bài tập'); await page.routeIs('/student/assignments');
    await page.nav('/student/dashboard'); await page.clickButton('Tất cả lớp học');
    await page.routeIs('/student/classes');
  });
  add(44, 'Reading: hủy xác nhận nộp bài trắng', 'Mở MCQ mới; chưa chọn đáp án, bấm Hoàn thành & Nộp bài; hủy hộp xác nhận.', 'Có cảnh báo chưa trả lời; vẫn ở editor, cùng lượt IN_PROGRESS, không tạo lượt/nộp mới.', async (page, data, result) => {
    const item = data.assignments.mcqCancel; await page.start(item);
    const before = await listAttempts(data, item);
    const route = new URL(await page.driver.getCurrentUrl()).pathname;
    await page.clickButton('Hoàn thành & Nộp bài');
    await page.driver.wait(until.alertIsPresent(), 5000);
    const alert = await page.driver.switchTo().alert();
    const warning = await alert.getText(); await alert.dismiss();
    assert.match(warning, /chưa trả lời|not answered/i);
    assert.equal(new URL(await page.driver.getCurrentUrl()).pathname, route);
    const after = await latestAttempt(data, item, {submissionId:page.activeSubmissionId, includeAnswers:false});
    result.readback = {warning, submissionId:after.submission.id, status:after.submission.status};
    assert.equal(after.submission.status, 'IN_PROGRESS'); assert.equal(after.attempts.length, before.length);
  });
  add(45, 'Hết lượt: không được bắt đầu lần mới', 'Mở Overview bài đã chấm có maxSubmissions=1 và một lượt đã hoàn tất.', 'Số lượt khớp API, không còn nút bắt đầu được bật; không tạo thêm lượt.', async (page, data, result) => {
    const item = data.assignments.graded;
    const assignment = await data.api.get('student', `/assignments/${item.id}`);
    const attempts = await listAttempts(data, item);
    if (assignment.maxSubmissions !== 1 || attempts.length !== 1 || attempts[0].status === 'IN_PROGRESS') throw Object.assign(new Error('Exhausted-attempt fixture requires a fresh QA30 run'), {code:'QA30_PREREQUISITE'});
    await page.overview(item, {entry:'class'});
    await page.waitForHistory();
    const rule = await page.overviewRule('Số lượt nộp cho phép');
    result.readback = {uiAttemptRule:await rule.getText(), maxSubmissions:assignment.maxSubmissions, historyFinishedLoading:true, historyText:await (await page.visible(By.css('.overview-attempts-section'))).getText(), attempts:attempts.map(a=>({id:a.id,status:a.status}))};
    const actions = [];
    for (const button of await page.driver.findElements(By.css('.overview-cta-btn'))) actions.push({label:await button.getText(),visible:await button.isDisplayed(),enabled:await button.isEnabled()});
    result.readback.actions = actions;
    const failures = [];
    for (const check of [() => verifyAttemptRule(result.readback.uiAttemptRule, assignment.maxSubmissions, attempts), () => verifyExhaustedActions(actions)]) {
      try { check(); } catch (error) { failures.push(error.message); }
    }
    result.readback.failedChecks = failures;
    assert.equal((await listAttempts(data, item)).length, attempts.length);
    assert.deepEqual(failures, [], 'Exhausted Overview contract failed after history loaded; see readback.failedChecks and actions');
  });
}
