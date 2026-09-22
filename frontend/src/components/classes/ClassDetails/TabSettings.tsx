import { Save, AlertTriangle } from 'lucide-react';

const TabSettings = () => {
  return (
    <div style={{ maxWidth: '800px' }}>
      <h3 className="headline-sm mb-24">Cài đặt lớp học</h3>

      {/* Thông tin cơ bản */}
      <div className="card p-24 mb-24">
        <h4 className="font-semibold mb-16" style={{ fontSize: '16px' }}>Thông tin chung</h4>
        
        <div className="grid grid-2 gap-20 mb-20">
          <div>
            <label className="font-medium text-on-surface mb-8" style={{ display: 'block', fontSize: '14px' }}>Mã lớp học</label>
            <input type="text" className="input w-full text-on-surface-variant" defaultValue="ENG-IELTS-6.5A" disabled style={{ backgroundColor: '#F3F4F6' }} />
          </div>
          <div>
            <label className="font-medium text-on-surface mb-8" style={{ display: 'block', fontSize: '14px' }}>Tên lớp học</label>
            <input type="text" className="input w-full" defaultValue="IELTS Intensive Band 6.5 - 7.5" />
          </div>
          <div>
            <label className="font-medium text-on-surface mb-8" style={{ display: 'block', fontSize: '14px' }}>Giáo viên phụ trách</label>
            <select className="input w-full">
              <option value="t1">Cô Trần Thị Mai Lan</option>
              <option value="t2">Thầy Mark Reynolds</option>
            </select>
          </div>
          <div>
            <label className="font-medium text-on-surface mb-8" style={{ display: 'block', fontSize: '14px' }}>Trạng thái lớp</label>
            <select className="input w-full">
              <option value="active">Đang diễn ra</option>
              <option value="enroll">Đang tuyển sinh</option>
              <option value="closed">Đã kết thúc</option>
            </select>
          </div>
        </div>

        <div className="mb-20">
          <label className="font-medium text-on-surface mb-8" style={{ display: 'block', fontSize: '14px' }}>Mô tả lớp học</label>
          <textarea className="input w-full" rows={3} defaultValue="Khóa đào tạo chuyên sâu mục tiêu Cam 7.0+, kỳ học Mùa Thu 2024 • Quản lý bởi Khối Đào tạo Ngoại ngữ" style={{ resize: 'vertical' }}></textarea>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary flex items-center gap-8">
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-24" style={{ border: '1px solid #FECACA', backgroundColor: '#FEF2F2' }}>
        <h4 className="flex items-center gap-8 font-semibold mb-8" style={{ fontSize: '16px', color: '#991B1B' }}>
          <AlertTriangle size={18} /> Vùng nguy hiểm
        </h4>
        <p className="mb-16" style={{ color: '#7F1D1D', fontSize: '14px' }}>
          Các hành động dưới đây không thể hoàn tác. Xin vui lòng cân nhắc kỹ trước khi thực hiện.
        </p>

        <div className="flex-col gap-16">
          <div className="flex-between items-center pb-16" style={{ borderBottom: '1px solid #FECACA' }}>
            <div>
              <h5 className="font-semibold" style={{ color: '#991B1B' }}>Đóng lớp học</h5>
              <p style={{ fontSize: '13px', color: '#7F1D1D' }}>Chuyển lớp học sang trạng thái Đã kết thúc. Học viên không thể nộp bài tập nữa.</p>
            </div>
            <button className="btn" style={{ backgroundColor: 'white', color: '#991B1B', border: '1px solid #FECACA' }}>Đóng lớp</button>
          </div>

          <div className="flex-between items-center">
            <div>
              <h5 className="font-semibold" style={{ color: '#991B1B' }}>Xóa lớp học</h5>
              <p style={{ fontSize: '13px', color: '#7F1D1D' }}>Xóa vĩnh viễn lớp học cùng toàn bộ dữ liệu bài tập, điểm danh, tài liệu.</p>
            </div>
            <button className="btn border-none text-white" style={{ backgroundColor: '#DC2626' }}>Xóa lớp học</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TabSettings;
