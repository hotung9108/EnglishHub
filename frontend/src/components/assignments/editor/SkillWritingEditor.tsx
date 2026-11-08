import React, { useRef } from 'react';
import type { WritingConfig } from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Image, Upload, X } from 'lucide-react';

interface SkillWritingEditorProps {
  config: WritingConfig;
  onChange: (updated: WritingConfig) => void;
}

export const SkillWritingEditor: React.FC<SkillWritingEditorProps> = ({ config, onChange }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof WritingConfig>(key: K, value: WritingConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(isVi ? 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP)!' : 'Please select a valid image file (PNG, JPG, WebP)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      if (dataUrl) {
        updateField('chartImageUrl', dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

          {/* IELTS Task 1 Diagram / Image Upload */}
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'var(--eh-surface-container, #f8fafc)',
            borderRadius: '10px',
            border: '1px solid var(--eh-border, #e2e8f0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--eh-text-primary, #1e293b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image size={16} className="text-primary" />
                  {isVi ? 'Hình ảnh / Biểu đồ đề bài (Task 1 Diagram/Chart)' : 'Task 1 Diagram / Chart Image'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--eh-text-muted, #64748b)', marginTop: '2px' }}>
                  {isVi ? 'Hỗ trợ tải lên ảnh biểu đồ (IELTS Writing Task 1) hoặc dán đường dẫn ảnh trực tiếp.' : 'Upload chart image for IELTS Task 1 or provide an image URL.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleImageFileUpload} 
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm flex items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  <Upload size={14} />
                  {isVi ? 'Tải ảnh lên' : 'Upload Image'}
                </button>
              </div>
            </div>

            <input 
              type="text"
              className="edit-form-input"
              value={config.chartImageUrl || ''}
              onChange={(e) => updateField('chartImageUrl', e.target.value)}
              placeholder={isVi ? 'Hoặc dán đường dẫn ảnh (https://...)' : 'Or paste image URL (https://...)'}
              style={{ width: '100%', fontSize: '12.5px', marginBottom: config.chartImageUrl ? '12px' : '0' }}
            />

            {config.chartImageUrl && (
              <div style={{
                position: 'relative',
                display: 'inline-block',
                marginTop: '10px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--eh-border, #e2e8f0)',
                backgroundColor: '#ffffff'
              }}>
                <img 
                  src={config.chartImageUrl} 
                  alt="Writing Diagram Preview" 
                  style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} 
                />
                <button
                  type="button"
                  onClick={() => updateField('chartImageUrl', '')}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isVi ? 'Gỡ ảnh' : 'Remove image'}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

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
                value={config.minWords === 0 ? '' : config.minWords}
                placeholder="0"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    updateField('minWords', 0);
                    return;
                  }
                  const clean = raw.replace(/^0+/, '');
                  updateField('minWords', clean === '' ? 0 : Number(clean));
                }}
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
