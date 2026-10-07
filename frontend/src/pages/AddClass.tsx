import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, 
  User, Clock, MapPin
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const AddClass: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: 'IELTS Master Band 7.0+ Intensive',
    code: 'ENG-IELTS-7.0B',
    level: 'IELTS 7.0+',
    room: 'Online Room #05 (Zoom HD)',
    teacher: 'Cô Trần Thị Mai Lan',
    schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
    maxStudents: 24,
    notes: 'Lớp cam kết đầu ra 7.0+ sau 30 buổi học.'
  });

  const steps = [
    { num: 1 as const, title: isVi ? 'Thông tin lớp học' : 'Class Details' },
    { num: 2 as const, title: isVi ? 'Giáo viên & Lịch học' : 'Instructor & Schedule' },
    { num: 3 as const, title: isVi ? 'Sĩ số & Hoàn tất' : 'Capacity & Review' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(isVi ? `Khởi tạo lớp học ${formData.name} (${formData.code}) thành công!` : `Class ${formData.name} created!`);
    navigate('/admin/classes');
  };

  return (
    <div className="adm-container" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/admin/classes')}
              style={{ padding: '6px 10px' }}
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="adm-title">{t('addClass.title')}</h1>
          </div>
          <p className="adm-subtitle">
            {isVi ? 'Thiết lập thông tin khóa học mới với bộ chỉ dẫn từng bước trực quan.' : 'Configure new course cohort with live interactive preview.'}
          </p>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="adm-stepper">
        {steps.map(s => (
          <div 
            key={s.num}
            className={`adm-step-item ${currentStep === s.num ? 'active' : currentStep > s.num ? 'completed' : ''}`}
            onClick={() => s.num < currentStep && setCurrentStep(s.num)}
          >
            <div className="adm-step-circle">
              {currentStep > s.num ? <Check size={16} /> : s.num}
            </div>
            <span className="adm-step-text">{s.title}</span>
          </div>
        ))}
      </div>

      {/* 2-Column Form & Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '28px', alignItems: 'flex-start' }}>
        {/* Form Box */}
        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Tên lớp học đầy đủ' : 'Full Class Title'} *</label>
                  <input 
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Mã lớp học' : 'Class Code'} *</label>
                    <input 
                      type="text"
                      className="input font-mono"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Trình độ / Level' : 'Course Level'}</label>
                    <select 
                      className="input"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    >
                      <option value="IELTS 5.5+">IELTS Pre-Int (5.5+)</option>
                      <option value="IELTS 6.5+">IELTS Intensive (6.5+)</option>
                      <option value="IELTS 7.0+">IELTS Master (7.0+)</option>
                      <option value="TOEIC 750+">TOEIC Cấp tốc 750+</option>
                      <option value="CEFR B2">Tiếng Anh Giao tiếp B2</option>
                    </select>
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Phòng học / Link trực tuyến' : 'Room / Virtual Link'}</label>
                  <input 
                    type="text"
                    className="input"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setCurrentStep(2)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{t('addClass.btnNextStep2')}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Teacher & Schedule */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Giáo viên phụ trách chính' : 'Primary Instructor'} *</label>
                  <select 
                    className="input"
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  >
                    <option value="Cô Trần Thị Mai Lan">Cô Trần Thị Mai Lan (IELTS 8.5 • 4 lớp)</option>
                    <option value="Thầy Nguyễn Văn Nam">Thầy Nguyễn Văn Nam (Grammar Master • 3 lớp)</option>
                    <option value="Cô Nguyễn Thu Trang">Cô Nguyễn Thu Trang (TOEIC Specialist • 2 lớp)</option>
                    <option value="Thầy Mark Reynolds">Thầy Mark Reynolds (Native Speaker • 3 lớp)</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Thời khóa biểu' : 'Class Schedule'} *</label>
                  <select 
                    className="input"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  >
                    <option value="T2 - T4 - T6 (18:00 - 20:00)">Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 20:00)</option>
                    <option value="T3 - T5 - T7 (19:30 - 21:00)">Thứ 3 - Thứ 5 - Thứ 7 (19:30 - 21:00)</option>
                    <option value="T7 - CN (09:00 - 11:30)">Thứ 7 - Chủ Nhật (09:00 - 11:30)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(1)}
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setCurrentStep(3)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{t('addClass.btnNextStep3')}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Capacity & Confirm */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Sĩ số tối đa' : 'Maximum Capacity'}</label>
                  <input 
                    type="number"
                    className="input"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 20 })}
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Ghi chú lớp học' : 'Class Memo'}</label>
                  <textarea 
                    className="input"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(2)}
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={16} />
                    <span>{t('addClass.btnCreateClass')}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Live Preview Card (Right Column) */}
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
            {isVi ? 'XEM TRƯỚC THẺ LỚP HỌC (LIVE PREVIEW)' : 'LIVE CLASS CARD PREVIEW'}
          </div>

          <div className="card" style={{ padding: '22px', border: '2px solid var(--primary-fixed-dim, #bfdbfe)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className="badge badge-primary font-mono">{formData.code || 'CODE'}</span>
                <span className="badge" style={{ backgroundColor: 'var(--surface-container-high)', fontSize: '11.5px' }}>{formData.level}</span>
              </div>
              <span className="badge badge-active">{isVi ? 'Sắp mở' : 'Upcoming'}</span>
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 12px 0', lineHeight: 1.4 }}>
              {formData.name || 'Tên lớp học...'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={15} color="var(--primary)" />
                <span>{formData.teacher}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} />
                <span>{formData.schedule}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} />
                <span>{formData.room}</span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-container-low)', fontSize: '13px' }}>
              <span className="text-on-surface-variant">{isVi ? 'Sĩ số tối đa: ' : 'Max Capacity: '}<strong>{formData.maxStudents} {isVi ? 'học viên' : 'students'}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClass;
