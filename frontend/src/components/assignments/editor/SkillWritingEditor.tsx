import React from 'react';
import type { WritingConfig } from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SkillWritingEditorProps {
  config: WritingConfig;
  onChange: (updated: WritingConfig) => void;
}

export const SkillWritingEditor: React.FC<SkillWritingEditorProps> = ({ config, onChange }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const updateField = <K extends keyof WritingConfig>(key: K, value: WritingConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const promptWordCount = config.promptText.trim() ? config.promptText.trim().split(/\s+/).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECTION: Prompt & Word Count Requirements */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div>
            <h2 className="edit-card-title">
              {isVi ? 'Đề Bài & Yêu Cầu Bài Viết' : 'Writing Prompt & Requirements'}
            </h2>
            <p className="edit-card-desc">
              {isVi ? 'Nhập chủ đề bài viết và cấu hình độ dài yêu cầu cho học viên.' : 'Enter essay prompt and word count requirement.'}
            </p>
          </div>
        </div>

        <div className="edit-form-group">
          {/* Prompt Rich Textarea */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="edit-form-label" style={{ margin: 0 }}>
              {isVi ? 'Nội dung đề bài (Essay Topic & Question Statement)' : 'Essay Topic Statement'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              {isVi ? 'Độ dài đề bài:' : 'Prompt:'} <strong style={{ color: '#0f172a' }}>{promptWordCount}</strong> {isVi ? 'từ' : 'words'}
            </span>
          </div>

          <textarea 
            className="edit-form-textarea"
            rows={7}
            value={config.promptText}
            onChange={(e) => updateField('promptText', e.target.value)}
            placeholder={isVi ? 'Nhập chủ đề đề bài, ngữ cảnh và câu hỏi chỉ thị...' : 'Enter prompt statement...'}
            style={{ resize: 'vertical' }}
          />

          {/* Word count setting box */}
          <div style={{ 
            marginTop: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '16px', 
            padding: '14px 18px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '10px', 
            border: '1px solid #e2e8f0' 
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                {isVi ? 'Số từ tối thiểu (Minimum Word Count)' : 'Minimum Word Count'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {isVi ? 'Số từ tối thiểu học viên cần hoàn thành để được tính hợp lệ.' : 'Minimum words required for student submission.'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                min={0}
                step={10}
                className="edit-form-input" 
                value={config.minWords}
                onChange={(e) => updateField('minWords', Math.max(0, parseInt(e.target.value) || 0))}
                style={{ width: '100px', textAlign: 'center', fontWeight: 700, backgroundColor: '#ffffff' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                {isVi ? 'từ' : 'words'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SkillWritingEditor;
