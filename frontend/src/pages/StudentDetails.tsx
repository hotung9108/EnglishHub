import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, Phone, Mail, 
  Calendar, Award, BookOpen, ShieldCheck, 
  CheckCircle2, FileText,
  KeyRound, RefreshCw, PenTool,
  Headphones, Mic
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface EnrolledClass {
  id: string;
  code: string;
  name: string;
  teacher: string;
  schedule: string;
  status: 'active' | 'completed';
  attendanceRate: number;
  avgScore: number;
}

interface StudentSubmission {
  id: string;
  title: string;
  skill: 'writing' | 'speaking' | 'reading' | 'listening';
  className: string;
  submittedAt: string;
  attempt: number;
  aiScore: number;
  finalScore: number;
  teacherReviewed: boolean;
  status: 'graded' | 'pending';
}

interface StudentEvaluation {
  id: string;
  teacherName: string;
  date: string;
  type: string;
  content: string;
  recommendation: string;
}

export const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'scores' | 'evaluations' | 'security'>('overview');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Mock student data mapped with student_profiles & users schema
  const student = {
    id: id || 'HV-8801',
    name: id === 'HV-8802' ? 'David Pham' : id === 'HV-8803' ? 'Lê Bảo Trâm' : 'Alice Johnson',
    code: id || 'HV-8801',
    email: id === 'HV-8802' ? 'david.p@student.edu.vn' : id === 'HV-8803' ? 'tram.lb@student.edu.vn' : 'alice.j@student.edu.vn',
    phone: '0912 345 678',
    parentPhone: '0988 776 655',
    dateOfBirth: '2005-08-14',
    entryBand: '5.5 IELTS',
    targetBand: '7.0 IELTS',
    joinedDate: '2025-11-10',
    totalSubmissions: 14,
    overallAvg: 6.8,
    status: 'active'
  };

  const enrolledClasses: EnrolledClass[] = [
    {
      id: 'cls-1',
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5',
      teacher: 'Cô Trần Thị Mai Lan',
      schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
      status: 'active',
      attendanceRate: 96,
      avgScore: 7.0
    },
    {
      id: 'cls-2',
      code: 'ENG-GRAM-PREP',
      name: 'Pre-IELTS Grammar & Academic Collocations',
      teacher: 'Thầy Nguyễn Văn Nam',
      schedule: 'T3 - T5 (19:30 - 21:00)',
      status: 'completed',
      attendanceRate: 100,
      avgScore: 8.2
    }
  ];

  const submissions: StudentSubmission[] = [
    {
      id: 'sub-1',
      title: 'Writing Task 2: Artificial Intelligence & Future Workforce',
      skill: 'writing',
      className: 'ENG-IELTS-6.5A',
      submittedAt: '2026-03-20 21:15',
      attempt: 1,
      aiScore: 6.5,
      finalScore: 7.0,
      teacherReviewed: true,
      status: 'graded'
    },
    {
      id: 'sub-2',
      title: 'Speaking Part 2: Environmental Pollution in Megacities',
      skill: 'speaking',
      className: 'ENG-IELTS-6.5A',
      submittedAt: '2026-03-18 20:45',
      attempt: 2,
      aiScore: 6.5,
      finalScore: 6.5,
      teacherReviewed: true,
      status: 'graded'
    },
    {
      id: 'sub-3',
      title: 'Reading Mock Test Passage 1-3 (Cambridge 19)',
      skill: 'reading',
      className: 'ENG-IELTS-6.5A',
      submittedAt: '2026-03-14 16:30',
      attempt: 1,
      aiScore: 7.5,
      finalScore: 7.5,
      teacherReviewed: false,
      status: 'graded'
    },
    {
      id: 'sub-4',
      title: 'Listening Section 3 & 4 (Campus Discussions)',
      skill: 'listening',
      className: 'ENG-IELTS-6.5A',
      submittedAt: '2026-03-10 19:00',
      attempt: 1,
      aiScore: 7.0,
      finalScore: 7.0,
      teacherReviewed: false,
      status: 'graded'
    }
  ];

  const evaluations: StudentEvaluation[] = [
    {
      id: 'eval-1',
      teacherName: 'Cô Trần Thị Mai Lan',
      date: '2026-03-15',
      type: isVi ? 'Đánh giá giữa kỳ' : 'Midterm Review',
      content: isVi 
        ? 'Học viên có tư duy lập luận logic ở bài Writing Task 2. Cần cải thiện thêm sự tự nhiên trong phát âm (intonation) và phản xạ ở Speaking Part 3.'
        : 'Student shows strong logical cohesion in Writing Task 2. Needs more practice with intonation and spontaneous fluency in Speaking Part 3.',
      recommendation: isVi ? 'Đề xuất tăng cường 2 bài luyện phát âm AI mỗi tuần.' : 'Recommended 2 additional AI pronunciation sessions weekly.'
    },
    {
      id: 'eval-2',
      teacherName: 'Thầy Nguyễn Văn Nam',
      date: '2026-01-20',
      type: isVi ? 'Tổng kết môn Pre-IELTS' : 'Pre-IELTS Course Completion',
      content: isVi 
        ? 'Nắm vững 12 cấu trúc ngữ pháp phức hợp, bài làm viết lại câu đạt độ chính xác cao 92%.'
        : 'Mastered 12 advanced sentence transformation structures, rewrite tasks scored 92% precision.',
      recommendation: isVi ? 'Đủ điều kiện chuyển tiếp thẳng lên lớp IELTS 6.5+.' : 'Eligible for direct enrollment into IELTS 6.5+ band.'
    }
  ];

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'writing': return <PenTool size={16} color="#2563eb" />;
      case 'speaking': return <Mic size={16} color="#d97706" />;
      case 'reading': return <BookOpen size={16} color="#059669" />;
      default: return <Headphones size={16} color="#7c3aed" />;
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setPasswordSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess(false);
      setNewPassword('');
    }, 1500);
  };

  return (
    <div className="adm-container">
      {/* Hero Profile Bento Banner */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 700,
            boxShadow: 'var(--shadow-md)'
          }}>
            {student.name.split(' ').map(n => n[0]).slice(-2).join('')}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px' }}>
              {student.name}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '13.5px', color: 'var(--on-surface-variant)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} /> {student.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={15} /> {student.phone}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} /> {t('studentDetails.parentPhone')}<strong>{student.parentPhone}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> {t('studentDetails.dob')}<strong>{student.dateOfBirth}</strong>
              </span>
            </div>
          </div>

          {/* Target Progress Pill */}
          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg, 12px)',
            background: 'var(--surface-container-high)',
            border: '1px solid var(--outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '220px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span className="text-on-surface-variant">{t('studentDetails.entryBand')}: <strong>{student.entryBand}</strong></span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{student.targetBand}</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--surface-container-highest)', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
              <span>{isVi ? 'ĐTB hiện tại: ' : 'Current Avg: '}<strong>{student.overallAvg}</strong></span>
              <span>{student.totalSubmissions} {isVi ? 'bài đã nộp' : 'submissions'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--outline-variant)', marginBottom: '24px', overflowX: 'auto' }}>
        {(
          [
            { key: 'overview', label: t('studentDetails.infoTitle'), icon: User },
            { key: 'classes', label: t('studentDetails.tabClasses'), icon: BookOpen },
            { key: 'scores', label: t('studentDetails.tabScores'), icon: Award },
            { key: 'evaluations', label: t('studentDetails.tabEvaluations'), icon: FileText },
            { key: 'security', label: t('studentDetails.tabSecurity'), icon: ShieldCheck },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="card">
            <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary)" />
              {isVi ? 'Hồ Sơ CSDL (Student Profile)' : 'Database Student Profile'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{isVi ? 'Mã định danh hệ thống (ID)' : 'System User ID'}</span>
                <span className="font-semibold">{student.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{t('studentDetails.dob')}</span>
                <span className="font-semibold">{student.dateOfBirth}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{t('studentDetails.parentPhone')}</span>
                <span className="font-semibold">{student.parentPhone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{isVi ? 'Ngày nhập học' : 'Enrollment Date'}</span>
                <span className="font-semibold">{student.joinedDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-on-surface-variant">{isVi ? 'Trạng thái học vụ' : 'Academic Status'}</span>
                <span className="badge badge-active">{isVi ? 'Bình thường' : 'Good Standing'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--secondary)" />
              {isVi ? 'Thống Kê Điểm Số 4 Kỹ Năng' : '4-Skill Performance Summary'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>Writing Band</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1d4ed8' }}>7.0</div>
                <div style={{ fontSize: '11px', color: '#3b82f6' }}>+0.5 so với đầu vào</div>
              </div>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>Speaking Band</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#b45309' }}>6.5</div>
                <div style={{ fontSize: '11px', color: '#d97706' }}>Cần cải thiện intonation</div>
              </div>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Reading Band</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d' }}>7.5</div>
                <div style={{ fontSize: '11px', color: '#22c55e' }}>Đạt target 7.5</div>
              </div>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '12px', color: '#6b21a8', fontWeight: 600 }}>Listening Band</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#7e22ce' }}>7.0</div>
                <div style={{ fontSize: '11px', color: '#a855f7' }}>Ổn định Section 1-3</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Enrolled Classes */}
      {activeTab === 'classes' && (
        <div className="card card-flush">
          <div className="card-section-header">
            <h3 className="headline-md card-section-header-title">{t('studentDetails.tabClasses')}</h3>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                  <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                  <th>{isVi ? 'GIÁO VIÊN' : 'TEACHER'}</th>
                  <th>{isVi ? 'LỊCH HỌC' : 'SCHEDULE'}</th>
                  <th>{isVi ? 'CHUYÊN CẦN' : 'ATTENDANCE'}</th>
                  <th>{isVi ? 'ĐIỂM TB' : 'AVG SCORE'}</th>
                  <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                </tr>
              </thead>
              <tbody>
                {enrolledClasses.map((cls) => (
                  <tr key={cls.id}>
                    <td className="font-semibold text-primary">{cls.code}</td>
                    <td className="font-medium">{cls.name}</td>
                    <td>{cls.teacher}</td>
                    <td className="text-on-surface-variant">{cls.schedule}</td>
                    <td>
                      <span className="badge badge-active">{cls.attendanceRate}%</span>
                    </td>
                    <td className="font-semibold">{cls.avgScore}</td>
                    <td>
                      <span className={`badge ${cls.status === 'active' ? 'badge-active' : 'badge-onleave'}`}>
                        {cls.status === 'active' ? (isVi ? 'Đang học' : 'Active') : (isVi ? 'Đã hoàn thành' : 'Completed')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Scores & Submissions */}
      {activeTab === 'scores' && (
        <div className="card card-flush">
          <div className="card-section-header flex-between">
            <h3 className="headline-md card-section-header-title">{t('studentDetails.tabScores')}</h3>
            <span className="label-md text-on-surface-variant">
              {isVi ? 'Hiển thị dữ liệu thực tế từ bảng submissions & gradings' : 'Showing data from submissions & gradings tables'}
            </span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isVi ? 'KỸ NĂNG' : 'SKILL'}</th>
                  <th>{isVi ? 'BÀI TẬP' : 'ASSIGNMENT'}</th>
                  <th>{isVi ? 'LẦN NỘP' : 'ATTEMPT'}</th>
                  <th>{isVi ? 'THỜI GIAN NỘP' : 'SUBMITTED AT'}</th>
                  <th>{isVi ? 'ĐIỂM AI' : 'AI SCORE'}</th>
                  <th>{isVi ? 'ĐIỂM CHỐT' : 'FINAL SCORE'}</th>
                  <th>{isVi ? 'GV DUYỆT' : 'TEACHER REVIEW'}</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getSkillIcon(sub.skill)}
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{sub.skill}</span>
                      </div>
                    </td>
                    <td className="font-medium">{sub.title}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--surface-container-highest)', color: 'var(--on-surface)' }}>
                        #{sub.attempt}
                      </span>
                    </td>
                    <td className="text-on-surface-variant">{sub.submittedAt}</td>
                    <td className="font-semibold text-secondary">{sub.aiScore}</td>
                    <td className="font-bold text-primary">{sub.finalScore}</td>
                    <td>
                      {sub.teacherReviewed ? (
                        <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> {isVi ? 'Đã duyệt' : 'Reviewed'}
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          {isVi ? 'Chưa can thiệp' : 'Auto AI'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Evaluations */}
      {activeTab === 'evaluations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {evaluations.map((ev) => (
            <div key={ev.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '15px' }}>{ev.teacherName}</strong>
                  <span className="badge" style={{ backgroundColor: 'var(--surface-container-high)', fontSize: '12px' }}>{ev.type}</span>
                </div>
                <span className="label-md text-on-surface-variant">{ev.date}</span>
              </div>
              <p className="body-md" style={{ color: 'var(--on-surface)', marginBottom: '8px', lineHeight: 1.6 }}>
                "{ev.content}"
              </p>
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-container-low)', fontSize: '13px', color: 'var(--primary)' }}>
                <strong>{isVi ? 'Khuyến nghị: ' : 'Recommendation: '}</strong>{ev.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Security */}
      {activeTab === 'security' && (
        <div className="card" style={{ maxWidth: '640px' }}>
          <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            {t('studentDetails.tabSecurity')}
          </h3>
          <p className="body-md text-on-surface-variant" style={{ marginBottom: '20px' }}>
            {isVi 
              ? 'Quản trị viên có toàn quyền cấp lại mật khẩu mới hoặc khóa phiên đăng nhập đối với tài khoản học viên này.' 
              : 'Administrators have full privilege to force-reset credentials or revoke active tokens for this student.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowPasswordModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <KeyRound size={16} />
              <span>{t('studentDetails.btnResetPassword')}</span>
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => alert(isVi ? 'Đã thu hồi tất cả refresh_tokens của tài khoản thành công.' : 'All refresh tokens revoked.')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <RefreshCw size={16} />
              <span>{isVi ? 'Đăng xuất khỏi mọi thiết bị (Revoke Sessions)' : 'Revoke All Active Sessions'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 className="headline-md" style={{ marginBottom: '8px' }}>{t('studentDetails.btnResetPassword')}</h3>
            <p className="body-sm text-on-surface-variant" style={{ marginBottom: '16px' }}>
              {isVi ? `Đặt lại mật khẩu cho học viên ${student.name} (${student.code})` : `Set new password for ${student.name}`}
            </p>
            {passwordSuccess ? (
              <div style={{ padding: '16px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 8px' }} />
                {isVi ? 'Đổi mật khẩu thành công!' : 'Password reset successfully!'}
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label-md" style={{ display: 'block', marginBottom: '6px' }}>
                    {isVi ? 'Mật khẩu mới' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Tối thiểu 6 ký tự..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowPasswordModal(false)}
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isVi ? 'Xác nhận' : 'Confirm'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
