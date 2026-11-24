import { describe, expect, it } from 'vitest';
import type { QuestionOptionResponse } from '../../api/services/question.service';
import type { SubmitModuleAnswerPayload } from '../../api/services/submission.service';
import {
  buildStudentQuizPayload,
  isStudentQuizBlank,
  validateStudentQuizQuestions,
  type StudentQuizAnswers,
} from '../../utils/studentQuiz.utils';
import { classifyStudentQuizProgress, isStudentQuizPendingFinalization, isStudentQuizSubmitScopeValid, type StudentQuizSubmitScope } from '../../utils/studentQuiz.utils';

// Question text and original option content: db-snapshot/questions.csv, IDs 51 and 53.
// Nonstandard IDs and malformed values below are explicit boundary transformations.
const MCQ_ID = 51;
const SHORT_ID = 53;
const OPTION_IDS = [101, 102, 103, 104];
const SPECIAL_TEXT = '<script>alert("x")</script><img src=x onerror=alert(1)> &amp; & < > " \' Tiếng Việt 😀';
const LONG_TEXT = 'Đáp án 😀 <b>&amp;</b> '.repeat(5_000);

function options(ids = OPTION_IDS): QuestionOptionResponse[] {
  const contents = ['Failing', 'Winning', 'Arriving', 'Borrowing'];
  return ids.map((id, index) => ({ id, content: contents[index] }));
}

function mcq(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: MCQ_ID,
    content: 'What is the opposite of passing an exam?',
    questionType: 'MULTIPLE_CHOICE',
    options: options(),
    ...overrides,
  };
}

function shortAnswer(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: SHORT_ID,
    content: 'What do you use to unlock a door?',
    questionType: 'SHORT_ANSWER',
    ...overrides,
  };
}

const invalidIds: unknown[] = [
  undefined, null, 0, -1, 1.5, '101', NaN, Infinity, -Infinity,
  Number.MAX_SAFE_INTEGER + 1, true, {}, [], 101n, Symbol('id'),
];

function cases<T>(values: readonly T[]): [T][] {
  return values.map(value => [value]);
}

