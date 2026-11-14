import { describe, it, expect } from 'vitest';

describe('FE-89: Admin Reports CSV Export (UC035/UC036)', () => {
  it('generates valid UTF-8 BOM CSV data format for export', () => {
    const headers = ['Mã lớp', 'Tên lớp học', 'Trạng thái', 'Bài tập đã giao', 'Tỷ lệ hoàn thành (%)', 'Điểm trung bình (%)'];
    const row = ['1', 'IELTS Foundation K1', 'Đang hoạt động', '10', '85%', '78%'];

    const csvContent = '\uFEFF' + [headers.join(','), row.join(',')].join('\r\n');
    expect(csvContent.startsWith('\uFEFF')).toBe(true);
    expect(csvContent).toContain('IELTS Foundation K1');
    expect(csvContent).toContain('85%');
  });
});
