import React, { useState } from 'react';
import { 
  Shield, Check, RotateCcw, Save, 
  HelpCircle, CheckCircle2, ShieldCheck, 
  Layers
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface RoleCapability {
  id: string;
  module: string;
  description: string;
  read: boolean;
  write: boolean;
  approve: boolean;
  export: boolean;
}

export const Roles: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeRole, setActiveRole] = useState<'admin' | 'teacher' | 'ta' | 'student'>('admin');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Granular capability matrix
  const [permissions, setPermissions] = useState<Record<string, RoleCapability[]>>({
    admin: [
      { id: 'mod-1', module: t('roles.mod1'), description: isVi ? 'Tạo mới, khóa, mở và phân bổ vai trò người dùng' : 'Create, suspend, and assign user identities', read: true, write: true, approve: true, export: true },
      { id: 'mod-2', module: t('roles.mod2'), description: isVi ? 'Quản lý danh sách lớp, sĩ số và giáo viên phụ trách' : 'Manage course cohorts, capacity, and teacher assignments', read: true, write: true, approve: true, export: true },
      { id: 'mod-3', module: t('roles.mod3'), description: isVi ? 'Kho đề thi mẫu 4 kỹ năng và module bài tập' : 'Centralized 4-skill question bank & module builder', read: true, write: true, approve: true, export: true },
      { id: 'mod-4', module: t('roles.mod4'), description: isVi ? 'Kích hoạt chấm AI, kiểm duyệt bài tự luận và chốt điểm' : 'Trigger AI models and verify scoring rubrics', read: true, write: true, approve: true, export: true },
      { id: 'mod-5', module: t('roles.mod5'), description: isVi ? 'Xuất báo cáo hiệu chuẩn AI, chất lượng đào tạo và lịch sử chấm điểm' : 'AI calibration telemetry, grading history, financial metrics', read: true, write: true, approve: true, export: true },
    ],
    teacher: [
      { id: 'mod-1', module: t('roles.mod1'), description: isVi ? 'Xem danh sách học viên trong lớp phụ trách' : 'View students within assigned classrooms', read: true, write: false, approve: false, export: false },
      { id: 'mod-2', module: t('roles.mod2'), description: isVi ? 'Xem chi tiết lớp học và cập nhật tiến độ giảng dạy' : 'Track teaching progress and class schedules', read: true, write: true, approve: false, export: true },
      { id: 'mod-3', module: t('roles.mod3'), description: isVi ? 'Tạo bài tập mới và import đề mẫu vào lớp' : 'Author assignments and import sample tests', read: true, write: true, approve: false, export: false },
      { id: 'mod-4', module: t('roles.mod4'), description: isVi ? 'Chấm bài, duyệt gợi ý AI và sửa điểm học sinh' : 'Grade assignments, accept/reject AI annotations', read: true, write: true, approve: true, export: true },
      { id: 'mod-5', module: t('roles.mod5'), description: isVi ? 'Xem tiến độ học tập và điểm trung bình của lớp' : 'Inspect cohort gradebooks and class pass rates', read: true, write: false, approve: false, export: true },
    ],
    ta: [
      { id: 'mod-1', module: t('roles.mod1'), description: isVi ? 'Tra cứu thông tin học viên' : 'Lookup student directory', read: true, write: false, approve: false, export: false },
      { id: 'mod-2', module: t('roles.mod2'), description: isVi ? 'Hỗ trợ điểm danh và theo dõi chuyên cần' : 'Support attendance logging', read: true, write: true, approve: false, export: false },
      { id: 'mod-3', module: t('roles.mod3'), description: isVi ? 'Xem danh sách bài tập đã giao' : 'Read assigned course exercises', read: true, write: false, approve: false, export: false },
      { id: 'mod-4', module: t('roles.mod4'), description: isVi ? 'Xem bài làm học viên, hỗ trợ chấm bài trắc nghiệm' : 'Assist grading for objective questions', read: true, write: true, approve: false, export: false },
      { id: 'mod-5', module: t('roles.mod5'), description: isVi ? 'Xem bảng điểm lớp trợ giảng' : 'View grades for assisted classes', read: true, write: false, approve: false, export: false },
    ],
    student: [
      { id: 'mod-1', module: t('roles.mod1'), description: isVi ? 'Xem và chỉnh sửa hồ sơ cá nhân' : 'Manage personal profile', read: true, write: true, approve: false, export: false },
      { id: 'mod-2', module: t('roles.mod2'), description: isVi ? 'Xem thông tin các lớp học đang tham gia' : 'View enrolled courses and peers', read: true, write: false, approve: false, export: false },
      { id: 'mod-3', module: t('roles.mod3'), description: isVi ? 'Làm bài tập 4 kỹ năng (Nghe, Nói, Đọc, Viết)' : 'Take 4-skill exercises and exams', read: true, write: true, approve: false, export: false },
      { id: 'mod-4', module: t('roles.mod4'), description: isVi ? 'Xem điểm số, nhận xét của AI và giáo viên' : 'Access graded feedback & error annotations', read: true, write: false, approve: false, export: false },
      { id: 'mod-5', module: t('roles.mod5'), description: isVi ? 'Xem bảng điểm và biểu đồ năng lực cá nhân' : 'Track personal competency radar', read: true, write: false, approve: false, export: false },
    ]
  });

  const handleToggle = (moduleId: string, field: 'read' | 'write' | 'approve' | 'export') => {
    setPermissions(prev => ({
      ...prev,
      [activeRole]: prev[activeRole].map(mod => {
        if (mod.id === moduleId) {
          return { ...mod, [field]: !mod[field] };
        }
        return mod;
      })
    }));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  const handleApplyPreset = (preset: string) => {
    if (confirm(isVi ? `Áp dụng mẫu phân quyền "${preset}" cho vai trò này?` : `Apply preset "${preset}"?`)) {
      alert(isVi ? 'Đã áp dụng mẫu phân quyền thành công.' : 'Preset applied.');
    }
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <Shield size={28} color="var(--primary)" />
            {t('roles.title')}
          </h1>
          <p className="adm-subtitle">
            {isVi 
              ? 'Ma trận phân quyền chi tiết (RBAC) kiểm soát quyền đọc, ghi, duyệt và kết xuất dữ liệu cho từng nhóm tài khoản.' 
              : 'Role-Based Access Control matrix configuring granular Read, Write, Approve, and Export capabilities.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => alert(isVi ? 'Đã khôi phục các thiết lập phân quyền mặc định của hệ thống.' : 'Default permissions restored.')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={15} />
            <span>{t('roles.restoreDefault')}</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} />
            <span>{t('roles.updatePerms')}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} />
          <span>{isVi ? 'Cập nhật phân quyền vai trò thành công! Quyền hạn đã có hiệu lực ngay lập tức.' : 'Role permissions updated successfully and propagated.'}</span>
        </div>
      )}

      {/* Role Selector Tabs (Mobbin Segmented Bar) */}
      <div className="adm-filter-bar" style={{ padding: '8px 12px', marginBottom: '24px' }}>
        <div className="adm-pills">
          {(
            [
              { key: 'admin', label: '1. Admin (Quản trị viên)', icon: ShieldCheck },
              { key: 'teacher', label: '2. Teacher (Giáo viên)', icon: Shield },
              { key: 'ta', label: '3. Teaching Assistant (Trợ giảng)', icon: Layers },
              { key: 'student', label: '4. Student (Học viên)', icon: Check },
            ] as const
          ).map((r) => {
            const Icon = r.icon;
            const isActive = activeRole === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={`adm-pill ${isActive ? 'active' : ''}`}
                style={{ padding: '8px 16px', fontSize: '13.5px' }}
              >
                <Icon size={16} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span className="text-on-surface-variant">{isVi ? 'Mẫu phân quyền:' : 'Preset:'}</span>
          <select 
            className="input"
            onChange={(e) => handleApplyPreset(e.target.value)}
            defaultValue=""
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
          >
            <option value="" disabled>{isVi ? '-- Chọn mẫu có sẵn --' : '-- Choose Preset --'}</option>
            <option value="super-admin">Super Administrator (Full Privileges)</option>
            <option value="lead-instructor">Lead Senior Instructor</option>
            <option value="auditor">Internal Academic Auditor</option>
            <option value="standard-student">Standard Student Participant</option>
          </select>
        </div>
      </div>

      {/* RBAC Capabilities Table */}
      <div className="adm-table-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-container-low)' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)' }}>
              {t('roles.permHeading')}
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)', marginTop: '2px' }}>
              {isVi ? `Đang cấu hình quyền hạn cho: ${activeRole.toUpperCase()}` : `Configuring capability rules for: ${activeRole.toUpperCase()}`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--on-surface-variant)' }}>
            <HelpCircle size={15} />
            <span>{isVi ? 'Bật công tắc để kích hoạt quyền' : 'Toggle switches to adjust access'}</span>
          </div>
        </div>

        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: '38%' }}>{t('roles.colModule')}</th>
              <th style={{ textAlign: 'center', width: '15%' }}>{t('roles.colRead')}</th>
              <th style={{ textAlign: 'center', width: '15%' }}>{t('roles.colWrite')}</th>
              <th style={{ textAlign: 'center', width: '15%' }}>{t('roles.colApprove')}</th>
              <th style={{ textAlign: 'center', width: '17%' }}>{isVi ? 'XUẤT DỮ LIỆU' : 'EXPORT'}</th>
            </tr>
          </thead>
          <tbody>
            {permissions[activeRole].map((mod) => (
              <tr key={mod.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span className="font-semibold" style={{ fontSize: '14px', color: 'var(--on-surface)' }}>{mod.module}</span>
                    <span style={{ fontSize: '12.5px', color: 'var(--on-surface-variant)' }}>{mod.description}</span>
                  </div>
                </td>

                {/* Read Toggle */}
                <td style={{ textAlign: 'center' }}>
                  <label className="adm-switch" style={{ margin: '0 auto' }}>
                    <input 
                      type="checkbox" 
                      checked={mod.read} 
                      onChange={() => handleToggle(mod.id, 'read')} 
                    />
                    <span className="adm-slider"></span>
                  </label>
                </td>

                {/* Write Toggle */}
                <td style={{ textAlign: 'center' }}>
                  <label className="adm-switch" style={{ margin: '0 auto' }}>
                    <input 
                      type="checkbox" 
                      checked={mod.write} 
                      onChange={() => handleToggle(mod.id, 'write')} 
                    />
                    <span className="adm-slider"></span>
                  </label>
                </td>

                {/* Approve Toggle */}
                <td style={{ textAlign: 'center' }}>
                  <label className="adm-switch" style={{ margin: '0 auto' }}>
                    <input 
                      type="checkbox" 
                      checked={mod.approve} 
                      onChange={() => handleToggle(mod.id, 'approve')} 
                    />
                    <span className="adm-slider"></span>
                  </label>
                </td>

                {/* Export Toggle */}
                <td style={{ textAlign: 'center' }}>
                  <label className="adm-switch" style={{ margin: '0 auto' }}>
                    <input 
                      type="checkbox" 
                      checked={mod.export} 
                      onChange={() => handleToggle(mod.id, 'export')} 
                    />
                    <span className="adm-slider"></span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)', fontSize: '12.5px', color: 'var(--on-surface-variant)' }}>
          {t('roles.note')}
        </div>
      </div>
    </div>
  );
};

export default Roles;
