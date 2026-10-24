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
    { num: 2 as const, title: isVi ? 'Ghi danh lớp học' : 'Class Enrollment' },
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
    <div className="adm-container adm-container-narrow">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <div className="adm-header-nav-group">
            <button 
              className="btn btn-secondary adm-btn-back"
              onClick={() => navigate('/admin/students')}
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="adm-title">{t('addStudent.title')}</h1>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="adm-alert-banner">
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {/* Stepper with Circles & Connecting Lines */}
      <div className="adm-stepper-card">
        <div className="adm-stepper-progress">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isActive = currentStep === s.num;
            const isClickable = s.num < currentStep;

            return (
              <React.Fragment key={s.num}>
                <div 
                  className={`adm-progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => isClickable && setCurrentStep(s.num)}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
                      setCurrentStep(s.num);
                    }
                  }}
                >
                  <div className="adm-progress-circle">
                    {isCompleted ? <Check size={18} strokeWidth={2.5} /> : s.num}
                  </div>
                  <div className="adm-progress-label">
                    <span className="adm-progress-sub">{isVi ? `Bước ${s.num}` : `Step ${s.num}`}</span>
                    <span className="adm-progress-title">{s.title}</span>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className={`adm-progress-connector ${currentStep > s.num ? 'completed' : ''}`}>
                    <div className="adm-progress-connector-line" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form & Preview */}
      <div className="adm-multistep-layout">
        <div className="card adm-multistep-form-card">
          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {currentStep === 1 && (
              <div className="adm-multistep-pane">
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Họ và tên học viên' : 'Student Full Name'} *</label>
                  <input 
                    type="text" 
                    className={`input ${nameError ? 'adm-input-error' : ''}`}
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
                    required
                  />
                  {nameError ? (
                    <span className="adm-form-field-error">
                      {nameError}
                    </span>
                  ) : (
                    <span className="adm-form-field-hint">
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

                <div className="adm-form-actions-end">
                  <button 
                    type="button" 
                    className="btn btn-primary adm-btn-with-icon"
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
                  >
                    <span>{isVi ? 'Tiếp theo: Ghi danh lớp học' : 'Next: Class Enrollment'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <div className="adm-multistep-pane">
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Đăng ký vào lớp học' : 'Select Cohort'}</label>
                  {classes.length === 0 ? (
                    <div className="adm-form-meta-note">
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

                <div className="adm-form-actions-between">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(1)}
                    disabled={submitting}
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary adm-btn-with-icon"
                    disabled={submitting || !formData.name.trim() || !formData.email.trim()}
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
          <div className="adm-preview-label">
            {isVi ? 'XEM TRƯỚC HỌC VIÊN' : 'STUDENT PREVIEW'}
          </div>

          <div className="card adm-preview-card">
            <div className="adm-preview-header">
              <div className="adm-avatar adm-preview-avatar adm-preview-avatar-student">
                {getInitials(formData.name)}
              </div>
              <div>
                <h3 className="adm-preview-name">
                  {formData.name || (isVi ? 'Họ và tên học viên' : 'Student Full Name')}
                </h3>
                <span className="font-mono text-primary font-semibold adm-preview-code">
                  {formData.code || 'HV-NEW'}
                </span>
              </div>
            </div>

            {formData.assignedClassId && (
              <div className="adm-preview-cohort-box">
                <div className="adm-preview-cohort-row">
                  <span>{isVi ? 'Lớp ghi danh: ' : 'Class: '}<strong>{classes.find(c => c.id === Number(formData.assignedClassId))?.name || `ENG-${formData.assignedClassId}`}</strong></span>
                </div>
              </div>
            )}

            <div className="adm-preview-details">
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
