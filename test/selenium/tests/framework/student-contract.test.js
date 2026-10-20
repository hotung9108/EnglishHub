import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAttemptRule, verifyAttemptRule, normalizeLabel, historyAttemptNumber, verifyExhaustedActions } from '../../support/student/ui-contract.js';
import { studentCases } from '../student/cases.js';
import { studentPlan } from '../../support/student/scenario-plan.js';
import { StudentPage } from '../../pages/student/StudentPage.js';
import { studentFailure } from '../../support/student/failure-policy.js';

test('Actual staging Overview format is parsed and 3 UI attempts cannot pass a 10-attempt API fixture', () => {
  const captured = '0 / 3 lần (Còn 3 lượt)';
  assert.deepEqual(parseAttemptRule(captured), { used: 0, maximum: 3, remaining: 3 });
  assert.throws(() => verifyAttemptRule(captured, 10, []), /UI=3, API=10/);
  verifyAttemptRule('0 / 10 lần (Còn 10 lượt)', 10, []);
});
test('Develop Overview wording and uppercase labels are accepted without weakening numeric assertions', () => {
  verifyAttemptRule('Tối đa 10 lần (Đã nộp 0/10)', 10, []);
  assert.equal(normalizeLabel('SỐ LƯỢT NỘP CHO PHÉP'), normalizeLabel('Số lượt nộp cho phép'));
  assert.throws(() => verifyAttemptRule('Tối đa 10 lần (Đã nộp 0/3)', 10, []), /conflicting/);
  assert.throws(() => verifyAttemptRule('1 / 10 lần (Còn 8 lượt)', 10, [{status:'SUBMITTED'}]), /remaining/);
});
test('Unknown Overview text is a UI-contract review, never a pass', () => {
  assert.throws(() => parseAttemptRule('Đang tải'), e => e.code === 'QA30_UI_CONTRACT');
});
test('Exhausted assignment may keep an enabled View Result button, but cannot start a new attempt', () => {
  verifyExhaustedActions([{label:'Xem lại kết quả',visible:true,enabled:true}]);
  verifyExhaustedActions([{label:'Bắt đầu làm bài',visible:true,enabled:false}]);
  assert.throws(() => verifyExhaustedActions([{label:'Bắt đầu làm bài (Lần 2)',visible:true,enabled:true}]), /enabled start/);
  assert.throws(() => verifyExhaustedActions([{label:'Unknown action',visible:true,enabled:true}]), e => e.code === 'QA30_UI_CONTRACT');
});
test('Attempt number remains exact when the best-score badge touches the text', () => {
  assert.equal(historyAttemptNumber('Lần 1Điểm cao nhất'), 1);
  assert.equal(historyAttemptNumber('Lần 10\nĐiểm cao nhất'), 10);
  assert.equal(Number.isNaN(historyAttemptNumber('Đang tải lịch sử')), true);
});

test('The real case 007 records the API/UI mismatch rather than waiting on the old locator', async () => {
  const item = {id:1, moduleId:2};
  const data = {studentId:3, assignments:{writing:item}, api:{get:async (_role, endpoint) => endpoint.startsWith('/submissions?') ? {data:[]} : {maxSubmissions:10}}};
  const result = {};
  const page = {
    overview:async () => {}, step:async () => {},
    overviewRule:async () => ({getText:async () => '0 / 3 lần (Còn 3 lượt)'}),
    visible:async locator => {
      assert.equal(locator.value, '.overview-cta-btn', 'Case must not use the stale rule-card XPath');
      return {getText:async () => 'Bắt đầu làm bài (Lần 1)', isEnabled:async () => true};
    },
  };
  await assert.rejects(studentCases.find(c => c.id === 'QA30-007').run(page, data, result), /UI=3, API=10/);
  assert.equal(result.readback.apiMaxSubmissions, 10);
  assert.equal(result.readback.uiAttemptRule, '0 / 3 lần (Còn 3 lượt)');
});

