

const Accounts = () => {
  const data = [
    { id: 'HV-8801', avatar: 'AJ', name: 'Alice Johnson', email: 'alice@center.edu.vn', phone: '0987-654-321', role: 'Student', status: 'Active' },
    { id: 'GV-001', avatar: 'TL', name: 'Trần Thị Mai Lan', email: 'mailan@center.edu.vn', phone: '0912-345-678', role: 'Teacher', status: 'Active' },
    { id: 'HV-8802', avatar: 'DP', name: 'David Pham', email: 'david@center.edu.vn', phone: '0933-111-222', role: 'Student', status: 'Blocked' },
    { id: 'AD-001', avatar: 'NV', name: 'Nguyễn Văn Hùng', email: 'hung@center.edu.vn', phone: '0944-555-666', role: 'Admin', status: 'Active' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">Quản lý tài khoản</h2>
      </div>

      {/* Content Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>Quản lý người dùng toàn hệ thống</h3>
            <p className="label-md text-on-surface-variant">Admin Dashboard &gt; Danh sách tài khoản</p>
          </div>
          <button className="btn btn-primary">
            Thêm tài khoản mới +
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input type="text" className="input" placeholder="Tìm tên, email, SĐT..." style={{ maxWidth: '320px' }} />
          <select className="input" style={{ maxWidth: '200px' }}>
            <option>Tất cả vai trò</option>
            <option>Student</option>
            <option>Teacher</option>
            <option>Admin</option>
          </select>
          <select className="input" style={{ maxWidth: '200px' }}>
            <option>Tất cả trạng thái</option>
            <option>Active</option>
            <option>Blocked</option>
          </select>
          <span className="label-md text-on-surface-variant" style={{ alignSelf: 'center' }}>Tổng số: {data.length} tài khoản</span>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID / AVATAR</th>
                <th>HỌ VÀ TÊN</th>
                <th>EMAIL &amp; SĐT</th>
                <th>VAI TRÒ</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="topbar-avatar">{row.avatar}</div>
                      <span className="label-md text-on-surface-variant">{row.id}</span>
                    </div>
                  </td>
                  <td><strong>{row.name}</strong></td>
                  <td>
                    <div>{row.email}</div>
                    <div className="label-md text-on-surface-variant">{row.phone}</div>
                  </td>
                  <td>
                    <span className={row.role === 'Admin' ? 'badge badge-primary' : 'badge'} style={row.role !== 'Admin' ? { border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' } : {}}>
                      {row.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${row.status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="label-md text-primary" style={{ padding: '4px 8px', cursor: 'pointer' }}>Sửa</button>
                      <button className="label-md text-error" style={{ padding: '4px 8px', cursor: 'pointer' }}>
                        {row.status === 'Active' ? 'Khóa' : 'Mở'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="mobile-card-list">
            {data.map((row, i) => (
              <div key={i} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="topbar-avatar">{row.avatar}</div>
                    <div>
                      <strong>{row.name}</strong>
                      <div className="label-md text-on-surface-variant">{row.id}</div>
                    </div>
                  </div>
                  <span className={`badge ${row.status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>{row.status}</span>
                </div>
                <div className="label-md text-on-surface-variant" style={{ marginBottom: '8px' }}>{row.email} - {row.phone}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={row.role === 'Admin' ? 'badge badge-primary' : 'badge'} style={row.role !== 'Admin' ? { border: '1px solid var(--outline-variant)' } : {}}>{row.role}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Sửa</button>
                    <button className="btn btn-error" style={{ padding: '6px 12px', fontSize: '13px' }}>{row.status === 'Active' ? 'Khóa' : 'Mở'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '8px' }}>
          <span className="label-md text-on-surface-variant">Hiển thị 1 - 4 trên {data.length} người dùng</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }}>&lt;</button>
            <button className="btn btn-primary" style={{ padding: '6px 12px' }}>1</button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }}>2</button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }}>3</button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
