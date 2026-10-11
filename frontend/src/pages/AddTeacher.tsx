import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Award, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { validateFullName } from '../utils/nameValidation';
import { userService } from '../api/services/user.service';
import { classService } from '../api/services/class.service';
import type { ClassSummary } from '../api/services/class.service';

export const AddTeacher: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    password: '',
    certs: '',
    experience: '',
    assignedClassId: ''
  });
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const res = await classService.list({ page: 1, limit: 50 });
        if (isMounted) {
          setClasses(res.data);
        }
      } catch {
        // fail gracefully
      }
    };
    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  const steps = [
    { num: 1 as const, title: isVi ? 'Thông tin cá nhân' : 'Personal Info' },
    { num: 2 as const, title: isVi ? 'Chuyên môn & Chứng chỉ' : 'Qualifications' },
    { num: 3 as const, title: isVi ? 'Phân công lớp & Lưu' : 'Class Assignment' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valResult = validateFullName(formData.name, isVi);
    if (!valResult.isValid) {
      setNameError(valResult.errorMessage || '');
      setCurrentStep(1);
      return;
    }
    setNameError('');

    try {
      setSubmitting(true);
      setSubmitError(null);

      await userService.createUser({
        role: 'TEACHER',
        fullName: valResult.normalized,
        email: formData.email.trim(),
        password: formData.password || 'Teacher123!',
        specialization: formData.certs || undefined
      });

      navigate('/admin/teachers');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : isVi ? 'Không thể tạo tài khoản giảng viên.' : 'Failed to create teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return 'GV';
    return name.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase();
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

      {submitError && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      )}

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
                    placeholder="Nguyễn Văn A..."
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (nameError) setNameError('');
                    }}
                    onBlur={() => {
                      const res = validateFullName(formData.name, isVi);
                      if (!res.isValid) {
                        setNameError(res.errorMessage || '');
                      } else {
                        setNameError('');
                      }
                    }}
                    style={nameError ? { borderColor: 'var(--error, #ef4444)' } : undefined}
                    required
                  />
                  {nameError ? (
                    <span style={{ color: 'var(--error, #ef4444)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {nameError}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--on-surface-variant, #64748b)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {isVi ? 'Chỉ gồm chữ cái, dấu cách, gạch nối hoặc dấu nháy đơn (2 - 50 ký tự)' : 'Letters, spaces, hyphens, or apostrophes only (2 - 50 chars)'}
                    </span>
                  )}
                </div>

                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Mã định danh (GV Code)' : 'Faculty Code'}</label>
                    <input 
                      type="text"
                      className="input font-mono"
                      placeholder={isVi ? 'Tự sinh hoặc nhập' : 'Auto-assigned'}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Số điện thoại' : 'Phone'}</label>
                    <input 
                      type="text"
                      className="input"
                      placeholder="0912-345-678"
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
                    placeholder="teacher@center.edu.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Mật khẩu khởi tạo' : 'Password'}</label>
                  <input 
                    type="password"
                    className="input"
                    placeholder={isVi ? 'Mặc định: Teacher123!' : 'Default: Teacher123!'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    disabled={!formData.name.trim() || !formData.email.trim()}
                    onClick={() => {
                      const res = validateFullName(formData.name, isVi);
                      if (!res.isValid) {
                        setNameError(res.errorMessage || '');
                        return;
                      }
                      setNameError('');
                      setFormData(prev => ({ ...prev, name: res.normalized }));
                      setCurrentStep(2);
                    }}
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
                  <label className="adm-form-label">{isVi ? 'Chứng chỉ sư phạm & Chuyên môn' : 'Certificates & Specialization'}</label>
                  <input 
                    type="text"
                    className="input"
                    placeholder={isVi ? 'Ví dụ: IELTS 8.5 • TESOL Certified' : 'e.g. IELTS 8.5 • TESOL Certified'}
                    value={formData.certs}
                    onChange={(e) => setFormData({ ...formData, certs: e.target.value })}
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Kinh nghiệm giảng dạy' : 'Teaching Experience'}</label>
                  <textarea 
                    className="input"
                    rows={3}
                    placeholder={isVi ? 'Kinh nghiệm luyện thi, trung tâm trước đây...' : 'Teaching background and notes...'}
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
                  {classes.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                      {isVi ? 'Chưa có lớp học nào trên hệ thống.' : 'No classes available.'}
                    </div>
                  ) : (
                    <select 
                      className="input"
                      value={formData.assignedClassId}
                      onChange={(e) => setFormData({ ...formData, assignedClassId: e.target.value })}
                    >
                      <option value="">{isVi ? '-- Chưa phân công lớp --' : '-- No class assigned --'}</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          ENG-{c.id}: {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(2)}
                    disabled={submitting}
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting || !formData.name.trim() || !formData.email.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
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
                {getInitials(formData.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 2px 0' }}>
                  {formData.name || (isVi ? 'Họ và tên giảng viên' : 'Teacher Full Name')}
                </h3>
                <span className="font-mono text-primary font-semibold" style={{ fontSize: '12.5px' }}>
                  {formData.code || 'GV-NEW'}
                </span>
              </div>
            </div>

            {formData.certs && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-high)', fontSize: '12px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '16px' }}>
                <Award size={14} color="var(--primary)" />
                <span>{formData.certs}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              <div><strong>Email:</strong> {formData.email || '—'}</div>
              <div><strong>{isVi ? 'SĐT' : 'Phone'}:</strong> {formData.phone || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTeacher;
