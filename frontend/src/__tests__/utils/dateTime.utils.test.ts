import { describe, expect, it } from 'vitest';
import {
  addDays, createReopenDeadlineDraft, formatToLocalDateTimeInput, validateReopenDeadline,
} from '../../utils/dateTime.utils';

describe('dateTime.utils', () => {
  describe('formatToLocalDateTimeInput', () => {
    it('formats a date to YYYY-MM-DDTHH:mm using local time components', () => {
      // In Asia/Ho_Chi_Minh (+07:00), 2026-10-22T03:00:00.000Z corresponds to 10:00 local time
      const date = new Date('2026-10-22T03:00:00.000Z');
      const formatted = formatToLocalDateTimeInput(date);
      expect(formatted).toBe('2026-10-22T10:00');
    });

    it('pads single-digit month, day, hour, and minute with leading zero', () => {
      // Create a local date with month 5 (May), day 4, hour 8, minute 5
      const date = new Date(2026, 4, 4, 8, 5);
      expect(formatToLocalDateTimeInput(date)).toBe('2026-05-04T08:05');
    });

    it('accepts an ISO string as input', () => {
      expect(formatToLocalDateTimeInput('2026-10-22T03:00:00.000Z')).toBe('2026-10-22T10:00');
    });

    it('accepts a numeric timestamp as input', () => {
      const timestamp = new Date('2026-10-22T03:00:00.000Z').getTime();
      expect(formatToLocalDateTimeInput(timestamp)).toBe('2026-10-22T10:00');
    });

    it('uses current time when called with no arguments', () => {
      const now = new Date();
      const expectedYear = now.getFullYear().toString();
      expect(formatToLocalDateTimeInput()).toContain(expectedYear);
    });

    it('returns empty string when input is null or invalid date', () => {
      expect(formatToLocalDateTimeInput(null)).toBe('');
      expect(formatToLocalDateTimeInput('invalid-date')).toBe('');
      expect(formatToLocalDateTimeInput(NaN)).toBe('');
    });
  });

  describe('addDays', () => {
    it('adds specified number of days to a date', () => {
      const base = new Date('2026-10-22T03:00:00.000Z');
      const nextWeek = addDays(base, 7);
      expect(formatToLocalDateTimeInput(nextWeek)).toBe('2026-10-29T10:00');
    });

    it('correctly transitions across month boundaries', () => {
      const endOfOctober = new Date('2026-10-28T03:00:00.000Z');
      const inNovember = addDays(endOfOctober, 5);
      expect(formatToLocalDateTimeInput(inNovember)).toBe('2026-11-02T10:00');
    });

    it('does not mutate the original date object', () => {
      const base = new Date('2026-10-22T03:00:00.000Z');
      const originalTime = base.getTime();
      addDays(base, 7);
      expect(base.getTime()).toBe(originalTime);
    });
  });
});

describe('reopen deadline', () => {
  const now = Date.parse('2026-11-20T04:00:00Z');
  const stored = '2026-11-25T16:59:59+00:00';

  it('keeps an unchanged prefill and validates the original seconds and offset', () => {
    const draft = createReopenDeadlineDraft(stored, now);
    expect(draft).toEqual({
      originalCloseAt: stored, prefillValue: '2026-11-25T23:59', inputValue: '2026-11-25T23:59',
    });
    expect(validateReopenDeadline(draft, undefined, now)).toEqual({ valid: true });
    expect(validateReopenDeadline(draft, undefined, Date.parse('2026-11-25T16:59:20Z'))).toEqual({ valid: true });
    expect(validateReopenDeadline(draft, undefined, Date.parse(stored))).toEqual({ valid: false, error: 'future' });
    expect(validateReopenDeadline(draft, stored, now)).toEqual({ valid: false, error: 'afterOpen' });
  });

  it('serializes a changed local deadline to UTC with Z', () => {
    const draft = createReopenDeadlineDraft(stored, now);
    expect(validateReopenDeadline({ ...draft, inputValue: '2026-11-26T23:59' }, undefined, now))
      .toEqual({ valid: true, closeAt: '2026-11-26T16:59:00.000Z' });
  });

  it('leaves an expired deadline blank and accepts a new local time', () => {
    const draft = createReopenDeadlineDraft('2026-11-19T16:59:59+00:00', now);
    expect(draft).toMatchObject({ prefillValue: '', inputValue: '' });
    expect(validateReopenDeadline({ ...draft, inputValue: '2026-11-24T09:30' }, undefined, now))
      .toEqual({ valid: true, closeAt: '2026-11-24T02:30:00.000Z' });
  });

  it.each([null, 'not-a-date', '2026-11-20T04:00:00Z'])('requires a new value for stored deadline %s', originalCloseAt => {
    const draft = createReopenDeadlineDraft(originalCloseAt, now);
    expect(draft).toEqual({ originalCloseAt, prefillValue: '', inputValue: '' });
    expect(validateReopenDeadline(draft, undefined, now)).toEqual({ valid: false, error: 'required' });
  });

  it.each([
    { inputValue: '', openAt: undefined, error: 'required' },
    { inputValue: 'abc', openAt: undefined, error: 'invalid' },
    { inputValue: '2026-02-30T10:00', openAt: undefined, error: 'invalid' },
    { inputValue: '2026-11-20T10:59', openAt: undefined, error: 'future' },
    { inputValue: '2026-11-20T11:00', openAt: undefined, error: 'future' },
    { inputValue: '2026-11-24T09:30', openAt: '2026-11-24T02:31:00Z', error: 'afterOpen' },
    { inputValue: '2026-11-24T09:30', openAt: '2026-11-24T02:30:00Z', error: 'afterOpen' },
  ])('rejects "$inputValue" with opening time $openAt as $error', ({ inputValue, openAt, error }) => {
    const draft = createReopenDeadlineDraft(null, now);
    expect(validateReopenDeadline({ ...draft, inputValue }, openAt, now)).toEqual({ valid: false, error });
  });

  it.each(['not-a-date', null, undefined, '2026-11-24T02:29:59Z'])(
    'accepts a future deadline when opening time %s is unavailable or earlier',
    openAt => {
      const draft = createReopenDeadlineDraft(null, now);
      expect(validateReopenDeadline({ ...draft, inputValue: '2026-11-24T09:30' }, openAt, now))
        .toEqual({ valid: true, closeAt: '2026-11-24T02:30:00.000Z' });
    }
  );
});
