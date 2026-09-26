import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, PenTool, Mic, BookOpen, Headphones, 
  Calendar, Eye, Save, Send, CheckCircle2, Bell
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { 
  AssignmentEditorData, AssignmentSkill 
} from '../types/assignment-editor.types';
import { 
  SkillWritingEditor, 
  SkillSpeakingEditor, 
  SkillReadingEditor, 
  SkillListeningEditor,
  AssignmentPreviewModal
} from '../components/assignments/editor';
import { StickyActionBar } from '../components/common';
import '../styles/teacher-assignment-edit.css';

export const TeacherCreateAssignment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Get initial skill from query param ?type=speaking | reading | listening | writing
  const querySkill = searchParams.get('type') as AssignmentSkill | null;
  const initialSkill: AssignmentSkill = (querySkill && ['writing', 'speaking', 'reading', 'listening'].includes(querySkill)) 
    ? querySkill 
    : 'writing';

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [assignmentData, setAssignmentData] = useState<AssignmentEditorData>({
    id: `new-${Date.now()}`,
    code: initialSkill === 'speaking' ? 'HW-02-NEW' : initialSkill === 'reading' ? 'HW-03-NEW' : initialSkill === 'listening' ? 'HW-04-NEW' : 'HW-06',
    title: initialSkill === 'speaking' 
      ? 'Speaking Part 2: Environmental Solutions' 
      : initialSkill === 'reading' 
      ? 'IELTS Reading Mock: Emerging Clean Energy Tech' 
      : initialSkill === 'listening' 
      ? 'IELTS Listening: Campus Orientation & Library Guide' 
      : 'HW-06: IELTS Writing Task 2 - Sustainable Urban Development',
    skill: initialSkill,
    className: 'ENG-IELTS-6.5A',
    startDate: new Date().toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    durationMinutes: initialSkill === 'reading' ? 60 : initialSkill === 'listening' ? 30 : 60,
    allowLate: true,
    status: 'active',
    targetAudience: 'all',
    notifyStudents: true,
    maxSubmissions: 3,
    writing: {
      taskType: 'task2',
      promptText: 'As global urbanization accelerates, metropolitan areas encounter significant environmental challenges. Discuss the main issues caused by rapid city growth and suggest practical measures governments and citizens can undertake to achieve sustainable urban development. (Write at least 250 words).',
      minWords: 250,
      scale: '9.0',
      rubrics: { tr: 25, cc: 25, lr: 25, gra: 25 },
      enableAi: true,
      aiInstruction: 'Khắt khe với các lỗi diễn đạt chung chung; gạch chân cấu trúc ngữ pháp Band 7.5+ và collocations cao cấp.',
      enablePlagiarismCheck: true,
      modelAnswer: '',
      attachments: [
        {
          id: 'att-new-1',
          name: 'IELTS_Writing_Task2_Guide.pdf',
          size: '1.1 MB',
          extension: 'pdf'
        }
      ]
    },
    speaking: {
      partType: 'part2',
      cueCardTopic: 'Describe an eco-friendly action you took to protect the local environment.',
      cueCardBullets: [
        'What the action was',
        'When and where you took it',
        'Why you decided to do it',
        'And explain how you felt after completing this action.'
      ],
      prepTimeSeconds: 60,
      speakingTimeSeconds: 120,
      maxRetries: 3,
      examinerSampleAudioUrl: 'https://cdn.englishhub.edu.vn/audio/speaking/sample-hw02.mp3',
      examinerTranscript: 'You have one minute to prepare your speech on this topic.',
      followUpQuestions: [
        {
          id: 'sq-new-1',
          order: 1,
          question: 'Do schools in your country educate students about environmental conservation?',
          hint: 'Discuss curriculum, extracurricular recycling campaigns, and tree-planting days.'
        }
      ],
      rubrics: { fc: 25, lr: 25, gra: 25, pr: 25 },
      enableAi: true,
      aiModel: 'Whisper V3 Large',
      aiInstruction: 'Đặc biệt kiểm tra phụ âm cuối /s/, /z/, /t/ và ngữ điệu câu hỏi.'
    },
    reading: {
      passageTitle: 'The Architecture of Green Smart Cities',
      passageSubtitle: 'Cambridge Academic Reading Section',
      passageSource: 'Journal of Urban Ecology & Architecture',
      timeLimitMinutes: 20,
      enableAiExplanation: true,
      aiInstruction: 'Cung cấp phân tích chi tiết cho từng phương án bẫy.',
      paragraphs: [
        {
          id: 'p-new-1',
          label: 'A',
          title: 'The Rise of Smart Cities',
          content: 'Smart cities leverage IoT sensors, real-time analytics, and energy-efficient building materials to minimize greenhouse gas emissions and enhance civic infrastructure.'
        },
        {
          id: 'p-new-2',
          label: 'B',
          title: 'Renewable Power Integration',
          content: 'Solar façades and distributed wind micro-turbines now supply substantial electricity directly to high-density commercial districts, reducing reliance on fossil fuels.'
        }
      ],
      questions: [
        {
          id: 'rq-new-1',
          order: 1,
          type: 'multiple_choice',
          prompt: 'What is the primary objective of deploying IoT sensors in green smart cities?',
          options: [
            'To monitor energy consumption and minimize greenhouse emissions',
            'To replace human architects with artificial intelligence',
            'To increase the cost of commercial real estate',
            'To conduct surveillance on residential neighborhoods'
          ],
          correctAnswer: 'To monitor energy consumption and minimize greenhouse emissions',
          explanation: 'Đoạn A khẳng định: "minimize greenhouse gas emissions and enhance civic infrastructure".',
          paragraphRef: 'A',
          points: 1
        }
      ]
    },
    listening: {
      audioTitle: 'Campus_Orientation_Eco_Initiatives.mp3',
      audioUrl: 'https://cdn.englishhub.edu.vn/audio/listening/campus-orientation.mp3',
      audioDurationSeconds: 1200,
      playbackLimit: 'single',
      transcript: `[00:10] Speaker 1: Good morning and welcome to the university environmental seminar.
[00:30] Speaker 2: We would like to register our student society for the campus recycling initiative.`,
      hideTranscriptUntilGraded: true,
      activeSection: 'section1',
      enableAiDistractorCheck: true,
      aiInstruction: 'Lưu ý người nói có đính chính ngày nộp đơn đăng ký.',
      questions: [
        {
          id: 'lq-new-1',
          order: 1,
          section: 'section1',
          type: 'form_completion',
          prompt: 'Society registration name: [ _____ ] Initiative',
          correctAnswer: 'Campus Recycling',
          acceptableAnswers: ['campus recycling', 'Campus Recycling Initiative'],
          timestampClue: '00:30',
          points: 1
        }
      ]
    }
  });

  useEffect(() => {
    if (querySkill && ['writing', 'speaking', 'reading', 'listening'].includes(querySkill)) {
      setAssignmentData(prev => ({ ...prev, skill: querySkill }));
    }
  }, [querySkill]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveDraft = () => {
    showToast(isVi ? 'Đã lưu bản nháp bài tập mới!' : 'Draft assignment saved!');
  };

  const handlePublish = () => {
    showToast(isVi ? 'Đã giao bài tập mới thành công!' : 'Assignment created and published successfully!');
    setTimeout(() => {
      navigate('/teacher/assignments');
    }, 1200);
  };

  return (
    <div className="assignment-edit-container">
      {/* Breadcrumb Navigation */}
      <div className="assignment-edit-breadcrumb">
        <button 
          type="button"
          className="assignment-edit-back-btn"
          onClick={() => navigate('/teacher/assignments')}
        >
          <ArrowLeft size={16} />
          <span>{isVi ? 'Quản lý bài tập' : 'Assignments Library'}</span>
        </button>
        <span>/</span>
        <span>{assignmentData.className}</span>
        <span>/</span>
        <span style={{ fontWeight: 700, color: 'var(--on-surface, #111827)' }}>
          {isVi ? 'Giao bài tập mới' : 'Create New Assignment'}
        </span>
      </div>

      {/* Header */}
      <div className="assignment-edit-header">
        <div className="assignment-edit-title-wrap">
          <div className="assignment-edit-title-row">
            <span className="assignment-edit-code-badge" style={{ backgroundColor: '#2563eb' }}>
              MỚI
            </span>
            <input 
              type="text" 
              className="assignment-edit-title-input"
              value={assignmentData.title}
              onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
              placeholder={isVi ? 'Nhập tiêu đề bài tập mới...' : 'Enter new assignment title...'}
            />
          </div>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
            {isVi 
              ? 'Thiết lập nội dung đề thi theo 4 kỹ năng chuẩn IELTS, đính kèm học liệu và cấu hình chấm điểm AI.'
              : 'Configure 4 IELTS skill assignment templates, attachments, and automated AI scoring.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            value={assignmentData.className}
            onChange={(e) => setAssignmentData({ ...assignmentData, className: e.target.value })}
            style={{ 
              padding: '8px 14px', 
              fontSize: '13px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              backgroundColor: '#ffffff',
              fontWeight: 600
            }}
          >
            <option value="ENG-IELTS-6.5A">Lớp: ENG-IELTS-6.5A (Intensive)</option>
            <option value="ENG-GRAM-ADV">Lớp: ENG-GRAM-ADV (Ngữ pháp)</option>
            <option value="ENG-TOEIC-750">Lớp: ENG-TOEIC-750 (Cấp tốc)</option>
          </select>
        </div>
      </div>

      {/* Skill Tabs Navigation */}
      <div className="skill-tabs-nav">
        <button 
          type="button"
          className={`skill-tab-btn ${assignmentData.skill === 'writing' ? 'active-writing' : ''}`}
          onClick={() => setAssignmentData({ ...assignmentData, skill: 'writing' })}
        >
          <PenTool size={16} />
          <span>Writing (Kỹ năng Viết)</span>
        </button>

        <button 
          type="button"
          className={`skill-tab-btn ${assignmentData.skill === 'speaking' ? 'active-speaking' : ''}`}
          onClick={() => setAssignmentData({ ...assignmentData, skill: 'speaking' })}
        >
          <Mic size={16} />
          <span>Speaking (Kỹ năng Nói)</span>
        </button>

        <button 
          type="button"
          className={`skill-tab-btn ${assignmentData.skill === 'reading' ? 'active-reading' : ''}`}
          onClick={() => setAssignmentData({ ...assignmentData, skill: 'reading' })}
        >
          <BookOpen size={16} />
          <span>Reading (Kỹ năng Đọc)</span>
        </button>

        <button 
          type="button"
          className={`skill-tab-btn ${assignmentData.skill === 'listening' ? 'active-listening' : ''}`}
          onClick={() => setAssignmentData({ ...assignmentData, skill: 'listening' })}
        >
          <Headphones size={16} />
          <span>Listening (Kỹ năng Nghe)</span>
        </button>
      </div>

      {/* Grid: Skill Workspace (Left) + Settings Sidebar (Right) */}
      <div className="assignment-edit-grid">
        {/* LEFT COLUMN: Skill Workspace */}
        <div>
          {assignmentData.skill === 'writing' && (
            <SkillWritingEditor 
              config={assignmentData.writing}
              onChange={(updated) => setAssignmentData({ ...assignmentData, writing: updated })}
            />
          )}

          {assignmentData.skill === 'speaking' && (
            <SkillSpeakingEditor 
              config={assignmentData.speaking}
              onChange={(updated) => setAssignmentData({ ...assignmentData, speaking: updated })}
            />
          )}

          {assignmentData.skill === 'reading' && (
            <SkillReadingEditor 
              config={assignmentData.reading}
              onChange={(updated) => setAssignmentData({ ...assignmentData, reading: updated })}
            />
          )}

          {assignmentData.skill === 'listening' && (
            <SkillListeningEditor 
              config={assignmentData.listening}
              onChange={(updated) => setAssignmentData({ ...assignmentData, listening: updated })}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Settings Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Schedule */}
          <section className="edit-card">
            <div className="edit-card-header">
              <div className="edit-card-header-left">
                <div className="edit-card-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="edit-card-title">{isVi ? 'Lịch Nộp Bài' : 'Schedule & Due Date'}</h3>
                  <p className="edit-card-desc">{isVi ? 'Thời gian mở và hạn chót' : 'Open & Close dates'}</p>
                </div>
              </div>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">{isVi ? 'Thời gian mở đề (Open at)' : 'Open Time'}</label>
              <input 
                type="datetime-local" 
                className="edit-form-input" 
                value={assignmentData.startDate}
                onChange={(e) => setAssignmentData({ ...assignmentData, startDate: e.target.value })}
              />
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">
                {isVi ? 'Hạn chót nộp bài (Close at)' : 'Due Date'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="datetime-local" 
                className="edit-form-input" 
                value={assignmentData.dueDate}
                onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                style={{ fontWeight: 600 }}
              />
            </div>

            <div className="edit-form-group">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={assignmentData.allowLate}
                  onChange={(e) => setAssignmentData({ ...assignmentData, allowLate: e.target.checked })}
                  style={{ marginTop: '3px', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '13px', color: '#334155', lineHeight: 1.4 }}>
                  <strong style={{ display: 'block', color: '#0f172a' }}>{isVi ? 'Cho phép nộp muộn' : 'Allow late submissions'}</strong>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {isVi ? 'Tối đa trễ 24 giờ sau hạn chót (tự động gắn cờ Nộp muộn).' : 'Max 24h grace period.'}
                  </span>
                </span>
              </label>
            </div>

            <div className="edit-form-group" style={{ marginBottom: 0 }}>
              <label className="edit-form-label">{isVi ? 'Thời lượng làm bài có bấm giờ' : 'Duration Limit'}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  className="edit-form-input" 
                  value={assignmentData.durationMinutes || 60}
                  onChange={(e) => setAssignmentData({ ...assignmentData, durationMinutes: parseInt(e.target.value) || 0 })}
                  style={{ width: '90px' }}
                />
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  {isVi ? 'phút' : 'minutes'}
                </span>
              </div>
            </div>
          </section>

          {/* Visibility & Status */}
          <section className="edit-card">
            <div className="edit-card-header">
              <div className="edit-card-header-left">
                <div className="edit-card-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="edit-card-title">{isVi ? 'Trạng Thái & Đối Tượng' : 'Publish & Audience'}</h3>
                  <p className="edit-card-desc">{isVi ? 'Quyền truy cập của học viên' : 'Student access'}</p>
                </div>
              </div>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">{isVi ? 'Trạng thái phát hành' : 'Publish Status'}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  style={{ 
                    padding: '8px 10px', 
                    borderRadius: '8px', 
                    border: assignmentData.status === 'active' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: assignmentData.status === 'active' ? '#eff6ff' : '#ffffff',
                    color: assignmentData.status === 'active' ? '#1d4ed8' : '#64748b',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setAssignmentData({ ...assignmentData, status: 'active' })}
                >
                  {isVi ? 'Công khai' : 'Published'}
                </button>
                <button
                  type="button"
                  style={{ 
                    padding: '8px 10px', 
                    borderRadius: '8px', 
                    border: assignmentData.status === 'draft' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: assignmentData.status === 'draft' ? '#eff6ff' : '#ffffff',
                    color: assignmentData.status === 'draft' ? '#1d4ed8' : '#64748b',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setAssignmentData({ ...assignmentData, status: 'draft' })}
                >
                  {isVi ? 'Bản nháp' : 'Draft'}
                </button>
              </div>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">{isVi ? 'Phạm vi giao bài' : 'Audience Target'}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="audience" 
                    checked={assignmentData.targetAudience === 'all'}
                    onChange={() => setAssignmentData({ ...assignmentData, targetAudience: 'all' })}
                    style={{ accentColor: '#2563eb' }}
                  />
                  {isVi ? 'Toàn bộ học viên trong lớp (24 học viên)' : 'All class students (24)'}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="audience" 
                    checked={assignmentData.targetAudience === 'specific'}
                    onChange={() => setAssignmentData({ ...assignmentData, targetAudience: 'specific' })}
                    style={{ accentColor: '#2563eb' }}
                  />
                  {isVi ? 'Chỉ định nhóm học viên cụ thể' : 'Specific student group'}
                </label>
              </div>
            </div>

            <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={assignmentData.notifyStudents}
                  onChange={(e) => setAssignmentData({ ...assignmentData, notifyStudents: e.target.checked })}
                  style={{ accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                  <Bell size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {isVi ? 'Gửi thông báo & email đến học sinh' : 'Send app & email alerts'}
                </span>
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <StickyActionBar 
        leftActions={
          <button 
            type="button"
            onClick={() => navigate('/teacher/assignments')}
            style={{ 
              padding: '8px 16px', 
              fontSize: '13px', 
              fontWeight: 600, 
              color: '#475569', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              borderRadius: '8px' 
            }}
          >
            {isVi ? 'Hủy bỏ' : 'Cancel'}
          </button>
        }
        rightActions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button"
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => setShowPreviewModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Eye size={14} />
              <span>{isVi ? 'Xem thử giao diện học viên' : 'Preview as Student'}</span>
            </button>

            <button 
              type="button"
              className="btn btn-secondary bg-white btn-sm"
              onClick={handleSaveDraft}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} />
              <span>{isVi ? 'Lưu bản nháp' : 'Save Draft'}</span>
            </button>

            <button 
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePublish}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px' }}
            >
              <Send size={14} />
              <span>{isVi ? 'Giao bài tập' : 'Create & Publish'}</span>
            </button>
          </div>
        }
      />

      {/* Preview Modal */}
      {showPreviewModal && (
        <AssignmentPreviewModal 
          data={assignmentData} 
          onClose={() => setShowPreviewModal(false)} 
        />
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="edit-toast">
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default TeacherCreateAssignment;
