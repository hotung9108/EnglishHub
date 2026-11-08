import React, { useState } from 'react';
import { 
  X, PenTool, Mic, BookOpen, Headphones, Play, Pause, 
  Clock, Send, Copy, Volume2
} from 'lucide-react';
import type { ExamTemplateItem } from '../../types/exam-bank.types';
import { useLanguage } from '../../contexts/LanguageContext';

interface ExamDetailModalProps {
  exam: ExamTemplateItem;
  onClose: () => void;
  onAssignToClass: (exam: ExamTemplateItem) => void;
  onCloneTemplate: (exam: ExamTemplateItem) => void;
}

export const ExamDetailModal: React.FC<ExamDetailModalProps> = ({ 
  exam, 
  onClose, 
  onAssignToClass, 
  onCloneTemplate 
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'writing':
        return <PenTool size={16} color="var(--eh-skill-writing, #8C5E14)" />;
      case 'speaking':
        return <Mic size={16} color="var(--eh-skill-speaking, #5B21B6)" />;
      case 'reading':
        return <BookOpen size={16} color="var(--eh-skill-reading, #16533D)" />;
      default:
        return <Headphones size={16} color="var(--eh-skill-listening, #1E3A8A)" />;
    }
  };

  return (
    <div className="exam-modal-overlay" onClick={onClose}>
      <div className="exam-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="exam-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="teacher-exam-code-badge">{exam.code}</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {getSkillIcon(exam.skill)}
              <span style={{ 
                fontSize: '12.5px', 
                fontWeight: 700, 
                textTransform: 'uppercase',
                color: exam.skill === 'writing' ? 'var(--eh-skill-writing, #8C5E14)' : exam.skill === 'speaking' ? 'var(--eh-skill-speaking, #5B21B6)' : exam.skill === 'reading' ? 'var(--eh-skill-reading, #16533D)' : 'var(--eh-skill-listening, #1E3A8A)'
              }}>
                {exam.skill}
              </span>
            </div>
            <span className="teacher-exam-source-tag">
              {exam.format}
            </span>
            <span className="teacher-exam-band-pill">
              {exam.targetBand}
            </span>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--eh-text-muted, #9E9589)', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="exam-modal-body">
          <h2 style={{ fontFamily: "var(--eh-font-serif, 'Lora', Georgia, serif)", fontSize: '20px', fontWeight: 700, color: '#262320', margin: '0 0 10px 0', lineHeight: 1.35 }}>
            {exam.title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: '#6B635B', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span>{isVi ? 'Nguồn gốc: ' : 'Source: '}<strong>{exam.source}</strong></span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} style={{ display: 'inline', marginRight: 4 }} />
              {exam.durationMinutes} {isVi ? 'phút' : 'mins'}
            </span>
            <span>•</span>
            <span style={{ fontWeight: 600, color: '#262320' }}>{exam.questionCount}</span>
          </div>

          {/* Content Preview based on Skill */}
          {exam.skill === 'writing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {exam.details.taskType || 'Writing Task'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#334155' }}>
                  {exam.details.prompt}
                </p>
                <div style={{ display: 'flex', gap: '14px', marginTop: '12px', fontSize: '12.5px', color: '#64748b' }}>
                  <span>{isVi ? 'Số từ tối thiểu: ' : 'Min words: '}<strong>{exam.details.minWords || 250} từ</strong></span>
                </div>
              </div>

              {exam.details.rubricsSummary && (
                <div style={{ padding: '14px', backgroundColor: 'var(--eh-primary-subtle, #f2f6f1)', borderRadius: '8px', border: '1px solid var(--eh-primary-border, #c2d9c5)' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--eh-primary, #1B4D3E)', display: 'block', marginBottom: '4px' }}>
                    {isVi ? 'Cấu hình tiêu chí chấm điểm chuẩn:' : 'Official Rubrics:'}
                  </span>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--eh-text-primary, #262320)' }}>
                    {exam.details.rubricsSummary}
                  </p>
                </div>
              )}

              {exam.details.modelAnswerSummary && (
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                    {isVi ? 'Đoạn trích bài mẫu xuất sắc:' : 'Model Answer Excerpt:'}
                  </h4>
                  <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '13px', lineHeight: 1.6, color: '#166534', fontStyle: 'italic' }}>
                    "{exam.details.modelAnswerSummary}"
                  </div>
                </div>
              )}
            </div>
          )}

          {exam.skill === 'speaking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {exam.details.cueCard && (
                <div className="cue-card-container">
                  <div className="cue-card-header">
                    <Mic size={18} />
                    <span>{isVi ? 'Thẻ gợi ý chủ đề Speaking' : 'Candidate Cue Card'}</span>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '17px', fontWeight: 800, color: '#1e293b' }}>
                    {exam.details.cueCard.topic}
                  </h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#713f12' }}>
                    You should say:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#334155', lineHeight: 1.6 }}>
                    {exam.details.cueCard.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '12.5px', color: '#854d0e', fontWeight: 600 }}>
                    <span>{isVi ? 'Chuẩn bị: ' : 'Prep: '}{exam.details.cueCard.prepTimeSeconds}s</span>
                    <span>•</span>
                    <span>{isVi ? 'Nói tối đa: ' : 'Speak: '}{exam.details.cueCard.speakingTimeSeconds}s</span>
                  </div>
                </div>
              )}

              {exam.details.questionsPreview && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {isVi ? 'Câu hỏi thảo luận mở rộng:' : 'Discussion Questions:'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {exam.details.questionsPreview.map((q, idx) => (
                      <div key={q.id} style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <strong>{idx + 1}. {q.prompt}</strong>
                        {q.clue && <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{q.clue}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {exam.skill === 'reading' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {exam.details.passage && (
                <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {exam.details.passage.title}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {exam.details.passage.paragraphs.map((p, i) => (
                      <div key={i}>
                        <span className="paragraph-badge" style={{ marginBottom: 4 }}>PARAGRAPH {p.label}</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', lineHeight: 1.6, color: '#334155' }}>
                          {p.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exam.details.questionsPreview && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {isVi ? `Mẫu câu hỏi kiểm tra (${exam.details.questionsPreview.length} câu đại diện):` : 'Questions Sample:'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {exam.details.questionsPreview.map((q, idx) => (
                      <div key={q.id} style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 2 }}>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>Q{idx + 1}.</span>
                          <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: 4, backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700 }}>{q.type}</span>
                        </div>
                        <span style={{ color: '#0f172a' }}>{q.prompt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {exam.skill === 'listening' && (
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
                        {exam.details.audio?.title || 'Official_Cambridge_Audio.mp3'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {isPlayingAudio ? 'Audio playing preview • 01:25' : `${exam.details.audio?.duration || '30:00'} • 4 Sections`}
                      </span>
                    </div>
                  </div>
                  <Volume2 size={18} color="#94a3b8" />
                </div>
                <div className="audio-waveform-bar">
                  <div className="audio-waveform-fill" style={{ width: isPlayingAudio ? '45%' : '15%', background: '#2dd4bf' }}></div>
                </div>
              </div>

              {exam.details.questionsPreview && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {isVi ? 'Các câu hỏi mẫu kèm mốc thời gian:' : 'Sample Section Questions:'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {exam.details.questionsPreview.map((q, idx) => (
                      <div key={q.id} style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 2 }}>
                          <span style={{ fontWeight: 800, color: '#0d9488' }}>Q{idx + 1}.</span>
                          <span style={{ fontSize: '11px', color: '#0d9488', backgroundColor: '#f0fdfa', padding: '1px 6px', borderRadius: 4 }}>[{q.clue || '01:15'}]</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{q.type}</span>
                        </div>
                        <span style={{ color: '#0f172a' }}>{q.prompt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Topic Tags */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{isVi ? 'Thẻ chủ đề:' : 'Tags:'}</span>
            {exam.tags.map((t, idx) => (
              <span key={idx} className="teacher-exam-source-tag">#{t}</span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="exam-modal-footer">
          <button 
            type="button" 
            className="teacher-exam-btn-preview"
            onClick={onClose}
          >
            {isVi ? 'Đóng' : 'Close'}
          </button>

          <button 
            type="button" 
            className="teacher-exam-btn-preview"
            onClick={() => {
              onClose();
              onCloneTemplate(exam);
            }}
          >
            <Copy size={13} />
            <span>{isVi ? 'Nhân bản & Chỉnh sửa' : 'Customize & Clone'}</span>
          </button>

          <button 
            type="button" 
            className="teacher-exam-btn-primary"
            onClick={() => {
              onClose();
              onAssignToClass(exam);
            }}
          >
            <Send size={13} />
            <span>{isVi ? 'Giao ngay cho lớp' : 'Assign to Class'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamDetailModal;
