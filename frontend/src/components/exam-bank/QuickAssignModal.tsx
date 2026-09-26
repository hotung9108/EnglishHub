import React, { useState } from 'react';
import { X, Send, Bell, GraduationCap } from 'lucide-react';
import type { ExamTemplateItem, QuickAssignForm } from '../../types/exam-bank.types';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuickAssignModalProps {
  exam: ExamTemplateItem;
  onClose: () => void;
  onConfirmAssign: (form: QuickAssignForm) => void;
}

export const QuickAssignModal: React.FC<QuickAssignModalProps> = ({ exam, onClose, onConfirmAssign }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultStartDate = new Date().toISOString().slice(0, 16);

  const [form, setForm] = useState<QuickAssignForm>({
    templateId: exam.id,
    className: 'ENG-IELTS-6.5A',
    assignmentTitle: `${exam.title}`,
    assignmentCode: `HW-${exam.code.replace('EB-', '')}`,
    startDate: defaultStartDate,
    dueDate: defaultDueDate,
    allowLate: true,
    notifyStudents: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAssign(form);
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
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="exam-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="edit-form-label">{isVi ? 'Chọn lớp học nhận bài' : 'Target Classroom'}</label>
              <select 
                className="edit-form-select"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                style={{ fontWeight: 600 }}
              >
                <option value="ENG-IELTS-6.5A">Lớp: ENG-IELTS-6.5A (Intensive - 24 học viên)</option>
                <option value="ENG-GRAM-ADV">Lớp: ENG-GRAM-ADV (Ngữ pháp nâng cao - 20 học viên)</option>
                <option value="ENG-TOEIC-750">Lớp: ENG-TOEIC-750 (Cấp tốc - 18 học viên)</option>
              </select>
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
            >
              {isVi ? 'Hủy bỏ' : 'Cancel'}
            </button>

            <button 
              type="submit" 
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 24px' }}
            >
              <Send size={14} />
              <span>{isVi ? 'Xác nhận giao bài' : 'Confirm & Deploy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAssignModal;
