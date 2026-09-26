import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const AddStudent: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: 'Nguyễn Minh Quân',
    code: 'HV-8805',
    email: 'quan.nm@student.edu.vn',
    phone: '0912 999 888',
    parentPhone: '0988 333 222',
    dob: '2005-09-12',
    entryBand: '5.5 IELTS',
    targetBand: '7.0 IELTS',
    assignedClass: 'ENG-IELTS-6.5A'
  });

  const steps = [
    { num: 1 as const, title: isVi ? 'Thông tin cá nhân' : 'Personal Info' },
    { num: 2 as const, title: isVi ? 'Trình độ & Mục tiêu' : 'Level & Target' },
    { num: 3 as const, title: isVi ? 'Ghi danh lớp học' : 'Class Enrollment' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(isVi ? `Ghi danh học viên ${formData.name} (${formData.code}) thành công!` : `Enrolled student ${formData.name}!`);
    navigate('/admin/students');
  };

  return (
    <div className="adm-container" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/admin/students')}
              style={{ padding: '6px 10px' }}
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="adm-title">{t('addStudent.title')}</h1>
          </div>
          <p className="adm-subtitle">
            {isVi ? 'Nhập hồ sơ học viên mới vào cơ sở dữ liệu và ghi danh vào lớp.' : 'Register new student into database and assign to cohort.'}
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

      {/* Form & Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '28px', alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Họ và tên học viên' : 'Student Full Name'} *</label>
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
                    <label className="adm-form-label">{isVi ? 'Mã định danh (HV Code)' : 'Student ID'} *</label>
                    <input 
                      type="text" 
                      className="input font-mono"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Ngày sinh (DOB)' : 'Date of Birth'}</label>
                    <input 
                      type="date" 
                      className="input"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                </div>

                <div className="adm-form-grid">
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

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'SĐT Học viên' : 'Student Phone'}</label>
                    <input 
                      type="text" 
                      className="input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Số điện thoại Phụ huynh' : 'Parent Phone'} *</label>
                  <input 
                    type="text" 
                    className="input"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
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
                    <span>{t('addStudent.btnNextStep3')}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Trình độ đầu vào' : 'Entry Level'} *</label>
                    <select 
                      className="input"
                      value={formData.entryBand}
                      onChange={(e) => setFormData({ ...formData, entryBand: e.target.value })}
                    >
                      <option value="5.0 IELTS">5.0 IELTS</option>
                      <option value="5.5 IELTS">5.5 IELTS</option>
                      <option value="6.0 IELTS">6.0 IELTS</option>
                      <option value="550 TOEIC">550 TOEIC</option>
                    </select>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Mục tiêu chứng chỉ' : 'Target Band'} *</label>
                    <select 
                      className="input"
                      value={formData.targetBand}
                      onChange={(e) => setFormData({ ...formData, targetBand: e.target.value })}
                    >
                      <option value="6.5 IELTS">6.5 IELTS (Target)</option>
                      <option value="7.0 IELTS">7.0 IELTS (Target Master)</option>
                      <option value="7.5 IELTS">7.5 IELTS (High Score)</option>
                      <option value="800+ TOEIC">800+ TOEIC</option>
                    </select>
                  </div>
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
                    <span>{t('addStudent.btnNextStep4')}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Đăng ký vào lớp học' : 'Select Cohort'} *</label>
                  <select 
                    className="input"
                    value={formData.assignedClass}
                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                  >
                    <option value="ENG-IELTS-6.5A">ENG-IELTS-6.5A (Cô Trần Thị Mai Lan)</option>
                    <option value="ENG-TOEIC-750">ENG-TOEIC-750 (Cô Nguyễn Thu Trang)</option>
                    <option value="ENG-COMM-B2">ENG-COMM-B2 (Thầy Mark Reynolds)</option>
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
                    <span>{t('addStudent.btnFinish')}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Live Preview Card */}
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
            {isVi ? 'HỒ SƠ HỌC VIÊN XEM TRƯỚC' : 'STUDENT PROFILE PREVIEW'}
          </div>

          <div className="card" style={{ padding: '24px', border: '2px solid var(--primary-fixed-dim, #bfdbfe)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div className="adm-avatar" style={{ width: '48px', height: '48px', fontSize: '18px', backgroundColor: '#059669' }}>
                {formData.name.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 2px 0' }}>{formData.name}</h3>
                <span className="font-mono text-primary font-semibold" style={{ fontSize: '12.5px' }}>{formData.code}</span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-container-low)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span>Đầu vào: <strong>{formData.entryBand}</strong></span>
                <span className="text-primary font-bold">{formData.targetBand}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              <div><strong>Email:</strong> {formData.email}</div>
              <div><strong>SĐT Học viên:</strong> {formData.phone}</div>
              <div><strong>SĐT Phụ huynh:</strong> {formData.parentPhone}</div>
              <div><strong>Lớp đăng ký:</strong> <span className="font-mono text-primary">{formData.assignedClass}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
