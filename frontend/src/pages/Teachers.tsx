import { useLanguage } from '../contexts/LanguageContext';

const Teachers = () => {
  useLanguage();

  const teachers = [
    {
      id: 1,
      name: 'Trần Thị Mai Lan',
      status: 'Active',
      certs: 'IELTS 8.5 / TESOL Certified',
      classesCount: 4,
      pendingGrades: 24
    },
    {
      id: 2,
      name: 'Mark Reynolds',
      status: 'Active',
      certs: 'Native Speaker / CELTA',
      classesCount: 3,
      pendingGrades: 8
    },
    {
      id: 3,
      name: 'Nguyễn Thu Trang',
      status: 'Active',
      certs: 'TOEIC 990 / MA Linguistics',
      classesCount: 5,
      pendingGrades: 19
    },
    {
      id: 4,
      name: 'Hoàng Minh Đức',
      status: 'On Leave',
      certs: 'IELTS 8.0 / Writing Specialist',
      classesCount: 2,
      pendingGrades: 0
    }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Quản Lý Giáo Viên</h1>
      </div>

      {/* Main Container */}
      <div className="card" style={{ padding: '32px' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>Hồ sơ đội ngũ Giáo viên</h3>
            <p className="label-md text-on-surface-variant">Admin &gt; Quản lý Giáo viên &amp; Chuyên môn</p>
          </div>
          <button className="btn btn-primary" style={{ backgroundColor: 'var(--inverse-surface)' }}>
            Thêm hồ sơ giáo viên +
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <p className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', marginBottom: '8px' }}>TỔNG SỐ GIÁO VIÊN</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="display-lg text-primary">18</span>
              <span className="headline-md text-on-surface">Giảng viên</span>
            </div>
          </div>
          <div style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <p className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', marginBottom: '8px' }}>LỚP ĐANG PHỤ TRÁCH</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="display-lg text-on-surface">32</span>
              <span className="headline-md text-on-surface">Lớp học</span>
            </div>
          </div>
          <div style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <p className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', marginBottom: '8px' }}>BÀI CHẤM TRUNG BÌNH/TUẦN</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="display-lg text-on-surface">145</span>
              <span className="headline-md text-on-surface">Bài</span>
            </div>
          </div>
        </div>

        {/* Teacher Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {teachers.map(teacher => (
            <div key={teacher.id} style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 className="headline-md text-on-surface">{teacher.name}</h4>
                <span className={`badge ${teacher.status === 'Active' ? 'badge-active' : 'badge-onleave'}`} style={{ border: '1px solid var(--outline-variant)' }}>
                  {teacher.status}
                </span>
              </div>
              <p className="body-md text-on-surface-variant" style={{ marginBottom: '24px' }}>{teacher.certs}</p>

              {/* Divider */}
              <hr style={{ borderTop: '1px solid var(--outline-variant)', borderBottom: 'none', margin: '0 0 24px 0', opacity: 0.5 }} />

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', flex: 1 }}>
                <p className="body-md text-on-surface-variant">{teacher.classesCount} lớp đang dạy</p>
                <p className="body-md text-on-surface-variant">{teacher.pendingGrades} bài chờ chấm</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button className="btn btn-secondary">Chi tiết hồ sơ</button>
                <button className="btn btn-secondary">Phân lớp</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teachers;
