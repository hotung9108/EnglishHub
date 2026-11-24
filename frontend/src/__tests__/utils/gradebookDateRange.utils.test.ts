import { describe, expect, it } from 'vitest';
import { filterGradebookSubmissions, getGradebookDateRangeStatus } from '../../utils/gradebookDateRange.utils';

const submissions = [
  { id: 1, submittedAt: '2026-11-09T16:59:59.999Z' },
  { id: 2, submittedAt: '2026-11-09T17:00:00Z' },
  { id: 3, submittedAt: '2026-11-11T01:59:59.999999999+09:00' },
  { id: 4, submittedAt: '2026-11-11T00:00+0700' },
];

describe('Sổ điểm · lọc ngày giờ Việt Nam', () => {
  it.each([
    ['chỉ ngày bắt đầu', { from: '2026-11-10', to: '' }, [2, 3, 4]],
    ['chỉ ngày kết thúc', { from: '', to: '2026-11-10' }, [1, 2, 3]],
    ['hai đầu cùng ngày', { from: '2026-11-10', to: '2026-11-10' }, [2, 3]],
    ['khoảng không có lượt nộp', { from: '2026-11-12', to: '2026-11-13' }, []],
  ] as const)('lọc %s, tính cả ngày biên tại Việt Nam', (_label, range, ids) => {
    expect(getGradebookDateRangeStatus(range)).toBe('active');
    expect(filterGradebookSubmissions(submissions, range).map(row => row.id)).toEqual(ids);
  });

  it.each([
    [null],
    [''],
    ['not-a-date'],
    ['2026-11-10T12:00:00'],
    ['2026-11-10'],
    ['2026-02-30T00:00:00Z'],
    ['2026-13-10T00:00:00Z'],
    ['2026-11-10T24:01:00Z'],
    ['2026-11-10T12:00:00+32:00'],
  ])('loại timestamp %s khi lọc, giữ trong chế độ toàn thời gian', submittedAt => {
    const data = [{ submittedAt }];
    expect(filterGradebookSubmissions(data, { from: '', to: '2026-11-30' })).toEqual([]);
    expect(filterGradebookSubmissions(data, { from: '', to: '' })).toBe(data);
  });

  it('dùng tập toàn thời gian cho khoảng trống hoặc đảo ngược', () => {
    const allTime = { from: '', to: '' };
    const reversed = { from: '2026-11-11', to: '2026-11-10' };
    expect(getGradebookDateRangeStatus(allTime)).toBe('all');
    expect(getGradebookDateRangeStatus(reversed)).toBe('reversed');
    expect(filterGradebookSubmissions(submissions, reversed)).toBe(submissions);
  });
});
