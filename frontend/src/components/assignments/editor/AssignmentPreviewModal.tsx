import React, { useState } from 'react';
import { X, Mic } from 'lucide-react';
import type { 
  AssignmentEditorData, 
  WritingConfig, 
  SpeakingConfig, 
  ReadingConfig, 
  ListeningConfig 
} from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface AssignmentPreviewModalProps {
  data: AssignmentEditorData;
  onClose: () => void;
}

export const AssignmentPreviewModal: React.FC<AssignmentPreviewModalProps> = ({ data, onClose }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Multi-module preview selection
  const [selectedModuleIdx, setSelectedModuleIdx] = useState<number>(0);

  // Preview interactive state
  const [essayContent, setEssayContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recordedSeconds = 0;
  const [activeAnswers, setActiveAnswers] = useState<Record<string, string>>({});

  const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).length : 0;

  const handleSelectAnswer = (qId: string, val: string) => {
    setActiveAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const hasModules = Array.isArray(data.modules) && data.modules.length > 0;
  const activeModule = hasModules ? (data.modules[selectedModuleIdx] || data.modules[0]) : null;
  const activeSkill = activeModule ? activeModule.skill : data.skill;

  const writingConfig: WritingConfig = (activeSkill === 'writing' && activeModule
    ? activeModule.config
    : data.writing) as WritingConfig;

  const speakingConfig: SpeakingConfig = (activeSkill === 'speaking' && activeModule
    ? activeModule.config
    : data.speaking) as SpeakingConfig;

  const readingConfig: ReadingConfig = (activeSkill === 'reading' && activeModule
    ? activeModule.config
    : data.reading) as ReadingConfig;

  const listeningConfig: ListeningConfig = (activeSkill === 'listening' && activeModule
    ? activeModule.config
    : data.listening) as ListeningConfig;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="preview-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 800, 
              padding: '3px 8px', 
              borderRadius: '4px', 
              backgroundColor: '#0f172a', 
              color: '#ffffff' 
            }}>
              {data.code}
            </span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              padding: '2px 10px', 
              borderRadius: '12px', 
              backgroundColor: 'var(--eh-primary-light, #EAF0E8)', 
              color: 'var(--eh-primary, #1B4D3E)' 
            }}>
              {isVi ? 'GIAO DIỆN HỌC VIÊN LÀM BÀI (PREVIEW)' : 'STUDENT EXAM PREVIEW'}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--eh-text-primary, #1e293b)' }}>
              {data.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {data.className}
            </span>
            <button 
              type="button" 
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Multi-module tabs switcher */}
        {hasModules && data.modules.length > 1 && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            padding: '10px 20px', 
            borderBottom: '1px solid var(--eh-border, #e2e8f0)', 
            overflowX: 'auto', 
            backgroundColor: 'var(--eh-canvas, #f8fafc)' 
          }}>
            {data.modules.map((m, idx) => (
              <button
                key={m.id || idx}
                type="button"
                onClick={() => setSelectedModuleIdx(idx)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: idx === selectedModuleIdx ? '1px solid var(--eh-primary, #1B4D3E)' : '1px solid var(--eh-border, #cbd5e1)',
                  backgroundColor: idx === selectedModuleIdx ? 'var(--eh-primary, #1B4D3E)' : 'var(--eh-surface, #ffffff)',
                  color: idx === selectedModuleIdx ? '#ffffff' : 'var(--eh-text-primary, #475569)',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {idx + 1}. {m.skill.toUpperCase()}{m.title ? ` • ${m.title}` : ''}
              </button>
            ))}
          </div>
        )}

        {/* Modal Content - Depends on active skill */}
        <div className="preview-modal-body">
          {/* WRITING PREVIEW */}
          {activeSkill === 'writing' && writingConfig && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '18px', backgroundColor: 'var(--eh-canvas, #f8fafc)', borderRadius: '10px', border: '1px solid var(--eh-border, #e2e8f0)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: 'var(--eh-text-primary, #0f172a)' }}>
                  {isVi ? 'Đề Bài Viết' : 'Writing Prompt'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--eh-text-secondary, #334155)' }}>
                  {writingConfig.promptText}
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12.5px', color: '#64748b' }}>
                  <span>{isVi ? 'Yêu cầu tối thiểu:' : 'Min requirement:'} <strong>{writingConfig.minWords} {isVi ? 'từ' : 'words'}</strong></span>
                  <span>{isVi ? 'Hạn nộp:' : 'Deadline:'} <strong>{data.dueDate}</strong></span>
                </div>
              </div>

              {writingConfig.chartImageUrl && (
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--eh-surface, #ffffff)', borderRadius: '8px', border: '1px solid var(--eh-border, #e2e8f0)' }}>
                  <img src={writingConfig.chartImageUrl} alt="Chart" style={{ maxWidth: '400px', height: 'auto', borderRadius: '6px' }} />
                </div>
              )}

              {/* Student Essay Editor Simulator */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--eh-text-primary, #1e293b)' }}>
                    {isVi ? 'Bài Làm Của Học Viên (Mô Phỏng Trực Tiếp)' : 'Student Essay Response Simulator'}
                  </label>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: wordCount >= writingConfig.minWords ? '#16a34a' : '#d97706' 
                  }}>
                    {wordCount} / {writingConfig.minWords} {isVi ? 'từ' : 'words'}
                  </span>
                </div>

                <textarea
                  rows={8}
                  className="edit-form-textarea"
                  style={{ width: '100%', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.6 }}
                  placeholder={isVi ? "Nhập bài văn trả lời thử nghiệm tại đây..." : "Type sample essay response here..."}
                  value={essayContent}
                  onChange={(e) => setEssayContent(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SPEAKING PREVIEW */}
          {activeSkill === 'speaking' && speakingConfig && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="cue-card-container">
                <div className="cue-card-badge">
                  {speakingConfig.partType === 'part1' ? 'IELTS Speaking Part 1' : speakingConfig.partType === 'part3' ? 'IELTS Speaking Part 3' : 'IELTS Speaking Part 2'}
                </div>
                <h3 className="cue-card-topic">
                  {speakingConfig.cueCardTopic || speakingConfig.promptText || (isVi ? 'Chủ đề thi nói chưa có nội dung' : 'No speaking topic prompt')}
                </h3>

                {speakingConfig.cueCardBullets && speakingConfig.cueCardBullets.length > 0 && (
                  <div className="cue-card-points">
                    <span className="cue-card-points-label">
                      {isVi ? 'Bạn nên trình bày về:' : 'You should say:'}
                    </span>
                    <ul className="cue-card-list">
                      {speakingConfig.cueCardBullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Speaking Simulator */}
              <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--eh-canvas, #f8fafc)', borderRadius: '12px', border: '1px dashed var(--eh-border, #cbd5e1)' }}>
                <button
                  type="button"
                  onClick={() => setIsRecording(!isRecording)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '30px',
                    backgroundColor: isRecording ? '#ef4444' : 'var(--eh-primary, #1B4D3E)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <Mic size={18} />
                  <span>{isRecording ? (isVi ? `Đang ghi âm (${recordedSeconds}s)...` : `Recording (${recordedSeconds}s)...`) : (isVi ? 'Bấm để ghi âm thử' : 'Test Recording')}</span>
                </button>
              </div>
            </div>
          )}

          {/* READING PREVIEW */}
          {activeSkill === 'reading' && readingConfig && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Passage text block */}
              <div style={{ padding: '20px', backgroundColor: 'var(--eh-canvas, #f8fafc)', borderRadius: '10px', border: '1px solid var(--eh-border, #e2e8f0)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: 'var(--eh-text-primary, #0f172a)' }}>
                  {readingConfig.passageTitle || (isVi ? 'Bài đọc chưa có tiêu đề' : 'Untitled Passage')}
                </h3>
                <div style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--eh-text-secondary, #334155)', whiteSpace: 'pre-line' }}>
                  {readingConfig.passageContent 
                    || readingConfig.paragraphs?.map(p => p.content).join('\n\n') 
                    || (isVi ? 'Chưa có nội dung văn bản bài đọc...' : 'No passage content...')}
                </div>
              </div>

              {/* Questions list */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: 'var(--eh-text-primary, #0f172a)' }}>
                  {isVi ? `Bộ câu hỏi (${readingConfig.questions.length} câu):` : `Questions (${readingConfig.questions.length}):`}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {readingConfig.questions.map((q) => (
                    <div key={q.id} style={{ padding: '12px', backgroundColor: 'var(--eh-surface, #ffffff)', borderRadius: '8px', border: '1px solid var(--eh-border, #e2e8f0)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--eh-primary, #1B4D3E)' }}>Q{q.order}.</span>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--eh-text-primary, #0f172a)' }}>{q.prompt}</span>
                      </div>

                      {q.type === 'multiple_choice' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                          {(q.options || []).map((opt, i) => (
                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer', color: 'var(--eh-text-secondary, #334155)' }}>
                              <input 
                                type="radio" 
                                name={`prev-q-${q.id}`} 
                                checked={activeAnswers[q.id] === opt}
                                onChange={() => handleSelectAnswer(q.id, opt)}
                              />
                              <strong style={{ minWidth: '16px' }}>{String.fromCharCode(65 + i)}.</strong>
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          className="edit-form-input" 
                          style={{ padding: '6px 10px', fontSize: '13px', maxWidth: '300px' }}
                          placeholder={isVi ? "Nhập câu trả lời..." : "Enter your answer..."}
                          value={activeAnswers[q.id] || ''}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LISTENING PREVIEW */}
          {activeSkill === 'listening' && listeningConfig && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--eh-canvas, #f8fafc)', borderRadius: '10px', border: '1px solid var(--eh-border, #e2e8f0)' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  {isVi ? 'Trình phát âm thanh bài nghe' : 'Audio Player'}
                </span>
                {(listeningConfig.audioPreviewUrl || listeningConfig.audioUrl) ? (
                  <audio controls src={listeningConfig.audioPreviewUrl || listeningConfig.audioUrl} style={{ width: '100%' }} />
                ) : (
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    {isVi ? 'Chưa chọn tệp âm thanh nghe.' : 'No audio file uploaded.'}
                  </span>
                )}
              </div>

              {listeningConfig.transcript && (
                <div style={{ padding: '14px 16px', backgroundColor: 'var(--eh-surface, #ffffff)', borderRadius: '10px', border: '1px solid var(--eh-border, #e2e8f0)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    {isVi ? 'Văn bản Transcript (Giáo viên xem trước)' : 'Audio Transcript (Teacher Preview)'}
                  </span>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--eh-text-secondary, #334155)', whiteSpace: 'pre-line' }}>
                    {listeningConfig.transcript}
                  </p>
                </div>
              )}

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: 'var(--eh-text-primary, #0f172a)' }}>
                  {isVi ? `Danh sách câu hỏi (${listeningConfig.questions.length} câu):` : `Questions (${listeningConfig.questions.length}):`}
                </h4>
                {listeningConfig.questions.map(q => (
                  <div key={q.id} style={{ padding: '14px', backgroundColor: 'var(--eh-surface, #ffffff)', borderRadius: '8px', border: '1px solid var(--eh-border, #e2e8f0)', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0d9488' }}>Q{q.order}.</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--eh-text-primary, #0f172a)' }}>{q.prompt}</span>
                    </div>

                    {q.type === 'multiple_choice' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        {(q.options || []).map((opt, i) => (
                          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer', color: 'var(--eh-text-secondary, #334155)' }}>
                            <input 
                              type="radio" 
                              name={`prev-list-${q.id}`} 
                              checked={activeAnswers[q.id] === opt}
                              onChange={() => handleSelectAnswer(q.id, opt)}
                            />
                            <strong style={{ minWidth: '16px' }}>{String.fromCharCode(65 + i)}.</strong>
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        className="edit-form-input" 
                        style={{ padding: '6px 10px', fontSize: '13px', maxWidth: '340px' }}
                        placeholder={isVi ? "Nhập câu trả lời..." : "Enter your answer..."}
                        value={activeAnswers[q.id] || ''}
                        onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 24px', backgroundColor: 'var(--eh-canvas, #f8fafc)', borderTop: '1px solid var(--eh-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary bg-white btn-sm" onClick={onClose}>
            {isVi ? 'Đóng xem thử' : 'Close Preview'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPreviewModal;
