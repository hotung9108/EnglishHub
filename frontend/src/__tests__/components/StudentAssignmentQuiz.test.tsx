import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import StudentAssignmentReading from '../../pages/StudentAssignmentReading';
import StudentAssignmentListening from '../../pages/StudentAssignmentListening';
import { assignmentService, type AssignmentDetail } from '../../api/services/assignment.service';
import { moduleService } from '../../api/services/module.service';
import { questionService, type QuestionListResponse } from '../../api/services/question.service';
import { submissionService, type SubmissionDetail } from '../../api/services/submission.service';
import { ApiClientError } from '../../api/core/errors';
import * as assignmentEvents from '../../utils/assignmentEvents.utils';
import { renderPage } from './renderPage';
import { deferred } from '../deferred';

const { auth } = vi.hoisted(() => ({ auth: { user: { id: 41 } } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn() } }));
vi.mock('../../api/services/module.service', () => ({ moduleService: {
  getModule: vi.fn(), listModules: vi.fn(), getAudioDownloadUrl: vi.fn(),
} }));
vi.mock('../../api/services/question.service', () => ({ questionService: { listQuestions: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({ submissionService: {
  getSubmission: vi.fn(), listSubmissions: vi.fn(), startAttempt: vi.fn(),
  submitModule: vi.fn(), submitSubmission: vi.fn(),
} }));

const ASSIGNMENT_ID = 4;
const SUBMISSION_ID = 325;
const SUBMIT_LABEL = /Hoàn thành & Nộp/;
const BLANK_MESSAGE = 'Vui lòng trả lời ít nhất một câu hỏi trước khi nộp phần thi này.';
const PENDING_MESSAGE = 'Đáp án của bạn đã được lưu, nhưng hệ thống chưa xác nhận hoàn tất bài thi. Vui lòng thử nộp lại.';
const UNCONFIRMED_MESSAGE = 'Chưa thể xác nhận trạng thái nộp bài. Vui lòng tải lại trang để kiểm tra trước khi thử lại.';
const RETRY_LABEL = 'Thử nộp lại bài';
const SIGNAL_OPTIONS = { signal: expect.any(AbortSignal) };
const LIST_ERROR = 'Đề bài không có danh sách câu hỏi hợp lệ. Chưa thể nộp phần thi. Vui lòng tải lại đề hoặc liên hệ giáo viên.';
const SPECIAL_TEXT = '<script>alert("x")</script><img src=x onerror=alert(1)> &amp; & < > " \' Tiếng Việt 😀';

// Base question IDs/text: local-dev/db-snapshot/questions.csv, 51/53 and 59/60.
// Module/submission responses and malformed values deliberately simulate each case.
const scenarios = [
  { skill: 'READING' as const, Page: StudentAssignmentReading, route: '/student/assignments/reading',
    moduleId: 13, mcqId: 51, shortId: 53, submissionModuleId: 1182,
    prompt: 'What is the opposite of passing an exam?', shortPrompt: 'What do you use to unlock a door?',
    contents: ['Failing', 'Winning', 'Arriving', 'Borrowing'], nextRoute: '/student/assignments/listening/4' },
  { skill: 'LISTENING' as const, Page: StudentAssignmentListening, route: '/student/assignments/listening',
    moduleId: 14, mcqId: 59, shortId: 60, submissionModuleId: 1183,
    prompt: 'Where can students borrow books?', shortPrompt: 'What should you show at an airport before an international flight?',
    contents: ['At a library', 'At a bakery', 'At an airport gate', 'At a petrol station'], nextRoute: '/student/assignments/writing/4' },
];

describe.each(scenarios)('StudentAssignmentQuiz $skill', scenario => {
  const { Page, route, skill, moduleId, mcqId, shortId, submissionModuleId } = scenario;

  function options(ids = [101, 102, 103, 104]) {
    return ids.map((id, index) => ({ id, content: scenario.contents[index] }));
  }

  function mcq(overrides: Record<string, unknown> = {}) {
    return { id: mcqId, content: scenario.prompt, questionType: 'MULTIPLE_CHOICE',
      options: options(), score: 1, orderIndex: 1, ...overrides };
  }

  function shortAnswer(overrides: Record<string, unknown> = {}) {
    return { id: shortId, content: scenario.shortPrompt, questionType: 'SHORT_ANSWER',
      score: 1, orderIndex: 2, ...overrides };
  }

  function assignment(id = ASSIGNMENT_ID, targetModuleId = moduleId): AssignmentDetail {
    const modules: AssignmentDetail['modules'] = [{ id: 13, skill: 'READING' }, { id: 14, skill: 'LISTENING' }, { id: 15, skill: 'WRITING' }];
    return { id, title: 'QA quiz', status: 'PUBLISHED',
      modules: modules.map(m => m.skill === skill ? { ...m, id: targetModuleId } : m) };
  }

  function submission(id = SUBMISSION_ID, assignmentId = ASSIGNMENT_ID, targetModuleId = moduleId): SubmissionDetail {
    return { id, assignmentId, studentId: 41, attemptNumber: 1, status: 'IN_PROGRESS',
      createdAt: '2026-10-22T00:00:00Z', submittedAt: null,
      modules: [
        { id: 1182, moduleId: skill === 'READING' ? targetModuleId : 13, skill: 'READING', taskType: 'QUIZ',
          status: skill === 'READING' ? 'IN_PROGRESS' : 'SUBMITTED', grading: null },
        { id: 1183, moduleId: skill === 'LISTENING' ? targetModuleId : 14, skill: 'LISTENING', taskType: 'QUIZ', status: 'IN_PROGRESS', grading: null },
        { id: 1184, moduleId: 15, skill: 'WRITING', taskType: 'ESSAY', status: 'IN_PROGRESS', grading: null },
      ] };
  }

  function mockQuestions(questions: unknown) {
    vi.mocked(questionService.listQuestions).mockResolvedValue({ questions } as unknown as QuestionListResponse);
  }

  let serverSubmission: SubmissionDetail;

  function acceptModule() {
    serverSubmission = { ...serverSubmission, modules: serverSubmission.modules.map(module =>
      module.id === submissionModuleId ? { ...module, status: 'SUBMITTED' } : module) };
    return { message: 'Saved', submissionModuleId, status: 'SUBMITTED' as const, answers: [] };
  }

  function onlyCurrentModule(completed = false) {
    const a = assignment();
    a.modules = a.modules.filter(module => module.skill === skill);
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(a);
    serverSubmission.modules = serverSubmission.modules.filter(module => module.skill === skill);
    if (completed) acceptModule();
  }

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(assignmentEvents, 'notifyAssignmentSubmitted').mockImplementation(() => undefined);
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment());
    vi.mocked(moduleService.getModule).mockImplementation(async id => ({
      id, skill, taskType: 'QUIZ', instructions: 'QA instructions', orderIndex: 1, maxScore: 10,
    }));
    vi.mocked(moduleService.getAudioDownloadUrl).mockImplementation(async id => ({
      moduleId: id,
      downloadUrl: `https://audio.example/modules/${id}.mp3`,
      storageKey: `modules/${id}.mp3`,
    }));
    mockQuestions([mcq(), shortAnswer()]);
    serverSubmission = submission();
    vi.mocked(submissionService.getSubmission).mockImplementation(async () => serverSubmission);
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [submission()], pagination: { page: 1, limit: 10, total: 1 } });
    vi.mocked(submissionService.submitModule).mockImplementation(async () => acceptModule());
    vi.mocked(submissionService.submitSubmission).mockImplementation(async () => {
      serverSubmission = { ...serverSubmission, status: 'SUBMITTED' };
      return { message: 'Submitted', status: 'SUBMITTED', submittedAt: '2026-10-22T00:00:00Z' };
    });
  });

  async function setup(extra?: ReactNode, entry = `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`) {
    const view = renderPage(<>{extra}<Page /></>, `${route}/:id`, entry);
    await waitFor(() => expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled());
    return { ...view, user: userEvent.setup() };
  }

  function optionElements() {
    return document.querySelectorAll<HTMLElement>('.exam-option-item');
  }

  async function openQuestion(index: number) {
    await userEvent.click(screen.getByRole('button', { name: String(index) }));
  }

  function expectNotSubmitted() {
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(document.querySelector('.exam-alert-success')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent(`${route}/${ASSIGNMENT_ID}`);
    const activeStep = document.querySelector('.eh-stepper-compact-step.active');
    expect(activeStep?.getAttribute('title')).toContain('(Đang làm)');
  }

  it('renders all four public option contents, selects one and retains it across question navigation', async () => {
    const { user } = await setup();
    expect(optionElements()).toHaveLength(4);
    scenario.contents.forEach((content, i) => expect(optionElements()[i]).toHaveTextContent(content));
    expect(screen.queryByText(/Lựa chọn [ABCD]/)).not.toBeInTheDocument();
    await user.click(optionElements()[2]);
    expect(optionElements()[2]).toHaveClass('is-selected');
    await openQuestion(2);
    expect(screen.getByRole('textbox')).toBeVisible();
    expect(optionElements()).toHaveLength(0);
    await openQuestion(1);
    expect(optionElements()[2]).toHaveClass('is-selected');
    expectNotSubmitted();
  });

  it.each([[101, 102, 103, 104], [3, 17, 88, 204], [104, 103, 102, 101]])('submits the actual first option ID %i in response order', async (...ids) => {
    mockQuestions([mcq({ options: options(ids) })]);
    const { user } = await setup();
    await user.click(optionElements()[0]);
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    await waitFor(() => expect(submissionService.submitModule).toHaveBeenCalledExactlyOnceWith(submissionModuleId, {
      answers: [{ questionId: mcqId, content: { selectedOptionIds: [ids[0]] } }],
    }, SIGNAL_OPTIONS));
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(screen.getByText(new RegExp(`Đã hoàn thành phần thi ${skill === 'READING' ? 'Reading' : 'Listening'}!`))).toBeVisible();
  });

  it('renders SHORT_ANSWER without a model or choices and submits trimmed text only', async () => {
    mockQuestions([shortAnswer()]);
    const { user } = await setup();
    expect(optionElements()).toHaveLength(0);
    await user.type(screen.getByRole('textbox'), '  key  ');
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(submissionService.submitModule).toHaveBeenCalledExactlyOnceWith(submissionModuleId, {
      answers: [{ questionId: shortId, content: { text: 'key' } }],
    }, SIGNAL_OPTIONS);
  });

  it.each(['', '   \t '])('omits unanswered/whitespace SHORT_ANSWER and allows partial MCQ submission: %j', async text => {
    const { user } = await setup();
    await user.click(optionElements()[1]);
    await openQuestion(2);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
    expect(screen.getByText('1 / 2 đã làm')).toBeVisible();
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(submissionService.submitModule).toHaveBeenCalledExactlyOnceWith(submissionModuleId, {
      answers: [{ questionId: mcqId, content: { selectedOptionIds: [102] } }],
    }, SIGNAL_OPTIONS);
  });

  it.each(['', '   \t '])('blocks a fully blank module including short text %j', async text => {
    const { user } = await setup();
    await openQuestion(2);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(screen.getByText(BLANK_MESSAGE)).toBeVisible();
    expect(screen.getByText('0 / 2 đã làm')).toBeVisible();
    expectNotSubmitted();
  });

  it.each(['multiple_choice', 'Multiple_Choice'])('renders supported MCQ type %s after validation', async questionType => {
    mockQuestions([mcq({ questionType })]);
    await setup();
    expect(optionElements()).toHaveLength(4);
    expect(optionElements()[0]).toHaveTextContent(scenario.contents[0]);
  });

  it.each(['short_answer', 'Short_Answer'])('renders supported short type %s after validation', async questionType => {
    mockQuestions([shortAnswer({ questionType })]);
    await setup();
    expect(screen.getByRole('textbox')).toBeVisible();
    expect(optionElements()).toHaveLength(0);
  });

  const invalidTypes: unknown[] = ['UNKNOWN', undefined, null, '', 42, {}, [], false, ' SHORT_ANSWER '];
  it.each(invalidTypes.map(value => [value]))('reports unsupported type %s without MCQ fallback', async questionType => {
    mockQuestions([mcq({ questionType })]);
    const { user } = await setup();
    expect(screen.getByText('Câu 1 có dữ liệu không hợp lệ.')).toBeVisible();
    expect(optionElements()).toHaveLength(0);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expectNotSubmitted();
  });

  const invalidOptions: Array<{ name: string; value: unknown }> = [
    { name: 'missing', value: undefined }, { name: 'null', value: null },
    { name: 'empty', value: [] }, { name: 'not an array', value: {} },
    { name: 'string', value: 'options' }, { name: 'number', value: 4 },
    { name: '[null]', value: [null] },
    ...[1].map(count => ({ name: `${count} choices`, value: Array.from({ length: count }, (_, i) => ({ id: i + 1, content: 'Option' })) })),
    { name: 'null element', value: [null, ...options().slice(1)] },
    { name: 'string element', value: ['invalid', ...options().slice(1)] },
    { name: 'array element', value: [[], ...options().slice(1)] },
    ...[undefined, null, 0, -1, 1.5, '101', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(id => ({
      name: `invalid id ${String(id)}`, value: [{ id, content: 'Option' }, ...options().slice(1)],
    })),
    { name: 'duplicate IDs', value: options([101, 101, 103, 104]) },
    ...[undefined, '', '   ', 42].map(content => ({ name: `invalid content ${String(content)}`, value: [{ id: 101, content }, ...options().slice(1)] })),
  ];
  it.each(invalidOptions)('reports options $name without placeholder choices or a blank page', async ({ value }) => {
    mockQuestions([mcq({ options: value })]);
    const { user } = await setup();
    expect(screen.getByText('Câu 1 có dữ liệu không hợp lệ.')).toBeVisible();
    expect(optionElements()).toHaveLength(0);
    expect(screen.queryByText(/Lựa chọn [ABCD]/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expectNotSubmitted();
  });

  it.each([2, 3, 5])('renders valid options with %i choices without error', async (count) => {
    const value = Array.from({ length: count }, (_, i) => ({ id: i + 101, content: `Option ${i + 1}` }));
    mockQuestions([mcq({ options: value })]);
    await setup();
    expect(screen.queryByText('Câu 1 có dữ liệu không hợp lệ.')).not.toBeInTheDocument();
    expect(optionElements()).toHaveLength(count);
  });

  it('lists every invalid position, counts only valid questions and blocks submitting valid answers too', async () => {
    mockQuestions([mcq({ options: null }), shortAnswer(), null]);
    const { user } = await setup();
    const message = 'Đề bài có dữ liệu lỗi ở câu 1, 3. Chưa thể nộp phần thi. Vui lòng tải lại đề hoặc liên hệ giáo viên.';
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.getByText('0 / 1 đã làm (câu hợp lệ)')).toBeVisible();
    await openQuestion(2);
    await user.type(screen.getByRole('textbox'), 'key');
    expect(screen.getByText('1 / 1 đã làm (câu hợp lệ)')).toBeVisible();
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.queryByText(BLANK_MESSAGE)).not.toBeInTheDocument();
    expectNotSubmitted();
  });

  it.each([null, [], {}, 'questions', 0, false].map(value => [value]))('blocks malformed/empty list %s', async questions => {
    mockQuestions(questions);
    const { user } = await setup();
    expect(screen.getByText(LIST_ERROR)).toBeVisible();
    expect(optionElements()).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(screen.queryByText(BLANK_MESSAGE)).not.toBeInTheDocument();
    expectNotSubmitted();
  });

  it('does not execute a function accidentally supplied as question data', async () => {
    const value = vi.fn(() => [mcq()]);
    mockQuestions(value);
    await setup();
    expect(value).not.toHaveBeenCalled();
    expect(screen.getByText(LIST_ERROR)).toBeVisible();
    expectNotSubmitted();
  });

  it.each([null, {}, { id: mcqId }, [mcq(), mcq()]].map(value => [value]))('blocks malformed/duplicate question data (%#)', async value => {
    const questions = Array.isArray(value) ? value : [value];
    mockQuestions(questions);
    const { user } = await setup();
    expect(screen.getByText(/Đề bài có dữ liệu lỗi ở câu/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expectNotSubmitted();
  });

  it.each([SPECIAL_TEXT, 'Chuỗi rất dài 😀 &amp; '.repeat(2_000)])('renders question and option text literally without creating markup (%#)', async text => {
    const list = options();
    list[0] = { id: 101, content: text };
    mockQuestions([mcq({ content: text, options: list })]);
    const { container } = await setup();
    expect(container.querySelector('.exam-question-prompt')?.textContent).toBe(text);
    expect(optionElements()[0].textContent).toContain(text);
    expect(container.querySelector('.exam-question-card script')).toBeNull();
    expect(container.querySelector('.exam-question-card img')).toBeNull();
    expect(optionElements()).toHaveLength(4);
  });

  it('does not render or fall back to a private model answer', async () => {
    mockQuestions([mcq({ correctAnswer: { options: options().map(o => ({ ...o, content: 'PRIVATE MODEL', isCorrect: true })) } })]);
    await setup();
    expect(screen.queryByText('PRIVATE MODEL', { exact: false })).not.toBeInTheDocument();
    expect(optionElements()[0]).toHaveTextContent(scenario.contents[0]);
  });

  it('keeps payloads tied to question IDs when IDs overlap navigation positions', async () => {
    mockQuestions([mcq({ id: 2 }), shortAnswer({ id: 1 })]);
    const { user } = await setup();
    await user.click(optionElements()[0]);
    await openQuestion(2);
    await user.type(screen.getByRole('textbox'), ' key ');
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(submissionService.submitModule).toHaveBeenCalledExactlyOnceWith(submissionModuleId, { answers: [
      { questionId: 2, content: { selectedOptionIds: [101] } },
      { questionId: 1, content: { text: 'key' } },
    ] }, SIGNAL_OPTIONS);
  });

  it('submits a full module and follows the existing next-skill route', async () => {
    const { user } = await setup();
    await user.click(optionElements()[0]);
    await openQuestion(2);
    await user.type(screen.getByRole('textbox'), ' key ');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL })); });
    expect(submissionService.submitModule).toHaveBeenCalledExactlyOnceWith(submissionModuleId, { answers: [
      { questionId: mcqId, content: { selectedOptionIds: [101] } },
      { questionId: shortId, content: { text: 'key' } },
    ] }, SIGNAL_OPTIONS);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent(scenario.nextRoute);
  });

  it('does not report success or navigate while the module request is pending', async () => {
    const pending = deferred<Awaited<ReturnType<typeof submissionService.submitModule>>>();
    vi.mocked(submissionService.submitModule).mockReturnValueOnce(pending.promise);
    const { user } = await setup();
    await user.click(optionElements()[0]);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL })); });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(document.querySelector('.exam-alert-success')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent(`${route}/${ASSIGNMENT_ID}`);
    expect(document.querySelector('.eh-stepper-compact-step.active')?.getAttribute('title')).toContain('(Đang làm)');
    await act(async () => {
      pending.resolve(acceptModule());
      await pending.promise;
    });
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent(scenario.nextRoute);
  });

  it('keeps the existing successful final submit path when this is the only module', async () => {
    const a = assignment();
    a.modules = a.modules.filter(m => m.skill === skill);
    const sub = submission();
    sub.modules = sub.modules.filter(m => m.skill === skill);
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(a);
    serverSubmission = sub;
    const { user } = await setup();
    await user.click(optionElements()[0]);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL })); });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.submitSubmission).toHaveBeenCalledExactlyOnceWith(SUBMISSION_ID, SIGNAL_OPTIONS);
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(2);
    expectRequestOrder('submitModule', 'getSubmission', 'submitSubmission');
    expect(vi.mocked(submissionService.submitModule).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(submissionService.submitSubmission).mock.invocationCallOrder[0]);
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent(`/student/submissions/${SUBMISSION_ID}`);
  });

  it.each(['assignment', 'submission'])('resets answers on %s change without unmounting', async kind => {
    const nextAssignment = kind === 'assignment' ? ASSIGNMENT_ID + 1 : ASSIGNMENT_ID;
    const nextSubmission = kind === 'submission' ? SUBMISSION_ID + 1 : SUBMISSION_ID;
    const link = <Link to={`${route}/${nextAssignment}?submissionId=${nextSubmission}`}>Change scope</Link>;
    const { user } = await setup(link);
    await user.click(optionElements()[0]);
    await openQuestion(2);
    await user.type(screen.getByRole('textbox'), 'old text');
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment(nextAssignment));
    vi.mocked(submissionService.getSubmission).mockResolvedValue(submission(nextSubmission, nextAssignment));
    await user.click(screen.getByRole('link', { name: 'Change scope' }));
    await waitFor(() => expect(submissionService.getSubmission).toHaveBeenLastCalledWith(nextSubmission));
    await waitFor(() => expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled());
    expect(document.querySelector('.exam-option-item.is-selected')).toBeNull();
    expect(screen.getByText('0 / 2 đã làm')).toBeVisible();
    await openQuestion(2);
    expect(screen.getByRole('textbox')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(screen.getByText(BLANK_MESSAGE)).toBeVisible();
  });

  it('resets answers when the module changes while assignment/submission stay the same', async () => {
    const { user } = await setup();
    await user.click(optionElements()[0]);
    await openQuestion(2);
    await user.type(screen.getByRole('textbox'), 'old text');
    vi.mocked(submissionService.submitModule).mockRejectedValueOnce(new Error('QA retry'));
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(await screen.findByText('QA retry')).toBeVisible();
    expect(screen.getByRole('textbox')).toHaveValue('old text');
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment(ASSIGNMENT_ID, moduleId + 100));
    vi.mocked(submissionService.getSubmission).mockResolvedValue(submission(SUBMISSION_ID, ASSIGNMENT_ID, moduleId + 100));
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(moduleService.getModule).toHaveBeenLastCalledWith(moduleId + 100));
    await waitFor(() => expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled());
    expect(document.querySelector('.exam-option-item.is-selected')).toBeNull();
    expect(screen.getByText('0 / 2 đã làm')).toBeVisible();
    await openQuestion(2);
    expect(screen.getByRole('textbox')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(screen.getByText(BLANK_MESSAGE)).toBeVisible();
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(document.querySelector('.exam-alert-success')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent(`${route}/${ASSIGNMENT_ID}`);
  });

  it('drops a stale option from the payload but keeps valid text when reloading the same scope', async () => {
    const { user } = await setup();
    await user.click(optionElements()[0]);
    await openQuestion(2);
    await user.type(screen.getByRole('textbox'), 'key');
    vi.mocked(submissionService.submitModule).mockRejectedValueOnce(new Error('QA retry'));
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(await screen.findByText('QA retry')).toBeVisible();
    mockQuestions([mcq({ options: options([201, 202, 203, 204]) }), shortAnswer()]);
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled());
    expect(screen.getByRole('textbox')).toHaveValue('key');
    expect(screen.getByText('1 / 2 đã làm')).toBeVisible();
    await openQuestion(1);
    expect(document.querySelector('.exam-option-item.is-selected')).toBeNull();
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(submissionService.submitModule).toHaveBeenCalledTimes(2);
    expect(submissionService.submitModule).toHaveBeenLastCalledWith(submissionModuleId, {
      answers: [{ questionId: shortId, content: { text: 'key' } }],
    }, SIGNAL_OPTIONS);
  });

  function expectStayed() {
    expect(document.querySelector('.exam-alert-success')).toBeNull();
    expect(assignmentEvents.notifyAssignmentSubmitted).not.toHaveBeenCalled();
    expect(screen.getByTestId('location')).toHaveTextContent(`${route}/${ASSIGNMENT_ID}`);
  }

  async function answerAndSubmit() {
    fireEvent.click(optionElements()[0]);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL })); });
  }

  function expectRequestOrder(...operations: Array<'submitModule' | 'getSubmission' | 'submitSubmission'>) {
    const calls = operations.map(operation => vi.mocked(submissionService[operation]).mock.invocationCallOrder.at(-1));
    for (let index = 1; index < calls.length; index += 1) expect(calls[index - 1]).toBeLessThan(calls[index]!);
  }

  it('uses newly confirmed next skill instead of stale client progress', async () => {
    await setup();
    vi.mocked(submissionService.submitModule).mockImplementationOnce(async () => {
      const response = acceptModule();
      serverSubmission.modules = serverSubmission.modules.map(module => module.skill === 'LISTENING'
        ? { ...module, status: 'SUBMITTED' } : module);
      return response;
    });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await answerAndSubmit();
    expectRequestOrder('submitModule', 'getSubmission');
    expect(submissionService.getSubmission).toHaveBeenLastCalledWith(SUBMISSION_ID, SIGNAL_OPTIONS);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent('/student/assignments/writing/4');
  });

  it.each([0, 408, 500])('keeps saved answers pending on FINAL %i before commit, then retries only FINAL', async status => {
    onlyCurrentModule();
    vi.mocked(submissionService.submitSubmission).mockRejectedValueOnce(new ApiClientError('Final unavailable', status));
    await setup();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await answerAndSubmit();
    expect(screen.getByText(PENDING_MESSAGE)).toBeVisible();
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
    expect(serverSubmission.status).toBe('IN_PROGRESS');
    expect(serverSubmission.modules[0].status).toBe('SUBMITTED');
    expectStayed();
    expectRequestOrder('submitModule', 'submitSubmission', 'getSubmission');
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expectStayed();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: RETRY_LABEL })); });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.submitSubmission).toHaveBeenCalledTimes(2);
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(4);
    expectRequestOrder('getSubmission', 'submitSubmission');
    expect(assignmentEvents.notifyAssignmentSubmitted).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent(`/student/submissions/${SUBMISSION_ID}`);
  });

  it.each(['SUBMITTED', 'GRADED'] as const)('accepts lost FINAL response only after GET confirms %s', async status => {
    onlyCurrentModule();
    vi.mocked(submissionService.submitSubmission).mockImplementationOnce(async () => {
      serverSubmission = { ...serverSubmission, status };
      throw new ApiClientError('Response lost', 0);
    });
    await setup();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await answerAndSubmit();
    expectRequestOrder('submitModule', 'submitSubmission', 'getSubmission');
    expect(submissionService.submitSubmission).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(PENDING_MESSAGE)).not.toBeInTheDocument();
    expect(assignmentEvents.notifyAssignmentSubmitted).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent(`/student/submissions/${SUBMISSION_ID}`);
  });

  it('keeps FINAL failure unconfirmed when its reconciliation GET fails', async () => {
    onlyCurrentModule();
    await setup();
    vi.mocked(submissionService.submitSubmission).mockImplementationOnce(async () => {
      vi.mocked(submissionService.getSubmission).mockRejectedValueOnce(new Error('GET offline'));
      throw new ApiClientError('Final offline', 0);
    });
    await answerAndSubmit();
    expect(screen.getByText(UNCONFIRMED_MESSAGE)).toBeVisible();
    expect(screen.queryByRole('button', { name: RETRY_LABEL })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
    expectStayed();
  });

  it.each([false, true])('handles FINAL 400 with confirmed completion = %s', async committed => {
    onlyCurrentModule();
    vi.mocked(submissionService.submitSubmission).mockImplementationOnce(async () => {
      if (committed) serverSubmission = { ...serverSubmission, status: 'SUBMITTED' };
      throw new ApiClientError('Final rejected', 400);
    });
    await setup();
    await answerAndSubmit();
    expectRequestOrder('submitSubmission', 'getSubmission');
    if (committed) {
      expect(document.querySelector('.exam-alert-success')).toBeVisible();
      expect(assignmentEvents.notifyAssignmentSubmitted).toHaveBeenCalledTimes(1);
    } else {
      expect(screen.getByText('Final rejected')).toBeVisible();
      expect(screen.getByRole('button', { name: RETRY_LABEL })).toBeVisible();
      expectStayed();
    }
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.submitSubmission).toHaveBeenCalledTimes(1);
  });

  it.each([0, 500, 400])('allows repeated FINAL retry after %i without resending module', async status => {
    onlyCurrentModule(true);
    vi.mocked(submissionService.submitSubmission).mockRejectedValue(new ApiClientError('Still unavailable', status));
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await screen.findByRole('button', { name: RETRY_LABEL });
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: RETRY_LABEL })); });
      expect(screen.getByRole('button', { name: RETRY_LABEL })).toBeVisible();
      expect(submissionService.submitModule).not.toHaveBeenCalled();
      expect(submissionService.submitSubmission).toHaveBeenCalledTimes(attempt);
      expectStayed();
    }
  });

  it.each([false, true])('recovers an all-completed IN_PROGRESS parent on route reload, single module = %s', async single => {
    if (single) onlyCurrentModule(true);
    else serverSubmission.modules = serverSubmission.modules.map(module => ({ ...module, status: 'SUBMITTED' }));
    mockQuestions([]);
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await screen.findByRole('button', { name: RETRY_LABEL });
    expect(screen.getByText(PENDING_MESSAGE)).toBeVisible();
    expect(screen.queryByText(LIST_ERROR)).not.toBeInTheDocument();
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expectStayed();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: RETRY_LABEL })); });
    expectRequestOrder('getSubmission', 'submitSubmission');
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent(`/student/submissions/${SUBMISSION_ID}`);
  });

  it('recovers via assignment route without a submission query after a fresh GET', async () => {
    onlyCurrentModule(true);
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}`);
    await screen.findByRole('button', { name: RETRY_LABEL });
    expect(submissionService.listSubmissions).toHaveBeenCalledTimes(1);
    expect(submissionService.getSubmission).toHaveBeenCalledExactlyOnceWith(SUBMISSION_ID);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expectStayed();
  });

  it.each(['SUBMITTED', 'GRADED'] as const)('redirects a freshly loaded %s parent without FINAL', async status => {
    onlyCurrentModule(true);
    serverSubmission = { ...serverSubmission, status };
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`/student/submissions/${SUBMISSION_ID}`));
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: RETRY_LABEL })).not.toBeInTheDocument();
  });

  it.each(['SUBMITTED', 'GRADED'] as const)('does not FINAL again when the post-module GET shows parent %s', async status => {
    await setup();
    vi.mocked(submissionService.submitModule).mockImplementationOnce(async () => {
      const response = acceptModule();
      serverSubmission = { ...serverSubmission, status };
      return response;
    });
    await answerAndSubmit();
    expect(document.querySelector('.exam-alert-success')).toBeVisible();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it('does not FINAL on retry if fresh GET reveals incomplete modules', async () => {
    onlyCurrentModule(true);
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await screen.findByRole('button', { name: RETRY_LABEL });
    serverSubmission.modules[0].status = 'IN_PROGRESS';
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: RETRY_LABEL })); });
    expect(screen.getByText(/Tiến độ bài thi đã thay đổi/)).toBeVisible();
    expect(screen.queryByRole('button', { name: RETRY_LABEL })).not.toBeInTheDocument();
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expectStayed();
  });

  const malformedProgress: unknown[] = [null, undefined, {}, [], { id: SUBMISSION_ID + 1 }, { assignmentId: 99 },
    { modules: [] }, { modules: null }, { status: 'UNKNOWN' }];
  it.each(malformedProgress.map(value => [value]))('does not redirect or offer recovery for invalid load %j', async value => {
    const response = value && !Array.isArray(value) && Object.keys(value).length > 0 ? { ...serverSubmission, ...value } : value;
    vi.mocked(submissionService.getSubmission).mockResolvedValue(response as SubmissionDetail);
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await screen.findByText(UNCONFIRMED_MESSAGE);
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
    expect(screen.queryByRole('button', { name: RETRY_LABEL })).not.toBeInTheDocument();
    expectNotSubmitted();
  });

  it('keeps a load GET error visible, without completion or guessed scope', async () => {
    vi.mocked(submissionService.getSubmission).mockRejectedValue(new Error('Load offline'));
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await screen.findByText('Load offline');
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
    expectNotSubmitted();
  });

  it.each([null, {}, { status: 'SUBMITTED', submissionModuleId: 99 }, { status: 'IN_PROGRESS', submissionModuleId }])('blocks uncertain module response %j without FINAL or fake success', async response => {
    await setup();
    vi.mocked(submissionService.submitModule).mockResolvedValueOnce(response as Awaited<ReturnType<typeof submissionService.submitModule>>);
    await answerAndSubmit();
    expect(screen.getByText(UNCONFIRMED_MESSAGE)).toBeVisible();
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(1);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expectStayed();
  });

  it('keeps progress unconfirmed after module acceptance if GET fails', async () => {
    await setup();
    vi.mocked(submissionService.getSubmission).mockRejectedValueOnce(new Error('Progress offline'));
    await answerAndSubmit();
    expect(screen.getByText(UNCONFIRMED_MESSAGE)).toBeVisible();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expectStayed();
  });

  it.each([false, true])('reconciles lost module response, committed = %s', async committed => {
    await setup();
    vi.mocked(submissionService.submitModule).mockImplementationOnce(async () => {
      if (committed) acceptModule();
      throw new ApiClientError('Module offline', 0);
    });
    await answerAndSubmit();
    expectRequestOrder('submitModule', 'getSubmission');
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    if (committed) expect(document.querySelector('.exam-alert-success')).toBeVisible();
    else {
      expect(screen.getByText('Module offline')).toBeVisible();
      expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled();
      expectStayed();
    }
  });

  it.each(['submit', 'retry'] as const)('locks %s in the same JS tick and while requests are pending', async operation => {
    const pending = deferred<SubmissionDetail>();
    if (operation === 'retry') onlyCurrentModule(true);
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    const label = operation === 'retry' ? RETRY_LABEL : SUBMIT_LABEL;
    await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled());
    if (operation === 'submit') fireEvent.click(optionElements()[0]);
    vi.mocked(submissionService.getSubmission).mockReturnValueOnce(pending.promise);
    const button = screen.getByRole('button', { name: label });
    await act(async () => { button.click(); button.click(); });
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(2);
    expect(submissionService.submitModule).toHaveBeenCalledTimes(operation === 'submit' ? 1 : 0);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
    expectStayed();
    await act(async () => { pending.resolve(serverSubmission); await pending.promise; });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(operation === 'submit' ? 1 : 0);
    expect(submissionService.submitSubmission).toHaveBeenCalledTimes(operation === 'retry' ? 1 : 0);
    expect(assignmentEvents.notifyAssignmentSubmitted).toHaveBeenCalledTimes(operation === 'retry' ? 1 : 0);
  });

  it('prevents duplicate module POST with a user double click', async () => {
    const { user } = await setup();
    await user.click(optionElements()[0]);
    await user.dblClick(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(2);
  });

  it.each(['assignment', 'submission', 'module', 'A-B-A', 'unmount'] as const)('ignores and aborts stale module completion on %s', async change => {
    const pending = deferred<Awaited<ReturnType<typeof submissionService.submitModule>>>();
    const nextAssignmentId = change === 'assignment' || change === 'A-B-A' ? ASSIGNMENT_ID + 1 : ASSIGNMENT_ID;
    const nextSubmissionId = change === 'submission' ? SUBMISSION_ID + 1 : SUBMISSION_ID;
    const nextModuleId = change === 'module' ? moduleId + 100 : moduleId;
    const links = <><Link to={`${route}/${nextAssignmentId}?submissionId=${nextSubmissionId}${change === 'module' ? '&refresh=module' : ''}`}>Scope B</Link>
      <Link to={`${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`}>Scope A</Link></>;
    const { user, unmount } = await setup(links);
    vi.mocked(submissionService.submitModule).mockReturnValueOnce(pending.promise);
    await answerAndSubmit();
    const signal = vi.mocked(submissionService.submitModule).mock.calls[0][2]?.signal;
    if (change === 'unmount') unmount();
    else {
      vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment(nextAssignmentId, nextModuleId));
      serverSubmission = submission(nextSubmissionId, nextAssignmentId, nextModuleId);
      await user.click(screen.getByRole('link', { name: 'Scope B' }));
      await waitFor(() => expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled());
      if (change === 'A-B-A') {
        vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment());
        serverSubmission = submission();
        await user.click(screen.getByRole('link', { name: 'Scope A' }));
        await waitFor(() => expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled());
      }
    }
    expect(signal?.aborted).toBe(true);
    await act(async () => { pending.resolve({ message: 'Saved', submissionModuleId, status: 'SUBMITTED', answers: [] }); await pending.promise; });
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(document.querySelector('.exam-alert-success')).toBeNull();
    expect(assignmentEvents.notifyAssignmentSubmitted).not.toHaveBeenCalled();
    if (change !== 'unmount') {
      expect(screen.queryByText(UNCONFIRMED_MESSAGE)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled();
      expect(screen.getByText('0 / 2 đã làm')).toBeVisible();
    }
  });

  it('cancels delayed navigation after completed submission when the route scope changes', async () => {
    onlyCurrentModule();
    const link = <Link to={`${route}/${ASSIGNMENT_ID + 1}?submissionId=${SUBMISSION_ID + 1}`}>Scope B</Link>;
    await setup(link);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await answerAndSubmit();
    expect(assignmentEvents.notifyAssignmentSubmitted).toHaveBeenCalledTimes(1);
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment(ASSIGNMENT_ID + 1));
    serverSubmission = submission(SUBMISSION_ID + 1, ASSIGNMENT_ID + 1);
    await act(async () => { fireEvent.click(screen.getByRole('link', { name: 'Scope B' })); });
    expect(document.querySelector('.exam-alert-success')).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(screen.getByTestId('location')).toHaveTextContent(`${route}/${ASSIGNMENT_ID + 1}`);
    expect(assignmentEvents.notifyAssignmentSubmitted).toHaveBeenCalledTimes(1);
  });


  it.each([null, {}, { status: 'IN_PROGRESS' }])('keeps malformed FINAL 200 %j unconfirmed', async response => {
    onlyCurrentModule();
    await setup();
    vi.mocked(submissionService.submitSubmission).mockResolvedValueOnce(response as Awaited<ReturnType<typeof submissionService.submitSubmission>>);
    await answerAndSubmit();
    expect(screen.getByText(UNCONFIRMED_MESSAGE)).toBeVisible();
    expect(screen.queryByRole('button', { name: RETRY_LABEL })).not.toBeInTheDocument();
    expectStayed();
  });

  it.each([{ id: 999 }, { assignmentId: 999 }, { modules: [] }, { modules: null }, { status: 'UNKNOWN' }])('rejects malformed fresh progress %j after module acceptance', async overrides => {
    await setup();
    vi.mocked(submissionService.submitModule).mockImplementationOnce(async () => {
      const response = acceptModule();
      serverSubmission = { ...serverSubmission, ...overrides } as SubmissionDetail;
      return response;
    });
    await answerAndSubmit();
    expect(screen.getByText(UNCONFIRMED_MESSAGE)).toBeVisible();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expectStayed();
  });

  it.each(['SUBMITTED', 'GRADED', 'offline', 'malformed'] as const)('checks current server state %s before retrying FINAL', async state => {
    onlyCurrentModule(true);
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await screen.findByRole('button', { name: RETRY_LABEL });
    if (state === 'offline') vi.mocked(submissionService.getSubmission).mockRejectedValueOnce(new Error('Retry GET offline'));
    else if (state === 'malformed') vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(null as unknown as SubmissionDetail);
    else serverSubmission = { ...serverSubmission, status: state };
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: RETRY_LABEL })); });
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    if (state === 'offline' || state === 'malformed') {
      expect(screen.getByText(UNCONFIRMED_MESSAGE)).toBeVisible();
      expectStayed();
    } else expect(document.querySelector('.exam-alert-success')).toBeVisible();
  });

  it('retains the existing next-skill redirect when current module is complete but the parent has incomplete modules', async () => {
    acceptModule();
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(scenario.nextRoute));
    expect(screen.queryByRole('button', { name: RETRY_LABEL })).not.toBeInTheDocument();
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it.each(['progress', 'final', 'retry'] as const)('does not apply stale %s success/error after switching assignment', async stage => {
    if (stage !== 'progress') onlyCurrentModule(stage === 'retry');
    const pendingGet = deferred<SubmissionDetail>();
    const pendingFinal = deferred<Error>();
    const link = <Link to={`${route}/${ASSIGNMENT_ID + 1}?submissionId=${SUBMISSION_ID + 1}`}>Scope B</Link>;
    if (stage === 'retry') {
      renderPage(<>{link}<Page /></>, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
      await screen.findByRole('button', { name: RETRY_LABEL });
      vi.mocked(submissionService.getSubmission).mockReturnValueOnce(pendingGet.promise);
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: RETRY_LABEL })); });
    } else {
      await setup(link);
      if (stage === 'progress') vi.mocked(submissionService.getSubmission).mockReturnValueOnce(pendingGet.promise);
      else vi.mocked(submissionService.submitSubmission).mockReturnValueOnce(pendingFinal.promise.then(error => { throw error; }));
      await answerAndSubmit();
    }
    const signal = stage === 'final' ? vi.mocked(submissionService.submitSubmission).mock.calls[0][1]?.signal
      : vi.mocked(submissionService.getSubmission).mock.calls.at(-1)?.[1]?.signal;
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment(ASSIGNMENT_ID + 1));
    serverSubmission = submission(SUBMISSION_ID + 1, ASSIGNMENT_ID + 1);
    await act(async () => { fireEvent.click(screen.getByRole('link', { name: 'Scope B' })); });
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      if (stage === 'final') pendingFinal.resolve(new Error('Old FINAL error'));
      else pendingGet.resolve(submission());
    });
    expect(document.querySelector('.exam-alert-success')).toBeNull();
    expect(screen.queryByText('Old FINAL error')).not.toBeInTheDocument();
    expect(screen.queryByText(UNCONFIRMED_MESSAGE)).not.toBeInTheDocument();
    expect(assignmentEvents.notifyAssignmentSubmitted).not.toHaveBeenCalled();
    expect(screen.getByTestId('location')).toHaveTextContent(`${route}/${ASSIGNMENT_ID + 1}`);
    expect(submissionService.submitSubmission).toHaveBeenCalledTimes(stage === 'final' ? 1 : 0);
  });

  it('keeps a new pipeline locked when an older A-B-A request finishes', async () => {
    const oldRequest = deferred<Error>();
    const newRequest = deferred<Awaited<ReturnType<typeof submissionService.submitModule>>>();
    const links = <><Link to={`${route}/${ASSIGNMENT_ID + 1}?submissionId=${SUBMISSION_ID}`}>Scope B</Link>
      <Link to={`${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`}>Scope A</Link></>;
    const { user } = await setup(links);
    vi.mocked(submissionService.submitModule).mockReturnValueOnce(oldRequest.promise.then(error => { throw error; }));
    await answerAndSubmit();
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment(ASSIGNMENT_ID + 1));
    serverSubmission = submission(SUBMISSION_ID, ASSIGNMENT_ID + 1);
    await user.click(screen.getByRole('link', { name: 'Scope B' }));
    await waitFor(() => expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled());
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(assignment());
    serverSubmission = submission();
    await user.click(screen.getByRole('link', { name: 'Scope A' }));
    await waitFor(() => expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled());
    vi.mocked(submissionService.submitModule).mockReturnValueOnce(newRequest.promise);
    await answerAndSubmit();
    await act(async () => { oldRequest.resolve(new Error('Old error')); });
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
    expect(screen.queryByText('Old error')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
    expect(submissionService.submitModule).toHaveBeenCalledTimes(2);
    await act(async () => { newRequest.resolve(acceptModule()); await newRequest.promise; });
    expect(document.querySelector('.exam-alert-success')).toBeVisible();
    expect(submissionService.submitModule).toHaveBeenCalledTimes(2);
  });

  it('cleans up the confirmed completion navigation timer on unmount', async () => {
    onlyCurrentModule();
    const { unmount } = await setup();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await answerAndSubmit();
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not fabricate module 1 when assignment loading fails', async () => {
    vi.mocked(assignmentService.getAssignment).mockRejectedValue(new Error('Assignment unavailable'));
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await screen.findByText('Assignment unavailable');
    expect(moduleService.getModule).not.toHaveBeenCalled();
    expect(submissionService.getSubmission).not.toHaveBeenCalled();
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
  });


  it.each(['missing-source-module', 'missing-submission-module', 'duplicate-source-module', 'null-source-module', 'invalid-query'] as const)('never guesses scope on %s', async condition => {
    if (condition === 'missing-source-module') vi.mocked(assignmentService.getAssignment).mockResolvedValue({ ...assignment(), modules: [] });
    if (condition === 'duplicate-source-module') {
      const a = assignment();
      a.modules.push({ id: moduleId, skill });
      vi.mocked(assignmentService.getAssignment).mockResolvedValue(a);
    }
    if (condition === 'null-source-module') vi.mocked(assignmentService.getAssignment).mockResolvedValue({ ...assignment(), modules: [null] } as unknown as AssignmentDetail);
    if (condition === 'missing-submission-module') serverSubmission.modules = serverSubmission.modules.filter(module => module.moduleId !== moduleId);
    const submissionQuery = condition === 'invalid-query' ? 'invalid' : String(SUBMISSION_ID);
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${submissionQuery}`);
    await screen.findByText(UNCONFIRMED_MESSAGE);
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
    expect(submissionService.startAttempt).not.toHaveBeenCalled();
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expectStayed();
  });

  it('reads committed server state on return after abort, without repeating the module POST', async () => {
    onlyCurrentModule();
    const pending = deferred<Awaited<ReturnType<typeof submissionService.submitModule>>>();
    const view = await setup();
    vi.mocked(submissionService.submitModule).mockReturnValueOnce(pending.promise);
    await answerAndSubmit();
    const signal = vi.mocked(submissionService.submitModule).mock.calls[0][2]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    acceptModule();
    await act(async () => { pending.resolve({ message: 'Saved', submissionModuleId, status: 'SUBMITTED', answers: [] }); await pending.promise; });
    renderPage(<Page />, `${route}/:id`, `${route}/${ASSIGNMENT_ID}?submissionId=${SUBMISSION_ID}`);
    await screen.findByRole('button', { name: RETRY_LABEL });
    expect(screen.getByText(PENDING_MESSAGE)).toBeVisible();
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expectStayed();
  });

});
