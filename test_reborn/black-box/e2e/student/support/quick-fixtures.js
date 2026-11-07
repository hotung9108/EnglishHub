import assert from 'node:assert/strict';

export const fixtureKeyForCase = number => ({
  5: 'writing', 6: 'writing', 7: 'writing', 8: 'draft', 9: 'draft', 10: 'draft',
  11: 'writing', 12: 'document', 13: 'reading', 14: 'wrong', 15: 'listening',
  16: 'speaking', 17: 'graded', 18: 'graded', 19: 'graded', 22: 'graded',
  24: 'graded', 25: 'mcqReading', 26: 'mcqWrong', 27: 'mcqListening', 28: 'graded',
  30: 'graded', 31: 'graded', 32: 'graded', 33: 'graded', 34: 'graded', 35: 'graded',
  36: 'graded', 37: 'graded', 38: 'draft', 39: 'speakingValidation', 40: 'draft',
  41: 'navigation', 42: 'navigation', 44: 'mcqCancel', 45: 'graded',
})[number];

// Cache reuse still checks the authenticated identity and resource ownership.
// Only an exhausted editor fixture (or used Overview fixture) is replaced.
export async function reuseStudentFixture(config, { account, data, caseId, api, save, create, list, progress = () => {}, check = () => {} }) {
  const number = Number(caseId.slice(-3));
  assert.ok(number >= 1 && number <= 45, 'Unknown student case');
  assert.match(account.email, /^qa30-[0-9a-f]{12}@example\.invalid$/);
  config.users.student = account;
  progress('Dang nhap tai khoan QA30 da co...'); check();
  const student = await api.login('student');
  assert.equal(student.id, data.studentId);
  assert.equal(student.role, 'STUDENT');
  assert.equal(student.fullName, 'QA Student Automation');
  progress('Xac minh lop QA30 va du lieu case...'); check();
  const cls = await api.get('student', `/classes/${data.classId}`);
  assert.equal(cls.name, data.className);
  assert.equal(cls.teacherId ?? cls.teacher?.id, data.teacherId);
  const key = fixtureKeyForCase(number);
  if (key) {
    const item = data.assignments[key];
    assert.ok(item?.ready, 'Selected fixture is incomplete');
    const assignment = await api.get('student', `/assignments/${item.id}`);
    assert.equal(assignment.title, item.title);
    assert.ok(assignment.modules?.some(module => module.id === item.moduleId), 'Cached module does not match the assignment');
    if (number === 7 || number >= 8 && number <= 16 || number >= 25 && number <= 27 || [38, 39, 40, 41, 42, 44].includes(number)) {
      const attempts = await list({ ...data, api }, item);
      const replace = [7, 41, 42].includes(number) ? attempts.length > 0 : attempts.length > 0 && !attempts.some(attempt => attempt.status === 'IN_PROGRESS');
      if (replace) {
        progress(`Bai ${key} da dung; chi tao lai bai nay, giu cac bai khac.`); check();
        await api.login('teacher'); assert.equal(api.sessions.teacher.user.id, data.teacherId);
        const previous = data.assignments[key];
        delete data.assignments[key];
        try { await create(api, data, key, save, check); }
        catch (error) { if (!data.assignments[key]) data.assignments[key] = previous; throw error; }
      }
    }
  }
  if ([17, 18, 19, 22, 24, 28, 30, 31, 32, 33, 34, 35, 36, 37, 45].includes(number)) {
    check(); const grading = await api.get('student', `/gradings/${data.assignments.graded.gradingId}`);
    assert.equal(grading.finalScore, 7.5); assert.equal(grading.finalFeedback, data.feedback);
  }
  if ([20, 21, 23, 33].includes(number)) {
    check(); const evaluations = await api.get('student', `/students/${data.studentId}/evaluations?classId=${data.classId}&limit=100`);
    assert.ok(evaluations.data.some(item => item.id === data.evaluation.id && item.content === data.evaluation.content));
  }
  progress('Du lieu san sang; dang mo Chrome cho case da chon.'); check();
  return { ...data, api };
}
