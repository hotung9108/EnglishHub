import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, RotateCcw, FileText } from 'lucide-react';
import { classService, type ClassDetail } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, isSubmissionGraded, getSubmissionFinalScore } from '../api/services/submission.service';
import { Button, EmptyState, Skeleton } from '../components/common';
import '../styles/student-ecosystem.css';

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

  const [reloadKey, setReloadKey] = useState(0);
  const handleReload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

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

        if (!isMounted) return;

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
              status = isSubmissionGraded(sub) ? 'graded' : 'pending';
            }

            let skill = 'Writing';
            const titleLower = a.title.toLowerCase();
            if (titleLower.includes('speak')) skill = 'Speaking';
            else if (titleLower.includes('read')) skill = 'Reading';
            else if (titleLower.includes('listen')) skill = 'Listening';

            const finalSc = sub ? getSubmissionFinalScore(sub) : null;
            const scoreVal = finalSc !== null && finalSc !== undefined ? finalSc : undefined;

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
        if (!isMounted) return;
        console.error('Failed to load class details', err);
        setError('Không thể tải thông tin chi tiết lớp học.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchClassDetails();

    return () => {
      isMounted = false;
    };
  }, [id, user?.id, isVi, reloadKey]);

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
      <div className="std-eco-container pb-48">
        <Skeleton height="24px" width="180px" borderRadius="4px" className="mb-24" />
        <Skeleton height="70px" borderRadius="12px" className="mb-28" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-32">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height="64px" borderRadius="8px" />
          ))}
        </div>
        <Skeleton height="240px" borderRadius="12px" />
      </div>
    );
  }

  const classCode = classDetail?.name.includes('-') ? classDetail.name.split(' ')[0] : `ENG-CLS-${classDetail?.id || id}`;
  const instructorName = classDetail?.teacher?.fullName || (isVi ? 'Giáo viên phụ trách' : 'Instructor');
  const isActive = classDetail?.status !== 'COMPLETED';

  return (
    <div className="std-eco-container pb-48">
      {/* Back button */}
      <div className="mb-20">
        <Button 
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/student/classes')} 
        >
          {isVi ? 'Quay lại danh sách lớp' : 'Back to Classes'}
        </Button>
      </div>

      {error && (
        <div className="analytics-error-banner">
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={handleReload}>
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Class Header Area */}
      <div className="std-eco-header">
        <div>
          <div className="flex items-center gap-12 mb-8">
            <h1 className="std-eco-title">{classDetail?.name || 'Chi tiết lớp học'}</h1>
            <span className="std-asg-count-badge">{classCode}</span>
          </div>
          <div className="flex items-center gap-12 text-sm text-slate-500">
            <span>Giảng viên: <strong className="text-slate-800">{instructorName}</strong></span>
            <span>•</span>
            {isActive ? (
              <span className="analytics-badge-good flex items-center gap-6">
                <span className="std-asg-dot bg-emerald-500" />
                Đang diễn ra
              </span>
            ) : (
              <span className="std-asg-status-badge not-started flex items-center gap-6">
                <CheckCircle2 size={12} />
                Đã hoàn thành
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Assignments Section */}
      <div className="std-eco-card">
        <div className="std-eco-card-header">
          <h2 className="std-eco-card-title">Danh sách bài tập</h2>
          <div className="text-sm text-slate-500">
            {t('studentAssignments.totalAssignedPrefix')}<strong className="text-slate-800 ml-4">{stats.total} {t('studentAssignments.unitAssignments')}</strong>
          </div>
        </div>

        <div className="std-eco-card-body">
          {/* Status Summary Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-28">
            <div className="p-16 rounded-lg border border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-medium text-slate-600">{t('studentAssignments.statusNotStarted')}</span>
              <span className="bg-slate-200 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-700">{stats.notStarted}</span>
            </div>
            <div className="p-16 rounded-lg border border-amber-300 flex justify-between items-center bg-amber-50">
              <span className="text-sm font-semibold text-amber-700 flex items-center gap-6">
                <span className="std-asg-dot" />
                {t('studentAssignments.statusPending')}
              </span>
              <span className="bg-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold text-amber-800">{stats.pending}</span>
            </div>
            <div className="p-16 rounded-lg border border-emerald-300 flex justify-between items-center bg-emerald-50">
              <span className="text-sm font-medium text-emerald-700">{t('studentAssignments.statusGraded')}</span>
              <span className="bg-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold text-emerald-800">{stats.graded}</span>
            </div>
          </div>

          {/* Assignments List */}
          <div className="std-asg-list">
            {assignments.map(a => (
              <div 
                key={a.id}
                onClick={() => handleAssignmentClick(a)}
                className="std-asg-card"
              >
                <div>
                  <div className="flex items-center gap-8 mb-4">
                    <h4 className="std-asg-card-title">{a.title}</h4>
                    <span className={`std-skill-tag ${a.skill.toLowerCase()}`}>
                      {a.skill}
                    </span>
                  </div>
                  <p className="std-asg-card-meta">
                    <span>{t('studentAssignments.deadlinePrefix')}{a.dueDate}</span>
                    {a.score !== undefined && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-primary">Điểm: {a.score}/100</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-12">
                  {a.status === 'graded' && (
                    <>
                      <div className="std-asg-status-badge graded">
                        {t('studentAssignments.statusGraded')}
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleAssignmentClick(a); }}
                      >
                        {t('studentAssignments.btnReview')}
                      </Button>
                    </>
                  )}

                  {a.status === 'pending' && (
                    <>
                      <div className="std-asg-status-badge grading">
                        <Clock size={14} />
                        {t('studentAssignments.statusPending')}
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleAssignmentClick(a); }}
                      >
                        {t('studentAssignments.btnReview')}
                      </Button>
                    </>
                  )}

                  {a.status === 'not_started' && (
                    <>
                      <div className="std-asg-status-badge not-started">
                        {t('studentAssignments.statusNotStarted')}
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleAssignmentClick(a); }}
                      >
                        {t('studentAssignments.btnStart')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {assignments.length === 0 && (
              <EmptyState
                icon={<FileText size={40} />}
                title={isVi ? 'Chưa có bài tập' : 'No assignments'}
                description={isVi ? 'Chưa có bài tập nào được giao cho lớp này.' : 'No assignments have been assigned to this class yet.'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentClassDetails;
