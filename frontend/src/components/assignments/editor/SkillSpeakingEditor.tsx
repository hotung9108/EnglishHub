import React from 'react';
import type { SpeakingConfig } from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SkillSpeakingEditorProps {
  config: SpeakingConfig;
  onChange: (updated: SpeakingConfig) => void;
}

export const SkillSpeakingEditor: React.FC<SkillSpeakingEditorProps> = ({ config, onChange }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const updateField = <K extends keyof SpeakingConfig>(key: K, value: SpeakingConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const promptValue = config.promptText || config.cueCardTopic || '';
  const promptWordCount = promptValue.trim() ? promptValue.trim().split(/\s+/).length : 0;

  const handlePromptChange = (val: string) => {
    onChange({
      ...config,
      promptText: val,
      cueCardTopic: val
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECTION: Speaking Prompt & Instructions */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div>
            <h2 className="edit-card-title">
              {isVi ? 'Đề Bài & Yêu Cầu Bài Nói' : 'Speaking Prompt & Instructions'}
            </h2>
            <p className="edit-card-desc">
              {isVi 
                ? 'Nhập chủ đề bài nói, câu hỏi gợi ý và hướng dẫn học viên ghi âm.' 
                : 'Enter speaking topic, guided questions, and recording instructions.'}
            </p>
          </div>
        </div>

        <div className="edit-form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="edit-form-label" style={{ margin: 0 }}>
              {isVi ? 'Nội dung đề bài nói' : 'Speaking Topic & Prompt'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              {isVi ? 'Độ dài đề bài:' : 'Prompt:'} <strong style={{ color: '#0f172a' }}>{promptWordCount}</strong> {isVi ? 'từ' : 'words'}
            </span>
          </div>

          <textarea 
            className="edit-form-textarea"
            rows={8}
            value={promptValue}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder={isVi 
              ? 'Ví dụ: Describe a memorable journey you took recently.\nYou should say:\n- Where you went and who you went with\n- What you did during the trip\n- And explain why this journey was memorable to you.' 
              : 'e.g. Describe a memorable journey you took recently.\nYou should say:\n- Where you went and who you went with\n- What you did during the trip\n- And explain why this journey was memorable to you.'}
            style={{ resize: 'vertical' }}
          />
        </div>
      </section>

      {/* SECTION: AI Grading Criteria (Optional) */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div>
            <h2 className="edit-card-title">
              {isVi ? 'Hướng Dẫn Chấm Điểm Cho AI' : 'AI Grading Instructions'}
            </h2>
            <p className="edit-card-desc">
              {isVi 
                ? 'Ghi chú tiêu chí chấm điểm, từ vựng hoặc phát âm cần AI lưu ý khi phân tích bài nói.' 
                : 'Scoring criteria, target vocabulary, or pronunciation notes for AI evaluation.'}
            </p>
          </div>
        </div>

        <div className="edit-form-group" style={{ marginBottom: 0 }}>
          <label className="edit-form-label">
            {isVi ? 'Chỉ dẫn chấm điểm bổ sung (Tùy chọn)' : 'Additional Grading Notes (Optional)'}
          </label>
          <textarea 
            className="edit-form-textarea"
            rows={4}
            value={config.aiInstruction || ''}
            onChange={(e) => updateField('aiInstruction', e.target.value)}
            placeholder={isVi 
              ? 'Ví dụ: Đánh giá cao phát âm chuẩn đuôi -ed, thì quá khứ đơn, ngữ điệu tự nhiên và việc sử dụng các từ nối chỉ thời gian...' 
              : 'e.g. Focus on past tense pronunciation, intonation, and linking phrases...'}
            style={{ resize: 'vertical' }}
          />
        </div>
      </section>
    </div>
  );
};

export default SkillSpeakingEditor;
