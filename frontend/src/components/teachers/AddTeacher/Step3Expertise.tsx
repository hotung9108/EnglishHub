import React from 'react';

const Step3Expertise = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '24px', backgroundColor: '#EFF6FF', borderColor: '#DBEAFE', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
        </div>
        <div>
           <h4 className="headline-md" style={{ color: '#1E3A8A', fontSize: '18px', marginBottom: '4px' }}>Chuyên môn & Chứng chỉ</h4>
           <p className="label-md" style={{ color: '#3B82F6', fontWeight: '400' }}>Cập nhật bằng cấp, chứng chỉ và môn học giáo viên có thể đảm nhiệm.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 className="headline-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               Hồ sơ chuyên môn
            </h3>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Trình độ học vấn <span style={{color: '#DC2626'}}>*</span></label>
               <select className="input">
                  <option>Cử nhân</option>
                  <option>Thạc sĩ</option>
                  <option>Tiến sĩ</option>
                  <option>Khác</option>
               </select>
            </div>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Chuyên ngành đào tạo</label>
               <input type="text" className="input" placeholder="VD: Sư phạm Tiếng Anh" />
            </div>
         </div>

         <div style={{ marginBottom: '24px' }}>
            <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Chứng chỉ ngoại ngữ / Chuyên môn</label>
            <input type="text" className="input" placeholder="VD: IELTS 8.5, TESOL" />
         </div>

         <div style={{ marginBottom: '24px' }}>
            <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Tài liệu đính kèm (Scan bằng cấp/chứng chỉ)</label>
            <div style={{ border: '1px dashed var(--outline)', borderRadius: 'var(--radius-default)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
               <p className="body-md text-on-surface" style={{ marginBottom: '4px' }}>Kéo thả file vào đây hoặc <span style={{ color: '#2563EB', cursor: 'pointer', fontWeight: '500' }}>Tải lên từ thiết bị</span></p>
               <p className="label-md text-on-surface-variant">Hỗ trợ PDF, JPG, PNG. Tối đa 10MB/file.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Step3Expertise;
