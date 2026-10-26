/**
 * Date and Time Utilities for EnglishHub Frontend.
 * Follows convention-fe.md standards.
 */

/**
 * Chuyển đổi Date, chuỗi ISO hoặc timestamp thành chuỗi 'YYYY-MM-DDTHH:mm'
 * biểu diễn theo giờ cục bộ (local time) của người dùng để gán cho HTML input type="datetime-local".
 *
 * Lưu ý: Tuyệt đối không dùng Date.prototype.toISOString().slice(0, 16) vì toISOString()
 * luôn xuất ra mốc thời gian theo giờ UTC (kết thúc bằng 'Z'), làm sai lệch giờ hiển thị
 * trên input datetime-local của trình duyệt.
 *
 * @param dateInput - Date | string | number | null | undefined
 * @returns Chuỗi định dạng 'YYYY-MM-DDTHH:mm' hoặc chuỗi rỗng '' nếu dateInput không hợp lệ
 */
export function formatToLocalDateTimeInput(dateInput?: Date | string | number | null): string {
  if (dateInput === null) return '';
  const date = dateInput === undefined ? new Date() : (dateInput instanceof Date ? dateInput : new Date(dateInput));
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number): string => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Cộng thêm số ngày vào một mốc thời gian.
 *
 * @param date - Date gốc
 * @param days - Số ngày cần cộng thêm
 * @returns Đối tượng Date mới đã được cộng thêm số ngày
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}
