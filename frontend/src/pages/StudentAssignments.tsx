import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { 
  PenTool, 
  Mic, 
  BookOpen, 
  Headphones, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  Calendar, 
  Sparkles,
  Layers,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

type AssignmentDisplayStatus = 'not_started' | 'in_progress' | 'pending' | 'ai_processing' | 'graded';

interface StudentAssignmentDisplay {
  id: string | number;
  classId: string | number;
  className: string;
  title: string;
  type: string; // e.g. 'Writing', 'Speaking', 'Reading', 'Listening'
  status: AssignmentDisplayStatus;
  submissionId?: number;
  submittedOn?: string;
  deadline?: string;
  teacherName?: string;
  score?: number;
  accuracy?: string;
  aiScore?: number;
  daysLeft?: number;
  requirement?: string;
}

const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [rawAssignments, setRawAssignments] = useState<StudentAssignmentDisplay[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'not_started' | 'grading' | 'graded'>('all');

  const fetchAssignmentsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch student's classes
      const classRes = await classService.list({ limit: 50 });
      const fetchedClasses = classRes.data || [];
      setClasses(fetchedClasses);


      // 3. Fetch assignments across all enrolled classes
      const assignmentPromises = fetchedClasses.map(async (cls) => {
        try {
          const res = await assignmentService.listAssignments(cls.id, { limit: 50 });
          const items = res.data || [];
          return await Promise.all(
            items.map(async (a: AssignmentSummary): Promise<StudentAssignmentDisplay> => {
              let matchedSub: SubmissionListItem | undefined = undefined;
              if (user?.id) {
                try {
                  const subRes = await submissionService.listSubmissions({
                    assignmentId: a.id,
                    studentId: user.id,
                    limit: 1
                  });
                  if (subRes.data && subRes.data.length > 0) {
                    matchedSub = subRes.data[0];
                  }
                } catch {
                  // Fallback
                }
              }

              let displayStatus: AssignmentDisplayStatus = 'not_started';
              let score: number | undefined = undefined;

              if (matchedSub) {
                if (matchedSub.status === 'GRADED') {
                  displayStatus = 'graded';
                  score = matchedSub.modules?.[0]?.grading?.finalScore ?? undefined;
                } else if (matchedSub.status === 'SUBMITTED') {
                  displayStatus = 'pending';
                } else if (matchedSub.status === 'IN_PROGRESS') {
                  displayStatus = 'in_progress';
                }
              }

              // Determine skill type from title or modules
              const lowerTitle = a.title.toLowerCase();
              let skillType = 'General Task';
              if (lowerTitle.includes('speaking') || lowerTitle.includes('nói')) skillType = 'Speaking';
              else if (lowerTitle.includes('writing') || lowerTitle.includes('viết') || lowerTitle.includes('essay')) skillType = 'Writing';
              else if (lowerTitle.includes('reading') || lowerTitle.includes('đọc')) skillType = 'Reading';
              else if (lowerTitle.includes('listening') || lowerTitle.includes('nghe')) skillType = 'Listening';

              // Calculate days left
              let daysLeft = 3;
              if (a.closeAt) {
                const diffMs = new Date(a.closeAt).getTime() - Date.now();
                daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              }

              return {
                id: a.id,
                classId: String(cls.id),
                className: cls.name,
                title: a.title,
                type: skillType,
                status: displayStatus,
                submissionId: matchedSub?.id,
                submittedOn: matchedSub?.submittedAt ? new Date(matchedSub.submittedAt).toLocaleDateString('vi-VN') : undefined,
                deadline: a.closeAt ? new Date(a.closeAt).toLocaleDateString('vi-VN') : undefined,
                teacherName: 'Giảng viên phụ trách',
                score,
                daysLeft,
              };
            })
          );
        } catch {
          return [];
        }
      });

      const assignmentResults = await Promise.all(assignmentPromises);
      const combined = assignmentResults.flat();
      setRawAssignments(combined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài tập. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchAssignmentsData();
  }, [fetchAssignmentsData]);

  const getAssignmentRoute = (assignment: StudentAssignmentDisplay) => {
    const typeLower = assignment.type.toLowerCase();
    if (typeLower.includes('speaking')) {
      return `/student/assignments/speaking/${assignment.id}`;
    }
    if (typeLower.includes('reading')) {
      return `/student/assignments/reading/${assignment.id}`;
    }
    if (typeLower.includes('listening')) {
      return `/student/assignments/listening/${assignment.id}`;
    }
    return `/student/assignments/${assignment.id}`;
  };

  // Filtered by class & search query & status filter
  const filteredAssignments = useMemo(() => {
    return rawAssignments.filter((a) => {
      const matchClass = selectedClassId === 'all' || String(a.classId) === String(selectedClassId);
      const matchSearch = searchQuery.trim() === '' || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.teacherName && a.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchStatus = true;
      if (activeStatusFilter === 'not_started') {
        matchStatus = a.status === 'not_started';
      } else if (activeStatusFilter === 'grading') {
        matchStatus = a.status === 'pending' || a.status === 'ai_processing' || a.status === 'in_progress';
      } else if (activeStatusFilter === 'graded') {
        matchStatus = a.status === 'graded';
      }

      return matchClass && matchSearch && matchStatus;
    });
  }, [rawAssignments, selectedClassId, searchQuery, activeStatusFilter]);

  // Overall counts for stats cards based on class filter
  const classAssignments = useMemo(() => {
    return selectedClassId === 'all' 
      ? rawAssignments 
      : rawAssignments.filter(a => String(a.classId) === String(selectedClassId));
  }, [rawAssignments, selectedClassId]);

  const stats = {
    notStarted: classAssignments.filter(a => a.status === 'not_started').length,
    grading: classAssignments.filter(a => a.status === 'pending' || a.status === 'ai_processing' || a.status === 'in_progress').length,
    graded: classAssignments.filter(a => a.status === 'graded').length,
  };

  const selectedClass = classes.find(c => String(c.id) === String(selectedClassId));

  // Helper to render type icons & colors
  const getTypeBadge = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('writing')) {
      return {
        icon: <PenTool size={18} strokeWidth={2.2} />,
        bg: '#F5F3FF',
        color: '#7C3AED',
        label: type
      };
    }
    if (lower.includes('speaking')) {
      return {
        icon: <Mic size={18} strokeWidth={2.2} />,
        bg: '#FFF1F2',
        color: '#E11D48',
        label: type
      };
    }
    if (lower.includes('reading')) {
      return {
        icon: <BookOpen size={18} strokeWidth={2.2} />,
        bg: '#EFF6FF',
        color: '#2563EB',
        label: type
      };
    }
    if (lower.includes('listening')) {
      return {
        icon: <Headphones size={18} strokeWidth={2.2} />,
        bg: '#FFFBEB',
        color: '#D97706',
        label: type
      };
    }
    return {
      icon: <FileText size={18} strokeWidth={2.2} />,
      bg: '#F1F5F9',
      color: '#475569',
      label: type
    };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* 1. Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
            {t('studentAssignments.title')}
          </h1>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            padding: '3px 10px', 
            borderRadius: '9999px', 
            backgroundColor: '#EEF2FF', 
            color: '#4F46E5' 
          }}>
            {classAssignments.length} {t('studentAssignments.unitAssignments')}
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
          {t('studentAssignments.subtitle')}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991B1B' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAssignmentsData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', backgroundColor: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            <RefreshCw size={14} /> {t('studentAssignments.retry')}
          </button>
        </div>
      )}

      {/* 2. Top Summary Stat Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '16px', 
        marginBottom: '28px' 
      }}>
        {/* Card 1: Not Started */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              {isLoading ? '...' : stats.notStarted}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              {t('studentAssignments.statNotStarted')}
            </div>
          </div>
        </div>

        {/* Card 2: Grading in Progress */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              {isLoading ? '...' : stats.grading}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              {t('studentAssignments.statGrading')}
            </div>
          </div>
        </div>

        {/* Card 3: Graded & Feedback */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: '#F0FDF4',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              {isLoading ? '...' : stats.graded}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              {t('studentAssignments.statGraded')}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Class Filter & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Class Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="student-class-select" style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>
            {t('studentAssignments.filterClassLabel')}
          </label>
          <select
            id="student-class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 500,
              color: '#0F172A',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">{t('studentAssignments.filterAllClasses')}</option>
            {classes.map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div style={{
          position: 'relative',
          width: '280px'
        }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('studentAssignments.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Selected Class Info Banner if filtered */}
      {selectedClass && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Layers size={16} color="#64748B" />
          <span>{t('studentAssignments.viewingClassPrefix')}<strong>{selectedClass.name}</strong></span>
        </div>
      )}

      {/* 4. Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '12px',
        marginBottom: '20px'
      }}>
        <button
          type="button"
          onClick={() => setActiveStatusFilter('all')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: activeStatusFilter === 'all' ? 600 : 500,
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeStatusFilter === 'all' ? '#0F172A' : '#F1F5F9',
            color: activeStatusFilter === 'all' ? '#FFFFFF' : '#475569',
            cursor: 'pointer'
          }}
        >
          {t('studentAssignments.tabAll')} ({classAssignments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter('not_started')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: activeStatusFilter === 'not_started' ? 600 : 500,
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeStatusFilter === 'not_started' ? '#DC2626' : '#F1F5F9',
            color: activeStatusFilter === 'not_started' ? '#FFFFFF' : '#475569',
            cursor: 'pointer'
          }}
        >
          {t('studentAssignments.tabNotStarted')} ({stats.notStarted})
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter('grading')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: activeStatusFilter === 'grading' ? 600 : 500,
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeStatusFilter === 'grading' ? '#D97706' : '#F1F5F9',
            color: activeStatusFilter === 'grading' ? '#FFFFFF' : '#475569',
            cursor: 'pointer'
          }}
        >
          {t('studentAssignments.tabGrading')} ({stats.grading})
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter('graded')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: activeStatusFilter === 'graded' ? 600 : 500,
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeStatusFilter === 'graded' ? '#16A34A' : '#F1F5F9',
            color: activeStatusFilter === 'graded' ? '#FFFFFF' : '#475569',
            cursor: 'pointer'
          }}
        >
          {t('studentAssignments.tabGraded')} ({stats.graded})
        </button>
      </div>

      {/* 5. Assignments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ height: 80, borderRadius: 10, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 80, borderRadius: 10, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 80, borderRadius: 10, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }} />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            color: '#64748B'
          }}>
            <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>
              {t('studentAssignments.emptyTitle')}
            </div>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {t('studentAssignments.emptyDesc')}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const badge = getTypeBadge(assignment.type);
            return (
              <div
                key={assignment.id}
                onClick={() => {
                  if (assignment.status === 'graded') {
                    navigate(assignment.submissionId ? `/student/submissions/${assignment.submissionId}` : `/student/assignments/${assignment.id}/result`);
                  } else if (assignment.status === 'not_started') {
                    navigate(`/student/assignments/${assignment.id}/overview`);
                  } else {
                    navigate(getAssignmentRoute(assignment));
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#94A3B8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Left: Icon & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {badge.icon}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: badge.bg,
                        color: badge.color
                      }}>
                        {assignment.type}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        {assignment.className}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                      {assignment.title}
                    </h3>

                    {/* Metadata & Deadlines */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748B', marginTop: '6px', flexWrap: 'wrap' }}>
                      {assignment.submittedOn ? (
                        <span>{t('studentAssignments.submittedOn')}{assignment.submittedOn}</span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: assignment.daysLeft && assignment.daysLeft <= 2 ? '#DC2626' : '#64748B', fontWeight: assignment.daysLeft && assignment.daysLeft <= 2 ? 600 : 400 }}>
                          <Calendar size={13} />
                          {t('studentAssignments.deadlinePrefix')}{assignment.deadline || t('studentAssignments.noDeadline')}
                        </span>
                      )}

                      {assignment.score !== undefined && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#059669', fontWeight: 700 }}>
                            {t('studentAssignments.scorePrefix')}{assignment.score}/100 (Band {(assignment.score / 100 * 9).toFixed(1)})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Clean Status Badge & Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {(assignment.status === 'pending' || assignment.status === 'ai_processing') && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#B45309', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      padding: '5px 12px', 
                      backgroundColor: '#FFFBEB', 
                      borderRadius: '9999px', 
                      border: '1px solid #FDE68A' 
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                      {t('studentAssignments.statusGrading')}
                    </div>
                  )}

                  {assignment.status === 'in_progress' && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#2563EB', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      padding: '5px 12px', 
                      backgroundColor: '#EFF6FF', 
                      borderRadius: '9999px', 
                      border: '1px solid #BFDBFE' 
                    }}>
                      <Clock size={12} />
                      {t('studentAssignments.statusInProgress')}
                    </div>
                  )}

                  {assignment.status === 'graded' && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#059669', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      padding: '5px 12px', 
                      backgroundColor: '#ECFDF5', 
                      borderRadius: '9999px', 
                      border: '1px solid #A7F3D0' 
                    }}>
                      <CheckCircle2 size={13} strokeWidth={2.2} />
                      {t('studentAssignments.tabGraded')}
                    </div>
                  )}

                  {assignment.status === 'not_started' && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#475569', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      padding: '5px 12px', 
                      backgroundColor: '#F1F5F9', 
                      borderRadius: '9999px', 
                      border: '1px solid #E2E8F0' 
                    }}>
                      <Clock size={13} strokeWidth={2} />
                      {t('studentAssignments.tabNotStarted')}
                    </div>
                  )}

                  {/* Action CTA Button */}
                  <button
                    type="button"
                    style={{
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: assignment.status === 'not_started' ? 'none' : '1px solid #CBD5E1',
                      backgroundColor: assignment.status === 'not_started' ? '#2563EB' : '#FFFFFF',
                      color: assignment.status === 'not_started' ? '#FFFFFF' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (assignment.status === 'graded') {
                        navigate(assignment.submissionId ? `/student/submissions/${assignment.submissionId}` : `/student/assignments/${assignment.id}/result`);
                      } else if (assignment.status === 'not_started') {
                        navigate(`/student/assignments/${assignment.id}/overview`);
                      } else {
                        navigate(getAssignmentRoute(assignment));
                      }
                    }}
                  >
                    {assignment.status === 'not_started'
                      ? t('studentAssignments.btnStartNow')
                      : assignment.status === 'graded'
                        ? t('studentAssignments.btnFeedback')
                        : assignment.status === 'in_progress'
                          ? t('studentAssignments.btnContinue')
                          : t('studentAssignments.btnReview')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Footer / Synchronization info */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '28px',
        paddingTop: '16px',
        borderTop: '1px solid #F1F5F9',
        fontSize: '13px', 
        color: '#64748B',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          {t('studentAssignments.paginationPrefix')}<strong>{filteredAssignments.length}</strong>{t('studentAssignments.paginationMid')}<strong>{classAssignments.length}</strong>{t('studentAssignments.unitAssignments')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 500 }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: '#10B981', 
            display: 'inline-block' 
          }}></span>
          {t('studentAssignments.syncStatusRealtime')}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;
