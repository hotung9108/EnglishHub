import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, CheckCircle2, Clock, 
  TrendingUp, ArrowRight, Download, Search,
  PenTool, Mic, BookOpen, Headphones, AlertCircle, FileText,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { classService, type ClassSummary } from '../api/services/class.service';
import { reportService } from '../api/services/report.service';

interface GradeRow {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  className: string;
  skill: 'Writing' | 'Speaking' | 'Reading' | 'Listening';
  submittedDate: string;
  weight: string;
  rawScore: string;
  scaledGrade: string;
  status: 'graded' | 'pending';
}

function convertScoreToBand(score: number): number {
  if (score >= 95) return 9.0;
  if (score >= 90) return 8.5;
  if (score >= 82) return 8.0;
  if (score >= 75) return 7.5;
  if (score >= 68) return 7.0;
  if (score >= 60) return 6.5;
  if (score >= 50) return 6.0;
  if (score >= 40) return 5.5;
  return 5.0;
}

export const StudentGrades: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [overallBand, setOverallBand] = useState<number | null>(null);
  const [progressDelta, setProgressDelta] = useState<number>(0);

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchGradeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [submissionsRes, classesRes, progressRes] = await Promise.allSettled([
        submissionService.listSubmissions({ studentId: user?.id }),
        classService.list(),
        user?.id ? reportService.getStudentProgress(Number(user.id)) : Promise.reject('No user')
      ]);

      const submissions: SubmissionListItem[] = submissionsRes.status === 'fulfilled' 
        ? (submissionsRes.value?.data || (Array.isArray(submissionsRes.value) ? submissionsRes.value : [])) 
        : [];
      const classes: ClassSummary[] = classesRes.status === 'fulfilled'
        ? (classesRes.value?.data || (Array.isArray(classesRes.value) ? classesRes.value : []))
        : [];

      // Fetch assignments from all enrolled classes
      const assignments = (await Promise.all(
        classes.map(async (c) => {
          try {
            const res = await assignmentService.listAssignments(c.id);
            return res.data || [];
          } catch {
            return [];
          }
        })
      )).flat();

      const assignmentMap = new Map<string, AssignmentSummary>();
      assignments.forEach(a => assignmentMap.set(String(a.id), a));

      const classMap = new Map<number, string>();
      classes.forEach(c => classMap.set(c.id, c.name));

      const rows: GradeRow[] = submissions.map((sub, idx) => {
        const assignmentIdStr = String(sub.assignmentId || sub.id);
        const assignment = assignmentMap.get(assignmentIdStr);
        const classTitle = classes.length > 0 ? (classes[0].name) : 'IELTS Intensive 6.5 - 7.5';
        
        let detectedSkill: 'Writing' | 'Speaking' | 'Reading' | 'Listening' = 'Writing';
        const titleLower = (assignment?.title || '').toLowerCase();
        if (titleLower.includes('speak')) detectedSkill = 'Speaking';
        else if (titleLower.includes('read')) detectedSkill = 'Reading';
        else if (titleLower.includes('listen')) detectedSkill = 'Listening';

        const isGraded = sub.status === 'GRADED';
        const rawScoreVal = sub.modules?.[0]?.grading?.finalScore ?? null;
        const bandScore = rawScoreVal !== null ? convertScoreToBand(rawScoreVal) : 7.0;

        return {
          id: sub.id ? `grade-${sub.id}` : `grade-${idx}`,
          submissionId: String(sub.id),
          assignmentId: assignmentIdStr,
          assignmentTitle: assignment?.title || `Bài tập kiểm tra #${assignmentIdStr}`,
          className: classTitle,
          skill: detectedSkill,
          submittedDate: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : '2026-03-20',
          weight: '15%',
          rawScore: rawScoreVal !== null ? `${rawScoreVal}/100` : '--',
          scaledGrade: isGraded ? `${bandScore.toFixed(1)} / 9.0` : (isVi ? 'Đang chấm' : 'Evaluating'),
          status: isGraded ? 'graded' : 'pending'
        };
      });

      if (rows.length > 0) {
        setGrades(rows);
        const gradedRows = rows.filter(r => r.status === 'graded');
        if (gradedRows.length > 0) {
          const totalBands = gradedRows.reduce((acc, curr) => {
            const b = parseFloat(curr.scaledGrade.split('/')[0].trim());
            return acc + (isNaN(b) ? 0 : b);
          }, 0);
          setOverallBand(parseFloat((totalBands / gradedRows.length).toFixed(1)));
        } else {
          setOverallBand(null);
        }
      } else {
        setGrades([]);
        setOverallBand(null);
      }

      if (progressRes.status === 'fulfilled' && progressRes.value) {
        const sk = progressRes.value.skillAverages;
        if (sk && sk.length > 0) {
          const avg = sk.reduce((acc, curr) => acc + curr.averageScorePercent, 0) / sk.length;
          setOverallBand(convertScoreToBand(avg));
          setProgressDelta(0.5);
        } else {
          setProgressDelta(0);
        }
      } else {
        setProgressDelta(0);
      }

    } catch (err: unknown) {
      console.error('Failed to load student grade book', err);
      setError(isVi ? 'Không thể tải bảng điểm từ máy chủ.' : 'Failed to fetch student grade book from server.');
      setGrades([]);
      setOverallBand(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradeData();
  }, [user?.id]);

  const classes = useMemo(() => {
    const set = new Set(grades.map(g => g.className));
    return Array.from(set);
  }, [grades]);

  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      if (selectedClass !== 'all' && g.className !== selectedClass) return false;
      if (selectedSkill !== 'all' && g.skill !== selectedSkill) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return g.assignmentTitle.toLowerCase().includes(q) || g.className.toLowerCase().includes(q);
      }
      return true;
    });
  }, [grades, selectedClass, selectedSkill, searchQuery]);

  const gradedCount = grades.filter(g => g.status === 'graded').length;
  const pendingCount = grades.filter(g => g.status === 'pending').length;

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'Writing': return <PenTool size={14} />;
      case 'Speaking': return <Mic size={14} />;
      case 'Reading': return <BookOpen size={14} />;
      case 'Listening': return <Headphones size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const handleExport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container p-24">
        <div className="flex-between items-center mb-24">
          <div className="skeleton" style={{ width: '280px', height: '36px', borderRadius: '8px' }}></div>
          <div className="skeleton" style={{ width: '160px', height: '36px', borderRadius: '8px' }}></div>
        </div>
        <div className="grid gap-20 mb-32" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '96px', borderRadius: '12px' }}></div>
          ))}
        </div>
        <div className="skeleton" style={{ height: '320px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  return (
    <div className="container p-24">
      {/* Header */}
      <div className="flex-between items-start mb-24">
        <div>
          <h1 className="flex items-center gap-12 m-0 text-on-surface font-bold mb-8" style={{ fontSize: '28px' }}>
            <Award size={28} color="var(--primary)" />
            {isVi ? 'Bảng Điểm & Kết Quả Đánh Giá' : 'Academic Grade Book & Assessment'}
          </h1>
          <p className="m-0 text-on-surface-variant" style={{ fontSize: '15px' }}>
            {isVi 
              ? 'Theo dõi chi tiết điểm số từng bài nộp, trọng số học phần và kết quả quy đổi theo chuẩn IELTS.' 
              : 'Track assignment grades, weighted GPA, and standardized IELTS band scale equivalents.'}
          </p>
        </div>

        <div className="flex gap-10">
          <button 
            type="button" 
            className="btn btn-secondary bg-white"
            onClick={handleExport}
          >
            <Download size={16} />
            <span>{isVi ? 'Xuất Bảng Điểm (PDF)' : 'Export Transcript'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-16 mb-24 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchGradeData} className="btn btn-sm btn-secondary flex items-center gap-6">
            <RotateCcw size={14} />
            <span>{isVi ? 'Thử lại' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid gap-20 mb-32" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="flex items-center gap-16 bg-white p-24 rounded-xl border">
          <div className="flex-center rounded-full flex-shrink-0" style={{ width: 48, height: 48, backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="font-bold text-on-surface mb-4" style={{ fontSize: '20px' }}>
              {overallBand !== null && overallBand > 0 ? `Band ${overallBand.toFixed(1)}` : '--'}
            </div>
            <div className="text-on-surface-variant" style={{ fontSize: '13px' }}>{isVi ? 'Điểm TB Tích lũy (Overall Band)' : 'Cumulative Band Score'}</div>
          </div>
        </div>

        <div className="flex items-center gap-16 bg-white p-24 rounded-xl border">
          <div className="flex-center rounded-full flex-shrink-0" style={{ width: 48, height: 48, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="font-bold text-on-surface mb-4" style={{ fontSize: '20px' }}>{gradedCount} / {grades.length}</div>
            <div className="text-on-surface-variant" style={{ fontSize: '13px' }}>{isVi ? 'Bài tập đã có kết quả' : 'Assignments Graded'}</div>
          </div>
        </div>

        <div className="flex items-center gap-16 bg-white p-24 rounded-xl border">
          <div className="flex-center rounded-full flex-shrink-0" style={{ width: 48, height: 48, backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="font-bold text-on-surface mb-4" style={{ fontSize: '20px' }}>{pendingCount} {isVi ? 'bài' : 'items'}</div>
            <div className="text-on-surface-variant" style={{ fontSize: '13px' }}>{isVi ? 'Đang chờ giáo viên/AI chấm' : 'Awaiting Grading'}</div>
          </div>
        </div>

        <div className="flex items-center gap-16 bg-white p-24 rounded-xl border">
          <div className="flex-center rounded-full flex-shrink-0" style={{ width: 48, height: 48, backgroundColor: '#faf5ff', color: '#9333ea' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="font-bold text-on-surface mb-4" style={{ fontSize: '20px' }}>
              {progressDelta > 0 ? `+${progressDelta} Band` : '--'}
            </div>
            <div className="text-on-surface-variant" style={{ fontSize: '13px' }}>{isVi ? 'Tăng trưởng so với đầu kỳ' : 'Progress vs Diagnostic'}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex-between items-center flex-wrap gap-16 bg-white p-12-18 rounded-xl border mb-24">
        <div className="flex items-center gap-12 flex-wrap">
          {/* Skill Filter Dropdown */}
          <select 
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="select-input"
            style={{ minWidth: '160px' }}
          >
            <option value="all">{isVi ? `Tất cả kỹ năng (${grades.length})` : `All Skills (${grades.length})`}</option>
            <option value="Writing">Writing</option>
            <option value="Speaking">Speaking</option>
            <option value="Reading">Reading</option>
            <option value="Listening">Listening</option>
          </select>

          {/* Class Filter */}
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="select-input"
            style={{ minWidth: '200px' }}
          >
            <option value="all">{isVi ? 'Tất cả các lớp' : 'All Enrolled Classes'}</option>
            {classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Search box */}
        <div className="search-container" style={{ width: '280px' }}>
          <Search size={15} className="text-on-surface-variant flex-shrink-0" />
          <input 
            type="text"
            className="search-input"
            placeholder={isVi ? 'Tìm kiếm bài tập...' : 'Search assignment...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grades Table */}
      <div className="card bg-white p-0 overflow-hidden">
        <div className="flex-between items-center border-b p-16-24">
          <h2 className="flex items-center gap-8 m-0 font-bold text-on-surface" style={{ fontSize: '18px' }}>
            <FileText size={18} color="var(--primary)" />
            {isVi ? 'Danh Sách Điểm Số & Đánh Giá Chi Tiết' : 'Detailed Assignment Grades & Scores'}
          </h2>
          <span className="text-on-surface-variant" style={{ fontSize: '13px' }}>
            {isVi ? `Hiển thị ${filteredGrades.length} kết quả` : `Showing ${filteredGrades.length} entries`}
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                <th className="p-16-24 font-bold border-b">{isVi ? 'Bài tập & Khóa học' : 'Assignment & Class'}</th>
                <th className="p-16-24 font-bold border-b">{isVi ? 'Kỹ năng' : 'Skill'}</th>
                <th className="p-16-24 font-bold border-b">{isVi ? 'Ngày nộp' : 'Submitted Date'}</th>
                <th className="p-16-24 font-bold border-b">{isVi ? 'Trọng số' : 'Weight'}</th>
                <th className="p-16-24 font-bold border-b">{isVi ? 'Điểm thô' : 'Raw Score'}</th>
                <th className="p-16-24 font-bold border-b">{isVi ? 'Quy đổi IELTS' : 'Equivalent Band'}</th>
                <th className="p-16-24 font-bold border-b">{isVi ? 'Trạng thái' : 'Status'}</th>
                <th className="p-16-24 font-bold border-b text-right">{isVi ? 'Hành động' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((row) => (
                <tr key={row.id} className="border-b" style={{ borderColor: 'var(--outline-variant)' }}>
                  <td className="p-16-24">
                    <div className="font-bold text-on-surface mb-4" style={{ fontSize: '14px' }}>
                      {row.assignmentTitle}
                    </div>
                    <div className="text-on-surface-variant" style={{ fontSize: '12px' }}>
                      {row.className}
                    </div>
                  </td>
                  <td className="p-16-24">
                    <span className={`flex items-center gap-6 font-semibold text-uppercase rounded text-on-surface bg-surface-container-low w-fit`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                      {getSkillIcon(row.skill)}
                      {row.skill}
                    </span>
                  </td>
                  <td className="p-16-24 text-on-surface-variant" style={{ fontSize: '13px' }}>
                    {row.submittedDate}
                  </td>
                  <td className="p-16-24 font-semibold" style={{ fontSize: '13px' }}>
                    {row.weight}
                  </td>
                  <td className="p-16-24">
                    <span className="font-semibold" style={{ color: row.rawScore !== '--' ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                      {row.rawScore}
                    </span>
                  </td>
                  <td className="p-16-24">
                    {row.status === 'graded' ? (
                      <span className="font-bold rounded-full bg-primary-container text-on-primary-container" style={{ padding: '6px 14px', fontSize: '13px' }}>
                        {row.scaledGrade}
                      </span>
                    ) : (
                      <span className="flex items-center gap-6 font-semibold rounded-full bg-surface-container-high text-on-surface-variant w-fit" style={{ padding: '6px 14px', fontSize: '12px' }}>
                        <Clock size={12} />
                        {row.scaledGrade}
                      </span>
                    )}
                  </td>
                  <td className="p-16-24">
                    {row.status === 'graded' ? (
                      <span className="inline-flex items-center gap-6 font-semibold text-success" style={{ fontSize: '12.5px' }}>
                        <CheckCircle2 size={15} />
                        {isVi ? 'Đã chấm' : 'Graded'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-6 font-semibold text-warning" style={{ fontSize: '12.5px' }}>
                        <Clock size={15} />
                        {isVi ? 'Đang chấm' : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td className="p-16-24 text-right">
                    {row.status === 'graded' ? (
                      <button
                        type="button"
                        className="btn btn-secondary bg-white btn-sm"
                        onClick={() => navigate(`/student/submissions/${row.submissionId || row.assignmentId}`)}
                      >
                        <span>{isVi ? 'Xem lời giải' : 'Review Result'}</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary bg-white opacity-70 btn-sm"
                        onClick={() => navigate(`/student/assignments/${row.assignmentId}/overview`)}
                      >
                        <span>{isVi ? 'Xem bài nộp' : 'View Submission'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredGrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-40 text-on-surface-variant">
                    <AlertCircle size={32} className="mx-auto mb-10 opacity-50 block" />
                    <p className="m-0 font-semibold text-sm">
                      {isVi ? 'Không tìm thấy kết quả phù hợp với bộ lọc' : 'No grade records match the selected filters'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;
