import type {
  QuestionOptionResponse,
  QuestionResponse,
  QuestionType,
} from '../api/services/question.service';
import type { SubmitModuleAnswerPayload } from '../api/services/submission.service';
import type { SubmissionDetail, SubmissionModuleDetail, SubmissionSkill } from '../api/services/submission.service';

// REST contract: MultipleChoiceCorrectAnswer.options has @Size(min = 2).
const MIN_MCQ_OPTION_COUNT = 2;

export type StudentQuizQuestion = Pick<QuestionResponse, 'id' | 'content' | 'questionType' | 'options'>;

export type StudentQuizAnswer =
  | { questionType: 'MULTIPLE_CHOICE'; selectedOptionId: QuestionOptionResponse['id'] }
  | { questionType: 'SHORT_ANSWER'; text: string };

export type StudentQuizAnswers = Readonly<Partial<Record<QuestionResponse['id'], StudentQuizAnswer>>>;

export type StudentQuizListError = 'QUESTIONS_NOT_ARRAY' | 'QUESTIONS_EMPTY' | 'QUESTIONS_UNREADABLE';

export type StudentQuizQuestionError =
  | 'QUESTION_NOT_OBJECT'
  | 'QUESTION_ID_INVALID'
  | 'QUESTION_ID_DUPLICATE'
  | 'QUESTION_CONTENT_INVALID'
  | 'QUESTION_TYPE_UNSUPPORTED'
  | 'OPTIONS_NOT_ARRAY'
  | 'OPTIONS_COUNT_INVALID'
  | 'OPTION_NOT_OBJECT'
  | 'OPTION_ID_INVALID'
  | 'OPTION_ID_DUPLICATE'
  | 'OPTION_CONTENT_INVALID'
  | 'QUESTION_UNREADABLE';

export interface StudentQuizQuestionResult {
  index: number;
  questionId: QuestionResponse['id'] | null;
  question: StudentQuizQuestion | null;
  reason: StudentQuizQuestionError | null;
  optionIndex?: number;
}

export interface StudentQuizValidationResult {
  isValid: boolean;
  listError: StudentQuizListError | null;
  questions: StudentQuizQuestionResult[];
}

export interface StudentQuizPayloadResult {
  validation: StudentQuizValidationResult;
  answers: SubmitModuleAnswerPayload[];
}

type OptionResult =
  | { options: QuestionOptionResponse[]; reason: null }
  | { options: null; reason: StudentQuizQuestionError; optionIndex?: number };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function readQuestionType(value: unknown): QuestionType | null {
  if (typeof value !== 'string') return null;
  const type = value.toUpperCase();
  if (type === 'MULTIPLE_CHOICE' || type === 'SHORT_ANSWER') return type;
  return null;
}

function validateOptions(value: unknown): OptionResult {
  if (!Array.isArray(value)) return { options: null, reason: 'OPTIONS_NOT_ARRAY' };
  if (value.length < MIN_MCQ_OPTION_COUNT) {
    return { options: null, reason: 'OPTIONS_COUNT_INVALID' };
  }

  const ids = new Set<number>();
  const options: QuestionOptionResponse[] = [];
  for (let index = 0; index < value.length; index++) {
    const option: unknown = value[index];
    if (!isObject(option)) {
      return { options: null, reason: 'OPTION_NOT_OBJECT', optionIndex: index };
    }
    const id = option.id;
    const content = option.content;
    if (!isPositiveSafeInteger(id)) {
      return { options: null, reason: 'OPTION_ID_INVALID', optionIndex: index };
    }
    if (ids.has(id)) {
      return { options: null, reason: 'OPTION_ID_DUPLICATE', optionIndex: index };
    }
    if (!isNonBlankString(content)) {
      return { options: null, reason: 'OPTION_CONTENT_INVALID', optionIndex: index };
    }
    ids.add(id);
    options.push({ id, content });
  }
  return { options, reason: null };
}

function questionError(
  index: number,
  questionId: number | null,
  reason: StudentQuizQuestionError,
  optionIndex?: number,
): StudentQuizQuestionResult {
  return { index, questionId, question: null, reason, optionIndex };
}

