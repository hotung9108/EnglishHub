import React, { useState } from 'react';

const Step3AddStudents = () => {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const mockStudents = [
    { id: 'HV001', name: 'Nguyễn Văn An', email: 'an.nguyen@email.com', level: 'IELTS 5.5' },
    { id: 'HV002', name: 'Trần Thị Bình', email: 'binh.tran@email.com', level: 'IELTS 6.0' },
    { id: 'HV003', name: 'Lê Hoàng Cường', email: 'cuong.le@email.com', level: 'IELTS 5.0' },
    { id: 'HV004', name: 'Phạm Thị Dung', email: 'dung.pham@email.com', level: 'Chưa test' },
    { id: 'HV005', name: 'Vũ Đức Duy', email: 'duy.vu@email.com', level: 'IELTS 6.5' }
  ];

  const toggleStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sId => sId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const toggleAll = () => {
    if (selectedStudents.length === mockStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(mockStudents.map(s => s.id));
    }
  };

  return (
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="headline-sm text-on-surface">Thêm học viên vào lớp</h2>
        <span className="badge badge-primary" style={{ fontSize: '14px', padding: '6px 12px' }}>
          Đã chọn: {selectedStudents.length} học viên
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#6B7280' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input 
            type="text" 
            className="input" 
            placeholder="Tìm kiếm học viên theo tên, email hoặc mã..." 
            style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} 
          />
        </div>
        <select className="input" style={{ width: '200px', padding: '12px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }}>
          <option value="">Lọc theo trình độ</option>
          <option value="ielts5">IELTS 5.0 - 5.5</option>
          <option value="ielts6">IELTS 6.0 - 6.5</option>
          <option value="notest">Chưa test đầu vào</option>
        </select>
      </div>

      <div style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-default)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
              <th style={{ padding: '16px', width: '48px' }}>
                <input 
                  type="checkbox" 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={selectedStudents.length === mockStudents.length && mockStudents.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th style={{ padding: '16px', color: '#4B5563', fontWeight: '600', fontSize: '14px' }}>Mã HV</th>
              <th style={{ padding: '16px', color: '#4B5563', fontWeight: '600', fontSize: '14px' }}>Họ và tên</th>
              <th style={{ padding: '16px', color: '#4B5563', fontWeight: '600', fontSize: '14px' }}>Email</th>
              <th style={{ padding: '16px', color: '#4B5563', fontWeight: '600', fontSize: '14px' }}>Trình độ hiện tại</th>
            </tr>
          </thead>
          <tbody>
            {mockStudents.map((student, index) => (
              <tr 
                key={student.id} 
                style={{ 
                  borderBottom: index !== mockStudents.length - 1 ? '1px solid var(--outline-variant)' : 'none',
                  backgroundColor: selectedStudents.includes(student.id) ? '#F3F4F6' : 'white',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => toggleStudent(student.id)}
              >
                <td style={{ padding: '16px' }}>
                  <input 
                    type="checkbox" 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => {}} // Handle change on row click
                    onClick={(e) => e.stopPropagation()} // Prevent double toggle
                  />
                </td>
                <td style={{ padding: '16px', fontWeight: '500', color: '#111827' }}>{student.id}</td>
                <td style={{ padding: '16px', color: '#374151' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold', color: '#4B5563' }}>
                      {student.name.charAt(0)}
                    </div>
                    {student.name}
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#6B7280' }}>{student.email}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                    backgroundColor: student.level === 'Chưa test' ? '#FEE2E2' : '#E0E7FF',
                    color: student.level === 'Chưa test' ? '#991B1B' : '#3730A3'
                  }}>
                    {student.level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Step3AddStudents;
