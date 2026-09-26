import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Award
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const AddTeacher: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: 'Cô Hoàng Thu Thảo',
    code: 'GV-092',
    email: 'thao.ht@center.edu.vn',
    phone: '0977 123 456',
    certs: 'IELTS 8.5 • TESOL Certified',
    experience: '5 năm kinh nghiệm luyện thi IELTS Academic',
    assignedClass: 'ENG-IELTS-6.5A'
  });

  const steps = [
    { num: 1 as const, title: isVi ? 'Thông tin cá nhân' : 'Personal Info' },
    { num: 2 as const, title: isVi ? 'Chuyên môn & Chứng chỉ' : 'Qualifications' },
    { num: 3 as const, title: isVi ? 'Phân công lớp & Lưu' : 'Class Assignment' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(isVi ? `Đã thêm hồ sơ giảng viên ${formData.name} (${formData.code}) thành công!` : `Teacher profile created for ${formData.name}!`);
    navigate('/admin/teachers');
  };

  return (
    <div className="adm-container" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/admin/teachers')}
              style={{ padding: '6px 10px' }}
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="adm-title">{t('addTeacher.title')}</h1>
          </div>
          <p className="adm-subtitle">
            {isVi ? 'Khởi tạo hồ sơ giảng viên mới với định danh và phân công lớp học.' : 'Onboard new faculty member with qualifications and class assignment.'}
          </p>
        </div>
      </div>

      {/* Stepper */}
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

      {/* 2-Column Form & Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '28px', alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Họ và tên giảng viên' : 'Full Name'} *</label>
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
                    <label className="adm-form-label">{isVi ? 'Mã định danh (GV Code)' : 'Faculty Code'} *</label>
                    <input 
                      type="text"
                      className="input font-mono"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Số điện thoại' : 'Phone'}</label>
                    <input 
                      type="text"
                      className="input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Email *</label>
                  <input 
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setCurrentStep(2)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{t('addTeacher.btnNextStep3')}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Qualifications */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Chứng chỉ sư phạm & Điểm thi' : 'Certificates & Test Scores'} *</label>
                  <input 
                    type="text"
                    className="input"
                    value={formData.certs}
                    onChange={(e) => setFormData({ ...formData, certs: e.target.value })}
                    required
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Kinh nghiệm giảng dạy' : 'Teaching Experience'}</label>
                  <textarea 
                    className="input"
                    rows={3}
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
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
                    <span>{t('addTeacher.btnNextStep4')}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Assignment & Finish */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Phân công lớp phụ trách ban đầu' : 'Initial Class Assignment'}</label>
                  <select 
                    className="input"
                    value={formData.assignedClass}
                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                  >
                    <option value="ENG-IELTS-6.5A">ENG-IELTS-6.5A (IELTS Intensive 6.5 - 7.5)</option>
                    <option value="ENG-TOEIC-750">ENG-TOEIC-750 (Luyện thi TOEIC 750+)</option>
                    <option value="ENG-GRAM-PREP">ENG-GRAM-PREP (Pre-IELTS Grammar)</option>
                  </select>
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
                    <span>{isVi ? 'Tạo hồ sơ giáo viên' : 'Complete Registration'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Live Preview Card */}
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
            {isVi ? 'XEM TRƯỚC HỒ SƠ GIẢNG VIÊN' : 'FACULTY PROFILE PREVIEW'}
          </div>

          <div className="card" style={{ padding: '24px', border: '2px solid var(--primary-fixed-dim, #bfdbfe)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div className="adm-avatar" style={{ width: '48px', height: '48px', fontSize: '18px', backgroundColor: '#2563eb' }}>
                {formData.name.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 2px 0' }}>{formData.name}</h3>
                <span className="font-mono text-primary font-semibold" style={{ fontSize: '12.5px' }}>{formData.code}</span>
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-high)', fontSize: '12px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '16px' }}>
              <Award size={14} color="var(--primary)" />
              <span>{formData.certs}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              <div><strong>Email:</strong> {formData.email}</div>
              <div><strong>SĐT:</strong> {formData.phone}</div>
              <div><strong>Lớp phụ trách:</strong> <span className="font-mono text-primary">{formData.assignedClass}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTeacher;
