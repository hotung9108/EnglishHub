import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, UserPlus, Search, 
  X, Check, Lock, Unlock, Shield,
  Mail, Phone, Edit3, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { validateFullName } from '../utils/nameValidation';
import { useUsers } from '../hooks/useUsers';
import { useDebounce } from '../hooks/useDebounce';
import { userService } from '../api/services/user.service';
import type { UserListItem } from '../api/services/user.service';
import { Button, EmptyState, Pagination, ConfirmModal } from '../components/common';
import { useToast } from '../components/common/ToastContext';

export const Accounts: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { success: toastSuccess, error: toastError } = useToast();
  const { user: currentUser } = useAuth();

  const [roleFilter, setRoleFilter] = useState<'All' | 'STUDENT' | 'TEACHER' | 'ADMIN'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'LOCKED'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusModalUser, setStatusModalUser] = useState<UserListItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const {
    users,
    pagination,
    isLoading,
    error,
    createUser,
    updateUser,
    setQuery,
    setRole,
    setPage,
    setLimit,
    refetch
  } = useUsers({
    initialPage: 1,
    initialLimit: 10,
    initialRole: undefined,
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 350);
  const isFirstSearchEffect = React.useRef(true);

  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      if (!debouncedSearchQuery.trim()) return;
    }
    setQuery(debouncedSearchQuery.trim());
  }, [debouncedSearchQuery, setQuery]);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'TEACHER' | 'ADMIN',
    status: 'ACTIVE' as 'ACTIVE' | 'LOCKED'
  });
  const [nameError, setNameError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const displayedUsers = useMemo(() => {
    if (statusFilter === 'All') return users;
    return users.filter(user => user.status === statusFilter);
  }, [users, statusFilter]);

  const handleRoleFilterChange = (role: 'All' | 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    setRoleFilter(role);
    setRole(role === 'All' ? undefined : role);
  };

  const handleStatusFilterChange = (status: 'All' | 'ACTIVE' | 'LOCKED') => {
    setStatusFilter(status);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handlePageSizeChange = (newSize: number) => {
    setLimit(newSize);
  };

  function formatUserCode(id: number, role: string) {
    const pad = String(id).padStart(4, '0');
    if (role === 'ADMIN') return `AD-${pad}`;
    if (role === 'TEACHER') return `GV-${pad}`;
    return `HV-${pad}`;
  }

  function getAvatarInitials(name: string) {
    if (!name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]).slice(-2).join('').toUpperCase();
  }

  const handleOpenCreateDrawer = () => {
    setEditingUser(null);
    setNameError('');
    setActionError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'STUDENT',
      status: 'ACTIVE'
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (user: UserListItem) => {
    setEditingUser(user);
    setNameError('');
    setActionError('');
    setFormData({
      name: user.fullName,
      email: user.email,
      phone: '',
      password: '',
      role: user.role,
      status: user.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE'
    });
    setIsDrawerOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (!editingUser && !formData.email.trim()) return;

    const valResult = validateFullName(formData.name, isVi);
    if (!valResult.isValid) {
      setNameError(valResult.errorMessage || '');
      return;
    }
    setNameError('');
    setActionError('');
    const cleanName = valResult.normalized;

    try {
      setActionLoading(true);
      if (editingUser) {
        const isEditingSelf = Boolean(currentUser && editingUser.id === currentUser.id);
        await updateUser(editingUser.id, {
          fullName: cleanName,
          phone: formData.phone || undefined,
          role: isEditingSelf ? undefined : formData.role
        });
        if (editingUser.status !== formData.status) {
          await userService.updateStatus(editingUser.id, formData.status);
        }
      } else {
        const defaultPassword = formData.role === 'ADMIN' 
          ? 'Admin123!' 
          : formData.role === 'TEACHER' 
            ? 'Teacher123!' 
            : 'Student123!';
        const password = formData.password.trim() || defaultPassword;
        if (formData.role === 'ADMIN') {
          await createUser({
            role: 'ADMIN',
            fullName: cleanName,
            email: formData.email.trim(),
            password
          });
        } else if (formData.role === 'TEACHER') {
          await createUser({
            role: 'TEACHER',
            fullName: cleanName,
            email: formData.email.trim(),
            password
          });
        } else {
          await createUser({
            role: 'STUDENT',
            fullName: cleanName,
            email: formData.email.trim(),
            password,
            parentPhone: formData.phone || undefined
          });
        }
      }
      await refetch();
      setIsDrawerOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isVi ? 'Có lỗi xảy ra khi lưu tài khoản.' : 'Failed to save account.';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserListItem) => {
    const nextStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await userService.updateStatus(user.id, nextStatus);
      await refetch();
      toastSuccess(
        isVi
          ? `Đã ${nextStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${user.email} thành công.`
          : `Successfully ${nextStatus === 'ACTIVE' ? 'activated' : 'locked'} account ${user.email}.`
      );
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : isVi ? 'Không thể thay đổi trạng thái tài khoản.' : 'Failed to update account status.');
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'TEACHER': return 'role-teacher';
      default: return 'role-student';
    }
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            {t('accounts.title')}
          </h1>
        </div>

        <div className="adm-actions">
          <Button 
            variant="primary"
            onClick={handleOpenCreateDrawer}
            icon={<UserPlus size={16} />}
          >
            {t('accounts.addAccount')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar">
        {/* Role & Status Pills */}
        <div className="flex gap-4 items-center flex-wrap">
          <div className="adm-pills">
            {(['All', 'STUDENT', 'TEACHER', 'ADMIN'] as const).map(role => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleFilterChange(role)}
                className={`adm-pill ${roleFilter === role ? 'active' : ''}`}
              >
                <span>{role === 'All' ? (isVi ? 'Tất cả' : 'All') : role === 'STUDENT' ? 'Student' : role === 'TEACHER' ? 'Teacher' : 'Admin'}</span>
                <span className="adm-pill-badge">
                  {role === 'All' 
                    ? pagination.total 
                    : (roleFilter === role ? pagination.total : users.filter(u => u.role === role).length)}
                </span>
              </button>
            ))}
          </div>

          <div className="adm-pills">
            {(['All', 'ACTIVE', 'LOCKED'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusFilterChange(status)}
                className={`adm-pill ${statusFilter === status ? 'active' : ''}`}
              >
                <span>{status === 'All' ? (isVi ? 'Trạng thái' : 'All Status') : status === 'ACTIVE' ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Khóa' : 'Blocked')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input 
            type="text" 
            className="adm-search-input"
            placeholder={t('accounts.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Error notification if load failed */}
      {error && (
        <div className="adm-alert-error">
          <AlertCircle size={18} />
          <span>{error.message || (isVi ? 'Không thể tải danh sách tài khoản từ hệ thống.' : 'Failed to load users from server.')}</span>
        </div>
      )}

      {/* Modern Data Table */}
      <div className="adm-table-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted">
            <Loader2 size={32} className="animate-spin mx-auto mb-3" />
            <div>{isVi ? 'Đang tải danh sách tài khoản...' : 'Loading accounts...'}</div>
          </div>
        ) : displayedUsers.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title={isVi ? 'Không tìm thấy tài khoản nào' : 'No accounts found'}
            description={searchQuery 
              ? (isVi ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Try adjusting your search query or filters') 
              : (isVi ? 'Hệ thống hiện chưa có tài khoản nào trong danh mục này' : 'No accounts currently exist in this category')}
          />
        ) : (
          <>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{t('accounts.colIdAvatar')}</th>
                  <th>{t('accounts.colEmailPhone')}</th>
                  <th>{t('accounts.colRole')}</th>
                  <th>{t('accounts.colStatus')}</th>
                  <th className="text-right">{t('accounts.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map(user => {
                  const code = formatUserCode(user.id, user.role);
                  const initials = getAvatarInitials(user.fullName);
                  const isActive = user.status === 'ACTIVE';

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="adm-cell-user">
                          <div className={`adm-avatar ${getRoleClass(user.role)} relative`}>
                            {initials}
                            <span className={`adm-avatar-status ${isActive ? 'active' : 'blocked'}`} />
                          </div>
                          <div className="adm-avatar-info">
                            <div className="adm-avatar-name">{user.fullName}</div>
                            <div className="adm-avatar-meta font-mono">{code}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0">
                          <span className="text-sm text-surface">{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.role === 'ADMIN' ? 'badge-role-admin' : user.role === 'TEACHER' ? 'badge-role-teacher' : 'badge-role-student'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-active' : 'badge-blocked'}`}>
                          {isActive ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Bị khóa' : 'Blocked')}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEditDrawer(user)}
                            title={t('accounts.actionEdit')}
                            icon={<Edit3 size={14} />}
                          />
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => setStatusModalUser(user)}
                            title={isActive ? t('accounts.actionLock') : t('accounts.actionUnlock')}
                            className={isActive ? 'text-error' : 'text-success'}
                            icon={isActive ? <Lock size={14} /> : <Unlock size={14} />}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={(page) => setPage(page)}
              onPageSizeChange={handlePageSizeChange}
              itemLabel={isVi ? 'tài khoản' : 'accounts'}
              isVi={isVi}
              variant="table"
            />
          </>
        )}
      </div>

      {/* Slide-over Drawer for Create & Edit */}
      {isDrawerOpen && (
        <div className="adm-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <h2 className="adm-drawer-title">
                {editingUser 
                  ? (isVi ? `Chỉnh Sửa Tài Khoản: ${editingUser.fullName}` : `Edit Account: ${editingUser.fullName}`)
                  : (isVi ? 'Thêm Tài Khoản Mới' : 'Add New Account')}
              </h2>
              <button 
                type="button" 
                className="btn-ghost p-1 cursor-pointer"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex flex-col flex-1">
              <div className="adm-drawer-body">
                {actionError && (
                  <div className="adm-alert-error">
                    {actionError}
                  </div>
                )}

                <div className="adm-form-group">
                  <label className="adm-form-label">
                    {t('accounts.colName')} <span className="text-error">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`input ${nameError ? 'border-error' : ''}`}
                    placeholder="Nguyễn Văn A..."
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (nameError) setNameError('');
                    }}
                    onBlur={() => {
                      const res = validateFullName(formData.name, isVi);
                      if (!res.isValid) {
                        setNameError(res.errorMessage || '');
                      } else {
                        setNameError('');
                      }
                    }}
                    required
                  />
                  {nameError ? (
                    <span className="text-error text-xs mt-1 block">
                      {nameError}
                    </span>
                  ) : (
                    <span className="text-muted text-xs mt-1 block">
                      {isVi ? 'Chỉ gồm chữ cái, dấu cách, gạch nối hoặc dấu nháy đơn (2 - 50 ký tự)' : 'Letters, spaces, hyphens, or apostrophes only (2 - 50 chars)'}
                    </span>
                  )}
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Email <span className="text-error">*</span>
                  </label>
                  <div className="adm-input-icon-wrap">
                    <Mail size={16} className="adm-input-icon" />
                    <input 
                      type="email" 
                      className={`input adm-input-with-icon ${editingUser ? 'opacity-80 cursor-not-allowed' : ''}`}
                      placeholder="user@center.edu.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingUser}
                      required
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      {isVi ? 'Mật khẩu ban đầu' : 'Initial Password'}
                    </label>
                    <input 
                      type="password" 
                      className="input"
                      placeholder={isVi ? 'Để trống dùng mặc định' : 'Leave empty for default'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                <div className="adm-form-group">
                  <label className="adm-form-label">
                    {isVi ? 'Số điện thoại' : 'Phone Number'}
                  </label>
                  <div className="adm-input-icon-wrap">
                    <Phone size={16} className="adm-input-icon" />
                    <input 
                      type="text" 
                      className="input adm-input-with-icon"
                      placeholder="0912-345-678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-form-label">{t('accounts.colRole')}</label>
                    {(() => {
                      const isEditingSelf = Boolean(editingUser && currentUser && editingUser.id === currentUser.id);
                      return (
                        <>
                          <select 
                            className={`input ${isEditingSelf ? 'opacity-80 cursor-not-allowed' : ''}`}
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'STUDENT' | 'TEACHER' | 'ADMIN' })}
                            disabled={isEditingSelf}
                            title={isEditingSelf ? (isVi ? 'Không thể tự thay đổi vai trò của chính mình' : 'Cannot change your own role') : undefined}
                          >
                            <option value="STUDENT">Student (Học viên)</option>
                            <option value="TEACHER">Teacher (Giáo viên)</option>
                            <option value="ADMIN">Admin (Quản trị viên)</option>
                          </select>
                          {isEditingSelf && (
                            <span className="text-muted text-xs mt-1 block">
                              {isVi ? 'Không thể tự thay đổi vai trò của chính mình' : 'Cannot change your own role'}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{t('accounts.colStatus')}</label>
                    <select 
                      className="input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'LOCKED' })}
                    >
                      <option value="ACTIVE">{isVi ? 'Hoạt động (Active)' : 'Active'}</option>
                      <option value="LOCKED">{isVi ? 'Tạm khóa (Blocked)' : 'Blocked'}</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-surface-low text-xs text-muted leading-relaxed">
                  <div className="font-semibold text-surface mb-1 flex items-center gap-2">
                    <Shield size={15} className="text-primary" />
                    {isVi ? 'Chính sách bảo mật tài khoản' : 'Security Credential Policy'}
                  </div>
                  {isVi 
                    ? 'Tài khoản mới sẽ có hiệu lực trực tiếp trên cơ sở dữ liệu hệ thống.' 
                    : 'Created user credentials will sync directly with the production authentication service.'}
                </div>
              </div>

              <div className="adm-drawer-footer">
                <Button 
                  variant="secondary"
                  type="button" 
                  onClick={() => setIsDrawerOpen(false)}
                  disabled={actionLoading}
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </Button>
                <Button 
                  variant="primary"
                  type="submit" 
                  loading={actionLoading}
                  icon={<Check size={16} />}
                >
                  {editingUser ? (isVi ? 'Lưu thay đổi' : 'Save Changes') : (isVi ? 'Lưu tài khoản' : 'Save User')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Two-Step Confirmation Modal for Account Status Change */}
      {statusModalUser && (
        <ConfirmModal
          isOpen={Boolean(statusModalUser)}
          title={
            statusModalUser.status === 'ACTIVE'
              ? (isVi ? 'Xác nhận khóa tài khoản' : 'Lock User Account')
              : (isVi ? 'Xác nhận mở khóa tài khoản' : 'Unlock User Account')
          }
          message={
            statusModalUser.status === 'ACTIVE'
              ? (isVi
                  ? `Bạn có chắc chắn muốn khóa tài khoản "${statusModalUser.fullName || statusModalUser.email}"? Người dùng này sẽ bị tạm dừng quyền truy cập và không thể đăng nhập vào hệ thống.`
                  : `Are you sure you want to lock account "${statusModalUser.fullName || statusModalUser.email}"? The user will lose access to EnglishHub until unlocked.`)
              : (isVi
                  ? `Khôi phục quyền truy cập hệ thống cho tài khoản "${statusModalUser.fullName || statusModalUser.email}"?`
                  : `Restore system access for "${statusModalUser.fullName || statusModalUser.email}"?`)
          }
          confirmText={
            statusModalUser.status === 'ACTIVE'
              ? (isVi ? 'Khóa tài khoản' : 'Lock Account')
              : (isVi ? 'Mở khóa' : 'Unlock Account')
          }
          cancelText={isVi ? 'Hủy bỏ' : 'Cancel'}
          variant={statusModalUser.status === 'ACTIVE' ? 'danger' : 'primary'}
          isLoading={isUpdatingStatus}
          onConfirm={async () => {
            setIsUpdatingStatus(true);
            try {
              await handleToggleStatus(statusModalUser);
              setStatusModalUser(null);
            } finally {
              setIsUpdatingStatus(false);
            }
          }}
          onCancel={() => setStatusModalUser(null)}
        />
      )}
    </div>
  );
};

export default Accounts;