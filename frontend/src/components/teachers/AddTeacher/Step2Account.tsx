const Step2Account = () => {
  return (
    <div className="flex-col gap-24">
      <div className="step-header">
        <div className="step-header-icon">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <div>
           <h4 className="headline-md step-header-title">Thiết lập danh tính & Phân quyền bảo mật</h4>
           <p className="label-md step-header-desc">Tài khoản sẽ được sử dụng để đăng nhập vào SmartLMS Teacher Portal và đồng bộ dữ liệu giảng dạy, sổ điểm cùng kho học liệu số của trường.</p>
        </div>
      </div>

      <div className="card p-32">
         <div className="card-section-header flex-between p-0 mb-24" style={{ paddingBottom: '16px' }}>
            <h3 className="headline-md step-section-title">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
               Thông tin tài khoản hệ thống
            </h3>
            <span className="text-error font-medium" style={{ fontSize: '13px' }}>* Trường thông tin bắt buộc</span>
         </div>

         <div className="mb-24">
            <div className="flex-between mb-8">
               <label className="label-md">Email đăng nhập hệ thống <span className="text-error">*</span></label>
               <span className="badge badge-status-active font-semibold" style={{ padding: '2px 8px', fontSize: '11px' }}>● Email khả dụng</span>
            </div>
            <div className="flex" style={{ gap: '0' }}>
               <span className="flex items-center text-on-surface-variant font-medium" style={{ padding: '0 16px', backgroundColor: '#F3F4F6', border: '1px solid var(--outline)', borderRight: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}>ID:</span>
               <input type="text" className="input" defaultValue="gv.oanhnguyen" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', backgroundColor: '#F8FAFC' }} />
               <span className="flex items-center font-semibold" style={{ padding: '0 16px', backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', color: '#1D4ED8' }}>@center.edu.vn</span>
            </div>
            <p className="label-md text-on-surface-variant mt-8" style={{ fontSize: '12px' }}>Gợi ý tự động từ tên giáo viên: Nguyễn Thị Kim Oanh. Tên đăng nhập được gán cố định với cổng đào tạo.</p>
         </div>

         <div className="mb-32">
            <label className="label-md mb-8" style={{ display: 'block' }}>Email cá nhân nhận thông báo khôi phục (Tùy chọn)</label>
            <div className="relative">
               <svg className="absolute text-on-surface-variant" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
               <input type="email" className="input" defaultValue="oanh.nguyen@gmail.com" style={{ paddingLeft: '36px', backgroundColor: '#F8FAFC' }} />
            </div>
            <p className="label-md text-on-surface-variant mt-8" style={{ fontSize: '12px', fontWeight: '600' }}>Dùng để kích hoạt tài khoản và lấy lại mật khẩu khi không vào được hộp thư trường.</p>
         </div>

         <div className="card-section-header flex-between p-0 mb-24" style={{ paddingBottom: '16px' }}>
            <h3 className="headline-md step-section-title">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
               Thiết lập mật khẩu khởi tạo
            </h3>
         </div>

         <div className="grid grid-2 gap-24 mb-16">
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Mật khẩu khởi tạo <span className="text-error">*</span></label>
               <div className="relative">
                  <input type="password" className="input" defaultValue="..............." style={{ backgroundColor: '#EEF2FF', paddingRight: '36px' }} />
                  <button className="absolute cursor-pointer border-none text-on-surface-variant" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
               </div>
               <div className="flex items-center gap-8 mt-8">
                  <div className="flex gap-4 flex-1">
                     <div className="flex-1 rounded" style={{ height: '4px', backgroundColor: '#059669' }}></div>
                     <div className="flex-1 rounded" style={{ height: '4px', backgroundColor: '#059669' }}></div>
                     <div className="flex-1 rounded" style={{ height: '4px', backgroundColor: '#059669' }}></div>
                     <div className="flex-1 rounded" style={{ height: '4px', backgroundColor: '#DBEAFE' }}></div>
                  </div>
                  <span className="label-md font-semibold text-primary" style={{ fontSize: '12px' }}>Mạnh</span>
               </div>
            </div>
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Xác thực mật khẩu mới <span className="text-error">*</span></label>
               <div className="relative">
                  <input type="password" className="input" defaultValue="..............." style={{ backgroundColor: '#F3F4F6', paddingRight: '36px' }} />
                  <button className="absolute cursor-pointer border-none text-on-surface-variant" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
               </div>
               <div className="flex items-center gap-4 mt-8" style={{ color: '#059669' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span className="label-md font-semibold" style={{ fontSize: '12px' }}>Mật khẩu trùng khớp hoàn toàn</span>
               </div>
            </div>
         </div>

         <div className="mb-32 p-16 border rounded" style={{ backgroundColor: '#F8FAFC' }}>
            <p className="label-md text-on-surface-variant uppercase font-semibold mb-12" style={{ fontSize: '12px' }}>Quy chuẩn mật khẩu hệ thống SmartLMS:</p>
            <div className="grid grid-2 gap-12">
               <div className="flex items-center gap-8" style={{ color: '#059669' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
                  <span className="label-md text-on-surface" style={{ fontSize: '13px' }}>Tối thiểu 8 ký tự</span>
               </div>
               <div className="flex items-center gap-8" style={{ color: '#059669' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
                  <span className="label-md text-on-surface" style={{ fontSize: '13px' }}>Có chữ hoa và chữ thường</span>
               </div>
               <div className="flex items-center gap-8" style={{ color: '#059669' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
                  <span className="label-md text-on-surface" style={{ fontSize: '13px' }}>Có ít nhất 1 chữ số (0-9)</span>
               </div>
               <div className="flex items-center gap-8" style={{ color: '#059669' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
                  <span className="label-md text-on-surface" style={{ fontSize: '13px' }}>Có ký tự đặc biệt (!@#$%^&*)</span>
               </div>
            </div>
         </div>

         <div className="card-section-header flex-between p-0 mb-24" style={{ paddingBottom: '16px' }}>
            <h3 className="headline-md step-section-title">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
               Phân quyền & Tùy chọn kích hoạt
            </h3>
         </div>

         <div className="flex items-center gap-16 mb-24 p-16" style={{ backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-default)' }}>
            <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', color: '#2563EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            </div>
            <div>
               <p className="label-md text-on-surface-variant mb-4" style={{ fontSize: '12px' }}>Vai trò tài khoản mặc định</p>
               <div className="flex items-center gap-8">
                  <span className="headline-md" style={{ fontSize: '16px' }}>Giáo viên</span>
                  <span className="inline-flex items-center gap-4 font-medium" style={{ backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: '#475569' }}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                     Cố định
                  </span>
               </div>
            </div>
         </div>

         <div className="flex-col gap-24">
            <div className="flex items-start gap-12">
               <div className="flex items-center justify-center mt-2" style={{ backgroundColor: '#2563EB', width: '20px', height: '20px', borderRadius: '4px', color: 'white' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
               </div>
               <div>
                  <p className="label-md font-semibold mb-4">Tự động gửi thông tin tài khoản và mật khẩu tạm thời qua email</p>
                  <p className="label-md text-on-surface-variant font-medium">Một thư điện tử chứa liên kết đăng nhập kèm thông tin định danh sẽ được gửi đến hộp thư cá nhân và nội bộ.</p>
               </div>
            </div>

            <div className="flex items-start gap-12">
               <div className="flex items-center justify-center mt-2" style={{ backgroundColor: '#2563EB', width: '20px', height: '20px', borderRadius: '4px', color: 'white' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
               </div>
               <div>
                  <p className="label-md font-semibold mb-4">Yêu cầu giáo viên đổi mật khẩu ở lần đăng nhập đầu tiên</p>
                  <p className="label-md text-on-surface-variant font-medium">Đảm bảo tính bảo mật cá nhân.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Step2Account;
