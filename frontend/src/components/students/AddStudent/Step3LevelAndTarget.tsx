import React from 'react';

const Step3LevelAndTarget = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '24px', backgroundColor: '#EFF6FF', borderColor: '#DBEAFE', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        </div>
        <div>
           <h4 className="headline-md" style={{ color: '#1E3A8A', fontSize: '18px', marginBottom: '4px' }}>Trình độ & Mục tiêu</h4>
           <p className="label-md" style={{ color: '#3B82F6', fontWeight: '400' }}>Đánh giá trình độ đầu vào và xác định mục tiêu học tập của học viên.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 className="headline-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               Đánh giá đầu vào
            </h3>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Chương trình quan tâm <span style={{color: '#DC2626'}}>*</span></label>
               <select className="input">
                  <option>IELTS</option>
                  <option>TOEIC</option>
                  <option>Giao tiếp</option>
               </select>
            </div>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Điểm kiểm tra đầu vào (Nếu có)</label>
               <input type="text" className="input" placeholder="VD: IELTS 5.0 / Khá" />
            </div>
         </div>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '24px', marginTop: '32px' }}>
            <h3 className="headline-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
               Mục tiêu đầu ra
            </h3>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Điểm số/Trình độ mục tiêu <span style={{color: '#DC2626'}}>*</span></label>
               <input type="text" className="input" placeholder="VD: IELTS 7.0" />
            </div>
            <div>
               <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Thời gian dự kiến đạt mục tiêu</label>
               <select className="input">
                  <option>3 Tháng</option>
                  <option>6 Tháng</option>
                  <option>9 Tháng</option>
                  <option>1 Năm</option>
               </select>
            </div>
         </div>

         <div style={{ marginBottom: '24px' }}>
            <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Ghi chú học tập</label>
            <textarea className="input" style={{ height: '100px', paddingTop: '12px', resize: 'vertical' }} placeholder="Những lưu ý đặc biệt về cách học, điểm yếu cần khắc phục..."></textarea>
         </div>
      </div>
    </div>
  );
};

export default Step3LevelAndTarget;
