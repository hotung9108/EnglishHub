import React, { useState, useEffect } from 'react';
import { X, Send, Bell, GraduationCap, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { ExamTemplateItem, QuickAssignForm } from '../../types/exam-bank.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { classService, type ClassSummary } from '../../api/services/class.service';

interface QuickAssignModalProps {
  exam: ExamTemplateItem;
  onClose: () => void;
  onConfirmAssign: (form: QuickAssignForm) => Promise<void> | void;
}

export const QuickAssignModal: React.FC<QuickAssignModalProps> = ({ exam, onClose, onConfirmAssign }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<QuickAssignForm>(() => {
    const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const defaultStartDate = new Date().toISOString().slice(0, 16);
    return {
      templateId: exam.id,
      classId: '',
      className: '',
      assignmentTitle: `${exam.title}`,
      assignmentCode: `HW-${exam.code.replace('EB-', '')}`,
      startDate: defaultStartDate,
      dueDate: defaultDueDate,
      allowLate: true,
      notifyStudents: true,
    };
  });

  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = () => {
    setIsLoadingClasses(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchClasses = async () => {
      try {
        const res = await classService.list({ limit: 100 });
        const classList = res.data ?? [];
        if (!isMounted) return;
        setClasses(classList);

        if (classList.length > 0) {
          setForm(prev => ({
            ...prev,
            classId: prev.classId || String(classList[0].id),
            className: prev.className || classList[0].name,
          }));
        }
      } catch (err) {
        console.error('Failed to load classrooms for quick assign:', err);
        if (isMounted) {
          setLoadError(isVi ? 'Không thể tải danh sách lớp học.' : 'Failed to load classrooms.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingClasses(false);
        }
      }
    };

    fetchClasses();

    return () => {
      isMounted = false;
    };
  }, [isVi, reloadKey]);

  const handleClassChange = (selectedId: string) => {
    const target = classes.find(c => String(c.id) === selectedId);
    setForm(prev => ({
      ...prev,
      classId: selectedId,
      className: target ? target.name : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.classId) return;

    try {
      setIsSubmitting(true);
      await onConfirmAssign(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exam-modal-overlay" onClick={onClose}>
      <div className="exam-modal-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="exam-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '8px', 
              backgroundColor: '#eff6ff', 
              color: '#2563eb', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {isVi ? 'Giao Đề Thi Nhanh Cho Lớp Học' : 'Quick Assign Exam to Class'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                {isVi ? 'Nhập trực tiếp từ Ngân hàng đề thi vào danh sách bài tập của lớp.' : 'Deploy template directly into class homework queue.'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="exam-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="edit-form-label" style={{ margin: 0 }}>
                  {isVi ? 'Chọn lớp học nhận bài' : 'Target Classroom'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {loadError && (
                  <button 
                    type="button" 
                    onClick={handleRetry} 
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <RefreshCw size={11} /> {isVi ? 'Thử lại' : 'Retry'}
                  </button>
                )}
              </div>

              {isLoadingClasses ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 13 }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isVi ? 'Đang tải danh sách lớp học...' : 'Loading classes...'}</span>
                </div>
              ) : loadError ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
                  <AlertCircle size={16} />
                  <span>{loadError}</span>
                </div>
              ) : classes.length === 0 ? (
                <div style={{ padding: '10px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7', color: '#b45309', fontSize: 13 }}>
                  {isVi ? 'Chưa có lớp học nào khả dụng. Vui lòng tạo lớp trước khi giao bài.' : 'No classroom available. Please create a class first.'}
                </div>
              ) : (
                <select 
                  className="edit-form-select"
                  value={String(form.classId)}
                  onChange={(e) => handleClassChange(e.target.value)}
                  style={{ fontWeight: 600 }}
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} {c.status ? `(${c.status})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label className="edit-form-label">{isVi ? 'Mã bài tập' : 'HW Code'}</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  value={form.assignmentCode}
                  onChange={(e) => setForm({ ...form, assignmentCode: e.target.value })}
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="edit-form-label">{isVi ? 'Tiêu đề bài tập' : 'Assignment Title'}</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  value={form.assignmentTitle}
                  onChange={(e) => setForm({ ...form, assignmentTitle: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="edit-form-label">{isVi ? 'Ngày bắt đầu mở đề' : 'Start Date'}</label>
                <input 
                  type="datetime-local" 
                  className="edit-form-input" 
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="edit-form-label">
                  {isVi ? 'Hạn chót nộp bài' : 'Deadline'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="datetime-local" 
                  className="edit-form-input" 
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  style={{ fontWeight: 600 }}
                  required
                />
              </div>
            </div>

            <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={form.allowLate}
                  onChange={(e) => setForm({ ...form, allowLate: e.target.checked })}
                  style={{ accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '13px', color: '#334155' }}>
                  {isVi ? 'Cho phép nộp bài muộn tối đa 24 giờ' : 'Allow late submissions within 24h'}
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={form.notifyStudents}
                  onChange={(e) => setForm({ ...form, notifyStudents: e.target.checked })}
                  style={{ accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '13px', color: '#334155' }}>
                  <Bell size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {isVi ? 'Tự động gửi thông báo đến toàn bộ học viên' : 'Send app & email notifications to students'}
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="exam-modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary bg-white btn-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {isVi ? 'Hủy bỏ' : 'Cancel'}
            </button>

            <button 
              type="submit" 
              className="btn btn-primary btn-sm"
              disabled={isSubmitting || isLoadingClasses || !form.classId}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 24px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{isVi ? 'Đang giao bài...' : 'Deploying...'}</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>{isVi ? 'Xác nhận giao bài' : 'Confirm & Deploy'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAssignModal;
