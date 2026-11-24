export interface EnrolledStudentSubmissionData {
  studentId: number;
  code: string;
  name: string;
  status: 'submitted' | 'in_progress' | 'missing' | string;
  gradingStatus: 'graded' | 'pending' | 'none' | string;
  submissionId?: number;
  finalScore?: number | null;
}

export interface ExportSubmissionsOptions {
  assignmentId: number | string;
  assignmentTitle?: string;
  className?: string;
  students: EnrolledStudentSubmissionData[];
  isVi?: boolean;
}

export function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function generateSubmissionsCsvContent(options: ExportSubmissionsOptions): string {
  const { assignmentId, assignmentTitle, className, students, isVi = true } = options;

  const headers = [
    isVi ? 'Mã học viên' : 'Student Code',
    isVi ? 'Họ và tên' : 'Full Name',
    isVi ? 'Trạng thái nộp' : 'Submission Status',
    isVi ? 'Trạng thái chấm' : 'Grading Status',
    isVi ? 'Điểm số (/10)' : 'Score (/10)',
  ];

  const rows: string[][] = [
    [isVi ? 'DANH SÁCH BÀI NỘP BÀI TẬP' : 'ASSIGNMENT SUBMISSIONS LIST'],
    [isVi ? 'Mã bài tập' : 'Assignment ID', String(assignmentId)],
    ...(assignmentTitle ? [[isVi ? 'Tiêu đề bài tập' : 'Assignment Title', assignmentTitle]] : []),
    ...(className ? [[isVi ? 'Lớp học' : 'Class', className]] : []),
    [isVi ? 'Thời gian xuất' : 'Exported At', new Date().toLocaleString(isVi ? 'vi-VN' : 'en-US')],
    [],
    headers,
  ];

  for (const student of students) {
    let statusLabel = isVi ? 'Chưa nộp bài' : 'Missing';
    if (student.status === 'submitted') {
      statusLabel = isVi ? 'Đã nộp bài' : 'Submitted';
    } else if (student.status === 'in_progress') {
      statusLabel = isVi ? 'Đang làm bài' : 'In Progress';
    }

    let gradingLabel = isVi ? 'Chưa có bài' : 'Not Submitted';
    if (student.gradingStatus === 'graded') {
      gradingLabel = isVi ? 'Đã chấm' : 'Graded';
    } else if (student.gradingStatus === 'pending') {
      gradingLabel = isVi ? 'Chờ chấm' : 'Pending';
    }

    const scoreLabel = student.finalScore !== null && student.finalScore !== undefined
      ? String(student.finalScore)
      : '';

    rows.push([
      student.code,
      student.name,
      statusLabel,
      gradingLabel,
      scoreLabel,
    ]);
  }

  return '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
}

export function exportSubmissionsToCsv(options: ExportSubmissionsOptions): void {
  const csvContent = generateSubmissionsCsvContent(options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeId = options.assignmentId || 'detail';
  const filename = `submissions-assignment-${safeId}-${dateStr}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
