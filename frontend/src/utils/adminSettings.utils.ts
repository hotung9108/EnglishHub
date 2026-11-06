export const ADMIN_SETTINGS_STORAGE_KEY = 'englishhub_admin_system_settings';

export const ADMIN_SETTINGS_OPTIONS = {
  writingModels: [
    { value: 'gemini-1.5-pro', label: 'Google Gemini 1.5 Pro (Khuyên dùng - Độ chính xác cao nhất)' },
    { value: 'gemini-1.5-flash', label: 'Google Gemini 1.5 Flash (Tốc độ phản hồi cực nhanh < 2s)' },
    { value: 'gpt-4o', label: 'OpenAI GPT-4o (Omni multimodal)' },
    { value: 'claude-3-5-sonnet', label: 'Anthropic Claude 3.5 Sonnet' },
  ],
  speakingModels: [
    { value: 'whisper-large-v3', label: 'OpenAI Whisper Large v3 + Pitch/Formant Acoustic' },
    { value: 'gemini-1.5-pro-audio', label: 'Gemini 1.5 Pro Native Audio Multimodal' },
  ],
  slaHours: [
    { value: 12, labelVi: 'giờ sau khi học viên nộp', labelEn: 'hours post-submission' },
    { value: 24, labelVi: 'giờ (Chuẩn khuyến nghị)', labelEn: 'hours (Recommended standard)' },
    { value: 48, labelVi: 'giờ', labelEn: 'hours' },
    { value: 72, labelVi: 'giờ', labelEn: 'hours' },
  ],
  jwtLifetimeMinutes: [
    { value: 15, labelVi: 'phút (Bảo mật cao)', labelEn: 'minutes (High Security)' },
    { value: 30, labelVi: 'phút', labelEn: 'minutes' },
    { value: 60, labelVi: 'phút', labelEn: 'minutes' },
  ],
  maxConcurrentDevices: [
    { value: 1, labelVi: 'thiết bị (Chống chia sẻ tài khoản)', labelEn: 'device (Strict anti-sharing)' },
    { value: 2, labelVi: 'thiết bị (PC + Mobile)', labelEn: 'devices (Laptop + Phone)' },
    { value: 5, labelVi: 'thiết bị', labelEn: 'devices' },
  ],
} as const;

export const ADMIN_SETTINGS_LIMITS = {
  temperature: { min: 0, max: 1, step: 0.05 },
  plagiarismThreshold: { min: 10, max: 60, step: 5 },
} as const;

export interface AdminSettingsConfig {
  aiModelWriting: string;
  aiModelSpeaking: string;
  temperature: number;
  autoApproveQuiz: boolean;
  requireTeacherReview: boolean;
  plagiarismThreshold: number;
  slaHours: number;
  emailStudentOnGraded: boolean;
  emailParentDigest: boolean;
  jwtLifetimeMinutes: number;
  maxConcurrentDevices: number;
}

export const DEFAULT_ADMIN_SETTINGS: Readonly<AdminSettingsConfig> = Object.freeze({
  aiModelWriting: ADMIN_SETTINGS_OPTIONS.writingModels[0].value,
  aiModelSpeaking: ADMIN_SETTINGS_OPTIONS.speakingModels[0].value,
  temperature: 0.2,
  autoApproveQuiz: true,
  requireTeacherReview: true,
  plagiarismThreshold: 30,
  slaHours: 24,
  emailStudentOnGraded: true,
  emailParentDigest: true,
  jwtLifetimeMinutes: 15,
  maxConcurrentDevices: 2,
});

function modelValue(value: unknown, options: readonly { value: string }[], fallback: string): string {
  return typeof value === 'string' && options.some(option => option.value === value) ? value : fallback;
}

function numberOption(value: unknown, options: readonly { value: number }[], fallback: number): number {
  return typeof value === 'number' && options.some(option => option.value === value) ? value : fallback;
}

function rangeValue(value: unknown, limits: { min: number; max: number }, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= limits.min && value <= limits.max
    ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeAdminSettings(value: unknown): { settings: AdminSettingsConfig; invalid: boolean } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { settings: { ...DEFAULT_ADMIN_SETTINGS }, invalid: true };
  }
  const stored = value as Record<string, unknown>;
  const defaults = DEFAULT_ADMIN_SETTINGS;
  const settings: AdminSettingsConfig = {
    aiModelWriting: modelValue(stored.aiModelWriting, ADMIN_SETTINGS_OPTIONS.writingModels, defaults.aiModelWriting),
    aiModelSpeaking: modelValue(stored.aiModelSpeaking, ADMIN_SETTINGS_OPTIONS.speakingModels, defaults.aiModelSpeaking),
    temperature: rangeValue(stored.temperature, ADMIN_SETTINGS_LIMITS.temperature, defaults.temperature),
    autoApproveQuiz: booleanValue(stored.autoApproveQuiz, defaults.autoApproveQuiz),
    requireTeacherReview: booleanValue(stored.requireTeacherReview, defaults.requireTeacherReview),
    plagiarismThreshold: rangeValue(stored.plagiarismThreshold, ADMIN_SETTINGS_LIMITS.plagiarismThreshold, defaults.plagiarismThreshold),
    slaHours: numberOption(stored.slaHours, ADMIN_SETTINGS_OPTIONS.slaHours, defaults.slaHours),
    emailStudentOnGraded: booleanValue(stored.emailStudentOnGraded, defaults.emailStudentOnGraded),
    emailParentDigest: booleanValue(stored.emailParentDigest, defaults.emailParentDigest),
    jwtLifetimeMinutes: numberOption(stored.jwtLifetimeMinutes, ADMIN_SETTINGS_OPTIONS.jwtLifetimeMinutes, defaults.jwtLifetimeMinutes),
    maxConcurrentDevices: numberOption(stored.maxConcurrentDevices, ADMIN_SETTINGS_OPTIONS.maxConcurrentDevices, defaults.maxConcurrentDevices),
  };
  const fields = Object.keys(settings) as Array<keyof AdminSettingsConfig>;
  return { settings, invalid: fields.some(field => settings[field] !== stored[field]) };
}

export function readAdminSettings(): {
  settings: AdminSettingsConfig;
  status: 'empty' | 'loaded' | 'invalid' | 'unavailable';
} {
  let saved: string | null;
  try {
    saved = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
  } catch {
    return { settings: { ...DEFAULT_ADMIN_SETTINGS }, status: 'unavailable' };
  }
  if (saved === null) return { settings: { ...DEFAULT_ADMIN_SETTINGS }, status: 'empty' };
  try {
    const normalized = normalizeAdminSettings(JSON.parse(saved));
    return { settings: normalized.settings, status: normalized.invalid ? 'invalid' : 'loaded' };
  } catch {
    return { settings: { ...DEFAULT_ADMIN_SETTINGS }, status: 'invalid' };
  }
}

export function saveAdminSettings(settings: AdminSettingsConfig): boolean {
  try {
    const normalized = normalizeAdminSettings(settings);
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(normalized.settings));
    return true;
  } catch {
    return false;
  }
}

export function resetAdminSettings(): boolean {
  try {
    localStorage.removeItem(ADMIN_SETTINGS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
