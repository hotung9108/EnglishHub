import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TeacherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Giả lập dữ liệu giáo viên dựa theo ID
  const teacher = {
    id: id || '1',
    name: 'Trần Thị Mai Lan',
    code: 'GV-2026-088',
    email: 'teacher.lan@center.edu.vn',
    phone: '0987 654 321',
    role: 'teacher',
    status: 'Active',
    certs: 'IELTS 8.5 / TESOL Certified',
    classesCount: 4,
    pendingGrades: 24,
  };

  const activeClasses = [
    {
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5',
      students: 24,
      schedule: 'T2-T4-T6 (18:00 - 20:00)',
      status: 'Đang mở'
    },
    {
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC Cấp tốc 750+',
      students: 18,
      schedule: 'T3-T5-T7 (19:30 - 21:00)',
      status: 'Đang mở'
    }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/admin/teachers')}
          style={{ padding: '8px 12px' }}
        >
          &larr; Quay lại
        </button>
        <h1 className="page-title">Chi Tiết Hồ Sơ: {teacher.name}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Info Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>Thông tin cá nhân & Vai trò</h3>
              <p className="label-md text-on-surface-variant">Cập nhật thông tin, thay đổi trạng thái và vai trò của người dùng</p>
            </div>
            <div>
              <span className={`badge ${teacher.status === 'Active' ? 'badge-active' : 'badge-onleave'}`} style={{ border: '1px solid var(--outline-variant)', padding: '6px 12px', fontSize: '14px' }}>
                Trạng thái: {teacher.status}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '32px', gap: '32px' }}>
            {/* Left Col - Avatar & Danger Actions */}
            <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '32px 24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--surface-container-high)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: '600',
                  color: 'var(--primary)',
                  marginBottom: '24px',
                  border: '4px solid var(--surface-container-lowest)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {teacher.name.split(' ').map(n => n[0]).slice(-2).join('')}
                </div>
                <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px', textAlign: 'center' }}>{teacher.name}</h3>
                <span className="badge" style={{ backgroundColor: '#0F172A', color: 'white', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  GIÁO VIÊN
                </span>
                <p className="body-sm text-on-surface-variant" style={{ textAlign: 'center' }}>{teacher.certs}</p>
              </div>


            </div>

            {/* Right Col - Form */}
            <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>Họ và tên <span className="text-error">*</span></label>
                  <input type="text" className="input" defaultValue={teacher.name} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>Mã định danh</label>
                  <input type="text" className="input" defaultValue={teacher.code} readOnly style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>Email liên hệ</label>
                  <input type="email" className="input" defaultValue={teacher.email} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>Số điện thoại</label>
                  <input type="text" className="input" defaultValue={teacher.phone} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>Vai trò người dùng <span className="text-error">*</span></label>
                  <select className="input" defaultValue={teacher.role}>
                    <option value="student">Học viên</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>Trạng thái tài khoản <span className="text-error">*</span></label>
                  <select className="input" defaultValue="active">
                    <option value="active">Đang hoạt động (Active)</option>
                    <option value="onleave">Nghỉ phép (On Leave)</option>
                    <option value="disabled">Vô hiệu hóa (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: 'auto', paddingTop: '24px' }}>
                <button className="btn btn-secondary">Hủy</button>
                <button className="btn btn-primary" style={{ backgroundColor: '#0F172A' }}>Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Taught Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>Lớp học đang phụ trách</h3>
              <p className="label-md text-on-surface-variant">Danh sách các lớp học giáo viên đang giảng dạy</p>
            </div>
            <button className="btn btn-secondary">Phân công thêm lớp</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {activeClasses.map((cls) => (
                <div key={cls.code} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="badge badge-primary">{cls.code}</span>
                    <span className="badge" style={{ backgroundColor: '#C3E9C8', color: '#006C49', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#006C49' }}></span>
                      {cls.status}
                    </span>
                  </div>
                  <h4 className="headline-md text-on-surface" style={{ marginBottom: '12px', fontSize: '16px' }}>{cls.name}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '20px' }}>👥</span> Sĩ số: {cls.students}
                    </p>
                    <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '20px' }}>🕒</span> {cls.schedule}
                    </p>
                  </div>
                  <button className="btn" style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid var(--outline-variant)', marginTop: 'auto' }}>
                    Xem lớp học
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>Đổi mật khẩu người dùng</h3>
              <p className="label-md text-on-surface-variant">Admin có quyền đặt lại mật khẩu cho giáo viên</p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              {showPasswordChange ? 'Đóng' : 'Đổi mật khẩu'}
            </button>
          </div>
          
          {showPasswordChange && (
            <div style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px', backgroundColor: 'var(--surface-container-lowest)' }}>
              
              <div style={{ flex: '2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>Mật khẩu mới <span className="text-error">*</span></label>
                  <input type="password" className="input" placeholder="Nhập mật khẩu mới cho người dùng" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>Xác nhận mật khẩu mới <span className="text-error">*</span></label>
                  <input type="password" className="input" placeholder="Nhập lại mật khẩu mới" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '16px' }}>
                  <button className="btn btn-primary" style={{ backgroundColor: '#0F172A' }}>Cập nhật mật khẩu</button>
                </div>
              </div>

              <div style={{ flex: '1', minWidth: '250px' }}>
                <div style={{ backgroundColor: 'var(--primary-container)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--primary-fixed-dim)' }}>
                  <h4 className="headline-md" style={{ marginBottom: '16px', color: '#FFFFFF' }}>Yêu cầu mật khẩu</h4>
                  <ul className="body-md" style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: '#FFFFFF' }}>
                    <li>Ít nhất <strong>8 ký tự</strong>.</li>
                    <li>Chứa ít nhất <strong>1 chữ cái viết hoa</strong> (A-Z).</li>
                    <li>Chứa ít nhất <strong>1 chữ số</strong> (0-9).</li>
                    <li>Chứa ít nhất <strong>1 ký tự đặc biệt</strong> (!@#$%^&*).</li>
                  </ul>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Danger Zone Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #DC2626', backgroundColor: '#FFFFFF' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>Vô hiệu hóa hoặc xóa người dùng</h3>
              <p className="label-md text-on-surface-variant">Không thể hoàn tác sau khi vô hiệu hóa hoặc xóa người dùng</p>
            </div>
            <button 
              className="btn btn-danger" 
              onClick={() => setShowDangerZone(!showDangerZone)}
            >
              {showDangerZone ? 'Đóng' : 'Quản lý tài khoản'}
            </button>
          </div>
          
          {showDangerZone && (
            <div style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
              <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h4 className="headline-md text-on-surface" style={{ marginBottom: '8px' }}>Vô hiệu hóa tài khoản</h4>
                <p className="body-md text-on-surface-variant" style={{ marginBottom: '16px' }}>Tài khoản sẽ bị khóa tạm thời. Người dùng không thể đăng nhập nhưng dữ liệu vẫn được giữ lại trên hệ thống.</p>
                <button className="btn btn-danger">
                  Vô hiệu hóa tài khoản
                </button>
              </div>
              <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderLeft: '1px solid var(--outline-variant)', paddingLeft: '32px' }}>
                <h4 className="headline-md text-on-surface" style={{ marginBottom: '8px' }}>Xóa người dùng</h4>
                <p className="body-md text-on-surface-variant" style={{ marginBottom: '16px' }}>Toàn bộ dữ liệu của người dùng này sẽ bị xóa vĩnh viễn khỏi hệ thống. Thao tác này không thể hoàn tác.</p>
                <button className="btn btn-danger">
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDetails;
