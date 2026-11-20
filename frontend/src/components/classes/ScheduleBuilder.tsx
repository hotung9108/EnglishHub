import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, Clock, Check, Edit2, AlertCircle, ArrowRight } from 'lucide-react';

export interface ScheduleBuilderProps {
  value: string;
  onChange: (scheduleString: string) => void;
  isVi?: boolean;
}

interface DayItem {
  id: string;
  shortVi: string;
  shortEn: string;
  fullVi: string;
  fullEn: string;
  aliases: string[];
}

const DAYS_OF_WEEK: DayItem[] = [
  { id: 'T2', shortVi: 'T2', shortEn: 'Mon', fullVi: 'Thứ 2', fullEn: 'Monday', aliases: ['T2', 'THU 2', 'THỨ 2', 'MON', 'MONDAY'] },
  { id: 'T3', shortVi: 'T3', shortEn: 'Tue', fullVi: 'Thứ 3', fullEn: 'Tuesday', aliases: ['T3', 'THU 3', 'THỨ 3', 'TUE', 'TUESDAY'] },
  { id: 'T4', shortVi: 'T4', shortEn: 'Wed', fullVi: 'Thứ 4', fullEn: 'Wednesday', aliases: ['T4', 'THU 4', 'THỨ 4', 'WED', 'WEDNESDAY'] },
  { id: 'T5', shortVi: 'T5', shortEn: 'Thu', fullVi: 'Thứ 5', fullEn: 'Thursday', aliases: ['T5', 'THU 5', 'THỨ 5', 'THU', 'THURSDAY'] },
  { id: 'T6', shortVi: 'T6', shortEn: 'Fri', fullVi: 'Thứ 6', fullEn: 'Friday', aliases: ['T6', 'THU 6', 'THỨ 6', 'FRI', 'FRIDAY'] },
  { id: 'T7', shortVi: 'T7', shortEn: 'Sat', fullVi: 'Thứ 7', fullEn: 'Saturday', aliases: ['T7', 'THU 7', 'THỨ 7', 'SAT', 'SATURDAY'] },
  { id: 'CN', shortVi: 'CN', shortEn: 'Sun', fullVi: 'Chủ Nhật', fullEn: 'Sunday', aliases: ['CN', 'CHU NHAT', 'CHỦ NHẬT', 'SUN', 'SUNDAY'] },
];

interface DayPreset {
  id: string;
  labelVi: string;
  labelEn: string;
  days: string[];
}

const DAY_PRESETS: DayPreset[] = [
  { id: '246', labelVi: 'T2 - T4 - T6', labelEn: 'Mon - Wed - Fri', days: ['T2', 'T4', 'T6'] },
  { id: '357', labelVi: 'T3 - T5 - T7', labelEn: 'Tue - Thu - Sat', days: ['T3', 'T5', 'T7'] },
  { id: 'weekend', labelVi: 'T7 - CN (Cuối tuần)', labelEn: 'Sat - Sun (Weekend)', days: ['T7', 'CN'] },
  { id: 'all_week', labelVi: 'T2 đến T6', labelEn: 'Mon to Fri', days: ['T2', 'T3', 'T4', 'T5', 'T6'] },
];

interface ShiftPreset {
  id: string;
  titleVi: string;
  titleEn: string;
  startTime: string;
  endTime: string;
}

const SHIFT_PRESETS: ShiftPreset[] = [
  { id: 'morning', titleVi: 'Ca sáng', titleEn: 'Morning', startTime: '08:00', endTime: '10:00' },
  { id: 'afternoon', titleVi: 'Ca chiều', titleEn: 'Afternoon', startTime: '14:00', endTime: '16:00' },
  { id: 'evening', titleVi: 'Ca tối', titleEn: 'Evening', startTime: '18:00', endTime: '20:00' },
  { id: 'night', titleVi: 'Ca tối muộn', titleEn: 'Late Evening', startTime: '19:30', endTime: '21:00' },
];

function parseScheduleString(initialValue: string) {
  if (!initialValue || !initialValue.trim()) {
    return {
      days: ['T2', 'T4', 'T6'],
      start: '18:00',
      end: '20:00',
      customText: 'T2 - T4 - T6 (18:00 - 20:00)',
      isCustom: false,
    };
  }

  const match = initialValue.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    const daysPart = match[1].toUpperCase();
    const timePart = match[2];

    const matchedDays = DAYS_OF_WEEK.filter(day => {
      return day.aliases.some(alias => daysPart.includes(alias.toUpperCase()));
    }).map(d => d.id);

    const times = timePart.split('-').map(t => t.trim());
    if (matchedDays.length > 0 && times.length === 2 && times[0] && times[1]) {
      return {
        days: matchedDays,
        start: times[0],
        end: times[1],
        customText: initialValue,
        isCustom: false,
      };
    }
  }

  return {
    days: ['T2', 'T4', 'T6'],
    start: '18:00',
    end: '20:00',
    customText: initialValue,
    isCustom: true,
  };
}

