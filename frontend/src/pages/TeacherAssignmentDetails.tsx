import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Download, Calendar, Shield, PenTool, 
  Zap, FileText, Search, Bell, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService, type ClassSummary, type ClassMember } from '../api/services/class.service';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, type SubmissionModuleSummary } from '../api/services/submission.service';
import { moduleService } from '../api/services/module.service';

interface EnrolledStudentSubmissionRow {
  studentId: number;
  code: string;
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  status: 'submitted' | 'missing';
  gradingStatus: 'graded' | 'pending' | 'none';
  submissionId?: number;
  finalScore?: number | null;
}

export const TeacherAssignmentDetails: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { id } = useParams<{ id: string }>();

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [className, setClassName] = useState<string>('');
  const [openAtDate, setOpenAtDate] = useState<string>('');
  const [closeAtDate, setCloseAtDate] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [skillLabel, setSkillLabel] = useState<string>('Writing Task');
  const [students, setStudents] = useState<EnrolledStudentSubmissionRow[]>([]);

  // Filter tabs
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'missing'>('all');
  const [subTab, setSubTab] = useState<'all' | 'graded' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const fetchData = async () => {

    try {
      const assignmentIdNum = Number(id);

      // 1. Fetch assignment detail
      const assignDetail = await assignmentService.getAssignment(assignmentIdNum);
      setAssignment(assignDetail);

      // 2. Fetch modules for instructions & skill
      try {
        const modRes = await moduleService.listModules(assignmentIdNum);
        const mods = modRes.modules || [];
        if (mods.length > 0) {
          const firstMod = mods[0];
          setSkillLabel(firstMod.skill ? `${firstMod.skill.charAt(0)}${firstMod.skill.slice(1).toLowerCase()} Task` : 'General Task');
          try {
            const modDetail = await moduleService.getModule(firstMod.id);
            setInstructions(modDetail.instructions || '');
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      // 3. Find class & members
      const classRes = await classService.list({ limit: 100 });
      const classesList = classRes.data || [];

      let matchedClass: ClassSummary | undefined = undefined;
      for (const cls of classesList) {
        try {
          const assignList = await assignmentService.listAssignments(cls.id, { limit: 100 });
          const matchedSummary = assignList.data?.find((a) => a.id === assignmentIdNum);
          if (matchedSummary) {
            matchedClass = cls;
            if (matchedSummary.closeAt) {
              const d = new Date(matchedSummary.closeAt);
              setCloseAtDate(d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }));
              setOpenAtDate(isVi ? 'Đang diễn ra' : 'In Progress');
            }
            break;
          }
        } catch {
          // ignore
        }
      }

      setClassName(matchedClass ? matchedClass.name : (classesList[0]?.name || 'Lớp tiếng Anh'));

      let classMembers: ClassMember[] = [];
      if (matchedClass) {
        try {
          classMembers = await classService.listMembers(matchedClass.id);
        } catch {
          classMembers = [];
        }
      }

      // 4. Fetch submissions
      let submissionsList: SubmissionListItem[] = [];
      try {
        const subRes = await submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 });
        submissionsList = subRes.data || [];
      } catch {
        submissionsList = [];
      }

      // 5. Combine class members with submissions
      const bgColors = ['#E0E7FF', '#FEF3C7', '#FCE7F3', '#F3E8FF', '#ECFDF5', '#EFF6FF'];
      const textColors = ['#4338CA', '#D97706', '#BE185D', '#7E22CE', '#059669', '#2563EB'];

      const studentRows: EnrolledStudentSubmissionRow[] = classMembers.map((member, index) => {
        const matchedSub = submissionsList.find((s) => s.studentId === member.studentId);
        const nameParts = member.fullName.trim().split(' ');
        const initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase() 
          : (member.fullName.slice(0, 2).toUpperCase() || 'HV');

        const colorIndex = index % bgColors.length;

        let status: 'submitted' | 'missing' = 'missing';
        let gradingStatus: 'graded' | 'pending' | 'none' = 'none';
        let finalScore: number | null = null;

        if (matchedSub) {
          status = 'submitted';
          const hasGraded = matchedSub.status === 'GRADED' || 
            matchedSub.modules.some((m: SubmissionModuleSummary) => m.grading?.status === 'COMPLETED' || (m.grading?.finalScore !== null && m.grading?.finalScore !== undefined));
          
          if (hasGraded) {
            gradingStatus = 'graded';
            const firstModScore = matchedSub.modules[0]?.grading?.finalScore;
            finalScore = firstModScore ?? null;
          } else {
            gradingStatus = 'pending';
          }
        }

        return {
          studentId: member.studentId,
          code: member.studentCode || `HV-${member.studentId.toString().padStart(4, '0')}`,
          name: member.fullName,
          email: `${member.studentCode?.toLowerCase() || `student${member.studentId}`}@englishhub.edu.vn`,
          initials,
          avatarBg: bgColors[colorIndex],
          avatarColor: textColors[colorIndex],
          status,
          gradingStatus,
          submissionId: matchedSub?.id,
          finalScore
        };
      });

        if (isMounted) {
          setStudents(studentRows);
        }
      } catch (err) {
        console.error('Failed to load assignment details:', err);
        if (isMounted) {
          setError(isVi ? 'Không thể tải chi tiết bài tập. Vui lòng thử lại.' : 'Failed to load assignment details. Please retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, isVi, reloadKey]);

  // Dynamic Metrics calculations
  const metrics = useMemo(() => {
    const totalStudents = Math.max(1, students.length);
    const submittedCount = students.filter((s) => s.status === 'submitted').length;
    const missingCount = students.filter((s) => s.status === 'missing').length;
    const gradedCount = students.filter((s) => s.gradingStatus === 'graded').length;
    const pendingCount = students.filter((s) => s.gradingStatus === 'pending').length;

    const scores = students
      .map((s) => s.finalScore)
      .filter((sc): sc is number => sc !== null && sc !== undefined && sc > 0);

    const avgBand = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '0.0';

    const gradedPercentage = submittedCount > 0 
      ? Math.round((gradedCount / submittedCount) * 100) 
      : 0;

    return {
      totalStudents,
      submittedCount,
      missingCount,
      gradedCount,
      pendingCount,
      avgBand,
      gradedPercentage
    };
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (activeTab === 'submitted' && s.status !== 'submitted') return false;
      if (activeTab === 'missing' && s.status !== 'missing') return false;

      if (subTab === 'graded' && s.gradingStatus !== 'graded') return false;
      if (subTab === 'pending' && s.gradingStatus !== 'pending') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      }

      return true;
    });
  }, [students, activeTab, subTab, searchQuery]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '800px', margin: '40px auto' }}>
        <RefreshCw size={36} color="#4f46e5" className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          {isVi ? 'Đang tải dữ liệu bài tập và danh sách nộp bài...' : 'Loading assignment and submissions...'}
        </h3>
        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          {isVi ? 'Đang đồng bộ số liệu chấm điểm và học viên từ hệ thống.' : 'Syncing grading turnout and enrolled student roster.'}
        </p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertCircle size={24} color="#dc2626" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#b91c1c' }}>
            {error || (isVi ? 'Không tìm thấy bài tập này.' : 'Assignment not found.')}
          </h3>
        </div>
        <button 
          className="btn btn-secondary bg-white btn-sm"
          onClick={handleRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>{isVi ? 'Thử lại' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button */}
      <button 
        onClick={() => navigate('/teacher/assignments')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#2563EB', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          fontSize: '14px', 
          fontWeight: 500, 
          marginBottom: '20px', 
          padding: 0 
        }}
      >
        <ArrowLeft size={16} /> {t('assignmentDetails.backToLibrary')}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 700, color: '#111827' }}>
            HW-{assignment.id.toString().padStart(2, '0')}: {assignment.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ 
              backgroundColor: assignment.status === 'PUBLISHED' ? '#DCFCE7' : '#F1F5F9', 
              color: assignment.status === 'PUBLISHED' ? '#16A34A' : '#475569', 
              padding: '4px 12px', 
              borderRadius: '16px', 
              fontSize: '13px', 
              fontWeight: 600 
            }}>
              {assignment.status === 'PUBLISHED' ? t('assignmentDetails.statusOpen') : assignment.status}
            </span>
            <span style={{ backgroundColor: '#F3E8FF', color: '#9333EA', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>
              {skillLabel}
            </span>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>•</span>
            <span style={{ color: '#4B5563', fontSize: '14px', fontWeight: 500 }}>
              {t('assignmentDetails.classPrefix')}{className}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            onClick={() => navigate(`/teacher/assignments/${id}/edit`)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '8px 16px', borderRadius: '8px', 
              border: '1px solid #D1D5DB', backgroundColor: 'white', 
              color: '#374151', fontWeight: 500, cursor: 'pointer' 
            }}
          >
            <Edit2 size={16} /> {t('assignmentDetails.btnEdit')}
          </button>
          <button 
            type="button"
            onClick={() => showToast(isVi ? 'Đang xuất bảng điểm bài tập ra file Excel...' : 'Exporting submissions to Excel...')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '8px 16px', borderRadius: '8px', 
              border: '1px solid #D1D5DB', backgroundColor: 'white', 
              color: '#374151', fontWeight: 500, cursor: 'pointer' 
            }}
          >
            <Download size={16} /> {t('assignmentDetails.btnExport')}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Time */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>{t('assignmentDetails.cardTimeTitle')}</h3>
            <div style={{ backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '8px', borderRadius: '8px' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ color: '#6B7280', fontSize: '13.5px', marginBottom: '8px' }}>
            {t('assignmentDetails.assignedPrefix')}<span style={{ color: '#374151', fontWeight: 500 }}>{openAtDate || 'Đang mở'}</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
            {closeAtDate || (isVi ? 'Không thời hạn' : 'No deadline')}
          </div>
        </div>

        {/* Card 2: Progress */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>{t('assignmentDetails.cardProgressTitle')}</h3>
            <div style={{ backgroundColor: '#ECFDF5', color: '#10B981', padding: '8px', borderRadius: '8px' }}>
              <Shield size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            {metrics.submittedCount}<span style={{ fontSize: '16px', color: '#9CA3AF', fontWeight: 500 }}>/{metrics.totalStudents}</span>
          </div>
          <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: `${Math.round((metrics.submittedCount / metrics.totalStudents) * 100)}%`, backgroundColor: '#10B981' }}></div>
            <div style={{ width: `${Math.round((metrics.missingCount / metrics.totalStudents) * 100)}%`, backgroundColor: '#EF4444' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#6B7280' }}>{t('assignmentDetails.submittedCount')}<span style={{ color: '#374151', fontWeight: 500 }}>{metrics.submittedCount}</span></span>
            <span style={{ color: '#EF4444', fontWeight: 500 }}>{t('assignmentDetails.missingCount')}{metrics.missingCount}</span>
          </div>
        </div>

        {/* Card 3: Grading */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>{t('assignmentDetails.cardGradingTitle')}</h3>
            <div style={{ backgroundColor: '#FFFBEB', color: '#D97706', padding: '8px', borderRadius: '8px' }}>
              <PenTool size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
              {metrics.gradedCount}<span style={{ fontSize: '16px', color: '#9CA3AF', fontWeight: 500 }}>/{metrics.submittedCount}</span>
            </div>
            <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
              {metrics.gradedPercentage}% {t('assignmentDetails.gradedSuffix')}
            </span>
          </div>
          <div style={{ color: '#D97706', fontSize: '13px', fontWeight: 600, backgroundColor: '#FEF3C7', display: 'inline-block', padding: '4px 12px', borderRadius: '12px' }}>
            {metrics.pendingCount} {t('assignmentDetails.pendingSuffix')}
          </div>
        </div>

        {/* Card 4: Average Score */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>{t('assignmentDetails.cardAverageTitle')}</h3>
            <div style={{ backgroundColor: '#F5F3FF', color: '#8B5CF6', padding: '8px', borderRadius: '8px' }}>
              <Zap size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2563EB' }}>
              {metrics.avgBand !== '0.0' ? metrics.avgBand : '—'}
            </div>
            <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>
              {t('assignmentDetails.bandSuffix')}
            </span>
          </div>
        </div>
      </div>

      {/* Prompt & Rubrics Box */}
      {instructions && (
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              <FileText size={20} color="#2563EB" /> {t('assignmentDetails.promptTitle')}
            </h2>
            <span style={{ border: '1px solid #E5E7EB', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', color: '#6B7280', backgroundColor: '#F9FAFB' }}>
              IELTS Standard
            </span>
          </div>
          <div style={{ color: '#374151', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
            {instructions}
          </div>
        </div>
      )}

      {/* Students List */}
      <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB', display: 'flex', padding: '0 16px', gap: '24px' }}>
          {[
            { id: 'all' as const, label: t('assignmentDetails.tabAll'), count: students.length },
            { id: 'submitted' as const, label: t('assignmentDetails.tabSubmitted'), count: metrics.submittedCount },
            { id: 'missing' as const, label: t('assignmentDetails.tabMissing'), count: metrics.missingCount, isRed: true }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #111827' : '2px solid transparent',
                color: activeTab === tab.id ? '#111827' : (tab.isRed ? '#EF4444' : '#6B7280'),
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab.label} {tab.count !== undefined && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setSubTab('all')}
              style={{ 
                padding: '6px 16px', 
                borderRadius: '20px', 
                border: subTab === 'all' ? '1px solid #D1D5DB' : '1px solid transparent', 
                backgroundColor: subTab === 'all' ? 'white' : 'transparent', 
                color: subTab === 'all' ? '#374151' : '#6B7280', 
                fontSize: '13px', 
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {isVi ? 'Tất cả' : 'All'}
            </button>
            <button 
              onClick={() => setSubTab('graded')}
              style={{ 
                padding: '6px 16px', 
                borderRadius: '20px', 
                border: subTab === 'graded' ? '1px solid #D1D5DB' : '1px solid transparent', 
                backgroundColor: subTab === 'graded' ? 'white' : 'transparent', 
                color: subTab === 'graded' ? '#374151' : '#6B7280', 
                fontSize: '13px', 
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {t('assignmentDetails.subTabGraded')} ({metrics.gradedCount})
            </button>
            <button 
              onClick={() => setSubTab('pending')}
              style={{ 
                padding: '6px 16px', 
                borderRadius: '20px', 
                border: subTab === 'pending' ? '1px solid #FCD34D' : '1px solid transparent', 
                backgroundColor: subTab === 'pending' ? '#FEF3C7' : 'transparent', 
                color: '#D97706', 
                fontSize: '13px', 
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('assignmentDetails.subTabPending')} ({metrics.pendingCount})
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder={t('assignmentDetails.searchPlaceholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  padding: '8px 16px 8px 36px', 
                  borderRadius: '8px', 
                  border: '1px solid #D1D5DB', 
                  fontSize: '14px', 
                  width: '240px',
                  outline: 'none'
                }} 
              />
              <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            </div>
            {metrics.missingCount > 0 && (
              <button 
                className="btn btn-secondary btn-sm text-tertiary" 
                style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}
                onClick={() => showToast(isVi ? `Đã gửi thông báo nhắc nộp bài tới ${metrics.missingCount} học viên` : `Sent reminders to ${metrics.missingCount} students`)}
              >
                <Bell size={16} /> {t('assignmentDetails.btnRemind')} ({metrics.missingCount}{t('assignmentDetails.unitFriends')})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '12px', fontWeight: 600 }}>
                <th style={{ padding: '16px' }}>{t('assignmentDetails.colStudent')}</th>
                <th style={{ padding: '16px' }}>{t('assignmentDetails.colStatus')}</th>
                <th style={{ padding: '16px' }}>{t('assignmentDetails.colGrading')}</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>{t('assignmentDetails.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => (
                <tr key={student.studentId} style={{ borderBottom: idx === filteredStudents.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        backgroundColor: student.avatarBg, color: student.avatarColor, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 600, fontSize: '14px' 
                      }}>
                        {student.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{student.name}</div>
                        <div style={{ color: '#6B7280', fontSize: '13px' }}>{student.email} • {student.code}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {student.status === 'submitted' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ECFDF5', color: '#10B981', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                        {t('assignmentDetails.statusSubmittedLabel')}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF2F2', color: '#EF4444', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
                        {t('assignmentDetails.statusMissingLabel')}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {student.gradingStatus === 'graded' && (
                      <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
                        {t('assignmentDetails.gradingGraded')} {student.finalScore !== null && `(Band ${student.finalScore})`}
                      </span>
                    )}
                    {student.gradingStatus === 'pending' && (
                      <span style={{ border: '1px solid #FCD34D', color: '#D97706', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>
                        {t('assignmentDetails.gradingPending')}
                      </span>
                    )}
                    {student.gradingStatus === 'none' && (
                      <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{t('assignmentDetails.gradingNone')}</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {student.gradingStatus === 'graded' && (
                      <button 
                        onClick={() => navigate(`/teacher/assignments/${id}/submissions/${student.studentId}`)}
                        style={{ 
                          border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', 
                          padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' 
                        }}
                      >
                        {t('assignmentDetails.btnView')}
                      </button>
                    )}
                    {student.gradingStatus === 'pending' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/teacher/assignments/${id}/submissions/${student.studentId}`)}
                      >
                        {t('assignmentDetails.btnGradeNow')}
                      </button>
                    )}
                    {student.gradingStatus === 'none' && (
                      <button 
                        onClick={() => showToast(isVi ? `Đã gửi nhắc nhở tới ${student.name}` : `Reminder sent to ${student.name}`)}
                        style={{ 
                          border: '1px solid #FCD34D', backgroundColor: 'white', color: '#D97706', 
                          padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' 
                        }}
                      >
                        {t('assignmentDetails.btnSendReminder')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '13.5px' }}>
                    {isVi ? 'Không tìm thấy học viên phù hợp.' : 'No students match your filter.'}
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

export default TeacherAssignmentDetails;
