export type StudentAnnotationCategory =
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation'
  | 'fluency'
  | 'cohesion'
  | 'punctuation'
  | 'spelling'
  | 'positive';

export function normalizeAnnotationCategory(errorType?: string | null): StudentAnnotationCategory {
  const raw = (errorType ?? '').trim().toLowerCase();
  if (!raw) return 'grammar';
  if (raw.includes('pronun') || raw.includes('phonetic') || raw.includes('stress')) {
    return 'pronunciation';
  }
  if (raw.includes('fluenc')) {
    return 'fluency';
  }
  if (raw.includes('vocab') || raw.includes('lexic')) {
    return 'vocabulary';
  }
  if (raw.includes('cohes') || raw.includes('coher')) {
    return 'cohesion';
  }
  if (raw.includes('punct')) {
    return 'punctuation';
  }
  if (raw.includes('spell')) {
    return 'spelling';
  }
  if (raw.includes('posit') || raw.includes('praise')) {
    return 'positive';
  }
  return 'grammar';
}

export function formatAnnotationBadgeLabel(
  errorType?: string | null,
  fallbackCategory?: StudentAnnotationCategory
): string {
  const cleaned = (errorType ?? '').trim();
  if (cleaned.length > 0) {
    return cleaned.toUpperCase();
  }
  return (fallbackCategory ?? 'grammar').toUpperCase();
}
