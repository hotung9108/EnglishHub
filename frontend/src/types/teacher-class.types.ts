export type ClassSkill = 'writing' | 'speaking' | 'reading' | 'listening';

export interface ClassDetailItem {
  id: string;
  code: string;
  name: string;
  teacher: string;
  room: string;
  schedule: string;
  status: 'active' | 'completed';
  targetBand: string;
  currentLesson: number;
  totalLessons: number;
  enrolledStudents: number;
  stats: {
    completionRate: number;
    onTimeRate: number;
    avgScore: number;
    targetAttainment: number;
    assignedCount: number;
    pendingGrading: number;
  };
}

export interface StudentGradeRow {
  id: string;
  code: string;
  name: string;
  avatar: string;
  email: string;
  attendance: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  scores: {
    writing: number;
    speaking: number;
    reading: number;
    listening: number;
    overall: number;
  };
  status: 'exceed' | 'ontime' | 'support';
  statusLabel: string;
  lastActive: string;
  recentFeedback?: string;
}

export interface ClassAssignmentItem {
  id: string;
  code: string;
  title: string;
  skill: ClassSkill;
  dueDate: string;
  daysLeft: number;
  submittedCount: number;
  totalStudents: number;
  pendingGrading: number;
  avgScore: number;
  status: 'open' | 'closed' | 'upcoming';
}

export interface SkillAnalyticsItem {
  skill: ClassSkill;
  name: string;
  avgScore: number;
  targetScore: number;
  completionRate: number;
  strengths: string[];
  weaknesses: string[];
  aiRecommendation: string;
}

export interface SyllabusLessonItem {
  session: number;
  title: string;
  date: string;
  focusSkill: ClassSkill | 'grammar' | 'mock_test';
  status: 'completed' | 'current' | 'upcoming';
  materialsCount: number;
  homeworkAttached?: string;
}
