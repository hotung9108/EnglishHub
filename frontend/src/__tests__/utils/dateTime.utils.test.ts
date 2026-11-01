import { describe, expect, it } from 'vitest';
import { addDays, formatToLocalDateTimeInput } from '../../utils/dateTime.utils';

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
