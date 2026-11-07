import { useCallback, useEffect, useState } from 'react';
import { parseApiError } from '../api/core/errors';
import { answerAnnotationService, type GradingAnnotation } from '../api/services/answer-annotation.service';

export type AnnotationErrorKind = 'forbidden' | 'notFound' | 'network';
type AnnotationStatus = 'loading' | 'success' | 'missingAnswerId' | AnnotationErrorKind;

interface AnnotationState {
  answerId: number | undefined;
  revision: number;
  annotations: GradingAnnotation[];
  status: AnnotationStatus;
}

export function getAnnotationErrorKind(error: unknown): AnnotationErrorKind {
  const status = parseApiError(error).statusCode;
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  return 'network';
}

export function useStudentAnswerAnnotations(answerId: number | undefined) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<AnnotationState>({
    answerId, revision: 0, annotations: [],
    status: answerId === undefined ? 'missingAnswerId' : 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({
        answerId, revision, annotations: [],
        status: answerId === undefined ? 'missingAnswerId' : 'loading',
      });
      if (answerId === undefined) return;

      try {
        const response = await answerAnnotationService.listAnnotations(answerId);
        if (!cancelled) {
          setState({ answerId, revision, annotations: response.data, status: 'success' });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ answerId, revision, annotations: [], status: getAnnotationErrorKind(error) });
        }
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [answerId, revision]);

  const retry = useCallback(() => setRevision(current => current + 1), []);
  // Hide the previous answer before the new effect runs, including on retry.
  const current = state.answerId === answerId && state.revision === revision;
  const status: AnnotationStatus = answerId === undefined
    ? 'missingAnswerId'
    : current ? state.status : 'loading';

  return { annotations: current ? state.annotations : [], status, retry };
}
