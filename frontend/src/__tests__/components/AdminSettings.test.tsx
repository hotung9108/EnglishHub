import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import AdminSettings from '../../pages/AdminSettings';
import {
  ADMIN_SETTINGS_STORAGE_KEY, DEFAULT_ADMIN_SETTINGS,
  normalizeAdminSettings, readAdminSettings, resetAdminSettings, saveAdminSettings,
} from '../../utils/adminSettings.utils';
import { renderPage } from './renderPage';

const changedSettings = {
  ...DEFAULT_ADMIN_SETTINGS,
  aiModelWriting: 'gpt-4o',
  aiModelSpeaking: 'gemini-1.5-pro-audio',
  temperature: 0.4,
  autoApproveQuiz: false,
  requireTeacherReview: false,
  plagiarismThreshold: 45,
  slaHours: 48,
  emailStudentOnGraded: false,
  emailParentDigest: false,
  jwtLifetimeMinutes: 30,
  maxConcurrentDevices: 5,
};

const labels = {
  vi: {
    ai: 'Cấu hình AI Engine', grading: 'Quy tắc & Ngưỡng duyệt điểm',
    notifications: 'Thông báo & Email', security: 'Bảo mật & Phiên đăng nhập',
    save: 'Lưu thay đổi cài đặt', reset: 'Khôi phục mặc định',
    saved: 'Đã lưu cấu hình trên trình duyệt này',
    restored: 'Đã khôi phục cấu hình mặc định trên trình duyệt này',
  },
  en: {
    ai: 'AI Engine Config', grading: 'Grading Rules & Thresholds',
    notifications: 'Notifications & Email', security: 'Security & Sessions',
    save: 'Save Configuration', reset: 'Reset to Defaults',
    saved: 'Configuration saved in this browser',
    restored: 'Default configuration restored in this browser',
  },
};

beforeEach(() => {
  localStorage.clear();
});

function renderSettings(language: 'vi' | 'en' = 'vi') {
  return renderPage(<AdminSettings />, '/admin/settings', '/admin/settings', undefined, language);
}

describe('admin settings utilities', () => {
  it('reads empty storage without writing or warning', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    expect(readAdminSettings()).toEqual({ settings: DEFAULT_ADMIN_SETTINGS, status: 'empty' });
    expect(write).not.toHaveBeenCalled();
  });

  it.each(['{broken', 'null', '[]', '"text"', '42', '{}'])('rejects stored JSON shape %s', raw => {
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, raw);
    expect(readAdminSettings()).toEqual({ settings: DEFAULT_ADMIN_SETTINGS, status: 'invalid' });
    expect(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)).toBe(raw);
  });

  it.each([
    { temperature: '0.4', autoApproveQuiz: 'false', requireTeacherReview: 0, emailStudentOnGraded: 1, emailParentDigest: null },
    { temperature: -1, plagiarismThreshold: 61, aiModelSpeaking: 'unknown', slaHours: 13, jwtLifetimeMinutes: 20, maxConcurrentDevices: 3 },
    { temperature: Infinity, plagiarismThreshold: NaN, aiModelSpeaking: 7, slaHours: '48', jwtLifetimeMinutes: null, maxConcurrentDevices: false },
    { temperature: 2, plagiarismThreshold: 9 },
  ])('defaults only invalid fields and preserves other valid fields: %j', invalidFields => {
    const normalized = normalizeAdminSettings({ ...DEFAULT_ADMIN_SETTINGS, aiModelWriting: 'gpt-4o', ...invalidFields });
    expect(normalized.invalid).toBe(true);
    expect(normalized.settings).toEqual({ ...DEFAULT_ADMIN_SETTINGS, aiModelWriting: 'gpt-4o' });
  });

  it('rejects an invalid writing model and keeps valid fields including false booleans', () => {
    const normalized = normalizeAdminSettings({ ...changedSettings, aiModelWriting: 'unknown' });
    expect(normalized.invalid).toBe(true);
    expect(normalized.settings).toEqual({ ...changedSettings, aiModelWriting: DEFAULT_ADMIN_SETTINGS.aiModelWriting });
  });

  it.each([{ temperature: 0, plagiarismThreshold: 10 }, { temperature: 1, plagiarismThreshold: 60 }])(
    'accepts numeric range boundaries: %j', bounds => {
      const settings = { ...changedSettings, ...bounds };
      expect(normalizeAdminSettings(settings)).toEqual({ settings, invalid: false });
    },
  );

  it('saves only supported normalized fields and resets only its own key', () => {
    localStorage.setItem('sentinel-session', 'unchanged');
    const legacy = { ...changedSettings, apiKey: 'legacy-test-marker', temperature: -1 };
    expect(saveAdminSettings(legacy)).toBe(true);
    expect(JSON.parse(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)!)).toEqual({
      ...changedSettings, temperature: DEFAULT_ADMIN_SETTINGS.temperature,
    });
    expect(resetAdminSettings()).toBe(true);
    expect(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('sentinel-session')).toBe('unchanged');
  });

  it.each(['getItem', 'setItem', 'removeItem'] as const)('handles blocked storage operation %s', operation => {
    vi.spyOn(Storage.prototype, operation).mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    if (operation === 'getItem') {
      expect(readAdminSettings()).toEqual({ settings: DEFAULT_ADMIN_SETTINGS, status: 'unavailable' });
    } else if (operation === 'setItem') {
      expect(saveAdminSettings(changedSettings)).toBe(false);
    } else {
      expect(resetAdminSettings()).toBe(false);
    }
  });
});

