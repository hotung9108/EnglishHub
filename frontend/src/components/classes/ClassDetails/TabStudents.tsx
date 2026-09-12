import React from 'react';
import { Search, Download, Plus, Eye, FileEdit } from 'lucide-react';

const TabStudents = () => {
  const students = [
    { id: 'HV-8801', name: 'Alice Johnson', email: 'alice.j@gmail.com', phone: '0912 345 678', target: 7.5, current: 6.0, attendance: 17, totalSessions: 18, homework: 15, avgScore: 8.6, status: 'Đang học', color: '#3B82F6' },
    { id: 'HV-8802', name: 'David Pham', email: 'david.pham@outlook.com', phone: '0988 123 999', target: 7.0, current: 5.5, attendance: 16, totalSessions: 18, homework: 14, avgScore: 8.0, status: 'Đang học', color: '#10B981' },
    { id: 'HV-8803', name: 'Lê Bảo Trâm', email: 'tram.le@techuni.edu.vn', phone: '0903 552 114', target: 7.0, current: 5.0, attendance: 13, totalSessions: 18, homework: 10, avgScore: 6.9, status: 'Đang tạm nghỉ', color: '#F59E0B' },
    { id: 'HV-8805', name: 'Trần Hoàng Long', email: 'hoanglong.tran@gmail.com', phone: '0974 881 202', target: 7.5, current: 6.5, attendance: 18, totalSessions: 18, homework: 15, avgScore: 9.1, status: 'Đang học', color: '#6366F1' },
    { id: 'HV-8809', name: 'Nguyễn Thảo Hương', email: 'thaohuong.nguyen@vnu.edu.vn', phone: '0936 112 454', target: 7.0, current: 6.0, attendance: 17, totalSessions: 18, homework: 14, avgScore: 8.4, status: 'Đã nghỉ', color: '#8B5CF6' }
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Đang học':
        return <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>{status}</span>;
      case 'Đang tạm nghỉ':
        return <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ {status}</span>;
      case 'Đã nghỉ':
        return <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>{status}</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div>
      {/* Filters & Actions */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#6B7280' }}>
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Tìm tên, mã HV, email, SĐT..." 
            className="input"
            style={{ width: '100%', padding: '10px 16px 10px 40px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}
          />
        </div>
        
        <select className="input" style={{ padding: '10px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <option>Học phí: Tất cả</option>
        </select>
        
        <select className="input" style={{ padding: '10px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <option>Chuyên cần: Tất cả</option>
        </select>
        
        <button style={{ padding: '10px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#4B5563', cursor: 'pointer' }}>
          ↻
        </button>
        
        <div style={{ flex: 1 }}></div>

        <button className="btn" style={{ backgroundColor: 'white', border: '1px solid #D1D5DB', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} />
          Nhập Excel
        </button>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} />
          Thêm học viên
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '16px', width: '40px' }}><input type="checkbox" /></th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>HỌC VIÊN / MÃ HV</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>EMAIL & ĐIỆN THOẠI</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#6B7280', fontWeight: '600', textAlign: 'center' }}>TARGET<br/>/ ĐẦU VÀO</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>CHUYÊN CẦN</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#6B7280', fontWeight: '600', textAlign: 'center' }}>BÀI TẬP<br/>& ĐIỂM TB</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#6B7280', fontWeight: '600', textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#6B7280', fontWeight: '600', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={student.id} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: idx % 2 === 0 ? 'white' : '#F9FAFB' }}>
                <td style={{ padding: '16px' }}><input type="checkbox" /></td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: `${student.color}20`, color: student.color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                      {student.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{student.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{student.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '2px' }}>{student.email}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>{student.phone}</div>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                     <span style={{ color: '#2563EB', fontWeight: '600', fontSize: '14px' }}>{student.target.toFixed(1)}</span>
                     <div style={{ width: '20px', height: '1px', backgroundColor: '#D1D5DB' }}></div>
                     <span style={{ color: '#6B7280', fontSize: '12px' }}>{student.current.toFixed(1)}</span>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#059669', fontWeight: '600' }}>{Math.round((student.attendance / student.totalSessions)*100)}%</span>
                    <span style={{ color: '#6B7280' }}>{student.attendance}/{student.totalSessions} b</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${(student.attendance / student.totalSessions)*100}%`, backgroundColor: student.attendance/student.totalSessions > 0.8 ? '#059669' : '#D97706', borderRadius: '2px' }}></div>
                  </div>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{student.homework}/15</span>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>bài</span>
                    </div>
                    <span style={{ backgroundColor: '#EEF2FF', color: '#3730A3', fontWeight: '600', padding: '4px 8px', borderRadius: '6px' }}>
                      {student.avgScore.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  {getStatusBadge(student.status)}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><Eye size={18} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><FileEdit size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 16px' }}>
         <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Hiển thị <strong>1 - 5</strong> trong số <strong>24</strong> học viên
         </div>
         <div style={{ display: 'flex', gap: '4px' }}>
            <button style={{ padding: '6px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}>&lt;</button>
            <button style={{ padding: '6px 12px', border: 'none', backgroundColor: '#2563EB', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>1</button>
            <button style={{ padding: '6px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>2</button>
            <button style={{ padding: '6px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>3</button>
            <button style={{ padding: '6px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>&gt;</button>
         </div>
      </div>
    </div>
  );
};

export default TabStudents;
