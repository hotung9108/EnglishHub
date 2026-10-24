import assert from 'node:assert/strict';
import path from 'node:path';
import { By } from 'selenium-webdriver';
import { root } from '../../config/env.js';
import { latestAttempt, listAttempts, verifySubmitted } from '../../support/student/fixtures.js';
import { verifyAttemptRule, historyAttemptNumber } from '../../support/student/ui-contract.js';
import { addNavigationCases } from './navigation-cases.js';

const cases = [];
const add = (n, title, steps, expected, run) => cases.push({ id: `QA30-${String(n).padStart(3, '0')}`, title, steps, expected, run });
const essay = [
  'Learning English every day can improve communication and confidence. Regular practice helps students remember new vocabulary and use it in practical situations. A small daily routine is more sustainable than studying only before an examination. Students can choose topics that connect their lessons with everyday activities and personal interests.',
  'First, daily practice gives learners repeated opportunities to meet familiar words in different contexts. A student may read a short article in the morning, listen to a conversation during a journey and write a summary in the evening. These activities connect pronunciation, meaning and spelling. The learner gradually recognises useful expressions without translating every sentence.',
  'Second, constructive feedback helps students identify recurring mistakes and discuss them with a teacher. Students who record a short speech can compare their recordings and notice improvements in clarity. Feedback becomes a set of achievable goals. Teachers can support this approach by assigning manageable exercises and reviewing earlier work together.',
  'In conclusion, purposeful daily study builds vocabulary and strengthens confidence. Learners should combine reading, listening, speaking and writing, while allowing time for rest. This synthetic essay is used only by the dedicated QA automation account to verify that the application preserves a complete submission.',
].join(' ');
const readback = async (page, data, item, result, options) => {
  const snapshot = await page.persistedAttempt(item);
  result.readback = { submissionId: snapshot.submission.id, submissionStatus: snapshot.submission.status, moduleId: snapshot.module.id, moduleStatus: snapshot.module.status, answers: snapshot.module.answers, grading: snapshot.module.grading };
  verifySubmitted(snapshot, options);
  return snapshot;
};

