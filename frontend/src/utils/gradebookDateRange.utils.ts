export interface GradebookDateRange {
  from: string;
  to: string;
}

const vietnamDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timestampWithOffset = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/;

const dateValue = (date: string) => Number(date.replaceAll('-', ''));

export function getGradebookDateRangeStatus({ from, to }: GradebookDateRange) {
  if (from && to && dateValue(from) > dateValue(to)) return 'reversed';
  return from || to ? 'active' : 'all';
}

function getVietnamSubmissionDate(submittedAt: string | null) {
  if (!submittedAt || !timestampWithOffset.test(submittedAt)) return null;

  // Date.parse accepts some invalid calendar dates by rolling them into the next month.
  const sourceDate = submittedAt.slice(0, 10);
  const midnight = new Date(`${sourceDate}T00:00:00Z`);
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== sourceDate) return null;

  const timestamp = Date.parse(submittedAt);
  if (!Number.isFinite(timestamp)) return null;

  const { year, month, day } = Object.fromEntries(
    vietnamDateFormatter.formatToParts(timestamp).map(({ type, value }) => [type, value]),
  );
  return dateValue(`${year}-${month}-${day}`);
}

export function filterGradebookSubmissions<T extends { submittedAt: string | null }>(
  submissions: T[],
  range: GradebookDateRange,
): T[] {
  if (getGradebookDateRangeStatus(range) !== 'active') return submissions;

  const from = range.from ? dateValue(range.from) : -Infinity;
  const to = range.to ? dateValue(range.to) : Infinity;
  return submissions.filter(({ submittedAt }) => {
    const date = getVietnamSubmissionDate(submittedAt);
    return date !== null && date >= from && date <= to;
  });
}
