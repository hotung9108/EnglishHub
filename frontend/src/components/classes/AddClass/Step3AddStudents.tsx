import { useState } from 'react';

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
    <div className="card p-32">
      <div className="flex-between mb-24">
        <h2 className="headline-sm text-on-surface">Thêm học viên vào lớp</h2>
        <span className="badge badge-primary font-medium" style={{ fontSize: '14px', padding: '6px 12px' }}>
          Đã chọn: {selectedStudents.length} học viên
        </span>
      </div>
      
      <div className="flex gap-16 mb-24">
        <div className="relative flex-1">
          <span className="absolute text-on-surface-variant" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input 
            type="text" 
            className="input w-full" 
            placeholder="Tìm kiếm học viên theo tên, email hoặc mã..." 
            style={{ paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} 
          />
        </div>
        <select className="input p-12-16" style={{ width: '200px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }}>
          <option value="">Lọc theo trình độ</option>
          <option value="ielts5">IELTS 5.0 - 5.5</option>
          <option value="ielts6">IELTS 6.0 - 6.5</option>
          <option value="notest">Chưa test đầu vào</option>
        </select>
      </div>

      <div className="table-container rounded" style={{ border: '1px solid var(--outline-variant)' }}>
        <table className="table w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <th className="p-16" style={{ width: '48px', borderBottom: '1px solid var(--outline-variant)' }}>
                <input 
                  type="checkbox" 
                  className="cursor-pointer"
                  style={{ width: '18px', height: '18px' }}
                  checked={selectedStudents.length === mockStudents.length && mockStudents.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-16 text-on-surface-variant font-semibold" style={{ fontSize: '14px', borderBottom: '1px solid var(--outline-variant)', textAlign: 'left' }}>Mã HV</th>
              <th className="p-16 text-on-surface-variant font-semibold" style={{ fontSize: '14px', borderBottom: '1px solid var(--outline-variant)', textAlign: 'left' }}>Họ và tên</th>
              <th className="p-16 text-on-surface-variant font-semibold" style={{ fontSize: '14px', borderBottom: '1px solid var(--outline-variant)', textAlign: 'left' }}>Email</th>
              <th className="p-16 text-on-surface-variant font-semibold" style={{ fontSize: '14px', borderBottom: '1px solid var(--outline-variant)', textAlign: 'left' }}>Trình độ hiện tại</th>
            </tr>
          </thead>
          <tbody>
            {mockStudents.map((student, index) => (
              <tr 
                key={student.id} 
                className="cursor-pointer transition-all"
                style={{ 
                  borderBottom: index !== mockStudents.length - 1 ? '1px solid var(--outline-variant)' : 'none',
                  backgroundColor: selectedStudents.includes(student.id) ? '#F3F4F6' : 'white'
                }}
                onClick={() => toggleStudent(student.id)}
              >
                <td className="p-16">
                  <input 
                    type="checkbox" 
                    className="cursor-pointer"
                    style={{ width: '18px', height: '18px' }}
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => {}} // Handle change on row click
                    onClick={(e) => e.stopPropagation()} // Prevent double toggle
                  />
                </td>
                <td className="p-16 font-medium text-on-surface">{student.id}</td>
                <td className="p-16 text-on-surface">
                  <div className="flex items-center gap-12">
                    <div className="flex justify-center items-center font-bold text-on-surface-variant rounded-full" style={{ width: '32px', height: '32px', backgroundColor: '#E5E7EB', fontSize: '14px' }}>
                      {student.name.charAt(0)}
                    </div>
                    {student.name}
                  </div>
                </td>
                <td className="p-16 text-on-surface-variant">{student.email}</td>
                <td className="p-16">
                  <span className="font-medium" style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
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