describe('validateStudentQuizQuestions', () => {
  it('keeps four public MCQ option contents and real IDs', () => {
    const question = mcq();
    const result = validateStudentQuizQuestions([question]);
    expect(result.isValid).toBe(true);
    expect(result.listError).toBeNull();
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]).toMatchObject({ index: 0, questionId: MCQ_ID, reason: null, question });
  });

  it.each([
    [101, 102, 103, 104],
    [3, 17, 88, 204],
    [104, 103, 102, 101],
    [1, 100, Number.MAX_SAFE_INTEGER, 101],
  ])('preserves option order and positive safe IDs: %j', (...ids) => {
    const result = validateStudentQuizQuestions([mcq({ options: options(ids) })]);
    expect(result.isValid).toBe(true);
    expect(result.questions[0].question?.options).toEqual(options(ids));
  });

  it('accepts SHORT_ANSWER without options or a model answer', () => {
    const result = validateStudentQuizQuestions([shortAnswer()]);
    expect(result.isValid).toBe(true);
    expect(result.questions[0].question).toEqual(shortAnswer());
  });

  it('does not inspect irrelevant SHORT_ANSWER options or correctAnswer', () => {
    const question = shortAnswer();
    Object.defineProperty(question, 'options', { get() { throw new Error('must not read options'); } });
    Object.defineProperty(question, 'correctAnswer', { get() { throw new Error('must not read model'); } });
    expect(validateStudentQuizQuestions([question]).isValid).toBe(true);
  });

  it.each(['MULTIPLE_CHOICE', 'multiple_choice', 'Multiple_Choice'])('accepts MCQ type %s', questionType => {
    const result = validateStudentQuizQuestions([mcq({ questionType })]);
    expect(result.isValid).toBe(true);
    expect(result.questions[0].question?.questionType).toBe('MULTIPLE_CHOICE');
  });

  it.each(['SHORT_ANSWER', 'short_answer', 'Short_Answer'])('accepts short type %s', questionType => {
    const result = validateStudentQuizQuestions([shortAnswer({ questionType })]);
    expect(result.isValid).toBe(true);
    expect(result.questions[0].question?.questionType).toBe('SHORT_ANSWER');
  });

  it.each(cases([
    ' SHORT_ANSWER ', ' MULTIPLE_CHOICE', 'SHORT_ANSWER\n', '\tSHORT_ANSWER',
    'UNKNOWN', 'MULTIPLECHOICE', '', ' ', null, undefined, 3, NaN, true, {}, [], Symbol('type'),
  ]))('does not infer or trim unsupported type %s', questionType => {
    const result = validateStudentQuizQuestions([mcq({ questionType })]);
    expect(result.questions[0].reason).toBe('QUESTION_TYPE_UNSUPPORTED');
    expect(result.questions[0].question).toBeNull();
    expect(result.isValid).toBe(false);
  });

  it.each(cases([undefined, null, {}, 'questions', 12, true, () => []]))('rejects non-array list %s', value => {
    expect(validateStudentQuizQuestions(value)).toEqual({
      isValid: false, listError: 'QUESTIONS_NOT_ARRAY', questions: [],
    });
  });

  it('rejects an empty list', () => {
    expect(validateStudentQuizQuestions([])).toEqual({ isValid: false, listError: 'QUESTIONS_EMPTY', questions: [] });
  });

  it.each(cases([null, undefined, 'question', 7, false, [], () => mcq()]))('keeps invalid question position for %s', value => {
    const result = validateStudentQuizQuestions([shortAnswer(), value]);
    expect(result.isValid).toBe(false);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].question).not.toBeNull();
    expect(result.questions[1]).toMatchObject({ index: 1, questionId: null, question: null, reason: 'QUESTION_NOT_OBJECT' });
  });

  it('does not silently drop sparse list entries', () => {
    const result = validateStudentQuizQuestions(new Array<unknown>(2));
    expect(result.questions.map(q => q.reason)).toEqual(['QUESTION_NOT_OBJECT', 'QUESTION_NOT_OBJECT']);
    expect(result.questions.map(q => q.index)).toEqual([0, 1]);
  });

  it.each(cases(invalidIds))('rejects invalid question ID %s', id => {
    expect(validateStudentQuizQuestions([mcq({ id })]).questions[0].reason).toBe('QUESTION_ID_INVALID');
  });

  it('accepts the maximum safe positive question ID', () => {
    expect(validateStudentQuizQuestions([shortAnswer({ id: Number.MAX_SAFE_INTEGER })]).isValid).toBe(true);
  });

  it('flags every occurrence of a duplicate question ID, including an otherwise invalid question', () => {
    const result = validateStudentQuizQuestions([mcq(), shortAnswer({ id: MCQ_ID, content: null }), shortAnswer()]);
    expect(result.isValid).toBe(false);
    expect(result.questions.map(q => q.reason)).toEqual(['QUESTION_ID_DUPLICATE', 'QUESTION_ID_DUPLICATE', null]);
    expect(result.questions[0].question).toBeNull();
    expect(result.questions[1].question).toBeNull();
    expect(result.questions[2].question?.id).toBe(SHORT_ID);
  });

  it('does not attach an option position to a duplicate question ID error', () => {
    const list: unknown[] = options();
    list[1] = null;
    const result = validateStudentQuizQuestions([mcq({ options: list }), mcq()]);
    expect(result.questions[0].reason).toBe('QUESTION_ID_DUPLICATE');
    expect(result.questions[0]).not.toHaveProperty('optionIndex');
  });

  it.each(cases([undefined, null, '', ' \n\t ', '\u00a0', 42, {}, []]))('rejects invalid question content %s', content => {
    expect(validateStudentQuizQuestions([shortAnswer({ content })]).questions[0].reason).toBe('QUESTION_CONTENT_INVALID');
  });

  it.each(cases([undefined, null, {}, 'options', 4, true]))('rejects non-array options %s', value => {
    expect(validateStudentQuizQuestions([mcq({ options: value })]).questions[0].reason).toBe('OPTIONS_NOT_ARRAY');
  });

  it.each([0, 1])('rejects %i options (less than 2)', count => {
    const value = Array.from({ length: count }, (_, i) => ({ id: i + 1, content: 'Failing' }));
    expect(validateStudentQuizQuestions([mcq({ options: value })]).questions[0].reason).toBe('OPTIONS_COUNT_INVALID');
  });

  it.each([2, 3, 4, 5])('accepts %i options with valid structure', count => {
    const value = Array.from({ length: count }, (_, i) => ({ id: i + 1, content: `Option ${i + 1}` }));
    expect(validateStudentQuizQuestions([mcq({ options: value })]).questions[0].reason).toBeNull();
  });

  it('reports [null] safely as a wrong option count', () => {
    const result = validateStudentQuizQuestions([mcq({ options: [null] })]);
    expect(result.questions[0].reason).toBe('OPTIONS_COUNT_INVALID');
  });

  it.each(cases([null, undefined, 101, 'Failing', false, [], () => options()[0]]))('rejects non-object option %s', value => {
    const list: unknown[] = options();
    list[2] = value;
    expect(validateStudentQuizQuestions([mcq({ options: list })]).questions[0]).toMatchObject({
      reason: 'OPTION_NOT_OBJECT', optionIndex: 2, question: null,
    });
  });

  it('rejects a hole in a four-item options array', () => {
    const list: unknown[] = options();
    delete list[1];
    expect(validateStudentQuizQuestions([mcq({ options: list })]).questions[0].reason).toBe('OPTION_NOT_OBJECT');
  });

  it.each(cases(invalidIds))('rejects invalid option ID %s', id => {
    const list: unknown[] = options();
    list[0] = { id, content: 'Failing' };
    expect(validateStudentQuizQuestions([mcq({ options: list })]).questions[0]).toMatchObject({
      reason: 'OPTION_ID_INVALID', optionIndex: 0,
    });
  });

  it('rejects duplicate option IDs', () => {
    const result = validateStudentQuizQuestions([mcq({ options: options([101, 102, 101, 104]) })]);
    expect(result.questions[0]).toMatchObject({ reason: 'OPTION_ID_DUPLICATE', optionIndex: 2 });
  });

  it.each(cases([undefined, null, '', ' \n\t ', '\u00a0', 42, {}, []]))('rejects invalid option content %s', content => {
    const list: unknown[] = options();
    list[1] = { id: 102, content };
    expect(validateStudentQuizQuestions([mcq({ options: list })]).questions[0]).toMatchObject({
      reason: 'OPTION_CONTENT_INVALID', optionIndex: 1,
    });
  });

  it('never falls back to correctAnswer when public options are missing', () => {
    const result = validateStudentQuizQuestions([mcq({ options: undefined, correctAnswer: { options: options() } })]);
    expect(result.questions[0].reason).toBe('OPTIONS_NOT_ARRAY');
  });

  it('copies only public fields and never reads correctAnswer', () => {
    const question = mcq({ options: options().map(option => ({ ...option, isCorrect: true })) });
    Object.defineProperty(question, 'correctAnswer', { get() { throw new Error('must not read model'); } });
    expect(validateStudentQuizQuestions([question]).questions[0].question).toEqual(mcq());
  });

  it.each([SPECIAL_TEXT, LONG_TEXT, '  Keep outside spaces  ', 'A'.repeat(100_000)])('preserves question/option text without decoding or truncating (%#)', content => {
    const list = options();
    list[0] = { id: 101, content };
    const question = mcq({ content, options: list });
    const result = validateStudentQuizQuestions([question]);
    expect(result.isValid).toBe(true);
    expect(result.questions[0].question?.content).toBe(content);
    expect(result.questions[0].question?.options?.[0].content).toBe(content);
  });

  it('does not mutate or retain mutable public option objects', () => {
    const list = options();
    list.forEach(Object.freeze);
    Object.freeze(list);
    const question = Object.freeze(mcq({ options: list }));
    const input = Object.freeze([question]);
    const result = validateStudentQuizQuestions(input);
    expect(result.isValid).toBe(true);
    const copied = result.questions[0].question?.options;
    expect(copied).not.toBe(list);
    expect(copied?.[0]).not.toBe(list[0]);
    expect(list).toEqual(options());
  });

  it('reports throwing question/option properties without throwing', () => {
    const question = mcq();
    Object.defineProperty(question, 'options', { get() { throw new Error('unreadable options'); } });
    const result = validateStudentQuizQuestions([question, shortAnswer()]);
    expect(result.questions[0]).toMatchObject({ reason: 'QUESTION_UNREADABLE', questionId: MCQ_ID });
    expect(result.questions[1].reason).toBeNull();
    const option = { get id() { throw new Error('unreadable ID'); }, content: 'Failing' };
    expect(validateStudentQuizQuestions([mcq({ options: [option, ...options().slice(1)] })]).questions[0].reason).toBe('QUESTION_UNREADABLE');
  });

  it('reports unreadable array access as a list error', () => {
    const input = new Proxy([mcq()], { get() { throw new Error('unreadable list'); } });
    expect(validateStudentQuizQuestions(input).listError).toBe('QUESTIONS_UNREADABLE');
  });
});

