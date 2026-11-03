import { useLayoutEffect, useRef, useState } from 'react';
import { submissionService, type SubmitModuleAnswerPayload } from '../api/services/submission.service';
import { parseApiError } from '../api/core/errors';
import {
  classifyStudentQuizProgress, isStudentQuizSubmitScopeValid, QUIZ_PROGRESS, QUIZ_PROGRESS_ERROR, QUIZ_STATUS,
  type StudentQuizProgress, type StudentQuizProgressSubmission, type StudentQuizSubmitScope,
} from '../utils/studentQuiz.utils';

export const QUIZ_SUBMIT_STATE = { IDLE: 'idle', SUBMITTING: 'submitting', FAILED: 'failed', IGNORED: 'ignored' } as const;
export const QUIZ_SUBMIT_ERROR = {
  INVALID_MODULE_RESPONSE: 'INVALID_MODULE_RESPONSE', INVALID_FINAL_RESPONSE: 'INVALID_FINAL_RESPONSE',
  PROGRESS_UNAVAILABLE: 'PROGRESS_UNAVAILABLE', MODULE_REJECTED: 'MODULE_REJECTED',
  FINAL_REJECTED: 'FINAL_REJECTED', MODULES_INCOMPLETE: 'MODULES_INCOMPLETE',
  INVALID_SCOPE: 'INVALID_SCOPE',
} as const;
const MODULE_PHASE = { READY: 'ready', ACCEPTED: 'accepted', UNCONFIRMED: 'unconfirmed' } as const;
const STAGE = { MODULE: 'module', PROGRESS: 'progress', FINAL: 'final' } as const;
const HTTP_STATUS = { CLIENT_ERROR: 400, TIMEOUT: 408, SERVER_ERROR: 500 } as const;
type SubmitReason = typeof QUIZ_SUBMIT_ERROR[keyof typeof QUIZ_SUBMIT_ERROR] | typeof QUIZ_PROGRESS_ERROR[keyof typeof QUIZ_PROGRESS_ERROR];

export type StudentQuizSubmitResult =
  | { kind: typeof QUIZ_PROGRESS.COMPLETED; submissionId: number }
  | Extract<StudentQuizProgress, { kind: 'nextSkill' }>
  | { kind: typeof QUIZ_PROGRESS.PENDING_FINALIZATION; submission: StudentQuizProgressSubmission; cause?: unknown }
  | { kind: typeof QUIZ_PROGRESS.UNCONFIRMED; stage: typeof STAGE[keyof typeof STAGE]; reason: SubmitReason; cause?: unknown }
  | { kind: typeof QUIZ_SUBMIT_STATE.FAILED; reason: typeof QUIZ_SUBMIT_ERROR[keyof typeof QUIZ_SUBMIT_ERROR]; cause?: unknown }
  | { kind: typeof QUIZ_SUBMIT_STATE.IGNORED };
export type StudentQuizSubmitState = StudentQuizSubmitResult | { kind: 'idle' | 'submitting' };
export interface UseStudentQuizSubmitResult {
  state: StudentQuizSubmitState;
  submit: (answers: readonly SubmitModuleAnswerPayload[]) => Promise<StudentQuizSubmitResult>;
  retryFinal: () => Promise<StudentQuizSubmitResult>;
}

interface Action { key: string; generation: number; controller: AbortController }
type ReadProgress = { progress: StudentQuizProgress | null; cause?: unknown };

function isAcceptedResponse(input: unknown, moduleId?: number): boolean {
  try {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
    const response = input as Record<string, unknown>;
    return response.status === QUIZ_STATUS.SUBMITTED && (moduleId === undefined || response.submissionModuleId === moduleId);
  } catch { return false; }
}

