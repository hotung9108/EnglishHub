import { useState } from 'react';

const Step2AssignTeacher = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  const mockTeachers = [
    { id: 'T001', name: 'Trần Thị Mai Lan', role: 'Giáo viên IELTS', rating: 4.8 },
    { id: 'T002', name: 'Nguyễn Thu Trang', role: 'Giáo viên TOEIC', rating: 4.9 },
    { id: 'T003', name: 'Mark Reynolds', role: 'Giáo viên Bản ngữ', rating: 4.7 },
    { id: 'T004', name: 'Hoàng Minh Đức', role: 'Giáo viên Giao tiếp', rating: 4.6 }
  ];

  return (
    <div className="card p-32">
      <h2 className="headline-sm text-on-surface mb-24">Phân công giáo viên</h2>
      
      <div className="mb-24">
        <div className="relative" style={{ maxWidth: '400px' }}>
          <span className="absolute text-on-surface-variant" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input 
            type="text" 
            className="input w-full" 
            placeholder="Tìm kiếm giáo viên theo tên hoặc mã..." 
            style={{ paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} 
          />
        </div>
      </div>

      <div className="grid grid-auto-fit-240 gap-16">
        {mockTeachers.map(teacher => (
          <div 
            key={teacher.id}
            onClick={() => setSelectedTeacher(teacher.id)}
            className="flex items-center gap-16 p-16 rounded cursor-pointer transition-all"
            style={{ 
              border: `2px solid ${selectedTeacher === teacher.id ? '#2563EB' : 'var(--outline-variant)'}`, 
              backgroundColor: selectedTeacher === teacher.id ? '#EFF6FF' : 'var(--surface)'
            }}
          >
            <div className="flex justify-center items-center font-bold text-on-surface-variant" style={{ 
              width: '48px', height: '48px', borderRadius: '50%', 
              backgroundColor: '#E5E7EB', fontSize: '18px'
            }}>
              {teacher.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="label-lg mb-4" style={{ color: '#111827' }}>{teacher.name}</h4>
              <p className="text-on-surface-variant mb-4" style={{ fontSize: '12px' }}>{teacher.role}</p>
              <div className="flex items-center gap-4 text-warning" style={{ fontSize: '12px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                {teacher.rating}
              </div>
            </div>
            <div>
              <div className="flex justify-center items-center rounded-full" style={{ 
                width: '24px', height: '24px', 
                border: `2px solid ${selectedTeacher === teacher.id ? '#2563EB' : '#D1D5DB'}`,
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
