const Step3LevelAndTarget = () => {
  return (
    <div className="flex-col gap-24">
      <div className="step-header">
        <div className="step-header-icon">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        </div>
        <div>
           <h4 className="headline-md step-header-title">Trình độ & Mục tiêu</h4>
           <p className="label-md step-header-desc">Đánh giá trình độ đầu vào và xác định mục tiêu học tập của học viên.</p>
        </div>
      </div>

      <div className="card p-32">
         <div className="card-section-header flex-between p-0 mb-24" style={{ paddingBottom: '16px' }}>
            <h3 className="headline-md step-section-title">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               Đánh giá đầu vào
            </h3>
         </div>

         <div className="grid grid-2 gap-24 mb-24">
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Chương trình quan tâm <span className="text-error">*</span></label>
               <select className="input">
                  <option>IELTS</option>
                  <option>TOEIC</option>
                  <option>Giao tiếp</option>
               </select>
            </div>
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Điểm kiểm tra đầu vào (Nếu có)</label>
               <input type="text" className="input" placeholder="VD: IELTS 5.0 / Khá" />
            </div>
         </div>

         <div className="card-section-header flex-between p-0 mb-24 mt-32" style={{ paddingBottom: '16px' }}>
            <h3 className="headline-md step-section-title">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
               Mục tiêu đầu ra
            </h3>
         </div>

         <div className="grid grid-2 gap-24 mb-24">
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Điểm số/Trình độ mục tiêu <span className="text-error">*</span></label>
               <input type="text" className="input" placeholder="VD: IELTS 7.0" />
            </div>
            <div>
               <label className="label-md mb-8" style={{ display: 'block' }}>Thời gian dự kiến đạt mục tiêu</label>
               <select className="input">
                  <option>3 Tháng</option>
                  <option>6 Tháng</option>
                  <option>9 Tháng</option>
                  <option>1 Năm</option>
               </select>
            </div>
         </div>

         <div className="mb-24">
            <label className="label-md mb-8" style={{ display: 'block' }}>Ghi chú học tập</label>
            <textarea className="input" style={{ height: '100px', paddingTop: '12px', resize: 'vertical' }} placeholder="Những lưu ý đặc biệt về cách học, điểm yếu cần khắc phục..."></textarea>
         </div>
      </div>
    </div>
  );
};

export default Step3LevelAndTarget;