export function useStudentQuizSubmit(scope: StudentQuizSubmitScope): UseStudentQuizSubmitResult {
  const validScope = isStudentQuizSubmitScopeValid(scope);
  const key = validScope ? `${scope.assignmentId}:${scope.submissionId}:${scope.moduleId}:${scope.submissionModuleId}:${scope.expectedModuleIds.join(',')}` : QUIZ_SUBMIT_ERROR.INVALID_SCOPE;
  const currentKey = useRef(key);
  const generation = useRef(0);
  const mounted = useRef(false);
  const pending = useRef<Action | null>(null);
  const modulePhase = useRef<typeof MODULE_PHASE[keyof typeof MODULE_PHASE]>(MODULE_PHASE.READY);
  const [stored, setStored] = useState<{ key: string; state: StudentQuizSubmitState }>({ key, state: { kind: QUIZ_SUBMIT_STATE.IDLE } });
  if (stored.key !== key) setStored({ key, state: { kind: QUIZ_SUBMIT_STATE.IDLE } });

  useLayoutEffect(() => {
    currentKey.current = key;
    mounted.current = true;
    const currentGeneration = generation.current + 1;
    generation.current = currentGeneration;
    modulePhase.current = MODULE_PHASE.READY;
    return () => {
      mounted.current = false;
      generation.current = currentGeneration + 1;
      pending.current?.controller.abort();
      pending.current = null;
    };
  }, [key]);

  function isCurrent(action: Action) {
    return mounted.current && currentKey.current === action.key && generation.current === action.generation && pending.current === action;
  }

  async function readProgress(action: Action): Promise<ReadProgress> {
    try {
      const response: unknown = await submissionService.getSubmission(scope.submissionId, { signal: action.controller.signal });
      return { progress: classifyStudentQuizProgress(response, scope) };
    } catch (cause) {
      return { progress: null, cause };
    }
  }

  function unconfirmed(stage: typeof STAGE[keyof typeof STAGE], reason: SubmitReason, cause?: unknown): StudentQuizSubmitResult {
    return { kind: QUIZ_PROGRESS.UNCONFIRMED, stage, reason, cause };
  }

  function completed(): StudentQuizSubmitResult {
    modulePhase.current = MODULE_PHASE.ACCEPTED;
    return { kind: QUIZ_PROGRESS.COMPLETED, submissionId: scope.submissionId };
  }

  async function finalize(action: Action): Promise<StudentQuizSubmitResult> {
    try {
      const response: unknown = await submissionService.submitSubmission(scope.submissionId, { signal: action.controller.signal });
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      if (!isAcceptedResponse(response)) return unconfirmed(STAGE.FINAL, QUIZ_SUBMIT_ERROR.INVALID_FINAL_RESPONSE);
      return completed();
    } catch (cause) {
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      const read = await readProgress(action);
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      if (!read.progress) return unconfirmed(STAGE.FINAL, QUIZ_SUBMIT_ERROR.PROGRESS_UNAVAILABLE, read.cause ?? cause);
      if (read.progress.kind === QUIZ_PROGRESS.COMPLETED) return completed();
      if (read.progress.kind === QUIZ_PROGRESS.UNCONFIRMED) return unconfirmed(STAGE.FINAL, read.progress.reason, read.cause ?? cause);
      if (read.progress.kind === QUIZ_PROGRESS.NEXT_SKILL) return { kind: QUIZ_SUBMIT_STATE.FAILED, reason: QUIZ_SUBMIT_ERROR.MODULES_INCOMPLETE, cause };
      // A 400 is never accepted without a terminal parent confirmed by GET.
      const status = parseApiError(cause).statusCode;
      if (status >= HTTP_STATUS.CLIENT_ERROR && status < HTTP_STATUS.SERVER_ERROR && status !== HTTP_STATUS.TIMEOUT) {
        return { kind: QUIZ_SUBMIT_STATE.FAILED, reason: QUIZ_SUBMIT_ERROR.FINAL_REJECTED, cause };
      }
      return { kind: QUIZ_PROGRESS.PENDING_FINALIZATION, submission: read.progress.submission, cause };
    }
  }

  async function advance(action: Action, read: ReadProgress): Promise<StudentQuizSubmitResult> {
    const progress = read.progress;
    const stage = modulePhase.current === MODULE_PHASE.ACCEPTED ? STAGE.PROGRESS : STAGE.MODULE;
    if (!progress) return unconfirmed(stage, QUIZ_SUBMIT_ERROR.PROGRESS_UNAVAILABLE, read.cause);
    if (progress.kind === QUIZ_PROGRESS.UNCONFIRMED) return unconfirmed(stage, progress.reason, read.cause);
    if (progress.kind === QUIZ_PROGRESS.COMPLETED) return completed();
    const current = progress.submission.modules.find(module => module.id === scope.submissionModuleId);
    if (!current || current.status === QUIZ_STATUS.IN_PROGRESS) return unconfirmed(STAGE.PROGRESS, QUIZ_SUBMIT_ERROR.MODULE_REJECTED);
    modulePhase.current = MODULE_PHASE.ACCEPTED;
    if (progress.kind === QUIZ_PROGRESS.NEXT_SKILL) return progress;
    return finalize(action);
  }

  async function submitPrepared(action: Action, answers: readonly SubmitModuleAnswerPayload[]): Promise<StudentQuizSubmitResult> {
    if (modulePhase.current !== MODULE_PHASE.READY) {
      const read = await readProgress(action);
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      const progress = read.progress;
      if (!progress || progress.kind !== QUIZ_PROGRESS.NEXT_SKILL || progress.submission.modules.find(m => m.id === scope.submissionModuleId)?.status !== QUIZ_STATUS.IN_PROGRESS) {
        return advance(action, read);
      }
      if (modulePhase.current === MODULE_PHASE.ACCEPTED) return unconfirmed(STAGE.PROGRESS, QUIZ_SUBMIT_ERROR.MODULE_REJECTED);
    }
    try {
      const response: unknown = await submissionService.submitModule(scope.submissionModuleId, { answers: [...answers] }, { signal: action.controller.signal });
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      modulePhase.current = MODULE_PHASE.UNCONFIRMED;
      if (!isAcceptedResponse(response, scope.submissionModuleId)) return unconfirmed(STAGE.MODULE, QUIZ_SUBMIT_ERROR.INVALID_MODULE_RESPONSE);
      modulePhase.current = MODULE_PHASE.ACCEPTED;
    } catch (cause) {
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      modulePhase.current = MODULE_PHASE.UNCONFIRMED;
      const read = await readProgress(action);
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      if (read.progress?.kind === QUIZ_PROGRESS.NEXT_SKILL && read.progress.submission.modules.find(m => m.id === scope.submissionModuleId)?.status === QUIZ_STATUS.IN_PROGRESS) {
        modulePhase.current = MODULE_PHASE.READY;
        return { kind: QUIZ_SUBMIT_STATE.FAILED, reason: QUIZ_SUBMIT_ERROR.MODULE_REJECTED, cause };
      }
      return advance(action, read);
    }
    const read = await readProgress(action);
    if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
    return advance(action, read);
  }

  async function retry(action: Action): Promise<StudentQuizSubmitResult> {
    const read = await readProgress(action);
    if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
    if (!read.progress) return unconfirmed(STAGE.FINAL, QUIZ_SUBMIT_ERROR.PROGRESS_UNAVAILABLE, read.cause);
    if (read.progress.kind === QUIZ_PROGRESS.UNCONFIRMED) return unconfirmed(STAGE.FINAL, read.progress.reason);
    if (read.progress.kind === QUIZ_PROGRESS.NEXT_SKILL) return { kind: QUIZ_SUBMIT_STATE.FAILED, reason: QUIZ_SUBMIT_ERROR.MODULES_INCOMPLETE };
    return advance(action, read);
  }

  async function run(answers?: readonly SubmitModuleAnswerPayload[]): Promise<StudentQuizSubmitResult> {
    if (!mounted.current || pending.current || currentKey.current !== key) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
    const action: Action = { key, generation: generation.current, controller: new AbortController() };
    pending.current = action;
    setStored({ key, state: { kind: QUIZ_SUBMIT_STATE.SUBMITTING } });
    try {
      let result: StudentQuizSubmitResult;
      if (!validScope) result = { kind: QUIZ_SUBMIT_STATE.FAILED, reason: QUIZ_SUBMIT_ERROR.INVALID_SCOPE };
      else result = answers === undefined ? await retry(action) : await submitPrepared(action, answers);
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      setStored({ key, state: result });
      return result;
    } catch (cause) {
      if (!isCurrent(action)) return { kind: QUIZ_SUBMIT_STATE.IGNORED };
      const result = unconfirmed(STAGE.PROGRESS, QUIZ_SUBMIT_ERROR.PROGRESS_UNAVAILABLE, cause);
      setStored({ key, state: result });
      return result;
    } finally {
      if (pending.current === action) pending.current = null;
    }
  }

  return {
    state: stored.key === key ? stored.state : { kind: QUIZ_SUBMIT_STATE.IDLE },
    submit: (answers: readonly SubmitModuleAnswerPayload[]) => run(answers),
    retryFinal: () => run(),
  };
}
