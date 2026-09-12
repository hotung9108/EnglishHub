import React from 'react';

const Step1PersonalInfo = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
      {/* Left Column - Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
            <h4 className="headline-md text-on-surface" style={{ fontSize: '18px' }}>Ảnh chân dung</h4>
            <span className="badge" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontWeight: '500' }}>Bắt buộc</span>
          </div>
          
          <div style={{ width: '160px', height: '160px', backgroundColor: '#E0E7FF', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '16px' }}>
             <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#1D4ED8' }}>HV</span>
             <button style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: '#2563EB', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: 'pointer' }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
             </button>
          </div>
          
          <p className="label-md text-on-surface-variant" style={{ textAlign: 'center', marginBottom: '24px' }}>
            Định dạng hỗ trợ: JPG, PNG, WEBP. Dung lượng tối đa: 5MB. Khuyến nghị tỷ lệ 1:1.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
             <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#EFF6FF', color: '#1D4ED8', boxShadow: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Tải ảnh chân dung
             </button>
             <button className="btn" style={{ padding: '0 12px', color: '#DC2626', backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-default)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
             </button>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="card" style={{ padding: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 className="headline-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
               Thông tin định danh & Liên hệ
            </h3>
            <span style={{ color: '#DC2626', fontSize: '13px', fontWeight: '500' }}>(*) Thông tin bắt buộc</span>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Họ và tên học viên <span style={{color: '#DC2626'}}>*</span></label>
               <input type="text" className="input" placeholder="Nhập họ và tên học viên" />
            </div>
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="label-md">Mã định danh <span style={{color: '#DC2626'}}>*</span></label>
               </div>
               <div style={{ display: 'flex', position: 'relative' }}>
                  <input type="text" className="input" defaultValue="HV-8804" style={{ backgroundColor: '#EEF2FF', fontWeight: '500', color: '#1D4ED8' }} />
                  <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  </button>
               </div>
            </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Số điện thoại <span style={{color: '#DC2626'}}>*</span></label>
               <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <input type="text" className="input" placeholder="Nhập số điện thoại" style={{ paddingLeft: '36px' }} />
               </div>
            </div>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Ngày sinh</label>
               <input type="date" className="input" />
            </div>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Giới tính</label>
               <select className="input">
                  <option>Nam</option>
                  <option>Nữ</option>
                  <option>Khác</option>
               </select>
            </div>
         </div>

         <div style={{ marginBottom: '24px' }}>
            <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Địa chỉ liên hệ</label>
            <div style={{ position: 'relative' }}>
               <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
               <input type="text" className="input" placeholder="Nhập địa chỉ" style={{ paddingLeft: '36px' }} />
            </div>
         </div>

         <div style={{ marginBottom: '24px' }}>
            <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Thông tin phụ huynh / Người giám hộ (Tuỳ chọn)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
               <input type="text" className="input" placeholder="Họ và tên phụ huynh" />
               <input type="text" className="input" placeholder="Số điện thoại phụ huynh" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default Step1PersonalInfo;
