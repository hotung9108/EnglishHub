import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, RotateCcw, FileText } from 'lucide-react';
import { classService, type ClassDetail } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';

interface EnrichedClassAssignment {
  id: string;
  title: string;
  dueDate?: string;
  skill: string;
  status: 'not_started' | 'pending' | 'graded';
  score?: number;
  submissionId?: string;
}

const StudentClassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [assignments, setAssignments] = useState<EnrichedClassAssignment[]>([]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const numericId = Number(id);
      const isNum = !isNaN(numericId);
      const targetClassId = isNum ? numericId : 1;

      const [classRes, assignmentsRes, submissionsRes] = await Promise.allSettled([
        isNum ? classService.getDetail(numericId) : Promise.reject('Invalid ID'),
        assignmentService.listAssignments(targetClassId),
        submissionService.listSubmissions({ studentId: user?.id })
      ]);

      let detail: ClassDetail | null = null;
      if (classRes.status === 'fulfilled' && classRes.value) {
        detail = classRes.value;
      } else {
        detail = {
          id: targetClassId,
          name: `Lớp học #${targetClassId}`,
          status: 'ACTIVE',
          teacher: undefined,
          level: undefined
        };
      }
      setClassDetail(detail);

      const rawAssignments: AssignmentSummary[] = assignmentsRes.status === 'fulfilled'
        ? (assignmentsRes.value?.data || (Array.isArray(assignmentsRes.value) ? assignmentsRes.value : []))
        : [];

      const rawSubmissions: SubmissionListItem[] = submissionsRes.status === 'fulfilled'
        ? (submissionsRes.value?.data || (Array.isArray(submissionsRes.value) ? submissionsRes.value : []))
        : [];

      if (rawAssignments.length > 0) {
        const mapped = rawAssignments.map(a => {
          const sub = rawSubmissions.find(s => String(s.assignmentId) === String(a.id) || String(s.id) === String(a.id));
          let status: 'not_started' | 'pending' | 'graded' = 'not_started';
          if (sub) {
            status = sub.status === 'GRADED' ? 'graded' : 'pending';
          }

          let skill = 'Writing';
          const titleLower = a.title.toLowerCase();
          if (titleLower.includes('speak')) skill = 'Speaking';
          else if (titleLower.includes('read')) skill = 'Reading';
          else if (titleLower.includes('listen')) skill = 'Listening';

          const scoreVal = sub?.modules?.[0]?.grading?.finalScore ?? undefined;

          return {
            id: String(a.id),
            title: a.title,
            dueDate: a.closeAt ? new Date(a.closeAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : (isVi ? 'Không có hạn nộp' : 'No deadline'),
            skill,
            status,
            score: scoreVal !== undefined && scoreVal !== null ? scoreVal : undefined,
            submissionId: sub?.id ? String(sub.id) : undefined
          };
        });
        setAssignments(mapped);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('Failed to load class details', err);
      setError('Không thể tải thông tin chi tiết lớp học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [id, user?.id]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const notStarted = assignments.filter(a => a.status === 'not_started').length;
    const pending = assignments.filter(a => a.status === 'pending').length;
    const graded = assignments.filter(a => a.status === 'graded').length;
    return { total, notStarted, pending, graded };
  }, [assignments]);

  const handleAssignmentClick = (assignment: EnrichedClassAssignment) => {
    if (assignment.status === 'graded') {
      navigate(`/student/submissions/${assignment.submissionId || assignment.id}`);
    } else {
      navigate(`/student/assignments/${assignment.id}/overview`);
    }
  };

  if (loading) {
    return (
      <div className="container p-24">
        <div className="skeleton mb-24" style={{ height: '24px', width: '180px', borderRadius: '4px' }}></div>
        <div className="skeleton mb-28" style={{ height: '70px', borderRadius: '12px' }}></div>
        <div className="grid gap-16 mb-32" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '64px', borderRadius: '8px' }}></div>
          ))}
        </div>
        <div className="skeleton" style={{ height: '240px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  const classCode = classDetail?.name.includes('-') ? classDetail.name.split(' ')[0] : `ENG-CLS-${classDetail?.id || id}`;
  const instructorName = classDetail?.teacher?.fullName || (isVi ? 'Giáo viên phụ trách' : 'Instructor');
  const isActive = classDetail?.status !== 'COMPLETED';

  return (
    <div className="container" style={{ padding: '24px' }}>
      {/* Back button */}
      <button 
        onClick={() => navigate('/student/classes')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
      >
        <ArrowLeft size={20} /> Quay lại danh sách lớp
      </button>

      {error && (
        <div className="p-16 mb-24 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchClassDetails} className="btn btn-sm btn-secondary flex items-center gap-6">
            <RotateCcw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Class Header Area */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{classDetail?.name || 'Chi tiết lớp học'}</h1>
            <span style={{ 
              backgroundColor: 'var(--surface-container-low)', 
              color: '#2563EB', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-full)',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #BFDBFE'
            }}>{classCode}</span>
          </div>
          <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Giảng viên: <strong>{instructorName}</strong></span>
            <span>•</span>
            {isActive ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                Đang diễn ra
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                <CheckCircle2 size={12} />
                Đã hoàn thành
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Assignments Section */}
      <div className="card" style={{ padding: '32px', border: '1px solid var(--outline-variant)', boxShadow: 'none', backgroundColor: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px', fontSize: '20px' }}>Danh sách bài tập</h3>
          </div>
          <div className="body-md text-on-surface-variant">
            {t('studentAssignments.totalAssignedPrefix')}<strong style={{ color: 'var(--on-surface)' }}>{stats.total} {t('studentAssignments.unitAssignments')}</strong>
          </div>
        </div>

        {/* Status Summary Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>{t('studentAssignments.statusNotStarted')}</span>
            <span style={{ backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{stats.notStarted}</span>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', border: '2px solid #FBBF24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></span>
              {t('studentAssignments.statusPending')}
            </span>
            <span style={{ backgroundColor: '#FDE68A', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#D97706' }}>{stats.pending}</span>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#16A34A' }}>{t('studentAssignments.statusGraded')}</span>
            <span style={{ backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>{stats.graded}</span>
          </div>
        </div>

        {/* Assignments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {assignments.map(a => (
            <div 
              key={a.id}
              onClick={() => handleAssignmentClick(a)}
              style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#FFFFFF' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>{a.title}</h4>
                  <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #C7D2FE', fontWeight: 600 }}>
                    {a.skill}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                  <span>{t('studentAssignments.deadlinePrefix')}{a.dueDate}</span>
                  {a.score !== undefined && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-primary">Điểm: {a.score}/100</span>
                    </>
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {a.status === 'graded' && (
                  <>
                    <div style={{ color: '#16A34A', fontSize: '13px', fontWeight: 500, padding: '6px 12px', backgroundColor: '#DCFCE7', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                      {t('studentAssignments.statusGraded')}
                    </div>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={(e) => { e.stopPropagation(); handleAssignmentClick(a); }}
                    >
                      {t('studentAssignments.btnReview')}
                    </button>
                  </>
                )}

                {a.status === 'pending' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '13px', fontWeight: 500, padding: '6px 12px', backgroundColor: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                      <Clock size={14} />
                      {t('studentAssignments.statusPending')}
                    </div>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={(e) => { e.stopPropagation(); handleAssignmentClick(a); }}
                    >
                      {t('studentAssignments.btnReview')}
                    </button>
                  </>
                )}

                {a.status === 'not_started' && (
                  <>
                    <div style={{ color: '#475569', fontSize: '13px', fontWeight: 500, padding: '6px 14px', backgroundColor: '#E2E8F0', borderRadius: '6px' }}>
                      {t('studentAssignments.statusNotStarted')}
                    </div>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={(e) => { e.stopPropagation(); handleAssignmentClick(a); }}
                    >
                      {t('studentAssignments.btnStart')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {assignments.length === 0 && (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Chưa có bài tập nào được giao cho lớp này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentClassDetails;
