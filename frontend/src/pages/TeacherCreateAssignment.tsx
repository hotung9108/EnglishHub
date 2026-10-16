import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, PenTool, Mic, BookOpen, Headphones, 
  Eye, Save, Send, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentSkill as ApiSkill } from '../api/services/assignment.service';
import { moduleService } from '../api/services/module.service';
import { 
  questionService, 
  buildMcqPayload, 
  buildShortAnswerPayload 
} from '../api/services/question.service';
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

  const queryClassId = searchParams.get('classId') || searchParams.get('class');

  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(queryClassId ? Number(queryClassId) : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [assignmentData, setAssignmentData] = useState<AssignmentEditorData>(() => ({
    id: `new-${Date.now()}`,
    code: initialSkill === 'speaking' ? 'HW-SP' : initialSkill === 'reading' ? 'HW-RD' : initialSkill === 'listening' ? 'HW-LS' : 'HW-WR',
    title: '',
    skill: initialSkill,
    className: '',
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
      promptText: '',
      minWords: 250,
      scale: '10',
      rubrics: { tr: 25, cc: 25, lr: 25, gra: 25 },
      enableAi: true,
      aiInstruction: '',
      enablePlagiarismCheck: true,
      modelAnswer: '',
      attachments: []
    },
    speaking: {
      promptText: '',
      aiInstruction: '',
      partType: 'part2',
      cueCardTopic: '',
      cueCardBullets: [],
      prepTimeSeconds: 60,
      speakingTimeSeconds: 120,
      maxRetries: 3,
      examinerSampleAudioUrl: '',
      examinerTranscript: '',
      followUpQuestions: [],
      rubrics: { fc: 25, lr: 25, gra: 25, pr: 25 },
      enableAi: true,
      aiModel: 'Whisper V3 Large'
    },
    reading: {
      passageTitle: '',
      passageContent: '',
      questions: []
    },
    listening: {
      audioUrl: '',
      transcript: '',
      questions: []
    }
  }));

  // Fetch classes from backend
  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const res = await classService.list({ limit: 100 });
        const list = res.data || [];
        if (isMounted) {
          setClasses(list);
          if (list.length > 0) {
            const initialId = queryClassId ? Number(queryClassId) : list[0].id;
            setSelectedClassId(initialId);
            const matched = list.find((c) => c.id === initialId) || list[0];
            setAssignmentData((prev) => ({ ...prev, className: matched.name }));
          }
        }
      } catch (err) {
        console.error('Failed to load classes for assignment creation:', err);
      }
    };
    fetchClasses();
    return () => { isMounted = false; };
  }, [queryClassId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClassSelectionChange = (classIdNum: number) => {
    setSelectedClassId(classIdNum);
    const matched = classes.find((c) => c.id === classIdNum);
    if (matched) {
      setAssignmentData((prev) => ({ ...prev, className: matched.name }));
    }
  };

  const getInstructionsFor = (skill: AssignmentSkill): string => {
    switch (skill) {
      case 'writing':
        return assignmentData.writing.promptText.trim();
      case 'speaking':
        return (assignmentData.speaking.promptText || assignmentData.speaking.cueCardTopic || '').trim();
      case 'reading': {
        const pTitle = assignmentData.reading.passageTitle.trim();
        const pContent = (assignmentData.reading.passageContent 
          || assignmentData.reading.paragraphs?.map(p => p.content).join('\n\n') 
          || '').trim();
        return pTitle ? `${pTitle}\n\n${pContent}` : pContent;
      }
      case 'listening':
        return (assignmentData.listening.transcript || assignmentData.listening.audioTitle || '').trim();
      default:
        return '';
    }
  };

  const isSkillConfigured = (skill: AssignmentSkill): boolean => {
    switch (skill) {
      case 'writing':
        return Boolean(assignmentData.writing.promptText.trim());
      case 'speaking':
        return Boolean((assignmentData.speaking.promptText || assignmentData.speaking.cueCardTopic || '').trim());
      case 'reading':
        return Boolean(
          assignmentData.reading.passageTitle.trim() ||
          assignmentData.reading.passageContent?.trim() ||
          assignmentData.reading.paragraphs?.some(p => p.content.trim()) ||
          assignmentData.reading.questions.length > 0
        );
      case 'listening':
        return Boolean(
          assignmentData.listening.audioFile ||
          assignmentData.listening.audioUrl?.trim() ||
          assignmentData.listening.transcript?.trim() ||
          assignmentData.listening.questions.length > 0
        );
      default:
        return false;
    }
  };

  const executeCreateAssignment = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!selectedClassId) {
      showToast(isVi ? 'Vui lòng chọn lớp học trước khi tạo đề!' : 'Please select a class!');
      return;
    }

    if (!assignmentData.title.trim()) {
      showToast(isVi ? 'Tiêu đề bài tập không được để trống!' : 'Title cannot be empty!');
      return;
    }

    const allSkills: AssignmentSkill[] = ['writing', 'speaking', 'reading', 'listening'];
    const configuredSkills = allSkills.filter(isSkillConfigured);
    const targetSkills = configuredSkills.length > 0 ? configuredSkills : [assignmentData.skill];

    // Validation for each target skill
    for (const skill of targetSkills) {
      if (skill === 'writing') {
        if (!assignmentData.writing.promptText.trim()) {
          setAssignmentData((prev) => ({ ...prev, skill: 'writing' }));
          showToast(isVi ? 'Nội dung đề bài Writing không được để trống!' : 'Writing prompt cannot be empty!');
          return;
        }
      } else if (skill === 'speaking') {
        const spPrompt = (assignmentData.speaking.promptText || assignmentData.speaking.cueCardTopic || '').trim();
        if (!spPrompt) {
          setAssignmentData((prev) => ({ ...prev, skill: 'speaking' }));
          showToast(isVi ? 'Nội dung đề bài Speaking không được để trống!' : 'Speaking prompt cannot be empty!');
          return;
        }
      } else if (skill === 'reading') {
        if (!assignmentData.reading.passageTitle.trim()) {
          setAssignmentData((prev) => ({ ...prev, skill: 'reading' }));
          showToast(isVi ? 'Tiêu đề bài đọc không được để trống!' : 'Passage title cannot be empty!');
          return;
        }
        const pContent = (assignmentData.reading.passageContent 
          || assignmentData.reading.paragraphs?.map(p => p.content).join('\n\n') 
          || '').trim();
        if (!pContent) {
          setAssignmentData((prev) => ({ ...prev, skill: 'reading' }));
          showToast(isVi ? 'Nội dung văn bản bài đọc không được để trống!' : 'Passage content cannot be empty!');
          return;
        }
        const qList = assignmentData.reading.questions;
        if (qList.length === 0) {
          setAssignmentData((prev) => ({ ...prev, skill: 'reading' }));
          showToast(isVi ? 'Vui lòng tạo ít nhất 1 câu hỏi cho bài đọc!' : 'Please add at least 1 question for the reading assignment!');
          return;
        }
        for (let i = 0; i < qList.length; i++) {
          if (!qList[i].prompt.trim()) {
            setAssignmentData((prev) => ({ ...prev, skill: 'reading' }));
            showToast(isVi ? `Nội dung câu hỏi Reading #${i + 1} không được để trống!` : `Reading question #${i + 1} statement cannot be empty!`);
            return;
          }
          if (qList[i].type === 'short_answer' && !qList[i].correctAnswer.trim()) {
            setAssignmentData((prev) => ({ ...prev, skill: 'reading' }));
            showToast(isVi ? `Đáp án chính xác cho câu hỏi Reading #${i + 1} không được để trống!` : `Correct answer for reading question #${i + 1} cannot be empty!`);
            return;
          }
        }
      } else if (skill === 'listening') {
        if (!assignmentData.listening.audioFile && !assignmentData.listening.audioUrl?.trim()) {
          setAssignmentData((prev) => ({ ...prev, skill: 'listening' }));
          showToast(isVi ? 'Vui lòng chọn tệp âm thanh cho bài nghe!' : 'Please select an audio file for the listening assignment!');
          return;
        }
        const qList = assignmentData.listening.questions;
        if (qList.length === 0) {
          setAssignmentData((prev) => ({ ...prev, skill: 'listening' }));
          showToast(isVi ? 'Vui lòng tạo ít nhất 1 câu hỏi cho bài nghe!' : 'Please add at least 1 question for the listening assignment!');
          return;
        }
        for (let i = 0; i < qList.length; i++) {
          if (!qList[i].prompt.trim()) {
            setAssignmentData((prev) => ({ ...prev, skill: 'listening' }));
            showToast(isVi ? `Nội dung câu hỏi Listening #${i + 1} không được để trống!` : `Listening question #${i + 1} statement cannot be empty!`);
            return;
          }
          if (qList[i].type === 'short_answer' && !qList[i].correctAnswer.trim()) {
            setAssignmentData((prev) => ({ ...prev, skill: 'listening' }));
            showToast(isVi ? `Đáp án chính xác cho câu hỏi Listening #${i + 1} không được để trống!` : `Correct answer for listening question #${i + 1} cannot be empty!`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      const openDate = assignmentData.startDate 
        ? new Date(assignmentData.startDate).toISOString() 
        : new Date().toISOString();
      const closeDate = assignmentData.dueDate 
        ? new Date(assignmentData.dueDate).toISOString() 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const mainDescription = targetSkills.length === 1
        ? getInstructionsFor(targetSkills[0])
        : targetSkills.map((s) => `[${s.toUpperCase()}]: ${getInstructionsFor(s)}`).join('\n\n');

      // 1. Create assignment on backend
      const res = await assignmentService.createAssignment(selectedClassId, {
        title: assignmentData.title,
        description: mainDescription,
        openAt: openDate,
        closeAt: closeDate,
        maxSubmissions: assignmentData.maxSubmissions ?? 1
      });

      const newAssignmentId = res.id;

      // 2. Create corresponding modules sequentially
      const apiSkillMap: Record<AssignmentSkill, ApiSkill> = {
        writing: 'WRITING',
        speaking: 'SPEAKING',
        reading: 'READING',
        listening: 'LISTENING'
      };

      const taskTypeMap: Record<AssignmentSkill, 'ESSAY' | 'RECORDING' | 'QUIZ'> = {
        writing: 'ESSAY',
        speaking: 'RECORDING',
        reading: 'QUIZ',
        listening: 'QUIZ'
      };

      for (let sIdx = 0; sIdx < targetSkills.length; sIdx++) {
        const skill = targetSkills[sIdx];
        const orderIndex = sIdx + 1;
        const instructions = getInstructionsFor(skill);
        const aiInstruction = skill === 'writing'
          ? (assignmentData.writing.aiInstruction || undefined)
          : skill === 'speaking'
          ? (assignmentData.speaking.aiInstruction || undefined)
          : undefined;

        let createdModuleId: number | null = null;
        try {
          const modRes = await moduleService.createModule(newAssignmentId, {
            skill: apiSkillMap[skill],
            taskType: taskTypeMap[skill],
            orderIndex,
            instructions,
            aiInstruction,
            maxScore: 10
          });
          createdModuleId = modRes.id;
        } catch (modErr) {
          console.warn(`Module creation fallback for ${skill}:`, modErr);
        }

        // Upload audio file if skill is listening
        if (createdModuleId && skill === 'listening' && assignmentData.listening.audioFile) {
          try {
            await moduleService.uploadAudio(createdModuleId, assignmentData.listening.audioFile);
          } catch (audioErr) {
            console.error('Failed to upload audio file:', audioErr);
            showToast(isVi ? 'Không thể tải lên tệp âm thanh bài nghe. Vui lòng thử lại!' : 'Failed to upload audio file!');
            throw audioErr;
          }
        }

        // Create questions for reading / listening
        if (createdModuleId) {
          if (skill === 'reading') {
            const readingQuestions = assignmentData.reading.questions;
            for (let i = 0; i < readingQuestions.length; i++) {
              const q = readingQuestions[i];
              const payload = q.type === 'multiple_choice'
                ? buildMcqPayload({
                    content: q.prompt,
                    options: q.options,
                    correctOptionIndexOrText: q.correctAnswer,
                    score: q.points,
                    orderIndex: i + 1,
                  })
                : buildShortAnswerPayload({
                    content: q.prompt,
                    answerText: q.correctAnswer,
                    score: q.points,
                    orderIndex: i + 1,
                  });
              await questionService.createQuestion(createdModuleId, payload);
            }
          } else if (skill === 'listening') {
            const listeningQuestions = assignmentData.listening.questions;
            for (let i = 0; i < listeningQuestions.length; i++) {
              const q = listeningQuestions[i];
              const payload = q.type === 'multiple_choice'
                ? buildMcqPayload({
                    content: q.prompt,
                    options: q.options,
                    correctOptionIndexOrText: q.correctAnswer,
                    score: q.points,
                    orderIndex: i + 1,
                  })
                : buildShortAnswerPayload({
                    content: q.prompt,
                    answerText: q.correctAnswer,
                    score: q.points,
                    orderIndex: i + 1,
                  });
              await questionService.createQuestion(createdModuleId, payload);
            }
          }
        }
      }

      // If status is PUBLISHED and backend requires explicit publish
      if (status === 'PUBLISHED') {
        try {
          await assignmentService.updateAssignmentStatus(newAssignmentId, 'PUBLISHED');
        } catch {
          // Status might already be active
        }
      }

      showToast(isVi 
        ? (status === 'PUBLISHED' ? 'Giao bài tập mới thành công!' : 'Đã lưu bản nháp bài tập mới!') 
        : (status === 'PUBLISHED' ? 'Assignment published successfully!' : 'Assignment draft saved!'));

      setTimeout(() => {
        navigate('/teacher/assignments');
      }, 1000);
    } catch (err) {
      console.error('Failed to create assignment:', err);
      showToast(isVi ? 'Có lỗi xảy ra khi tạo bài tập. Vui lòng thử lại!' : 'Failed to create assignment. Please try again!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    executeCreateAssignment('DRAFT');
  };

  const handlePublish = () => {
    executeCreateAssignment('PUBLISHED');
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
        <span>{assignmentData.className || (isVi ? 'Chọn lớp học' : 'Class')}</span>
        <span>/</span>
        <span style={{ fontWeight: 700, color: 'var(--on-surface, #111827)' }}>
          {isVi ? 'Giao bài tập mới' : 'Create New Assignment'}
        </span>
      </div>

      {/* Header */}
      <div className="assignment-edit-header">
        <input 
          type="text" 
          className="assignment-edit-title-input"
          value={assignmentData.title}
          onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
          placeholder={isVi ? 'Nhập tiêu đề bài tập mới...' : 'Enter new assignment title...'}
        />

        <select 
          value={selectedClassId ? String(selectedClassId) : ''}
          onChange={(e) => handleClassSelectionChange(Number(e.target.value))}
          className="select-input font-semibold text-sm"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {isVi ? `Lớp: ${c.name}` : `Class: ${c.name}`}
            </option>
          ))}
        </select>
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
              <div>
                <h3 className="edit-card-title">{isVi ? 'Lịch Nộp Bài' : 'Schedule & Due Date'}</h3>
                <p className="edit-card-desc">{isVi ? 'Thời gian mở đề và hạn nộp.' : 'Open time and due date.'}</p>
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

            <div className="edit-form-group" style={{ marginBottom: 0 }}>
              <label className="edit-form-label">{isVi ? 'Số lần nộp tối đa' : 'Max Submissions'}</label>
              <input 
                type="number" 
                min={1}
                max={10}
                className="edit-form-input" 
                value={assignmentData.maxSubmissions ?? 1}
                onChange={(e) => setAssignmentData({ ...assignmentData, maxSubmissions: parseInt(e.target.value) || 1 })}
                style={{ width: '90px' }}
              />
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
              disabled={isSubmitting}
              onClick={handleSaveDraft}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} />
              <span>{isVi ? 'Lưu bản nháp' : 'Save Draft'}</span>
            </button>

            <button 
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isSubmitting}
              onClick={handlePublish}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px' }}
            >
              {isSubmitting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>{isSubmitting ? (isVi ? 'Đang giao bài...' : 'Publishing...') : (isVi ? 'Giao bài tập' : 'Create & Publish')}</span>
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