describe('student quiz submission progress', () => {
  const scope: StudentQuizSubmitScope = { assignmentId: 4, submissionId: 325, moduleId: 13, submissionModuleId: 1182, expectedModuleIds: [13, 14] };
  function progress(overrides: Record<string, unknown> = {}) {
    return { id: 325, assignmentId: 4, status: 'IN_PROGRESS', modules: [
      { id: 1182, moduleId: 13, skill: 'READING', status: 'SUBMITTED' },
      { id: 1183, moduleId: 14, skill: 'LISTENING', status: 'GRADED' },
    ], ...overrides };
  }
  it.each(['SUBMITTED', 'GRADED'])('classifies terminal parent %s', status => {
    expect(classifyStudentQuizProgress(progress({ status }), scope).kind).toBe('completed');
    expect(isStudentQuizPendingFinalization(progress({ status }), scope)).toBe(false);
  });
  it('recognizes pending finalization for Reading and Listening, without mutating the response', () => {
    const input = progress();
    const original = JSON.stringify(input);
    expect(isStudentQuizPendingFinalization(input, scope)).toBe(true);
    expect(isStudentQuizPendingFinalization(input, { ...scope, moduleId: 14, submissionModuleId: 1183 })).toBe(true);
    expect(JSON.stringify(input)).toBe(original);
  });
  it('uses expected module order to identify the next incomplete skill', () => {
    const input = progress();
    input.modules[0].status = 'IN_PROGRESS';
    input.modules[1].status = 'IN_PROGRESS';
    expect(classifyStudentQuizProgress(input, { ...scope, expectedModuleIds: [14, 13] })).toMatchObject({ kind: 'nextSkill', nextModule: { moduleId: 14 } });
    expect(isStudentQuizPendingFinalization(input, scope)).toBe(false);
  });
  const invalid: unknown[] = [null, undefined, [], 3, 'submission', {},
    progress({ id: 999 }), progress({ assignmentId: 999 }), progress({ status: 'UNKNOWN' }),
    progress({ modules: [] }), progress({ modules: null }), progress({ modules: {} }),
    progress({ modules: [progress().modules[0]] }),
    progress({ modules: [null, progress().modules[1]] }),
    progress({ modules: [progress().modules[0], progress().modules[0]] }),
    progress({ modules: [{ ...progress().modules[0], id: 999 }, progress().modules[1]] }),
    progress({ modules: [{ ...progress().modules[0], skill: 'WRITING' }, progress().modules[1]] }),
    progress({ modules: [{ ...progress().modules[0], status: 'UNKNOWN' }, progress().modules[1]] }),
    progress({ modules: [{ ...progress().modules[0], moduleId: 999 }, progress().modules[1]] }),
    progress({ modules: [{ ...progress().modules[0], id: 0 }, progress().modules[1]] }),
    progress({ modules: [progress().modules[0], { ...progress().modules[1], id: 1182 }] }),
    progress({ modules: [progress().modules[0], { ...progress().modules[1], skill: null }] }),
  ];
  it.each(invalid.map(value => [value]))('rejects untrusted/incomplete progress (%#)', value => {
    expect(classifyStudentQuizProgress(value, scope)).toMatchObject({ kind: 'unconfirmed' });
    expect(isStudentQuizPendingFinalization(value, scope)).toBe(false);
  });
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid scope ID %s', assignmentId => {
    expect(classifyStudentQuizProgress(progress(), { ...scope, assignmentId })).toMatchObject({ kind: 'unconfirmed', reason: 'INVALID_SCOPE' });
  });
  it.each([[], [13], [13, 13], [14], [13, 0]])('rejects invalid expected IDs %j', (...expectedModuleIds) => {
    const result = classifyStudentQuizProgress(progress(), { ...scope, expectedModuleIds });
    expect(result.kind).toBe('unconfirmed');
  });
  it('contains getter/proxy failures at the progress boundary', () => {
    const input = { get id() { throw new Error('unreadable'); } };
    expect(classifyStudentQuizProgress(input, scope).kind).toBe('unconfirmed');
    expect(isStudentQuizPendingFinalization(input, scope)).toBe(false);
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    expect(classifyStudentQuizProgress(revoked.proxy, scope).kind).toBe('unconfirmed');
  });
  it.each([null, undefined, {}, { ...scope, expectedModuleIds: null }, { ...scope, submissionModuleId: 0 }].map(value => [value]))('rejects malformed scope without throwing (%#)', value => {
    expect(isStudentQuizSubmitScopeValid(value)).toBe(false);
  });
});

