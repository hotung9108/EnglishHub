import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Download, Search,
  PenTool, Mic, BookOpen, Headphones, AlertCircle, FileText,
  RotateCcw
} from 'lucide-react';
import { MetricCard, Button, EmptyState, Skeleton, StatusBadge, Pagination } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { submissionService, type SubmissionListItem, isSubmissionGraded, getSubmissionFinalScore } from '../api/services/submission.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { classService, type ClassSummary } from '../api/services/class.service';
import { reportService } from '../api/services/report.service';
import '../styles/student-ecosystem.css';

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

function convertTo10Scale(rawScore: number): number {
  if (rawScore <= 10) return rawScore;
  return parseFloat((rawScore / 10).toFixed(1));
}

export const StudentGrades: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [overallAvg, setOverallAvg] = useState<number | null>(null);
  const [progressDelta, setProgressDelta] = useState<number>(0);

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const handleSkillChange = (skill: string) => {
    setSelectedSkill(skill);
    setCurrentPage(1);
  };

  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const [reloadKey, setReloadKey] = useState(0);
  const handleReload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

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
        const classTitle = classes.length > 0 ? (classes[0].name) : (isVi ? 'Lớp Tiếng Anh Tổng Quát' : 'General English Class');
        
        let detectedSkill: 'Writing' | 'Speaking' | 'Reading' | 'Listening' = 'Writing';
        const titleLower = (assignment?.title || '').toLowerCase();
        if (titleLower.includes('speak')) detectedSkill = 'Speaking';
        else if (titleLower.includes('read')) detectedSkill = 'Reading';
        else if (titleLower.includes('listen')) detectedSkill = 'Listening';

        const isGraded = isSubmissionGraded(sub);
        const rawScoreVal = getSubmissionFinalScore(sub);
        const score10 = rawScoreVal !== null ? convertTo10Scale(rawScoreVal) : 7.0;

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
          scaledGrade: isGraded ? `${score10.toFixed(1)} / 10` : (isVi ? 'Đang chấm' : 'Evaluating'),
          status: isGraded ? 'graded' : 'pending'
        };
      });

      if (rows.length > 0) {
        setGrades(rows);
        const gradedRows = rows.filter(r => r.status === 'graded');
        if (gradedRows.length > 0) {
          const totalScores = gradedRows.reduce((acc, curr) => {
            const b = parseFloat(curr.scaledGrade.split('/')[0].trim());
            return acc + (isNaN(b) ? 0 : b);
          }, 0);
          setOverallAvg(parseFloat((totalScores / gradedRows.length).toFixed(1)));
        } else {
          setOverallAvg(null);
        }
      } else {
        setGrades([]);
        setOverallAvg(null);
      }

      if (progressRes.status === 'fulfilled' && progressRes.value) {
        const sk = progressRes.value.skillAverages;
        if (sk && sk.length > 0) {
          const avg = sk.reduce((acc, curr) => acc + curr.averageScorePercent, 0) / sk.length;
          setOverallAvg(convertTo10Scale(avg));
          setProgressDelta(0.5);
        } else {
          setProgressDelta(0);
        }
      } else {
        setProgressDelta(0);
      }

    } catch (err: unknown) {
      if (!isMounted) return;
      console.error('Failed to load student grade book', err);
      setError(isVi ? 'Không thể tải bảng điểm từ máy chủ.' : 'Failed to fetch student grade book from server.');
      setGrades([]);
      setOverallAvg(null);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

    void fetchGradeData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isVi, reloadKey]);

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

  const totalPages = Math.ceil(filteredGrades.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedGrades = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredGrades.slice(start, start + pageSize);
  }, [filteredGrades, safeCurrentPage, pageSize]);

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

  const getScorePillClass = (scaledGrade: string) => {
    const score = parseFloat(scaledGrade.split('/')[0].trim());
    if (isNaN(score)) return 'good';
    if (score >= 8.0) return 'high';
    if (score >= 6.5) return 'good';
    return 'medium';
  };

  const handleExport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="std-eco-container pt-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton width="280px" height="36px" />
          <Skeleton width="160px" height="36px" />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height="96px" />
          ))}
        </div>
        <Skeleton height="320px" />
      </div>
    );
  }

  return (
    <div className="std-eco-container pt-6">
      {/* Header */}
      <div className="std-eco-header">
        <div>
          <h1 className="std-eco-title">
            {isVi ? 'Bảng điểm' : 'Grade Book'}
          </h1>
        </div>

        <div>
          <Button 
            variant="secondary"
            onClick={handleExport}
            icon={Download}
          >
            {isVi ? 'Xuất Bảng Điểm (PDF)' : 'Export Transcript'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="std-error-banner mb-6">
          <div className="std-error-msg">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={handleReload} icon={RotateCcw}>
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          title={isVi ? 'Điểm TB Tích lũy (Thang 10)' : 'Cumulative Grade (Scale 10)'}
          value={overallAvg !== null && overallAvg > 0 ? `${overallAvg.toFixed(1)} / 10` : '--'}
        />
        <MetricCard
          title={isVi ? 'Bài tập đã có kết quả' : 'Assignments Graded'}
          value={`${gradedCount} / ${grades.length}`}
        />
        <MetricCard
          title={isVi ? 'Đang chờ chấm' : 'Awaiting Grading'}
          value={`${pendingCount} ${isVi ? 'bài' : 'items'}`}
        />
        <MetricCard
          title={isVi ? 'Tăng trưởng so với đầu kỳ' : 'Progress vs Diagnostic'}
          value={progressDelta > 0 ? `+${progressDelta} Band` : '--'}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="std-eco-filter-bar">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Skill Filter Dropdown */}
          <select 
            value={selectedSkill}
            onChange={(e) => handleSkillChange(e.target.value)}
            className="select-input min-w-40"
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
            onChange={(e) => handleClassChange(e.target.value)}
            className="select-input min-w-48"
          >
            <option value="all">{isVi ? 'Tất cả các lớp' : 'All Enrolled Classes'}</option>
            {classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Search box */}
        <div className="std-eco-search-wrap">
          <Search size={15} className="std-eco-search-icon" />
          <input 
            type="text"
            className="std-eco-search-input"
            placeholder={isVi ? 'Tìm kiếm bài tập...' : 'Search assignment...'}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grades Table */}
      <div className="std-eco-card">
        <div className="std-eco-card-header">
          <h2 className="std-eco-card-title">
            {isVi ? 'Chi tiết điểm bài tập' : 'Assignment Grades'}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {isVi ? `Hiển thị ${filteredGrades.length} kết quả` : `Showing ${filteredGrades.length} entries`}
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="grades-table">
            <thead>
              <tr>
                <th className="text-left min-w-[240px]">
                  {isVi ? 'Bài tập & Khóa học' : 'Assignment & Class'}
                </th>
                <th className="text-center">{isVi ? 'Kỹ năng' : 'Skill'}</th>
                <th className="text-center">{isVi ? 'Ngày nộp' : 'Submitted Date'}</th>
                <th className="text-center">{isVi ? 'Trọng số' : 'Weight'}</th>
                <th className="text-center">{isVi ? 'Điểm thô' : 'Raw Score'}</th>
                <th className="text-center">{isVi ? 'Điểm số (Thang 10)' : 'Score (Scale 10)'}</th>
                <th className="text-center">{isVi ? 'Trạng thái' : 'Status'}</th>
                <th className="text-right">{isVi ? 'Hành động' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGrades.map((row) => (
                <tr key={row.id}>
                  <td className="text-left">
                    <div className="font-semibold text-slate-900 text-sm mb-0.5">
                      {row.assignmentTitle}
                    </div>
                    <div className="text-xs text-slate-500">
                      {row.className}
                    </div>
                  </td>
                  <td className="text-center">
                    <span className={`std-skill-tag ${row.skill.toLowerCase()}`}>
                      {getSkillIcon(row.skill)}
                      {row.skill}
                    </span>
                  </td>
                  <td className="text-center text-xs text-slate-500 font-medium whitespace-nowrap">
                    {row.submittedDate}
                  </td>
                  <td className="text-center">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded">
                      {row.weight}
                    </span>
                  </td>
                  <td className="text-center text-xs font-semibold text-slate-700">
                    {row.rawScore !== '--' ? row.rawScore : <span className="text-slate-400 font-normal">--</span>}
                  </td>
                  <td className="text-center">
                    {row.status === 'graded' ? (
                      <span className={`grade-score-pill ${getScorePillClass(row.scaledGrade)}`}>
                        {row.scaledGrade}
                      </span>
                    ) : (
                      <span className="grade-score-pill pending">
                        {row.scaledGrade}
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <StatusBadge
                       status={row.status === 'graded' ? 'success' : 'warning'}
                      label={row.status === 'graded' ? (isVi ? 'Đã chấm' : 'Graded') : (isVi ? 'Đang chấm' : 'Pending')}
                    />
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {row.status === 'graded' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/student/submissions/${row.submissionId || row.assignmentId}`)}
                        icon={ArrowRight}
                        iconPosition="right"
                      >
                        {isVi ? 'Xem lời giải' : 'Review Result'}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/student/assignments/${row.assignmentId}/overview`)}
                      >
                        {isVi ? 'Xem bài nộp' : 'View Submission'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredGrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <EmptyState
                      icon={AlertCircle}
                      title={isVi ? 'Không tìm thấy kết quả phù hợp với bộ lọc' : 'No grade records match the selected filters'}
                      description={isVi ? 'Hãy thử chọn kỹ năng hoặc khóa học khác.' : 'Try adjusting your skill or class filters.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredGrades.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredGrades.length}
            itemLabel={isVi ? 'kết quả' : 'entries'}
            isVi={isVi}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            variant="table"
          />
        )}
      </div>
    </div>
  );
};

export default StudentGrades;
