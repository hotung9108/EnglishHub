import React, { useState } from 'react';

const Step2AssignTeacher = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  const mockTeachers = [
    { id: 'T001', name: 'Trần Thị Mai Lan', role: 'Giáo viên IELTS', rating: 4.8 },
    { id: 'T002', name: 'Nguyễn Thu Trang', role: 'Giáo viên TOEIC', rating: 4.9 },
    { id: 'T003', name: 'Mark Reynolds', role: 'Giáo viên Bản ngữ', rating: 4.7 },
    { id: 'T004', name: 'Hoàng Minh Đức', role: 'Giáo viên Giao tiếp', rating: 4.6 }
  ];

  return (
    <div className="card" style={{ padding: '32px' }}>
      <h2 className="headline-sm text-on-surface" style={{ marginBottom: '24px' }}>Phân công giáo viên</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#6B7280' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input 
            type="text" 
            className="input" 
            placeholder="Tìm kiếm giáo viên theo tên hoặc mã..." 
            style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {mockTeachers.map(teacher => (
          <div 
            key={teacher.id}
            onClick={() => setSelectedTeacher(teacher.id)}
            style={{ 
              padding: '16px', 
              borderRadius: 'var(--radius-default)', 
              border: `2px solid ${selectedTeacher === teacher.id ? '#2563EB' : 'var(--outline-variant)'}`, 
              backgroundColor: selectedTeacher === teacher.id ? '#EFF6FF' : 'var(--surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', 
              backgroundColor: '#E5E7EB', display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontWeight: 'bold', color: '#4B5563', fontSize: '18px'
            }}>
              {teacher.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <h4 className="label-lg" style={{ color: '#111827', marginBottom: '4px' }}>{teacher.name}</h4>
              <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>{teacher.role}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#F59E0B' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                {teacher.rating}
              </div>
            </div>
            <div>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                border: `2px solid ${selectedTeacher === teacher.id ? '#2563EB' : '#D1D5DB'}`,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                backgroundColor: selectedTeacher === teacher.id ? '#2563EB' : 'transparent'
              }}>
                {selectedTeacher === teacher.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step2AssignTeacher;
