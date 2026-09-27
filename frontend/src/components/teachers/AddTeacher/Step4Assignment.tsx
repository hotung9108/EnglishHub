const Step4Assignment = () => {
  return (
    <div className="flex-col gap-24">
      <div className="step-header">
        <div className="step-header-icon">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div>
           <h4 className="headline-md step-header-title">Phân công lớp học</h4>
           <p className="label-md step-header-desc">Xếp lịch giảng dạy và gán giáo viên vào các lớp học hiện có.</p>
        </div>
      </div>

      <div className="card p-32">
         <div className="card-section-header flex-between p-0 mb-24" style={{ paddingBottom: '16px' }}>
            <h3 className="headline-md step-section-title">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
               Gán lớp học
            </h3>
         </div>

         <div className="mb-24">
            <label className="label-md mb-8" style={{ display: 'block' }}>Lớp học đảm nhiệm</label>
            <div className="relative">
               <input type="text" className="input pr-32" placeholder="Tìm kiếm lớp học theo tên hoặc mã..." />
               <svg className="absolute text-on-surface-variant" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            
            <div className="flex-col gap-12 mt-16">
               <div className="flex-between border rounded p-12-16">
                  <div>
                     <p className="label-md font-semibold text-primary">IELTS Master - Lớp IELTS-M-01</p>
                     <p className="label-md text-on-surface-variant" style={{ fontSize: '12px' }}>T3, T5 (18:00 - 20:00) • 24 học viên</p>
                  </div>
                  <button className="btn btn-secondary py-6 px-12" style={{ fontSize: '13px' }}>Gán lớp</button>
               </div>
               <div className="flex-between border rounded p-12-16">
                  <div>
                     <p className="label-md font-semibold text-primary">Giao tiếp cơ bản - Lớp COM-B-04</p>
                     <p className="label-md text-on-surface-variant" style={{ fontSize: '12px' }}>T7, CN (08:00 - 10:00) • 18 học viên</p>
                  </div>
                  <button className="btn btn-secondary py-6 px-12" style={{ fontSize: '13px' }}>Gán lớp</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Step4Assignment;