describe('AdminSettings form', () => {
  it.each(['vi', 'en'] as const)('shows FE-23 tabs, labels and browser-local save/reset feedback (%s)', async language => {
    const text = labels[language];
    renderSettings(language);
    expect(screen.getByText(language === 'vi' ? 'Mô hình chấm Writing Task 1 & 2' : 'Writing Evaluation Model')).toBeVisible();
    expect(screen.getByText(language === 'vi' ? 'Mô hình nhận diện Speaking & Ghi âm' : 'Speaking Transcription Engine')).toBeVisible();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    for (const tab of [text.grading, text.notifications, text.security, text.ai]) {
      await userEvent.click(screen.getByRole('button', { name: tab }));
      expect(screen.getByRole('button', { name: tab })).toHaveClass('active');
    }
    await userEvent.click(screen.getByRole('button', { name: text.grading }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: text.save }));
    expect(screen.getByText(text.saved)).toBeVisible();
    expect(screen.queryByText(/hiệu lực trên toàn bộ server|propagated system-wide/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: text.reset }));
    expect(screen.getByText(text.restored)).toBeVisible();
    expect(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it('persists all supported fields across remount and restores defaults across remount', async () => {
    localStorage.setItem('sentinel-session', 'unchanged');
    const first = renderSettings();
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], changedSettings.aiModelWriting);
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], changedSettings.aiModelSpeaking);
    fireEvent.change(screen.getByRole('slider'), { target: { value: String(changedSettings.temperature) } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unsaved prompt edit' } });
    await userEvent.click(screen.getByRole('button', { name: labels.vi.grading }));
    for (const checkbox of screen.getAllByRole('checkbox')) await userEvent.click(checkbox);
    fireEvent.change(screen.getByRole('slider'), { target: { value: String(changedSettings.plagiarismThreshold) } });
    await userEvent.selectOptions(screen.getByRole('combobox'), String(changedSettings.slaHours));
    await userEvent.click(screen.getByRole('button', { name: labels.vi.notifications }));
    for (const checkbox of screen.getAllByRole('checkbox')) await userEvent.click(checkbox);
    await userEvent.click(screen.getByRole('button', { name: labels.vi.security }));
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], String(changedSettings.jwtLifetimeMinutes));
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], String(changedSettings.maxConcurrentDevices));
    await userEvent.click(screen.getByRole('button', { name: labels.vi.save }));
    expect(JSON.parse(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)!)).toEqual(changedSettings);
    expect(localStorage.getItem('sentinel-session')).toBe('unchanged');
    first.unmount();

    const second = renderSettings();
    expect(screen.getAllByRole('combobox')[0]).toHaveValue(changedSettings.aiModelWriting);
    expect(screen.getAllByRole('combobox')[1]).toHaveValue(changedSettings.aiModelSpeaking);
    expect(screen.getByRole('slider')).toHaveValue(String(changedSettings.temperature));
    expect(screen.getByRole('textbox')).not.toHaveValue('Unsaved prompt edit');
    await userEvent.click(screen.getByRole('button', { name: labels.vi.grading }));
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeChecked();
    expect(screen.getByRole('slider')).toHaveValue(String(changedSettings.plagiarismThreshold));
    expect(screen.getByRole('combobox')).toHaveValue(String(changedSettings.slaHours));
    await userEvent.click(screen.getByRole('button', { name: labels.vi.notifications }));
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: labels.vi.security }));
    expect(screen.getAllByRole('combobox')[0]).toHaveValue(String(changedSettings.jwtLifetimeMinutes));
    expect(screen.getAllByRole('combobox')[1]).toHaveValue(String(changedSettings.maxConcurrentDevices));
    await userEvent.click(screen.getByRole('button', { name: labels.vi.reset }));
    expect(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('sentinel-session')).toBe('unchanged');
    second.unmount();

    renderSettings();
    expect(screen.getAllByRole('combobox')[0]).toHaveValue(DEFAULT_ADMIN_SETTINGS.aiModelWriting);
    expect(screen.getAllByRole('combobox')[1]).toHaveValue(DEFAULT_ADMIN_SETTINGS.aiModelSpeaking);
    expect(readAdminSettings().settings).toEqual(DEFAULT_ADMIN_SETTINGS);
  });

  it.each(['{broken', 'null', '[]', '"text"', '42', '{}'])('opens invalid saved shape %s with defaults and a warning', raw => {
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, raw);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    renderSettings();
    expect(screen.getByRole('alert')).toHaveTextContent('Cấu hình đã lưu không hợp lệ');
    expect(screen.getAllByRole('combobox')[0]).toHaveValue(DEFAULT_ADMIN_SETTINGS.aiModelWriting);
    expect(write).not.toHaveBeenCalled();
  });

  it('keeps valid fields and warns about invalid fields in the form', () => {
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify({ ...changedSettings, temperature: -1 }));
    renderSettings();
    expect(screen.getAllByRole('combobox')[0]).toHaveValue(changedSettings.aiModelWriting);
    expect(screen.getByRole('slider')).toHaveValue(String(DEFAULT_ADMIN_SETTINGS.temperature));
    expect(screen.getByRole('alert')).toBeVisible();
  });

  it('never displays a legacy secret or writes on mount, including StrictMode and another account remount', async () => {
    const legacy = JSON.stringify({ ...changedSettings, apiKey: 'legacy-test-marker' });
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, legacy);
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const first = renderPage(<StrictMode><AdminSettings key="admin-1" /></StrictMode>, '/admin/settings');
    expect(document.body.innerHTML).not.toContain('legacy-test-marker');
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(screen.queryByText(/API Key|Khóa API/i)).not.toBeInTheDocument();
    expect(write).not.toHaveBeenCalled();
    first.unmount();

    renderPage(<AdminSettings key="admin-2" />, '/admin/settings');
    expect(document.body.innerHTML).not.toContain('legacy-test-marker');
    expect(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)).toBe(legacy);
    expect(write).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: labels.vi.save }));
    expect(JSON.parse(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)!)).toEqual(changedSettings);
    expect(write).toHaveBeenCalledExactlyOnceWith(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(changedSettings));
  });

  it('opens defaults with a warning when reading storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    renderSettings();
    expect(screen.getByRole('alert')).toHaveTextContent('Không đọc được cấu hình đã lưu');
    expect(screen.getAllByRole('combobox')[0]).toHaveValue(DEFAULT_ADMIN_SETTINGS.aiModelWriting);
  });

  it.each(['SecurityError', 'QuotaExceededError'])('keeps edited form values and does not report save success for %s', async errorName => {
    renderSettings();
    await userEvent.click(screen.getByRole('button', { name: labels.vi.save }));
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], changedSettings.aiModelWriting);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Unavailable', errorName); });
    await userEvent.click(screen.getByRole('button', { name: labels.vi.save }));
    expect(screen.getByRole('alert')).toHaveTextContent('Chưa lưu được cấu hình');
    expect(screen.queryByText(labels.vi.saved)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.vi.restored)).not.toBeInTheDocument();
    expect(screen.getAllByRole('combobox')[0]).toHaveValue(changedSettings.aiModelWriting);
    expect(JSON.parse(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)!)).toEqual(DEFAULT_ADMIN_SETTINGS);
  });

  it('reports incomplete reset and retains the form and saved configuration when removal fails', async () => {
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(changedSettings));
    renderSettings();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    await userEvent.click(screen.getByRole('button', { name: labels.vi.reset }));
    expect(screen.getByRole('alert')).toHaveTextContent('Chưa hoàn tất khôi phục');
    expect(screen.queryByText(labels.vi.saved)).not.toBeInTheDocument();
    expect(screen.queryByText(labels.vi.restored)).not.toBeInTheDocument();
    expect(screen.getAllByRole('combobox')[0]).toHaveValue(changedSettings.aiModelWriting);
    expect(JSON.parse(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)!)).toEqual(changedSettings);
  });

  it('keeps storage and feedback consistent across consecutive saves and resets', async () => {
    renderSettings();
    for (const action of ['save', 'reset', 'save', 'reset'] as const) {
      await userEvent.click(screen.getByRole('button', { name: labels.vi[action] }));
      expect(screen.getByText(action === 'save' ? labels.vi.saved : labels.vi.restored)).toBeVisible();
      expect(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)).toBe(action === 'save' ? JSON.stringify(DEFAULT_ADMIN_SETTINGS) : null);
    }
  });

  it('cancels the feedback timer on unmount without console warnings', () => {
    vi.useFakeTimers();
    const error = vi.spyOn(console, 'error');
    const warning = vi.spyOn(console, 'warn');
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    const cancel = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderSettings();
    fireEvent.click(screen.getByRole('button', { name: labels.vi.save }));
    const feedbackTimerIndex = schedule.mock.calls.findIndex(call => call[1] === 2500);
    expect(feedbackTimerIndex).toBeGreaterThanOrEqual(0);
    const feedbackTimer = schedule.mock.results[feedbackTimerIndex].value;
    unmount();
    expect(cancel).toHaveBeenCalledWith(feedbackTimer);
    act(() => { vi.runAllTimers(); });
    expect(error).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
  });
});
