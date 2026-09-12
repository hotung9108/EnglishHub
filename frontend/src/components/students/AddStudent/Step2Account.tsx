import React from 'react';

const Step2Account = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '24px', backgroundColor: '#EFF6FF', borderColor: '#DBEAFE', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <div>
           <h4 className="headline-md" style={{ color: '#1E3A8A', fontSize: '18px', marginBottom: '4px' }}>Thiết lập danh tính & Phân quyền bảo mật</h4>
           <p className="label-md" style={{ color: '#3B82F6', fontWeight: '400' }}>Tài khoản sẽ được sử dụng để đăng nhập vào Student Portal để xem lịch học, bài tập và điểm số.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 className="headline-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
               Thông tin tài khoản hệ thống
            </h3>
            <span style={{ color: '#DC2626', fontSize: '13px', fontWeight: '500' }}>* Trường thông tin bắt buộc</span>
         </div>

         <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <label className="label-md">Email đăng nhập hệ thống <span style={{color: '#DC2626'}}>*</span></label>
               <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#059669', padding: '2px 8px', fontSize: '11px' }}>● Email khả dụng</span>
            </div>
            <div style={{ display: 'flex', gap: '0' }}>
               <span style={{ padding: '0 16px', backgroundColor: '#F3F4F6', border: '1px solid var(--outline)', borderRight: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', display: 'flex', alignItems: 'center', color: '#6B7280', fontWeight: '500' }}>ID:</span>
               <input type="text" className="input" defaultValue="hv8804" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', backgroundColor: '#F8FAFC' }} />
               <span style={{ padding: '0 16px', backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', display: 'flex', alignItems: 'center', color: '#1D4ED8', fontWeight: '600' }}>@student.edu.vn</span>
            </div>
            <p className="label-md text-on-surface-variant" style={{ fontSize: '12px', marginTop: '8px' }}>Gợi ý tự động từ mã học viên. Tên đăng nhập được gán cố định với cổng đào tạo.</p>
         </div>

         <div style={{ marginBottom: '32px' }}>
            <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Email cá nhân nhận thông báo (Tùy chọn)</label>
            <div style={{ position: 'relative' }}>
               <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
               <input type="email" className="input" placeholder="Email cá nhân" style={{ paddingLeft: '36px', backgroundColor: '#F8FAFC' }} />
            </div>
         </div>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 className="headline-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
               Thiết lập mật khẩu khởi tạo
            </h3>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Mật khẩu khởi tạo <span style={{color: '#DC2626'}}>*</span></label>
               <div style={{ position: 'relative' }}>
                  <input type="password" className="input" defaultValue="SmartLMS@2026" style={{ backgroundColor: '#EEF2FF', paddingRight: '36px' }} />
                  <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
               </div>
            </div>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Xác thực mật khẩu mới <span style={{color: '#DC2626'}}>*</span></label>
               <div style={{ position: 'relative' }}>
                  <input type="password" className="input" defaultValue="SmartLMS@2026" style={{ backgroundColor: '#F3F4F6', paddingRight: '36px' }} />
                  <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#059669' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span className="label-md" style={{ fontSize: '12px', fontWeight: '600' }}>Mật khẩu trùng khớp hoàn toàn</span>
               </div>
            </div>
         </div>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 className="headline-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
               Phân quyền & Tùy chọn kích hoạt
            </h3>
         </div>

         <div style={{ backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-default)', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', color: '#2563EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div>
               <p className="label-md text-on-surface-variant" style={{ fontSize: '12px', marginBottom: '4px' }}>Vai trò tài khoản mặc định</p>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="headline-md" style={{ fontSize: '16px' }}>Học viên</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: '#475569' }}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                     Cố định
                  </span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Step2Account;
