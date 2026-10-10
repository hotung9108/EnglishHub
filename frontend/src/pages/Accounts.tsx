import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, 
  X, Check, Lock, Unlock,
  Shield, Mail, Phone, Edit3, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { validateFullName } from '../utils/nameValidation';
import { useUsers } from '../hooks/useUsers';
import { userService } from '../api/services/user.service';
import type { UserListItem } from '../api/services/user.service';

export const Accounts: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [roleFilter, setRoleFilter] = useState<'All' | 'STUDENT' | 'TEACHER' | 'ADMIN'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'LOCKED'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    refetch
  } = useUsers({
    initialLimit: 100,
  });

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

  const filteredUsers = users.filter(user => {
    if (roleFilter !== 'All' && user.role !== roleFilter) return false;
    if (statusFilter !== 'All' && user.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = formatUserCode(user.id, user.role).toLowerCase();
      return (
        user.fullName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        code.includes(q)
      );
    }
    return true;
  });

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
    if (!formData.name.trim() || !formData.email.trim()) return;

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
        await updateUser(editingUser.id, {
          fullName: cleanName,
          phone: formData.phone || undefined
        });
        if (editingUser.status !== formData.status) {
          await userService.updateStatus(editingUser.id, formData.status);
        }
      } else {
        if (formData.role === 'TEACHER') {
          await createUser({
            role: 'TEACHER',
            fullName: cleanName,
            email: formData.email,
            password: formData.password || 'Teacher123!'
          });
        } else {
          await createUser({
            role: 'STUDENT',
            fullName: cleanName,
            email: formData.email,
            password: formData.password || 'Student123!',
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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : isVi ? 'Không thể thay đổi trạng thái tài khoản.' : 'Failed to update account status.');
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return { background: '#0f172a', color: '#ffffff' };
      case 'TEACHER': return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
      default: return { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' };
    }
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <Users size={28} color="var(--primary)" />
            {t('accounts.title')}
            <span className="adm-title-badge">{users.length} {isVi ? 'tài khoản' : 'accounts'}</span>
          </h1>
          <p className="adm-subtitle">
            {isVi ? 'Quản lý tài khoản người dùng, phân quyền truy cập và kiểm soát trạng thái đăng nhập.' : 'Directory of users across all roles, permission assignments, and active status.'}
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleOpenCreateDrawer}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={16} />
          <span>{t('accounts.addAccount')}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar">
        {/* Role & Status Pills */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="adm-pills">
            {(['All', 'STUDENT', 'TEACHER', 'ADMIN'] as const).map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`adm-pill ${roleFilter === role ? 'active' : ''}`}
              >
                <span>{role === 'All' ? (isVi ? 'Tất cả' : 'All') : role === 'STUDENT' ? 'Student' : role === 'TEACHER' ? 'Teacher' : 'Admin'}</span>
                <span className="adm-pill-badge">
                  {role === 'All' ? users.length : users.filter(u => u.role === role).length}
                </span>
              </button>
            ))}
          </div>

          <div className="adm-pills">
            {(['All', 'ACTIVE', 'LOCKED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`adm-pill ${statusFilter === status ? 'active' : ''}`}
                style={{ fontSize: '12px', padding: '4px 10px' }}
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="adm-search-shortcut">⌘F</span>
        </div>
      </div>

      {/* Error notification if load failed */}
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
          marginBottom: '16px'
        }}>
          <AlertCircle size={18} />
          <span>{error.message || (isVi ? 'Không thể tải danh sách tài khoản từ hệ thống.' : 'Failed to load users from server.')}</span>
        </div>
      )}

      {/* Modern Data Table */}
      <div className="adm-table-card">
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>{isVi ? 'Đang tải danh sách tài khoản...' : 'Loading accounts...'}</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              {isVi ? 'Không tìm thấy tài khoản nào' : 'No accounts found'}
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              {searchQuery ? (isVi ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Try adjusting your search query or filters') : (isVi ? 'Hệ thống hiện chưa có tài khoản nào trong danh mục này' : 'No accounts currently exist in this category')}
            </div>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>{t('accounts.colIdAvatar')}</th>
                <th>{t('accounts.colEmailPhone')}</th>
                <th>{t('accounts.colRole')}</th>
                <th>{t('accounts.colStatus')}</th>
                <th style={{ textAlign: 'right' }}>{t('accounts.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const code = formatUserCode(user.id, user.role);
                const initials = getAvatarInitials(user.fullName);
                const isActive = user.status === 'ACTIVE';

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="adm-cell-user">
                        <div 
                          className="adm-avatar"
                          style={{ 
                            backgroundColor: user.role === 'ADMIN' ? '#0f172a' : user.role === 'TEACHER' ? '#2563eb' : '#059669',
                            position: 'relative'
                          }}
                        >
                          {initials}
                          <span 
                            style={{
                              position: 'absolute',
                              bottom: '-1px',
                              right: '-1px',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: isActive ? '#22c55e' : '#ef4444',
                              border: '2px solid white'
                            }}
                          />
                        </div>
                        <div className="adm-avatar-info">
                          <div className="adm-avatar-name">{user.fullName}</div>
                          <div className="adm-avatar-meta font-mono">{code}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--on-surface)' }}>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          ...getRoleBadgeStyle(user.role),
                          padding: '4px 10px', 
                          borderRadius: 'var(--radius-full)', 
                          fontSize: '11.5px',
                          fontWeight: 700 
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isActive ? 'badge-active' : 'badge-onleave'}`}>
                        {isActive ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Bị khóa' : 'Blocked')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditDrawer(user)}
                          title={t('accounts.actionEdit')}
                          style={{ padding: '6px 10px' }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleStatus(user)}
                          title={isActive ? t('accounts.actionLock') : t('accounts.actionUnlock')}
                          style={{ padding: '6px 10px', color: isActive ? '#dc2626' : '#16a34a' }}
                        >
                          {isActive ? <Lock size={14} /> : <Unlock size={14} />}
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

      {/* Slide-over Drawer */}
      {isDrawerOpen && (
        <div className="adm-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <h2 className="adm-drawer-title">
                {editingUser 
                  ? (isVi ? `Chỉnh Sửa Tài Khoản: ${editingUser.fullName}` : `Edit Account: ${editingUser.fullName}`)
                  : (isVi ? 'Khởi Tạo Tài Khoản Người Dùng Mới' : 'Create New User Account')}
              </h2>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="adm-drawer-body">
                {actionError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '13px',
                    marginBottom: '14px'
                  }}>
                    {actionError}
                  </div>
                )}

                <div className="adm-form-group">
                  <label className="adm-form-label">
                    {t('accounts.colName')} <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input"
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
                    style={nameError ? { borderColor: 'var(--error, #ef4444)' } : undefined}
                    required
                  />
                  {nameError ? (
                    <span style={{ color: 'var(--error, #ef4444)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {nameError}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--on-surface-variant, #64748b)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {isVi ? 'Chỉ gồm chữ cái, dấu cách, gạch nối hoặc dấu nháy đơn (2 - 50 ký tự)' : 'Letters, spaces, hyphens, or apostrophes only (2 - 50 chars)'}
                    </span>
                  )}
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Email <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} className="text-on-surface-variant" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="email" 
                      className="input"
                      placeholder="user@center.edu.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ paddingLeft: '36px', width: '100%' }}
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
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} className="text-on-surface-variant" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      className="input"
                      placeholder="0912-345-678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ paddingLeft: '36px', width: '100%' }}
                    />
                  </div>
                </div>

                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-form-label">{t('accounts.colRole')}</label>
                    <select 
                      className="input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'STUDENT' | 'TEACHER' | 'ADMIN' })}
                      disabled={!!editingUser}
                    >
                      <option value="STUDENT">Student (Học viên)</option>
                      <option value="TEACHER">Teacher (Giáo viên)</option>
                      <option value="ADMIN">Admin (Quản trị viên)</option>
                    </select>
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

                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-low)', fontSize: '13px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={15} color="var(--primary)" />
                    {isVi ? 'Chính sách bảo mật tài khoản' : 'Security Credential Policy'}
                  </div>
                  {isVi 
                    ? 'Tài khoản mới sẽ có hiệu lực trực tiếp trên cơ sở dữ liệu hệ thống.' 
                    : 'Created user credentials will sync directly with the production authentication service.'}
                </div>
              </div>

              <div className="adm-drawer-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsDrawerOpen(false)}
                  disabled={actionLoading}
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={actionLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{isVi ? 'Lưu tài khoản' : 'Save User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
