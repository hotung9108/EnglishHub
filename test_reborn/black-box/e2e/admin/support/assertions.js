import assert from 'node:assert/strict';

export function assertReportClassCells(cells,expected) {
  assert.equal(cells[0],`ENG-${expected.classId}`,'Report class ID mismatch');
  assert.equal(cells[1],expected.className,'Report class name mismatch');
  const count=/^(\d+)(?:\s+(?:bài|hw))?$/.exec(cells[2]);
  assert.ok(count,'Unexpected assignment count format');
  assert.equal(Number(count[1]),expected.assignedAssignmentCount,'Report assignment count mismatch');
  assert.equal(cells[3],`${expected.averageScorePercent}%`,'Report average score mismatch');
  assert.equal(cells[4],`${expected.completionRatePercent}%`,'Report completion mismatch');
}

export function assertProgressMetrics(actual,expected) {
  for(const key of ['totalStudentCount','scoredStudentCount','belowAverageCount']) {
    assert.ok(Number.isFinite(expected[key]),`Missing API metric ${key}`);
    assert.equal(actual[key],String(expected[key]),`Progress metric mismatch: ${key}`);
  }
  assert.ok(Number.isFinite(expected.completionRatePercent),'Missing API completion rate');
  assert.equal(actual.completionRatePercent,`${expected.completionRatePercent}%`,'Progress completion mismatch');
}
export function assertGradingCells(cells,grading) {
  const labels={COMPLETED:['Đã hoàn thành','Completed'],AI_GRADED:['AI Đã Chấm','AI Graded'],PENDING:['Đang chờ duyệt','Pending'],FAILED:['Thất bại','Failed']};
  assert.equal(cells[0],`GR-${grading.id}`);
  assert.ok(labels[grading.status]?.includes(cells[1]),`Audit status mismatch: ${grading.status} / ${cells[1]}`);
  assert.ok((grading.finalScore==null?['Chưa có điểm','Unscored']:[String(grading.finalScore)]).includes(cells[2]),'Audit final score mismatch');
}
export function assertAuditLogs(rows,entries,fixture) {
  assert.ok(Array.isArray(entries)&&entries.length,'Audit history is empty; cannot verify change-log rendering');
  assert.ok(entries.some(e=>e.oldScore===fixture.oldScore&&e.newScore===fixture.newScore&&e.note===fixture.note),'Expected owned score correction is missing');
  assert.equal(rows.length,entries.length,'Audit history row count mismatch');
  const expected=entries.map(e=>JSON.stringify([String(e.oldScore??'-'),String(e.newScore??'-'),e.note||''])).sort();
  const actual=rows.map(c=>JSON.stringify([c[1],c[2],c[3]==='Không có ghi chú'||c[3]==='No note provided'?'':c[3]])).sort();
  assert.deepEqual(actual,expected,'Audit old/new score and note must match on the same row');
}

// Only pass a dedicated validation banner/native validation message here.
// Whole-page text can echo the invalid email in the preview, causing a false pass.
export function assertAccountRejected({email,pathname,formError,nativeMessage,users}) {
  assert.equal(pathname,'/admin/students/create','UI navigated away instead of rejecting invalid input');
  assert.ok(String(formError||nativeMessage||'').trim(),'Không có thông báo validation thực sự; preview không được tính là lỗi');
  assert.ok(Array.isArray(users),'Missing API readback for rejected account');
  assert.ok(!users.some(u=>u.email===email),'API vẫn có tài khoản với email sai định dạng');
}
