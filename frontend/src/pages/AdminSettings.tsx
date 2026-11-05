import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, Shield, Bell, 
  Save, RotateCcw, CheckCircle2, 
  Database, Sliders
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ADMIN_SETTINGS_LIMITS, ADMIN_SETTINGS_OPTIONS, DEFAULT_ADMIN_SETTINGS,
  readAdminSettings, resetAdminSettings, saveAdminSettings,
} from '../utils/adminSettings.utils';

export const AdminSettings: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'ai' | 'grading' | 'notifications' | 'security'>('ai');
  const [initialConfig] = useState(readAdminSettings);
  const [saveSuccess, setSaveSuccess] = useState<'saved' | 'reset' | null>(null);
  const [storageIssue, setStorageIssue] = useState<'invalid' | 'unavailable' | 'save' | 'reset' | null>(
    initialConfig.status === 'invalid' || initialConfig.status === 'unavailable' ? initialConfig.status : null,
  );
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [aiModelWriting, setAiModelWriting] = useState(initialConfig.settings.aiModelWriting);
  const [aiModelSpeaking, setAiModelSpeaking] = useState(initialConfig.settings.aiModelSpeaking);
  const [temperature, setTemperature] = useState(initialConfig.settings.temperature);
  const [autoApproveQuiz, setAutoApproveQuiz] = useState(initialConfig.settings.autoApproveQuiz);
  const [requireTeacherReview, setRequireTeacherReview] = useState(initialConfig.settings.requireTeacherReview);
  const [plagiarismThreshold, setPlagiarismThreshold] = useState(initialConfig.settings.plagiarismThreshold);
  const [slaHours, setSlaHours] = useState(initialConfig.settings.slaHours);
  const [emailStudentOnGraded, setEmailStudentOnGraded] = useState(initialConfig.settings.emailStudentOnGraded);
  const [emailParentDigest, setEmailParentDigest] = useState(initialConfig.settings.emailParentDigest);
  const [jwtLifetimeMinutes, setJwtLifetimeMinutes] = useState(initialConfig.settings.jwtLifetimeMinutes);
  const [maxConcurrentDevices, setMaxConcurrentDevices] = useState(initialConfig.settings.maxConcurrentDevices);

  useEffect(() => () => {
    if (successTimer.current !== null) clearTimeout(successTimer.current);
  }, []);

  const clearFeedback = () => {
    if (successTimer.current !== null) clearTimeout(successTimer.current);
    successTimer.current = null;
    setSaveSuccess(null);
    setStorageIssue(null);
  };

  const showSuccess = (action: 'saved' | 'reset') => {
    setSaveSuccess(action);
    successTimer.current = setTimeout(() => {
      setSaveSuccess(null);
      successTimer.current = null;
    }, 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    const saved = saveAdminSettings({
      aiModelWriting, aiModelSpeaking, temperature, autoApproveQuiz, requireTeacherReview,
      plagiarismThreshold, slaHours, emailStudentOnGraded, emailParentDigest,
      jwtLifetimeMinutes, maxConcurrentDevices,
    });
    if (!saved) {
      setStorageIssue('save');
      return;
    }
    showSuccess('saved');
  };

  const handleReset = () => {
    clearFeedback();
    if (!resetAdminSettings()) {
      setStorageIssue('reset');
      return;
    }
    setAiModelWriting(DEFAULT_ADMIN_SETTINGS.aiModelWriting);
    setAiModelSpeaking(DEFAULT_ADMIN_SETTINGS.aiModelSpeaking);
    setTemperature(DEFAULT_ADMIN_SETTINGS.temperature);
    setAutoApproveQuiz(DEFAULT_ADMIN_SETTINGS.autoApproveQuiz);
    setRequireTeacherReview(DEFAULT_ADMIN_SETTINGS.requireTeacherReview);
    setPlagiarismThreshold(DEFAULT_ADMIN_SETTINGS.plagiarismThreshold);
    setSlaHours(DEFAULT_ADMIN_SETTINGS.slaHours);
    setEmailStudentOnGraded(DEFAULT_ADMIN_SETTINGS.emailStudentOnGraded);
    setEmailParentDigest(DEFAULT_ADMIN_SETTINGS.emailParentDigest);
    setJwtLifetimeMinutes(DEFAULT_ADMIN_SETTINGS.jwtLifetimeMinutes);
    setMaxConcurrentDevices(DEFAULT_ADMIN_SETTINGS.maxConcurrentDevices);
    showSuccess('reset');
  };

  const storageMessages = {
    invalid: isVi ? 'Cấu hình đã lưu không hợp lệ. Các trường không hợp lệ đã dùng giá trị mặc định.' : 'Saved configuration is invalid. Invalid fields use their defaults.',
    unavailable: isVi ? 'Không đọc được cấu hình đã lưu. Đang dùng giá trị mặc định.' : 'Could not read saved configuration. Using defaults.',
    save: isVi ? 'Chưa lưu được cấu hình trên trình duyệt này. Vui lòng thử lại.' : 'Configuration has not been saved in this browser. Please retry.',
    reset: isVi ? 'Chưa hoàn tất khôi phục cấu hình trên trình duyệt này. Vui lòng thử lại.' : 'Configuration reset is incomplete in this browser. Please retry.',
  };

  return (
    <div className="adm-container">
      {/* Page Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <span>{t('adminSettings.title')}</span>
            <span className="adm-title-badge">{isVi ? 'Lưu cục bộ' : 'Browser storage'}</span>
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="adm-actions">
          <button 
            type="button" 
            className="btn btn-secondary inline-flex items-center gap-2"
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            <span>{t('adminSettings.btnReset')}</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary inline-flex items-center gap-2"
            onClick={handleSave}
          >
            <Save size={16} />
            <span>{t('adminSettings.btnSave')}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="adm-alert-success mb-5 font-semibold" role="status">
          <CheckCircle2 size={18} />
          <span>{saveSuccess === 'saved'
            ? (isVi ? 'Đã lưu cấu hình trên trình duyệt này' : 'Configuration saved in this browser')
            : (isVi ? 'Đã khôi phục cấu hình mặc định trên trình duyệt này' : 'Default configuration restored in this browser')}</span>
        </div>
      )}

      {storageIssue && (
        <div className="adm-alert-error mb-5" role="alert">{storageMessages[storageIssue]}</div>
      )}

      {/* Settings Tab Navigation */}
      <div className="adm-filter-bar justify-start">
        <div className="adm-pills m-0">
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
          <div className="flex flex-col gap-6">
            <div className="card adm-settings-section-card">
              <h3 className="headline-md mb-1.5">
                {isVi ? 'Mô Hình Trí Tuệ Nhân Tạo' : 'AI Models'}
              </h3>
              <p className="body-sm text-on-surface-variant mb-6">
                {isVi ? 'Định cấu hình các model LLM và Speech-to-Text dùng cho chấm tự luận Writing & Speaking.' : 'Manage multimodal LLM and speech inference endpoints.'}
              </p>

              <div className="adm-settings-grid-2 mb-5">
                <div>
                  <label className="label-md block mb-2 font-semibold">
                    {isVi ? 'Mô hình chấm Writing Task 1 & 2' : 'Writing Evaluation Model'}
                  </label>
                  <select 
                    className="input w-full" 
                    value={aiModelWriting} 
                    onChange={(e) => setAiModelWriting(e.target.value)}
                  >
                    {ADMIN_SETTINGS_OPTIONS.writingModels.map(model => (
                      <option key={model.value} value={model.value}>{model.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-md block mb-2 font-semibold">
                    {isVi ? 'Mô hình nhận diện Speaking & Ghi âm' : 'Speaking Transcription Engine'}
                  </label>
                  <select 
                    className="input w-full" 
                    value={aiModelSpeaking} 
                    onChange={(e) => setAiModelSpeaking(e.target.value)}
                  >
                    {ADMIN_SETTINGS_OPTIONS.speakingModels.map(model => (
                      <option key={model.value} value={model.value}>{model.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="label-md font-semibold">
                    {isVi ? 'Độ sáng tạo / Ổn định của AI (Temperature)' : 'Sampling Temperature'}
                  </label>
                  <span className="font-semibold text-primary">{temperature} (Deterministic)</span>
                </div>
                <input 
                  type="range" 
                  min={ADMIN_SETTINGS_LIMITS.temperature.min}
                  max={ADMIN_SETTINGS_LIMITS.temperature.max}
                  step={ADMIN_SETTINGS_LIMITS.temperature.step}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="adm-range-input"
                />
                <p className="body-sm text-on-surface-variant mt-1.5">
                  {isVi ? 'Giá trị 0.1 - 0.2 đảm bảo việc chấm điểm đồng nhất và có độ lặp lại cao nhất.' : 'Low values (0.1 - 0.2) ensure deterministic score reproducibility across submissions.'}
                </p>
              </div>
            </div>

            <div className="card adm-settings-section-card">
              <h3 className="headline-md mb-1.5">
                {isVi ? 'Prompt Hệ Thống Mặc Định (System Prompt Template)' : 'Default Grading Prompt Template'}
              </h3>
              <p className="body-sm text-on-surface-variant mb-4">
                {isVi ? 'Khung chỉ dẫn được nhúng vào snapshot ai_instruction_snapshot của bảng gradings trong CSDL.' : 'Core rubric instruction stored into gradings.ai_instruction_snapshot.'}
              </p>
              <textarea 
                className="input w-full font-mono text-[13px] leading-relaxed" 
                rows={6}
                defaultValue={`You are an expert English language evaluator.
Assess the candidate's submission on a standard 10-point scale:
1. Task Completion & Relevance (Content)
2. Coherence and Organization (Structure)
3. Lexical Resource & Vocabulary (Vocabulary)
4. Grammatical Accuracy (Grammar)
Return JSON output with detailed annotations, error start/end offsets, and constructive recommendations.`}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Grading Policies */}
        {activeTab === 'grading' && (
          <div className="card adm-settings-section-card flex flex-col gap-6">
            <div>
              <h3 className="headline-md mb-1.5">
                {isVi ? 'Quy Định Chấm Điểm & Ngưỡng Duyệt Bài' : 'Grading Policies & Auto-Approval Thresholds'}
              </h3>
              <p className="body-sm text-on-surface-variant m-0">
                {isVi ? 'Thiết lập quy trình phê duyệt kết quả thi và thời gian cam kết trả bài của giáo viên.' : 'Configure workflow guardrails, plagiarism thresholds, and teacher SLAs.'}
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="adm-settings-row">
                <div>
                  <strong className="text-[15px] text-on-surface">
                    {isVi ? 'Tự động chốt điểm bài trắc nghiệm (Reading / Listening / Rewrite)' : 'Auto-finalize Quiz submissions'}
                  </strong>
                  <p className="body-sm text-on-surface-variant mt-1 mb-0">
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

              <div className="adm-settings-row">
                <div>
                  <strong className="text-[15px] text-on-surface">
                    {isVi ? 'Bắt buộc Giáo viên duyệt bài Writing & Speaking trước khi công bố' : 'Human-in-the-loop review for Writing & Speaking'}
                  </strong>
                  <p className="body-sm text-on-surface-variant mt-1 mb-0">
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

              <div className="adm-settings-divider">
                <div className="flex justify-between mb-2">
                  <label className="label-md font-semibold">
                    {isVi ? 'Ngưỡng Cảnh Báo Đạo Văn (Plagiarism Flagging Threshold)' : 'Plagiarism Flagging Score'}
                  </label>
                  <span className="font-semibold text-secondary">{plagiarismThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min={ADMIN_SETTINGS_LIMITS.plagiarismThreshold.min}
                  max={ADMIN_SETTINGS_LIMITS.plagiarismThreshold.max}
                  step={ADMIN_SETTINGS_LIMITS.plagiarismThreshold.step}
                  value={plagiarismThreshold}
                  onChange={(e) => setPlagiarismThreshold(parseInt(e.target.value))}
                  className="adm-range-input"
                />
                <p className="body-sm text-on-surface-variant mt-1.5">
                  {isVi ? 'Nếu tỷ lệ trùng lặp vượt ngưỡng, cột gradings.is_plagiarism_flagged sẽ tự động bật TRUE.' : 'Submissions exceeding this percentage will set gradings.is_plagiarism_flagged = true.'}
                </p>
              </div>

              <div className="adm-settings-divider">
                <label className="label-md block mb-2 font-semibold">
                  {isVi ? 'Thời Gian Quy Định Chấm Bài Của Giáo Viên (SLA)' : 'Teacher Grading SLA Deadline'}
                </label>
                <select 
                  className="input max-w-xs"
                  value={slaHours}
                  onChange={(e) => setSlaHours(parseInt(e.target.value))}
                >
                  {ADMIN_SETTINGS_OPTIONS.slaHours.map(hours => (
                    <option key={hours.value} value={hours.value}>{hours.value} {isVi ? hours.labelVi : hours.labelEn}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="card adm-settings-section-card flex flex-col gap-5">
            <div>
              <h3 className="headline-md mb-1.5">
                {isVi ? 'Thông Báo Email & Liên Lạc Tự Động' : 'Email Alerts & Parent Notifications'}
              </h3>
              <p className="body-sm text-on-surface-variant m-0">
                {isVi ? 'Quản lý các sự kiện gửi thông báo tự động cho học viên và phụ huynh.' : 'Automated transactional emails and parental score digests.'}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="adm-settings-row">
                <div>
                  <strong className="text-[15px] text-on-surface">
                    {isVi ? 'Gửi Email báo điểm cho Học viên ngay khi có kết quả' : 'Instant Email Notification on Grade Publication'}
                  </strong>
                  <p className="body-sm text-on-surface-variant mt-1 mb-0">
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

              <div className="adm-settings-row">
                <div>
                  <strong className="text-[15px] text-on-surface">
                    {isVi ? 'Gửi báo cáo định kỳ cho Phụ huynh (Parent SMS / Email)' : 'Weekly Parent Academic Digest'}
                  </strong>
                  <p className="body-sm text-on-surface-variant mt-1 mb-0">
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
          <div className="card adm-settings-section-card flex flex-col gap-6">
            <div>
              <h3 className="headline-md mb-1.5">
                {isVi ? 'Chính Sách Bảo Mật & Phiên Đăng Nhập (JWT / Refresh Tokens)' : 'Authentication & Session Policies'}
              </h3>
              <p className="body-sm text-on-surface-variant m-0">
                {isVi ? 'Kiểm soát thời hạn phiên đăng nhập, thu hồi token và giới hạn thiết bị.' : 'Token lifespans, session concurrency limits, and database revoke indexes.'}
              </p>
            </div>

            <div className="adm-settings-grid-security">
              <div>
                <label className="label-md block mb-2 font-semibold">
                  {isVi ? 'Thời gian sống của Access Token' : 'Access Token Lifetime'}
                </label>
                <select 
                  className="input w-full" 
                  value={jwtLifetimeMinutes} 
                  onChange={(e) => setJwtLifetimeMinutes(parseInt(e.target.value))}
                >
                  {ADMIN_SETTINGS_OPTIONS.jwtLifetimeMinutes.map(minutes => (
                    <option key={minutes.value} value={minutes.value}>{minutes.value} {isVi ? minutes.labelVi : minutes.labelEn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-md block mb-2 font-semibold">
                  {isVi ? 'Giới hạn thiết bị đăng nhập đồng thời' : 'Max Concurrent Devices'}
                </label>
                <select 
                  className="input w-full" 
                  value={maxConcurrentDevices} 
                  onChange={(e) => setMaxConcurrentDevices(parseInt(e.target.value))}
                >
                  {ADMIN_SETTINGS_OPTIONS.maxConcurrentDevices.map(devices => (
                    <option key={devices.value} value={devices.value}>{devices.value} {isVi ? devices.labelVi : devices.labelEn}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="adm-settings-info-box">
              <div className="flex items-center gap-2 mb-1 font-semibold text-primary">
                <Database size={16} />
                <span className="text-on-surface">{isVi ? 'Đồng bộ bảng refresh_tokens' : 'refresh_tokens DB Table Indexing'}</span>
              </div>
              <p className="body-sm text-on-surface-variant m-0">
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
