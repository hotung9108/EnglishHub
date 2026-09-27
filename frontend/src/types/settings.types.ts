export type SettingsTab = 'profile' | 'security' | 'notifications' | 'preferences';

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface NotificationSettings {
  // General / Admin
  securityAlerts: boolean;
  systemErrorAlerts: boolean;
  weeklyReports: boolean;
  userRegistrationApprovals: boolean;

  // Teacher
  submissionAlerts: boolean;
  deadlineApproachingAlerts: boolean;
  weeklyClassDigest: boolean;
  studentInquiries: boolean;

  // Student
  newAssignmentAlerts: boolean;
  gradingResultAlerts: boolean;
  dueReminder24h: boolean;
  studyStreakReminder: boolean;
}

export interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'normal' | 'large' | 'extra-large';
  
  // Admin
  simulateMaintenance: boolean;
  autoBackupDaily: boolean;
  idleSessionTimeout: string;

  // Teacher
  autoAiGradingAssist: boolean;
  anonymousGrading: boolean;
  autoPublishScores: boolean;
  defaultGradingScale: string;

  // Student
  dailyStudyGoalMinutes: number;
  autoPlayListeningAudio: boolean;
  displayIpaPhonetics: boolean;
  defaultAudioSpeed: string;
}
