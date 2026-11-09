import React, { useState } from 'react';
import { Calendar, Clock, Check, Edit2 } from 'lucide-react';

interface ScheduleBuilderProps {
  value: string;
  onChange: (scheduleString: string) => void;
  isVi?: boolean;
}

const DAYS_OF_WEEK = [
  { id: 'T2', label: 'T2', fullVi: 'Thứ 2', fullEn: 'Mon' },
  { id: 'T3', label: 'T3', fullVi: 'Thứ 3', fullEn: 'Tue' },
  { id: 'T4', label: 'T4', fullVi: 'Thứ 4', fullEn: 'Wed' },
  { id: 'T5', label: 'T5', fullVi: 'Thứ 5', fullEn: 'Thu' },
  { id: 'T6', label: 'T6', fullVi: 'Thứ 6', fullEn: 'Fri' },
  { id: 'T7', label: 'T7', fullVi: 'Thứ 7', fullEn: 'Sat' },
  { id: 'CN', label: 'CN', fullVi: 'Chủ Nhật', fullEn: 'Sun' },
];

const PRESETS = [
  { label: 'T2 - T4 - T6', days: ['T2', 'T4', 'T6'] },
  { label: 'T3 - T5 - T7', days: ['T3', 'T5', 'T7'] },
  { label: 'T7 - CN', days: ['T7', 'CN'] },
  { label: 'T2 đến T6', days: ['T2', 'T3', 'T4', 'T5', 'T6'] },
];

const TIME_PRESETS = [
  { label: 'Ca sáng (08:00 - 10:00)', startTime: '08:00', endTime: '10:00' },
  { label: 'Ca chiều (14:00 - 16:00)', startTime: '14:00', endTime: '16:00' },
  { label: 'Ca tối (18:00 - 20:00)', startTime: '18:00', endTime: '20:00' },
  { label: 'Ca tối muộn (19:30 - 21:00)', startTime: '19:30', endTime: '21:00' },
];

function parseInitialSchedule(initialValue: string) {
  if (!initialValue) {
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
    const daysPart = match[1];
    const timePart = match[2];
    const parsedDays = DAYS_OF_WEEK.map(d => d.id).filter(id => daysPart.includes(id));
    const times = timePart.split('-').map(t => t.trim());
    if (parsedDays.length > 0 && times.length === 2) {
      return {
        days: parsedDays,
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
  const initial = parseInitialSchedule(value);
  const [selectedDays, setSelectedDays] = useState<string[]>(initial.days);
  const [startTime, setStartTime] = useState(initial.start);
  const [endTime, setEndTime] = useState(initial.end);
  const [customMode, setCustomMode] = useState(initial.isCustom);
  const [customText, setCustomText] = useState(initial.customText);

  const handleToggleDay = (dayId: string) => {
    let next: string[];
    if (selectedDays.includes(dayId)) {
      next = selectedDays.filter(d => d !== dayId);
    } else {
      // Keep sorted by standard week order
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

  const handleApplyTimePreset = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    syncSchedule(selectedDays, start, end);
  };

  const syncSchedule = (days: string[], start: string, end: string) => {
    if (days.length === 0) {
      onChange(isVi ? 'Chưa chọn ngày học' : 'No days selected');
      return;
    }
    const daysStr = days.join(' - ');
    const timeStr = start && end ? ` (${start} - ${end})` : '';
    const formatted = `${daysStr}${timeStr}`;
    setCustomText(formatted);
    onChange(formatted);
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  return (
    <div className="flex flex-col gap-3 p-4 border border-outline-variant bg-surface rounded-xl">
      {/* Header bar with custom mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          <Calendar size={14} className="text-primary" />
          <span>{isVi ? 'Thiết lập thời khóa biểu tùy ý' : 'Custom Schedule Builder'}</span>
        </div>
        <button
          type="button"
          className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
          onClick={() => {
            setCustomMode(!customMode);
            if (!customMode) {
              handleCustomTextChange(customText);
            }
          }}
        >
          <Edit2 size={12} />
          <span>{customMode ? (isVi ? 'Dùng bộ chọn nhanh' : 'Use quick builder') : (isVi ? 'Nhập tự do' : 'Type custom text')}</span>
        </button>
      </div>

      {!customMode ? (
        <>
          {/* 1. Day of Week Checkboxes / Chips */}
          <div>
            <div className="text-xs font-medium text-on-surface mb-1.5">
              {isVi ? '1. Chọn các ngày trong tuần:' : '1. Select days of the week:'}
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleToggleDay(day.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface text-on-surface border-outline-variant hover:border-primary/50 hover:bg-surface-hover'
                    }`}
                  >
                    {isSelected && <Check size={13} className="stroke-[3]" />}
                    <span>{isVi ? day.fullVi : day.fullEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-on-surface-variant mr-1">
                {isVi ? 'Mẫu nhanh:' : 'Presets:'}
              </span>
              {PRESETS.map(preset => {
                const isActive = preset.days.length === selectedDays.length && preset.days.every(d => selectedDays.includes(d));
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset.days)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      isActive
                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                        : 'border-outline-variant text-on-surface-variant hover:border-on-surface-variant'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Time Range Selection */}
          <div className="pt-2 border-t border-outline-variant/60">
            <div className="text-xs font-medium text-on-surface mb-1.5">
              {isVi ? '2. Khung giờ học:' : '2. Class Hours:'}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-on-surface-variant" />
                <span className="text-xs text-on-surface-variant">{isVi ? 'Từ:' : 'From:'}</span>
                <input
                  type="time"
                  className="px-2.5 py-1 text-sm border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    syncSchedule(selectedDays, e.target.value, endTime);
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">{isVi ? 'Đến:' : 'To:'}</span>
                <input
                  type="time"
                  className="px-2.5 py-1 text-sm border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    syncSchedule(selectedDays, startTime, e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Quick Shift Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-on-surface-variant mr-1">
                {isVi ? 'Ca học mẫu:' : 'Shifts:'}
              </span>
              {TIME_PRESETS.map(tPreset => (
                <button
                  key={tPreset.label}
                  type="button"
                  onClick={() => handleApplyTimePreset(tPreset.startTime, tPreset.endTime)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    startTime === tPreset.startTime && endTime === tPreset.endTime
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'border-outline-variant text-on-surface-variant hover:border-on-surface-variant'
                  }`}
                >
                  {tPreset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formatted Preview Box */}
          <div className="p-2.5 rounded-lg bg-surface-low border border-outline-variant flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">{isVi ? 'Thời khóa biểu đã tạo:' : 'Schedule summary:'}</span>
            <span className="font-semibold text-primary font-mono text-sm">
              {selectedDays.length > 0 ? `${selectedDays.join(' - ')} (${startTime} - ${endTime})` : (isVi ? 'Chưa chọn ngày' : 'No days')}
            </span>
          </div>
        </>
      ) : (
        /* Custom Free-text Input */
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-on-surface-variant">
            {isVi ? 'Nhập nội dung thời khóa biểu tùy ý:' : 'Enter custom schedule string:'}
          </label>
          <input
            type="text"
            className="input w-full"
            placeholder={isVi ? 'Ví dụ: T2 - T4 (18:00 - 20:00), Thứ 7 thực hành lab' : 'e.g. Mon - Wed (18:00 - 20:00)'}
            value={customText}
            onChange={(e) => handleCustomTextChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
