import React from 'react';

const Step1ClassInfo = () => {
  return (
    <div className="card" style={{ padding: '32px' }}>
      <h2 className="headline-sm text-on-surface" style={{ marginBottom: '24px' }}>Thông tin cơ bản</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="label-lg" style={{ color: '#374151' }}>Mã lớp học <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" className="input" placeholder="Ví dụ: ENG-IELTS-6.5A" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="label-lg" style={{ color: '#374151' }}>Tên lớp học <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" className="input" placeholder="Ví dụ: IELTS Intensive Band 6.5 - 7.5" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="label-lg" style={{ color: '#374151' }}>Loại khóa học</label>
          <select className="input" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }}>
            <option value="">Chọn loại khóa học</option>
            <option value="ielts">IELTS</option>
            <option value="toeic">TOEIC</option>
            <option value="communication">Giao tiếp</option>
            <option value="kids">Tiếng Anh Trẻ em</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="label-lg" style={{ color: '#374151' }}>Lịch học <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" className="input" placeholder="Ví dụ: T2-T4-T6 (18:00 - 20:00)" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="label-lg" style={{ color: '#374151' }}>Phòng học</label>
          <input type="text" className="input" placeholder="Ví dụ: Phòng 301" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="label-lg" style={{ color: '#374151' }}>Trạng thái</label>
          <select className="input" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)' }}>
            <option value="open">Đang mở (Đang tuyển sinh)</option>
            <option value="active">Đang học</option>
            <option value="closed">Đã kết thúc</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label className="label-lg" style={{ color: '#374151' }}>Mô tả ngắn</label>
        <textarea className="input" rows={4} placeholder="Nhập mô tả về lớp học này..." style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-lowest)', resize: 'vertical' }}></textarea>
      </div>
    </div>
  );
};

export default Step1ClassInfo;
