

const Classes = () => {
  const activeClasses = [
    {
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5',
      teacher: 'Trần Thị Mai Lan',
      students: 24,
      schedule: 'T2-T4-T6 (18:00 - 20:00)',
      status: 'Đang mở'
    },
    {
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC Cấp tốc 750+',
      teacher: 'Nguyễn Thu Trang',
      students: 18,
      schedule: 'T3-T5-T7 (19:30 - 21:00)',
      status: 'Đang mở'
    },
    {
      code: 'ENG-COMM-B2',
      name: 'Tiếng Anh Giao tiếp Chuyên sâu',
      teacher: 'Mark Reynolds',
      students: 12,
      schedule: 'T7-CN (09:00 - 11:30)',
      status: 'Đang mở'
    }
  ];

  const pastClasses = [
    {
      code: 'ENG-IELTS-5.0',
      name: 'IELTS Pre-Intermediate Khóa 12',
      teacher: 'Hoàng Minh Đức',
      students: 20,
      completedDate: '08/2023',
      status: 'Đã kết thúc'
    }
  ];

  const renderClassCard = (cls: any, isPast = false) => {
    const cardStyle = isPast ? {
      backgroundColor: 'var(--surface-container-lowest)',
      border: '1px solid var(--outline-variant)',
      opacity: 0.8
    } : {
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--outline-variant)',
      boxShadow: 'var(--shadow-sm)'
    };

    return (
      <div key={cls.code} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', ...cardStyle }}>
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="badge badge-primary" style={isPast ? { backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface-variant)' } : {}}>{cls.code}</span>
          {isPast ? (
            <span className="badge" style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--on-surface-variant)' }}></span>
              {cls.status}
            </span>
          ) : (
            <span className="badge" style={{ backgroundColor: '#C3E9C8', color: '#006C49', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#006C49' }}></span>
              {cls.status}
            </span>
          )}
        </div>

        {/* Content */}
        <h3 className="headline-md text-on-surface" style={{ marginBottom: '16px', lineHeight: 1.4, flex: 1 }}>{cls.name}</h3>
        
        <p className="body-md text-on-surface-variant" style={{ marginBottom: '16px' }}>
          GV: {cls.teacher}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>👥</span> Sĩ số: {cls.students} học viên
          </p>
          {isPast ? (
            <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>📅</span> Hoàn thành {cls.completedDate}
            </p>
          ) : (
            <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🕒</span> Lịch: {cls.schedule}
            </p>
          )}
        </div>

        {/* Action Button */}
        <button className="btn" style={{ 
          width: '100%', 
          backgroundColor: isPast ? 'var(--surface-container-lowest)' : 'transparent', 
          color: 'var(--on-surface)', 
          border: '1px solid var(--outline-variant)',
          marginTop: 'auto'
        }}>
          {isPast ? 'Xem chi tiết' : 'Quản lý lớp'}
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="page-title">Quản lý lớp học</h2>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 24px' }}>
          + Tạo lớp học mới
        </button>
      </div>

      <hr style={{ borderTop: '1px solid var(--outline-variant)', borderBottom: 'none', margin: '0 0 32px 0' }} />

      {/* Grid container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {activeClasses.map((cls: any) => renderClassCard(cls, false))}
        {pastClasses.map((cls: any) => renderClassCard(cls, true))}
      </div>
    </div>
  );
};

export default Classes;
