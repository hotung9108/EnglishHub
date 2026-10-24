import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle2, AlertCircle, RotateCcw, FileText } from 'lucide-react';
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
  status: 'not_started' | 'in_progress' | 'pending' | 'graded';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'pending' | 'graded'>('all');

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
          submissionService.listSubmissions({ classId: targetClassId, studentId: user?.id, limit: 100 })
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

        let rawSubmissions: SubmissionListItem[] = submissionsRes.status === 'fulfilled'
          ? (submissionsRes.value?.data || (Array.isArray(submissionsRes.value) ? submissionsRes.value : []))
          : [];

        if (rawSubmissions.length === 0 && user?.id) {
          try {
            const fallbackSubs = await submissionService.listSubmissions({ studentId: user.id, limit: 100 });
            rawSubmissions = fallbackSubs.data || [];
          } catch {
            // Keep empty
          }
        }

        if (rawAssignments.length > 0) {
          const mapped = rawAssignments.map(a => {
            const subsForAssignment = rawSubmissions.filter(s => String(s.assignmentId) === String(a.id));
            let bestSub: SubmissionListItem | undefined = subsForAssignment.find(s => isSubmissionGraded(s));
            if (!bestSub) {
              bestSub = subsForAssignment.find(s => s.status === 'SUBMITTED');
            }
            if (!bestSub) {
              bestSub = subsForAssignment.find(s => s.status === 'IN_PROGRESS');
            }
            if (!bestSub && subsForAssignment.length > 0) {
              bestSub = subsForAssignment[0];
            }

            let status: 'not_started' | 'in_progress' | 'pending' | 'graded' = 'not_started';
            if (bestSub) {
              if (isSubmissionGraded(bestSub)) {
                status = 'graded';
              } else if (bestSub.status === 'SUBMITTED') {
                status = 'pending';
              } else if (bestSub.status === 'IN_PROGRESS') {
                status = 'in_progress';
              }
            }

            let skill = 'Writing';
            const titleLower = a.title.toLowerCase();
            if (titleLower.includes('speak')) skill = 'Speaking';
            else if (titleLower.includes('read')) skill = 'Reading';
            else if (titleLower.includes('listen')) skill = 'Listening';

            const finalSc = bestSub ? getSubmissionFinalScore(bestSub) : null;
            const scoreVal = finalSc !== null && finalSc !== undefined ? finalSc : undefined;

            return {
              id: String(a.id),
              title: a.title,
              dueDate: a.closeAt ? new Date(a.closeAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : (isVi ? 'Không có hạn nộp' : 'No deadline'),
              skill,
              status,
              score: scoreVal !== undefined && scoreVal !== null ? scoreVal : undefined,
              submissionId: bestSub?.id ? String(bestSub.id) : undefined
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
    const pending = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length;
    const graded = assignments.filter(a => a.status === 'graded').length;
    return { total, notStarted, pending, graded };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'all') return assignments;
    if (statusFilter === 'not_started') return assignments.filter(a => a.status === 'not_started');
    if (statusFilter === 'pending') return assignments.filter(a => a.status === 'pending' || a.status === 'in_progress');
    if (statusFilter === 'graded') return assignments.filter(a => a.status === 'graded');
    return assignments;
  }, [assignments, statusFilter]);

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
        <div className="flex gap-8 mb-24">
          <Skeleton height="34px" width="84px" borderRadius="17px" />
          <Skeleton height="34px" width="96px" borderRadius="17px" />
          <Skeleton height="34px" width="96px" borderRadius="17px" />
          <Skeleton height="34px" width="96px" borderRadius="17px" />
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

          {/* Filter Pills: Tất cả, Chưa làm, Chờ chấm, Đã có điểm */}
          <div className="std-eco-pills mb-20">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`std-eco-pill ${statusFilter === 'all' ? 'active' : ''}`}
            >
              {t('studentAssignments.tabAll')} <span className="std-eco-pill-badge">{stats.total}</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('not_started')}
              className={`std-eco-pill ${statusFilter === 'not_started' ? 'active' : ''}`}
            >
              {t('studentAssignments.tabNotStarted')} <span className="std-eco-pill-badge">{stats.notStarted}</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`std-eco-pill ${statusFilter === 'pending' ? 'active' : ''}`}
            >
              {t('studentAssignments.tabGrading')} <span className="std-eco-pill-badge">{stats.pending}</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('graded')}
              className={`std-eco-pill ${statusFilter === 'graded' ? 'active' : ''}`}
            >
              {t('studentAssignments.tabGraded')} <span className="std-eco-pill-badge">{stats.graded}</span>
            </button>
          </div>

          {/* Assignments List */}
          <div className="std-asg-list">
            {filteredAssignments.map(a => (
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

                  {a.status === "in_progress" && (
                    <>
                      <div className="std-asg-status-badge in_progress">
                        {t("studentAssignments.statusInProgress")}
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleAssignmentClick(a); }}
                      >
                        {t("studentAssignments.btnContinue")}
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

            {filteredAssignments.length === 0 && (
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
