import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, Award, BookOpen, Plus, UserPlus,
  Loader2, AlertCircle, Trash2,
  RotateCcw, ShieldAlert, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import { assignmentService } from '../api/services/assignment.service';
import { Button, EmptyState, Pagination, StatusBadge, Skeleton } from '../components/common';
import { SelectExistingStudentsModal } from '../components/classes/SelectExistingStudentsModal';
import { parseApiError } from '../api/core/errors';
import type { ApiClientError } from '../api/core/errors';
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
  const [assignmentsLoading, setAssignmentsLoading] = useState<boolean>(true);
  const [assignmentsError, setAssignmentsError] = useState<ApiClientError | null>(null);
  const [showSelectStudentsModal, setShowSelectStudentsModal] = useState(false);

  // Pagination for students roster
  const [rosterPage, setRosterPage] = useState<number>(1);
  const [rosterPageSize, setRosterPageSize] = useState<number>(10);

  // Settings tab form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    level: '',
    description: '',
    maxCapacity: 25
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const classNumericId = id ? parseInt(id.replace(/\D/g, ''), 10) || 1 : 1;

  useEffect(() => {
    let isMounted = true;

    const fetchClassData = async () => {
      try {
        setLoading(true);
        setError(null);
        setAssignmentsLoading(true);
        setAssignmentsError(null);

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
        } else {
          setError(isVi ? 'Không thể tải thông tin chi tiết lớp học.' : 'Failed to load class details.');
        }

        if (membersRes.status === 'fulfilled') {
          setStudentsRoster(membersRes.value);
        }

        if (assignmentsRes.status === 'fulfilled') {
          setAssignments(assignmentsRes.value.data || []);
          setAssignmentsError(null);
        } else {
          setAssignments([]);
          setAssignmentsError(parseApiError(assignmentsRes.reason));
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải chi tiết lớp học.' : 'Failed to load class details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setAssignmentsLoading(false);
        }
      }
    };

    fetchClassData();

    return () => {
      isMounted = false;
    };
  }, [classNumericId, isVi]);

  const handleReloadAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      setAssignmentsError(null);
      const res = await assignmentService.listAssignments(classNumericId, { limit: 50 });
      setAssignments(res.data || []);
    } catch (err: unknown) {
      setAssignments([]);
      setAssignmentsError(parseApiError(err));
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsError(null);
      await classService.update(classNumericId, {
        name: settingsForm.name,
        level: settingsForm.level,
        description: settingsForm.description
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: unknown) {
      setSettingsError(err instanceof Error ? err.message : isVi ? 'Không thể lưu cài đặt lớp học.' : 'Failed to update class.');
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
        setError(err instanceof Error ? err.message : isVi ? 'Không thể xóa học viên khỏi lớp.' : 'Failed to remove member.');
      }
    }
  };

  const teacherName = classDetail?.teacher?.fullName || (isVi ? 'Chưa phân công' : 'Unassigned');
  const classCode = `ENG-${classNumericId}`;
  const maxCapacity = settingsForm.maxCapacity || 25;
  const enrolledCount = studentsRoster.length;

  return (
    <div className="adm-container">
      {/* 1. Breadcrumb Navigation */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/dashboard" className="breadcrumb-link">
          {t('classDetails.breadcrumbAdmin') || 'Admin'}
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <Link to="/admin/classes" className="breadcrumb-link">
          {t('classDetails.breadcrumbManage') || (isVi ? 'Quản lý lớp học' : 'Manage Classes')}
        </Link>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-active">
          {classDetail?.name || `${t('classDetails.breadcrumbPrefix') || ''}${classCode}`}
        </span>
      </nav>

      {/* 2. Page Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <div className="flex items-center gap-2">
            <span className="badge badge-primary font-mono">{classCode}</span>
            <StatusBadge 
              status={classDetail?.status === 'ACTIVE' ? 'success' : 'neutral'} 
              label={classDetail?.status || 'ACTIVE'} 
            />
          </div>
          <h1 className="adm-title">
            {classDetail?.name || (isVi ? 'Chi tiết lớp học' : 'Class Details')}
          </h1>
        </div>
      </div>

      {error && (
        <div className="adm-alert-error mb-5">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-6 py-4">
          <div className="adm-kpi-grid">
            <Skeleton height={110} borderRadius={12} />
            <Skeleton height={110} borderRadius={12} />
            <Skeleton height={110} borderRadius={12} />
          </div>
          <Skeleton height={42} width={360} borderRadius={24} />
          <Skeleton height={320} borderRadius={12} />
        </div>
      ) : (
        <>
          {/* Bento Class KPI Strip */}
          <div className="adm-kpi-grid">
            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <div>
                  <div className="adm-kpi-label">{isVi ? 'GIÁO VIÊN PHỤ TRÁCH' : 'INSTRUCTOR'}</div>
                  <div className="adm-kpi-value text-lg font-bold mt-1">
                    {teacherName}
                  </div>
                </div>
                <div className="adm-kpi-icon adm-kpi-icon-primary">
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
                <div className="adm-kpi-icon adm-kpi-icon-success">
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
                  <div className="adm-kpi-value">
                    {assignmentsLoading ? (
                      <span className="text-on-surface-variant font-normal text-base">...</span>
                    ) : assignmentsError ? (
                      <span className="text-on-surface-variant font-normal text-xl">—</span>
                    ) : (
                      assignments.length
                    )}
                  </div>
                </div>
                <div className="adm-kpi-icon adm-kpi-icon-primary">
                  <Award size={20} />
                </div>
              </div>
              <div className="adm-kpi-footer">
                {assignmentsLoading ? (
                  <span className="text-on-surface-variant text-xs">{isVi ? 'Đang kiểm tra...' : 'Checking...'}</span>
                ) : assignmentsError ? (
                  <span className="text-error text-xs" title={assignmentsError.message}>
                    {assignmentsError.statusCode === 403 
                      ? (isVi ? 'Giới hạn quyền' : 'Restricted') 
                      : (isVi ? 'Không thể tải' : 'Unavailable')}
                  </span>
                ) : (
                  <span className="adm-kpi-delta pos">
                    {assignments.filter(a => a.status === 'PUBLISHED').length} {isVi ? 'đang mở' : 'published'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="adm-filter-bar mb-6">
            <div className="adm-pills">
              {(
                [
                  { key: 'roster', label: t('classDetails.tabStudents'), count: studentsRoster.length },
                  { 
                    key: 'assignments', 
                    label: t('classDetails.tabAssignments'), 
                    count: assignmentsLoading ? undefined : assignmentsError ? '—' : assignments.length 
                  },
                  { key: 'settings', label: t('classDetails.tabSettings') },
                ] as const
              ).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`adm-pill ${activeTab === tab.key ? 'active' : ''}`}
                >
                  <span>{tab.label}</span>
                  {'count' in tab && tab.count !== undefined && <span className="adm-pill-badge">{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Tab 1: Student Roster */}
          {activeTab === 'roster' && (
            <div className="adm-table-card">
              <div className="adm-table-card-header">
                <h3 className="adm-table-title">
                  {isVi ? 'Danh Sách Học Viên Đang Theo Học' : 'Active Enrolled Students'}
                </h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="primary"
                    size="sm"
                    icon={UserPlus}
                    onClick={() => setShowSelectStudentsModal(true)}
                  >
                    {isVi ? 'Chọn học viên có sẵn' : 'Add Existing Student'}
                  </Button>
                  <Button 
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => navigate('/admin/students/create')}
                    title={isVi ? 'Thêm học viên mới' : 'Add new student'}
                  >
                    {isVi ? 'Thêm mới' : 'Add New'}
                  </Button>
                </div>
              </div>

              {studentsRoster.length === 0 ? (
                <div className="adm-empty-state-card py-12">
                  <EmptyState
                    icon={<Users size={36} />}
                    title={isVi ? 'Lớp học chưa có học viên nào' : 'No students enrolled in this class'}
                    description={isVi ? 'Hãy chọn học viên đã có trong hệ thống hoặc thêm học viên mới.' : 'Select existing students from directory or add new students.'}
                    action={
                      <div className="flex justify-center gap-3 mt-4">
                        <Button 
                          variant="primary"
                          icon={UserPlus}
                          onClick={() => setShowSelectStudentsModal(true)}
                        >
                          {isVi ? 'Chọn học viên đã có trong hệ thống' : 'Select Existing Students'}
                        </Button>
                        <Button 
                          variant="secondary"
                          icon={Plus}
                          onClick={() => navigate('/admin/students/create')}
                        >
                          {isVi ? 'Thêm học viên mới' : 'Add New Student'}
                        </Button>
                      </div>
                    }
                  />
                </div>
              ) : (
                <>
                  {(() => {
                    const totalRosterPages = Math.ceil(studentsRoster.length / rosterPageSize) || 1;
                    const safeRosterPage = Math.min(Math.max(rosterPage, 1), totalRosterPages);
                    const paginatedRoster = studentsRoster.slice(
                      (safeRosterPage - 1) * rosterPageSize,
                      safeRosterPage * rosterPageSize
                    );

                    return (
                      <>
                        <table className="adm-table">
                          <thead>
                            <tr>
                              <th>{isVi ? 'MÃ HV' : 'STUDENT ID'}</th>
                              <th>{isVi ? 'HỌ VÀ TÊN' : 'FULL NAME'}</th>
                              <th className="text-right">{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedRoster.map(st => {
                              const studentCode = st.studentCode || `HV-${st.studentId}`;
                              const initials = st.fullName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase();

                              return (
                                <tr key={st.memberId}>
                                  <td className="font-mono font-semibold text-primary">{studentCode}</td>
                                  <td>
                                    <div className="adm-cell-user">
                                      <div className="adm-avatar" style={{ backgroundColor: 'var(--primary)' }}>
                                        {initials}
                                      </div>
                                      <div className="adm-avatar-info">
                                        <div className="adm-avatar-name">{st.fullName}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-right">
                                    <div className="inline-flex gap-2">
                                      <Button 
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => navigate(`/admin/students/${st.studentId}`)}
                                      >
                                        {isVi ? 'Hồ sơ' : 'Profile'}
                                      </Button>
                                      <Button 
                                        variant="secondary"
                                        size="sm"
                                        className="text-error"
                                        icon={Trash2}
                                        onClick={() => handleRemoveMember(st.memberId, st.fullName)}
                                        title={isVi ? 'Xóa khỏi lớp' : 'Remove from class'}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {studentsRoster.length > 0 && (
                          <Pagination
                            currentPage={safeRosterPage}
                            totalPages={totalRosterPages}
                            totalItems={studentsRoster.length}
                            itemLabel={isVi ? 'học viên' : 'students'}
                            isVi={isVi}
                            onPageChange={setRosterPage}
                            pageSize={rosterPageSize}
                            onPageSizeChange={(newSize) => {
                              setRosterPageSize(newSize);
                              setRosterPage(1);
                            }}
                            pageSizeOptions={[5, 10, 20]}
                            variant="table"
                          />
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Tab 2: Assignments */}
          {activeTab === 'assignments' && (
            <div className="adm-table-card">
              {assignmentsLoading ? (
                <div className="adm-empty-state-card">
                  <Loader2 size={32} className="animate-spin adm-loading-state-icon text-primary" style={{ margin: '0 auto 12px' }} />
                  <p className="adm-empty-state-desc">{isVi ? 'Đang tải danh sách bài tập...' : 'Loading assignments...'}</p>
                </div>
              ) : assignmentsError ? (
                <div className="adm-empty-state-card">
                  {assignmentsError.statusCode === 403 ? (
                    <EmptyState
                      icon={<ShieldAlert size={36} style={{ color: 'var(--color-warning)' }} />}
                      title={isVi ? 'Giới hạn quyền truy cập' : 'Access Restricted'}
                      description={isVi 
                        ? 'Tài khoản Quản trị viên hiện chưa được cấp quyền đọc danh sách bài tập của lớp này (HTTP 403 Forbidden).' 
                        : 'Administrator accounts are currently not authorized to view assignments for this class (HTTP 403 Forbidden).'}
                      action={
                        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReloadAssignments}>
                          {isVi ? 'Thử lại' : 'Retry'}
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<AlertCircle size={36} style={{ color: 'var(--color-danger)' }} />}
                      title={isVi ? 'Không thể tải danh sách bài tập' : 'Failed to load assignments'}
                      description={assignmentsError.message || (isVi ? 'Đã xảy ra lỗi khi kết nối máy chủ.' : 'Failed to connect to server.')}
                      action={
                        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReloadAssignments}>
                          {isVi ? 'Thử lại' : 'Retry'}
                        </Button>
                      }
                    />
                  )}
                </div>
              ) : assignments.length === 0 ? (
                <div className="adm-empty-state-card">
                  <EmptyState
                    icon={<BookOpen size={36} />}
                    title={isVi ? 'Chưa có bài tập nào' : 'No assignments found'}
                    description={isVi ? 'Chưa có bài tập nào được giao cho lớp này' : 'No assignments created for this class'}
                  />
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{isVi ? 'MÃ BÀI' : 'CODE'}</th>
                      <th>{isVi ? 'TIÊU ĐỀ BÀI TẬP' : 'ASSIGNMENT'}</th>
                      <th className="text-center">{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(hw => (
                      <tr key={hw.id}>
                        <td className="font-mono font-semibold text-primary">HW-{hw.id}</td>
                        <td className="font-medium">{hw.title}</td>
                        <td className="text-center">
                          <StatusBadge 
                            status={hw.status === 'PUBLISHED' ? 'success' : hw.status === 'CLOSED' ? 'warning' : 'neutral'}
                            label={hw.status}
                          />
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
            <div className="card adm-settings-section-card max-w-2xl">
              <h3 className="headline-md mb-4">{t('classDetails.tabSettings')}</h3>
              
              {settingsSaved && (
                <div className="adm-alert-success mb-4">
                  <CheckCircle2 size={16} />
                  <span>{isVi ? 'Cập nhật cài đặt lớp học thành công!' : 'Class settings updated successfully!'}</span>
                </div>
              )}

              {settingsError && (
                <div className="adm-alert-error mb-4">
                  <AlertCircle size={16} />
                  <span>{settingsError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
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
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={savingSettings}
                  className="self-start mt-2"
                >
                  {isVi ? 'Lưu thay đổi lớp học' : 'Save Changes'}
                </Button>
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
