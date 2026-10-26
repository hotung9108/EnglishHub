import type { SubmittedAnswerItem } from '../api/services/submission.service';

/**
 * Safely extract text content from a submitted answer or list of submitted answers.
 * Prioritizes the target answer if targetAnswerId is supplied, otherwise uses the first answer.
 * Correctly parses plain string, object fields (text, essay, answer, content), and trims.
 */
export function extractAnswerContentText(
  answers: SubmittedAnswerItem[] | undefined,
  targetAnswerId?: number | null
): string {
  if (!answers || answers.length === 0) return '';
  const target = (targetAnswerId ? answers.find((a) => a.id === targetAnswerId) : null) || answers[0];
  if (!target || target.content === null || target.content === undefined) return '';
  if (typeof target.content === 'string') return target.content.trim();
  if (typeof target.content === 'object') {
    const obj = target.content as Record<string, unknown>;
    const textVal = obj.text ?? obj.essay ?? obj.answer ?? obj.content;
    if (typeof textVal === 'string') return textVal.trim();
    return '';
  }
  return String(target.content ?? '').trim();
}

/**
 * Safely extracts spoken transcript text from diverse AI transcript shapes.
 * Handles:
 * 1. Serialized JSON strings from Spring Boot / Postgres (e.g. '{"modelUsed":"...","transcript":[{"word":"My"}]}')
 * 2. Nested objects containing a `transcript` or `words` field
 * 3. Array of WordTimestamp objects ({ word: string, ... })
 * 4. Plain array of word strings (["Hello", "world"])
 * 5. Plain plain-text spoken transcripts ("My family is have four peoples.")
 * Crucially: NEVER returns raw JSON strings as transcript text!
 */
export function extractTranscriptText(rawTranscript: unknown): string {
  if (!rawTranscript) return '';

  let current: unknown = rawTranscript;

  // 1. If it's a string, attempt JSON parsing if it looks like a JSON object or array
  if (typeof current === 'string') {
    const trimmed = current.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        current = JSON.parse(trimmed);
      } catch {
        // Fall back to treating as plain string if it's not valid JSON
        return trimmed;
      }
    } else {
      return trimmed;
    }
  }

  // 2. If it's an object with a `transcript` or `words` property, unwrap it
  if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
    const record = current as Record<string, unknown>;
    if ('transcript' in record && record.transcript !== undefined && record.transcript !== null) {
      current = record.transcript;
    } else if ('words' in record && record.words !== undefined && record.words !== null) {
      current = record.words;
    }
  }

  // If after unwrapping it's another serialized string, parse it again
  if (typeof current === 'string') {
    const trimmed = current.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        current = JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    } else {
      return trimmed;
    }
  }

  // 3. If it's an array of words
  if (Array.isArray(current)) {
    const parts: string[] = [];
    for (const item of current) {
      if (!item) continue;
      if (typeof item === 'object' && 'word' in (item as Record<string, unknown>)) {
        const w = (item as Record<string, unknown>).word;
        if (w !== null && w !== undefined) {
          parts.push(String(w).trim());
        }
      } else if (typeof item === 'string') {
        parts.push(item.trim());
      }
    }
    return parts.join(' ').trim();
  }

  return '';
}

/**
 * Safely extracts a text snippet based on character startOffset and endOffset.
 * Guarantees zero runtime crashes on out-of-bounds, negative, invalid, or inverted offsets.
 * When offsets cannot produce a valid non-empty slice, returns fallbackLabel instead of technical string.
 */
export function extractAnnotationSnippet(
  baseText: string | null | undefined,
  startOffset?: number | null,
  endOffset?: number | null,
  fallbackLabel: string = ''
): string {
  if (
    !baseText ||
    typeof baseText !== 'string' ||
    startOffset === undefined ||
    startOffset === null ||
    endOffset === undefined ||
    endOffset === null ||
    !Number.isFinite(startOffset) ||
    !Number.isFinite(endOffset)
  ) {
    return fallbackLabel;
  }

  const cleanStart = Math.max(0, Math.floor(startOffset));
  const cleanEnd = Math.floor(endOffset);

  if (cleanEnd <= cleanStart || cleanStart >= baseText.length) {
    return fallbackLabel;
  }

  const snippet = baseText.slice(cleanStart, Math.min(cleanEnd, baseText.length)).trim();
  return snippet.length > 0 ? snippet : fallbackLabel;
}
