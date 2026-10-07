import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, 
  Calendar, Award, BookOpen, ShieldCheck, 
  CheckCircle2, Clock,
  KeyRound, RefreshCw, PenTool,
  Headphones, Mic, Ban, Plus, ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ActiveClass {
  code: string;
  name: string;
  students: number;
  maxStudents: number;
  schedule: string;
  status: 'active' | 'completed';
}

interface TeacherGradingRecord {
  id: string;
  skill: 'writing' | 'speaking' | 'reading' | 'listening';
  title: string;
  studentName: string;
  className: string;
  gradedAt: string;
  aiScore: number;
  finalScore: number;
  status: 'reviewed' | 'pending';
}

export const TeacherDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'gradings' | 'security'>('overview');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [sessionRevoked, setSessionRevoked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Map teacher data based on ID
  const getTeacherData = () => {
    if (id === '2' || id === 'GV-042') {
      return {
        id: '2',
        name: 'Thầy Nguyễn Văn Nam',
        code: 'GV-042',
        avatar: 'VN',
        email: 'nam.nv@center.edu.vn',
        phone: '0912 888 999',
        certs: 'IELTS 8.0 • MA Applied Linguistics',
        joinedDate: '2023-11-15',
        totalGraded: 418,
        avgTurnaround: 18.2
      };
    }
    if (id === '3' || id === 'GV-019') {
      return {
        id: '3',
        name: 'Thầy David Miller',
        code: 'GV-019',
        avatar: 'DM',
        email: 'david.miller@center.edu.vn',
        phone: '0933 777 666',
        certs: 'Native Speaker • CELTA Certified',
        joinedDate: '2024-01-10',
        totalGraded: 289,
        avgTurnaround: 12.0
      };
    }
    if (id === '4' || id === 'GV-033') {
      return {
        id: '4',
        name: 'Cô Nguyễn Thu Trang',
        code: 'GV-033',
        avatar: 'TT',
        email: 'trang.nt@center.edu.vn',
        phone: '0944 333 222',
        certs: 'TOEIC 990/990 • 6 năm luyện thi',
        joinedDate: '2022-09-01',
        totalGraded: 520,
        avgTurnaround: 20.4
      };
    }
    // Default Teacher 1
    return {
      id: id || '1',
      name: 'Cô Trần Thị Mai Lan',
      code: 'GV-088',
      avatar: 'TL',
      email: 'teacher.lan@center.edu.vn',
      phone: '0987 654 321',
      certs: 'IELTS 8.5 • TESOL Certified',
      joinedDate: '2024-08-20',
      totalGraded: 342,
      avgTurnaround: 14.5
    };
  };

  const teacher = getTeacherData();

  const activeClasses: ActiveClass[] = [
    {
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5',
      students: 24,
      maxStudents: 25,
      schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
      status: 'active'
    },
    {
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC Cấp tốc 750+',
      students: 18,
      maxStudents: 20,
      schedule: 'T3 - T5 - T7 (19:30 - 21:00)',
      status: 'active'
    }
  ];

  const gradingHistory: TeacherGradingRecord[] = [
    {
      id: 'grd-1',
      skill: 'writing',
      title: 'Writing Task 2: Artificial Intelligence & Workforce',
      studentName: 'Alice Johnson (HV-8801)',
      className: 'ENG-IELTS-6.5A',
      gradedAt: '2026-03-21 09:30',
      aiScore: 6.5,
      finalScore: 7.0,
      status: 'reviewed'
    },
    {
      id: 'grd-2',
      skill: 'speaking',
      title: 'Speaking Part 2: Environmental Megacities',
      studentName: 'David Pham (HV-8802)',
      className: 'ENG-IELTS-6.5A',
      gradedAt: '2026-03-19 14:15',
      aiScore: 6.0,
      finalScore: 6.5,
      status: 'reviewed'
    },
    {
      id: 'grd-3',
      skill: 'writing',
      title: 'Writing Task 1: Global Energy Production Chart',
      studentName: 'Lê Bảo Trâm (HV-8803)',
      className: 'ENG-IELTS-6.5A',
      gradedAt: '2026-03-17 20:45',
      aiScore: 7.5,
      finalScore: 7.5,
      status: 'reviewed'
    },
    {
      id: 'grd-4',
      skill: 'speaking',
      title: 'Speaking Part 3: Technology Impact on Education',
      studentName: 'Trần Minh Quân (HV-8804)',
      className: 'ENG-IELTS-6.5A',
      gradedAt: '2026-03-15 16:00',
      aiScore: 6.5,
      finalScore: 7.0,
      status: 'reviewed'
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordChange(false);
      setNewPassword('');
    }, 1500);
  };

  const handleRevokeSessions = () => {
    setSessionRevoked(true);
    setTimeout(() => setSessionRevoked(false), 3000);
  };

  const handleToggleSuspend = () => {
    const nextState = !isSuspended;
    setIsSuspended(nextState);
    setStatusMessage(
      nextState 
        ? (isVi ? 'Đã vô hiệu hóa tài khoản giáo viên thành công.' : 'Teacher account suspended successfully.') 
        : (isVi ? 'Đã kích hoạt lại tài khoản giáo viên thành công.' : 'Teacher account reactivated successfully.')
    );
    setTimeout(() => setStatusMessage(null), 3000);
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
            {teacher.avatar}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                {teacher.name}
              </h2>
              <span className="badge badge-primary font-mono">{teacher.code}</span>
              <span className={`badge ${!isSuspended ? 'badge-active' : 'badge-onleave'}`}>
                {!isSuspended ? (isVi ? 'Đang hoạt động' : 'Active') : (isVi ? 'Đã tạm khóa' : 'Suspended')}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '13.5px', color: 'var(--on-surface-variant)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} /> {teacher.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={15} /> {teacher.phone}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={15} color="var(--primary)" /> {teacher.certs}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> {isVi ? 'Tham gia: ' : 'Joined: '}<strong>{teacher.joinedDate}</strong>
              </span>
            </div>
          </div>

          {/* Performance Summary Pill */}
          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg, 12px)',
            background: 'var(--surface-container-high)',
            border: '1px solid var(--outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '230px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span className="text-on-surface-variant">{isVi ? 'Bài đã chấm (Q1):' : 'Graded in Q1:'}</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{teacher.totalGraded} bài</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--surface-container-highest)', overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
              <span>SLA: <strong>{teacher.avgTurnaround}h avg</strong></span>
              <span>{activeClasses.length} {isVi ? 'lớp đang dạy' : 'classes'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--outline-variant)', marginBottom: '24px', overflowX: 'auto' }}>
        {(
          [
            { key: 'overview', label: t('teacherDetails.tabOverview') || (isVi ? 'Thông tin cá nhân & Hồ sơ' : 'Profile & Overview'), icon: User },
            { key: 'classes', label: t('teacherDetails.tabClasses') || (isVi ? 'Lớp học phụ trách' : 'Assigned Classes'), icon: BookOpen },
            { key: 'gradings', label: t('teacherDetails.tabGradings') || (isVi ? 'Lịch sử chấm bài' : 'Grading History'), icon: Award },
            { key: 'security', label: t('teacherDetails.tabSecurity') || (isVi ? 'Bảo mật & Tài khoản' : 'Security & Account'), icon: ShieldCheck },
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
              {isVi ? 'Hồ Sơ Giảng Viên (Teacher Profile)' : 'Teacher System Profile'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{isVi ? 'Mã định danh hệ thống (ID)' : 'System User ID'}</span>
                <span className="font-semibold">{teacher.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{isVi ? 'Email liên hệ' : 'Contact Email'}</span>
                <span className="font-semibold">{teacher.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{isVi ? 'Số điện thoại' : 'Phone Number'}</span>
                <span className="font-semibold">{teacher.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{isVi ? 'Chuyên môn & Chứng chỉ' : 'Certifications'}</span>
                <span className="font-semibold text-primary">{teacher.certs}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="text-on-surface-variant">{isVi ? 'Ngày bắt đầu công tác' : 'Joined Date'}</span>
                <span className="font-semibold">{teacher.joinedDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-on-surface-variant">{isVi ? 'Trạng thái hoạt động' : 'Account Status'}</span>
                <span className={`badge ${!isSuspended ? 'badge-active' : 'badge-onleave'}`}>
                  {!isSuspended ? (isVi ? 'Đang hoạt động' : 'Active') : (isVi ? 'Tạm khóa' : 'Suspended')}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--secondary)" />
              {isVi ? 'Thống Kê Hiệu Suất Giảng Dạy & Chấm Điểm' : 'Teaching & Grading Metrics'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>{isVi ? 'Tổng bài đã chấm' : 'Total Graded'}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1d4ed8' }}>{teacher.totalGraded}</div>
                <div style={{ fontSize: '11px', color: '#3b82f6' }}>+18 {isVi ? 'bài tuần này' : 'this week'}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>{isVi ? 'SLA phản hồi TB' : 'Avg SLA'}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d' }}>{teacher.avgTurnaround}h</div>
                <div style={{ fontSize: '11px', color: '#22c55e' }}>{isVi ? 'Chuẩn cam kết < 24h' : 'Target < 24h'}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>{isVi ? 'Tỷ lệ đúng hạn' : 'On-time Rate'}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#b45309' }}>98.5%</div>
                <div style={{ fontSize: '11px', color: '#d97706' }}>{isVi ? 'Đạt chuẩn xuất sắc' : 'Excellent rating'}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '12px', color: '#6b21a8', fontWeight: 600 }}>{isVi ? 'Đánh giá học viên' : 'Student Rating'}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#7e22ce' }}>4.9 ★</div>
                <div style={{ fontSize: '11px', color: '#a855f7' }}>{isVi ? 'Dựa trên 128 lượt vote' : 'From 128 reviews'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Classes */}
      {activeTab === 'classes' && (
        <div className="card card-flush">
          <div className="card-section-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md card-section-header-title">{t('teacherDetails.classesTitle')}</h3>
              <p className="label-md text-on-surface-variant" style={{ marginTop: '2px' }}>{t('teacherDetails.classesSubtitle')}</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/admin/classes/create')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>{t('teacherDetails.btnAssignClass')}</span>
            </button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                  <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                  <th>{isVi ? 'LỊCH HỌC' : 'SCHEDULE'}</th>
                  <th>{isVi ? 'SĨ SỐ' : 'CLASS SIZE'}</th>
                  <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                  <th style={{ textAlign: 'right' }}>{isVi ? 'THAO TÁC' : 'ACTION'}</th>
                </tr>
              </thead>
              <tbody>
                {activeClasses.map((cls) => (
                  <tr key={cls.code}>
                    <td className="font-semibold text-primary">{cls.code}</td>
                    <td className="font-medium">{cls.name}</td>
                    <td className="text-on-surface-variant">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        <span>{cls.schedule}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--surface-container-highest)', color: 'var(--on-surface)' }}>
                        {cls.students}/{cls.maxStudents}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-active">{isVi ? 'Đang diễn ra' : 'Active'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/admin/classes/${cls.code}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>{t('teacherDetails.btnViewClass')}</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Grading History */}
      {activeTab === 'gradings' && (
        <div className="card card-flush">
          <div className="card-section-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md card-section-header-title">{t('teacherDetails.tabGradings')}</h3>
              <p className="label-md text-on-surface-variant" style={{ marginTop: '2px' }}>
                {isVi ? 'Nhật ký các bài nộp được giáo viên chấm và hiệu chỉnh từ hệ thống AI' : 'Recent assignment submissions reviewed and scored by this teacher'}
              </p>
            </div>
            <span className="label-md text-on-surface-variant">
              {isVi ? 'Đồng bộ lúc: 14:32 hôm nay' : 'Synced at 14:32 today'}
            </span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isVi ? 'KỸ NĂNG' : 'SKILL'}</th>
                  <th>{isVi ? 'BÀI TẬP' : 'ASSIGNMENT'}</th>
                  <th>{isVi ? 'HỌC VIÊN' : 'STUDENT'}</th>
                  <th>{isVi ? 'THỜI GIAN CHẤM' : 'GRADED AT'}</th>
                  <th>{isVi ? 'ĐIỂM AI' : 'AI SCORE'}</th>
                  <th>{isVi ? 'ĐIỂM CHỐT' : 'FINAL SCORE'}</th>
                  <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                </tr>
              </thead>
              <tbody>
                {gradingHistory.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getSkillIcon(sub.skill)}
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{sub.skill}</span>
                      </div>
                    </td>
                    <td className="font-medium">{sub.title}</td>
                    <td className="text-on-surface-variant">{sub.studentName}</td>
                    <td className="text-on-surface-variant">{sub.gradedAt}</td>
                    <td className="font-semibold text-secondary">{sub.aiScore}</td>
                    <td className="font-bold text-primary">{sub.finalScore}</td>
                    <td>
                      <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> {isVi ? 'Đã duyệt' : 'Reviewed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Account Management (Synchronized with Student Details) */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '680px' }}>
          {statusMessage && (
            <div style={{ padding: '14px 18px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} />
              <span>{statusMessage}</span>
            </div>
          )}

          {sessionRevoked && (
            <div style={{ padding: '14px 18px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} />
              <span>{isVi ? 'Đã thu hồi tất cả refresh_tokens và đăng xuất giáo viên khỏi mọi thiết bị thành công.' : 'All refresh tokens revoked successfully.'}</span>
            </div>
          )}

          <div className="card">
            <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              {t('teacherDetails.tabSecurity')}
            </h3>
            <p className="body-md text-on-surface-variant" style={{ marginBottom: '20px' }}>
              {t('teacherDetails.securityDesc')}
            </p>

            {/* Current Account Status Indicator */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '8px',
              background: 'var(--surface-container-low)',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12.5px', color: 'var(--on-surface-variant)' }}>
                  {isVi ? 'Trạng thái tài khoản hiện tại' : 'Current Account Status'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px' }}>
                  {teacher.name} ({teacher.code})
                </div>
              </div>
              <span className={`badge ${!isSuspended ? 'badge-active' : 'badge-onleave'}`}>
                {!isSuspended ? (isVi ? 'Đang hoạt động' : 'Active') : (isVi ? 'Đã tạm khóa' : 'Suspended')}
              </span>
            </div>

            {/* Account Actions Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setShowPasswordChange(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              >
                <KeyRound size={16} />
                <span>{t('teacherDetails.btnResetPassword')}</span>
              </button>

              <button 
                className="btn btn-secondary"
                onClick={handleRevokeSessions}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              >
                <RefreshCw size={16} />
                <span>{t('teacherDetails.btnRevokeSessions')}</span>
              </button>

              <button 
                className={`btn ${!isSuspended ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleToggleSuspend}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              >
                {!isSuspended ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                <span>{!isSuspended ? t('teacherDetails.btnDisable') : t('teacherDetails.btnActivate')}</span>
              </button>
            </div>
          </div>

          {/* Account Policy / Danger Info */}
          <div className="card" style={{ borderLeft: '4px solid #f59e0b', backgroundColor: '#fffbeb' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertTriangle size={20} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#92400e', margin: '0 0 4px 0' }}>
                  {isVi ? 'Lưu ý về quyền hạn tài khoản giáo viên' : 'Teacher Account Policy Notice'}
                </h4>
                <p style={{ fontSize: '13px', color: '#78350f', margin: 0, lineHeight: 1.5 }}>
                  {t('teacherDetails.disableDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal (Synchronized with Student Details modal design) */}
      {showPasswordChange && (
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
          zIndex: 1050
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 className="headline-md" style={{ marginBottom: '8px' }}>{t('teacherDetails.btnResetPassword')}</h3>
            <p className="body-sm text-on-surface-variant" style={{ marginBottom: '16px' }}>
              {isVi ? `Đặt lại mật khẩu cho giáo viên ${teacher.name} (${teacher.code})` : `Set new password for ${teacher.name}`}
            </p>

            {passwordSuccess ? (
              <div style={{ padding: '16px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 8px' }} />
                {isVi ? 'Đổi mật khẩu thành công!' : 'Password reset successfully!'}
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label-md" style={{ display: 'block', marginBottom: '6px' }}>
                    {isVi ? 'Mật khẩu mới' : 'New Password'}
                  </label>
                  <input 
                    type="password"
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder={isVi ? 'Tối thiểu 6 ký tự...' : 'Minimum 6 characters...'}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowPasswordChange(false)}
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

export default TeacherDetails;
