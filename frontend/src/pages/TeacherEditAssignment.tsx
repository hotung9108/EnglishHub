import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, PenTool, Mic, BookOpen, Headphones, 
  Calendar, Eye, Save, Send, CheckCircle2, Users, Bell
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

export const TeacherEditAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Preview Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('20:25');

  // Initial assignment data mapping based on ID
  const getInitialAssignmentData = (assignmentId?: string): AssignmentEditorData => {
    switch (assignmentId) {
      case '2': // HW-02 Speaking
        return {
          id: '2',
          code: 'HW-02',
          title: 'Speaking Part 2: Environmental Pollution in Urban Megacities',
          skill: 'speaking',
          className: 'ENG-IELTS-6.5A',
          startDate: '2026-03-12T08:00',
          dueDate: '2026-03-20T23:59',
          durationMinutes: 15,
          allowLate: true,
          status: 'active',
          targetAudience: 'all',
          notifyStudents: true,
          maxSubmissions: 3,
          writing: {
            taskType: 'task2',
            promptText: 'Discuss environmental policies in developing countries...',
            minWords: 250,
            scale: '9.0',
            rubrics: { tr: 25, cc: 25, lr: 25, gra: 25 },
            enableAi: true,
            aiInstruction: 'Focus on cohesion and academic collocations.',
            enablePlagiarismCheck: true,
            modelAnswer: '',
            attachments: []
          },
          speaking: {
            partType: 'part2',
            cueCardTopic: 'Describe an environmental problem that has occurred in your city or country.',
            cueCardBullets: [
              'What the problem is and where it occurs',
              'What causes this environmental hazard',
              'What effect it has on residents and wildlife',
              'And explain what measures should be taken to mitigate this issue.'
            ],
            prepTimeSeconds: 60,
            speakingTimeSeconds: 120,
            maxRetries: 3,
            examinerSampleAudioUrl: 'https://cdn.englishhub.edu.vn/audio/speaking/sample-hw02.mp3',
            examinerTranscript: 'All right, you will have one minute to prepare your monologue. After that, you should speak for two minutes about the environmental issue.',
            followUpQuestions: [
              {
                id: 'sq-1',
                order: 1,
                question: 'Do you think individuals or governments have more power to stop urban air pollution?',
                hint: 'Mention regulations, public transport investment vs individual recycling habits.'
              },
              {
                id: 'sq-2',
                order: 2,
                question: 'How might green architecture improve air quality in crowded megacities?',
                hint: 'Discuss vertical gardens, rooftop solar panels and eco-friendly concrete.'
              }
            ],
            rubrics: { fc: 25, lr: 25, gra: 25, pr: 25 },
            enableAi: true,
            aiModel: 'Whisper V3 Speech Diagnostic',
            aiInstruction: 'Chú ý đánh giá phát âm âm đuôi /s/, /z/, /t/, /d/ và nhịp điệu ngắt nghỉ (intonation).'
          },
          reading: {
            passageTitle: 'Biomimicry Innovation & Engineering',
            passageSubtitle: 'Nature-Inspired Technologies in Clean Energy',
            passageSource: 'Cambridge 19 Academic Reading',
            paragraphs: [],
            questions: [],
            timeLimitMinutes: 20,
            enableAiExplanation: true,
            aiInstruction: ''
          },
          listening: {
            audioTitle: 'Renewable Energy Seminar Discussion',
            audioUrl: '',
            audioDurationSeconds: 1800,
            playbackLimit: 'single',
            transcript: '',
            hideTranscriptUntilGraded: true,
            activeSection: 'section3',
            questions: [],
            enableAiDistractorCheck: true,
            aiInstruction: ''
          }
        };

      case '3': // HW-03 Reading
        return {
          id: '3',
          code: 'HW-03',
          title: 'Cambridge 19 - Academic Reading Passage: Biomimicry Innovation',
          skill: 'reading',
          className: 'ENG-IELTS-6.5A',
          startDate: '2026-03-10T08:00',
          dueDate: '2026-03-18T21:00',
          durationMinutes: 20,
          allowLate: false,
          status: 'closed',
          targetAudience: 'all',
          notifyStudents: true,
          writing: {
            taskType: 'task2',
            promptText: '',
            minWords: 250,
            scale: '9.0',
            rubrics: { tr: 25, cc: 25, lr: 25, gra: 25 },
            enableAi: true,
            aiInstruction: '',
            enablePlagiarismCheck: true,
            modelAnswer: '',
            attachments: []
          },
          speaking: {
            partType: 'part2',
            cueCardTopic: '',
            cueCardBullets: [],
            prepTimeSeconds: 60,
            speakingTimeSeconds: 120,
            maxRetries: 1,
            followUpQuestions: [],
            rubrics: { fc: 25, lr: 25, gra: 25, pr: 25 },
            enableAi: true,
            aiModel: 'Whisper V3',
            aiInstruction: ''
          },
          reading: {
            passageTitle: 'The Origin and Enduring Legacy of Typesetting Standards',
            passageSubtitle: 'Excerpts from Classical Typography & Publication Archival Studies',
            passageSource: 'Cambridge Academic Reading Passage 1',
            timeLimitMinutes: 20,
            enableAiExplanation: true,
            aiInstruction: 'Giải thích chi tiết tại sao các phương án nhiễu (distractors) lại sai.',
            paragraphs: [
              {
                id: 'p-1',
                label: 'A',
                title: 'What is Lorem Ipsum?',
                content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. Designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets."
              },
              {
                id: 'p-2',
                label: 'B',
                title: 'Why do we use it?',
                content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text."
              },
              {
                id: 'p-3',
                label: 'C',
                title: 'Where does it come from?',
                content: 'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, discovered the undoubtable source from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" by Cicero.'
              },
              {
                id: 'p-4',
                label: 'D',
                title: 'The Transition to Digital Publishing',
                content: 'With the advent of digital typesetting in the late 20th century, the role of dummy text became even more critical. Graphical user interfaces (GUI) required designers to map out visual hierarchy before final copy was approved. This led to Lorem Ipsum being hardcoded into early design software like Aldus PageMaker.'
              }
            ],
            questions: [
              {
                id: 'rq-1',
                order: 1,
                type: 'multiple_choice',
                prompt: 'According to Paragraph A, what was the original purpose of scrambling the 1914 Cicero translation?',
                options: [
                  'To create dummy text for Letraset Body Type sheets',
                  'To publish an academic translation of Latin literature',
                  'To teach typography apprentices how to set type',
                  'To hide confidential printing technology from competitors'
                ],
                correctAnswer: 'To create dummy text for Letraset Body Type sheets',
                explanation: 'Đoạn A nói rõ: "scrambled it to make dummy text for Letraset\'s Body Type sheets".',
                paragraphRef: 'A',
                points: 1
              },
              {
                id: 'rq-2',
                order: 2,
                type: 'true_false_not_given',
                prompt: 'Lorem Ipsum was invented in the 21st century by modern digital web designers.',
                correctAnswer: 'FALSE',
                explanation: 'Đoạn A và C khẳng định Lorem Ipsum có nguồn gốc từ năm 1500 và văn học Latin năm 45 BC, nên phát biểu này là FALSE.',
                paragraphRef: 'C',
                points: 1
              },
              {
                id: 'rq-3',
                order: 3,
                type: 'gap_fill',
                prompt: 'Richard McClintock was a professor of [ _____ ] at Hampden-Sydney College.',
                correctAnswer: 'Latin',
                explanation: 'Đoạn C đề cập: "Richard McClintock, a Latin professor at Hampden-Sydney College".',
                paragraphRef: 'C',
                points: 1,
                wordLimit: 1
              }
            ]
          },
          listening: {
            audioTitle: '',
            audioUrl: '',
            audioDurationSeconds: 1800,
            playbackLimit: 'single',
            transcript: '',
            hideTranscriptUntilGraded: true,
            activeSection: 'section1',
            questions: [],
            enableAiDistractorCheck: true,
            aiInstruction: ''
          }
        };

      case '4': // HW-04 Listening
        return {
          id: '4',
          code: 'HW-04',
          title: 'IELTS Listening Practice: Campus Life & Renewable Energy Seminar',
          skill: 'listening',
          className: 'ENG-IELTS-6.5A',
          startDate: '2026-03-08T08:00',
          dueDate: '2026-03-15T21:00',
          durationMinutes: 30,
          allowLate: true,
          status: 'closed',
          targetAudience: 'all',
          notifyStudents: true,
          writing: {
            taskType: 'task2',
            promptText: '',
            minWords: 250,
            scale: '9.0',
            rubrics: { tr: 25, cc: 25, lr: 25, gra: 25 },
            enableAi: true,
            aiInstruction: '',
            enablePlagiarismCheck: true,
            modelAnswer: '',
            attachments: []
          },
          speaking: {
            partType: 'part2',
            cueCardTopic: '',
            cueCardBullets: [],
            prepTimeSeconds: 60,
            speakingTimeSeconds: 120,
            maxRetries: 1,
            followUpQuestions: [],
            rubrics: { fc: 25, lr: 25, gra: 25, pr: 25 },
            enableAi: true,
            aiModel: 'Whisper V3',
            aiInstruction: ''
          },
          reading: {
            passageTitle: '',
            passageSubtitle: '',
            passageSource: '',
            paragraphs: [],
            questions: [],
            timeLimitMinutes: 20,
            enableAiExplanation: true,
            aiInstruction: ''
          },
          listening: {
            audioTitle: 'Cambridge_15_Test1_Listening_Full.mp3',
            audioUrl: 'https://cdn.englishhub.edu.vn/audio/listening/cam15-test1.mp3',
            audioDurationSeconds: 1800,
            playbackLimit: 'single',
            transcript: `[00:15] Narrator: Section 1. You will hear a conversation between a student and a campus housing officer.
[00:45] Officer: Good morning, welcome to the university housing administration. How can I assist you today?
[01:05] Student: Hello, I would like to inquire about accommodation near Central Park campus.
[01:25] Officer: Certainly. Could you please state your full name and intended duration of stay?
[02:10] Student: My name is Alice Johnson, and I will be staying for 2 semesters starting September.`,
            hideTranscriptUntilGraded: true,
            activeSection: 'section1',
            enableAiDistractorCheck: true,
            aiInstruction: 'Lưu ý người nói có sửa thông tin về thời gian thuê phòng từ 1 kỳ thành 2 kỳ.',
            questions: [
              {
                id: 'lq-1',
                order: 1,
                section: 'section1',
                type: 'form_completion',
                prompt: 'Name of applicant: [ Alice Johnson ]',
                correctAnswer: 'Alice Johnson',
                acceptableAnswers: ['alice johnson', 'Johnson, Alice'],
                timestampClue: '02:10',
                points: 1
              },
              {
                id: 'lq-2',
                order: 2,
                section: 'section1',
                type: 'form_completion',
                prompt: 'Preferred location near: [ _____ ] campus',
                correctAnswer: 'Central Park',
                acceptableAnswers: ['central park', 'The Central Park'],
                timestampClue: '01:05',
                points: 1
              },
              {
                id: 'lq-3',
                order: 3,
                section: 'section1',
                type: 'form_completion',
                prompt: 'Duration of accommodation requested: [ _____ ] semesters',
                correctAnswer: '2',
                acceptableAnswers: ['two', '2 semesters'],
                timestampClue: '02:10',
                points: 1
              }
            ]
          }
        };

      default: // Default: HW-01 or HW-05 Writing Task 2
        return {
          id: assignmentId || '1',
          code: assignmentId === '5' ? 'HW-05' : 'HW-01',
          title: assignmentId === '5' 
            ? 'IELTS Writing Task 1: Comparative Bar Chart on Carbon Emissions'
            : 'IELTS Writing Task 2: Artificial Intelligence & Workforce Evolution',
          skill: 'writing',
          className: 'ENG-IELTS-6.5A',
          startDate: '2026-03-15T08:00',
          dueDate: '2026-03-22T23:59',
          durationMinutes: 60,
          allowLate: true,
          status: 'active',
          targetAudience: 'all',
          notifyStudents: true,
          maxSubmissions: 3,
          writing: {
            taskType: assignmentId === '5' ? 'task1' : 'task2',
            promptText: assignmentId === '5'
              ? 'The chart below gives information about global carbon emissions in metric gigatons across six economic sectors between 2000 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. (Write at least 150 words).'
              : 'The rapid development of artificial intelligence and machine automation is poised to transform the global workforce. Some argue that AI will eliminate millions of traditional jobs, while others believe it will create new employment opportunities. Discuss both views and give your own opinion. (Write at least 250 words).',
            minWords: assignmentId === '5' ? 150 : 250,
            scale: '9.0',
            rubrics: { tr: 25, cc: 25, lr: 25, gra: 25 },
            enableAi: true,
            aiInstruction: 'Khắt khe với các lỗi diễn đạt chung chung (vague generalisations); ưu tiên phát hiện câu phức và cấu trúc đảo ngữ (inversion).',
            enablePlagiarismCheck: true,
            modelAnswer: 'In contemporary society, the relentless advancement of artificial intelligence (AI) has sparked intense deliberation concerning the future landscape of the global labour market...',
            chartImageUrl: assignmentId === '5' ? 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' : undefined,
            attachments: [
              {
                id: 'att-1',
                name: 'IELTS_Writing_Task2_Topic_Sheet.pdf',
                size: '1.2 MB',
                extension: 'pdf'
              },
              {
                id: 'att-2',
                name: 'Official_IELTS_Band_Descriptors.pdf',
                size: '450 KB',
                extension: 'pdf'
              }
            ]
          },
          speaking: {
            partType: 'part2',
            cueCardTopic: 'Describe an AI technology that you find particularly useful.',
            cueCardBullets: ['What the technology is', 'How often you use it', 'Why it is helpful', 'And explain how it impacts your daily routine.'],
            prepTimeSeconds: 60,
            speakingTimeSeconds: 120,
            maxRetries: 3,
            followUpQuestions: [],
            rubrics: { fc: 25, lr: 25, gra: 25, pr: 25 },
            enableAi: true,
            aiModel: 'Whisper V3',
            aiInstruction: ''
          },
          reading: {
            passageTitle: 'The Future of Neural Networks and Computation',
            passageSubtitle: 'Academic Reading Passage 2',
            passageSource: 'Cambridge 18 Academic',
            paragraphs: [],
            questions: [],
            timeLimitMinutes: 20,
            enableAiExplanation: true,
            aiInstruction: ''
          },
          listening: {
            audioTitle: 'Campus Lecture on Robotics',
            audioUrl: '',
            audioDurationSeconds: 1800,
            playbackLimit: 'single',
            transcript: '',
            hideTranscriptUntilGraded: true,
            activeSection: 'section4',
            questions: [],
            enableAiDistractorCheck: true,
            aiInstruction: ''
          }
        };
    }
  };

  const [assignmentData, setAssignmentData] = useState<AssignmentEditorData>(() => getInitialAssignmentData(id));

  // If id changes, update assignment data
  useEffect(() => {
    setAssignmentData(getInitialAssignmentData(id));
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveDraft = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setLastSavedTime(timeStr);
    showToast(isVi ? 'Đã lưu bản nháp bài tập thành công!' : 'Assignment draft saved successfully!');
  };

  const handleSaveAndPublish = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setLastSavedTime(timeStr);
    showToast(isVi ? 'Cập nhật và xuất bản bài tập thành công!' : 'Assignment updated and published successfully!');
    setTimeout(() => {
      navigate('/teacher/assignments');
    }, 1200);
  };

  const handleSkillChange = (newSkill: AssignmentSkill) => {
    setAssignmentData(prev => ({ ...prev, skill: newSkill }));
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
          {isVi ? 'Chỉnh sửa bài tập: ' : 'Edit Assignment: '} {assignmentData.code}
        </span>
      </div>

      {/* Main Header Row */}
      <div className="assignment-edit-header">
        <div className="assignment-edit-title-wrap">
          <div className="assignment-edit-title-row">
            <span className="assignment-edit-code-badge">{assignmentData.code}</span>
            <input 
              type="text" 
              className="assignment-edit-title-input"
              value={assignmentData.title}
              onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
              placeholder={isVi ? 'Nhập tiêu đề bài tập...' : 'Enter assignment title...'}
            />
          </div>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
            {isVi 
              ? 'Tùy chỉnh nội dung đề thi, tài liệu đính kèm, rubric chấm điểm AI và thiết lập hạn nộp cho lớp học.'
              : 'Customize assignment instructions, attachments, AI rubrics, and scheduling constraints.'}
          </p>
        </div>

        {/* Status indicator & class badge */}
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
            <option value="ENG-IELTS-6.5A">Lớp: ENG-IELTS-6.5A</option>
            <option value="ENG-GRAM-ADV">Lớp: ENG-GRAM-ADV</option>
            <option value="ENG-TOEIC-750">Lớp: ENG-TOEIC-750</option>
          </select>

          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            backgroundColor: assignmentData.status === 'active' ? '#dcfce7' : assignmentData.status === 'draft' ? '#f1f5f9' : '#fee2e2',
            color: assignmentData.status === 'active' ? '#15803d' : assignmentData.status === 'draft' ? '#475569' : '#b91c1c',
            fontWeight: 700,
            fontSize: '12.5px'
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: assignmentData.status === 'active' ? '#16a34a' : assignmentData.status === 'draft' ? '#64748b' : '#ef4444' 
            }}></span>
            {assignmentData.status === 'active' ? (isVi ? 'Đang mở (Active)' : 'Active') : assignmentData.status === 'draft' ? (isVi ? 'Bản nháp (Draft)' : 'Draft') : (isVi ? 'Đã đóng (Closed)' : 'Closed')}
          </div>
        </div>
      </div>

      {/* 4 Skills Navigation Tabs */}
      <div className="skill-tabs-nav">
        <button 
          type="button"
          className={`skill-tab-btn ${assignmentData.skill === 'writing' ? 'active-writing' : ''}`}
          onClick={() => handleSkillChange('writing')}
        >
          <PenTool size={16} />
          <span>Writing (Kỹ năng Viết)</span>
        </button>

        <button 
          type="button"
          className={`skill-tab-btn ${assignmentData.skill === 'speaking' ? 'active-speaking' : ''}`}
          onClick={() => handleSkillChange('speaking')}
        >
          <Mic size={16} />
          <span>Speaking (Kỹ năng Nói)</span>
        </button>

        <button 
          type="button"
          className={`skill-tab-btn ${assignmentData.skill === 'reading' ? 'active-reading' : ''}`}
          onClick={() => handleSkillChange('reading')}
        >
          <BookOpen size={16} />
          <span>Reading (Kỹ năng Đọc)</span>
        </button>

        <button 
          type="button"
          className={`skill-tab-btn ${assignmentData.skill === 'listening' ? 'active-listening' : ''}`}
          onClick={() => handleSkillChange('listening')}
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
          {/* Schedule & Due Date */}
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
                    {isVi ? 'Tối đa trễ 24 giờ sau deadline (tự động gắn cờ Nộp muộn).' : 'Max 24h grace period.'}
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
                  {isVi ? 'phút (để trống nếu không giới hạn)' : 'minutes'}
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
                  {isVi ? 'Chỉ định nhóm học viên cần luyện thêm' : 'Specific student group'}
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

          {/* Quick Stats Summary Card */}
          <section className="edit-card" style={{ backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Users size={18} color="#2563eb" />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {isVi ? 'Thống Kê Lớp Học' : 'Turnout Metrics'}
              </h4>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>{isVi ? 'Sĩ số lớp:' : 'Class size:'}</span>
              <strong style={{ color: '#0f172a' }}>24 học viên</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>{isVi ? 'Số bài đã nộp:' : 'Submitted:'}</span>
              <strong style={{ color: '#16a34a' }}>22 bài (91.6%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0' }}>
              <span style={{ color: '#64748b' }}>{isVi ? 'Điểm trung bình:' : 'Avg Band:'}</span>
              <strong style={{ color: '#2563eb' }}>6.8 IELTS</strong>
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
            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              {isVi ? `Đã lưu tự động lúc ${lastSavedTime}` : `Auto-saved at ${lastSavedTime}`}
            </span>

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
              onClick={handleSaveAndPublish}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px' }}
            >
              <Send size={14} />
              <span>{isVi ? 'Cập nhật & Xuất bản' : 'Save & Publish'}</span>
            </button>
          </div>
        }
      />

      {/* Student View Interactive Preview Modal */}
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

export default TeacherEditAssignment;
