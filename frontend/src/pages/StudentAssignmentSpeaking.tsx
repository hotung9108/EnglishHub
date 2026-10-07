import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Mic, 
  MicOff, 
  FileText, 
  Eye, 
  Trash2, 
  Send, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Music
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const StudentAssignmentSpeaking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [personalNotes, setPersonalNotes] = useState('');
  const [isNotesSaved, setIsNotesSaved] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(true);
  const [hasPdfScript, setHasPdfScript] = useState(true);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setIsPlaying(false);
    }
  };

  const handleSaveNotes = () => {
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 3000);
  };

  const handleSubmitAssignment = () => {
    setIsSubmitted(true);
    alert(t('studentSpeaking.notesSaved') || 'Bài tập đã được cập nhật thành công!');
  };

  return (
    <div className="speaking-container">
      {/* Breadcrumbs & Navigation */}
      <div className="speaking-breadcrumbs">
        <button 
          className="speaking-back-btn" 
          onClick={() => navigate('/student/assignments')}
          type="button"
        >
          <ArrowLeft size={14} />
          <span>{t('studentSpeaking.backToList')}</span>
        </button>
        <span className="speaking-breadcrumb-divider">/</span>
        <span>{t('studentSpeaking.system')}</span>
        <ChevronRight size={12} className="speaking-breadcrumb-divider" />
        <span 
          className="speaking-breadcrumb-link"
          onClick={() => navigate('/student/classes')}
          role="button"
          tabIndex={0}
        >
          {t('studentSpeaking.myClasses')}
        </span>
        <ChevronRight size={12} className="speaking-breadcrumb-divider" />
        <span className="speaking-breadcrumb-link">ENG-IELTS-6.5A</span>
        <ChevronRight size={12} className="speaking-breadcrumb-divider" />
        <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
          Speaking 1 ({id || 'HW-02'})
        </span>
      </div>

      {/* Task Header Banner */}
      <section className="speaking-header-banner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="speaking-title-group">
            <h1 className="speaking-title">SPEAKING 1: Urban Environment & Pollution</h1>
            <span className="speaking-skill-badge">IELTS Speaking Part 2</span>
          </div>
          <div className="speaking-meta-row">
            <span className="speaking-meta-item">
              <Calendar size={14} color="#ef4444" />
              <strong>Due:</strong> Jan 05, 2026
            </span>
            <span>•</span>
            <span className="speaking-meta-item">
              <Clock size={14} />
              <strong>Posted:</strong> Jan 01, 2026
            </span>
            <span>•</span>
            <span className="speaking-meta-item">
              <strong>Giảng viên:</strong> Cô Trần Thị Mai Lan
            </span>
          </div>
        </div>

        <div>
          {isSubmitted ? (
            <span className="speaking-status-pill submitted">
              <span className="speaking-status-dot"></span>
              {t('studentSpeaking.statusSubmitted')}
            </span>
          ) : (
            <span className="speaking-status-pill draft">
              <span className="speaking-status-dot"></span>
              {t('studentSpeaking.statusDraft')}
            </span>
          )}
        </div>
      </section>

      {/* 2-Column Main Workspace */}
      <div className="speaking-workspace-grid">
        
        {/* Left Column: Prompt, STT, Recorder, Comments */}
        <div className="speaking-column-left">
          
          {/* Card 1: Transcription & Prompt */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                <span className="speaking-card-title-dot"></span>
                TRANSCRIPTION &amp; QUESTION PROMPT
              </h2>
              <span className="speaking-cue-timing">{t('studentSpeaking.prepTime')}</span>
            </div>

            <div className="speaking-card-body">
              {/* Question Cue Card */}
              <div className="speaking-cue-card">
                <div className="speaking-cue-top">
                  <span className="speaking-cue-tag">{t('studentSpeaking.topicCard')}</span>
                  <span className="speaking-cue-timing">Part 2 Cue Card</span>
                </div>
                <h3 className="speaking-cue-question">
                  {t('studentSpeaking.questionPrompt')}
                </h3>
                <div className="speaking-cue-hint-label">{t('studentSpeaking.youShouldSay')}</div>
                <ul className="speaking-cue-list">
                  <li>{t('studentSpeaking.prompt1')}</li>
                  <li>{t('studentSpeaking.prompt2')}</li>
                  <li>{t('studentSpeaking.prompt3')}</li>
                  <li>{t('studentSpeaking.prompt4')}</li>
                </ul>
              </div>

              {/* AI Live STT Transcription Box */}
              <div className="speaking-stt-box">
                <div className="speaking-stt-header">
                  <div className="speaking-stt-badge">
                    <span className="speaking-stt-tag">STT</span>
                    <span>{t('studentSpeaking.transcriptionTitle')}</span>
                  </div>
                  <span className="speaking-confidence-badge">
                    <Sparkles size={14} />
                    {t('studentSpeaking.confidence')}: 98.2%
                  </span>
                </div>

                <div className="speaking-stt-paragraphs">
                  <p>
                    <span className="speaking-stt-timestamp">[00:02 - 00:35]</span>
                    "Today I would like to talk about air pollution, which has become a severe environmental dilemma in my hometown, Hanoi. Over the past decade, rapid urbanization combined with a surge in private vehicular usage has drastically deteriorated our ambient air quality."
                  </p>
                  <p>
                    <span className="speaking-stt-timestamp">[00:36 - 01:14]</span>
                    "The primary catalyst behind this alarming situation is the high concentration of fine particulate matter, specifically PM2.5, emitted by heavy traffic congestion and surrounding industrial zones. Consequently, residents frequently encounter respiratory disorders such as chronic bronchitis."
                  </p>
                  <p>
                    <span className="speaking-stt-timestamp">[01:15 - 01:58]</span>
                    "To mitigate this crisis, I strongly advocate for widespread transition toward renewable public transportation networks, along with stricter emission regulations for industrial manufacturers. Personal initiatives like tree planting in residential communities could also play a substantial role."
                  </p>
                </div>
              </div>

              {/* Speech Recorder & Audio Visualizer Component */}
              <div className="speaking-audio-widget">
                <div className="speaking-audio-content">
                  <div className="speaking-audio-left">
                    <button 
                      className="speaking-play-btn" 
                      onClick={togglePlay}
                      title={isPlaying ? 'Tạm dừng' : 'Phát bản ghi'}
                      type="button"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
                    </button>
                    <div>
                      <div className="speaking-audio-title">{t('studentSpeaking.audioName')}</div>
                      <div className="speaking-audio-meta">{t('studentSpeaking.audioDuration')}</div>
                    </div>
                  </div>

                  {/* Waveform Visualizer */}
                  <div className={`waveform-container ${isPlaying ? 'playing' : ''}`}>
                    <span className="waveform-bar" style={{ height: 12 }}></span>
                    <span className="waveform-bar" style={{ height: 22 }}></span>
                    <span className="waveform-bar" style={{ height: 28 }}></span>
                    <span className="waveform-bar" style={{ height: 16 }}></span>
                    <span className="waveform-bar" style={{ height: 24 }}></span>
                    <span className="waveform-bar" style={{ height: 30 }}></span>
                    <span className="waveform-bar" style={{ height: 18 }}></span>
                    <span className="waveform-bar" style={{ height: 26 }}></span>
                    <span className="waveform-bar" style={{ height: 14 }}></span>
                    <span className="waveform-bar" style={{ height: 20 }}></span>
                    <span className="waveform-bar" style={{ height: 25 }}></span>
                    <span className="waveform-bar" style={{ height: 15 }}></span>
                  </div>

                  {/* Audio Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className={`speaking-action-btn ${isRecording ? 're-record' : ''}`}
                      onClick={toggleRecording}
                      type="button"
                    >
                      {isRecording ? (
                        <>
                          <MicOff size={14} />
                          {t('studentSpeaking.stopRecord')}
                        </>
                      ) : (
                        <>
                          <Mic size={14} />
                          {t('studentSpeaking.startRecord')}
                        </>
                      )}
                    </button>
                    <button 
                      className="speaking-action-btn re-record"
                      onClick={() => alert('Chế độ thu âm lại đã kích hoạt. Bạn có 1 phút chuẩn bị và 2 phút nói.')}
                      type="button"
                    >
                      <RotateCcw size={14} />
                      {t('studentSpeaking.reRecord')}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Card 2: Comments & Instructions */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                <MessageSquare size={16} color="var(--primary)" />
                {t('studentSpeaking.commentsTitle')}
              </h2>
              <span className="speaking-cue-timing">{t('studentSpeaking.commentsSubtitle')}</span>
            </div>

            <div className="speaking-card-body">
              {/* Teacher Guidance Note */}
              <div className="teacher-note-card">
                <div className="teacher-avatar">ML</div>
                <div className="teacher-note-content">
                  <div className="teacher-note-header">
                    <span className="teacher-note-name">{t('studentSpeaking.teacherGuidanceTitle')}</span>
                    <span className="teacher-note-time">01/01/2026 09:30</span>
                  </div>
                  <p className="teacher-note-body">
                    "Các em chú ý ở đề bài Speaking 1 này, tiêu chí <strong>Fluency &amp; Coherence</strong> được chấm rất kỹ. Tránh ngập ngừng lâu quá 3 giây. Nên vận dụng các cụm liên kết như <em>'In terms of...', 'As far as I am concerned...', 'Consequently'</em> để cấu trúc câu trả lời mạch lạc theo đúng khung 2 phút nhé!"
                  </p>
                </div>
              </div>

              {/* Personal Notes Textarea */}
              <div className="speaking-notes-box">
                <label className="speaking-notes-label" htmlFor="personal-notes">
                  {t('studentSpeaking.studentNotesLabel')}
                </label>
                <textarea 
                  id="personal-notes"
                  className="speaking-notes-textarea"
                  rows={4}
                  placeholder={t('studentSpeaking.studentNotesPlaceholder')}
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                />
                <div className="speaking-notes-footer">
                  <span>{t('studentSpeaking.studentNotesNotice')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isNotesSaved && (
                      <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                        ✓ {t('studentSpeaking.notesSaved')}
                      </span>
                    )}
                    <button 
                      className="speaking-btn-link"
                      onClick={handleSaveNotes}
                      type="button"
                    >
                      {t('studentSpeaking.btnSaveNotes')}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Right Column: Submission & Grading */}
        <div className="speaking-column-right">
          
          {/* Card 1: Your Submission */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                {t('studentSpeaking.yourSubmission')}
              </h2>
              <span className="speaking-status-pill submitted">
                {t('studentSpeaking.statusSubmitted')}
              </span>
            </div>

            <div className="speaking-card-body">
              {/* PDF Script Attachment */}
              {hasPdfScript && (
                <div className="submission-file-box">
                  <div className="submission-file-icon">
                    <FileText size={20} />
                    <span>PDF</span>
                  </div>
                  <div className="submission-file-details">
                    <div className="submission-file-name" title="Speaking_Task1_Script.pdf">
                      Speaking_Task1_Script.pdf
                    </div>
                    <div className="submission-file-meta">{t('studentSpeaking.uploadedByUser')}</div>
                    <div className="submission-file-actions">
                      <span className="submission-file-size">1.4 MB</span>
                      <button 
                        className="speaking-btn-link" 
                        onClick={() => alert('Mở xem trước file PDF dàn ý!')}
                        type="button"
                      >
                        <Eye size={12} style={{ display: 'inline', marginRight: 2 }} />
                        {t('studentSpeaking.preview')}
                      </button>
                    </div>
                  </div>
                  <button 
                    className="submission-remove-btn" 
                    onClick={() => setHasPdfScript(false)}
                    title="Xóa tệp này"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Audio Attachment Box */}
              <div className="audio-attachment-box">
                <div className="audio-attachment-icon">
                  <Music size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="submission-file-name" title="speaking_audio_v1.mp3">
                    speaking_audio_v1.mp3
                  </div>
                  <div className="submission-file-meta">2.8 MB • Audio/Mpeg</div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>
                  <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Đã tải lên
                </span>
              </div>

              {/* Submit CTA */}
              <button 
                className="btn-submit-speaking"
                onClick={handleSubmitAssignment}
                type="button"
              >
                <Send size={16} />
                {t('studentSpeaking.btnSubmitAssignment')}
              </button>

              <div className="speaking-submit-note">
                {t('studentSpeaking.submitNote')}
              </div>
            </div>
          </section>

          {/* Card 2: Grading */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                {t('studentSpeaking.gradingTitle')}
              </h2>
              <span className="speaking-cue-timing">{t('studentSpeaking.gradingScale')}</span>
            </div>

            <div className="speaking-card-body" style={{ gap: '12px' }}>
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.totalPoints')}</span>
                <span className="grading-val-total">100</span>
              </div>

              {/* Criteria breakdown */}
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.criteriaPronunciation')}</span>
                <span style={{ fontWeight: 600 }}>25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.criteriaFluency')}</span>
                <span style={{ fontWeight: 600 }}>25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.criteriaLexical')}</span>
                <span style={{ fontWeight: 600 }}>25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.criteriaGrammar')}</span>
                <span style={{ fontWeight: 600 }}>25%</span>
              </div>

              {/* Current Score Display */}
              <div className="grading-current-grade">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>
                    {t('studentSpeaking.currentGrade')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                    {t('studentSpeaking.pendingGrade')}
                  </div>
                </div>
                <div className="grading-score-display">-- / 100</div>
              </div>

              {/* Evaluator Profile */}
              <div className="evaluator-profile-box">
                <div className="evaluator-avatar">ML</div>
                <div>
                  <div className="evaluator-role">{t('studentSpeaking.evaluatorTitle')}</div>
                  <div className="evaluator-name">{t('studentSpeaking.evaluatorName')}</div>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};

export default StudentAssignmentSpeaking;
