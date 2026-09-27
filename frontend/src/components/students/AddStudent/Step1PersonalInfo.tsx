const Step1PersonalInfo = () => {
  return (
    <div className="grid grid-300-1fr gap-24">
      {/* Left Column - Avatar */}
      <div className="flex-col gap-16">
        <div className="card p-24 flex-col items-center">
          <div className="flex-between w-full mb-16">
            <h4 className="headline-md text-on-surface" style={{ fontSize: '18px' }}>Ảnh chân dung</h4>
            <span className="badge badge-status-active font-medium">Bắt buộc</span>
          </div>
          
          <div className="relative flex justify-center items-center mb-16" style={{ width: '160px', height: '160px', backgroundColor: '#E0E7FF', borderRadius: '16px' }}>
             <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#1D4ED8' }}>HV</span>
             <button className="absolute cursor-pointer border-none flex justify-center items-center" style={{ bottom: '12px', right: '12px', backgroundColor: '#2563EB', color: 'white', borderRadius: '50%', width: '32px', height: '32px' }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
             </button>
          </div>
          
          <p className="label-md text-on-surface-variant text-center mb-24">
            Định dạng hỗ trợ: JPG, PNG, WEBP. Dung lượng tối đa: 5MB. Khuyến nghị tỷ lệ 1:1.
          </p>
          
          <div className="flex gap-12 w-full">
             <button className="btn btn-primary flex-1 shadow-none" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Tải ảnh chân dung
             </button>
             <button className="btn text-error" style={{ padding: '0 12px', backgroundColor: '#FEF2F2' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
             </button>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="card p-32">
         <div className="card-section-header flex-between p-0 mb-24" style={{ paddingBottom: '16px' }}>
            <h3 className="headline-md step-section-title">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
               Thông tin định danh & Liên hệ
            </h3>
            <span className="text-error font-medium" style={{ fontSize: '13px' }}>(*) Thông tin bắt buộc</span>
         </div>

         <div className="grid grid-2 gap-24 mb-24">
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Họ và tên học viên <span className="text-error">*</span></label>
               <input type="text" className="input" placeholder="Nhập họ và tên học viên" />
            </div>
            <div>
               <div className="flex-between mb-8">
                  <label className="label-md">Mã định danh <span className="text-error">*</span></label>
               </div>
               <div className="flex relative">
                  <input type="text" className="input text-primary font-medium" defaultValue="HV-8804" style={{ backgroundColor: '#EEF2FF' }} />
                  <button className="absolute cursor-pointer border-none text-on-surface-variant" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  </button>
               </div>
            </div>
         </div>

         <div className="grid grid-3 gap-24 mb-24">
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Số điện thoại <span className="text-error">*</span></label>
               <div className="relative">
                  <svg className="absolute text-on-surface-variant" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <input type="text" className="input" placeholder="Nhập số điện thoại" style={{ paddingLeft: '36px' }} />
               </div>
            </div>
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Ngày sinh</label>
               <input type="date" className="input" />
            </div>
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Giới tính</label>
               <select className="input">
                  <option>Nam</option>
                  <option>Nữ</option>
                  <option>Khác</option>
               </select>
            </div>
         </div>

         <div className="mb-24">
            <label className="label-md mb-8" style={{ display: 'block' }}>Địa chỉ liên hệ</label>
            <div className="relative">
               <svg className="absolute text-on-surface-variant" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
               <input type="text" className="input" placeholder="Nhập địa chỉ" style={{ paddingLeft: '36px' }} />
            </div>
         </div>

         <div className="mb-24">
            <label className="label-md mb-8" style={{ display: 'block' }}>Thông tin phụ huynh / Người giám hộ (Tuỳ chọn)</label>
            <div className="grid grid-2 gap-24">
               <input type="text" className="input" placeholder="Họ và tên phụ huynh" />
               <input type="text" className="input" placeholder="Số điện thoại phụ huynh" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default Step1PersonalInfo;