export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({
  value,
  onChange,
  isVi = true,
}) => {
  const initial = useMemo(() => parseScheduleString(value), [value]);

  const [prevValue, setPrevValue] = useState<string>(value);
  const [selectedDays, setSelectedDays] = useState<string[]>(initial.days);
  const [startTime, setStartTime] = useState<string>(initial.start);
  const [endTime, setEndTime] = useState<string>(initial.end);
  const [customMode, setCustomMode] = useState<boolean>(initial.isCustom);
  const [customText, setCustomText] = useState<string>(initial.customText);

  // Sync internal state when external value changes (React 19 pattern: adjust state during rendering)
  if (value !== prevValue) {
    setPrevValue(value);
    const parsed = parseScheduleString(value);
    setSelectedDays(parsed.days);
    setStartTime(parsed.start);
    setEndTime(parsed.end);
    setCustomText(parsed.customText);
    setCustomMode(parsed.isCustom);
  }

  const syncSchedule = useCallback((days: string[], start: string, end: string) => {
    if (days.length === 0) {
      const fallback = isVi ? 'Chưa chọn ngày học' : 'No days selected';
      setCustomText(fallback);
      onChange(fallback);
      return;
    }
    const daysStr = days.join(' - ');
    const timeStr = start && end ? ` (${start} - ${end})` : '';
    const formatted = `${daysStr}${timeStr}`;
    setCustomText(formatted);
    onChange(formatted);
  }, [isVi, onChange]);

  const handleToggleDay = (dayId: string) => {
    let next: string[];
    if (selectedDays.includes(dayId)) {
      next = selectedDays.filter(d => d !== dayId);
    } else {
      const order = DAYS_OF_WEEK.map(d => d.id);
      next = [...selectedDays, dayId].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    setSelectedDays(next);
    syncSchedule(next, startTime, endTime);
  };

  const handleApplyPreset = (days: string[]) => {
    setSelectedDays(days);
    syncSchedule(days, startTime, endTime);
  };

  const handleApplyShiftPreset = (shift: ShiftPreset) => {
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    syncSchedule(selectedDays, shift.startTime, shift.endTime);
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  const handleToggleMode = () => {
    const nextMode = !customMode;
    setCustomMode(nextMode);
    if (nextMode) {
      handleCustomTextChange(customText);
    } else {
      // Re-parse custom text if valid, otherwise sync current days & times
      const parsed = parseScheduleString(customText);
      setSelectedDays(parsed.days);
      setStartTime(parsed.start);
      setEndTime(parsed.end);
      syncSchedule(parsed.days, parsed.start, parsed.end);
    }
  };

  // Warning when endTime is not after startTime
  const isTimeOrderWarning = useMemo(() => {
    if (!startTime || !endTime) return false;
    return startTime >= endTime;
  }, [startTime, endTime]);

  // Formatted string to preview
  const displaySummary = useMemo(() => {
    if (customMode) {
      return customText || (isVi ? 'Chưa nhập lịch' : 'No schedule entered');
    }
    if (selectedDays.length === 0) {
      return isVi ? 'Chưa chọn ngày học' : 'No days selected';
    }
    const daysPart = selectedDays.join(' - ');
    const timePart = startTime && endTime ? ` (${startTime} - ${endTime})` : '';
    return `${daysPart}${timePart}`;
  }, [customMode, customText, selectedDays, startTime, endTime, isVi]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl shadow-sm transition-all">
      {/* 1. Header Bar with Mode Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shadow-xs">
            <Calendar size={15} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {isVi ? 'Thiết lập thời khóa biểu lớp học' : 'Class Schedule Configuration'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isVi ? 'Chọn ngày trong tuần và khung ca học cố định' : 'Set recurring class days and shift hours'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleMode}
          className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
        >
          <Edit2 size={13} />
          <span>
            {customMode
              ? (isVi ? 'Dùng bộ chọn nhanh' : 'Use Quick Builder')
              : (isVi ? 'Nhập tự do' : 'Free Text Mode')}
          </span>
        </button>
      </div>

      {!customMode ? (
        <>
          {/* 2. Days of the Week Selection (7-Column Grid) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span>{isVi ? '1. Các ngày học trong tuần:' : '1. Weekly Class Days:'}</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>
              {selectedDays.length > 0 && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {isVi ? `Đã chọn ${selectedDays.length} buổi/tuần` : `Selected ${selectedDays.length} sessions/wk`}
                </span>
              )}
            </div>

            {/* 7-column Responsive Day Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleToggleDay(day.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer min-h-[58px] ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-700'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold tracking-tight">
                        {isVi ? day.shortVi : day.shortEn}
                      </span>
                      {isSelected && <Check size={13} className="stroke-[3]" />}
                    </div>
                    <span className={`text-[11px] leading-tight mt-0.5 ${
                      isSelected ? 'text-emerald-100 font-medium' : 'text-slate-500 dark:text-slate-400 font-normal'
                    }`}>
                      {isVi ? day.fullVi : day.fullEn}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Day Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1 pt-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mr-1">
                {isVi ? 'Gợi ý lịch mẫu:' : 'Day presets:'}
              </span>
              {DAY_PRESETS.map(preset => {
                const isActive = preset.days.length === selectedDays.length &&
                  preset.days.every(d => selectedDays.includes(d));
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.days)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      isActive
                        ? 'border-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-400 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {isVi ? preset.labelVi : preset.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Time Range & Shift Presets */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>{isVi ? '2. Khung giờ học và ca mẫu:' : '2. Class Hours & Shift Presets:'}</span>
              <span className="text-rose-600 font-bold">*</span>
            </label>

            {/* Time Inputs Group */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isVi ? 'Giờ bắt đầu:' : 'Start:'}
                </span>
                <input
                  type="time"
                  className="px-3 py-1.5 text-sm font-mono font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-xs"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    syncSchedule(selectedDays, e.target.value, endTime);
                  }}
                />
              </div>

              <div className="hidden sm:flex items-center text-slate-400">
                <ArrowRight size={15} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isVi ? 'Giờ kết thúc:' : 'End:'}
                </span>
                <input
                  type="time"
                  className="px-3 py-1.5 text-sm font-mono font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-xs"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    syncSchedule(selectedDays, startTime, e.target.value);
                  }}
                />
              </div>

              {isTimeOrderWarning && (
                <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded-lg">
                  <AlertCircle size={14} className="flex-shrink-0 text-amber-600" />
                  <span>{isVi ? 'Giờ kết thúc nên sau giờ bắt đầu' : 'End time should be after start time'}</span>
                </div>
              )}
            </div>

            {/* Shift Presets Grid (2x2 on mobile, 4-column on desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              {SHIFT_PRESETS.map(shift => {
                const isShiftActive = startTime === shift.startTime && endTime === shift.endTime;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => handleApplyShiftPreset(shift)}
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isShiftActive
                        ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-700/40 shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-600 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        isShiftActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {isVi ? shift.titleVi : shift.titleEn}
                      </span>
                      {isShiftActive && <Check size={13} className="text-emerald-700 dark:text-emerald-400 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-mono font-semibold mt-0.5 ${
                      isShiftActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Formatted Summary Preview Box */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <Check size={14} className="stroke-[3]" />
              </div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {isVi ? 'Thời khóa biểu đã cấu hình:' : 'Configured Schedule Summary:'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-400 dark:border-emerald-700 font-mono font-bold text-emerald-950 dark:text-emerald-100 text-sm shadow-xs break-all">
                {displaySummary}
              </span>
            </div>
          </div>
        </>
      ) : (
        /* 5. Custom Free-text Mode */
        <div className="flex flex-col gap-2 pt-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>{isVi ? 'Nhập nội dung thời khóa biểu tùy ý:' : 'Enter custom schedule string:'}</span>
            <span className="text-[11px] font-normal text-slate-500">
              {isVi ? 'Ví dụ: T2 - T4 (18:00 - 20:00), Thứ 7 thực hành lab' : 'e.g. Mon - Wed (18:00 - 20:00)'}
            </span>
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 shadow-xs"
            placeholder={isVi ? 'Nhập thời khóa biểu tự do...' : 'Enter custom schedule...'}
            value={customText}
            onChange={(e) => handleCustomTextChange(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 italic">
            {isVi
              ? 'Lưu ý: Chuỗi này sẽ được lưu trực tiếp vào mô tả lớp học và hiển thị cho học viên.'
              : 'Note: This string will be saved directly into class description and displayed to students.'}
          </p>
        </div>
      )}
    </div>
  );
};
