import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { validateFullName } from '../utils/nameValidation';
import { userService } from '../api/services/user.service';
import { classService } from '../api/services/class.service';
import type { ClassSummary } from '../api/services/class.service';

export const AddStudent: React.FC = () => {
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
    parentPhone: '',
    dob: '',
    entryBand: '5.5 IELTS',
    targetBand: '7.0 IELTS',
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
    { num: 2 as const, title: isVi ? 'Trình độ & Mục tiêu' : 'Level & Target' },
    { num: 3 as const, title: isVi ? 'Ghi danh lớp học' : 'Class Enrollment' },
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

      const created = await userService.createUser({
        role: 'STUDENT',
        fullName: valResult.normalized,
        email: formData.email.trim(),
        password: formData.password || 'Student123!',
        studentCode: formData.code || undefined,
        dateOfBirth: formData.dob || undefined,
        parentPhone: formData.parentPhone || undefined
      });

      if (formData.assignedClassId && created?.user?.id) {
        try {
          await classService.addMember(Number(formData.assignedClassId), created.user.id);
        } catch {
          // ignore enrollment failure if already added
        }
      }

      navigate('/admin/students');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : isVi ? 'Không thể ghi danh học viên mới.' : 'Failed to register student.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return 'HV';
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
                    <label className="adm-form-label">{isVi ? 'Mã định danh (HV Code)' : 'Student ID'}</label>
                    <input 
                      type="text" 
                      className="input font-mono"
                      placeholder={isVi ? 'Tự sinh nếu để trống' : 'Auto-generated'}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                      placeholder="student@center.edu.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Mật khẩu' : 'Password'}</label>
                    <input 
                      type="password" 
                      className="input"
                      placeholder={isVi ? 'Mặc định: Student123!' : 'Default: Student123!'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'SĐT Học viên' : 'Student Phone'}</label>
                    <input 
                      type="text" 
                      className="input"
                      placeholder="0912-345-678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Số điện thoại Phụ huynh' : 'Parent Phone'}</label>
                    <input 
                      type="text" 
                      className="input"
                      placeholder="0988-776-655"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    />
                  </div>
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
                    <label className="adm-form-label">{isVi ? 'Trình độ đầu vào' : 'Entry Level'}</label>
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
                    <label className="adm-form-label">{isVi ? 'Mục tiêu chứng chỉ' : 'Target Band'}</label>
                    <select 
                      className="input"
                      value={formData.targetBand}
                      onChange={(e) => setFormData({ ...formData, targetBand: e.target.value })}
                    >
                      <option value="6.5 IELTS">6.5 IELTS</option>
                      <option value="7.0 IELTS">7.0 IELTS</option>
                      <option value="7.5 IELTS">7.5 IELTS</option>
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
                  <label className="adm-form-label">{isVi ? 'Đăng ký vào lớp học' : 'Select Cohort'}</label>
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
                      <option value="">{isVi ? '-- Chưa ghi danh vào lớp cụ thể --' : '-- No class assigned --'}</option>
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
                {getInitials(formData.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 2px 0' }}>
                  {formData.name || (isVi ? 'Họ và tên học viên' : 'Student Full Name')}
                </h3>
                <span className="font-mono text-primary font-semibold" style={{ fontSize: '12.5px' }}>
                  {formData.code || 'HV-NEW'}
                </span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-container-low)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span>{isVi ? 'Đầu vào: ' : 'Entry: '}<strong>{formData.entryBand}</strong></span>
                <span className="text-primary font-bold">{formData.targetBand}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              <div><strong>Email:</strong> {formData.email || '—'}</div>
              <div><strong>{isVi ? 'SĐT Học viên:' : 'Phone:'}</strong> {formData.phone || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
