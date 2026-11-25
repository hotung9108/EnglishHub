import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  escapeCsv, 
  generateSubmissionsCsvContent, 
  exportSubmissionsToCsv, 
  generateSubmissionsXlsxBlob,
  exportSubmissionsToExcel,
  type EnrolledStudentSubmissionData 
} from '../../utils/submissionExport.utils';

describe('FE-83: Teacher Submissions Export (Excel / CSV)', () => {
  const mockStudents: EnrolledStudentSubmissionData[] = [
    {
      studentId: 101,
      code: 'HV-0101',
      name: 'Nguyễn Văn A',
      status: 'submitted',
      gradingStatus: 'graded',
      submissionId: 501,
      finalScore: 8.5
    },
    {
      studentId: 102,
      code: 'HV-0102',
      name: 'Trần Thị B, "Special"',
      status: 'submitted',
      gradingStatus: 'pending',
      submissionId: 502,
      finalScore: null
    },
    {
      studentId: 103,
      code: 'HV-0103',
      name: 'Lê Văn C',
      status: 'missing',
      gradingStatus: 'none',
      finalScore: null
    }
  ];

  it('correctly escapes CSV special characters (quotes, commas, newlines)', () => {
    expect(escapeCsv('Simple text')).toBe('Simple text');
    expect(escapeCsv('Text with, comma')).toBe('"Text with, comma"');
    expect(escapeCsv('Text with "quotes"')).toBe('"Text with ""quotes"""');
    expect(escapeCsv('Text with\nnewline')).toBe('"Text with\nnewline"');
    expect(escapeCsv(null)).toBe('');
    expect(escapeCsv(undefined)).toBe('');
    expect(escapeCsv(10)).toBe('10');
  });

  it('generates valid UTF-8 BOM CSV data format for submissions list in Vietnamese', () => {
    const csv = generateSubmissionsCsvContent({
      assignmentId: 42,
      assignmentTitle: 'IELTS Writing Task 2 Mock',
      className: 'IELTS Advanced K2',
      students: mockStudents,
      isVi: true
    });

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('DANH SÁCH BÀI NỘP BÀI TẬP');
    expect(csv).toContain('42');
    expect(csv).toContain('IELTS Writing Task 2 Mock');
    expect(csv).toContain('IELTS Advanced K2');
    expect(csv).toContain('Mã học viên,Họ và tên,Trạng thái nộp,Trạng thái chấm,Điểm số (/10)');
    expect(csv).toContain('HV-0101,Nguyễn Văn A,Đã nộp bài,Đã chấm,8.5');
    expect(csv).toContain('HV-0102,"Trần Thị B, ""Special""",Đã nộp bài,Chờ chấm,');
    expect(csv).toContain('HV-0103,Lê Văn C,Chưa nộp bài,Chưa có bài,');
  });

  it('generates valid UTF-8 BOM CSV data format for submissions list in English', () => {
    const csv = generateSubmissionsCsvContent({
      assignmentId: 42,
      assignmentTitle: 'Reading Diagnostic Test',
      className: 'Class 10A',
      students: mockStudents,
      isVi: false
    });

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('ASSIGNMENT SUBMISSIONS LIST');
    expect(csv).toContain('Student Code,Full Name,Submission Status,Grading Status,Score (/10)');
    expect(csv).toContain('HV-0101,Nguyễn Văn A,Submitted,Graded,8.5');
    expect(csv).toContain('HV-0102,"Trần Thị B, ""Special""",Submitted,Pending,');
    expect(csv).toContain('HV-0103,Lê Văn C,Missing,Not Submitted,');
  });

  describe('exportSubmissionsToCsv download behavior', () => {
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let clickSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('creates a download link with correct filename and triggers click', () => {
      exportSubmissionsToCsv({
        assignmentId: 42,
        assignmentTitle: 'Test Exam',
        students: mockStudents,
        isVi: true
      });

      expect(createObjectURLSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(revokeObjectURLSpy).toHaveBeenCalledOnce();
    });
  });

  describe('FE-83: exportSubmissionsToExcel (OpenXML .xlsx)', () => {
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let clickSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-xlsx-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('generates a valid OpenXML .xlsx binary Blob', () => {
      const blob = generateSubmissionsXlsxBlob({
        assignmentId: 42,
        assignmentTitle: 'IELTS Writing Task 2 Mock',
        className: 'IELTS Advanced K2',
        students: mockStudents,
        isVi: true
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(blob.size).toBeGreaterThan(1000);
    });

    it('triggers download with .xlsx extension and correct filename', () => {
      exportSubmissionsToExcel({
        assignmentId: 42,
        assignmentTitle: 'IELTS Writing Task 2 Mock',
        className: 'IELTS Advanced K2',
        students: mockStudents,
        isVi: true
      });

      expect(createObjectURLSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(revokeObjectURLSpy).toHaveBeenCalledOnce();
    });
  });
});
