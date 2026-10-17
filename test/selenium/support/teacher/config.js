export function teacherData(env = process.env) {
  const dataTimeoutMs = Number(env.QA29_DATA_TIMEOUT_MS || 180000);
  if (!Number.isInteger(dataTimeoutMs) || dataTimeoutMs < 1000 || dataTimeoutMs > 300000) {
    throw new Error('QA29_DATA_TIMEOUT_MS must be an integer from 1000 to 300000');
  }
  const score = Number(env.QA29_SCORE || 7);
  if (!Number.isFinite(score) || score < 0 || score > 10 || score % 0.5 !== 0) {
    throw new Error('QA29_SCORE must be from 0 to 10, in steps of 0.5');
  }
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    className: env.QA29_CLASS_NAME?.trim(),
    studentName: env.QA29_STUDENT_NAME?.trim(),
    assignmentTitle: env.QA29_ASSIGNMENT_TITLE?.trim(),
    score,
    dataTimeoutMs,
    runId,
    prompt: `QA29 ${runId}: Write an essay about learning English every day.`,
    feedback: `QA29 ${runId}: Clear argument; improve examples and grammar.`,
  };
}

// Missing prerequisites are reported separately from application failures.
export function missingInputs(required, config, data) {
  const missing = [];
  if (!config.users.teacher.email) missing.push('SELENIUM_TEACHER_EMAIL');
  if (!config.users.teacher.password) missing.push('SELENIUM_TEACHER_PASSWORD');
  const names = { className: 'QA29_CLASS_NAME', studentName: 'QA29_STUDENT_NAME', assignmentTitle: 'QA29_ASSIGNMENT_TITLE' };
  for (const key of required) if (!data[key]) missing.push(names[key]);
  return missing;
}

export function teacherOptions(args) {
  let watch = false;
  let caseId;
  let delay;
  for (const arg of args) {
    if (arg === '--watch' && !watch) watch = true;
    else if (arg.startsWith('--case=') && caseId === undefined) caseId = arg.slice(7);
    else if (arg.startsWith('--delay-ms=') && delay === undefined) delay = Number(arg.slice(11));
    else throw new Error('Usage: node run-teacher.js [--case=QA29-001] [--watch] [--delay-ms=2500]');
  }
  if (caseId === '') throw new Error('--case requires a test ID');
  if (delay !== undefined && !watch) throw new Error('--delay-ms requires --watch');
  if (delay !== undefined && (!Number.isInteger(delay) || delay < 250 || delay > 10000)) throw new Error('--delay-ms must be from 250 to 10000');
  return { caseId, observeMs: watch ? delay ?? 2500 : 0 };
}
