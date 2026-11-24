import React from 'react';

export type HighlightColor = 'yellow' | 'green' | 'pink';

export interface HighlightItem {
  id: string;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  text: string;
  createdAt?: number;
}

export const HIGHLIGHT_COLORS: Record<HighlightColor, { label: string; bg: string; text: string; border: string }> = {
  yellow: {
    label: 'Vàng',
    bg: '#fef08a',
    text: '#854d0e',
    border: '#facc15'
  },
  green: {
    label: 'Xanh lá',
    bg: '#bbf7d0',
    text: '#166534',
    border: '#86efac'
  },
  pink: {
    label: 'Hồng',
    bg: '#fbcfe8',
    text: '#9d174d',
    border: '#f472b6'
  }
};

export const getHighlightsStorageKey = (assignmentId: number, moduleId: number): string => {
  return `eh_reading_highlights_${assignmentId}_${moduleId}`;
};

export const loadHighlights = (assignmentId: number, moduleId: number): HighlightItem[] => {
  if (!assignmentId || !moduleId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getHighlightsStorageKey(assignmentId, moduleId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load highlights from storage:', err);
    return [];
  }
};

export const saveHighlights = (
  assignmentId: number,
  moduleId: number,
  highlights: HighlightItem[]
): void => {
  if (!assignmentId || !moduleId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      getHighlightsStorageKey(assignmentId, moduleId),
      JSON.stringify(highlights)
    );
  } catch (err) {
    console.warn('Failed to save highlights to storage:', err);
  }
};

export const clearHighlights = (assignmentId: number, moduleId: number): void => {
  if (!assignmentId || !moduleId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getHighlightsStorageKey(assignmentId, moduleId));
  } catch (err) {
    console.warn('Failed to clear highlights from storage:', err);
  }
};

/**
 * Normalizes and splits a paragraph into plain string and highlight segments
 */
export const splitParagraphIntoSegments = (
  paragraphText: string,
  paragraphIndex: number,
  highlights: HighlightItem[]
): Array<{ text: string; highlight?: HighlightItem }> => {
  const relevant = highlights
    .filter((h) => h.paragraphIndex === paragraphIndex && h.startOffset < h.endOffset)
    .sort((a, b) => a.startOffset - b.startOffset);

  if (relevant.length === 0) {
    return [{ text: paragraphText }];
  }

  const segments: Array<{ text: string; highlight?: HighlightItem }> = [];
  let currentIdx = 0;

  for (const h of relevant) {
    const start = Math.max(0, Math.min(h.startOffset, paragraphText.length));
    const end = Math.max(start, Math.min(h.endOffset, paragraphText.length));

    if (start > currentIdx) {
      segments.push({ text: paragraphText.substring(currentIdx, start) });
    }

    if (end > start) {
      segments.push({
        text: paragraphText.substring(start, end),
        highlight: h
      });
      currentIdx = end;
    }
  }

  if (currentIdx < paragraphText.length) {
    segments.push({ text: paragraphText.substring(currentIdx) });
  }

  return segments;
};

export const renderHighlightedParagraph = (
  paragraphText: string,
  paragraphIndex: number,
  highlights: HighlightItem[],
  onRemoveHighlight?: (id: string) => void
): React.ReactNode => {
  const segments = splitParagraphIntoSegments(paragraphText, paragraphIndex, highlights);

  return (
    <>
      {segments.map((seg, idx) => {
        if (!seg.highlight) {
          return <span key={idx}>{seg.text}</span>;
        }

        const h = seg.highlight;
        return (
          <mark
            key={h.id || idx}
            data-testid={`highlight-${h.id}`}
            data-highlight-id={h.id}
            data-color={h.color}
            className={`exam-highlight exam-highlight-${h.color}`}
            onClick={(e) => {
              if (onRemoveHighlight) {
                e.stopPropagation();
                onRemoveHighlight(h.id);
              }
            }}
            title="Click để xóa highlight này"
          >
            {seg.text}
          </mark>
        );
      })}
    </>
  );
};

/**
 * Extract MCQ options, correct option index, and content for reading review
 */
export function extractReadingMcqOptions(
  correctAnswer?: Record<string, unknown> | null,
  fallbackOptions?: Array<{ id: number; content: string }> | unknown
): {
  options: string[];
  correctOptionContent: string;
  correctOptionIndex: number;
} {
  const defaultResult = {
    options: [] as string[],
    correctOptionContent: '',
    correctOptionIndex: 0,
  };

  const rawList =
    (correctAnswer &&
      typeof correctAnswer === 'object' &&
      ((correctAnswer.options as unknown[]) ||
        ((correctAnswer as Record<string, unknown>).options as unknown[]))) ||
    fallbackOptions;

  if (!Array.isArray(rawList) || rawList.length === 0) {
    return defaultResult;
  }

  const options: string[] = [];
  let correctOptionContent = '';
  let correctOptionIndex = 0;

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i] as Record<string, unknown>;
    const text = String(item.content || item.text || `Option ${String.fromCharCode(65 + i)}`);
    options.push(text);
    const isCorrect = item.isCorrect === true || item.is_correct === true;
    if (isCorrect) {
      correctOptionContent = text;
      correctOptionIndex = i;
    }
  }

  if (!correctOptionContent && options.length > 0) {
    correctOptionContent = options[0];
    correctOptionIndex = 0;
  }

  return {
    options,
    correctOptionContent,
    correctOptionIndex,
  };
}

/**
 * Extract short answer text for reading review
 */
export function extractReadingShortAnswerText(correctAnswer?: Record<string, unknown> | null): string {
  if (!correctAnswer || typeof correctAnswer !== 'object') {
    return '';
  }
  const answer =
    correctAnswer.correctAnswer ||
    correctAnswer.correct_answer ||
    correctAnswer.text ||
    '';
  return String(answer).trim();
}

