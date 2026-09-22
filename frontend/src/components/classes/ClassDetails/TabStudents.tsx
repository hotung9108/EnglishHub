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
        return <span className="badge badge-status-active">Đang học</span>;
      case 'Đang tạm nghỉ':
        return <span className="badge badge-status-pending">⚠️ Đang tạm nghỉ</span>;
      case 'Đã nghỉ':
        return <span className="badge badge-status-error">Đã nghỉ</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div>
      {/* Filters & Actions */}
      <div className="flex items-center gap-16 mb-24">
        <div className="relative flex-1" style={{ maxWidth: '400px' }}>
          <span className="absolute text-on-surface-variant" style={{ left: '12px', top: '10px' }}>
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Tìm tên, mã HV, email, SĐT..." 
            className="input w-full"
            style={{ paddingLeft: '40px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}
          />
        </div>
        
        <select className="input" style={{ padding: '10px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <option>Học phí: Tất cả</option>
        </select>
        
        <select className="input" style={{ padding: '10px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <option>Chuyên cần: Tất cả</option>
        </select>
        
        <button className="input flex items-center justify-center cursor-pointer" style={{ width: '40px', height: '40px', padding: '0', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#4B5563' }}>
          ↻
        </button>
        
        <div className="flex-1"></div>

        <button className="btn btn-secondary flex items-center gap-8 shadow-none" style={{ backgroundColor: 'white', border: '1px solid #D1D5DB' }}>
          <Download size={16} />
          Nhập Excel
        </button>
        <button className="btn btn-primary flex items-center gap-8">
          <Plus size={16} />
          Thêm học viên
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
              <th className="p-16" style={{ width: '40px' }}><input type="checkbox" className="cursor-pointer" /></th>
              <th className="p-16 font-semibold text-on-surface-variant text-left" style={{ fontSize: '12px' }}>HỌC VIÊN / MÃ HV</th>
              <th className="p-16 font-semibold text-on-surface-variant text-left" style={{ fontSize: '12px' }}>EMAIL & ĐIỆN THOẠI</th>
              <th className="p-16 font-semibold text-on-surface-variant text-center" style={{ fontSize: '12px' }}>TARGET<br/>/ ĐẦU VÀO</th>
              <th className="p-16 font-semibold text-on-surface-variant text-left" style={{ fontSize: '12px' }}>CHUYÊN CẦN</th>
              <th className="p-16 font-semibold text-on-surface-variant text-center" style={{ fontSize: '12px' }}>BÀI TẬP<br/>& ĐIỂM TB</th>
              <th className="p-16 font-semibold text-on-surface-variant text-center" style={{ fontSize: '12px' }}>TRẠNG THÁI</th>
              <th className="p-16 font-semibold text-on-surface-variant text-center" style={{ fontSize: '12px' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={student.id} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: idx % 2 === 0 ? 'white' : '#F9FAFB' }}>
                <td className="p-16"><input type="checkbox" className="cursor-pointer" /></td>
                <td className="p-16">
                  <div className="flex items-center gap-12">
                    <div className="flex justify-center items-center font-bold rounded-full" style={{ width: '36px', height: '36px', backgroundColor: `${student.color}20`, color: student.color }}>
                      {student.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-on-surface">{student.name}</div>
                      <div className="text-on-surface-variant" style={{ fontSize: '12px' }}>{student.id}</div>
                    </div>
                  </div>
                </td>
                <td className="p-16">
                  <div className="text-on-surface mb-4" style={{ fontSize: '14px' }}>{student.email}</div>
                  <div className="text-on-surface-variant font-medium" style={{ fontSize: '13px' }}>{student.phone}</div>
                </td>
                <td className="p-16 text-center">
                  <div className="flex-col items-center justify-center gap-4">
                     <span className="font-semibold" style={{ color: '#2563EB', fontSize: '14px' }}>{student.target.toFixed(1)}</span>
                     <div style={{ width: '20px', height: '1px', backgroundColor: '#D1D5DB' }}></div>
                     <span className="text-on-surface-variant" style={{ fontSize: '12px' }}>{student.current.toFixed(1)}</span>
                  </div>
                </td>
                <td className="p-16">
                  <div className="flex-between mb-4" style={{ fontSize: '12px' }}>
                    <span className="font-semibold" style={{ color: '#059669' }}>{Math.round((student.attendance / student.totalSessions)*100)}%</span>
                    <span className="text-on-surface-variant">{student.attendance}/{student.totalSessions} b</span>
                  </div>
                  <div className="rounded" style={{ height: '4px', backgroundColor: '#E5E7EB' }}>
                    <div className="h-full rounded" style={{ width: `${(student.attendance / student.totalSessions)*100}%`, backgroundColor: student.attendance/student.totalSessions > 0.8 ? '#059669' : '#D97706' }}></div>
                  </div>
                </td>
                <td className="p-16 text-center">
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex-col items-center">
                      <span className="text-on-surface" style={{ fontSize: '13px' }}>{student.homework}/15</span>
                      <span className="text-on-surface-variant" style={{ fontSize: '11px' }}>bài</span>
                    </div>
                    <span className="font-semibold rounded" style={{ backgroundColor: '#EEF2FF', color: '#3730A3', padding: '4px 8px' }}>
                      {student.avgScore.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="p-16 text-center">
                  {getStatusBadge(student.status)}
                </td>
                <td className="p-16 text-center">
                  <div className="flex justify-center gap-8">
                    <button className="cursor-pointer border-none bg-none text-on-surface-variant hover:text-primary"><Eye size={18} /></button>
                    <button className="cursor-pointer border-none bg-none text-on-surface-variant hover:text-primary"><FileEdit size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-between mt-16 p-0-16">
         <div className="text-on-surface-variant" style={{ fontSize: '14px' }}>
            Hiển thị <strong>1 - 5</strong> trong số <strong>24</strong> học viên
         </div>
         <div className="flex gap-4">
            <button className="btn btn-secondary shadow-none border-none py-6 px-12" style={{ backgroundColor: 'transparent', color: '#9CA3AF' }}>&lt;</button>
            <button className="btn btn-primary py-6 px-12 rounded">1</button>
            <button className="btn btn-secondary shadow-none border-none py-6 px-12" style={{ backgroundColor: 'transparent' }}>2</button>
            <button className="btn btn-secondary shadow-none border-none py-6 px-12" style={{ backgroundColor: 'transparent' }}>3</button>
            <button className="btn btn-secondary shadow-none border-none py-6 px-12" style={{ backgroundColor: 'transparent' }}>&gt;</button>
         </div>
      </div>
    </div>
  );
};

export default TabStudents;
