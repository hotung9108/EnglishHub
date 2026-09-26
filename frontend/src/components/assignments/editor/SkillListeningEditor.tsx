import React, { useState } from 'react';
import { 
  Headphones, Play, Pause, Plus, Trash2, Volume2, 
  Clock, FileText, AlertTriangle, Layers, Tag
} from 'lucide-react';
import type { 
  ListeningConfig, ListeningQuestionItem, ListeningSectionType 
} from '../../../types/assignment-editor.types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SkillListeningEditorProps {
  config: ListeningConfig;
  onChange: (updated: ListeningConfig) => void;
}

export const SkillListeningEditor: React.FC<SkillListeningEditorProps> = ({ config, onChange }) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const updateField = <K extends keyof ListeningConfig>(key: K, value: ListeningConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleAddQuestion = () => {
    const newOrder = config.questions.length + 1;
    const newQ: ListeningQuestionItem = {
      id: `lq-${Date.now()}`,
      order: newOrder,
      section: config.activeSection,
      type: 'form_completion',
      prompt: isVi ? `Câu hỏi #${newOrder}: Tên địa điểm: [ _____ ]` : `Question #${newOrder}: Location name: [ _____ ]`,
      correctAnswer: 'Central Park',
      acceptableAnswers: ['central park', 'The Central Park'],
      timestampClue: '01:25',
      points: 1
    };
    updateField('questions', [...config.questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, field: keyof ListeningQuestionItem, value: any) => {
    const updated = [...config.questions];
    updated[index] = { ...updated[index], [field]: value };
    updateField('questions', updated);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = config.questions.filter((_, i) => i !== index);
    const reordered = updated.map((q, i) => ({ ...q, order: i + 1 }));
    updateField('questions', reordered);
  };

  const sectionQuestions = config.questions.filter(q => q.section === config.activeSection);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* SECTION 1: Audio Track Management */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#f0fdfa', color: '#0d9488' }}>
              <Headphones size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Quản Lý File Bài Nghe (Audio Track & Playback)' : 'Audio Track Management'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Tải lên file MP3 bài thi nghe, thiết lập số lần phát và thời lượng.' : 'Upload MP3 audio file, configure play limits and audio duration.'}
              </p>
            </div>
          </div>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            padding: '4px 10px', 
            borderRadius: '6px', 
            backgroundColor: '#f0fdfa', 
            color: '#0d9488' 
          }}>
            IELTS Academic Listening
          </span>
        </div>

        {/* Audio Player Box */}
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
                  {config.audioTitle || 'Cambridge_15_Test1_Listening.mp3'}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {isPlayingAudio ? 'Playing track • 04:12 / 30:00' : 'Audio file ready • 30:00 duration (320kbps MP3)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} color="#94a3b8" />
              <div style={{ width: '60px', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}>
                <div style={{ width: '85%', height: '100%', backgroundColor: '#2dd4bf', borderRadius: '2px' }}></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', width: '32px' }}>04:12</span>
            <div className="audio-waveform-bar">
              <div className="audio-waveform-fill" style={{ width: isPlayingAudio ? '52%' : '14%', background: 'linear-gradient(90deg, #2dd4bf 0%, #0d9488 100%)' }}></div>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8', width: '32px' }}>30:00</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="edit-form-label">{isVi ? 'Tên tệp Audio (Audio Title)' : 'Audio Title'}</label>
            <input 
              type="text" 
              className="edit-form-input" 
              value={config.audioTitle}
              onChange={(e) => updateField('audioTitle', e.target.value)}
              placeholder="Cambridge IELTS 15 - Test 1 Listening Audio"
            />
          </div>

          <div>
            <label className="edit-form-label">{isVi ? 'Đường dẫn file Audio / Storage Key' : 'Audio File URL or Key'}</label>
            <input 
              type="text" 
              className="edit-form-input" 
              value={config.audioUrl}
              onChange={(e) => updateField('audioUrl', e.target.value)}
              placeholder="https://cdn.englishhub.edu.vn/audio/listening/cam15-test1.mp3"
            />
          </div>

          <div>
            <label className="edit-form-label">{isVi ? 'Giới hạn số lần nghe' : 'Playback Limit'}</label>
            <select 
              className="edit-form-select"
              value={config.playbackLimit}
              onChange={(e) => updateField('playbackLimit', e.target.value as ListeningConfig['playbackLimit'])}
            >
              <option value="single">{isVi ? '1 lần duy nhất (Chuẩn phòng thi IELTS)' : 'Single Play (Real Exam)'}</option>
              <option value="double">{isVi ? '2 lần (Chế độ luyện tập có gợi ý)' : '2 Plays (Practice Mode)'}</option>
              <option value="unlimited">{isVi ? 'Không giới hạn (Tự do tua)' : 'Unlimited Playback'}</option>
            </select>
          </div>
        </div>
      </section>

      {/* SECTION 2: Transcript with Timestamps */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Nội Dung Transcript Kèm Mốc Thời Gian (Audio Transcript)' : 'Audio Transcript & Timestamp Clues'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Bản ghi lời thoại với các mốc thời gian [01:25] để hỗ trợ AI đối chiếu và học sinh tra cứu sau khi nộp.' : 'Spoken script with timestamp markers for automated verification.'}
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={config.hideTranscriptUntilGraded}
              onChange={(e) => updateField('hideTranscriptUntilGraded', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#0d9488' }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              {isVi ? 'Ẩn Transcript trong lúc làm bài' : 'Hide Script Until Graded'}
            </span>
          </label>
        </div>

        <div className="edit-form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button 
              type="button" 
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => {
                const nowStamp = `\n[02:30] Speaker: `;
                updateField('transcript', config.transcript + nowStamp);
              }}
              style={{ fontSize: '12px' }}
            >
              <Tag size={12} /> {isVi ? '+ Chèn mốc thời gian [02:30]' : '+ Insert Timestamp Marker'}
            </button>
          </div>
          <textarea 
            className="edit-form-textarea" 
            rows={5}
            value={config.transcript}
            onChange={(e) => updateField('transcript', e.target.value)}
            placeholder={isVi ? 'Nhập lời thoại nghe kèm tag mốc thời gian [00:45]... [01:30]...' : 'Paste transcript text with [mm:ss] tags...'}
          />
        </div>
      </section>

      {/* SECTION 3: Section Tabs & Listening Questions */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Layers size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Bộ Câu Hỏi Theo Section (Section Questions Builder)' : 'Section Questions Builder'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Phân loại câu hỏi theo 4 Section chuẩn IELTS và gán mốc thời gian gợi ý.' : 'Organize questions across 4 IELTS listening sections.'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary bg-white btn-sm"
            onClick={handleAddQuestion}
          >
            <Plus size={14} /> {isVi ? 'Thêm câu hỏi mới' : 'Add Question'}
          </button>
        </div>

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'section1', label: isVi ? 'Section 1: Đời sống xã hội' : 'Section 1: Social Context' },
            { id: 'section2', label: isVi ? 'Section 2: Độc thoại đời sống' : 'Section 2: Monologue' },
            { id: 'section3', label: isVi ? 'Section 3: Thảo luận học tập' : 'Section 3: Educational Context' },
            { id: 'section4', label: isVi ? 'Section 4: Bài giảng học thuật' : 'Section 4: Academic Lecture' },
          ].map((sec) => (
            <button 
              key={sec.id}
              type="button"
              className={`teacher-pill ${config.activeSection === sec.id ? 'active' : ''}`}
              style={{
                backgroundColor: config.activeSection === sec.id ? '#0d9488' : undefined,
                borderColor: config.activeSection === sec.id ? '#0d9488' : undefined,
                color: config.activeSection === sec.id ? '#ffffff' : undefined
              }}
              onClick={() => updateField('activeSection', sec.id as ListeningSectionType)}
            >
              {sec.label}
              <span className="teacher-pill-badge" style={{ color: config.activeSection === sec.id ? '#ffffff' : undefined }}>
                {config.questions.filter(q => q.section === sec.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Questions list for active section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sectionQuestions.map((q) => {
            const globalIndex = config.questions.findIndex(item => item.id === q.id);
            return (
              <div key={q.id} className="question-builder-item">
                <div className="question-header-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="question-index-pill" style={{ backgroundColor: '#0d9488' }}>
                      {q.order}
                    </span>
                    <select 
                      className="edit-form-select"
                      style={{ padding: '3px 8px', fontSize: '12px', width: 'auto' }}
                      value={q.type}
                      onChange={(e) => handleUpdateQuestion(globalIndex, 'type', e.target.value)}
                    >
                      <option value="form_completion">Form / Note Completion</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="map_labeling">Map / Plan Labeling</option>
                      <option value="short_answer">Short Answer</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                      <Clock size={13} color="#0d9488" />
                      <span>{isVi ? 'Mốc audio:' : 'Audio clue:'}</span>
                      <input 
                        type="text" 
                        value={q.timestampClue || ''}
                        onChange={(e) => handleUpdateQuestion(globalIndex, 'timestampClue', e.target.value)}
                        placeholder="01:45"
                        style={{ width: '56px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-secondary bg-white btn-sm"
                    style={{ color: '#dc2626', padding: '4px 8px' }}
                    onClick={() => handleRemoveQuestion(globalIndex)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="edit-form-group">
                  <input 
                    type="text" 
                    className="edit-form-input"
                    value={q.prompt}
                    onChange={(e) => handleUpdateQuestion(globalIndex, 'prompt', e.target.value)}
                    placeholder="Enter question text or sentence with blank [ _____ ]..."
                    style={{ fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="edit-form-label" style={{ fontSize: '11px' }}>
                      {isVi ? 'Đáp án đúng chính xác (Correct Answer)' : 'Target Correct Answer'}
                    </label>
                    <input 
                      type="text" 
                      className="edit-form-input"
                      value={q.correctAnswer}
                      onChange={(e) => handleUpdateQuestion(globalIndex, 'correctAnswer', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="edit-form-label" style={{ fontSize: '11px' }}>
                      {isVi ? 'Từ đồng nghĩa/cách viết chấp nhận (Phân tách bằng dấu phẩy)' : 'Acceptable Variants (comma-separated)'}
                    </label>
                    <input 
                      type="text" 
                      className="edit-form-input"
                      value={q.acceptableAnswers?.join(', ') || ''}
                      onChange={(e) => handleUpdateQuestion(globalIndex, 'acceptableAnswers', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="e.g. central park, The Central Park"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {sectionQuestions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
                {isVi ? `Chưa có câu hỏi nào trong ${config.activeSection.toUpperCase()}.` : `No questions in this section yet.`}
              </p>
              <button 
                type="button" 
                className="btn btn-secondary bg-white btn-sm"
                onClick={handleAddQuestion}
              >
                <Plus size={14} /> {isVi ? 'Tạo câu hỏi đầu tiên' : 'Add First Question'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: AI Trap & Distractor Check */}
      <section className="edit-card">
        <div className="edit-card-header">
          <div className="edit-card-header-left">
            <div className="edit-card-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="edit-card-title">
                {isVi ? 'Phát Hiện Bẫy Nghe & Từ Dễ Nhầm Lẫn (AI Distractor Engine)' : 'AI Distractor & Trap Engine'}
              </h2>
              <p className="edit-card-desc">
                {isVi ? 'Tự động kiểm tra các bẫy nghe phổ biến (VD: "fifteen" vs "fifty", sửa đổi ý định của speaker).' : 'Flag phonetic traps, numbers, and speaker self-correction.'}
              </p>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={config.enableAiDistractorCheck}
            onChange={(e) => updateField('enableAiDistractorCheck', e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#0d9488' }}
          />
        </div>

        {config.enableAiDistractorCheck && (
          <div className="edit-form-group" style={{ marginBottom: 0 }}>
            <label className="edit-form-label">
              {isVi ? 'Chỉ thị lưu ý bẫy nghe cho AI' : 'Distractor Rules for AI Checker'}
            </label>
            <textarea 
              className="edit-form-textarea"
              rows={2}
              value={config.aiInstruction}
              onChange={(e) => updateField('aiInstruction', e.target.value)}
              placeholder={isVi ? 'Ví dụ: Cảnh báo học viên khi người nói tự đính chính thông tin (self-correction: "Actually, it is not 14, but 40")...' : 'Custom trap detection rule...'}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export default SkillListeningEditor;
