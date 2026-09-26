import React, { useState } from 'react';
import { 
  Mic, Play, Pause, Plus, Trash2, Clock, Volume2, 
  Sparkles, CheckCircle, FileText, Music
} from 'lucide-react';
import type { SpeakingConfig, SpeakingQuestionItem } from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SkillSpeakingEditorProps {
  config: SpeakingConfig;
  onChange: (updated: SpeakingConfig) => void;
}

export const SkillSpeakingEditor: React.FC<SkillSpeakingEditorProps> = ({ config, onChange }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const updateField = <K extends keyof SpeakingConfig>(key: K, value: SpeakingConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const updateRubric = (key: keyof SpeakingConfig['rubrics'], val: number) => {
    onChange({
      ...config,
      rubrics: {
        ...config.rubrics,
        [key]: val
      }
    });
  };

  const handleAddBullet = () => {
    updateField('cueCardBullets', [
      ...config.cueCardBullets,
      isVi ? 'Gợi ý mới: Bạn nên nói về...' : 'You should say: What happened...'
    ]);
  };

  const handleUpdateBullet = (index: number, text: string) => {
    const updated = [...config.cueCardBullets];
    updated[index] = text;
    updateField('cueCardBullets', updated);
  };

  const handleRemoveBullet = (index: number) => {
    updateField('cueCardBullets', config.cueCardBullets.filter((_, i) => i !== index));
  };

  const handleAddFollowUp = () => {
    const newQ: SpeakingQuestionItem = {
      id: `sq-${Date.now()}`,
      order: config.followUpQuestions.length + 1,
      question: isVi ? 'Câu hỏi thảo luận thêm: How can this issue be resolved?' : 'Discussion question...',
      hint: isVi ? 'Gợi ý: Đưa ra 2 luận điểm kèm ví dụ thực tế.' : 'Provide 2 points with examples.'
    };
    updateField('followUpQuestions', [...config.followUpQuestions, newQ]);
  };

  const handleUpdateFollowUp = (index: number, field: keyof SpeakingQuestionItem, val: string | number) => {
    const updated = [...config.followUpQuestions];
    updated[index] = { ...updated[index], [field]: val };
    updateField('followUpQuestions', updated);
  };

  const handleRemoveFollowUp = (index: number) => {
    updateField('followUpQuestions', config.followUpQuestions.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECTION 1: Speaking Format & Mode */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
              <Mic size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Cấu Hình Kỹ Năng Nói (Speaking Assignment)' : 'Speaking Mode & Parameters'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Thiết lập phần thi Speaking, thời gian chuẩn bị và thời lượng ghi âm.' : 'Configure speaking parts, preparation time, and recording constraints.'}
              </p>
            </div>
          </div>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            padding: '4px 10px', 
            borderRadius: '6px', 
            backgroundColor: '#faf5ff', 
            color: '#9333ea' 
          }}>
            IELTS Speaking Part 1 / 2 / 3
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="edit-form-label">{isVi ? 'Phần thi Speaking' : 'Speaking Part'}</label>
            <select 
              className="edit-form-select"
              value={config.partType}
              onChange={(e) => updateField('partType', e.target.value as SpeakingConfig['partType'])}
            >
              <option value="part2">IELTS Speaking Part 2 (Cue Card Monologue)</option>
              <option value="part1">IELTS Speaking Part 1 (Short Q&A Interview)</option>
              <option value="part3">IELTS Speaking Part 3 (In-depth Two-way Discussion)</option>
              <option value="full">Full Speaking Mock Test (Part 1 + 2 + 3)</option>
            </select>
          </div>

          <div>
            <label className="edit-form-label">{isVi ? 'Thời gian chuẩn bị (Prep Time)' : 'Preparation Timer'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                className="edit-form-input" 
                value={config.prepTimeSeconds}
                onChange={(e) => updateField('prepTimeSeconds', parseInt(e.target.value) || 0)}
                style={{ width: '100px' }}
              />
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {isVi ? 'giây (Chuẩn IELTS: 60s)' : 'seconds (IELTS: 60s)'}
              </span>
            </div>
          </div>

          <div>
            <label className="edit-form-label">{isVi ? 'Thời lượng nói tối đa' : 'Speaking Max Duration'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number" 
                className="edit-form-input" 
                value={config.speakingTimeSeconds}
                onChange={(e) => updateField('speakingTimeSeconds', parseInt(e.target.value) || 0)}
                style={{ width: '100px' }}
              />
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {isVi ? 'giây (Chuẩn IELTS: 120s)' : 'seconds (IELTS: 120s)'}
              </span>
            </div>
          </div>

          <div>
            <label className="edit-form-label">{isVi ? 'Số lần thu âm lại tối đa' : 'Recording Retries'}</label>
            <select 
              className="edit-form-select"
              value={config.maxRetries}
              onChange={(e) => updateField('maxRetries', parseInt(e.target.value) || 1)}
            >
              <option value="1">1 {isVi ? 'lần (Mô phỏng thi thật)' : 'take (Strict Exam)'}</option>
              <option value="3">3 {isVi ? 'lần (Luyện tập có cải thiện)' : 'takes (Practice Mode)'}</option>
              <option value="999">{isVi ? 'Không giới hạn (Tự do ghi âm)' : 'Unlimited takes'}</option>
            </select>
          </div>
        </div>

        {/* IELTS Cue Card Container */}
        {(config.partType === 'part2' || config.partType === 'full') && (
          <div className="cue-card-container">
            <div className="cue-card-header">
              <FileText size={18} />
              <span>{isVi ? 'Thẻ Đề Bài IELTS Speaking Part 2 (Candidate Cue Card)' : 'Candidate Cue Card Topic'}</span>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label" style={{ color: '#713f12' }}>
                {isVi ? 'Chủ đề chính (Topic Headline)' : 'Topic Headline'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                className="edit-form-input"
                style={{ backgroundColor: '#ffffff', borderColor: '#fde047', fontWeight: 700 }}
                value={config.cueCardTopic}
                onChange={(e) => updateField('cueCardTopic', e.target.value)}
                placeholder="Describe a memorable trip you took or an environmental problem..."
              />
            </div>

            <div className="edit-form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="edit-form-label" style={{ color: '#713f12', margin: 0 }}>
                  {isVi ? 'Các ý gợi ý học viên cần trình bày ("You should say:")' : 'Bullet points ("You should say:")'}
                </label>
                <button 
                  type="button" 
                  className="btn btn-secondary bg-white btn-sm"
                  onClick={handleAddBullet}
                  style={{ padding: '3px 10px', fontSize: '12px' }}
                >
                  <Plus size={13} /> {isVi ? 'Thêm ý gợi ý' : 'Add Point'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {config.cueCardBullets.map((bullet, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#854d0e', width: '18px' }}>•</span>
                    <input 
                      type="text" 
                      className="edit-form-input"
                      style={{ backgroundColor: '#ffffff', borderColor: '#fef08a' }}
                      value={bullet}
                      onChange={(e) => handleUpdateBullet(idx, e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary bg-white btn-sm" 
                      style={{ color: '#dc2626', padding: '6px' }}
                      onClick={() => handleRemoveBullet(idx)}
                      disabled={config.cueCardBullets.length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Audio Model / Examiner Audio Prompt */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#f0fdfa', color: '#0d9488' }}>
              <Music size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Âm Thanh Phát Âm Mẫu / Câu Hỏi Của Giám Khảo' : 'Examiner Audio Prompt & Model Speech'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Tải lên giọng đọc mẫu chuẩn bản ngữ hoặc câu hỏi âm thanh để học viên nghe trước khi trả lời.' : 'Upload native speaker model pronunciation or question audio prompt.'}
              </p>
            </div>
          </div>
        </div>

        {/* Audio Player Mock */}
        <div className="audio-player-mock">
          <div className="audio-player-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                type="button" 
                className="audio-play-btn"
                onClick={() => setIsPlayingSample(!isPlayingSample)}
              >
                {isPlayingSample ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
              </button>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, display: 'block' }}>
                  Examiner_Prompt_Part2_Megacities.mp3
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {isPlayingSample ? 'Playing audio preview • 00:45 / 02:10' : 'Ready to preview • 02:10 duration (Stereo 44.1kHz)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} color="#94a3b8" />
              <div style={{ width: '60px', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}>
                <div style={{ width: '80%', height: '100%', backgroundColor: '#38bdf8', borderRadius: '2px' }}></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', width: '32px' }}>00:45</span>
            <div className="audio-waveform-bar">
              <div className="audio-waveform-fill" style={{ width: isPlayingSample ? '65%' : '35%' }}></div>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8', width: '32px' }}>02:10</span>
          </div>
        </div>

        <div className="edit-form-group">
          <label className="edit-form-label">{isVi ? 'Đường dẫn file Audio hoặc Storage Key' : 'Audio File URL or Key'}</label>
          <input 
            type="text" 
            className="edit-form-input" 
            value={config.examinerSampleAudioUrl || ''}
            onChange={(e) => updateField('examinerSampleAudioUrl', e.target.value)}
            placeholder="https://cdn.englishhub.edu.vn/audio/speaking/sample-hw02.mp3"
          />
        </div>

        <div className="edit-form-group" style={{ marginBottom: 0 }}>
          <label className="edit-form-label">{isVi ? 'Lời thoại giám khảo (Examiner Transcript)' : 'Examiner Transcript'}</label>
          <textarea 
            className="edit-form-textarea" 
            rows={3}
            value={config.examinerTranscript || ''}
            onChange={(e) => updateField('examinerTranscript', e.target.value)}
            placeholder={isVi ? 'Nhập nội dung lời thoại mà giám khảo đọc trong file ghi âm...' : 'Enter spoken transcript...'}
          />
        </div>
      </section>

      {/* SECTION 3: Follow-up Questions (Part 1 & Part 3) */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Clock size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Danh Sách Câu Hỏi Mở Rộng (Discussion Questions)' : 'Follow-up Questions List'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Các câu hỏi tương tác mở rộng theo ngữ cảnh cho Part 1 hoặc Part 3.' : 'Interactive follow-up questions for Part 1/3 discussion.'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary bg-white btn-sm"
            onClick={handleAddFollowUp}
          >
            <Plus size={14} /> {isVi ? 'Thêm câu hỏi' : 'Add Question'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {config.followUpQuestions.map((q, idx) => (
            <div key={q.id} className="question-builder-item">
              <div className="question-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="question-index-pill" style={{ backgroundColor: '#7e22ce' }}>{idx + 1}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {isVi ? `Câu hỏi #${idx + 1}` : `Question #${idx + 1}`}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary bg-white btn-sm"
                  style={{ color: '#dc2626', padding: '4px 8px' }}
                  onClick={() => handleRemoveFollowUp(idx)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="edit-form-group">
                <input 
                  type="text" 
                  className="edit-form-input"
                  value={q.question}
                  onChange={(e) => handleUpdateFollowUp(idx, 'question', e.target.value)}
                  placeholder="Enter question text..."
                />
              </div>

              <div className="edit-form-group" style={{ marginBottom: 0 }}>
                <input 
                  type="text" 
                  className="edit-form-input"
                  style={{ fontSize: '13px', color: '#64748b', backgroundColor: '#f1f5f9' }}
                  value={q.hint || ''}
                  onChange={(e) => handleUpdateFollowUp(idx, 'hint', e.target.value)}
                  placeholder={isVi ? 'Gợi ý câu trả lời hoặc từ vựng hữu ích...' : 'Suggested ideas or hints...'}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: AI Speech Diagnostics & 4 IELTS Rubrics */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Chẩn Đoán Phát Âm AI & Rubric Nói (AI Speech Engine)' : 'AI Speech Diagnostics & Rubrics'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Công nghệ nhận diện âm vị AI (Phonemes) và 4 tiêu chí chấm IELTS Speaking.' : 'Phoneme accuracy analytics and 4 IELTS speaking descriptor weights.'}
              </p>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={config.enableAi}
              onChange={(e) => updateField('enableAi', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#9333ea' }}
            />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
              {isVi ? 'Bật AI Chấm Phát Âm' : 'Enable Speech AI'}
            </span>
          </label>
        </div>

        {config.enableAi && (
          <div className="ai-calibration-card" style={{ borderColor: '#e9d5ff' }}>
            <div className="ai-header-row">
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} color="#9333ea" />
                {isVi ? 'Trọng số 4 tiêu chí chấm Speaking (FC, LR, GRA, PR)' : '4 Speaking Criteria (Total = 100%)'}
              </span>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 800, 
                color: (config.rubrics.fc + config.rubrics.lr + config.rubrics.gra + config.rubrics.pr === 100) ? '#16a34a' : '#dc2626' 
              }}>
                Tổng: {config.rubrics.fc + config.rubrics.lr + config.rubrics.gra + config.rubrics.pr}%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="edit-form-label" style={{ fontSize: '11px' }}>Fluency & Coherence</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    className="edit-form-input" 
                    value={config.rubrics.fc}
                    onChange={(e) => updateRubric('fc', parseInt(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>%</span>
                </div>
              </div>

              <div>
                <label className="edit-form-label" style={{ fontSize: '11px' }}>Lexical Resource</label>
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
                <label className="edit-form-label" style={{ fontSize: '11px' }}>Grammar & Accuracy</label>
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

              <div>
                <label className="edit-form-label" style={{ fontSize: '11px' }}>Pronunciation (PR)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    className="edit-form-input" 
                    value={config.rubrics.pr}
                    onChange={(e) => updateRubric('pr', parseInt(e.target.value) || 0)}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>%</span>
                </div>
              </div>
            </div>

            <div className="edit-form-group" style={{ marginBottom: 0 }}>
              <label className="edit-form-label">
                {isVi ? 'Chỉ thị phát âm cho AI (Pronunciation Detection Focus)' : 'Pronunciation Focus for AI'}
              </label>
              <textarea 
                className="edit-form-textarea"
                rows={3}
                value={config.aiInstruction}
                onChange={(e) => updateField('aiInstruction', e.target.value)}
                placeholder={isVi ? 'Ví dụ: Đánh giá khắt khe nối âm (linking sounds), âm đuôi /s/, /z/, /t/ và trọng âm từ đa âm tiết...' : 'Custom pronunciation focus...'}
                style={{ backgroundColor: '#ffffff' }}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SkillSpeakingEditor;