function validateQuestion(value: unknown, index: number): StudentQuizQuestionResult {
  let questionId: number | null = null;
  try {
    if (!isObject(value)) return questionError(index, null, 'QUESTION_NOT_OBJECT');
    const id = value.id;
    if (!isPositiveSafeInteger(id)) return questionError(index, null, 'QUESTION_ID_INVALID');
    questionId = id;
    const content = value.content;
    if (!isNonBlankString(content)) return questionError(index, id, 'QUESTION_CONTENT_INVALID');
    const questionType = readQuestionType(value.questionType);
    if (!questionType) return questionError(index, id, 'QUESTION_TYPE_UNSUPPORTED');

    const question: StudentQuizQuestion = { id, content, questionType };
    if (questionType === 'MULTIPLE_CHOICE') {
      const result = validateOptions(value.options);
      if (result.reason !== null) return questionError(index, id, result.reason, result.optionIndex);
      question.options = result.options;
    }
    return { index, questionId: id, question, reason: null };
  } catch {
    // Unknown input may contain throwing getters/proxies, unlike a normal JSON response.
    return questionError(index, questionId, 'QUESTION_UNREADABLE');
  }
}

/** Keeps every source position, including invalid questions and sparse array entries. */
export function validateStudentQuizQuestions(input: unknown): StudentQuizValidationResult {
  try {
    if (!Array.isArray(input)) return { isValid: false, listError: 'QUESTIONS_NOT_ARRAY', questions: [] };
    if (input.length === 0) return { isValid: false, listError: 'QUESTIONS_EMPTY', questions: [] };

    const questions: StudentQuizQuestionResult[] = [];
    const ids = new Set<number>();
    const duplicateIds = new Set<number>();
    for (let index = 0; index < input.length; index++) {
      const result = validateQuestion(input[index], index);
      questions.push(result);
      if (result.questionId === null) continue;
      if (ids.has(result.questionId)) duplicateIds.add(result.questionId);
      ids.add(result.questionId);
    }
    for (const result of questions) {
      if (result.questionId !== null && duplicateIds.has(result.questionId)) {
        result.question = null;
        result.reason = 'QUESTION_ID_DUPLICATE';
        delete result.optionIndex;
      }
    }
    return { isValid: questions.every(result => result.reason === null), listError: null, questions };
  } catch {
    return { isValid: false, listError: 'QUESTIONS_UNREADABLE', questions: [] };
  }
}

function readAnswerContent(
  question: StudentQuizQuestion,
  input: unknown,
): SubmitModuleAnswerPayload['content'] | null {
  try {
    if (!isObject(input) || !Object.hasOwn(input, question.id)) return null;
    const answer = input[question.id];
    if (!isObject(answer) || answer.questionType !== question.questionType) return null;
    if (question.questionType === 'SHORT_ANSWER') {
      const text = answer.text;
      return isNonBlankString(text) ? { text: text.trim() } : null;
    }
    const selectedOptionId = answer.selectedOptionId;
    if (!isPositiveSafeInteger(selectedOptionId)) return null;
    if (!question.options?.some(option => option.id === selectedOptionId)) return null;
    return { selectedOptionIds: [selectedOptionId] };
  } catch {
    return null;
  }
}

/** Returns validation alongside the payload; callers must handle question errors separately. */
export function buildStudentQuizPayload(questions: unknown, input: unknown): StudentQuizPayloadResult {
  const validation = validateStudentQuizQuestions(questions);
  const answers: SubmitModuleAnswerPayload[] = [];
  for (const result of validation.questions) {
    if (!result.question) continue;
    const content = readAnswerContent(result.question, input);
    if (content) answers.push({ questionId: result.question.id, content });
  }
  return { validation, answers };
}

/** Invalid question data is not classified as a blank attempt. */
export function isStudentQuizBlank(questions: unknown, input: unknown): boolean {
  const result = buildStudentQuizPayload(questions, input);
  return result.validation.isValid && result.answers.length === 0;
}

export const QUIZ_STATUS = { IN_PROGRESS: 'IN_PROGRESS', SUBMITTED: 'SUBMITTED', GRADED: 'GRADED' } as const;
export const QUIZ_PROGRESS = {
  COMPLETED: 'completed', NEXT_SKILL: 'nextSkill', PENDING_FINALIZATION: 'pendingFinalization', UNCONFIRMED: 'unconfirmed',
} as const;
export const QUIZ_PROGRESS_ERROR = { INVALID_SCOPE: 'INVALID_SCOPE', INVALID_SUBMISSION: 'INVALID_SUBMISSION' } as const;

export interface StudentQuizSubmitScope {
  assignmentId: number;
  submissionId: number;
  moduleId: number;
  submissionModuleId: number;
  expectedModuleIds: readonly number[];
}

