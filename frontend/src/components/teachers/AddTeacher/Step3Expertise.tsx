const Step3Expertise = () => {
  return (
    <div className="flex-col gap-24">
      <div className="step-header">
        <div className="step-header-icon">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
        </div>
        <div>
           <h4 className="headline-md step-header-title">Chuyên môn & Chứng chỉ</h4>
           <p className="label-md step-header-desc">Cập nhật bằng cấp, chứng chỉ và môn học giáo viên có thể đảm nhiệm.</p>
        </div>
      </div>

      <div className="card p-32">
         <div className="card-section-header flex-between p-0 mb-24" style={{ paddingBottom: '16px' }}>
            <h3 className="headline-md step-section-title">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               Hồ sơ chuyên môn
            </h3>
         </div>

         <div className="grid grid-2 gap-24 mb-24">
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Trình độ học vấn <span className="text-error">*</span></label>
               <select className="input">
                  <option>Cử nhân</option>
                  <option>Thạc sĩ</option>
                  <option>Tiến sĩ</option>
                  <option>Khác</option>
               </select>
            </div>
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Chuyên ngành đào tạo</label>
               <input type="text" className="input" placeholder="VD: Sư phạm Tiếng Anh" />
            </div>
         </div>

         <div className="mb-24">
            <label className="label-md mb-8" style={{ display: 'block' }}>Chứng chỉ ngoại ngữ / Chuyên môn</label>
            <input type="text" className="input" placeholder="VD: IELTS 8.5, TESOL" />
         </div>

         <div className="mb-24">
            <label className="label-md mb-8" style={{ display: 'block' }}>Tài liệu đính kèm (Scan bằng cấp/chứng chỉ)</label>
            <div className="flex-col items-center p-24 rounded" style={{ border: '1px dashed var(--outline)', backgroundColor: '#F8FAFC' }}>
               <svg className="mb-12" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
               <p className="body-md text-on-surface mb-4">Kéo thả file vào đây hoặc <span className="font-medium cursor-pointer" style={{ color: '#2563EB' }}>Tải lên từ thiết bị</span></p>
               <p className="label-md text-on-surface-variant">Hỗ trợ PDF, JPG, PNG. Tối đa 10MB/file.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Step3Expertise;
