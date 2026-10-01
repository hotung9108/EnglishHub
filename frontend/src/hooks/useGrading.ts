import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError, type ApiClientError } from '@/api/core/errors';
import { gradingService } from '@/api/services/grading.service';
import type {
  GradingDetailResponse,
  GradingMessageResponse,
  StudentGradingResult,
  UpdateFinalGradeRequest,
} from '@/api/services/grading.service';
import { useMutation } from './core/useMutation';

interface GradingState {
  grading: GradingDetailResponse | null;
  isLoading: boolean;
  error: ApiClientError | null;
}

interface StudentResultState {
  result: StudentGradingResult | null;
  isLoading: boolean;
  error: ApiClientError | null;
}

interface SubmitGradeVariables {
  gradingId: number;
  submissionModuleId: number;
  input: UpdateFinalGradeRequest;
}

export interface UseGradingResult {
  grading: GradingDetailResponse | null;
  isLoading: boolean;
  isMutating: boolean;
  error: ApiClientError | null;
  submitGrade: (input: UpdateFinalGradeRequest) => Promise<GradingMessageResponse>;
  requestAiAnalysis: () => Promise<GradingMessageResponse>;
  refetch: () => Promise<GradingDetailResponse | null>;
}

export interface UseStudentGradingResult {
  result: StudentGradingResult | null;
  isLoading: boolean;
  error: ApiClientError | null;
  refetch: () => Promise<StudentGradingResult | null>;
}

export function useGrading(submissionModuleId?: number): UseGradingResult {
  const [state, setState] = useState<GradingState>(() => ({
    grading: null,
    isLoading: submissionModuleId !== undefined,
    error: null,
  }));
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const currentId = useRef(submissionModuleId);
  const gradingRef = useRef<GradingDetailResponse | null>(null);
  const loadedFor = useRef<number | undefined>(undefined);
  currentId.current = submissionModuleId;

  const invalidate = useCallback(() => {
    requestId.current++;
    controller.current?.abort();
    controller.current = null;
  }, []);

  const load = useCallback(async (id: number): Promise<GradingDetailResponse | null> => {
    if (!mounted.current || currentId.current !== id) {
      return null;
    }

    const currentRequestId = ++requestId.current;
    controller.current?.abort();
    const abortController = new AbortController();
    controller.current = abortController;
    setState(current => ({ ...current, isLoading: true, error: null }));

    try {
      const summary = await gradingService.getBySubmissionModuleId(id, { signal: abortController.signal });
      if (!mounted.current || currentId.current !== id || currentRequestId !== requestId.current) {
        return null;
      }

      const grading = await gradingService.getById(summary.id, { signal: abortController.signal });
      if (!mounted.current || currentId.current !== id || currentRequestId !== requestId.current) {
        return null;
      }

      gradingRef.current = grading;
      loadedFor.current = id;
      setState({ grading, isLoading: false, error: null });
      return grading;
    } catch (cause) {
      if (mounted.current && currentId.current === id && currentRequestId === requestId.current) {
        setState(current => ({ ...current, isLoading: false, error: parseApiError(cause) }));
      }
      return null;
    } finally {
      if (controller.current === abortController) {
        controller.current = null;
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);

  useEffect(() => {
    if (submissionModuleId === undefined) {
      invalidate();
      gradingRef.current = null;
      loadedFor.current = undefined;
      setState({ grading: null, isLoading: false, error: null });
      return;
    }

    gradingRef.current = null;
    loadedFor.current = undefined;
    setState({ grading: null, isLoading: true, error: null });
    void load(submissionModuleId);
    return invalidate;
  }, [submissionModuleId, load, invalidate]);

  const refetch = useCallback(() => {
    if (submissionModuleId === undefined) {
      return Promise.resolve(null);
    }
    return load(submissionModuleId);
  }, [load, submissionModuleId]);

  const refreshAfterGrade = useCallback(async (
    response: GradingMessageResponse,
    variables: SubmitGradeVariables
  ) => {
    void response;
    if (currentId.current === variables.submissionModuleId) {
      await load(variables.submissionModuleId);
    }
  }, [load]);

  const {
    mutateAsync: submitGradeAsync,
    isLoading: isSubmitting,
    error: submitError,
  } = useMutation(
    ({ gradingId, input }: SubmitGradeVariables) => gradingService.submitGrade(gradingId, input),
    { onSuccess: refreshAfterGrade }
  );
  const {
    mutateAsync: requestAiAnalysisAsync,
    isLoading: isAnalyzing,
    error: analysisError,
  } = useMutation(
    (id: number) => gradingService.requestAiAnalysis(id)
  );

  const submitGrade = useCallback((input: UpdateFinalGradeRequest) => {
    const grading = gradingRef.current;
    if (
      submissionModuleId === undefined ||
      grading === null ||
      loadedFor.current !== submissionModuleId
    ) {
      return Promise.reject(new Error('Grading is not loaded.'));
    }

    return submitGradeAsync({
      gradingId: grading.id,
      submissionModuleId,
      input,
    });
  }, [submissionModuleId, submitGradeAsync]);

  const requestAiAnalysis = useCallback(() => {
    if (submissionModuleId === undefined) {
      return Promise.reject(new Error('Submission module ID is required.'));
    }
    return requestAiAnalysisAsync(submissionModuleId);
  }, [requestAiAnalysisAsync, submissionModuleId]);

  return {
    grading: state.grading,
    isLoading: state.isLoading,
    isMutating: isSubmitting || isAnalyzing,
    error: submitError ?? analysisError ?? state.error,
    submitGrade,
    requestAiAnalysis,
    refetch,
  };
}

export function useStudentGradingResult(submissionModuleId?: number): UseStudentGradingResult {
  const [state, setState] = useState<StudentResultState>(() => ({
    result: null,
    isLoading: submissionModuleId !== undefined,
    error: null,
  }));
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const currentId = useRef(submissionModuleId);
  currentId.current = submissionModuleId;

  const invalidate = useCallback(() => {
    requestId.current++;
    controller.current?.abort();
    controller.current = null;
  }, []);

  const load = useCallback(async (id: number): Promise<StudentGradingResult | null> => {
    if (!mounted.current || currentId.current !== id) {
      return null;
    }

    const currentRequestId = ++requestId.current;
    controller.current?.abort();
    const abortController = new AbortController();
    controller.current = abortController;
    setState(current => ({ ...current, isLoading: true, error: null }));

    try {
      const result = await gradingService.getStudentGradingResult(id, { signal: abortController.signal });
      if (!mounted.current || currentId.current !== id || currentRequestId !== requestId.current) {
        return null;
      }

      setState({ result, isLoading: false, error: null });
      return result;
    } catch (cause) {
      if (mounted.current && currentId.current === id && currentRequestId === requestId.current) {
        setState(current => ({ ...current, isLoading: false, error: parseApiError(cause) }));
      }
      return null;
    } finally {
      if (controller.current === abortController) {
        controller.current = null;
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);

  useEffect(() => {
    if (submissionModuleId === undefined) {
      invalidate();
      setState({ result: null, isLoading: false, error: null });
      return;
    }

    setState({ result: null, isLoading: true, error: null });
    void load(submissionModuleId);
    return invalidate;
  }, [submissionModuleId, load, invalidate]);

  const refetch = useCallback(() => {
    if (submissionModuleId === undefined) {
      return Promise.resolve(null);
    }
    return load(submissionModuleId);
  }, [load, submissionModuleId]);

  return {
    result: state.result,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