export type StudentQuizProgressModule = Pick<SubmissionModuleDetail, 'id' | 'moduleId' | 'status'> & { skill: SubmissionSkill };
export type StudentQuizProgressSubmission = Pick<SubmissionDetail, 'id' | 'assignmentId' | 'status'> & { modules: StudentQuizProgressModule[] };
export type StudentQuizProgress =
  | { kind: typeof QUIZ_PROGRESS.COMPLETED; submission: StudentQuizProgressSubmission }
  | { kind: typeof QUIZ_PROGRESS.NEXT_SKILL; submission: StudentQuizProgressSubmission; nextModule: StudentQuizProgressModule }
  | { kind: typeof QUIZ_PROGRESS.PENDING_FINALIZATION; submission: StudentQuizProgressSubmission }
  | { kind: typeof QUIZ_PROGRESS.UNCONFIRMED; reason: typeof QUIZ_PROGRESS_ERROR[keyof typeof QUIZ_PROGRESS_ERROR] };

export function isStudentQuizSubmitScopeValid(scope: unknown): scope is StudentQuizSubmitScope {
  try {
    if (!isObject(scope)) return false;
    const { assignmentId, submissionId, moduleId, submissionModuleId, expectedModuleIds } = scope;
    if (!isPositiveSafeInteger(assignmentId) || !isPositiveSafeInteger(submissionId)
      || !isPositiveSafeInteger(moduleId) || !isPositiveSafeInteger(submissionModuleId)) return false;
    if (!Array.isArray(expectedModuleIds)) return false;
    const expected: unknown[] = expectedModuleIds;
    return expected.length > 0 && expected.every(isPositiveSafeInteger)
      && new Set(expected).size === expected.length && expected.includes(moduleId);
  } catch { return false; }
}

/** Validates the response fields used for progress, without trusting a DTO type assertion. */
export function classifyStudentQuizProgress(input: unknown, scope: StudentQuizSubmitScope): StudentQuizProgress {
  const invalid: StudentQuizProgress = { kind: QUIZ_PROGRESS.UNCONFIRMED, reason: QUIZ_PROGRESS_ERROR.INVALID_SUBMISSION };
  try {
    if (!isStudentQuizSubmitScopeValid(scope)) return { kind: QUIZ_PROGRESS.UNCONFIRMED, reason: QUIZ_PROGRESS_ERROR.INVALID_SCOPE };
    if (!isObject(input) || input.id !== scope.submissionId || input.assignmentId !== scope.assignmentId) return invalid;
    const status = input.status;
    if (status !== QUIZ_STATUS.IN_PROGRESS && status !== QUIZ_STATUS.SUBMITTED && status !== QUIZ_STATUS.GRADED) return invalid;
    if (!Array.isArray(input.modules) || input.modules.length !== scope.expectedModuleIds.length) return invalid;
    const modules: StudentQuizProgressModule[] = [];
    const ids = new Set<number>();
    const moduleIds = new Set<number>();
    for (const value of input.modules) {
      if (!isObject(value)) return invalid;
      const { id, moduleId, skill, status: moduleStatus } = value;
      if (!isPositiveSafeInteger(id) || !isPositiveSafeInteger(moduleId) || ids.has(id) || moduleIds.has(moduleId)) return invalid;
      if (!scope.expectedModuleIds.includes(moduleId)) return invalid;
      if (skill !== 'READING' && skill !== 'LISTENING' && skill !== 'WRITING' && skill !== 'SPEAKING') return invalid;
      if (moduleStatus !== QUIZ_STATUS.IN_PROGRESS && moduleStatus !== QUIZ_STATUS.SUBMITTED && moduleStatus !== QUIZ_STATUS.GRADED) return invalid;
      modules.push({ id, moduleId, skill, status: moduleStatus });
      ids.add(id);
      moduleIds.add(moduleId);
    }
    const current = modules.find(module => module.moduleId === scope.moduleId);
    if (!current || current.id !== scope.submissionModuleId || (current.skill !== 'READING' && current.skill !== 'LISTENING')) return invalid;
    const submission: StudentQuizProgressSubmission = { id: scope.submissionId, assignmentId: scope.assignmentId, status, modules };
    if (status !== QUIZ_STATUS.IN_PROGRESS) return { kind: QUIZ_PROGRESS.COMPLETED, submission };
    for (const id of scope.expectedModuleIds) {
      const nextModule = modules.find(module => module.moduleId === id);
      if (!nextModule) return invalid;
      if (nextModule.status === QUIZ_STATUS.IN_PROGRESS) return { kind: QUIZ_PROGRESS.NEXT_SKILL, submission, nextModule };
    }
    return { kind: QUIZ_PROGRESS.PENDING_FINALIZATION, submission };
  } catch {
    return invalid;
  }
}

export function isStudentQuizPendingFinalization(input: unknown, scope: StudentQuizSubmitScope): boolean {
  return classifyStudentQuizProgress(input, scope).kind === QUIZ_PROGRESS.PENDING_FINALIZATION;
}
