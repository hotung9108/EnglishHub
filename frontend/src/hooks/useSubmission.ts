import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError, type ApiClientError } from '@/api/core/errors';
import {
  findInProgressAttempt,
  getRemainingAttempts,
  submissionService,
} from '@/api/services/submission.service';
import type {
  StartSubmissionResponse,
  SubmissionDetail,
  SubmissionListItem,
  SubmissionListResponse,
  SubmitResponse,
} from '@/api/services/submission.service';
import { useMutation } from './core/useMutation';

export interface UseSubmissionAttemptsOptions {
  assignmentId?: number;
  maxSubmissions?: number | null;
  enabled?: boolean;
}

interface SubmissionAttemptsState {
  assignmentId: number | undefined;
  enabled: boolean;
  response: SubmissionListResponse | null;
  isLoading: boolean;
  error: ApiClientError | null;
}

interface SubmissionActionState {
  id: number | undefined;
  enabled: boolean;
  isLoading: boolean;
  error: ApiClientError | null;
}

interface PendingAction<TResponse> {
  id: number;
  promise: Promise<TResponse>;
}

interface StartAttemptVariables {
  assignmentId: number;
  signal: AbortSignal;
}

interface SubmitVariables {
  submissionId: number;
  signal: AbortSignal;
}

export interface UseSubmissionAttemptsResult {
  attempts: SubmissionListItem[] | null;
  attemptsUsed: number | undefined;
  remainingAttempts: number | null | undefined;
  inProgressAttempt: SubmissionListItem | null | undefined;
  isLoading: boolean;
  error: ApiClientError | null;
  refetch: () => Promise<SubmissionListResponse | null>;
  startAttempt: () => Promise<StartSubmissionResponse>;
  isStarting: boolean;
}

export interface UseSubmissionResult {
  submission: SubmissionDetail | null;
  isLoading: boolean;
  error: ApiClientError | null;
  refetch: () => Promise<SubmissionDetail | null>;
  submit: () => Promise<SubmitResponse>;
  isSubmitting: boolean;
}