describe('buildStudentQuizPayload and isStudentQuizBlank', () => {
  it('builds a full payload with the real option ID and trimmed short text', () => {
    const input: StudentQuizAnswers = {
      [MCQ_ID]: { questionType: 'MULTIPLE_CHOICE', selectedOptionId: 103 },
      [SHORT_ID]: { questionType: 'SHORT_ANSWER', text: '  key \n\t' },
    };
    const expected: SubmitModuleAnswerPayload[] = [
      { questionId: MCQ_ID, content: { selectedOptionIds: [103] } },
      { questionId: SHORT_ID, content: { text: 'key' } },
    ];
    const result = buildStudentQuizPayload([mcq(), shortAnswer()], input);
    expect(result.validation.isValid).toBe(true);
    expect(result.answers).toEqual(expected);
    expect(isStudentQuizBlank([mcq(), shortAnswer()], input)).toBe(false);
  });

  it.each([[101, 102, 103, 104], [3, 17, 88, 204], [104, 103, 102, 101]])('uses the selected real ID in any option order: %j', (...ids) => {
    const result = buildStudentQuizPayload([mcq({ options: options(ids) })], {
      [MCQ_ID]: { questionType: 'MULTIPLE_CHOICE', selectedOptionId: ids[0] },
    });
    expect(result.answers).toEqual([{ questionId: MCQ_ID, content: { selectedOptionIds: [ids[0]] } }]);
  });

  it('uses question IDs rather than list positions and preserves question order', () => {
    const input: StudentQuizAnswers = {
      [SHORT_ID]: { questionType: 'SHORT_ANSWER', text: 'key' },
      [MCQ_ID]: { questionType: 'MULTIPLE_CHOICE', selectedOptionId: 104 },
    };
    expect(buildStudentQuizPayload([shortAnswer(), mcq()], input).answers).toEqual([
      { questionId: SHORT_ID, content: { text: 'key' } },
      { questionId: MCQ_ID, content: { selectedOptionIds: [104] } },
    ]);
    expect(buildStudentQuizPayload([mcq()], { 1: input[MCQ_ID] }).answers).toEqual([]);
  });

  it('uses canonical answer state with a lowercase question type', () => {
    expect(buildStudentQuizPayload([mcq({ questionType: 'multiple_choice' })], {
      [MCQ_ID]: { questionType: 'MULTIPLE_CHOICE', selectedOptionId: 101 },
    }).answers).toEqual([{ questionId: MCQ_ID, content: { selectedOptionIds: [101] } }]);
  });

  it.each(['', ' ', '\n\t\u00a0'])('omits blank short text %j and permits a partial answer', text => {
    const input: StudentQuizAnswers = {
      [MCQ_ID]: { questionType: 'MULTIPLE_CHOICE', selectedOptionId: 102 },
      [SHORT_ID]: { questionType: 'SHORT_ANSWER', text },
    };
    expect(buildStudentQuizPayload([mcq(), shortAnswer()], input).answers).toEqual([
      { questionId: MCQ_ID, content: { selectedOptionIds: [102] } },
    ]);
    expect(isStudentQuizBlank([mcq(), shortAnswer()], input)).toBe(false);
    expect(isStudentQuizBlank([shortAnswer()], input)).toBe(true);
  });

  it('permits only the short question to be answered', () => {
    expect(buildStudentQuizPayload([mcq(), shortAnswer()], {
      [SHORT_ID]: { questionType: 'SHORT_ANSWER', text: 'key' },
    }).answers).toEqual([{ questionId: SHORT_ID, content: { text: 'key' } }]);
  });

  it.each(cases([undefined, null, {}, [], 'answers', 1, true, Symbol('answers')]))('returns an empty payload for absent/invalid answer state %s', input => {
    expect(buildStudentQuizPayload([mcq(), shortAnswer()], input).answers).toEqual([]);
    expect(isStudentQuizBlank([mcq(), shortAnswer()], input)).toBe(true);
  });

  it.each(cases([...invalidIds, 999]))('does not coerce or fall back for invalid/stale selected ID %s', selectedOptionId => {
    expect(buildStudentQuizPayload([mcq()], {
      [MCQ_ID]: { questionType: 'MULTIPLE_CHOICE', selectedOptionId },
    }).answers).toEqual([]);
  });

  it('drops a selection removed from the current options', () => {
    const input: StudentQuizAnswers = { [MCQ_ID]: { questionType: 'MULTIPLE_CHOICE', selectedOptionId: 101 } };
    expect(buildStudentQuizPayload([mcq({ options: options([201, 202, 203, 204]) })], input).answers).toEqual([]);
    expect(isStudentQuizBlank([mcq({ options: options([201, 202, 203, 204]) })], input)).toBe(true);
  });

  it.each(cases([undefined, null, 101, 'A', [], {},
    { questionType: 'UNKNOWN', selectedOptionId: 101 },
    { questionType: 'SHORT_ANSWER', text: 'key' },
    { questionType: 'MULTIPLE_CHOICE', selectedOptionIds: [101] },
  ]))('omits malformed/mismatched MCQ answer %s', answer => {
    expect(buildStudentQuizPayload([mcq()], { [MCQ_ID]: answer }).answers).toEqual([]);
  });

  it.each(cases([undefined, null, 42, {}, [], false]))('omits non-string short answer text %s', text => {
    expect(buildStudentQuizPayload([shortAnswer()], { [SHORT_ID]: { questionType: 'SHORT_ANSWER', text } }).answers).toEqual([]);
  });

  it.each([SPECIAL_TEXT, LONG_TEXT, 'A'.repeat(100_000)])('preserves submitted text except boundary whitespace (%#)', text => {
    expect(buildStudentQuizPayload([shortAnswer()], {
      [SHORT_ID]: { questionType: 'SHORT_ANSWER', text: '  ' + text + '\n' },
    }).answers).toEqual([{ questionId: SHORT_ID, content: { text: text.trim() } }]);
  });

  it('keeps invalid questions distinguishable from unanswered valid questions', () => {
    const questions = [mcq({ options: null }), shortAnswer()];
    const result = buildStudentQuizPayload(questions, {
      [MCQ_ID]: { questionType: 'MULTIPLE_CHOICE', selectedOptionId: 101 },
      [SHORT_ID]: { questionType: 'SHORT_ANSWER', text: 'key' },
    });
    expect(result.validation.isValid).toBe(false);
    expect(result.validation.questions[0].reason).toBe('OPTIONS_NOT_ARRAY');
    expect(result.answers).toEqual([{ questionId: SHORT_ID, content: { text: 'key' } }]);
    expect(isStudentQuizBlank(questions, {})).toBe(false);
  });

  it.each(cases([null, [], {}, [null], [mcq({ options: null })], [mcq(), mcq()]]))('does not call invalid question data a blank attempt (%#)', questions => {
    const result = buildStudentQuizPayload(questions, {});
    expect(result.validation.isValid).toBe(false);
    expect(result.answers).toEqual([]);
    expect(isStudentQuizBlank(questions, {})).toBe(false);
  });

  it('supports a null-prototype answer map but ignores inherited answers', () => {
    const answer = { questionType: 'MULTIPLE_CHOICE', selectedOptionId: 101 };
    const own: Record<number, unknown> = Object.create(null);
    own[MCQ_ID] = answer;
    expect(buildStudentQuizPayload([mcq()], own).answers).toHaveLength(1);
    const inherited: unknown = Object.create({ [MCQ_ID]: answer });
    expect(buildStudentQuizPayload([mcq()], inherited).answers).toEqual([]);
  });

  it('does not mutate answer state', () => {
    const answer = Object.freeze({ questionType: 'SHORT_ANSWER' as const, text: '  key  ' });
    const input = Object.freeze({ [SHORT_ID]: answer });
    expect(buildStudentQuizPayload([shortAnswer()], input).answers[0].content).toEqual({ text: 'key' });
    expect(input[SHORT_ID].text).toBe('  key  ');
  });

  it('skips throwing answer properties without losing another valid answer', () => {
    const input = { [SHORT_ID]: { questionType: 'SHORT_ANSWER', text: 'key' } };
    Object.defineProperty(input, MCQ_ID, { get() { throw new Error('unreadable answer'); } });
    expect(buildStudentQuizPayload([mcq(), shortAnswer()], input).answers).toEqual([
      { questionId: SHORT_ID, content: { text: 'key' } },
    ]);
  });

  it('never throws at any public boundary for revoked proxies', () => {
    const proxy = Proxy.revocable({}, {});
    proxy.revoke();
    expect(validateStudentQuizQuestions(proxy.proxy).listError).toBe('QUESTIONS_UNREADABLE');
    expect(buildStudentQuizPayload(proxy.proxy, proxy.proxy).answers).toEqual([]);
    expect(isStudentQuizBlank(proxy.proxy, proxy.proxy)).toBe(false);
    expect(buildStudentQuizPayload([mcq()], proxy.proxy).answers).toEqual([]);
    expect(isStudentQuizBlank([mcq()], proxy.proxy)).toBe(true);
  });
});
