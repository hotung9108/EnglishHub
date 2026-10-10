import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Download, 
  Award, BookOpen, Plus, UserPlus,
  Loader2, AlertCircle, Trash2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import { assignmentService } from '../api/services/assignment.service';
import { SelectExistingStudentsModal } from '../components/classes/SelectExistingStudentsModal';
import type { ClassDetail, ClassMember } from '../api/services/class.service';
import type { AssignmentSummary } from '../api/services/assignment.service';

export const ClassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'settings'>('roster');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [studentsRoster, setStudentsRoster] = useState<ClassMember[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [showSelectStudentsModal, setShowSelectStudentsModal] = useState(false);

  // Settings tab form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    level: '',
    description: '',
    maxCapacity: 25
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const classNumericId = id ? parseInt(id.replace(/\D/g, ''), 10) || 1 : 1;

  useEffect(() => {
    let isMounted = true;

    const fetchClassData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [detailRes, membersRes, assignmentsRes] = await Promise.allSettled([
          classService.getDetail(classNumericId),
          classService.listMembers(classNumericId),
          assignmentService.listAssignments(classNumericId, { limit: 50 })
        ]);

        if (!isMounted) return;

        if (detailRes.status === 'fulfilled') {
          const det = detailRes.value;
          setClassDetail(det);
          setSettingsForm({
            name: det.name || '',
            level: det.level || '',
            description: det.description || '',
            maxCapacity: 25
          });
        }

        if (membersRes.status === 'fulfilled') {
          setStudentsRoster(membersRes.value);
        }

        if (assignmentsRes.status === 'fulfilled') {
          setAssignments(assignmentsRes.value.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải chi tiết lớp học.' : 'Failed to load class details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClassData();

    return () => {
      isMounted = false;
    };
  }, [classNumericId, isVi]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await classService.update(classNumericId, {
        name: settingsForm.name,
        level: settingsForm.level,
        description: settingsForm.description
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : isVi ? 'Không thể lưu cài đặt lớp học.' : 'Failed to update class.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (confirm(isVi ? `Xác nhận xóa học viên ${memberName} khỏi lớp?` : `Remove student ${memberName} from class?`)) {
      try {
        await classService.removeMember(classNumericId, memberId);
        setStudentsRoster(prev => prev.filter(m => m.memberId !== memberId));
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : isVi ? 'Không thể xóa học viên khỏi lớp.' : 'Failed to remove member.');
      }
    }
  };

  const teacherName = classDetail?.teacher?.fullName || (isVi ? 'Chưa phân công' : 'Unassigned');
  const classCode = `ENG-${classNumericId}`;
  const maxCapacity = settingsForm.maxCapacity || 25;
  const enrolledCount = studentsRoster.length;

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
              <span className="badge badge-primary font-mono">{classCode}</span>
              <span className="badge badge-active">{classDetail?.status || 'ACTIVE'}</span>
            </div>
            <h1 className="page-title" style={{ margin: '4px 0 0 0' }}>
              {classDetail?.name || (isVi ? 'Chi tiết lớp học' : 'Class Details')}
            </h1>
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

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>{isVi ? 'Đang tải thông tin lớp học...' : 'Loading class details...'}</div>
        </div>
      ) : (
        <>
          {/* Bento Class KPI Strip */}
          <div className="adm-kpi-grid">
            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <div>
                  <div className="adm-kpi-label">{isVi ? 'GIÁO VIÊN PHỤ TRÁCH' : 'INSTRUCTOR'}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--on-surface)', marginTop: '4px' }}>
                    {teacherName}
                  </div>
                </div>
                <div className="adm-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <Users size={20} />
                </div>
              </div>
              <div className="adm-kpi-footer text-on-surface-variant">
                <span>{classDetail?.description || (isVi ? 'Lịch học tiêu chuẩn' : 'Standard schedule')}</span>
              </div>
            </div>

            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <div>
                  <div className="adm-kpi-label">{isVi ? 'SĨ SỐ HIỆN TẠI' : 'ENROLLED ROSTER'}</div>
                  <div className="adm-kpi-value">{enrolledCount}/{maxCapacity}</div>
                </div>
                <div className="adm-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                  <Users size={20} />
                </div>
              </div>
              <div className="adm-kpi-footer">
                <span className="adm-kpi-delta pos">
                  {Math.round((enrolledCount / maxCapacity) * 100)}% {isVi ? 'lấp đầy' : 'capacity'}
                </span>
                <span className="text-on-surface-variant">
                  ({Math.max(0, maxCapacity - enrolledCount)} {isVi ? 'chỗ trống' : 'vacancies'})
                </span>
              </div>
            </div>

            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <div>
                  <div className="adm-kpi-label">{isVi ? 'BÀI TẬP ĐÃ GIAO' : 'TOTAL ASSIGNMENTS'}</div>
                  <div className="adm-kpi-value">{assignments.length}</div>
                </div>
                <div className="adm-kpi-icon" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
                  <Award size={20} />
                </div>
              </div>
              <div className="adm-kpi-footer">
                <span className="adm-kpi-delta pos">{assignments.filter(a => a.status === 'PUBLISHED').length} {isVi ? 'đang mở' : 'published'}</span>
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
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  {isVi ? 'Danh Sách Học Viên Đang Theo Học' : 'Active Enrolled Students'}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowSelectStudentsModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <UserPlus size={14} />
                    <span>{isVi ? 'Chọn học viên có sẵn' : 'Add Existing Student'}</span>
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/admin/students/create')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={isVi ? 'Tạo mới hồ sơ học viên' : 'Create new student profile'}
                  >
                    <Plus size={14} />
                    <span>{isVi ? 'Tạo mới' : 'Create New'}</span>
                  </button>
                </div>
              </div>

              {studentsRoster.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Lớp học chưa có học viên nào' : 'No students enrolled in this class'}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    {isVi ? 'Hãy chọn học viên đã có trong hệ thống hoặc tạo hồ sơ học viên mới.' : 'Select existing students from directory or create new students.'}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowSelectStudentsModal(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <UserPlus size={16} />
                      <span>{isVi ? 'Chọn học viên đã có trong hệ thống' : 'Select Existing Students'}</span>
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => navigate('/admin/students/create')}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={16} />
                      <span>{isVi ? 'Tạo mới học viên' : 'Create New Student'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{isVi ? 'MÃ HV' : 'STUDENT ID'}</th>
                      <th>{isVi ? 'HỌ VÀ TÊN' : 'FULL NAME'}</th>
                      <th style={{ textAlign: 'right' }}>{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsRoster.map(st => {
                      const studentCode = st.studentCode || `HV-${st.studentId}`;
                      const initials = st.fullName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase();

                      return (
                        <tr key={st.memberId}>
                          <td className="font-mono font-semibold text-primary">{studentCode}</td>
                          <td>
                            <div className="adm-cell-user">
                              <div className="adm-avatar" style={{ backgroundColor: '#2563eb' }}>
                                {initials}
                              </div>
                              <div className="adm-avatar-info">
                                <div className="adm-avatar-name">{st.fullName}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => navigate(`/admin/students/${st.studentId}`)}
                              >
                                {isVi ? 'Hồ sơ' : 'Profile'}
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm text-error"
                                onClick={() => handleRemoveMember(st.memberId, st.fullName)}
                                title={isVi ? 'Xóa khỏi lớp' : 'Remove from class'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 2: Assignments */}
          {activeTab === 'assignments' && (
            <div className="adm-table-card">
              {assignments.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Chưa có bài tập nào được giao cho lớp này' : 'No assignments created for this class'}
                  </div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{isVi ? 'MÃ BÀI' : 'CODE'}</th>
                      <th>{isVi ? 'TIÊU ĐỀ BÀI TẬP' : 'ASSIGNMENT'}</th>
                      <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(hw => (
                      <tr key={hw.id}>
                        <td className="font-mono font-semibold text-primary">HW-{hw.id}</td>
                        <td className="font-medium">{hw.title}</td>
                        <td>
                          <span className={`badge ${hw.status === 'PUBLISHED' ? 'badge-active' : 'badge-onleave'}`}>
                            {hw.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 3: Settings */}
          {activeTab === 'settings' && (
            <div className="card" style={{ maxWidth: '640px', padding: '24px' }}>
              <h3 className="headline-md" style={{ marginBottom: '16px' }}>{t('classDetails.tabSettings')}</h3>
              
              {settingsSaved && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {isVi ? 'Cập nhật cài đặt lớp học thành công!' : 'Class settings updated successfully!'}
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Tên lớp học' : 'Class Title'}</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={settingsForm.name} 
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Trình độ / Level' : 'Level'}</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={settingsForm.level} 
                    onChange={(e) => setSettingsForm({ ...settingsForm, level: e.target.value })}
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Mô tả / Lịch học' : 'Description / Schedule'}</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={settingsForm.description} 
                    onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingSettings}
                  style={{ alignSelf: 'flex-start', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {savingSettings ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>{isVi ? 'Lưu thay đổi lớp học' : 'Save Changes'}</span>
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Modal: Chọn học viên đã có trong hệ thống */}
      {showSelectStudentsModal && (
        <SelectExistingStudentsModal
          isOpen={showSelectStudentsModal}
          onClose={() => setShowSelectStudentsModal(false)}
          classId={classNumericId}
          classNameTitle={classDetail?.name}
          enrolledStudentIds={studentsRoster.map(s => s.studentId)}
          onSuccess={async () => {
            try {
              const members = await classService.listMembers(classNumericId);
              setStudentsRoster(members);
            } catch {
              // Keep current roster if reload fails
            }
          }}
        />
      )}
    </div>
  );
};

export default ClassDetails;
