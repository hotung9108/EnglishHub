import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, Award, BookOpen, Plus, UserPlus,
  Loader2, AlertCircle, Trash2, ArrowRightLeft,
  RotateCcw, ShieldAlert, ChevronRight, X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import { assignmentService } from '../api/services/assignment.service';
import { Button, EmptyState, Pagination, StatusBadge, Skeleton, ConfirmModal, useToast } from '../components/common';
import { SelectExistingStudentsModal } from '../components/classes/SelectExistingStudentsModal';
import { TransferStudentModal } from '../components/classes/TransferStudentModal';
import { TeacherPicker } from '../components/classes/TeacherPicker';
import { parseApiError } from '../api/core/errors';
import type { ApiClientError } from '../api/core/errors';
import type { ClassDetail, ClassMember } from '../api/services/class.service';
import type { AssignmentSummary } from '../api/services/assignment.service';
import type { UserListItem } from '../api/services/user.service';

export const ClassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'settings'>('roster');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [studentsRoster, setStudentsRoster] = useState<ClassMember[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState<boolean>(true);
  const [assignmentsError, setAssignmentsError] = useState<ApiClientError | null>(null);
  const [showSelectStudentsModal, setShowSelectStudentsModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: number; name: string } | null>(null);
  const [studentToTransfer, setStudentToTransfer] = useState<{ studentId: number; fullName: string; studentCode?: string; currentMemberId: number } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [statusModalAction, setStatusModalAction] = useState<'close' | 'reopen' | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Pagination for students roster
  const [rosterPage, setRosterPage] = useState<number>(1);
  const [rosterPageSize, setRosterPageSize] = useState<number>(10);

  // Settings tab form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    level: '',
    description: '',
    maxCapacity: 25,
    teacherId: ''
  });
  const [selectedSettingsTeacher, setSelectedSettingsTeacher] = useState<UserListItem | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Quick change teacher modal state (UC008 / Issue #344)
  const [showChangeTeacherModal, setShowChangeTeacherModal] = useState(false);
  const [quickTeacher, setQuickTeacher] = useState<UserListItem | null>(null);
  const [quickTeacherId, setQuickTeacherId] = useState<string>('');
  const [savingQuickTeacher, setSavingQuickTeacher] = useState(false);

  const isValidId = typeof id === 'string' && /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
  const classNumericId = isValidId ? Number(id) : null;

  useEffect(() => {
    if (classNumericId === null) return;
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
          const parsedCapacity = det.description ? det.description.match(/(?:Sĩ số|Capacity|Sĩ số tối đa):\s*(\d+)/i) : null;
          const dynamicCapacity = parsedCapacity ? parseInt(parsedCapacity[1], 10) : 25;
          const initialTeacherId = det.teacher?.id ? String(det.teacher.id) : (det.teacherId ? String(det.teacherId) : '');
          setSettingsForm({
            name: det.name || '',
            level: det.level || '',
            description: det.description || '',
            maxCapacity: dynamicCapacity,
            teacherId: initialTeacherId
          });
          setQuickTeacherId(initialTeacherId);
          if (det.teacher) {
            const initialTeacherItem: UserListItem = {
              id: det.teacher.id,
              fullName: det.teacher.fullName,
              email: '',
              role: 'TEACHER',
              status: 'ACTIVE'
            };
            setQuickTeacher(initialTeacherItem);
            setSelectedSettingsTeacher(initialTeacherItem);
          }
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
    if (classNumericId === null) return;
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
    if (classNumericId === null) return;
    try {
      setSavingSettings(true);

      let updatedDesc = settingsForm.description || '';
      if (/(?:Sĩ số|Capacity|Sĩ số tối đa):\s*\d+/i.test(updatedDesc)) {
        updatedDesc = updatedDesc.replace(/(?:Sĩ số|Capacity|Sĩ số tối đa):\s*\d+/i, `Sĩ số: ${settingsForm.maxCapacity}`);
      } else {
        updatedDesc = `Sĩ số: ${settingsForm.maxCapacity}${updatedDesc ? ` • ${updatedDesc}` : ''}`;
      }

      const targetTeacherId = settingsForm.teacherId ? Number(settingsForm.teacherId) : undefined;
      await classService.update(classNumericId, {
        name: settingsForm.name,
        level: settingsForm.level,
        description: updatedDesc,
        teacherId: targetTeacherId
      });

      setSettingsForm(prev => ({ ...prev, description: updatedDesc }));
      if (classDetail) {
        const updatedTeacher = targetTeacherId && selectedSettingsTeacher
          ? { id: selectedSettingsTeacher.id, fullName: selectedSettingsTeacher.fullName }
          : (targetTeacherId ? classDetail.teacher : undefined);
        setClassDetail({
          ...classDetail,
          name: settingsForm.name,
          level: settingsForm.level,
          description: updatedDesc,
          teacherId: targetTeacherId,
          teacher: updatedTeacher
        });
      }

      toastSuccess(isVi ? 'Cập nhật cài đặt lớp học thành công!' : 'Class settings updated successfully!');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : isVi ? 'Không thể lưu cài đặt lớp học.' : 'Failed to update class.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExecuteQuickChangeTeacher = async () => {
    if (classNumericId === null || !quickTeacherId) return;
    try {
      setSavingQuickTeacher(true);
      const targetId = Number(quickTeacherId);
      await classService.update(classNumericId, {
        teacherId: targetId
      });

      const updatedTeacher = quickTeacher
        ? { id: quickTeacher.id, fullName: quickTeacher.fullName }
        : classDetail?.teacher;

      if (classDetail) {
        setClassDetail({
          ...classDetail,
          teacherId: targetId,
          teacher: updatedTeacher
        });
      }
      setSettingsForm(prev => ({ ...prev, teacherId: String(targetId) }));
      if (quickTeacher) {
        setSelectedSettingsTeacher(quickTeacher);
      }
      toastSuccess(isVi ? 'Đã thay đổi giáo viên phụ trách thành công.' : 'Instructor updated successfully.');
      setShowChangeTeacherModal(false);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : isVi ? 'Không thể đổi giáo viên phụ trách.' : 'Failed to change instructor.');
    } finally {
      setSavingQuickTeacher(false);
    }
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    if (classNumericId === null) return;
    setMemberToRemove({ id: memberId, name: memberName });
  };

  const executeRemoveMember = async () => {
    if (!memberToRemove || classNumericId === null) return;
    setIsRemoving(true);
    try {
      await classService.removeMember(classNumericId, memberToRemove.id);
      setStudentsRoster(prev => prev.filter(m => m.memberId !== memberToRemove.id));
      toastSuccess(isVi ? `Đã xóa học viên ${memberToRemove.name} khỏi lớp.` : `Removed student ${memberToRemove.name} from class.`);
      setMemberToRemove(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : isVi ? 'Không thể xóa học viên khỏi lớp.' : 'Failed to remove member.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (classNumericId === null || !statusModalAction) return;
    setIsUpdatingStatus(true);
    const targetStatus = statusModalAction === 'close' ? 'COMPLETED' : 'ACTIVE';
    try {
      await classService.update(classNumericId, { status: targetStatus });
      setClassDetail(prev => prev ? { ...prev, status: targetStatus } : null);
      toastSuccess(
        statusModalAction === 'close'
          ? (isVi ? 'Đóng lớp học thành công.' : 'Class closed successfully.')
          : (isVi ? 'Mở lại lớp học thành công.' : 'Class reopened successfully.')
      );
      setStatusModalAction(null);
    } catch (err: unknown) {
      toastError(
        err instanceof Error
          ? err.message
          : (isVi ? 'Không thể cập nhật trạng thái lớp.' : 'Failed to update class status.')
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const teacherName = classDetail?.teacher?.fullName || (isVi ? 'Chưa phân công' : 'Unassigned');
  const classCode = `ENG-${classNumericId}`;
  const maxCapacity = settingsForm.maxCapacity || 25;
  const enrolledCount = studentsRoster.length;

  if (classNumericId === null) {
    return (
      <div className="adm-container">
        <div className="adm-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{isVi ? 'ID lớp không hợp lệ' : 'Invalid class ID'}</span>
        </div>
      </div>
    );
  }

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
        <div className="adm-actions flex items-center gap-3">
          {classDetail?.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              onClick={() => setStatusModalAction('close')}
            >
              {isVi ? 'Đóng lớp' : 'Close Class'}
            </Button>
          )}
          {(classDetail?.status === 'COMPLETED' || classDetail?.status === 'INACTIVE') && (
            <Button
              variant="primary"
              onClick={() => setStatusModalAction('reopen')}
            >
              {isVi ? 'Mở lại lớp' : 'Reopen Class'}
            </Button>
          )}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const curId = classDetail?.teacher?.id ? String(classDetail.teacher.id) : (classDetail?.teacherId ? String(classDetail.teacherId) : '');
                      setQuickTeacherId(curId);
                      setShowChangeTeacherModal(true);
                    }}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-outline-variant hover:bg-surface text-primary transition-colors flex items-center gap-1.5"
                    title={isVi ? 'Đổi giáo viên phụ trách' : 'Change instructor'}
                  >
                    <ArrowRightLeft size={13} />
                    <span>{isVi ? 'Đổi GV' : 'Change'}</span>
                  </button>
                  <div className="adm-kpi-icon adm-kpi-icon-primary">
                    <Users size={20} />
                  </div>
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
                        <div className="overflow-x-auto">
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
                                    <td style={{ textAlign: 'right' }}>
                                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                                        <Button 
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => navigate(`/admin/students/${st.studentId}`, {
                                            state: {
                                              studentId: st.studentId,
                                              fullName: st.fullName,
                                              studentCode: st.studentCode,
                                            }
                                          })}
                                        >
                                          {isVi ? 'Hồ sơ' : 'Profile'}
                                        </Button>
                                        <Button 
                                          variant="secondary"
                                          size="sm"
                                          icon={ArrowRightLeft}
                                          onClick={() => setStudentToTransfer({
                                            studentId: st.studentId,
                                            fullName: st.fullName,
                                            studentCode: st.studentCode,
                                            currentMemberId: st.memberId
                                          })}
                                          title={isVi ? 'Điều chuyển học viên sang lớp khác' : 'Transfer to another class'}
                                        >
                                          {isVi ? 'Chuyển lớp' : 'Transfer'}
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
                        </div>

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
                <div className="overflow-x-auto">
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
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Settings */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="card adm-settings-section-card">
                <h3 className="headline-md mb-4">{t('classDetails.tabSettings')}</h3>

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
                        <label className="adm-form-label">{isVi ? 'Giáo viên phụ trách' : 'Instructor'}</label>                                                                             
                        <TeacherPicker
                          selectedTeacherId={settingsForm.teacherId}
                          isVi={isVi}
                          onSelectTeacher={(tc) => {
                            setSettingsForm(prev => ({                                                                                                                                      
                              ...prev,
                              teacherId: tc ? String(tc.id) : ''
                            }));
                            setSelectedSettingsTeacher(tc);
                          }}
                        />
                      </div>                                                                                                                                                                
                      <div className="adm-form-group">
                        <label className="adm-form-label">{isVi ? 'Sĩ số tối đa (Học viên)' : 'Maximum Capacity (Students)'}</label>
                        <input 
                          type="number"                                                                                                                                                     
                          min={1}
                          max={150}
                          className="input" 
                          value={settingsForm.maxCapacity}                                                                                                                                  
                          onChange={(e) => setSettingsForm({ ...settingsForm, maxCapacity: Math.max(1, parseInt(e.target.value) || 25) })}
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
  
                  {/* Status / Lifecycle card in Settings tab */}
                  <div className="card adm-lifecycle-card">
                    <h4 className="font-semibold text-base mb-2">
                      {isVi ? 'Trạng thái hoạt động của lớp học' : 'Class Lifecycle & Status'}
                    </h4>                                                                                                                                                                   
                    <p className="text-sm text-on-surface-variant mb-4">
                      {classDetail?.status === 'ACTIVE'
                        ? (isVi 
                            ? 'Lớp học hiện đang hoạt động. Khi kết thúc khóa học, bạn có thể đóng lớp.' 
                            : 'This class is currently active. When the course concludes, you can close the class.')
                        : (isVi 
                            ? 'Lớp học hiện đang kết thúc. Bạn có thể mở lại lớp khi cần tiếp tục giảng dạy.'                                                                               
                            : 'This class is currently completed. You can reopen it if classes resume.')}                                                                                   
                    </p>                                                                                                                                                                    
                    {classDetail?.status === 'ACTIVE' ? (
                      <Button                                                                                                                                                               
                        type="button"
                        variant="secondary"
                        onClick={() => setStatusModalAction('close')}
                      >
                        {isVi ? 'Đóng lớp' : 'Close Class'}
                      </Button>
                    ) : (                                                                                                                                                                   
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setStatusModalAction('reopen')}                                                                                                                      
                      >
                        {isVi ? 'Mở lại lớp' : 'Reopen Class'}
                      </Button>
                    )}
                  </div>
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
          maxCapacity={maxCapacity}
          enrolledCount={enrolledCount}
          enrolledStudentIds={studentsRoster.map(s => s.studentId)}
          onSuccess={async () => {
            if (classNumericId === null) return;
            try {
              const members = await classService.listMembers(classNumericId);
              setStudentsRoster(members);
            } catch {
              // Keep current roster if reload fails
            }
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(memberToRemove)}
        title={isVi ? 'Xóa học viên khỏi lớp' : 'Remove Student'}
        message={
          memberToRemove
            ? isVi
              ? `Xác nhận xóa học viên ${memberToRemove.name} khỏi lớp này?`
              : `Confirm removing student ${memberToRemove.name} from this class?`
            : ''
        }
        confirmText={isVi ? 'Xóa khỏi lớp' : 'Remove'}
        cancelText={isVi ? 'Hủy bỏ' : 'Cancel'}
        variant="danger"
        isLoading={isRemoving}
        onConfirm={executeRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />

      {/* Modal điều chuyển học viên giữa các lớp (UC009 / FE-88) */}
      {studentToTransfer && classNumericId !== null && (
        <TransferStudentModal
          isOpen={Boolean(studentToTransfer)}
          onClose={() => setStudentToTransfer(null)}
          currentClassId={classNumericId}
          currentClassName={classDetail?.name || ''}
          student={studentToTransfer}
          onSuccess={async () => {
            try {
              const members = await classService.listMembers(classNumericId);
              setStudentsRoster(members);
            } catch {
              // Ignore reload error
            }
          }}
        />
      )}

          {/* Modal xác nhận Đóng / Mở lại lớp học (UC008 / Issue #367) */}
          <ConfirmModal
            isOpen={statusModalAction !== null}
            title={                                                                                                                                                                         
              statusModalAction === 'close'                                                                                                                                                 
                ? (isVi ? 'Đóng lớp học' : 'Close Class')                                                                                                                                   
                : (isVi ? 'Mở lại lớp học' : 'Reopen Class')                                                                                                                                
            }                                                                                                                                                                               
            message={                                                                                                                                                                       
              statusModalAction === 'close'                                                                                                                                                 
                ? (isVi                                                                                                                                                                     
                    ? `Bạn có chắc chắn muốn đóng lớp học "${classDetail?.name || ''}" không? Học viên sẽ không thể nộp bài tập mới.`                                                       
                    : `Are you sure you want to close class "${classDetail?.name || ''}"? Students will not be able to submit new assignments.`)                                            
                : (isVi                                                                                                                                                                     
                    ? `Bạn có chắc chắn muốn mở lại lớp học "${classDetail?.name || ''}" không?`                                                                                            
                    : `Are you sure you want to reopen class "${classDetail?.name || ''}"?`)                                                                                                
            }                                                                                                                                                                               
            confirmText={isVi ? 'Xác nhận' : 'Confirm'}                                                                                                                                     
            cancelText={isVi ? 'Hủy bỏ' : 'Cancel'}                                                                                                                                         
            variant={statusModalAction === 'close' ? 'warning' : 'primary'}                                                                                                                 
            isLoading={isUpdatingStatus}                                                                                                                                                    
            onConfirm={handleUpdateStatus}                                                                                                                                                  
            onCancel={() => setStatusModalAction(null)}                                                                                                                                     
          />                                                                                                                                                                                
                                                                                                                                                                                            
          {/* Modal đổi giáo viên phụ trách (UC008 / Issue #344) */}
          {showChangeTeacherModal && (
            <div className="eh-modal-backdrop" onClick={() => setShowChangeTeacherModal(false)} role="dialog" aria-modal="true">
              <div 
                className="eh-modal-dialog" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="eh-modal-header">
                  <div className="eh-modal-header-left">
                    <div className="eh-modal-header-icon">
                      <ArrowRightLeft size={18} />
                    </div>
                    <div>
                      <h3 className="eh-modal-title">
                        {isVi ? 'Thay đổi giáo viên phụ trách' : 'Change Instructor'}
                      </h3>
                      <p className="eh-modal-subtitle">
                        {classDetail?.name || classCode}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChangeTeacherModal(false)}
                    className="eh-modal-close-btn"
                    aria-label={isVi ? 'Đóng' : 'Close'}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="eh-modal-body">
                  <p className="text-sm text-secondary mb-4 leading-relaxed">
                    {isVi
                      ? `Chọn giảng viên mới để phụ trách và quản lý lớp "${classDetail?.name || classCode}". Giảng viên sẽ tiếp nhận toàn bộ quyền chấm điểm và theo dõi tiến độ của lớp.`
                      : `Select a new instructor to manage class "${classDetail?.name || classCode}". The instructor will receive grading and tracking permissions.`}
                  </p>
                  <div className="mb-2">
                    <TeacherPicker
                      selectedTeacherId={quickTeacherId}
                      isVi={isVi}
                      onSelectTeacher={(tc) => {
                        setQuickTeacher(tc);
                        setQuickTeacherId(tc ? String(tc.id) : '');
                      }}
                    />
                  </div>
                </div>
                <div className="eh-modal-footer">
                  <Button
                    variant="secondary"
                    onClick={() => setShowChangeTeacherModal(false)}
                    disabled={savingQuickTeacher}
                  >
                    {isVi ? 'Hủy bỏ' : 'Cancel'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleExecuteQuickChangeTeacher}
                    loading={savingQuickTeacher}
                    disabled={!quickTeacherId || (Boolean(classDetail?.teacher?.id) && String(quickTeacherId) === String(classDetail?.teacher?.id))}
                  >
                    {isVi ? 'Xác nhận đổi' : 'Confirm Change'}
                  </Button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default ClassDetails;