test('Overview field lookup handles deployed rule-item and CSS-uppercase labels', async () => {
  const value = {getText:async () => '0 / 3 lần (Còn 3 lượt)'};
  const container = {
    findElements:async locator => locator.value === '.overview-rule-label' ? [{getText:async () => 'SỐ LƯỢT NỘP CHO PHÉP'}] : [],
    findElement:async locator => {assert.equal(locator.value, '.overview-rule-val'); return value;},
  };
  const driver = {findElements:async locator => {
    // The captured deployment contains rule-item, not rule-card.
    assert.ok(locator.value.split(',').map(s => s.trim()).includes('.overview-rule-item'));
    return [container];
  }};
  const page = new StudentPage(driver, {}, {});
  assert.equal(await page.overviewRule('Số lượt nộp cho phép'), value);
  await assert.rejects(page.overviewRule('Không có trường này'), e => e.code === 'QA30_UI_CONTRACT');
});

test('Selected case 007 needs one fresh assignment and no grading/evaluation preparation', () => {
  assert.deepEqual(studentPlan('QA30-007'), {assignments:['writing'], grading:false, evaluation:false});
  assert.deepEqual(studentPlan('QA30-020'), {assignments:[], grading:false, evaluation:true});
  for (const c of studentCases) assert.doesNotThrow(() => studentPlan(c.id));
  assert.throws(() => studentPlan('QA30-046'), /Unknown/);
  assert.ok(studentPlan().assignments.includes('speakingValidation'));
  assert.ok(studentPlan('QA30-045').grading);
});

test('Grade lookup searches the actual title even when pagination hides it from the first page', async () => {
  const title = 'QA30-exact-graded-reading';
  let query = '';
  const searches = [];
  const target = {getText:async () => title};
  const driver = {findElements:async locator => {
    if (locator.value.includes('[colspan]')) return [];
    return query === title ? [target] : [{getText:async () => 'another assignment on page one'}];
  }};
  const page = new StudentPage(driver, {}, {});
  page.nav = async () => {};
  page.search = async value => { searches.push(value); query = value; };
  page.text = async () => 'another assignment on page one';
  page.waitFor = async fn => { const value = await fn(); assert.ok(value); return value; };
  const row = await page.gradeRow({assignments:{graded:{title,submissionId:99}}});
  assert.equal(row, target);
  assert.deepEqual(searches, [title]);
});

test('Exhaustion check waits past a rendered history section that is still loading', async () => {
  let reads = 0;
  const driver = {findElement:async () => ({getText:async () => ++reads === 1 ? 'Đang tải lịch sử các lần nộp bài...' : 'Đã làm 1 lần\nLần 1 7.5 / 10'})};
  const page = new StudentPage(driver, {}, {});
  page.waitFor = async check => {
    assert.equal(await check(), false, 'A visible loading row is not ready');
    assert.equal(await check(), true, 'Settled history allows assertions');
  };
  await page.waitForHistory();
  assert.equal(reads, 2);
});

test('Product-blocked action is not reported as a new product failure and does not stop unrelated cases', () => {
  assert.deepEqual(studentFailure({code:'QA30_PRODUCT_BLOCKED'},'scenario'),{status:'BLOCKED',classification:'PRODUCT_DEPENDENCY',stopSuite:false});
});

test('Empty grade search runs without finding the broken grading fixture', async () => {
  let loaded=false, query='';
  const page={
    gradesList:async()=>{loaded=true;},
    gradeRow:async()=>{throw new Error('Must not depend on grade identity');},
    search:async value=>{query=value;},
    waitFor:async fn=>{assert.equal(await fn(),true);},
    driver:{findElements:async locator=>locator.value.includes('td[colspan]')?[{}]:[]},
    text:async()=> 'Không tìm thấy kết quả',
  };
  await studentCases.find(c=>c.id==='QA30-031').run(page,{});
  assert.equal(loaded,true); assert.equal(query,'QA30-NO-MATCH-000000');
});

test('Feedback action records its missing-card prerequisite without hiding other assertions', async () => {
  const missing=Object.assign(new Error('Expected exactly one official feedback; found 0 cards'),{code:'ERR_ASSERTION'});
  await assert.rejects(studentCases.find(c=>c.id==='QA30-034').run({gradingFeedback:async()=>{throw missing;}},{}), e=>e.code==='QA30_PRODUCT_BLOCKED' && e.dependsOn.includes('QA30-022'));
  const ambiguous=Object.assign(new Error('found 2 cards'),{code:'ERR_ASSERTION'});
  await assert.rejects(studentCases.find(c=>c.id==='QA30-034').run({gradingFeedback:async()=>{throw ambiguous;}},{}),e=>e===ambiguous);
});
