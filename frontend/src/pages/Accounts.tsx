import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, 
  X, Check, Lock, Unlock,
  Shield, Mail, Phone, Edit3
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AccountUser {
  id: string;
  avatar: string;
  name: string;
  email: string;
  phone: string;
  role: 'Student' | 'Teacher' | 'Admin';
  status: 'Active' | 'Blocked';
  joinedDate: string;
}

export const Accounts: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [users, setUsers] = useState<AccountUser[]>([
    { id: 'HV-8801', avatar: 'AJ', name: 'Alice Johnson', email: 'alice@center.edu.vn', phone: '0987-654-321', role: 'Student', status: 'Active', joinedDate: '2025-10-15' },
    { id: 'GV-001', avatar: 'TL', name: 'Trần Thị Mai Lan', email: 'mailan@center.edu.vn', phone: '0912-345-678', role: 'Teacher', status: 'Active', joinedDate: '2024-08-20' },
    { id: 'HV-8802', avatar: 'DP', name: 'David Pham', email: 'david@center.edu.vn', phone: '0933-111-222', role: 'Student', status: 'Blocked', joinedDate: '2025-11-01' },
    { id: 'AD-001', avatar: 'NV', name: 'Nguyễn Văn Hùng', email: 'hung@center.edu.vn', phone: '0944-555-666', role: 'Admin', status: 'Active', joinedDate: '2024-01-10' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Student' | 'Teacher' | 'Admin'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Blocked'>('All');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AccountUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Student' as 'Student' | 'Teacher' | 'Admin',
    status: 'Active' as 'Active' | 'Blocked'
  });

  const filteredUsers = users.filter(user => {
    if (roleFilter !== 'All' && user.role !== roleFilter) return false;
    if (statusFilter !== 'All' && user.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q) ||
        user.phone.includes(q)
      );
    }
    return true;
  });

  const handleOpenCreateDrawer = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Student',
      status: 'Active'
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (user: AccountUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    });
    setIsDrawerOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        ...formData
      } : u));
    } else {
      const newId = formData.role === 'Admin' ? `AD-00${users.length + 1}` : formData.role === 'Teacher' ? `GV-00${users.length + 1}` : `HV-880${users.length + 1}`;
      const initials = formData.name.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();
      const newUser: AccountUser = {
        id: newId,
        avatar: initials,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || 'Chưa cập nhật',
        role: formData.role,
        status: formData.status,
        joinedDate: new Date().toISOString().split('T')[0]
      };
      setUsers(prev => [newUser, ...prev]);
    }
    setIsDrawerOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'Active' ? 'Blocked' : 'Active' };
      }
      return u;
    }));
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin': return { background: '#0f172a', color: '#ffffff' };
      case 'Teacher': return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
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
            {(['All', 'Student', 'Teacher', 'Admin'] as const).map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`adm-pill ${roleFilter === role ? 'active' : ''}`}
              >
                <span>{role === 'All' ? (isVi ? 'Tất cả' : 'All') : role}</span>
                <span className="adm-pill-badge">
                  {role === 'All' ? users.length : users.filter(u => u.role === role).length}
                </span>
              </button>
            ))}
          </div>

          <div className="adm-pills">
            {(['All', 'Active', 'Blocked'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`adm-pill ${statusFilter === status ? 'active' : ''}`}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                <span>{status === 'All' ? (isVi ? 'Trạng thái' : 'All Status') : status === 'Active' ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Khóa' : 'Blocked')}</span>
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

      {/* Modern Data Table */}
      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>{t('accounts.colIdAvatar')}</th>
              <th>{t('accounts.colEmailPhone')}</th>
              <th>{t('accounts.colRole')}</th>
              <th>{t('accounts.colStatus')}</th>
              <th>{isVi ? 'NGÀY TẠO' : 'JOINED DATE'}</th>
              <th style={{ textAlign: 'right' }}>{t('accounts.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="adm-cell-user">
                    <div 
                      className="adm-avatar"
                      style={{ 
                        backgroundColor: user.role === 'Admin' ? '#0f172a' : user.role === 'Teacher' ? '#2563eb' : '#059669',
                        position: 'relative'
                      }}
                    >
                      {user.avatar}
                      <span 
                        style={{
                          position: 'absolute',
                          bottom: '-1px',
                          right: '-1px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: user.status === 'Active' ? '#22c55e' : '#ef4444',
                          border: '2px solid white'
                        }}
                      />
                    </div>
                    <div className="adm-avatar-info">
                      <div className="adm-avatar-name">{user.name}</div>
                      <div className="adm-avatar-meta font-mono">{user.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--on-surface)' }}>{user.email}</span>
                    <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{user.phone}</span>
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
                  <span className={`badge ${user.status === 'Active' ? 'badge-active' : 'badge-onleave'}`}>
                    {user.status === 'Active' ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Bị khóa' : 'Blocked')}
                  </span>
                </td>
                <td className="font-mono text-on-surface-variant" style={{ fontSize: '12.5px' }}>
                  {user.joinedDate}
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
                      onClick={() => handleToggleStatus(user.id)}
                      title={user.status === 'Active' ? t('accounts.actionLock') : t('accounts.actionUnlock')}
                      style={{ padding: '6px 10px', color: user.status === 'Active' ? '#dc2626' : '#16a34a' }}
                    >
                      {user.status === 'Active' ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over Drawer (Mobbin / Linear Sheet Pattern) */}
      {isDrawerOpen && (
        <div className="adm-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="adm-drawer-header">
              <h2 className="adm-drawer-title">
                {editingUser 
                  ? (isVi ? `Chỉnh Sửa Tài Khoản: ${editingUser.name}` : `Edit Account: ${editingUser.name}`)
                  : (isVi ? 'Khởi Tạo Tài Khoản Người Dùng Mới' : 'Create New User Account')}
              </h2>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="adm-drawer-body">
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    {t('accounts.colName')} <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="Nguyễn Văn A..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
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
                      required
                    />
                  </div>
                </div>

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
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Student' | 'Teacher' | 'Admin' })}
                    >
                      <option value="Student">Student (Học viên)</option>
                      <option value="Teacher">Teacher (Giáo viên)</option>
                      <option value="Admin">Admin (Quản trị viên)</option>
                    </select>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{t('accounts.colStatus')}</label>
                    <select 
                      className="input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Blocked' })}
                    >
                      <option value="Active">{isVi ? 'Hoạt động (Active)' : 'Active'}</option>
                      <option value="Blocked">{isVi ? 'Tạm khóa (Blocked)' : 'Blocked'}</option>
                    </select>
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-low)', fontSize: '13px', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={15} color="var(--primary)" />
                    {isVi ? 'Chính sách bảo mật tài khoản' : 'Security Credential Policy'}
                  </div>
                  {isVi 
                    ? 'Tài khoản mới sẽ nhận mật khẩu tạm thời gửi qua email và bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.' 
                    : 'A temporary credentials email will be dispatched and must be refreshed on initial login.'}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="adm-drawer-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsDrawerOpen(false)}
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} />
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
