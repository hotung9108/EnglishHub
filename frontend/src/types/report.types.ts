export type ReportDateInput = string;

export type ReportClassStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED';

export type ReportSkill = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';

export interface ReportOverviewParams {
  from?: ReportDateInput;
  to?: ReportDateInput;
  classId?: number;
  teacherId?: number;
}

export interface ReportOverviewResponse {
  classCount: number;
  assignedAssignmentCount: number;
  completionRatePercent: number;
  averageScorePercent: number;
  pendingGradingCount: number;
  pendingByStatus: Record<string, number>;
}

export interface ReportClassListParams {
  from?: ReportDateInput;
  to?: ReportDateInput;
  teacherId?: number;
  page?: number;
  limit?: number;
}

export interface ReportClassSummary {
  classId: number;
  className: string;
  status: ReportClassStatus;
  assignedAssignmentCount: number;
  averageScorePercent: number;
  completionRatePercent: number;
}

export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
}

export interface ReportClassListResponse {
  data: ReportClassSummary[];
  pagination: ReportPagination;
}

export interface ReportClassProgressParams {
  from?: ReportDateInput;
  to?: ReportDateInput;
  threshold?: number;
}

export interface AssignmentScore {
  assignmentId: number;
  title: string;
  averageScorePercent: number;
}

export interface StudentProgress {
  studentId: number;
  fullName: string;
  completedAssignments: number;
  totalAssignments: number;
  completionRatePercent: number;
  averageScorePercent: number;
}

export interface ReportClassProgressResponse {
  classId: number;
  completionRatePercent: number;
  belowAverageRatePercent: number;
  totalStudentCount: number;
  scoredStudentCount: number;
  belowAverageCount: number;
  assignmentScores: AssignmentScore[];
  laggingStudents: StudentProgress[];
  unscoredStudents: StudentProgress[];
}

export interface ReportStudentProgressParams {
  classId?: number;
  from?: ReportDateInput;
  to?: ReportDateInput;
}

export interface SkillAverage {
  skill: ReportSkill;
  averageScorePercent: number;
}

export interface ScoreTimeline {
  assignmentId: number;
  title: string;
  submittedAt: string;
  scorePercent: number;
}

export interface ReportStudentProgressResponse {
  studentId: number;
  studentName: string;
  classId: number;
  skillAverages: SkillAverage[];
  scoreTimeline: ScoreTimeline[];
}
