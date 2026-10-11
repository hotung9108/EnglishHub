import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, PenTool, Mic, BookOpen, Headphones, 
  Calendar, Eye, Save, Send, CheckCircle2, Users, Bell,
  RefreshCw, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentDetail, type AssignmentStatus, type AssignmentSkill as ApiSkill } from '../api/services/assignment.service';
import { moduleService, type ModuleSummary } from '../api/services/module.service';
import { submissionService } from '../api/services/submission.service';
import { 
  questionService, 
  buildMcqPayload, 
  buildShortAnswerPayload, 
  extractMcqOptions, 
  extractShortAnswerText,
  type QuestionResponse 
} from '../api/services/question.service';
import type { 
  AssignmentEditorData, AssignmentSkill, ReadingQuestionItem, ListeningQuestionItem 
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

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Preview Modal state & toast
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Class & Stats
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [turnoutStats, setTurnoutStats] = useState<{ total: number; submitted: number }>({ total: 0, submitted: 0 });
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);

  // Assignment Editor state
  const [assignmentData, setAssignmentData] = useState<AssignmentEditorData>(() => ({
    id: id || '1',
    code: `HW-${(id || '1').padStart(2, '0')}`,
    title: '',
    skill: 'writing',
    className: '',
    startDate: new Date().toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    durationMinutes: 60,
    allowLate: true,
    status: 'active',
    targetAudience: 'all',
    notifyStudents: true,
    maxSubmissions: 3,
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
      maxRetries: 3,
      examinerSampleAudioUrl: '',
      examinerTranscript: '',
      followUpQuestions: [],
      rubrics: { fc: 25, lr: 25, gra: 25, pr: 25 },
      enableAi: true,
      aiModel: 'Whisper V3 Speech Diagnostic',
      aiInstruction: ''
    },
    reading: {
      passageTitle: '',
      passageSubtitle: '',
      passageSource: '',
      timeLimitMinutes: 20,
      enableAiExplanation: true,
      aiInstruction: '',
      paragraphs: [],
      questions: []
    },
    listening: {
      audioTitle: '',
      audioUrl: '',
      audioDurationSeconds: 1200,
      playbackLimit: 'single',
      transcript: '',
      hideTranscriptUntilGraded: true,
      activeSection: 'section1',
      enableAiDistractorCheck: true,
      aiInstruction: '',
      questions: []
    }
  }));

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const [currentDbStatus, setCurrentDbStatus] = useState<AssignmentStatus>('DRAFT');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const loadAssignmentData = async () => {
      try {
        const assignmentIdNum = Number(id);

      // 1. Fetch assignment details
      const detail: AssignmentDetail = await assignmentService.getAssignment(assignmentIdNum);
      if (isMounted) {
        setCurrentDbStatus(detail.status);
      }
      
      // 2. Fetch classes
      const classRes = await classService.list({ limit: 100 });
      const classList = classRes.data || [];
      setClasses(classList);

      // Find which class contains this assignment
      let matchedClass: ClassSummary | undefined = undefined;
      for (const cls of classList) {
        try {
          const assignList = await assignmentService.listAssignments(cls.id, { limit: 100 });
          if (assignList.data?.some((a) => a.id === assignmentIdNum)) {
            matchedClass = cls;
            break;
          }
        } catch {
          // ignore
        }
      }

      if (matchedClass) {
        setSelectedClassId(matchedClass.id);
        try {
          const members = await classService.listMembers(matchedClass.id);
          const subs = await submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 });
          setTurnoutStats({
            total: members.length,
            submitted: subs.data?.length || 0
          });
        } catch {
          // Fallback
        }
      }

      // 3. Fetch modules
      let modules: ModuleSummary[] = [];
      try {
        const modRes = await moduleService.listModules(assignmentIdNum);
        modules = modRes.modules || modRes.data || [];
      } catch {
        modules = [];
      }

      if (modules.length === 0 && detail.modules && detail.modules.length > 0) {
        modules = detail.modules.map(m => ({
          id: m.id,
          skill: m.skill,
          taskType: 'QUIZ',
          orderIndex: 1,
          maxScore: 10,
          hasAudio: false,
        }));
      }

      let detectedSkill: AssignmentSkill = 'writing';
      let instructionsText = '';

      let loadedReadingQuestions: ReadingQuestionItem[] | null = null;
      let loadedListeningQuestions: ListeningQuestionItem[] | null = null;

      if (modules.length > 0) {
        const firstMod = modules[0];
        setActiveModuleId(firstMod.id);
        const modSkill = firstMod.skill?.toLowerCase();
        if (modSkill?.includes('speak')) detectedSkill = 'speaking';
        else if (modSkill?.includes('read')) detectedSkill = 'reading';
        else if (modSkill?.includes('listen')) detectedSkill = 'listening';
        else detectedSkill = 'writing';

        try {
          const modDetail = await moduleService.getModule(firstMod.id);
          instructionsText = modDetail.instructions || '';
        } catch {
          instructionsText = '';
        }

        // Fetch questions for Reading / Listening
        if (detectedSkill === 'reading' || detectedSkill === 'listening') {
          try {
            const qRes = await questionService.listQuestions(firstMod.id);
            const fetchedQuestions = qRes.questions || [];

            if (detectedSkill === 'reading' && fetchedQuestions.length > 0) {
              loadedReadingQuestions = fetchedQuestions.map((q, idx) => {
                const isMcq = q.questionType === 'MULTIPLE_CHOICE';
                const mcq = isMcq ? extractMcqOptions(q.correctAnswer) : null;
                const shortAns = !isMcq ? extractShortAnswerText(q.correctAnswer) : '';
                return {
                  id: String(q.id),
                  order: q.orderIndex || idx + 1,
                  type: isMcq ? 'multiple_choice' : 'gap_fill',
                  prompt: q.content,
                  options: mcq ? mcq.options : undefined,
                  correctAnswer: isMcq ? (mcq ? mcq.correctOptionContent : '') : shortAns,
                  paragraphRef: 'A',
                  points: Number(q.score) || 1,
                };
              });
            } else if (detectedSkill === 'listening' && fetchedQuestions.length > 0) {
              loadedListeningQuestions = fetchedQuestions.map((q, idx) => {
                const isMcq = q.questionType === 'MULTIPLE_CHOICE';
                const mcq = isMcq ? extractMcqOptions(q.correctAnswer) : null;
                const shortAns = !isMcq ? extractShortAnswerText(q.correctAnswer) : '';
                return {
                  id: String(q.id),
                  order: q.orderIndex || idx + 1,
                  section: 'section1',
                  type: isMcq ? 'multiple_choice' : 'short_answer',
                  prompt: q.content,
                  options: mcq ? mcq.options : undefined,
                  correctAnswer: isMcq ? (mcq ? mcq.correctOptionContent : '') : shortAns,
                  points: Number(q.score) || 1,
                };
              });
            }
          } catch (qErr) {
            console.warn('Failed to load questions for module:', qErr);
          }
        }
      }

      const statusMap: Record<AssignmentStatus, 'active' | 'draft' | 'closed'> = {
        PUBLISHED: 'active',
        DRAFT: 'draft',
        CLOSED: 'closed'
      };

      setAssignmentData((prev) => ({
        ...prev,
        id: String(detail.id),
        code: `HW-${detail.id.toString().padStart(2, '0')}`,
        title: detail.title,
        skill: detectedSkill,
        className: matchedClass ? matchedClass.name : (classList[0]?.name || 'Lớp tiếng Anh'),
        status: statusMap[detail.status] || 'active',
        writing: {
          ...prev.writing,
          promptText: instructionsText || prev.writing.promptText
        },
        speaking: {
          ...prev.speaking,
          cueCardTopic: instructionsText || prev.speaking.cueCardTopic
        },
        reading: {
          ...prev.reading,
          passageTitle: instructionsText ? instructionsText.slice(0, 80) : prev.reading.passageTitle,
          questions: loadedReadingQuestions || prev.reading.questions
        },
        listening: {
          ...prev.listening,
          transcript: instructionsText || prev.listening.transcript,
          questions: loadedListeningQuestions || prev.listening.questions
        }
      }));
    } catch (err) {
      console.error('Failed to load assignment detail for edit:', err);
      if (isMounted) {
        setError(isVi ? 'Không thể tải thông tin bài tập. Vui lòng thử lại.' : 'Failed to load assignment details. Please retry.');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  loadAssignmentData();

  return () => {
    isMounted = false;
  };
}, [id, isVi, reloadKey]);

  const saveAssignmentChanges = async (publishStatus?: AssignmentStatus) => {
    if (!id) return;

    // Validation for Reading/Listening questions
    if (assignmentData.skill === 'reading') {
      const qList = assignmentData.reading.questions;
      if (qList.length === 0) {
        showToast(isVi ? 'Vui lòng tạo ít nhất 1 câu hỏi cho bài đọc!' : 'Please add at least 1 question for the reading assignment!');
        return;
      }
      for (let i = 0; i < qList.length; i++) {
        if (!qList[i].prompt.trim()) {
          showToast(isVi ? `Nội dung câu hỏi #${i + 1} không được để trống!` : `Question #${i + 1} statement cannot be empty!`);
          return;
        }
      }
    } else if (assignmentData.skill === 'listening') {
      const qList = assignmentData.listening.questions;
      if (qList.length === 0) {
        showToast(isVi ? 'Vui lòng tạo ít nhất 1 câu hỏi cho bài nghe!' : 'Please add at least 1 question for the listening assignment!');
        return;
      }
      for (let i = 0; i < qList.length; i++) {
        if (!qList[i].prompt.trim()) {
          showToast(isVi ? `Nội dung câu hỏi #${i + 1} không được để trống!` : `Question #${i + 1} statement cannot be empty!`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const assignmentIdNum = Number(id);

      const openDate = assignmentData.startDate 
        ? new Date(assignmentData.startDate).toISOString() 
        : new Date().toISOString();
      const closeDate = assignmentData.dueDate 
        ? new Date(assignmentData.dueDate).toISOString() 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      let instructions = '';
      if (assignmentData.skill === 'writing') instructions = assignmentData.writing.promptText;
      else if (assignmentData.skill === 'speaking') instructions = assignmentData.speaking.cueCardTopic;
      else if (assignmentData.skill === 'reading') instructions = assignmentData.reading.passageTitle;
      else instructions = assignmentData.listening.transcript;

      // 1. Update assignment
      await assignmentService.updateAssignment(assignmentIdNum, {
        title: assignmentData.title,
        description: instructions,
        openAt: openDate,
        closeAt: closeDate,
        maxSubmissions: assignmentData.maxSubmissions || 3
      });

      // 2. Update status only if changed and the transition is permitted by backend
      if (publishStatus && publishStatus !== currentDbStatus) {
        const isValidTransition =
          (currentDbStatus === 'DRAFT' && publishStatus === 'PUBLISHED') ||
          (currentDbStatus === 'PUBLISHED' && publishStatus === 'CLOSED');

        if (isValidTransition) {
          try {
            await assignmentService.updateAssignmentStatus(assignmentIdNum, publishStatus);
            setCurrentDbStatus(publishStatus);
          } catch (statusErr) {
            console.warn('Status transition failed:', statusErr);
          }
        } else if (currentDbStatus === 'PUBLISHED' && publishStatus === 'DRAFT') {
          showToast(isVi ? 'Bài tập đã xuất bản không thể chuyển về bản nháp!' : 'Published assignment cannot be reverted to draft!');
        }
      }

      // 3. Ensure module exists and is updated
      let targetModuleId = activeModuleId;
      if (targetModuleId) {
        try {
          await moduleService.updateModule(targetModuleId, {
            instructions,
            aiInstruction: assignmentData.writing.aiInstruction || undefined
          });
        } catch {
          // ignore
        }
      } else {
        try {
          const apiSkillMap: Record<AssignmentSkill, ApiSkill> = {
            writing: 'WRITING', speaking: 'SPEAKING', reading: 'READING', listening: 'LISTENING'
          };
          const taskTypeMap: Record<AssignmentSkill, 'ESSAY' | 'RECORDING' | 'QUIZ'> = {
            writing: 'ESSAY', speaking: 'RECORDING', reading: 'QUIZ', listening: 'QUIZ'
          };
          const newMod = await moduleService.createModule(assignmentIdNum, {
            skill: apiSkillMap[assignmentData.skill],
            taskType: taskTypeMap[assignmentData.skill],
            orderIndex: 1,
            instructions,
            aiInstruction: assignmentData.writing.aiInstruction || undefined,
            maxScore: 10
          });
          targetModuleId = newMod.id;
          setActiveModuleId(newMod.id);
        } catch (modErr) {
          console.warn('Fallback module creation:', modErr);
        }
      }

      // 4. Synchronize questions sequentially for Reading / Listening to prevent 409 Lock Contention
      if (targetModuleId && (assignmentData.skill === 'reading' || assignmentData.skill === 'listening')) {
        let existingDbQuestions: QuestionResponse[] = [];
        try {
          const dbRes = await questionService.listQuestions(targetModuleId);
          existingDbQuestions = dbRes.questions || [];
        } catch (dbErr) {
          console.warn('Could not fetch existing DB questions:', dbErr);
        }

        const uiQuestions = assignmentData.skill === 'reading'
          ? assignmentData.reading.questions
          : assignmentData.listening.questions;

        // A. Delete questions removed in UI
        const uiNumericIds = new Set(
          uiQuestions
            .map((q) => Number(q.id))
            .filter((num) => Number.isInteger(num) && num > 0)
        );

        for (const dbQ of existingDbQuestions) {
          if (!uiNumericIds.has(dbQ.id)) {
            try {
              await questionService.deleteQuestion(dbQ.id);
            } catch (delErr: unknown) {
              console.warn(`Could not delete question ${dbQ.id}:`, delErr);
            }
          }
        }

        // B. Sequentially update existing or create new questions
        const updatedQuestionIds: Record<number, string> = {};
        for (let i = 0; i < uiQuestions.length; i++) {
          const q = uiQuestions[i];
          const isExisting = Number.isInteger(Number(q.id)) && Number(q.id) > 0 && existingDbQuestions.some((dbQ) => dbQ.id === Number(q.id));
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

          if (isExisting) {
            await questionService.updateQuestion(Number(q.id), {
              content: payload.content,
              correctAnswer: payload.correctAnswer,
              score: payload.score,
              orderIndex: payload.orderIndex,
            });
          } else {
            const created = await questionService.createQuestion(targetModuleId, payload);
            updatedQuestionIds[i] = String(created.id);
          }
        }

        if (Object.keys(updatedQuestionIds).length > 0) {
          setAssignmentData((prev) => {
            if (prev.skill === 'reading') {
              return {
                ...prev,
                reading: {
                  ...prev.reading,
                  questions: prev.reading.questions.map((item, idx) =>
                    updatedQuestionIds[idx] ? { ...item, id: updatedQuestionIds[idx] } : item
                  ),
                },
              };
            }
            if (prev.skill === 'listening') {
              return {
                ...prev,
                listening: {
                  ...prev.listening,
                  questions: prev.listening.questions.map((item, idx) =>
                    updatedQuestionIds[idx] ? { ...item, id: updatedQuestionIds[idx] } : item
                  ),
                },
              };
            }
            return prev;
          });
        }
      }

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setLastSavedTime(timeStr);

      showToast(isVi ? 'Cập nhật bài tập thành công!' : 'Assignment updated successfully!');
      if (publishStatus !== 'DRAFT') {
        setTimeout(() => navigate('/teacher/assignments'), 1000);
      }
    } catch (err: unknown) {
      console.error('Failed to update assignment:', err);
      const msg = err instanceof Error ? err.message : '';
      showToast(msg ? `Lỗi: ${msg}` : (isVi ? 'Có lỗi xảy ra khi lưu bài tập. Vui lòng thử lại!' : 'Failed to save assignment. Please retry!'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => {
    if (currentDbStatus === 'PUBLISHED') {
      showToast(isVi ? 'Bài tập này đã xuất bản, không thể chuyển về bản nháp.' : 'This assignment is already published.');
      return;
    }
    saveAssignmentChanges('DRAFT');
  };

  const handleSaveAndPublish = () => {
    saveAssignmentChanges(currentDbStatus === 'PUBLISHED' ? undefined : 'PUBLISHED');
  };

  const handleSkillChange = (newSkill: AssignmentSkill) => {
    setAssignmentData((prev) => ({ ...prev, skill: newSkill }));
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '800px', margin: '40px auto' }}>
        <RefreshCw size={36} color="#4f46e5" className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          {isVi ? 'Đang tải thông tin bài tập từ hệ thống...' : 'Loading assignment details...'}
        </h3>
        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          {isVi ? 'Đang đồng bộ nội dung đề bài, hạn nộp và lớp học.' : 'Syncing instructions, deadlines, and classroom.'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertCircle size={24} color="#dc2626" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#b91c1c' }}>{error}</h3>
        </div>
        <button 
          className="btn btn-secondary bg-white btn-sm"
          onClick={handleRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>{isVi ? 'Thử lại' : 'Retry'}</span>
        </button>
      </div>
    );
  }

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
            value={selectedClassId ? String(selectedClassId) : ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedClassId(val);
              const m = classes.find((c) => c.id === val);
              if (m) setAssignmentData((prev) => ({ ...prev, className: m.name }));
            }}
            style={{ 
              padding: '8px 14px', 
              fontSize: '13px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              backgroundColor: '#ffffff',
              fontWeight: 600
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
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
                  disabled={currentDbStatus === 'PUBLISHED'}
                  style={{ 
                    padding: '8px 10px', 
                    borderRadius: '8px', 
                    border: assignmentData.status === 'draft' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: currentDbStatus === 'PUBLISHED' ? '#f8fafc' : assignmentData.status === 'draft' ? '#eff6ff' : '#ffffff',
                    color: currentDbStatus === 'PUBLISHED' ? '#94a3b8' : assignmentData.status === 'draft' ? '#1d4ed8' : '#64748b',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: currentDbStatus === 'PUBLISHED' ? 'not-allowed' : 'pointer',
                    opacity: currentDbStatus === 'PUBLISHED' ? 0.6 : 1
                  }}
                  onClick={() => {
                    if (currentDbStatus === 'PUBLISHED') {
                      showToast(isVi ? 'Bài tập đã xuất bản không thể chuyển về bản nháp.' : 'Published assignment cannot be reverted to draft.');
                      return;
                    }
                    setAssignmentData({ ...assignmentData, status: 'draft' });
                  }}
                  title={currentDbStatus === 'PUBLISHED' ? (isVi ? 'Bài tập đã xuất bản không thể chuyển về bản nháp' : 'Published assignment cannot be reverted to draft') : undefined}
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
                  {isVi ? `Toàn bộ học viên trong lớp (${turnoutStats.total} học viên)` : `All class students (${turnoutStats.total})`}
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
              <strong style={{ color: '#0f172a' }}>{turnoutStats.total} {isVi ? 'học viên' : 'students'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>{isVi ? 'Số bài đã nộp:' : 'Submitted:'}</span>
              <strong style={{ color: '#16a34a' }}>
                {turnoutStats.submitted} {isVi ? 'bài' : 'items'} ({turnoutStats.total > 0 ? Math.round((turnoutStats.submitted / turnoutStats.total) * 100) : 0}%)
              </strong>
            </div>
            {lastSavedTime && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
                {isVi ? `Đã lưu lần cuối: ${lastSavedTime}` : `Last saved at: ${lastSavedTime}`}
              </div>
            )}
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

            {currentDbStatus !== 'PUBLISHED' && (
              <button 
                type="button"
                className="btn btn-secondary bg-white btn-sm"
                disabled={isSaving}
                onClick={handleSaveDraft}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={14} />
                <span>{isVi ? 'Lưu bản nháp' : 'Save Draft'}</span>
              </button>
            )}

            <button 
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isSaving}
              onClick={handleSaveAndPublish}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px' }}
            >
              {isSaving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>
                {isSaving 
                  ? (isVi ? 'Đang lưu...' : 'Saving...') 
                  : currentDbStatus === 'PUBLISHED' 
                    ? (isVi ? 'Lưu thay đổi' : 'Save Changes') 
                    : (isVi ? 'Cập nhật & Xuất bản' : 'Update & Publish')}
              </span>
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

export default TeacherEditAssignment;