add(1, 'Đăng nhập Học viên và dashboard', 'Đăng nhập qua URL gốc, kiểm tra dashboard và role.', 'URL /student/dashboard, role STUDENT, có nội dung chính.', async page => {
  assert.equal(new URL(await page.driver.getCurrentUrl()).pathname, '/student/dashboard');
  assert.match(await page.text(), /Chào mừng|Welcome|Bài Tập|Assignments/);
});
add(2, 'Xem và tìm đúng lớp đã ghi danh', 'Mở Lớp học; tìm tên lớp QA30.', 'Đúng một thẻ lớp QA30 đã ghi danh, khớp API.', async (page, data) => { await page.classList(data); });
add(3, 'Tìm lớp không tồn tại', 'Mở lớp; nhập chuỗi không tồn tại.', 'Không còn thẻ lớp; có trạng thái rỗng.', async (page, data) => {
  await page.classList(data); await page.search('QA30-NO-MATCH-000000');
  await page.waitFor(async () => (await page.driver.findElements(By.css('.student-class-card'))).length === 0, 'empty class search');
  assert.match(await page.text(), /Không|No /);
});
add(4, 'Chi tiết lớp và danh sách bài', 'Bấm Xem lớp trên lớp QA30.', 'Đúng URL/tiêu đề lớp và các bài đã xuất bản.', async (page, data) => {
  await page.classDetail(data); await page.hasText(data.className);
  for (const key of ['reading', 'listening', 'speaking']) await page.hasText(data.assignments[key].title);
});
add(5, 'Tìm bài tập theo tiêu đề', 'Mở Bài tập; tìm chính xác bài Writing QA30.', 'Chỉ một thẻ bài đúng tiêu đề.', async (page, data) => { await page.assignmentList(data.assignments.writing); });
add(6, 'Tìm bài không tồn tại', 'Mở danh sách bài, nhập chuỗi không tồn tại.', 'Không còn thẻ bài; có trạng thái rỗng.', async (page, data) => {
  await page.assignmentList(data.assignments.writing); await page.search('QA30-NO-MATCH-000000');
  await page.waitFor(async () => (await page.driver.findElements(By.css('.std-asg-card'))).length === 0, 'empty assignment search');
  assert.match(await page.text(), /Không|No /);
});
add(7, 'Tổng quan bài và số lượt', 'Danh sách bài tập → tìm Writing → Tổng quan; cuộn đến ô số lượt và nút bắt đầu, không bấm làm bài.', 'Đúng tên/mã bài; số lượt khớp API, chưa có lượt làm; nút Bắt đầu được bật.', async (page, data, result) => {
  const item = data.assignments.writing;
  if ((await listAttempts(data, item)).length) throw Object.assign(new Error('This overview case requires a fresh assignment; use --fresh-fixtures'), { code: 'QA30_PREREQUISITE' });
  await page.overview(item);
  const rule = await page.overviewRule('Số lượt nộp cho phép');
  await page.step('Đọc số lượt nộp cho phép', rule);
  const button = await page.visible(By.css('.overview-cta-btn'));
  await page.step('Kiểm tra nút Bắt đầu ở cuối trang', button);
  assert.match(await button.getText(), /Bắt đầu|Start/i);
  assert.equal(await button.isEnabled(), true);
  const assignment = await data.api.get('student', `/assignments/${item.id}`);
  const attempts = await listAttempts(data, item);
  const value = await rule.getText();
  result.readback = { assignmentId: item.id, uiAttemptRule: value, apiMaxSubmissions: assignment.maxSubmissions, apiAttemptCount: attempts.length, startLabel: await button.getText() };
  assert.equal(attempts.length, 0, 'Opening Overview without pressing Start must not create an attempt');
  verifyAttemptRule(value, assignment.maxSubmissions, attempts);
});
add(8, 'Bắt đầu lượt Writing', 'Bắt đầu Writing từ Overview.', 'Có editor; API tạo lượt IN_PROGRESS gắn đúng module.', async (page, data, result) => {
  await page.start(data.assignments.draft);
  const snapshot = await latestAttempt(data, data.assignments.draft, { submissionId: page.activeSubmissionId, includeAnswers: false });
  result.readback = { id: snapshot.submission.id, status: snapshot.submission.status, moduleId: snapshot.module.moduleId };
  assert.equal(snapshot.submission.status, 'IN_PROGRESS'); assert.equal(snapshot.module.moduleId, data.assignments.draft.moduleId);
});
add(9, 'Validation Writing trống', 'Mở editor; xóa nội dung rồi bấm Nộp bài.', 'UI báo phải nhập/tải file; API vẫn IN_PROGRESS, không có bài nộp mới.', async (page, data, result) => {
  await page.start(data.assignments.draft); const before = await latestAttempt(data, data.assignments.draft, { submissionId: page.activeSubmissionId, includeAnswers: false });
  await page.fill(By.css('.writing-textarea'), ''); await page.clickButton('Nộp bài');
  await page.hasText('Vui lòng nhập nội dung'); const after = await latestAttempt(data, data.assignments.draft, { submissionId: page.activeSubmissionId, includeAnswers: false });
  result.readback = { beforeCount: before.attempts.length, afterCount: after.attempts.length, status: after.submission.status };
  assert.equal(after.submission.status, 'IN_PROGRESS'); assert.equal(after.attempts.length, before.attempts.length);
});
add(10, 'Lưu nháp Writing và mở lại', 'Nhập nội dung, Lưu nháp; đi qua sidebar rồi mở lại bài.', 'Editor giữ nguyên nội dung; chưa nộp API.', async (page, data) => {
  const item = data.assignments.draft; await page.start(item);
  await page.fill(By.css('.writing-textarea'), essay); await page.clickButton('Lưu bản nháp');
  await page.start(item);
  assert.equal(await (await page.visible(By.css('.writing-textarea'))).getAttribute('value'), essay);
  assert.equal((await latestAttempt(data, item, { submissionId: page.activeSubmissionId, includeAnswers: false })).submission.status, 'IN_PROGRESS');
});
add(11, 'Writing văn bản: đối chiếu khả năng lưu nội dung', 'Mở Writing ESSAY hợp lệ; nhập bài luận không đính kèm file, nộp bằng UI và đọc lại đúng lượt API.', 'UI cho nộp text thì nội dung phải được giữ. ESSAY hiện chỉ lưu file: mất text ghi CONTRACT_GAP_REVIEW để review FE/BE, không tính Pass.', async (page, data, result) => {
  await page.submitWriting(data.assignments.writing, essay);
  try { await readback(page, data, data.assignments.writing, result, { text: essay }); }
  catch (error) {
    if (error.code === 'ERR_ASSERTION' && error.message.includes('exact text entered through UI')) {
      error.code = 'QA30_CONTRACT_GAP';
      error.message = 'Writing UI offers text-only submission, but WRITING/ESSAY API stores files and did not retain the essay. Review the FE/BE contract; UI success alone is not a pass.';
    }
    throw error;
  }
});
add(12, 'Nộp Writing đính kèm PDF', 'Mở Writing ESSAY, chọn PDF mẫu, kiểm tra tên file rồi nộp qua UI.', 'Module/submission đã nộp và tài liệu READY trong API; không yêu cầu API lưu text của ESSAY.', async (page, data, result) => {
  await page.submitWriting(data.assignments.document, essay, { file: path.join(root, 'fixtures/qa29-writing-sample.pdf') });
  await readback(page, data, data.assignments.document, result, { document: true });
});
add(13, 'Nộp Reading đáp án đúng', 'Mở Reading, nhập daily practice, hoàn thành và nộp.', 'Đáp án lưu đúng, trạng thái đã nộp; auto score 10/10.', async (page, data, result) => {
  const item = data.assignments.reading; await page.submitQuiz(item, 'daily practice');
  const snapshot = await readback(page, data, item, result, { text: 'daily practice', questionId: item.questionId });
  await expectAutoScore(page, data, snapshot.module.id, 10, result);
});
add(14, 'Nộp Reading đáp án sai', 'Nhập incorrect answer và nộp qua UI.', 'Lưu câu trả lời sai; auto score 0/10, không biến điểm 0 thành thiếu điểm.', async (page, data, result) => {
  const item = data.assignments.wrong; await page.submitQuiz(item, 'incorrect answer');
  const snapshot = await readback(page, data, item, result, { text: 'incorrect answer', questionId: item.questionId });
  await expectAutoScore(page, data, snapshot.module.id, 0, result);
});
add(15, 'Nộp Listening câu trả lời ngắn', 'Mở Listening, điền daily practice và nộp.', 'Đáp án đúng được lưu, module/submission đã nộp. Không đánh giá chất lượng audio.', async (page, data, result) => {
  const item = data.assignments.listening; await page.submitQuiz(item, 'daily practice');
  await readback(page, data, item, result, { text: 'daily practice', questionId: item.questionId });
});
add(16, 'Speaking: ghi âm và nộp bản ghi thật', 'Bắt đầu/dừng recorder, bấm Nộp bài; đối chiếu trạng thái và audio API.', 'Bài đã nộp và audioStorageKey/audioUploadStatus READY. Recorder mô phỏng không được tính Pass.', async (page, data, result) => {
  const item = data.assignments.speaking; await page.start(item);
  await page.clickElement(await page.visible(By.css('.speaking-btn-record')), 'Start recording');
  await page.hasText('Đang ghi âm');
  const timer = await page.visible(By.css('.speaking-card:has(.speaking-btn-record) .speaking-cue-timing, .speaking-card:has(.speaking-btn-record) .speaking-card-timing'));
  await page.waitFor(async () => /00:0[3-9]|00:[1-5]\d/.test(await timer.getText()), 'recorder timer reaches at least three seconds', 10000);
  await page.clickElement(await page.visible(By.css('.speaking-btn-record')), 'Stop recording');
  await page.hasText('Sẵn sàng nộp'); await page.clickElement(await page.visible(By.css('.btn-submit-speaking')), 'Submit speaking');
  await page.submissionNavigation(item); await readback(page, data, item, result, { audio: true });
});
add(17, 'Mở kết quả bài đã chấm', 'Từ đúng dòng Bảng điểm, bấm xem kết quả bài fixture.', 'Đúng submissionId, tiêu đề và ô điểm 7.5.', async (page, data) => {
  await page.result(data);
  assert.equal(await page.resultScore(), 7.5);
});
add(18, 'Điểm thô khớp thang điểm API', 'Tìm bài Reading đã chấm trong Bảng điểm; đối chiếu maxScoreSnapshot.', 'Điểm thô phải là 7.5/10, không hiển thị sai mẫu số 100.', async (page, data, result) => {
  const row = await page.gradeRow(data); const text = await row.getText();
  const grading = await data.api.get('student', `/gradings/${data.assignments.graded.gradingId}`);
  result.readback = { uiRow: text, score: grading.finalScore, maximum: grading.maxScoreSnapshot };
  const cells = await row.findElements(By.css('td'));
  assert.equal((await cells[4].getText()).replace(/\s/g, '').replace(',', '.'), `${grading.finalScore}/${grading.maxScoreSnapshot}`, 'Raw score cell must match API score and maximum');
});
add(19, 'Lọc Bảng điểm theo kỹ năng Reading', 'Tải bảng điểm; chọn Reading, kiểm tra các dòng hiển thị, độc lập việc tìm tiêu đề fixture.', 'Bộ lọc được chọn Reading; mọi dòng dữ liệu có nhãn READING. Bảng rỗng dù API có bài Reading cần review mapping.', async (page, data, result) => {
  await page.gradesList();
  const select = await page.visible(By.xpath('//main//select[option[@value="Reading"] or option[@value="reading"]]'));
  await select.findElement(By.xpath('.//option[normalize-space(.)="Reading"]')).click();
  await page.waitFor(async () => (await select.getAttribute('value')).toLowerCase() === 'reading', 'Reading skill selected', 5000);
  await page.waitFor(async()=>{
    for(const row of await page.driver.findElements(By.css('.grades-table tbody tr'))){const cells=await row.findElements(By.css('td'));if(cells.length>=8 && (await cells[1].getText()).trim().toUpperCase()!=='READING')return false;}
    return true;
  },'grade rows reflect Reading filter',5000);
  const rows = await page.driver.findElements(By.css('.grades-table tbody tr'));
  const skills = [];
  for (const row of rows) { const cells = await row.findElements(By.css('td')); if (cells.length >= 8) skills.push((await cells[1].getText()).trim().toUpperCase()); }
  result.readback={selectedSkill:await select.getAttribute('value'),visibleSkills:skills,scope:'Checks skill filter over displayed rows; assignment identity is checked separately in QA30-028'};
  assert.ok(skills.length, 'Reading filter returned no data despite the graded Reading fixture; inspect grade mapping');
  for (const skill of skills) assert.equal(skill,'READING');
});
add(20, 'Xem đánh giá định kỳ đúng nội dung', 'Mở Nhận xét; tìm nội dung đánh giá QA30.', 'Đúng nội dung và lớp đã ghi trong API evaluation.', async (page, data) => {
  await page.feedback(data); const cards = await page.driver.findElements(By.css('.feedback-card'));
  assert.equal(cards.length, 1); assert.ok((await cards[0].getText()).includes(data.className));
});
add(21, 'Đánh giá định kỳ: lọc giáo viên và mở lớp', 'Tìm evaluation; chọn Từ Giảng viên rồi bấm nút hành động của chính thẻ đánh giá định kỳ.', 'Đánh giá vẫn hiện; hành động phải mở lớp QA30, không mở kết quả bài nộp không liên quan.', async (page, data) => {
  await page.feedback(data); await page.clickButton('Từ Giảng viên'); await page.hasText(data.evaluation.content);
  const card = await page.visible(By.css('.feedback-card'));
  const actions = await card.findElements(By.css('button, a'));
  assert.ok(actions.length, 'Periodic evaluation must provide a class action');
  page.config.onEvidence?.({ type: 'evaluation-action', label: await actions.at(-1).getText(), expectedClassId: data.classId });
  await page.clickElement(actions.at(-1), 'Open periodic evaluation target');
  await page.waitFor(async () => new URL(await page.driver.getCurrentUrl()).pathname !== '/student/feedback', 'evaluation action navigation');
  assert.equal(new URL(await page.driver.getCurrentUrl()).pathname, `/student/classes/${data.classId}`, 'Evaluation action must open its class, not an unrelated submission');
  await page.hasText(data.className);
});
add(22, 'Nhận xét chấm bài chính thức', 'Mở Nhận xét và tìm finalFeedback của bài fixture.', 'Nhận xét chính thức từ API hiển thị nguyên nội dung.', async (page, data) => {
  await page.gradingFeedback(data);
});
add(23, 'Tìm nhận xét không tồn tại', 'Sau khi tải feedback, tìm chuỗi không có.', 'Không có thẻ feedback, hiện trạng thái rỗng.', async (page, data) => {
  await page.feedback(data); await page.search('QA30-NO-MATCH-000000');
  await page.waitFor(async () => (await page.driver.findElements(By.css('.feedback-card'))).length === 0, 'empty feedback search');
  assert.match(await page.text(), /Không|No /);
});
add(24, 'Lịch sử lượt nộp bài đã chấm', 'Lớp học → đúng bài đã chấm → Overview; so lịch sử với API, độc lập nút Bảng điểm.', 'Số dòng, số lượt và điểm của lượt fixture phải khớp API.', async (page, data, result) => {
  await page.overview(data.assignments.graded, { entry: 'class' });
  const attempts = await listAttempts(data, data.assignments.graded);
  await page.waitFor(async () => {
    const rows = await page.driver.findElements(By.css('.overview-table tbody tr'));
    let count = 0;
    for (const row of rows) if (Number.isFinite(historyAttemptNumber(await row.getText()))) count++;
    return count === attempts.length;
  }, 'history rows match API count', 10000);
  const rows = await page.driver.findElements(By.css('.overview-table tbody tr'));
  result.readback = { attempts: attempts.map(sub => ({ id: sub.id, status: sub.status, attemptNumber: sub.attemptNumber })), uiRows: [] };
  for (const attempt of attempts) {
    const row = await findHistoryRow(rows, attempt.attemptNumber);
    assert.ok(row, `Missing history row for attempt ${attempt.attemptNumber}`);
    const text = await row.getText(); result.readback.uiRows.push(text);
    if (attempt.id === data.assignments.graded.submissionId) {
      assert.equal((await (await row.findElement(By.css('td:nth-child(3)'))).getText()).replace(/\s/g, '').replace(',', '.'), '7.5/10');
      assert.match(text, /Đã có điểm|Đã chấm|Graded/);
    }
  }
});

