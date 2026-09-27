import React from 'react';
import { 
  PenTool, CheckCircle, Sparkles, UploadCloud, 
  Bold, Italic, Underline, List, FileText, Trash2, Eye, ShieldAlert
} from 'lucide-react';
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

  const updateRubric = (key: keyof WritingConfig['rubrics'], val: number) => {
    onChange({
      ...config,
      rubrics: {
        ...config.rubrics,
        [key]: val
      }
    });
  };

  const promptWordCount = config.promptText.trim() ? config.promptText.trim().split(/\s+/).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECTION 1: Prompt & Task Type */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <PenTool size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Đề Bài & Cấu Hình Kỹ Năng Viết (Writing Prompt)' : 'Writing Prompt & Task Parameters'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Soạn thảo đề thi, yêu cầu số lượng từ tối thiểu và tài liệu đính kèm.' : 'Draft essay questions, target word count, and reference attachments.'}
              </p>
            </div>
          </div>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            padding: '4px 10px', 
            borderRadius: '6px', 
            backgroundColor: '#eff6ff', 
            color: '#2563eb' 
          }}>
            IELTS Academic
          </span>
        </div>

        <div className="edit-form-group">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="edit-form-label">{isVi ? 'Dạng bài viết' : 'Task Format'}</label>
              <select 
                className="edit-form-select"
                value={config.taskType}
                onChange={(e) => {
                  const val = e.target.value as WritingConfig['taskType'];
                  updateField('taskType', val);
                  if (val === 'task1') updateField('minWords', 150);
                  if (val === 'task2') updateField('minWords', 250);
                }}
              >
                <option value="task2">IELTS Writing Task 2 (Discursive Essay - 250+ words)</option>
                <option value="task1">IELTS Writing Task 1 (Report/Chart/Graph - 150+ words)</option>
                <option value="custom">{isVi ? 'Tự luận / Tự do (Custom Assignment)' : 'Custom Essay Format'}</option>
              </select>
            </div>

            <div>
              <label className="edit-form-label">{isVi ? 'Số từ tối thiểu (Min Words)' : 'Minimum Word Count'}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="number" 
                  className="edit-form-input" 
                  value={config.minWords}
                  onChange={(e) => updateField('minWords', parseInt(e.target.value) || 0)}
                  style={{ maxWidth: '120px' }}
                />
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {config.taskType === 'task2' ? '(Chuẩn Task 2: 250 từ)' : '(Chuẩn Task 1: 150 từ)'}
                </span>
              </div>
            </div>
          </div>

          {/* Prompt Rich Textarea */}
          <div className="edit-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="edit-form-label" style={{ margin: 0 }}>
                {isVi ? 'Nội dung đề bài (Essay Topic & Question Statement)' : 'Essay Topic Statement'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {promptWordCount} {isVi ? 'từ' : 'words'}
              </span>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div className="rich-toolbar">
                <button type="button" className="rich-btn" title="Bold"><Bold size={14} /></button>
                <button type="button" className="rich-btn" title="Italic"><Italic size={14} /></button>
                <button type="button" className="rich-btn" title="Underline"><Underline size={14} /></button>
                <div style={{ width: '1px', height: '16px', backgroundColor: '#cbd5e1', margin: '0 4px' }}></div>
                <button type="button" className="rich-btn" title="Bullet List"><List size={14} /></button>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>Markdown & LaTeX supported</span>
              </div>
              <textarea 
                className="edit-form-textarea"
                rows={5}
                value={config.promptText}
                onChange={(e) => updateField('promptText', e.target.value)}
                placeholder={isVi ? 'Nhập chủ đề đề bài, ngữ cảnh và câu hỏi chỉ thị...' : 'Enter prompt statement...'}
                style={{ border: 'none', borderRadius: 0, backgroundColor: '#ffffff' }}
              />
            </div>
          </div>

          {/* Task 1 Graphic / Chart upload */}
          {config.taskType === 'task1' && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px dashed #bfdbfe', 
              backgroundColor: '#f8faff' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <UploadCloud size={18} color="#2563eb" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
                  {isVi ? 'Biểu đồ Task 1 (Bar Chart / Line Graph / Pie Chart / Diagram)' : 'Task 1 Graphic Material'}
                </span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#64748b' }}>
                {isVi ? 'Tải lên hình ảnh biểu đồ mà học viên sẽ phân tích và so sánh trong bài làm.' : 'Upload chart or image for student visual analysis.'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="text" 
                  className="edit-form-input"
                  placeholder="URL hình ảnh hoặc khóa lưu trữ (e.g. /assets/charts/carbon-emissions.png)"
                  value={config.chartImageUrl || ''}
                  onChange={(e) => updateField('chartImageUrl', e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary bg-white btn-sm"
                  onClick={() => updateField('chartImageUrl', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80')}
                >
                  {isVi ? 'Mẫu biểu đồ' : 'Sample Chart'}
                </button>
              </div>
              {config.chartImageUrl && (
                <div style={{ marginTop: '12px', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={config.chartImageUrl} alt="Chart preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: AI Assistance & IELTS Rubric Weights */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Trợ Lý AI Chấm Điểm & Trọng Số Rubric' : 'AI Grading Assistant & IELTS Rubrics'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Cân chỉnh 4 tiêu chí chấm chuẩn hội đồng khảo thí và hướng dẫn riêng cho AI.' : 'Calibrate 4 IELTS descriptor weights and AI inspection focus.'}
              </p>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={config.enableAi}
              onChange={(e) => updateField('enableAi', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
            />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
              {isVi ? 'Bật AI Chấm Bài' : 'Enable AI Assistant'}
            </span>
          </label>
        </div>

        {config.enableAi && (
          <div className="ai-calibration-card">
            <div className="ai-header-row">
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} color="#2563eb" />
                {isVi ? 'Phân bổ trọng số 4 tiêu chí chấm Writing (Tổng phải = 100%)' : '4 Criteria Weights (Total = 100%)'}
              </span>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 800, 
                color: (config.rubrics.tr + config.rubrics.cc + config.rubrics.lr + config.rubrics.gra === 100) ? '#16a34a' : '#dc2626' 
              }}>
                Tổng: {config.rubrics.tr + config.rubrics.cc + config.rubrics.lr + config.rubrics.gra}%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="edit-form-label" style={{ fontSize: '11px' }}>Task Response (TR)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    className="edit-form-input" 
                    value={config.rubrics.tr}
                    onChange={(e) => updateRubric('tr', parseInt(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>%</span>
                </div>
              </div>

              <div>
                <label className="edit-form-label" style={{ fontSize: '11px' }}>Coherence (CC)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    className="edit-form-input" 
                    value={config.rubrics.cc}
                    onChange={(e) => updateRubric('cc', parseInt(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>%</span>
                </div>
              </div>

              <div>
                <label className="edit-form-label" style={{ fontSize: '11px' }}>Lexical (LR)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    className="edit-form-input" 
                    value={config.rubrics.lr}
                    onChange={(e) => updateRubric('lr', parseInt(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>%</span>
                </div>
              </div>

              <div>
                <label className="edit-form-label" style={{ fontSize: '11px' }}>Grammar (GRA)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    className="edit-form-input" 
                    value={config.rubrics.gra}
                    onChange={(e) => updateRubric('gra', parseInt(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>%</span>
                </div>
              </div>
            </div>

            <div className="edit-form-group" style={{ marginBottom: 0 }}>
              <label className="edit-form-label">
                {isVi ? 'Chỉ thị riêng cho AI chấm (Custom AI Prompt Instruction)' : 'Prompt Instruction for AI Grader'}
              </label>
              <textarea 
                className="edit-form-textarea"
                rows={3}
                value={config.aiInstruction}
                onChange={(e) => updateField('aiInstruction', e.target.value)}
                placeholder={isVi ? 'Ví dụ: Khắt khe với lỗi lặp từ vựng và mạo từ; gạch chân các cấu trúc ngữ pháp Band 7.5+...' : 'Custom grading focus...'}
                style={{ backgroundColor: '#ffffff' }}
              />
            </div>
          </div>
        )}

        {/* Plagiarism check */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={18} color="#d97706" />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>
                {isVi ? 'Phát hiện đạo văn & văn bản AI (Plagiarism Detection)' : 'Plagiarism & AI Copy Detection'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {isVi ? 'So sánh bài nộp giữa các học viên và phát hiện văn bản do ChatGPT tạo ra.' : 'Cross-check submission against peer database & AI models.'}
              </span>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={config.enablePlagiarismCheck}
            onChange={(e) => updateField('enablePlagiarismCheck', e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
          />
        </div>
      </section>

      {/* SECTION 3: Model Answer & Reference Materials */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Bài Mẫu & Tài Liệu Đối Chiếu (Band 8.0+ Model Answer)' : 'Model Essay & References'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Bài mẫu đối chiếu để AI tham khảo và học viên xem sau khi bài làm đã được chấm.' : 'Benchmark essay for AI grading reference and student review.'}
              </p>
            </div>
          </div>
        </div>

        <div className="edit-form-group">
          <label className="edit-form-label">
            {isVi ? 'Văn bản bài viết mẫu (Model Essay Text)' : 'Sample Essay Content'}
          </label>
          <textarea 
            className="edit-form-textarea"
            rows={6}
            value={config.modelAnswer}
            onChange={(e) => updateField('modelAnswer', e.target.value)}
            placeholder={isVi ? 'Dán bài luận mẫu đạt điểm cao để làm chuẩn mực đối chiếu...' : 'Paste model essay...'}
          />
        </div>

        {/* Attached files */}
        <div>
          <label className="edit-form-label">
            {isVi ? 'Tài liệu hướng dẫn đính kèm' : 'Attached Documents'}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {config.attachments.map((file) => (
              <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} color="#2563eb" />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'block' }}>{file.name}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{file.size} • {file.extension.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary bg-white btn-sm" style={{ padding: '4px 8px' }}>
                    <Eye size={13} />
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary bg-white btn-sm" 
                    style={{ padding: '4px 8px', color: '#dc2626' }}
                    onClick={() => {
                      updateField('attachments', config.attachments.filter(f => f.id !== file.id));
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SkillWritingEditor;
