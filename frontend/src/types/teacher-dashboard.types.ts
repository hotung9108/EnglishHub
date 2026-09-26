export type TeacherSkill = 'writing' | 'speaking' | 'reading' | 'listening';

export interface TeacherPendingSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  className: string;
  skill: TeacherSkill;
  submittedAt: string;
  aiPreScore: string;
  aiConfidence: number;
  urgency: 'high' | 'medium' | 'normal';
}

export interface TeacherClassSummary {
  id: string;
  code: string;
  name: string;
  enrolled: number;
  pendingGrading: number;
  avgScore: number;
  nextSession: string;
  schedule: string;
  progressPercent: number;
}

export interface TeacherSkillPerformance {
  skill: TeacherSkill;
  skillName: string;
  avgScore: number;
  benchmark: number;
  submissionRate: number;
  needsReviewCount: number;
}

export interface TeacherUpcomingDeadline {
  id: string;
  title: string;
  type: 'assignment' | 'workshop' | 'grading_deadline';
  className: string;
  date: string;
  timeRemaining: string;
  status: 'urgent' | 'upcoming';
}

export interface TeacherActivityItem {
  id: string;
  type: 'submission' | 'ai_graded' | 'feedback_viewed' | 'system';
  title: string;
  desc: string;
  timestamp: string;
  className: string;
}
