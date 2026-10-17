export type ClassSkill = 'writing' | 'speaking' | 'reading' | 'listening';

export interface ClassDetailItem {
  id: string;
  name: string;
  teacher?: string;
  level?: string;
  status: 'active' | 'completed';
  enrolledStudents: number;
  stats: {
    completionRate: number;
    avgScore: number;
    assignedCount: number;
    pendingGrading: number;
  };
}

export interface StudentGradeRow {
  id: string;
  code: string;
  name: string;
  avatar: string;
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
  completionRate: number;
  assignmentCount: number;
  gradedCount: number;
}
