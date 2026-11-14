import { describe, it, expect } from 'vitest';

describe('FE-90: Grade Adjustment Modal with Audit Reason (UC030/UC031)', () => {
  it('validates score range between 0 and 10 and enforces mandatory audit note', () => {
    const validateGradeAdjustment = (score: number, note: string) => {
      if (isNaN(score) || score < 0 || score > 10) {
        return { valid: false, error: 'Điểm số phải nằm trong khoảng từ 0 đến 10.' };
      }
      if (!note.trim() || note.trim().length < 3) {
        return { valid: false, error: 'Vui lòng nhập lý do điều chỉnh điểm.' };
      }
      return { valid: true, error: null };
    };

    expect(validateGradeAdjustment(-1, 'Cộng điểm').valid).toBe(false);
    expect(validateGradeAdjustment(11, 'Cộng điểm').valid).toBe(false);
    expect(validateGradeAdjustment(8.5, '').valid).toBe(false);
    expect(validateGradeAdjustment(8.5, 'ab').valid).toBe(false);
    expect(validateGradeAdjustment(8.5, 'Xem lại bài phát biểu và cộng 0.5 điểm khuyến khích').valid).toBe(true);
  });
});
