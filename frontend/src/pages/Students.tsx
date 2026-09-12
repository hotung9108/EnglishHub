

import { useNavigate } from 'react-router-dom';

const Students = () => {
  const navigate = useNavigate();
  const data = [
    { id: 'HV-8801', name: 'Alice Johnson', class: 'ENG-IELTS-6.5A', target: 'Target: 7.0 (Đầu vào 5.5)', progress: '14/15 Bài', progressStatus: 'good' },
    { id: 'HV-8802', name: 'David Pham', class: 'ENG-IELTS-6.5A', target: 'Target: 6.5 (Đầu vào 5.0)', progress: '8/15 Bài', progressStatus: 'warning' },
    { id: 'HV-8803', name: 'Lê Bảo Trâm', class: 'ENG-TOEIC-750', target: 'Target: 800 (Đầu vào 600)', progress: '12/12 Bài', progressStatus: 'good' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Quản Lý Học Viên</h1>
      </div>

      {/* Content Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header Section */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>Quản lý danh sách Học viên</h3>
            <p className="label-md text-on-surface-variant">Admin &gt; Danh bạ học viên toàn khóa</p>
          </div>
          <button className="btn btn-secondary" style={{ backgroundColor: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)', border: 'none' }}>
            Import Excel (.xlsx)
          </button>
        </div>

        {/* Filters & Actions */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
            <input type="text" className="input" placeholder="Tìm tên học viên, mã HV..." style={{ maxWidth: '400px' }} />
            <select className="input" style={{ maxWidth: '240px' }}>
              <option>Tất cả trình độ (A1-C1)</option>
              <option>IELTS</option>
              <option>TOEIC</option>
              <option>Giao tiếp</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ backgroundColor: 'var(--primary)' }} onClick={() => navigate('/admin/students/create')}>
            Thêm học viên +
          </button>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <tr>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>MÃ HV</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>HỌ VÀ TÊN</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>LỚP HIỆN TẠI</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>TARGET / ĐIỂM VÀO</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>TIẾN ĐỘ NỘP BÀI</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>{row.id}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{row.class}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{row.target}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`badge ${row.progressStatus === 'good' ? 'badge-progress-good' : 'badge-progress-warning'}`}>
                      {row.progress}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button className="label-md text-primary" style={{ padding: 0, cursor: 'pointer' }}>Sửa</button>
                      <button className="label-md text-on-surface-variant" style={{ padding: 0, cursor: 'pointer' }}>Lịch sử</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards Fallback */}
          <div className="mobile-card-list" style={{ padding: '16px' }}>
            {data.map((row, i) => (
              <div key={i} className="card" style={{ padding: '16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '16px' }}>{row.name}</strong>
                    <div className="label-md text-on-surface-variant">{row.id}</div>
                  </div>
                  <span className={`badge ${row.progressStatus === 'good' ? 'badge-progress-good' : 'badge-progress-warning'}`}>{row.progress}</span>
                </div>
                <div className="body-md text-on-surface-variant" style={{ marginBottom: '4px' }}>{row.class}</div>
                <div className="label-md text-on-surface-variant" style={{ marginBottom: '16px' }}>{row.target}</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', flex: 1 }}>Sửa</button>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', flex: 1 }}>Lịch sử</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students;
