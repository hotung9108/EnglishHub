import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Download, 
  Award, BookOpen, 
  PenTool, Mic, Headphones, 
  Plus
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const ClassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'settings'>('roster');

  const classInfo = {
    code: id || 'ENG-IELTS-6.5A',
    name: 'IELTS Intensive Band 6.5 - 7.5 (Target Master)',
    teacher: 'Cô Trần Thị Mai Lan',
    schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
    room: 'Online Room #04 (Zoom HD)',
    enrolled: 24,
    maxCapacity: 25,
    avgScore: 7.2,
    completionRate: 92,
    status: 'Active'
  };

  const studentsRoster = [
    { id: 'HV-8801', name: 'Alice Johnson', email: 'alice.j@student.edu.vn', target: '7.0', entry: '5.5', attendance: 96, avgScore: 7.0, status: 'good' },
    { id: 'HV-8802', name: 'David Pham', email: 'david.p@student.edu.vn', target: '6.5', entry: '5.0', attendance: 88, avgScore: 6.2, status: 'warning' },
    { id: 'HV-8803', name: 'Lê Bảo Trâm', email: 'tram.lb@student.edu.vn', target: '7.5', entry: '6.0', attendance: 100, avgScore: 7.8, status: 'good' },
    { id: 'HV-8804', name: 'Trần Minh Quân', email: 'quan.tm@student.edu.vn', target: '7.0', entry: '5.5', attendance: 92, avgScore: 6.8, status: 'good' },
  ];

  const assignments = [
    { code: 'HW-01', title: 'Writing Task 2: Artificial Intelligence & Workforce', skill: 'writing', dueDate: '2026-03-22 23:59', submitted: 24, pending: 2, avgScore: 7.0 },
    { code: 'HW-02', title: 'Speaking Part 2: Environmental Megacities', skill: 'speaking', dueDate: '2026-03-20 23:59', submitted: 24, pending: 0, avgScore: 6.6 },
    { code: 'HW-03', title: 'Reading Mock Test Passage 1-3 (Cambridge 19)', skill: 'reading', dueDate: '2026-03-18 21:00', submitted: 24, pending: 0, avgScore: 7.5 },
    { code: 'HW-04', title: 'Listening Section 3 & 4 (Campus Life)', skill: 'listening', dueDate: '2026-03-15 21:00', submitted: 23, pending: 0, avgScore: 7.0 },
  ];

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'writing': return <PenTool size={15} color="#2563eb" />;
      case 'speaking': return <Mic size={15} color="#d97706" />;
      case 'reading': return <BookOpen size={15} color="#059669" />;
      default: return <Headphones size={15} color="#7c3aed" />;
    }
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/classes')}
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>{t('classDetails.btnBack')}</span>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary font-mono">{classInfo.code}</span>
              <span className="badge badge-active">{classInfo.status}</span>
            </div>
            <h1 className="page-title" style={{ margin: '4px 0 0 0' }}>{classInfo.name}</h1>
          </div>
        </div>

        <div className="adm-actions">
          <button 
            className="btn btn-primary"
            onClick={() => alert(isVi ? 'Đang kết xuất học bạ lớp học...' : 'Exporting class report...')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} />
            <span>{t('classDetails.btnExport')}</span>
          </button>
        </div>
      </div>

      {/* Bento Class KPI Strip */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'GIÁO VIÊN PHỤ TRÁCH' : 'INSTRUCTOR'}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--on-surface)', marginTop: '4px' }}>{classInfo.teacher}</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="adm-kpi-footer text-on-surface-variant">
            <span>{classInfo.schedule}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'SĨ SỐ HIỆN TẠI' : 'ENROLLED ROSTER'}</div>
              <div className="adm-kpi-value">{classInfo.enrolled}/{classInfo.maxCapacity}</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">96% {isVi ? 'lấp đầy' : 'capacity'}</span>
            <span className="text-on-surface-variant">(Còn 1 chỗ)</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'ĐIỂM TRUNG BÌNH LỚP' : 'CLASS AVERAGE'}</div>
              <div className="adm-kpi-value">{classInfo.avgScore} <span style={{ fontSize: '16px', fontWeight: 500 }}>band</span></div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
              <Award size={20} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">+0.7 band</span>
            <span className="text-on-surface-variant">{isVi ? 'so với đầu vào' : 'growth'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-filter-bar" style={{ padding: '8px 12px', marginBottom: '24px' }}>
        <div className="adm-pills">
          {(
            [
              { key: 'roster', label: t('classDetails.tabStudents'), count: studentsRoster.length },
              { key: 'assignments', label: t('classDetails.tabAssignments'), count: assignments.length },
              { key: 'settings', label: t('classDetails.tabSettings') },
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`adm-pill ${activeTab === tab.key ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              {'count' in tab && <span className="adm-pill-badge">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Student Roster */}
      {activeTab === 'roster' && (
        <div className="adm-table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{isVi ? 'Danh Sách Học Viên Đang Theo Học' : 'Active Enrolled Students'}</h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/admin/students/create')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>{isVi ? 'Thêm học viên vào lớp' : 'Add Student'}</span>
            </button>
          </div>

          <table className="adm-table">
            <thead>
              <tr>
                <th>{isVi ? 'MÃ HV' : 'STUDENT ID'}</th>
                <th>{isVi ? 'HỌ VÀ TÊN' : 'FULL NAME'}</th>
                <th>{isVi ? 'ĐẦU VÀO → TARGET' : 'ENTRY → TARGET'}</th>
                <th>{isVi ? 'CHUYÊN CẦN' : 'ATTENDANCE'}</th>
                <th>{isVi ? 'ĐTB HIỆN TẠI' : 'CURRENT AVG'}</th>
                <th style={{ textAlign: 'right' }}>{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody>
              {studentsRoster.map(st => (
                <tr key={st.id} onClick={() => navigate(`/admin/students/${st.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="font-mono font-semibold text-primary">{st.id}</td>
                  <td>
                    <div className="adm-cell-user">
                      <div className="adm-avatar" style={{ backgroundColor: '#2563eb' }}>
                        {st.name.split(' ').map(n => n[0]).slice(-2).join('')}
                      </div>
                      <div className="adm-avatar-info">
                        <div className="adm-avatar-name">{st.name}</div>
                        <div className="adm-avatar-meta">{st.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-on-surface-variant">{st.entry}</span>
                    <span style={{ margin: '0 6px' }}>&rarr;</span>
                    <strong className="text-primary">{st.target}</strong>
                  </td>
                  <td>
                    <span className="badge badge-active">{st.attendance}%</span>
                  </td>
                  <td className="font-bold">{st.avgScore}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/students/${st.id}`);
                      }}
                    >
                      {isVi ? 'Xem học bạ' : 'Profile'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Assignments */}
      {activeTab === 'assignments' && (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                <th>{isVi ? 'MÃ BÀI' : 'CODE'}</th>
                <th>{isVi ? 'TIÊU ĐỀ BÀI TẬP' : 'ASSIGNMENT'}</th>
                <th>{isVi ? 'KỸ NĂNG' : 'SKILL'}</th>
                <th>{isVi ? 'HẠN NỘP' : 'DUE DATE'}</th>
                <th>{isVi ? 'ĐÃ NỘP' : 'SUBMISSIONS'}</th>
                <th>{isVi ? 'ĐIỂM TB' : 'AVG SCORE'}</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(hw => (
                <tr key={hw.code}>
                  <td className="font-mono font-semibold text-primary">{hw.code}</td>
                  <td className="font-medium">{hw.title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getSkillIcon(hw.skill)}
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{hw.skill}</span>
                    </div>
                  </td>
                  <td className="text-on-surface-variant font-mono">{hw.dueDate}</td>
                  <td>
                    <span className="font-semibold">{hw.submitted}/24</span>
                    {hw.pending > 0 && <span className="badge badge-warning" style={{ marginLeft: '6px' }}>{hw.pending} {isVi ? 'chờ chấm' : 'pending'}</span>}
                  </td>
                  <td className="font-bold text-primary">{hw.avgScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 'settings' && (
        <div className="card" style={{ maxWidth: '640px', padding: '24px' }}>
          <h3 className="headline-md" style={{ marginBottom: '16px' }}>{t('classDetails.tabSettings')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="adm-form-group">
              <label className="adm-form-label">{isVi ? 'Phòng học / Link giảng dạy' : 'Room / Virtual Link'}</label>
              <input type="text" className="input" defaultValue={classInfo.room} />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">{isVi ? 'Lịch học trong tuần' : 'Weekly Schedule'}</label>
              <input type="text" className="input" defaultValue={classInfo.schedule} />
            </div>
            <div className="adm-form-group">
              <label className="adm-form-label">{isVi ? 'Sĩ số tối đa' : 'Max Capacity'}</label>
              <input type="number" className="input" defaultValue={classInfo.maxCapacity} />
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              {isVi ? 'Lưu thay đổi lớp học' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetails;
