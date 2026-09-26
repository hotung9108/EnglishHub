import React, { useState } from 'react';
import { 
  BookOpen, Plus, Trash2, Eye, EyeOff, Layers, Hash
} from 'lucide-react';
import type { 
  ReadingConfig, ReadingParagraph, ReadingQuestionItem, ReadingQuestionType 
} from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SkillReadingEditorProps {
  config: ReadingConfig;
  onChange: (updated: ReadingConfig) => void;
}

export const SkillReadingEditor: React.FC<SkillReadingEditorProps> = ({ config, onChange }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [showLivePassagePreview, setShowLivePassagePreview] = useState(false);
  const [previewFontSize, setPreviewFontSize] = useState<number>(16);

  const updateField = <K extends keyof ReadingConfig>(key: K, value: ReadingConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  // Total word count calculated from all paragraphs
  const totalPassageWords = config.paragraphs.reduce((sum, p) => {
    const words = p.content.trim() ? p.content.trim().split(/\s+/).length : 0;
    return sum + words;
  }, 0);

  // Paragraph handlers
  const handleAddParagraph = () => {
    const nextCharCode = 65 + config.paragraphs.length; // A, B, C, D...
    const nextLabel = String.fromCharCode(nextCharCode);
    const newPara: ReadingParagraph = {
      id: `p-${Date.now()}`,
      label: nextLabel,
      title: isVi ? `Tiêu đề đoạn ${nextLabel}` : `Paragraph ${nextLabel} Subheading`,
      content: ''
    };
    updateField('paragraphs', [...config.paragraphs, newPara]);
  };

  const handleUpdateParagraph = (index: number, field: keyof ReadingParagraph, value: string) => {
    const updated = [...config.paragraphs];
    updated[index] = { ...updated[index], [field]: value };
    updateField('paragraphs', updated);
  };

  const handleRemoveParagraph = (index: number) => {
    const updated = config.paragraphs.filter((_, i) => i !== index);
    // Relabel paragraphs to keep A, B, C...
    const relabeled = updated.map((p, i) => ({
      ...p,
      label: String.fromCharCode(65 + i)
    }));
    updateField('paragraphs', relabeled);
  };

  // Question handlers
  const handleAddQuestion = (type: ReadingQuestionType) => {
    const newOrder = config.questions.length + 1;
    let initialOptions: string[] | undefined = undefined;
    let defaultAns = '';

    if (type === 'multiple_choice') {
      initialOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      defaultAns = 'Option A';
    } else if (type === 'true_false_not_given') {
      defaultAns = 'TRUE';
    } else if (type === 'matching_headings') {
      initialOptions = ['i. Historical overview', 'ii. Technical principles', 'iii. Modern applications', 'iv. Future outlook'];
      defaultAns = 'i. Historical overview';
    } else if (type === 'gap_fill') {
      defaultAns = 'key word';
    }

    const newQuestion: ReadingQuestionItem = {
      id: `rq-${Date.now()}`,
      order: newOrder,
      type,
      prompt: isVi ? `Câu hỏi #${newOrder}: Nhập nội dung câu hỏi...` : `Question #${newOrder}: Enter question statement...`,
      options: initialOptions,
      correctAnswer: defaultAns,
      explanation: isVi ? 'Giải thích đáp án dựa vào đoạn văn...' : 'Explanation note...',
      paragraphRef: 'A',
      points: 1,
      wordLimit: type === 'gap_fill' ? 2 : undefined
    };

    updateField('questions', [...config.questions, newQuestion]);
  };

  const handleUpdateQuestion = (index: number, field: keyof ReadingQuestionItem, value: any) => {
    const updated = [...config.questions];
    updated[index] = { ...updated[index], [field]: value };
    updateField('questions', updated);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = config.questions.filter((_, i) => i !== index);
    const reordered = updated.map((q, i) => ({ ...q, order: i + 1 }));
    updateField('questions', reordered);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECTION 1: Reading Passage Management */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Đoạn Văn Đọc Hiểu (Reading Passage Management)' : 'Reading Passage & Structure'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Soạn bài đọc học thuật, phân đoạn [A, B, C...] và định dạng văn bản.' : 'Create academic reading passage with labeled paragraph markers.'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 800, 
              padding: '4px 10px', 
              borderRadius: '6px', 
              backgroundColor: '#dcfce7', 
              color: '#15803d' 
            }}>
              {totalPassageWords} {isVi ? 'từ' : 'words'}
            </span>

            <button 
              type="button" 
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => setShowLivePassagePreview(!showLivePassagePreview)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {showLivePassagePreview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showLivePassagePreview ? (isVi ? 'Đóng xem thử' : 'Hide Preview') : (isVi ? 'Xem thử bài đọc' : 'Preview Passage')}</span>
            </button>
          </div>
        </div>

        {/* Passage Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="edit-form-label">
              {isVi ? 'Tiêu đề bài đọc (Passage Title)' : 'Passage Title'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="text" 
              className="edit-form-input"
              value={config.passageTitle}
              onChange={(e) => updateField('passageTitle', e.target.value)}
              placeholder="THE EVOLUTION OF PRINTING & TYPOGRAPHY"
              style={{ fontWeight: 700 }}
            />
          </div>

          <div>
            <label className="edit-form-label">{isVi ? 'Nguồn trích dẫn (Source Citation)' : 'Source Citation'}</label>
            <input 
              type="text" 
              className="edit-form-input"
              value={config.passageSource}
              onChange={(e) => updateField('passageSource', e.target.value)}
              placeholder="Excerpts from Classical Typography Studies"
            />
          </div>

          <div>
            <label className="edit-form-label">{isVi ? 'Thời gian làm bài' : 'Time Limit'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                className="edit-form-input"
                value={config.timeLimitMinutes}
                onChange={(e) => updateField('timeLimitMinutes', parseInt(e.target.value) || 20)}
                style={{ width: '100px' }}
              />
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {isVi ? 'phút (Chuẩn 1 passage: 20m)' : 'minutes (IELTS 1 passage: 20m)'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Passage Preview (Interactive simulated view) */}
        {showLivePassagePreview && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '20px', 
            borderRadius: '12px', 
            backgroundColor: '#ffffff', 
            border: '2px solid #bbf7d0',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                  {isVi ? 'GIAO DIỆN HỌC VIÊN XEM BÀI ĐỌC (STUDENT READING VIEW)' : 'STUDENT PASSAGE PREVIEW'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary bg-white btn-sm"
                  style={{ padding: '2px 8px', fontSize: '12px' }}
                  onClick={() => setPreviewFontSize(Math.max(13, previewFontSize - 1))}
                >
                  A-
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary bg-white btn-sm"
                  style={{ padding: '2px 8px', fontSize: '12px' }}
                  onClick={() => setPreviewFontSize(Math.min(22, previewFontSize + 1))}
                >
                  A+
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', textAlign: 'center' }}>
              {config.passageTitle || 'Untiled Passage'}
            </h3>
            <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b', textAlign: 'center', margin: '0 0 20px 0' }}>
              {config.passageSource}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {config.paragraphs.map((p) => (
                <div key={p.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="paragraph-badge">PARAGRAPH {p.label}</span>
                    {p.title && <strong style={{ fontSize: '14px', color: '#1e293b' }}>{p.title}</strong>}
                  </div>
                  <p style={{ 
                    fontSize: `${previewFontSize}px`, 
                    lineHeight: '1.7', 
                    color: '#334155', 
                    margin: 0, 
                    textAlign: 'justify' 
                  }}>
                    {p.content || <em>(Chưa có nội dung đoạn văn)</em>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paragraphs Editor List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label className="edit-form-label" style={{ margin: 0 }}>
            {isVi ? `Danh sách các đoạn văn (${config.paragraphs.length} đoạn)` : `Paragraphs List (${config.paragraphs.length})`}
          </label>
          <button 
            type="button" 
            className="btn btn-secondary bg-white btn-sm"
            onClick={handleAddParagraph}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> {isVi ? 'Thêm đoạn văn mới' : 'Add Paragraph'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {config.paragraphs.map((para, idx) => {
            const wordCount = para.content.trim() ? para.content.trim().split(/\s+/).length : 0;
            return (
              <div key={para.id} className="paragraph-block">
                <div className="paragraph-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="paragraph-badge">
                      <Hash size={12} />
                      Đoạn {para.label}
                    </span>
                    <input 
                      type="text" 
                      className="edit-form-input" 
                      style={{ padding: '4px 10px', fontSize: '13px', width: '220px', backgroundColor: '#ffffff' }}
                      value={para.title || ''}
                      onChange={(e) => handleUpdateParagraph(idx, 'title', e.target.value)}
                      placeholder={isVi ? 'Tiêu đề phụ của đoạn (Tùy chọn)' : 'Subheading...'}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {wordCount} {isVi ? 'từ' : 'words'}
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-secondary bg-white btn-sm"
                      style={{ color: '#dc2626', padding: '4px 8px' }}
                      onClick={() => handleRemoveParagraph(idx)}
                      disabled={config.paragraphs.length <= 1}
                      title="Xóa đoạn này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <textarea 
                  className="edit-form-textarea"
                  rows={4}
                  value={para.content}
                  onChange={(e) => handleUpdateParagraph(idx, 'content', e.target.value)}
                  placeholder={isVi ? `Nhập nội dung văn bản cho đoạn ${para.label}...` : `Enter text for Paragraph ${para.label}...`}
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: Reading Questions Builder */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Layers size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Bộ Câu Hỏi & Đáp Án Đúng (Questions & Answer Keys)' : 'Reading Questions & Keys'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Soạn 4 dạng câu hỏi: Trắc nghiệm, True/False/Not Given, Nối tiêu đề và Điền từ.' : 'Configure Multiple Choice, T/F/NG, Matching, and Gap Fill questions.'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => handleAddQuestion('multiple_choice')}
            >
              <Plus size={13} /> {isVi ? '+ Trắc nghiệm (MCQ)' : '+ Multiple Choice'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => handleAddQuestion('true_false_not_given')}
            >
              <Plus size={13} /> True/False/NG
            </button>
            <button 
              type="button" 
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => handleAddQuestion('matching_headings')}
            >
              <Plus size={13} /> {isVi ? '+ Nối tiêu đề' : '+ Headings'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => handleAddQuestion('gap_fill')}
            >
              <Plus size={13} /> {isVi ? '+ Điền từ' : '+ Gap Fill'}
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {config.questions.map((q, qIdx) => (
            <div key={q.id} className="question-builder-item">
              <div className="question-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="question-index-pill">{q.order}</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    backgroundColor: q.type === 'multiple_choice' ? '#eff6ff' : q.type === 'true_false_not_given' ? '#fef3c7' : '#f0fdf4',
                    color: q.type === 'multiple_choice' ? '#2563eb' : q.type === 'true_false_not_given' ? '#d97706' : '#16a34a'
                  }}>
                    {q.type.toUpperCase().replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {isVi ? 'Tham chiếu đoạn: ' : 'Ref: '}
                    <select 
                      value={q.paragraphRef || 'A'}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'paragraphRef', e.target.value)}
                      style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      {config.paragraphs.map(p => (
                        <option key={p.id} value={p.label}>Đoạn {p.label}</option>
                      ))}
                    </select>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <span>{isVi ? 'Điểm:' : 'Score:'}</span>
                    <input 
                      type="number" 
                      value={q.points}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'points', parseFloat(e.target.value) || 1)}
                      style={{ width: '50px', padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary bg-white btn-sm"
                    style={{ color: '#dc2626', padding: '4px 8px' }}
                    onClick={() => handleRemoveQuestion(qIdx)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Question Statement */}
              <div className="edit-form-group">
                <input 
                  type="text" 
                  className="edit-form-input"
                  value={q.prompt}
                  onChange={(e) => handleUpdateQuestion(qIdx, 'prompt', e.target.value)}
                  placeholder="Enter question statement..."
                  style={{ fontWeight: 600 }}
                />
              </div>

              {/* Question Type: Multiple Choice */}
              {q.type === 'multiple_choice' && (
                <div className="edit-form-group">
                  <label className="edit-form-label" style={{ fontSize: '11px' }}>
                    {isVi ? 'Các lựa chọn (Đánh dấu radio vào đáp án đúng)' : 'Options (Select correct radio)'}
                  </label>
                  <div className="question-options-list">
                    {(q.options || ['A', 'B', 'C', 'D']).map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const isCorrect = q.correctAnswer === opt;
                      return (
                        <div key={oIdx} className={`question-option-row ${isCorrect ? 'correct' : ''}`}>
                          <input 
                            type="radio" 
                            name={`correct-${q.id}`}
                            checked={isCorrect}
                            onChange={() => handleUpdateQuestion(qIdx, 'correctAnswer', opt)}
                            style={{ accentColor: '#16a34a' }}
                          />
                          <span style={{ fontWeight: 800, fontSize: '13px', width: '20px' }}>{letter}.</span>
                          <input 
                            type="text" 
                            className="edit-form-input"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(q.options || [])];
                              newOpts[oIdx] = e.target.value;
                              handleUpdateQuestion(qIdx, 'options', newOpts);
                              if (isCorrect) handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value);
                            }}
                            style={{ backgroundColor: '#ffffff', padding: '6px 10px' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question Type: True / False / Not Given */}
              {q.type === 'true_false_not_given' && (
                <div className="edit-form-group">
                  <label className="edit-form-label" style={{ fontSize: '11px' }}>
                    {isVi ? 'Đáp án đúng (Correct Answer)' : 'Correct Option'}
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['TRUE', 'FALSE', 'NOT GIVEN'].map((ans) => (
                      <label 
                        key={ans} 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '6px 14px', 
                          borderRadius: '8px', 
                          backgroundColor: q.correctAnswer === ans ? '#dcfce7' : '#f8fafc',
                          border: q.correctAnswer === ans ? '1px solid #86efac' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        <input 
                          type="radio" 
                          name={`tf-${q.id}`} 
                          value={ans}
                          checked={q.correctAnswer === ans}
                          onChange={() => handleUpdateQuestion(qIdx, 'correctAnswer', ans)}
                        />
                        {ans}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Type: Gap Fill */}
              {q.type === 'gap_fill' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="edit-form-label" style={{ fontSize: '11px' }}>
                      {isVi ? 'Từ/Cụm từ đáp án chính xác' : 'Exact Target Keyword(s)'}
                    </label>
                    <input 
                      type="text" 
                      className="edit-form-input"
                      value={q.correctAnswer}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                      placeholder="e.g. dummy text"
                    />
                  </div>
                  <div>
                    <label className="edit-form-label" style={{ fontSize: '11px' }}>
                      {isVi ? 'Giới hạn số từ (Word limit)' : 'Max Words Limit'}
                    </label>
                    <select 
                      className="edit-form-select"
                      value={q.wordLimit || 2}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'wordLimit', parseInt(e.target.value) || 2)}
                    >
                      <option value="1">NO MORE THAN ONE WORD</option>
                      <option value="2">NO MORE THAN TWO WORDS</option>
                      <option value="3">NO MORE THAN THREE WORDS</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Explanation Note for Student / AI */}
              <div className="edit-form-group" style={{ marginBottom: 0 }}>
                <input 
                  type="text" 
                  className="edit-form-input"
                  style={{ fontSize: '12.5px', color: '#64748b', backgroundColor: '#f8fafc' }}
                  value={q.explanation || ''}
                  onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                  placeholder={isVi ? 'Ghi chú giải thích đáp án (Hiển thị sau khi chấm)...' : 'Answer explanation clue...'}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SkillReadingEditor;
