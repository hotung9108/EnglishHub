import { useEffect } from 'react';
import { formatDocumentTitle } from '../utils/pageTitle';

export interface UseDocumentTitleOptions {
  /** If true, does not revert to the previous title when the component unmounts */
  retainOnUnmount?: boolean;
  /** If true, sets document.title exactly as provided without appending " | EnglishHub" */
  raw?: boolean;
}

/**
 * Hook to set or override the document tab title for a specific component/page.
 *
 * @param title - The title to display (e.g. "Làm bài tập Reading")
 * @param options - Configuration options (retainOnUnmount, raw)
 */
export function useDocumentTitle(
  title?: string | null,
  options: UseDocumentTitleOptions = {}
): void {
  const { retainOnUnmount = false, raw = false } = options;

  useEffect(() => {
    if (!title || !title.trim()) return;

    const previousTitle = document.title;
    document.title = raw ? title.trim() : formatDocumentTitle(title);

    return () => {
      if (!retainOnUnmount) {
        document.title = previousTitle;
      }
    };
  }, [title, retainOnUnmount, raw]);
}

export default useDocumentTitle;