export function useSubmissionAttempts({
  assignmentId,
  maxSubmissions,
  enabled = true,
}: UseSubmissionAttemptsOptions): UseSubmissionAttemptsResult {
  const isEnabled = enabled && assignmentId !== undefined;
  const [state, setState] = useState<SubmissionAttemptsState>(() => ({
    assignmentId,
    enabled,
    response: null,
    isLoading: isEnabled,
    error: null,
  }));
  const [actionState, setActionState] = useState<SubmissionActionState>(() => ({
    id: assignmentId,
    enabled,
    isLoading: false,
    error: null,
  }));
  const requestId = useRef(0);
  const actionId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const actionController = useRef<AbortController | null>(null);
  const actionPromise = useRef<PendingAction<StartSubmissionResponse> | null>(null);
  const mounted = useRef(false);
  const currentAssignmentId = useRef(assignmentId);
  const currentEnabled = useRef(enabled);
  currentAssignmentId.current = assignmentId;
  currentEnabled.current = enabled;

  const {
    mutateAsync: startAttemptMutation,
    reset: resetStartAttemptMutation,
  } = useMutation((variables: StartAttemptVariables) =>
    submissionService.startAttempt(variables.assignmentId, { signal: variables.signal })
  );

  const isCurrentScope = useCallback((id: number, enabledForRequest: boolean) =>
    mounted.current &&
    enabledForRequest &&
    currentAssignmentId.current === id &&
    currentEnabled.current === enabledForRequest,
  []);

  const isCurrentAction = useCallback((id: number, actionRequestId: number) =>
    isCurrentScope(id, true) && actionId.current === actionRequestId,
  [isCurrentScope]);

  const invalidate = useCallback(() => {
    requestId.current++;
    controller.current?.abort();
    controller.current = null;
    actionId.current++;
    actionController.current?.abort();
    actionController.current = null;
    actionPromise.current = null;
  }, []);

  const load = useCallback(async (
    id: number,
    enabledForRequest: boolean
  ): Promise<SubmissionListResponse | null> => {
    if (!isCurrentScope(id, enabledForRequest)) {
      return null;
    }

    const currentRequestId = ++requestId.current;
    controller.current?.abort();
    const abortController = new AbortController();
    controller.current = abortController;
    setState(current => ({ ...current, isLoading: true, error: null }));

    try {
      const response = await submissionService.listSubmissions(
        { assignmentId: id, page: 1, limit: 100 },
        { signal: abortController.signal }
      );
      if (
        !isCurrentScope(id, enabledForRequest) ||
        currentRequestId !== requestId.current
      ) {
        return null;
      }

      setState({
        assignmentId: id,
        enabled: enabledForRequest,
        response,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (cause) {
      if (
        isCurrentScope(id, enabledForRequest) &&
        currentRequestId === requestId.current
      ) {
        setState(current => ({
          ...current,
          isLoading: false,
          error: parseApiError(cause),
        }));
      }
      return null;
    } finally {
      if (controller.current === abortController) {
        controller.current = null;
      }
    }
  }, [isCurrentScope]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);

  useEffect(() => {
    invalidate();
    resetStartAttemptMutation();

    if (assignmentId === undefined || !enabled) {
      setState({ assignmentId, enabled, response: null, isLoading: false, error: null });
      setActionState({ id: assignmentId, enabled, isLoading: false, error: null });
      return;
    }

    setState({ assignmentId, enabled, response: null, isLoading: true, error: null });
    setActionState({ id: assignmentId, enabled, isLoading: false, error: null });
    void load(assignmentId, enabled);
    return invalidate;
  }, [assignmentId, enabled, invalidate, load, resetStartAttemptMutation]);

  const refetch = useCallback(() => {
    if (assignmentId === undefined || !enabled) {
      return Promise.resolve(null);
    }
    return load(assignmentId, enabled);
  }, [assignmentId, enabled, load]);

  const startAttempt = useCallback((): Promise<StartSubmissionResponse> => {
    if (assignmentId === undefined || !enabled) {
      return Promise.reject(new Error('Assignment ID is required.'));
    }

    const pendingAction = actionPromise.current;
    if (pendingAction?.id === assignmentId) {
      return pendingAction.promise;
    }

    if (pendingAction) {
      actionController.current?.abort();
      actionId.current++;
      actionController.current = null;
      actionPromise.current = null;
    }

    const currentActionId = ++actionId.current;
    const abortController = new AbortController();
    actionController.current = abortController;
    setActionState({ id: assignmentId, enabled, isLoading: true, error: null });

    const request = Promise.resolve().then(async () => {
      try {
        const response = await startAttemptMutation({
          assignmentId,
          signal: abortController.signal,
        });
        if (isCurrentAction(assignmentId, currentActionId)) {
          await load(assignmentId, enabled);
        }
        return response;
      } catch (cause) {
        const error = parseApiError(cause);
        if (isCurrentAction(assignmentId, currentActionId)) {
          setActionState({ id: assignmentId, enabled, isLoading: false, error });
        }
        throw error;
      } finally {
        if (actionId.current === currentActionId) {
          actionPromise.current = null;
        }
        if (actionController.current === abortController) {
          actionController.current = null;
        }
        if (isCurrentAction(assignmentId, currentActionId)) {
          setActionState(current => ({ ...current, isLoading: false }));
        }
      }
    });

    actionPromise.current = { id: assignmentId, promise: request };
    return request;
  }, [assignmentId, enabled, isCurrentAction, load, startAttemptMutation]);

  const currentState =
    state.assignmentId === assignmentId && state.enabled === enabled
      ? state
      : {
          assignmentId,
          enabled,
          response: null,
          isLoading: isEnabled,
          error: null,
        };
  const currentActionState =
    actionState.id === assignmentId && actionState.enabled === enabled
      ? actionState
      : { id: assignmentId, enabled, isLoading: false, error: null };
  const attemptsUsed = currentState.response?.pagination.total;
  const inProgressAttempt = currentState.response
    ? findInProgressAttempt(currentState.response.data) ??
      (currentState.response.pagination.total <= currentState.response.data.length ? null : undefined)
    : undefined;

  return {
    attempts: currentState.response?.data ?? null,
    attemptsUsed,
    remainingAttempts:
      attemptsUsed === undefined
        ? undefined
        : getRemainingAttempts(maxSubmissions, attemptsUsed),
    inProgressAttempt,
    isLoading: currentState.isLoading,
    error: currentActionState.error ?? currentState.error,
    refetch,
    startAttempt,
    isStarting: currentActionState.isLoading,
  };
}

export function useSubmission(submissionId?: number): UseSubmissionResult {
  const [state, setState] = useState<{
    submissionId: number | undefined;
    submission: SubmissionDetail | null;
    isLoading: boolean;
    error: ApiClientError | null;
  }>(() => ({
    submissionId,
    submission: null,
    isLoading: submissionId !== undefined,
    error: null,
  }));
  const [actionState, setActionState] = useState<SubmissionActionState>(() => ({
    id: submissionId,
    enabled: true,
    isLoading: false,
    error: null,
  }));
  const requestId = useRef(0);
  const actionId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const actionController = useRef<AbortController | null>(null);
  const actionPromise = useRef<PendingAction<SubmitResponse> | null>(null);
  const mounted = useRef(false);
  const currentSubmissionId = useRef(submissionId);
  currentSubmissionId.current = submissionId;

  const {
    mutateAsync: submitMutation,
    reset: resetSubmitMutation,
  } = useMutation((variables: SubmitVariables) =>
    submissionService.submitSubmission(variables.submissionId, { signal: variables.signal })
  );

  const isCurrentScope = useCallback((id: number) =>
    mounted.current && currentSubmissionId.current === id,
  []);

  const isCurrentAction = useCallback((id: number, actionRequestId: number) =>
    isCurrentScope(id) && actionId.current === actionRequestId,
  [isCurrentScope]);

  const invalidate = useCallback(() => {
    requestId.current++;
    controller.current?.abort();
    controller.current = null;
    actionId.current++;
    actionController.current?.abort();
    actionController.current = null;
    actionPromise.current = null;
  }, []);

  const load = useCallback(async (id: number): Promise<SubmissionDetail | null> => {
    if (!isCurrentScope(id)) {
      return null;
    }

    const currentRequestId = ++requestId.current;
    controller.current?.abort();
    const abortController = new AbortController();
    controller.current = abortController;
    setState(current => ({ ...current, isLoading: true, error: null }));

    try {
      const submission = await submissionService.getSubmission(id, {
        signal: abortController.signal,
      });
      if (!isCurrentScope(id) || currentRequestId !== requestId.current) {
        return null;
      }

      setState({ submissionId: id, submission, isLoading: false, error: null });
      return submission;
    } catch (cause) {
      if (isCurrentScope(id) && currentRequestId === requestId.current) {
        setState(current => ({ ...current, isLoading: false, error: parseApiError(cause) }));
      }
      return null;
    } finally {
      if (controller.current === abortController) {
        controller.current = null;
      }
    }
  }, [isCurrentScope]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);

  useEffect(() => {
    invalidate();
    resetSubmitMutation();

    if (submissionId === undefined) {
      setState({ submissionId, submission: null, isLoading: false, error: null });
      setActionState({ id: submissionId, enabled: true, isLoading: false, error: null });
      return;
    }

    setState({ submissionId, submission: null, isLoading: true, error: null });
    setActionState({ id: submissionId, enabled: true, isLoading: false, error: null });
    void load(submissionId);
    return invalidate;
  }, [invalidate, load, resetSubmitMutation, submissionId]);

  const refetch = useCallback(() => {
    if (submissionId === undefined) {
      return Promise.resolve(null);
    }
    return load(submissionId);
  }, [load, submissionId]);

  const submit = useCallback((): Promise<SubmitResponse> => {
    if (submissionId === undefined) {
      return Promise.reject(new Error('Submission ID is required.'));
    }

    const pendingAction = actionPromise.current;
    if (pendingAction?.id === submissionId) {
      return pendingAction.promise;
    }

    if (pendingAction) {
      actionController.current?.abort();
      actionId.current++;
      actionController.current = null;
      actionPromise.current = null;
    }

    const currentActionId = ++actionId.current;
    const abortController = new AbortController();
    actionController.current = abortController;
    setActionState({ id: submissionId, enabled: true, isLoading: true, error: null });

    const request = Promise.resolve().then(async () => {
      try {
        const response = await submitMutation({
          submissionId,
          signal: abortController.signal,
        });
        if (isCurrentAction(submissionId, currentActionId)) {
          await load(submissionId);
        }
        return response;
      } catch (cause) {
        const error = parseApiError(cause);
        if (isCurrentAction(submissionId, currentActionId)) {
          setActionState({ id: submissionId, enabled: true, isLoading: false, error });
        }
        throw error;
      } finally {
        if (actionId.current === currentActionId) {
          actionPromise.current = null;
        }
        if (actionController.current === abortController) {
          actionController.current = null;
        }
        if (isCurrentAction(submissionId, currentActionId)) {
          setActionState(current => ({ ...current, isLoading: false }));
        }
      }
    });

    actionPromise.current = { id: submissionId, promise: request };
    return request;
  }, [isCurrentAction, load, submissionId, submitMutation]);

  const currentState =
    state.submissionId === submissionId
      ? state
      : {
          submissionId,
          submission: null,
          isLoading: submissionId !== undefined,
          error: null,
        };
  const currentActionState =
    actionState.id === submissionId
      ? actionState
      : { id: submissionId, enabled: true, isLoading: false, error: null };

  return {
    submission: currentState.submission,
    isLoading: currentState.isLoading,
    error: currentActionState.error ?? currentState.error,
    refetch,
    submit,
    isSubmitting: currentActionState.isLoading,
  };
}
