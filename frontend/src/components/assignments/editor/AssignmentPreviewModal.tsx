import React, { useState } from 'react';
import { X, Play, Pause, Mic } from 'lucide-react';
import type { AssignmentEditorData } from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface AssignmentPreviewModalProps {
  data: AssignmentEditorData;
  onClose: () => void;
}

export const AssignmentPreviewModal: React.FC<AssignmentPreviewModalProps> = ({ data, onClose }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Preview interactive state
  const [essayContent, setEssayContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [activeAnswers, setActiveAnswers] = useState<Record<string, string>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).length : 0;

  const handleSelectAnswer = (qId: string, val: string) => {
    setActiveAnswers(prev => ({ ...prev, [qId]: val }));
  };

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
              backgroundColor: '#eff6ff', 
              color: '#2563eb' 
            }}>
              {isVi ? 'GIAO DIỆN HỌC VIÊN LÀM BÀI (STUDENT VIEW PREVIEW)' : 'STUDENT EXAM RUNNER PREVIEW'}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
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

        {/* Modal Content - Depends on selected skill */}
        <div className="preview-modal-body">
          {/* WRITING PREVIEW */}
          {data.skill === 'writing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  {data.writing.taskType === 'task2' ? 'IELTS Writing Task 2' : 'IELTS Writing Task 1'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#334155' }}>
                  {data.writing.promptText}
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12.5px', color: '#64748b' }}>
                  <span>{isVi ? 'Yêu cầu tối thiểu:' : 'Min requirement:'} <strong>{data.writing.minWords} {isVi ? 'từ' : 'words'}</strong></span>
                  <span>{isVi ? 'Hạn nộp:' : 'Deadline:'} <strong>{data.dueDate}</strong></span>
                </div>
              </div>

              {data.writing.chartImageUrl && (
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img src={data.writing.chartImageUrl} alt="Chart" style={{ maxWidth: '400px', height: 'auto', borderRadius: '6px' }} />
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                    {isVi ? 'Phần bài làm của học viên (Student Essay Textarea):' : 'Student Essay Box:'}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: wordCount >= data.writing.minWords ? '#16a34a' : '#d97706' 
                  }}>
                    {wordCount} / {data.writing.minWords} {isVi ? 'từ' : 'words'}
                  </span>
                </div>
                <textarea 
                  rows={8}
                  className="edit-form-textarea"
                  style={{ backgroundColor: '#ffffff', border: '2px solid #cbd5e1' }}
                  value={essayContent}
                  onChange={(e) => setEssayContent(e.target.value)}
                  placeholder={isVi ? 'Học viên sẽ gõ bài luận trực tiếp tại đây...' : 'Student will type here...'}
                />
              </div>
            </div>
          )}

          {/* SPEAKING PREVIEW */}
          {data.skill === 'speaking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="cue-card-container">
                <div className="cue-card-header">
                  <Mic size={18} />
                  <span>{isVi ? 'ĐỀ BÀI IELTS SPEAKING' : 'IELTS SPEAKING PROMPT'}</span>
                </div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                  {data.speaking.cueCardTopic}
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#713f12' }}>
                  You should say:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                  {data.speaking.cueCardBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              {/* Examiner Audio Prompt Preview */}
              {data.speaking.examinerTranscript && (
                <div style={{ padding: '16px', backgroundColor: '#f0fdfa', borderRadius: '10px', border: '1px solid #99f6e4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Play size={14} color="#0d9488" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e' }}>
                      {isVi ? 'Lời dặn của Giám khảo:' : 'Examiner Speech:'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#134e4a', fontStyle: 'italic' }}>
                    "{data.speaking.examinerTranscript}"
                  </p>
                </div>
              )}

              {/* Recording Mock Controls */}
              <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: isRecording ? '#dc2626' : '#7e22ce' }}>
                    {isRecording ? `00:${recordedSeconds.toString().padStart(2, '0')}` : '00:00'}
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {isVi ? `Thời lượng tối đa: ${data.speaking.speakingTimeSeconds}s` : `Max duration: ${data.speaking.speakingTimeSeconds}s`}
                  </span>
                </div>

                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ 
                    backgroundColor: isRecording ? '#dc2626' : '#7e22ce',
                    padding: '10px 24px',
                    borderRadius: '24px'
                  }}
                  onClick={() => {
                    setIsRecording(!isRecording);
                    if (!isRecording) setRecordedSeconds(12);
                  }}
                >
                  <Mic size={16} />
                  <span>{isRecording ? (isVi ? 'Dừng thu âm' : 'Stop Recording') : (isVi ? 'Bắt đầu thu âm' : 'Start Recording')}</span>
                </button>
              </div>
            </div>
          )}

          {/* READING PREVIEW */}
          {data.skill === 'reading' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left Column: Passage */}
              <div style={{ padding: '18px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  {data.reading.passageTitle}
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', fontStyle: 'italic', color: '#64748b' }}>
                  {data.reading.passageSource}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.reading.paragraphs.map(p => (
                    <div key={p.id}>
                      <span className="paragraph-badge" style={{ marginBottom: '4px' }}>PARAGRAPH {p.label}</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', lineHeight: 1.6, color: '#334155' }}>
                        {p.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Questions */}
              <div style={{ padding: '18px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                  {isVi ? `Bộ câu hỏi (${data.reading.questions.length} câu):` : `Questions (${data.reading.questions.length}):`}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.reading.questions.map((q) => (
                    <div key={q.id} style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb' }}>Q{q.order}.</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{q.prompt}</span>
                      </div>

                      {q.type === 'multiple_choice' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                          {(q.options || []).map((opt, i) => (
                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                              <input 
                                type="radio" 
                                name={`prev-${q.id}`} 
                                checked={activeAnswers[q.id] === opt}
                                onChange={() => handleSelectAnswer(q.id, opt)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'true_false_not_given' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          {['TRUE', 'FALSE', 'NOT GIVEN'].map((ans) => (
                            <button
                              key={ans}
                              type="button"
                              className="btn btn-secondary bg-white btn-sm"
                              style={{ 
                                fontSize: '11px', 
                                padding: '3px 8px',
                                backgroundColor: activeAnswers[q.id] === ans ? '#dcfce7' : '#ffffff',
                                borderColor: activeAnswers[q.id] === ans ? '#16a34a' : undefined
                              }}
                              onClick={() => handleSelectAnswer(q.id, ans)}
                            >
                              {ans}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'gap_fill' && (
                        <div style={{ marginTop: '6px' }}>
                          <input 
                            type="text" 
                            className="edit-form-input" 
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            placeholder="Type answer here..."
                            value={activeAnswers[q.id] || ''}
                            onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LISTENING PREVIEW */}
          {data.skill === 'listening' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="audio-player-mock">
                <div className="audio-player-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      type="button" 
                      className="audio-play-btn"
                      style={{ backgroundColor: '#0d9488' }}
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    >
                      {isPlayingAudio ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                    </button>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 700, display: 'block' }}>
                        {data.listening.audioTitle}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {isPlayingAudio ? 'Audio playing... • 01:25 / 30:00' : 'Audio paused • 30:00'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="audio-waveform-bar">
                  <div className="audio-waveform-fill" style={{ width: isPlayingAudio ? '45%' : '10%', background: '#2dd4bf' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {isVi ? 'Câu hỏi điền từ & trắc nghiệm:' : 'Questions:'}
                </h4>
                {data.listening.questions.map(q => (
                  <div key={q.id} style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0d9488' }}>Q{q.order}.</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{q.prompt}</span>
                      {q.timestampClue && (
                        <span style={{ fontSize: '11px', color: '#0d9488', backgroundColor: '#f0fdfa', padding: '1px 6px', borderRadius: '4px' }}>
                          [{q.timestampClue}]
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      className="edit-form-input" 
                      style={{ padding: '5px 10px', fontSize: '13px', maxWidth: '300px' }}
                      placeholder="Student enters answer..."
                      value={activeAnswers[q.id] || ''}
                      onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary bg-white btn-sm" onClick={onClose}>
            {isVi ? 'Đóng xem thử' : 'Close Preview'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPreviewModal;
