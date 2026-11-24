import React, { useState } from 'react';
import { 
  Shield, Check, HelpCircle, ShieldCheck, 
  Layers, Lock
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

  // Authoritative system capability matrix enforced by Spring Security RBAC
  const permissions: Record<string, RoleCapability[]> = {
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
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <div className="flex items-center gap-3">
            <h1 className="adm-title">
              {t('roles.title')}
            </h1>
            <span className="badge badge-primary px-2.5 py-1 text-xs font-semibold">
              <Lock size={12} className="mr-1 inline" />
              {isVi ? 'RBAC Cố định (Backend Security)' : 'Fixed System RBAC'}
            </span>
          </div>
          <p className="adm-subtitle">
            {isVi 
              ? 'Ma trận đặc quyền và phạm vi truy cập hệ thống của từng vai trò được thực thi bảo mật tại Spring Security.' 
              : 'System role capability matrix and access boundaries strictly enforced by Spring Security.'}
          </p>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="adm-filter-bar mb-6">
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
                className={`adm-pill py-2 px-4 text-[13.5px] ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RBAC Capabilities Table */}
      <div className="adm-table-card">
        <div className="adm-table-card-header">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t('roles.permHeading')}
            </span>
            <div className="text-sm font-semibold text-on-surface mt-0.5">
              {isVi ? `Đặc quyền hệ thống cho vai trò: ${activeRole.toUpperCase()}` : `System access rules for: ${activeRole.toUpperCase()}`}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-on-surface-variant">
            <HelpCircle size={15} />
            <span>{isVi ? 'Quy định cố định theo vai trò bảo mật' : 'Enforced strictly by role permissions'}</span>
          </div>
        </div>

        <table className="adm-table">
          <thead>
            <tr>
              <th className="w-[38%]">{t('roles.colModule')}</th>
              <th className="text-center w-[15%]">{t('roles.colRead')}</th>
              <th className="text-center w-[15%]">{t('roles.colWrite')}</th>
              <th className="text-center w-[15%]">{t('roles.colApprove')}</th>
              <th className="text-center w-[17%]">{isVi ? 'XUẤT DỮ LIỆU' : 'EXPORT'}</th>
            </tr>
          </thead>
          <tbody>
            {permissions[activeRole].map((mod) => (
              <tr key={mod.id}>
                <td>
                  <div className="flex flex-col gap-[3px]">
                    <span className="font-semibold text-sm text-on-surface">{mod.module}</span>
                    <span className="text-[12.5px] text-on-surface-variant">{mod.description}</span>
                  </div>
                </td>

                {/* Read Badge */}
                <td className="text-center">
                  {mod.read ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-forest text-xs font-bold">
                      <Check size={15} />
                    </span>
                  ) : (
                    <span className="text-muted text-sm font-semibold">—</span>
                  )}
                </td>

                {/* Write Badge */}
                <td className="text-center">
                  {mod.write ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-forest text-xs font-bold">
                      <Check size={15} />
                    </span>
                  ) : (
                    <span className="text-muted text-sm font-semibold">—</span>
                  )}
                </td>

                {/* Approve Badge */}
                <td className="text-center">
                  {mod.approve ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-forest text-xs font-bold">
                      <Check size={15} />
                    </span>
                  ) : (
                    <span className="text-muted text-sm font-semibold">—</span>
                  )}
                </td>

                {/* Export Badge */}
                <td className="text-center">
                  {mod.export ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-forest text-xs font-bold">
                      <Check size={15} />
                    </span>
                  ) : (
                    <span className="text-muted text-sm font-semibold">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="adm-table-card-footer">
          {t('roles.note')}
        </div>
      </div>
    </div>
  );
};

export default Roles;
