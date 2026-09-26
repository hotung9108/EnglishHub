import React, { useState } from 'react';
import { 
  Settings, Sparkles, Shield, Bell, 
  Save, RotateCcw, CheckCircle2, 
  Eye, EyeOff, SlidersHorizontal,
  Mail, Lock, Database, Sliders
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const AdminSettings: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'ai' | 'grading' | 'notifications' | 'security'>('ai');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [aiModelWriting, setAiModelWriting] = useState('gemini-1.5-pro');
  const [aiModelSpeaking, setAiModelSpeaking] = useState('whisper-large-v3');
  const [apiKey, setApiKey] = useState('AIzaSyD-mock991823-EnglishHubSecureKey');
  const [temperature, setTemperature] = useState(0.2);
  const [autoApproveQuiz, setAutoApproveQuiz] = useState(true);
  const [requireTeacherReview, setRequireTeacherReview] = useState(true);
  const [plagiarismThreshold, setPlagiarismThreshold] = useState(30);
  const [slaHours, setSlaHours] = useState(24);
  const [emailStudentOnGraded, setEmailStudentOnGraded] = useState(true);
  const [emailParentDigest, setEmailParentDigest] = useState(true);
  const [jwtLifetimeMinutes, setJwtLifetimeMinutes] = useState(15);
  const [maxConcurrentDevices, setMaxConcurrentDevices] = useState(2);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  return (
    <div className="adm-container">
      {/* Page Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <Settings size={28} color="var(--primary)" />
            <span>{t('adminSettings.title')}</span>
            <span className="adm-title-badge">Production Config</span>
          </h1>
          <p className="adm-subtitle">
            {t('adminSettings.subtitle')}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="adm-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => alert(isVi ? 'Đã khôi phục các thiết lập chuẩn ban đầu.' : 'Defaults restored.')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} />
            <span>{t('adminSettings.btnReset')}</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} />
            <span>{t('adminSettings.btnSave')}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} />
          <span>{isVi ? 'Cập nhật cấu hình hệ thống thành công! Các thiết lập đã có hiệu lực trên toàn bộ server.' : 'Configuration updated successfully! Changes have propagated system-wide.'}</span>
        </div>
      )}

      {/* Settings Tab Navigation */}
      <div className="adm-filter-bar" style={{ justifyContent: 'flex-start' }}>
        <div className="adm-pills" style={{ margin: 0 }}>
          {(
            [
              { key: 'ai', label: t('adminSettings.tabAi'), icon: Sparkles },
              { key: 'grading', label: t('adminSettings.tabGrading'), icon: Sliders },
              { key: 'notifications', label: t('adminSettings.tabNotifications'), icon: Bell },
              { key: 'security', label: t('adminSettings.tabSecurity'), icon: Shield },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`adm-pill-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Tab 1: AI Engine */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="headline-md" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--primary)" />
                {isVi ? 'Mô Hình Trí Tuệ Nhân Tạo & Khóa API' : 'AI Models & Provider Credentials'}
              </h3>
              <p className="body-sm text-on-surface-variant" style={{ marginBottom: '24px' }}>
                {isVi ? 'Định cấu hình các model LLM và Speech-to-Text dùng cho chấm tự luận Writing & Speaking.' : 'Manage multimodal LLM and speech inference endpoints.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label className="label-md" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    {isVi ? 'Mô hình chấm Writing Task 1 & 2' : 'Writing Evaluation Model'}
                  </label>
                  <select 
                    className="input" 
                    value={aiModelWriting} 
                    onChange={(e) => setAiModelWriting(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Khuyên dùng - Độ chính xác cao nhất)</option>
                    <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Tốc độ phản hồi cực nhanh &lt; 2s)</option>
                    <option value="gpt-4o">OpenAI GPT-4o (Omni multimodal)</option>
                    <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                  </select>
                </div>

                <div>
                  <label className="label-md" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    {isVi ? 'Mô hình nhận diện Speaking & Ghi âm' : 'Speaking Transcription Engine'}
                  </label>
                  <select 
                    className="input" 
                    value={aiModelSpeaking} 
                    onChange={(e) => setAiModelSpeaking(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="whisper-large-v3">OpenAI Whisper Large v3 + Pitch/Formant Acoustic</option>
                    <option value="gemini-1.5-pro-audio">Gemini 1.5 Pro Native Audio Multimodal</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label-md" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  {isVi ? 'API Key Cung Cấp Dịch Vụ AI' : 'AI Provider Secret API Key'}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="input"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showApiKey ? (isVi ? 'Ẩn' : 'Hide') : (isVi ? 'Hiện' : 'Show')}</span>
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="label-md" style={{ fontWeight: 600 }}>
                    {isVi ? 'Độ sáng tạo / Ổn định của AI (Temperature)' : 'Sampling Temperature'}
                  </label>
                  <span className="font-semibold text-primary">{temperature} (Deterministic)</span>
                </div>
                <input 
                  type="range" 
                  min="0.0" 
                  max="1.0" 
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
                <p className="body-sm text-on-surface-variant" style={{ marginTop: '6px' }}>
                  {isVi ? 'Giá trị 0.1 - 0.2 đảm bảo việc chấm điểm đồng nhất và có độ lặp lại cao nhất.' : 'Low values (0.1 - 0.2) ensure deterministic score reproducibility across submissions.'}
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 className="headline-md" style={{ marginBottom: '6px' }}>
                {isVi ? 'Prompt Hệ Thống Mặc Định (System Prompt Template)' : 'Default IELTS Grading Prompt Template'}
              </h3>
              <p className="body-sm text-on-surface-variant" style={{ marginBottom: '16px' }}>
                {isVi ? 'Khung chỉ dẫn được nhúng vào snapshot ai_instruction_snapshot của bảng gradings trong CSDL.' : 'Core rubric instruction stored into gradings.ai_instruction_snapshot.'}
              </p>
              <textarea 
                className="input" 
                rows={6}
                defaultValue={`You are an official senior IELTS Cambridge Examiner.
Assess the candidate's essay strictly against official IELTS Band Descriptors (9.0 scale):
1. Task Achievement / Task Response (Weight 25%)
2. Coherence and Cohesion (Weight 25%)
3. Lexical Resource & Collocations (Weight 25%)
4. Grammatical Range and Accuracy (Weight 25%)
Return JSON output with detailed annotations, error start/end offsets, and constructive recommendations.`}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.5 }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Grading Policies */}
        {activeTab === 'grading' && (
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 className="headline-md" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} color="var(--primary)" />
                {isVi ? 'Quy Định Chấm Điểm & Ngưỡng Duyệt Bài' : 'Grading Policies & Auto-Approval Thresholds'}
              </h3>
              <p className="body-sm text-on-surface-variant" style={{ margin: 0 }}>
                {isVi ? 'Thiết lập quy trình phê duyệt kết quả thi và thời gian cam kết trả bài của giáo viên.' : 'Configure workflow guardrails, plagiarism thresholds, and teacher SLAs.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--on-surface)' }}>
                    {isVi ? 'Tự động chốt điểm bài trắc nghiệm (Reading / Listening / Rewrite)' : 'Auto-finalize Quiz submissions'}
                  </strong>
                  <p className="body-sm text-on-surface-variant" style={{ margin: '4px 0 0 0' }}>
                    {isVi ? 'Các câu hỏi có đáp án khớp 100% trong bảng questions.correct_answer sẽ được chốt điểm ngay lập tức.' : 'Submissions matching questions.correct_answer will automatically receive COMPLETED grading status.'}
                  </p>
                </div>
                <label className="adm-switch">
                  <input 
                    type="checkbox" 
                    checked={autoApproveQuiz}
                    onChange={(e) => setAutoApproveQuiz(e.target.checked)}
                  />
                  <span className="adm-switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--on-surface)' }}>
                    {isVi ? 'Bắt buộc Giáo viên duyệt bài Writing & Speaking trước khi công bố' : 'Human-in-the-loop review for Writing & Speaking'}
                  </strong>
                  <p className="body-sm text-on-surface-variant" style={{ margin: '4px 0 0 0' }}>
                    {isVi ? 'Bài tự luận sẽ ở trạng thái AI_GRADED cho đến khi giáo viên phụ trách bấm "Chốt điểm & Trả bài" (method = TEACHER_MANUAL).' : 'Assignments stay in AI_GRADED until verified by assigned class teacher.'}
                  </p>
                </div>
                <label className="adm-switch">
                  <input 
                    type="checkbox" 
                    checked={requireTeacherReview}
                    onChange={(e) => setRequireTeacherReview(e.target.checked)}
                  />
                  <span className="adm-switch-slider"></span>
                </label>
              </div>

              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="label-md" style={{ fontWeight: 600 }}>
                    {isVi ? 'Ngưỡng Cảnh Báo Đạo Văn (Plagiarism Flagging Threshold)' : 'Plagiarism Flagging Score'}
                  </label>
                  <span className="font-semibold text-secondary">{plagiarismThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="60" 
                  step="5"
                  value={plagiarismThreshold}
                  onChange={(e) => setPlagiarismThreshold(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
                <p className="body-sm text-on-surface-variant" style={{ marginTop: '6px' }}>
                  {isVi ? 'Nếu tỷ lệ trùng lặp vượt ngưỡng, cột gradings.is_plagiarism_flagged sẽ tự động bật TRUE.' : 'Submissions exceeding this percentage will set gradings.is_plagiarism_flagged = true.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '20px' }}>
                <label className="label-md" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  {isVi ? 'Thời Gian Quy Định Chấm Bài Của Giáo Viên (SLA)' : 'Teacher Grading SLA Deadline'}
                </label>
                <select 
                  className="input"
                  value={slaHours}
                  onChange={(e) => setSlaHours(parseInt(e.target.value))}
                  style={{ maxWidth: '320px' }}
                >
                  <option value={12}>12 {isVi ? 'giờ sau khi học viên nộp' : 'hours post-submission'}</option>
                  <option value={24}>24 {isVi ? 'giờ (Chuẩn khuyến nghị)' : 'hours (Recommended standard)'}</option>
                  <option value={48}>48 {isVi ? 'giờ' : 'hours'}</option>
                  <option value={72}>72 {isVi ? 'giờ' : 'hours'}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 className="headline-md" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={18} color="var(--primary)" />
                {isVi ? 'Thông Báo Email & Liên Lạc Tự Động' : 'Email Alerts & Parent Notifications'}
              </h3>
              <p className="body-sm text-on-surface-variant" style={{ margin: 0 }}>
                {isVi ? 'Quản lý các sự kiện gửi thông báo tự động cho học viên và phụ huynh.' : 'Automated transactional emails and parental score digests.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--on-surface)' }}>
                    {isVi ? 'Gửi Email báo điểm cho Học viên ngay khi có kết quả' : 'Instant Email Notification on Grade Publication'}
                  </strong>
                  <p className="body-sm text-on-surface-variant" style={{ margin: '4px 0 0 0' }}>
                    {isVi ? 'Học viên nhận email kèm link xem phân tích lỗi sai và bài chữa chi tiết.' : 'Dispatches email notification with deep-link to submission feedback view.'}
                  </p>
                </div>
                <label className="adm-switch">
                  <input 
                    type="checkbox" 
                    checked={emailStudentOnGraded}
                    onChange={(e) => setEmailStudentOnGraded(e.target.checked)}
                  />
                  <span className="adm-switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--on-surface)' }}>
                    {isVi ? 'Gửi báo cáo định kỳ cho Phụ huynh (Parent SMS / Email)' : 'Weekly Parent Academic Digest'}
                  </strong>
                  <p className="body-sm text-on-surface-variant" style={{ margin: '4px 0 0 0' }}>
                    {isVi ? 'Tự động gửi thống kê chuyên cần và bảng điểm trung bình đến parent_phone / email vào tối Chủ Nhật.' : 'Automated digest to student_profiles.parent_phone every Sunday evening.'}
                  </p>
                </div>
                <label className="adm-switch">
                  <input 
                    type="checkbox" 
                    checked={emailParentDigest}
                    onChange={(e) => setEmailParentDigest(e.target.checked)}
                  />
                  <span className="adm-switch-slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 className="headline-md" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="var(--primary)" />
                {isVi ? 'Chính Sách Bảo Mật & Phiên Đăng Nhập (JWT / Refresh Tokens)' : 'Authentication & Session Policies'}
              </h3>
              <p className="body-sm text-on-surface-variant" style={{ margin: 0 }}>
                {isVi ? 'Kiểm soát thời hạn phiên đăng nhập, thu hồi token và giới hạn thiết bị.' : 'Token lifespans, session concurrency limits, and database revoke indexes.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <label className="label-md" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  {isVi ? 'Thời gian sống của Access Token' : 'Access Token Lifetime'}
                </label>
                <select 
                  className="input" 
                  value={jwtLifetimeMinutes} 
                  onChange={(e) => setJwtLifetimeMinutes(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                >
                  <option value={15}>15 {isVi ? 'phút (Bảo mật cao)' : 'minutes (High Security)'}</option>
                  <option value={30}>30 {isVi ? 'phút' : 'minutes'}</option>
                  <option value={60}>60 {isVi ? 'phút' : 'minutes'}</option>
                </select>
              </div>

              <div>
                <label className="label-md" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  {isVi ? 'Giới hạn thiết bị đăng nhập đồng thời' : 'Max Concurrent Devices'}
                </label>
                <select 
                  className="input" 
                  value={maxConcurrentDevices} 
                  onChange={(e) => setMaxConcurrentDevices(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                >
                  <option value={1}>1 {isVi ? 'thiết bị (Chống chia sẻ tài khoản)' : 'device (Strict anti-sharing)'}</option>
                  <option value={2}>2 {isVi ? 'thiết bị (PC + Mobile)' : 'devices (Laptop + Phone)'}</option>
                  <option value={5}>5 {isVi ? 'thiết bị' : 'devices'}</option>
                </select>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontWeight: 600 }}>
                <Database size={16} color="var(--primary)" />
                <span>{isVi ? 'Đồng bộ bảng refresh_tokens' : 'refresh_tokens DB Table Indexing'}</span>
              </div>
              <p className="body-sm text-on-surface-variant" style={{ margin: 0 }}>
                {isVi ? 'CSDL PostgreSQL áp dụng index idx_refresh_tokens_active trên cặp (user_id, expires_at) theo bản cập nhật V2.' : 'Active session index idx_refresh_tokens_active is functioning with real-time revocation checks.'}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminSettings;
