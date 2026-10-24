import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, PenTool, Mic, BookOpen, Headphones, 
  Eye, Save, Send, CheckCircle2,
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
  const [moduleIdsBySkill, setModuleIdsBySkill] = useState<Partial<Record<AssignmentSkill, number>>>({});

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
      aiModel: 'Whisper V3 Speech Diagnostic'
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
      audioUrl: '',
      transcript: '',
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
            submitted: subs.data?.filter((s) => s.status !== 'IN_PROGRESS').length || 0
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
      const skillMap: Partial<Record<AssignmentSkill, number>> = {};
      let writingPrompt = '';
      let writingAiInstruction = '';
      let speakingPrompt = '';
      let speakingAiInstruction = '';
      let readingTitle = '';
      let readingContent = '';
      let readingQuestionsList: ReadingQuestionItem[] = [];
      let listeningAudioUrl = '';
      let listeningTranscript = '';
      let listeningQuestionsList: ListeningQuestionItem[] = [];

      for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const mod = modules[mIdx];
        const modSkill = mod.skill?.toLowerCase() || '';
        let sKey: AssignmentSkill = 'writing';
        if (modSkill.includes('speak')) sKey = 'speaking';
        else if (modSkill.includes('read')) sKey = 'reading';
        else if (modSkill.includes('listen')) sKey = 'listening';
        else sKey = 'writing';

        skillMap[sKey] = mod.id;
        if (mIdx === 0) {
          detectedSkill = sKey;
        }

        try {
          const modDetail = await moduleService.getModule(mod.id);
          const inst = modDetail.instructions || '';
          if (sKey === 'writing') {
            writingPrompt = inst;
            writingAiInstruction = modDetail.aiInstruction || '';
          } else if (sKey === 'speaking') {
            speakingPrompt = inst;
            speakingAiInstruction = modDetail.aiInstruction || '';
          } else if (sKey === 'reading') {
            if (inst.includes('\n\n')) {
              readingTitle = inst.split('\n\n')[0].slice(0, 100);
              readingContent = inst.slice(inst.indexOf('\n\n') + 2);
            } else {
              readingTitle = inst.slice(0, 100);
              readingContent = inst;
            }
            try {
              const qRes = await questionService.listQuestions(mod.id);
              const fetchedQuestions = qRes.questions || [];
              readingQuestionsList = fetchedQuestions.map((q, idx) => {
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
            } catch (qErr) {
              console.warn('Failed to load reading questions for module:', qErr);
            }
          } else if (sKey === 'listening') {
            listeningTranscript = inst;
            listeningAudioUrl = modDetail.sourceAudioStorageKey || '';
            try {
              const qRes = await questionService.listQuestions(mod.id);
              const fetchedQuestions = qRes.questions || [];
              listeningQuestionsList = fetchedQuestions.map((q, idx) => {
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
            } catch (qErr) {
              console.warn('Failed to load listening questions for module:', qErr);
            }
          }
        } catch (mErr) {
          console.warn(`Failed to load module detail for ${mod.id}:`, mErr);
        }
      }

      if (isMounted) {
        setModuleIdsBySkill(skillMap);
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
        maxSubmissions: detail.maxSubmissions ?? prev.maxSubmissions,
        dueDate: detail.closeAt ? detail.closeAt.slice(0, 16) : prev.dueDate,
        startDate: detail.openAt ? detail.openAt.slice(0, 16) : prev.startDate,
        writing: {
          ...prev.writing,
          promptText: writingPrompt || prev.writing.promptText,
          aiInstruction: writingAiInstruction || prev.writing.aiInstruction
        },
        speaking: {
          ...prev.speaking,
          promptText: speakingPrompt || prev.speaking.promptText || prev.speaking.cueCardTopic || '',
          cueCardTopic: speakingPrompt || prev.speaking.cueCardTopic || '',
          aiInstruction: speakingAiInstruction || prev.speaking.aiInstruction
        },
        reading: {
          ...prev.reading,
          passageTitle: readingTitle || prev.reading.passageTitle,
          passageContent: readingContent || prev.reading.passageContent,
          questions: readingQuestionsList.length > 0 ? readingQuestionsList : prev.reading.questions
        },
        listening: {
          ...prev.listening,
          audioUrl: listeningAudioUrl || prev.listening.audioUrl,
          transcript: listeningTranscript || prev.listening.transcript,
          questions: listeningQuestionsList.length > 0 ? listeningQuestionsList : prev.listening.questions
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

  const saveAssignmentChanges = async (publishStatus?: AssignmentStatus) => {
    if (!id) return;

    const allSkills: AssignmentSkill[] = ['writing', 'speaking', 'reading', 'listening'];
    const skillsToSave = allSkills.filter(s => Boolean(moduleIdsBySkill[s]) || isSkillConfigured(s));
    const targetSkills = skillsToSave.length > 0 ? skillsToSave : [assignmentData.skill];

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

    setIsSaving(true);
    try {
      const assignmentIdNum = Number(id);

      const openDate = assignmentData.startDate 
        ? new Date(assignmentData.startDate).toISOString() 
        : new Date().toISOString();
      const closeDate = assignmentData.dueDate 
        ? new Date(assignmentData.dueDate).toISOString() 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const mainDescription = targetSkills.length === 1
        ? getInstructionsFor(targetSkills[0])
        : targetSkills.map((s) => `[${s.toUpperCase()}]: ${getInstructionsFor(s)}`).join('\n\n');

      // 1. Update assignment
      await assignmentService.updateAssignment(assignmentIdNum, {
        title: assignmentData.title,
        description: mainDescription,
        openAt: openDate,
        closeAt: closeDate,
        maxSubmissions: assignmentData.maxSubmissions ?? 1
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

      const apiSkillMap: Record<AssignmentSkill, ApiSkill> = {
        writing: 'WRITING', speaking: 'SPEAKING', reading: 'READING', listening: 'LISTENING'
      };
      const taskTypeMap: Record<AssignmentSkill, 'ESSAY' | 'RECORDING' | 'QUIZ'> = {
        writing: 'ESSAY', speaking: 'RECORDING', reading: 'QUIZ', listening: 'QUIZ'
      };

      const updatedSkillMap = { ...moduleIdsBySkill };

      for (let sIdx = 0; sIdx < targetSkills.length; sIdx++) {
        const skill = targetSkills[sIdx];
        const instructions = getInstructionsFor(skill);
        const selectedAiInstruction = skill === 'writing'
          ? (assignmentData.writing.aiInstruction || undefined)
          : skill === 'speaking'
          ? (assignmentData.speaking.aiInstruction || undefined)
          : undefined;

        let targetModuleId = updatedSkillMap[skill];
        if (targetModuleId) {
          try {
            await moduleService.updateModule(targetModuleId, {
              instructions,
              aiInstruction: selectedAiInstruction
            });
          } catch (modErr) {
            console.warn(`Failed to update module for ${skill}:`, modErr);
          }
        } else {
          try {
            const newMod = await moduleService.createModule(assignmentIdNum, {
              skill: apiSkillMap[skill],
              taskType: taskTypeMap[skill],
              orderIndex: sIdx + 1,
              instructions,
              aiInstruction: selectedAiInstruction,
              maxScore: 10
            });
            targetModuleId = newMod.id;
            updatedSkillMap[skill] = newMod.id;
          } catch (createErr) {
            console.warn(`Failed to create module for ${skill}:`, createErr);
          }
        }

        // Upload new audio file if provided
        if (targetModuleId && skill === 'listening' && assignmentData.listening.audioFile) {
          try {
            await moduleService.uploadAudio(targetModuleId, assignmentData.listening.audioFile);
          } catch (audioErr) {
            console.error('Failed to upload audio file in edit mode:', audioErr);
            showToast(isVi ? 'Không thể tải lên tệp âm thanh bài nghe. Vui lòng thử lại!' : 'Failed to upload audio file!');
            throw audioErr;
          }
        }

        // Synchronize questions sequentially for Reading / Listening to prevent 409 Lock Contention
        if (targetModuleId && (skill === 'reading' || skill === 'listening')) {
          let existingDbQuestions: QuestionResponse[] = [];
          try {
            const dbRes = await questionService.listQuestions(targetModuleId);
            existingDbQuestions = dbRes.questions || [];
          } catch (dbErr) {
            console.warn(`Could not fetch existing DB questions for ${skill}:`, dbErr);
          }

          const uiQuestions = skill === 'reading'
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
              if (skill === 'reading') {
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
              if (skill === 'listening') {
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
      }

      setModuleIdsBySkill(updatedSkillMap);

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

        {/* Status indicator & class badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            className="select-input"
            value={selectedClassId ? String(selectedClassId) : ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedClassId(val);
              const m = classes.find((c) => c.id === val);
              if (m) setAssignmentData((prev) => ({ ...prev, className: m.name }));
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

          {/* Quick Stats Summary Card */}
          <section className="edit-card" style={{ backgroundColor: 'var(--surface-dim, #f4efe6)' }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #262320)' }}>
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
