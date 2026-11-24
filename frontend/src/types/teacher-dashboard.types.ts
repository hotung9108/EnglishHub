export type TeacherSkill = 'writing' | 'speaking' | 'reading' | 'listening';

export interface TeacherPendingSubmission {
  id: string;
  submissionId: number;
  assignmentId: number;
  assignmentTitle: string;
  studentId: number;
  studentName: string;
  studentEmail?: string;
  studentCode?: string;
  className: string;
  skill: TeacherSkill;
  submittedAt: string;
  aiPreScore?: string;
}

export interface TeacherActiveAssignment {
  id: number;
  title: string;
  className: string;
  classId: number;
  closeAt: string;
  isUrgent?: boolean;
  isExpired?: boolean;
  enrolledCount: number;
  submittedCount: number;
  pendingGradingCount: number;
  submissionRate: number;
}

export interface TeacherClassSummary {
  id: number;
  code: string;
  name: string;
  enrolled: number;
  assignmentsCount: number;
  pendingGrading: number;
  avgScore: number;
}
