import React from 'react';
import { Save, AlertTriangle } from 'lucide-react';

const TabSettings = () => {
  return (
    <div style={{ maxWidth: '800px' }}>
      <h3 className="headline-sm" style={{ marginBottom: '24px' }}>Cài đặt lớp học</h3>

      {/* Thông tin cơ bản */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Thông tin chung</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Mã lớp học</label>
            <input type="text" className="input" defaultValue="ENG-IELTS-6.5A" disabled style={{ width: '100%', backgroundColor: '#F3F4F6', color: '#6B7280' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Tên lớp học</label>
            <input type="text" className="input" defaultValue="IELTS Intensive Band 6.5 - 7.5" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Giáo viên phụ trách</label>
            <select className="input" style={{ width: '100%' }}>
              <option value="t1">Cô Trần Thị Mai Lan</option>
              <option value="t2">Thầy Mark Reynolds</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Trạng thái lớp</label>
            <select className="input" style={{ width: '100%' }}>
              <option value="active">Đang diễn ra</option>
              <option value="enroll">Đang tuyển sinh</option>
              <option value="closed">Đã kết thúc</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Mô tả lớp học</label>
          <textarea className="input" rows={3} defaultValue="Khóa đào tạo chuyên sâu mục tiêu Cam 7.0+, kỳ học Mùa Thu 2024 • Quản lý bởi Khối Đào tạo Ngoại ngữ" style={{ width: '100%', resize: 'vertical' }}></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ padding: '24px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#991B1B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> Vùng nguy hiểm
        </h4>
        <p style={{ color: '#7F1D1D', fontSize: '14px', marginBottom: '16px' }}>
          Các hành động dưới đây không thể hoàn tác. Xin vui lòng cân nhắc kỹ trước khi thực hiện.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #FECACA' }}>
            <div>
              <h5 style={{ fontWeight: '600', color: '#991B1B' }}>Đóng lớp học</h5>
              <p style={{ fontSize: '13px', color: '#7F1D1D' }}>Chuyển lớp học sang trạng thái Đã kết thúc. Học viên không thể nộp bài tập nữa.</p>
            </div>
            <button className="btn" style={{ backgroundColor: 'white', color: '#991B1B', border: '1px solid #FECACA' }}>Đóng lớp</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h5 style={{ fontWeight: '600', color: '#991B1B' }}>Xóa lớp học</h5>
              <p style={{ fontSize: '13px', color: '#7F1D1D' }}>Xóa vĩnh viễn lớp học cùng toàn bộ dữ liệu bài tập, điểm danh, tài liệu.</p>
            </div>
            <button className="btn" style={{ backgroundColor: '#DC2626', color: 'white', border: 'none' }}>Xóa lớp học</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TabSettings;
