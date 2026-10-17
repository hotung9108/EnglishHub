import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary, type AssignmentDetail } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { 
  Plus, Mic, BookOpen, Headphones, PenTool, 
  Search, AlertCircle, FileText, 
  X, Edit2, RefreshCw
} from 'lucide-react';
import { Button, EmptyState, MetricCard, Pagination } from '../components/common';

interface AssignmentDisplayItem {
  id: string;
  code: string;
  type: 'writing' | 'speaking' | 'reading' | 'listening';
  typeLabel: string;
  title: string;
  className: string;
  dueDate: string;
  daysLeft?: number;
  totalStudents: number;
  submittedCount: number;
  pendingGradingCount: number;
  status: 'open' | 'closed' | 'upcoming';
}

export const TeacherAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Classes & Selected Class
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Assignments & Submissions
  const [assignments, setAssignments] = useState<AssignmentDisplayItem[]>([]);
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSkillModal, setShowSkillModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSkillFilterChange = (skill: string) => {
    setSkillFilter(skill);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleClassFilterChange = (classId: string) => {
    setSelectedClassId(classId);
    setCurrentPage(1);
  };

  const [currentTimestamp] = useState(() => Date.now());

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  };

  // Helper: map title or skill string to skill type
  const detectSkill = (title: string): 'writing' | 'speaking' | 'reading' | 'listening' => {
    const t = title.toLowerCase();
    if (t.includes('speak') || t.includes('nói') || t.includes('part 1') || t.includes('part 2') || t.includes('cue card')) return 'speaking';
    if (t.includes('read') || t.includes('đọc') || t.includes('passage') || t.includes('biomimicry')) return 'reading';
    if (t.includes('listen') || t.includes('nghe') || t.includes('audio') || t.includes('section')) return 'listening';
    return 'writing';
  };

  const getSkillLabel = (skill: string) => {
    switch (skill) {
      case 'writing': return 'Writing Task';
      case 'speaking': return 'Speaking Monologue';
      case 'reading': return 'Reading Passage';
      case 'listening': return 'Listening Section';
      default: return 'English Exercise';
    }
  };

  // 1. Fetch Classes on mount
  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const res = await classService.list({ limit: 100 });
        const list = res.data || [];
        if (isMounted) {
          setClasses(list);
          if (list.length > 0 && !selectedClassId) {
            setSelectedClassId(String(list[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load classes for assignment management:', err);
      }
    };
    fetchClasses();
    return () => { isMounted = false; };
  }, [selectedClassId]);

  // 2. Fetch Assignments for selected class (or all classes if 'all')
  useEffect(() => {
    let isMounted = true;

    const fetchAssignments = async () => {
      if (classes.length === 0) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const targetClasses = selectedClassId && selectedClassId !== 'all'
          ? classes.filter((c) => String(c.id) === selectedClassId)
          : classes;

        const loadedItems: AssignmentDisplayItem[] = [];

        for (const cls of targetClasses) {
          let membersCount = 0;
          try {
            const members = await classService.listMembers(cls.id);
            membersCount = members.length;
          } catch {
            membersCount = 0;
          }

          let rawAssignments: AssignmentSummary[] = [];
          try {
            const assignRes = await assignmentService.listAssignments(cls.id, { limit: 50 });
            rawAssignments = assignRes.data || [];
          } catch {
            rawAssignments = [];
          }

          for (const raw of rawAssignments) {
            let submissions: SubmissionListItem[] = [];
            try {
              const subRes = await submissionService.listSubmissions({ assignmentId: raw.id, limit: 100 });
              submissions = subRes.data || [];
            } catch {
              submissions = [];
            }

            const submittedCount = submissions.length;
            const pendingGradingCount = submissions.filter(
              (s) => s.status === 'SUBMITTED' || s.modules.some((m) => m.grading?.status === 'PENDING')
            ).length;

            // Days left & Status
            const closeDate = raw.closeAt ? new Date(raw.closeAt) : null;
            let daysLeft: number | undefined = undefined;
            let status: 'open' | 'closed' | 'upcoming' = 'open';

            if (closeDate) {
              const msDiff = closeDate.getTime() - currentTimestamp;
              daysLeft = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
              if (msDiff < 0) {
                status = 'closed';
              } else if (raw.status === 'DRAFT') {
                status = 'upcoming';
              } else {
                status = 'open';
              }
            }

            const dueDateStr = closeDate
              ? closeDate.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : (isVi ? 'Không thời hạn' : 'No deadline');

            let detail: AssignmentDetail | null = null;
            try {
              detail = await assignmentService.getAssignment(raw.id);
            } catch {
              // ignore
            }

            let skill: 'writing' | 'speaking' | 'reading' | 'listening' = detectSkill(raw.title);
            const modSkill = detail?.modules?.[0]?.skill?.toLowerCase();
            if (modSkill === 'speaking' || modSkill === 'reading' || modSkill === 'listening' || modSkill === 'writing') {
              skill = modSkill;
            }

            loadedItems.push({
              id: String(raw.id),
              code: `HW-${raw.id.toString().padStart(2, '0')}`,
              type: skill,
              typeLabel: getSkillLabel(skill),
              title: raw.title,
              className: cls.name,
              dueDate: dueDateStr,
              daysLeft,
              totalStudents: membersCount,
              submittedCount,
              pendingGradingCount,
              status
            });
          }
        }

        if (isMounted) {
          setAssignments(loadedItems);
        }
      } catch (err) {
        console.error('Failed to load assignments:', err);
        if (isMounted) {
          setError(isVi ? 'Không thể tải danh sách bài tập. Vui lòng thử lại.' : 'Failed to load assignments. Please retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAssignments();

    return () => {
      isMounted = false;
    };
  }, [classes, selectedClassId, isVi, reloadKey, currentTimestamp]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (skillFilter !== 'all' && item.type !== skillFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [assignments, skillFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAssignments = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, safeCurrentPage, pageSize]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const openCount = assignments.filter((a) => a.status === 'open').length;
    const pendingTotal = assignments.reduce((sum, a) => sum + a.pendingGradingCount, 0);
    const avgSubmission = total > 0
      ? Math.round((assignments.reduce((sum, a) => sum + (a.totalStudents > 0 ? a.submittedCount / a.totalStudents : 0), 0) / total) * 100)
      : 0;
    return {
      total,
      openCount,
      pendingTotal,
      avgSubmission: Math.min(100, Math.max(0, avgSubmission || 0))
    };
  }, [assignments]);

  const getSkillBadge = (type: string) => {
    switch (type) {
      case 'writing':
        return (
          <span className="skill-badge writing">
            <PenTool size={12} />
            Writing
          </span>
        );
      case 'speaking':
        return (
          <span className="skill-badge speaking">
            <Mic size={12} />
            Speaking
          </span>
        );
      case 'reading':
        return (
          <span className="skill-badge reading">
            <BookOpen size={12} />
            Reading
          </span>
        );
      default:
        return (
          <span className="skill-badge listening">
            <Headphones size={12} />
            Listening
          </span>
        );
    }
  };

  const handleSelectSkillToCreate = (skillType: string) => {
    setShowSkillModal(false);
    const classParam = selectedClassId ? `&classId=${selectedClassId}` : '';
    navigate(`/teacher/assignments/create?type=${skillType}${classParam}`);
  };

  return (
    <div className="teacher-container">
      {/* Header */}
      <div className="teacher-header">
        <div>
          <h1 className="teacher-title">
            {isVi ? 'Quản lý bài tập' : 'Assignments'}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Class Select Dropdown */}
          <select
            value={selectedClassId}
            onChange={(e) => handleClassFilterChange(e.target.value)}
            className="select-input font-semibold text-sm"
          >
            <option value="all">{isVi ? 'Tất cả các lớp' : 'All Classes'}</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowSkillModal(true)}
          >
            {isVi ? 'Giao bài tập mới' : 'Create Assignment'}
          </Button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="eh-card p-6 mb-6 text-center">
          <RefreshCw size={28} className="text-primary animate-spin m-auto mb-3" />
          <h3 className="m-0 text-sm font-bold text-main">
            {isVi ? 'Đang tải danh sách bài tập thực tế...' : 'Loading live assignments...'}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {isVi ? 'Đang cập nhật tiến độ nộp bài và hàng đợi cần chấm.' : 'Syncing submissions turnout and pending grading queue.'}
          </p>
        </div>
      )}

      {/* Error Alert */}
      {!isLoading && error && (
        <div className="adm-alert-error mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-danger flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={handleRetry}
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* KPI Stats Grid */}
      {!isLoading && !error && (
        <div className="teacher-stats-grid mb-6">
          <MetricCard
            title={isVi ? 'Tổng bài tập' : 'Total Assignments'}
            value={stats.total}
            className="h-full"
          />
          <MetricCard
            title={isVi ? 'Đang mở' : 'Active'}
            value={stats.openCount}
            className="h-full"
          />
          <MetricCard
            title={isVi ? 'Chờ chấm điểm' : 'Needs Grading'}
            value={stats.pendingTotal}
            className="h-full"
          />
          <MetricCard
            title={isVi ? 'Tỷ lệ nộp bài' : 'Turnout Rate'}
            value={stats.avgSubmission}
            suffix="%"
            className="h-full"
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      {!isLoading && !error && (
        <div className="teacher-filter-bar">
          <div className="teacher-pills">
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('all')}
            >
              {isVi ? 'Tất cả kỹ năng' : 'All Skills'}
              <span className="teacher-pill-badge">{assignments.length}</span>
            </button>
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'writing' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('writing')}
            >
              <PenTool size={13} />
              Writing
            </button>
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'speaking' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('speaking')}
            >
              <Mic size={13} />
              Speaking
            </button>
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'reading' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('reading')}
            >
              <BookOpen size={13} />
              Reading
            </button>
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'listening' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('listening')}
            >
              <Headphones size={13} />
              Listening
            </button>
          </div>

          <div className="teacher-search-wrap">
            <Search size={15} className="teacher-search-icon" />
            <input
              type="text"
              className="teacher-search-input"
              placeholder={isVi ? 'Tìm bài tập theo tên hoặc mã HW...' : 'Search assignment or HW code...'}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Assignments List */}
      {!isLoading && !error && (
        <div className="teacher-assignments-list">
          {paginatedAssignments.map((item) => {
            const submissionPercent = item.totalStudents > 0 
              ? Math.min(100, Math.round((item.submittedCount / item.totalStudents) * 100)) 
              : 0;

            return (
              <div key={item.id} className="teacher-assignment-card">
                {/* Left Column: Skill, Title, Due date */}
                <div className="teacher-assignment-meta-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="teacher-assignment-code-badge">
                      {item.code}
                    </span>
                    {getSkillBadge(item.type)}
                    <span className="text-xs text-muted">
                      {item.className}
                    </span>
                  </div>

                  <h3 
                    onClick={() => navigate(`/teacher/assignments/${item.id}`)}
                    className="teacher-assignment-title"
                  >
                    {item.title}
                  </h3>

                  <div className="teacher-assignment-deadline-row">
                    <span>
                      {isVi ? 'Hạn nộp:' : 'Deadline:'} <strong>{item.dueDate}</strong>
                    </span>
                    {item.daysLeft !== undefined && (
                      <span className={`teacher-assignment-days-badge ${item.daysLeft <= 1 ? 'urgent' : 'normal'}`}>
                        {item.daysLeft === 0 
                          ? (isVi ? 'Hết hạn hôm nay' : 'Due today') 
                          : (isVi ? `Còn ${item.daysLeft} ngày` : `${item.daysLeft} days left`)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Column: Submission Progress */}
                <div className="teacher-assignment-progress-wrap">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">{isVi ? 'Tiến độ nộp bài:' : 'Turnout:'}</span>
                    <span className="font-bold text-main">
                      {item.submittedCount}/{item.totalStudents} ({submissionPercent}%)
                    </span>
                  </div>
                  <div className="teacher-progress-bar">
                    <div 
                      className="teacher-progress-fill" 
                      style={{ width: `${submissionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Right Column: Pending grading badge & Action Button */}
                <div className="teacher-assignment-actions">
                  {item.pendingGradingCount > 0 ? (
                    <span className="teacher-assignment-pending-badge">
                      {item.pendingGradingCount} {isVi ? 'bài chờ chấm' : 'to grade'}
                    </span>
                  ) : (
                    <span className="teacher-assignment-done-badge">
                      {isVi ? 'Đã chấm hết' : 'All Graded'}
                    </span>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit2}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teacher/assignments/${item.id}/edit`);
                    }}
                    title={isVi ? 'Chỉnh sửa bài tập này' : 'Edit this assignment'}
                  >
                    {isVi ? 'Chỉnh sửa' : 'Edit'}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/teacher/assignments/${item.id}`)}
                  >
                    {item.pendingGradingCount > 0 ? (isVi ? 'Chấm bài ngay' : 'Grade Now') : (isVi ? 'Xem kết quả' : 'View Submissions')}
                  </Button>
                </div>
              </div>
            );
          })}

          {filteredAssignments.length === 0 && (
            <EmptyState
              icon={FileText}
              title={isVi ? 'Chưa có bài tập nào' : 'No assignments found'}
              description={isVi ? 'Bạn có thể bắt đầu giao bài tập mới cho học viên trong lớp ngay bây giờ.' : 'You can create a new assignment for students in this class right now.'}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowSkillModal(true)}
                >
                  {isVi ? 'Giao bài tập mới ngay' : 'Create Assignment Now'}
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && filteredAssignments.length > 0 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredAssignments.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel={isVi ? 'bài tập' : 'assignments'}
          isVi={isVi}
          variant="standalone"
        />
      )}

      {/* Skill Picker Modal */}
      {showSkillModal && (
        <div className="skill-modal-overlay" onClick={() => setShowSkillModal(false)}>
          <div className="skill-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="skill-modal-header">
              <h3 className="skill-modal-title">
                {isVi ? 'Chọn Loại Kỹ Năng Cần Giao Bài' : 'Select Assignment Skill Module'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowSkillModal(false)}
                className="skill-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <p className="skill-modal-desc">
              {isVi 
                ? 'Chọn 1 trong 4 kỹ năng tiếng Anh để thiết lập nội dung đề bài.' 
                : 'Select one of the 4 skills to configure assignment content.'}
            </p>

            <div className="skill-card-grid">
              {/* Writing */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('writing')}>
                <div className="skill-card-icon writing">
                  <PenTool size={22} />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-sm font-bold">Writing Task 1 & 2</h4>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    {isVi ? 'Bài luận học thuật, phân tích biểu đồ kèm bộ đếm từ và chấm điểm tự động.' : 'Academic essays & charts with word counters and auto-grammar check.'}
                  </p>
                </div>
              </div>

              {/* Speaking */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('speaking')}>
                <div className="skill-card-icon speaking">
                  <Mic size={22} />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-sm font-bold">Speaking Part 1, 2, 3</h4>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    {isVi ? 'Thu âm giọng nói trực tiếp, phân tích âm vị phát âm và độ trôi chảy AI.' : 'Audio recordings with AI fluency & phoneme accuracy analysis.'}
                  </p>
                </div>
              </div>

              {/* Reading */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('reading')}>
                <div className="skill-card-icon reading">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-sm font-bold">Reading Mock Passage</h4>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    {isVi ? 'Đề đọc hiểu 3 passage, câu hỏi Matching Headings, True/False/Not Given.' : 'Full reading passages with automated key checking and time tracker.'}
                  </p>
                </div>
              </div>

              {/* Listening */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('listening')}>
                <div className="skill-card-icon listening">
                  <Headphones size={22} />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-sm font-bold">Listening Section 1-4</h4>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    {isVi ? 'Tải lên audio bài nghe MP3, câu hỏi điền từ và phát hiện bẫy nghe.' : 'Upload MP3 audio files with transcripts and distractor markers.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSkillModal(false)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