async function findHistoryRow(rows, number) {
  for (const row of rows) if (historyAttemptNumber(await (await row.findElement(By.css('td:first-child'))).getText()) === number) return row;
}

async function expectAutoScore(page, data, moduleId, score, result) {
  await page.waitFor(async () => {
    const grade = await data.api.get('student', `/submission-modules/${moduleId}/grading`);
    result.readback.grade = grade;
    const actual = grade.finalScore ?? grade.autoScore;
    if (actual === null || actual === undefined) return false;
    assert.equal(actual, score); return true;
  }, `automatic grading completes with ${score}/10`, 15000);
}

for (const [n, key, option, score] of [[25, 'mcqReading', 1, 10], [26, 'mcqWrong', 2, 0], [27, 'mcqListening', 1, 10]]) {
  add(n, `${key === 'mcqListening' ? 'Listening' : 'Reading'} MCQ: ${score === 0 ? 'đáp án sai, điểm 0' : 'đáp án đúng, điểm 10'}`, `Chọn đáp án ${option} trong câu MCQ, nộp qua UI, đọc lại đúng lượt.`, `Đáp án ${option} lưu đúng questionId; module/submission đã nộp và auto score ${score}/10.`, async (page, data, result) => {
    const item = data.assignments[key]; await page.submitQuiz(item, option);
    const snapshot = await readback(page, data, item, result, { selectedOptionId: option, questionId: item.questionId });
    await expectAutoScore(page, data, snapshot.module.id, score, result);
  });
}
add(28, 'Bảng điểm gắn đúng tên bài, kỹ năng và trạng thái', 'Tìm dòng bài chấm sẵn và so metadata với fixture/API.', 'Đúng tên bài Reading và trạng thái đã có điểm; không dùng tên thay thế hoặc Writing.', async (page, data, result) => {
  const row = await page.gradeRow(data).catch(error => { if (error.code === 'QA30_PRODUCT_BLOCKED') error.code = 'ERR_ASSERTION'; throw error; }); const cells = await row.findElements(By.css('td'));
  result.readback = { row: await row.getText(), assignment: data.assignments.graded.title, expectedSkill: 'READING', gradingId: data.assignments.graded.gradingId };
  assert.ok((await cells[0].getText()).includes(data.assignments.graded.title), 'Grade row is missing the actual assignment title');
  assert.equal((await cells[1].getText()).trim().toUpperCase(), 'READING');
  assert.match(await cells[6].getText(), /Đã có điểm|Đã chấm|Hoàn thành|Graded|Completed/);
});

addNavigationCases(add);
export const studentCases = cases;
