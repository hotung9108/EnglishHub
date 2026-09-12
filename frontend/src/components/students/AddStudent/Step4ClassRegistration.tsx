import React from 'react';

const Step4ClassRegistration = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '24px', backgroundColor: '#EFF6FF', borderColor: '#DBEAFE', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div>
           <h4 className="headline-md" style={{ color: '#1E3A8A', fontSize: '18px', marginBottom: '4px' }}>Đăng ký lớp học</h4>
           <p className="label-md" style={{ color: '#3B82F6', fontWeight: '400' }}>Sắp xếp lịch học và gán học viên vào các lớp học hiện có.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 className="headline-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
               Gán lớp học
            </h3>
         </div>

         <div style={{ marginBottom: '24px' }}>
            <label className="label-md" style={{ display: 'block', marginBottom: '8px' }}>Lớp học đăng ký</label>
            <div style={{ position: 'relative' }}>
               <input type="text" className="input" placeholder="Tìm kiếm lớp học theo tên hoặc mã..." />
               <svg style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <p className="label-md" style={{ fontWeight: '600', color: '#1E3A8A' }}>IELTS Master - Lớp IELTS-M-01</p>
                     <p className="label-md text-on-surface-variant" style={{ fontSize: '12px' }}>T3, T5 (18:00 - 20:00) • GV: Nguyễn Thị Kim Oanh</p>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Gán vào lớp</button>
               </div>
               <div style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <p className="label-md" style={{ fontWeight: '600', color: '#1E3A8A' }}>Giao tiếp cơ bản - Lớp COM-B-04</p>
                     <p className="label-md text-on-surface-variant" style={{ fontSize: '12px' }}>T7, CN (08:00 - 10:00) • GV: Mark Reynolds</p>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>Gán vào lớp</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Step4ClassRegistration;
