export const MIN_WRITING_WORDS = 20;

export const countWritingWords = (text: string): number => {
  if (!text || !text.trim()) return 0;
  const stripped = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*_#~`]/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
};
