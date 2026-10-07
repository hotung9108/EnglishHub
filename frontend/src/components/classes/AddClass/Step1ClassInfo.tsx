const Step1ClassInfo = () => {
  return (
    <div className="card p-32">
      <h2 className="headline-sm text-on-surface mb-24">Thông tin cơ bản</h2>
      <div className="grid grid-2 gap-24">
        <div className="flex-col gap-8">
          <label className="label-lg" style={{ color: '#374151' }}>Mã lớp học <span className="text-error">*</span></label>
          <input type="text" className="input w-full p-12-16" placeholder="Ví dụ: ENG-IELTS-6.5A" style={{ borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} />
        </div>
        <div className="flex-col gap-8">
          <label className="label-lg" style={{ color: '#374151' }}>Tên lớp học <span className="text-error">*</span></label>
          <input type="text" className="input w-full p-12-16" placeholder="Ví dụ: IELTS Intensive Band 6.5 - 7.5" style={{ borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} />
        </div>
        <div className="flex-col gap-8">
          <label className="label-lg" style={{ color: '#374151' }}>Loại khóa học</label>
          <select className="input w-full p-12-16" style={{ borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }}>
            <option value="">Chọn loại khóa học</option>
            <option value="ielts">IELTS</option>
            <option value="toeic">TOEIC</option>
            <option value="communication">Giao tiếp</option>
            <option value="kids">Tiếng Anh Trẻ em</option>
          </select>
        </div>
        <div className="flex-col gap-8">
          <label className="label-lg" style={{ color: '#374151' }}>Lịch học <span className="text-error">*</span></label>
          <input type="text" className="input w-full p-12-16" placeholder="Ví dụ: T2-T4-T6 (18:00 - 20:00)" style={{ borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} />
        </div>
        <div className="flex-col gap-8">
          <label className="label-lg" style={{ color: '#374151' }}>Phòng học</label>
          <input type="text" className="input w-full p-12-16" placeholder="Ví dụ: Phòng 301" style={{ borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} />
        </div>
        <div className="flex-col gap-8">
          <label className="label-lg" style={{ color: '#374151' }}>Trạng thái</label>
          <select className="input w-full p-12-16" style={{ borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }}>
            <option value="open">Đang mở (Đang tuyển sinh)</option>
            <option value="active">Đang học</option>
            <option value="closed">Đã kết thúc</option>
          </select>
        </div>
      </div>
      
      <div className="flex-col gap-8 mt-24">
        <label className="label-lg" style={{ color: '#374151' }}>Mô tả ngắn</label>
        <textarea className="input w-full p-12-16" rows={4} placeholder="Nhập mô tả về lớp học này..." style={{ borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)', resize: 'vertical' }}></textarea>
      </div>
    </div>
  );
};

export default Step1ClassInfo;
