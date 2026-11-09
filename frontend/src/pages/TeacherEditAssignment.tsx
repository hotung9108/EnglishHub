import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, PenTool, Mic, BookOpen, Headphones, 
  Eye, Save, Send, Plus, Trash2, ArrowUp, ArrowDown,
  Layers, CheckCircle2, ChevronDown, AlertCircle, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../components/common/ToastContext';
import { classService, type ClassSummary } from '../api/services/class.service';
import { 
  assignmentService, 
  type AssignmentDetail, 
  type AssignmentStatus, 
  type AssignmentSkill as ApiSkill 
} from '../api/services/assignment.service';
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
import { 
  type AssignmentEditorData, 
  type AssignmentSkill, 
  type EditorModuleItem,
  type WritingConfig,
  type SpeakingConfig,
  type ReadingConfig,
  type ListeningConfig,
  type ReadingQuestionItem, 
  type ListeningQuestionItem,
  createDefaultModuleItem,
  createDefaultWritingConfig,
  createDefaultSpeakingConfig,
  createDefaultReadingConfig,
  createDefaultListeningConfig
} from '../types/assignment-editor.types';
import { 
  SkillWritingEditor, 
  SkillSpeakingEditor, 
  SkillReadingEditor, 
  SkillListeningEditor,
  AssignmentPreviewModal
} from '../components/assignments/editor';
import { StickyActionBar, LoadingState } from '../components/common';
import { formatToLocalDateTimeInput, addDays } from '../utils/dateTime.utils';
import '../styles/teacher-assignment-edit.css';

export const TeacherEditAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

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
  const [currentDbStatus, setCurrentDbStatus] = useState<AssignmentStatus>('DRAFT');

  // Multi-module management state
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [deletedModuleDbIds, setDeletedModuleDbIds] = useState<number[]>([]);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Assignment Editor state
  const [assignmentData, setAssignmentData] = useState<AssignmentEditorData>(() => ({
    id: id || '1',
    code: `HW-${(id || '1').padStart(2, '0')}`,
    title: '',
    skill: 'writing',
    className: '',
    startDate: formatToLocalDateTimeInput(),
    dueDate: formatToLocalDateTimeInput(addDays(new Date(), 7)),
    durationMinutes: 60,
    allowLate: true,
    status: 'active',
    targetAudience: 'all',
    notifyStudents: true,
    maxSubmissions: 3,
    modules: [createDefaultModuleItem('writing', 1)]
  }));

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    toastWarning(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const loadAssignmentData = async () => {
      try {
        const assignmentIdNum = Number(id);

        // 1. Fetch assignment details, classes, and modules in parallel
        const [detailRes, classRes, modRes] = await Promise.allSettled([
          assignmentService.getAssignment(assignmentIdNum),
          classService.list({ limit: 100 }),
          moduleService.listModules(assignmentIdNum)
        ]);

        if (!isMounted) return;

        const detail: AssignmentDetail = detailRes.status === 'fulfilled' ? detailRes.value : {
          id: assignmentIdNum,
          title: '',
          status: 'DRAFT',
          modules: []
        };
        setCurrentDbStatus(detail.status);

        if (detail.status === 'CLOSED') {
          showToast(isVi ? 'Bài tập đã đóng, không thể chỉnh sửa.' : 'This assignment is closed and cannot be edited.');
          navigate(`/teacher/assignments/${assignmentIdNum}`, { replace: true });
          return;
        }

        const classList = classRes.status === 'fulfilled' ? (classRes.value.data || []) : [];
        setClasses(classList);

        // Find which class contains this assignment in parallel
        const classCheckResults = await Promise.all(
          classList.map(async (cls) => {
            try {
              const assignList = await assignmentService.listAssignments(cls.id, { limit: 100 });
              const hasMatch = assignList.data?.some((a) => a.id === assignmentIdNum);
              return { cls, hasMatch };
            } catch {
              return { cls, hasMatch: false };
            }
          })
        );
        const matchedClass = classCheckResults.find((r) => r.hasMatch)?.cls;

        if (matchedClass) {
          setSelectedClassId(matchedClass.id);
          try {
            const [membersRes, subsRes] = await Promise.allSettled([
              classService.listMembers(matchedClass.id),
              submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 })
            ]);
            const members = membersRes.status === 'fulfilled' ? membersRes.value : [];
            const subs = subsRes.status === 'fulfilled' ? (subsRes.value.data || []) : [];
            setTurnoutStats({
              total: members.length,
              submitted: subs.filter((s) => s.status !== 'IN_PROGRESS').length
            });
          } catch {
            // Fallback
          }
        }

        let rawModules: ModuleSummary[] = [];
        if (modRes.status === 'fulfilled') {
          rawModules = modRes.value.modules || modRes.value.data || [];
        }

        if (rawModules.length === 0 && detail.modules && detail.modules.length > 0) {
          rawModules = detail.modules.map((m, idx) => ({
            id: m.id,
            skill: m.skill,
            taskType: 'QUIZ',
            orderIndex: idx + 1,
            maxScore: 10,
            hasAudio: false,
          }));
        }

        // Fetch details & questions for each module in parallel
        const moduleDetailsResults = await Promise.all(
          rawModules.map(async (mod, mIdx) => {
            const modSkill = mod.skill?.toLowerCase() || '';
            let sKey: AssignmentSkill;
            if (modSkill.includes('speak')) sKey = 'speaking';
            else if (modSkill.includes('read')) sKey = 'reading';
            else if (modSkill.includes('listen')) sKey = 'listening';
            else sKey = 'writing';

            const needQuestions = sKey === 'reading' || sKey === 'listening';
            const [mDetailRes, qRes] = await Promise.allSettled([
              moduleService.getModule(mod.id),
              needQuestions ? questionService.listQuestions(mod.id) : Promise.reject('No questions')
            ]);

            const modDetail = mDetailRes.status === 'fulfilled' ? mDetailRes.value : null;
            let audioDownloadUrl = modDetail?.sourceAudioDownloadUrl || (modDetail as any)?.audioDownloadUrl || '';
            if (sKey === 'listening' && !audioDownloadUrl && modDetail?.sourceAudioStorageKey) {
              try {
                const audioRes = await moduleService.getAudioDownloadUrl(mod.id);
                audioDownloadUrl = audioRes.downloadUrl || '';
              } catch {
                // Ignore fallback error
              }
            }

            return {
              mod,
              mIdx,
              sKey,
              modDetail,
              audioDownloadUrl,
              questions: qRes.status === 'fulfilled' ? (qRes.value.questions || qRes.value.data || []) : []
            };
          })
        );

        // Convert into rich EditorModuleItem array
        const loadedModules: EditorModuleItem[] = moduleDetailsResults.map((item, idx) => {
          const { mod, sKey, modDetail, questions: fetchedQuestions } = item;
          const inst = modDetail?.instructions || '';
          const aiInst = modDetail?.aiInstruction || '';
          const maxSc = modDetail?.maxScore ? Number(modDetail.maxScore) : 10;

          let modConfig: WritingConfig | SpeakingConfig | ReadingConfig | ListeningConfig;

          if (sKey === 'writing') {
            let pText = inst;
            let chartUrl = '';
            const imgMatch = pText.match(/!\[(?:Diagram|Chart|Biểu đồ)?\]\((https?:\/\/[^\s)]+|data:image\/[^)]+)\)/i);
            if (imgMatch) {
              chartUrl = imgMatch[1];
              pText = pText.replace(/!\[(?:Diagram|Chart|Biểu đồ)?\]\((https?:\/\/[^\s)]+|data:image\/[^)]+)\)/gi, '').trim();
            }
            const isTask1 = mod.taskType === 'REWRITE' || chartUrl !== '' || /task\s*1/i.test(pText);
            let minWords = isTask1 ? 150 : 250;
            const minWordsMatch = pText.match(/<!--\s*minWords:\s*(\d+)\s*-->/i) || pText.match(/tối thiểu\s*(\d+)\s*từ/i);
            if (minWordsMatch) {
              minWords = Number(minWordsMatch[1]);
              pText = pText.replace(/<!--\s*minWords:\s*\d+\s*-->/gi, '').trim();
            }
            modConfig = {
              ...createDefaultWritingConfig(isTask1 ? 'task1' : 'task2'),
              promptText: pText,
              chartImageUrl: chartUrl,
              minWords,
              aiInstruction: aiInst,
            };
          } else if (sKey === 'speaking') {
            modConfig = {
              ...createDefaultSpeakingConfig(),
              promptText: inst,
              cueCardTopic: inst,
              aiInstruction: aiInst,
            };
          } else if (sKey === 'reading') {
            const hasDoubleNewline = inst.includes('\n\n');
            const candidateTitle = hasDoubleNewline ? inst.split('\n\n')[0].trim() : '';
            const isInstructionLike =
              candidateTitle.toLowerCase().startsWith('đọc bài') ||
              candidateTitle.toLowerCase().startsWith('read the') ||
              candidateTitle.toLowerCase().includes('trả lời câu hỏi') ||
              candidateTitle.toLowerCase().includes('khả năng hiểu nội dung');
            const readingTitle = (!isInstructionLike && candidateTitle.length > 0 && candidateTitle.length <= 80)
              ? candidateTitle
              : '';
            const readingContent = hasDoubleNewline && !isInstructionLike
              ? inst.slice(inst.indexOf('\n\n') + 2).trim()
              : inst.trim();
            const qList: ReadingQuestionItem[] = fetchedQuestions.map((q: QuestionResponse, qIdx: number) => {
              const isMcq = q.questionType === 'MULTIPLE_CHOICE';
              const mcq = isMcq ? extractMcqOptions(q.correctAnswer) : null;
              const shortAns = !isMcq ? extractShortAnswerText(q.correctAnswer) : '';
              return {
                id: String(q.id),
                order: q.orderIndex || qIdx + 1,
                type: isMcq ? 'multiple_choice' : 'gap_fill',
                prompt: q.content,
                options: mcq ? mcq.options : undefined,
                correctAnswer: isMcq ? (mcq ? mcq.correctOptionContent : '') : shortAns,
                paragraphRef: 'A',
                points: Number(q.score) || 1,
              };
            });
            modConfig = {
              ...createDefaultReadingConfig(),
              passageTitle: readingTitle,
              passageContent: readingContent,
              questions: qList,
              aiInstruction: aiInst,
            };
          } else {
            // listening
            const qList: ListeningQuestionItem[] = fetchedQuestions.map((q: QuestionResponse, qIdx: number) => {
              const isMcq = q.questionType === 'MULTIPLE_CHOICE';
              const mcq = isMcq ? extractMcqOptions(q.correctAnswer) : null;
              const shortAns = !isMcq ? extractShortAnswerText(q.correctAnswer) : '';
              return {
                id: String(q.id),
                order: q.orderIndex || qIdx + 1,
                section: 'section1',
                type: isMcq ? 'multiple_choice' : 'short_answer',
                prompt: q.content,
                options: mcq ? mcq.options : undefined,
                correctAnswer: isMcq ? (mcq ? mcq.correctOptionContent : '') : shortAns,
                points: Number(q.score) || 1,
              };
            });
            const finalAudioUrl = item.audioDownloadUrl || modDetail?.sourceAudioDownloadUrl || (modDetail as any)?.audioDownloadUrl || (modDetail?.sourceAudioStorageKey?.startsWith('http') ? modDetail.sourceAudioStorageKey : '');
            const storageFileName = modDetail?.sourceAudioStorageKey ? modDetail.sourceAudioStorageKey.split('/').pop() : '';
            modConfig = {
              ...createDefaultListeningConfig(),
              transcript: inst,
              audioTitle: storageFileName || '',
              audioUrl: finalAudioUrl,
              audioPreviewUrl: finalAudioUrl,
              questions: qList,
              aiInstruction: aiInst,
            };
          }

          return {
            id: `mod-existing-${mod.id}`,
            dbId: mod.id,
            skill: sKey,
            title: sKey === 'reading' ? (modConfig as ReadingConfig).passageTitle : '',
            orderIndex: mod.orderIndex || idx + 1,
            maxScore: maxSc,
            config: modConfig,
          };
        });

        if (loadedModules.length === 0) {
          loadedModules.push(createDefaultModuleItem('writing', 1));
        }

        setAssignmentData({
          id: String(detail.id),
          code: `HW-${String(detail.id).padStart(2, '0')}`,
          title: detail.title || '',
          skill: loadedModules[0]?.skill || 'writing',
          className: matchedClass?.name || '',
          startDate: detail.openAt ? formatToLocalDateTimeInput(detail.openAt) : formatToLocalDateTimeInput(),
          dueDate: detail.closeAt ? formatToLocalDateTimeInput(detail.closeAt) : formatToLocalDateTimeInput(addDays(new Date(), 7)),
          durationMinutes: 60,
          allowLate: true,
          status: detail.status === 'PUBLISHED' ? 'active' : 'draft',
          targetAudience: 'all',
          notifyStudents: true,
          maxSubmissions: detail.maxSubmissions ?? 1,
          modules: loadedModules
        });
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

  // Add a new module
  const handleAddModule = (skill: AssignmentSkill) => {
    const nextOrder = assignmentData.modules.length + 1;
    const newMod = createDefaultModuleItem(skill, nextOrder);
    setAssignmentData((prev) => ({
      ...prev,
      modules: [...prev.modules, newMod]
    }));
    setActiveModuleIndex(assignmentData.modules.length);
    setShowAddMenu(false);
    showToast(isVi ? `Đã thêm phần thi ${getSkillName(skill)} mới.` : `Added new ${skill} module.`);
  };

  // Remove module
  const handleRemoveModule = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (assignmentData.modules.length <= 1) {
      showToast(isVi ? 'Bài tập phải có ít nhất 1 phần thi / module!' : 'Assignment must contain at least 1 module!');
      return;
    }

    const targetMod = assignmentData.modules[index];
    if (targetMod.dbId) {
      setDeletedModuleDbIds((prev) => [...prev, targetMod.dbId!]);
    }

    const updated = assignmentData.modules.filter((_, idx) => idx !== index);
    const reordered = updated.map((m, idx) => ({ ...m, orderIndex: idx + 1 }));
    setAssignmentData((prev) => ({ ...prev, modules: reordered }));

    if (activeModuleIndex >= reordered.length) {
      setActiveModuleIndex(Math.max(0, reordered.length - 1));
    } else if (activeModuleIndex === index) {
      setActiveModuleIndex(Math.max(0, index - 1));
    }
  };

  // Move module up or down
  const handleMoveModule = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= assignmentData.modules.length) return;

    const list = [...assignmentData.modules];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((m, idx) => ({ ...m, orderIndex: idx + 1 }));
    setAssignmentData((prev) => ({ ...prev, modules: reordered }));
    setActiveModuleIndex(targetIndex);
  };

  // Update active module config
  const handleActiveModuleConfigChange = (updatedConfig: WritingConfig | SpeakingConfig | ReadingConfig | ListeningConfig) => {
    setAssignmentData((prev) => {
      const updatedModules = prev.modules.map((m, idx) => {
        if (idx === activeModuleIndex) {
          return { ...m, config: updatedConfig };
        }
        return m;
      });
      return { ...prev, modules: updatedModules };
    });
  };

  // Update active module meta
  const handleActiveModuleMetaChange = (field: 'title' | 'maxScore', val: string | number) => {
    setAssignmentData((prev) => {
      const updatedModules = prev.modules.map((m, idx) => {
        if (idx === activeModuleIndex) {
          return { ...m, [field]: val };
        }
        return m;
      });
      return { ...prev, modules: updatedModules };
    });
  };

  const getSkillName = (skill: AssignmentSkill): string => {
    switch (skill) {
      case 'writing': return isVi ? 'Viết (Writing)' : 'Writing';
      case 'speaking': return isVi ? 'Nói (Speaking)' : 'Speaking';
      case 'reading': return isVi ? 'Đọc (Reading)' : 'Reading';
      case 'listening': return isVi ? 'Nghe (Listening)' : 'Listening';
      default: return skill;
    }
  };

  const getSkillIcon = (skill: AssignmentSkill, size = 16) => {
    switch (skill) {
      case 'writing': return <PenTool size={size} />;
      case 'speaking': return <Mic size={size} />;
      case 'reading': return <BookOpen size={size} />;
      case 'listening': return <Headphones size={size} />;
    }
  };

  const getInstructionsForModule = (mod: EditorModuleItem): string => {
    switch (mod.skill) {
      case 'writing': {
        const c = mod.config as WritingConfig;
        const basePrompt = c.promptText.trim();
        const defaultMin = c.taskType === 'task1' ? 150 : 250;
        const minWordsHeader = (c.minWords && c.minWords !== defaultMin) ? `<!-- minWords: ${c.minWords} -->\n` : '';
        const chartMarkdown = c.chartImageUrl?.trim() ? `\n\n![Diagram](${c.chartImageUrl.trim()})` : '';
        return `${minWordsHeader}${basePrompt}${chartMarkdown}`.trim();
      }
      case 'speaking': {
        const c = mod.config as SpeakingConfig;
        return (c.promptText || c.cueCardTopic || '').trim();
      }
      case 'reading': {
        const c = mod.config as ReadingConfig;
        const pTitle = c.passageTitle.trim();
        const pContent = (c.passageContent 
          || c.paragraphs?.map(p => p.content).join('\n\n') 
          || '').trim();
        return pTitle ? `${pTitle}\n\n${pContent}` : pContent;
      }
      case 'listening': {
        const c = mod.config as ListeningConfig;
        return (c.transcript || c.audioTitle || '').trim();
      }
      default:
        return '';
    }
  };

  const saveAssignmentChanges = async (publishStatus?: AssignmentStatus) => {
    if (!id) return;

    // Validation for all modules
    for (let i = 0; i < assignmentData.modules.length; i++) {
      const mod = assignmentData.modules[i];
      const modNum = i + 1;
      const modLabel = mod.title ? `"${mod.title}" (Phần ${modNum})` : `Phần ${modNum}: ${getSkillName(mod.skill)}`;

      if (mod.skill === 'writing') {
        const c = mod.config as WritingConfig;
        if (!c.promptText.trim()) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${modLabel}: Nội dung đề bài Writing không được để trống!` : `${modLabel}: Writing prompt cannot be empty!`);
          return;
        }
      } else if (mod.skill === 'speaking') {
        const c = mod.config as SpeakingConfig;
        const prompt = (c.promptText || c.cueCardTopic || '').trim();
        if (!prompt) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${modLabel}: Nội dung đề bài Speaking không được để trống!` : `${modLabel}: Speaking prompt cannot be empty!`);
          return;
        }
      } else if (mod.skill === 'reading') {
        const c = mod.config as ReadingConfig;
        if (!c.passageTitle.trim()) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${modLabel}: Tiêu đề bài đọc không được để trống!` : `${modLabel}: Passage title cannot be empty!`);
          return;
        }
        const pContent = (c.passageContent || c.paragraphs?.map(p => p.content).join('\n\n') || '').trim();
        if (!pContent) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${modLabel}: Nội dung văn bản bài đọc không được để trống!` : `${modLabel}: Passage content cannot be empty!`);
          return;
        }
        if (!c.questions || c.questions.length === 0) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${modLabel}: Vui lòng tạo ít nhất 1 câu hỏi cho bài đọc!` : `${modLabel}: Please add at least 1 question!`);
          return;
        }
        for (let qIdx = 0; qIdx < c.questions.length; qIdx++) {
          const q = c.questions[qIdx];
          if (!q.prompt.trim()) {
            setActiveModuleIndex(i);
            showToast(isVi ? `${modLabel}: Câu hỏi #${qIdx + 1} không được để trống!` : `${modLabel}: Question #${qIdx + 1} cannot be empty!`);
            return;
          }
          if (q.type === 'short_answer' && !q.correctAnswer.trim()) {
            setActiveModuleIndex(i);
            showToast(isVi ? `${modLabel}: Đáp án câu hỏi #${qIdx + 1} không được để trống!` : `${modLabel}: Correct answer #${qIdx + 1} cannot be empty!`);
            return;
          }
        }
      } else if (mod.skill === 'listening') {
        const c = mod.config as ListeningConfig;
        if (!c.audioFile && !c.audioUrl?.trim() && !c.audioPreviewUrl?.trim()) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${modLabel}: Vui lòng chọn tệp âm thanh cho bài nghe!` : `${modLabel}: Please select an audio file!`);
          return;
        }
        if (!c.questions || c.questions.length === 0) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${modLabel}: Vui lòng tạo ít nhất 1 câu hỏi cho bài nghe!` : `${modLabel}: Please add at least 1 question!`);
          return;
        }
        for (let qIdx = 0; qIdx < c.questions.length; qIdx++) {
          const q = c.questions[qIdx];
          if (!q.prompt.trim()) {
            setActiveModuleIndex(i);
            showToast(isVi ? `${modLabel}: Câu hỏi #${qIdx + 1} không được để trống!` : `${modLabel}: Question #${qIdx + 1} cannot be empty!`);
            return;
          }
          if (q.type === 'short_answer' && !q.correctAnswer.trim()) {
            setActiveModuleIndex(i);
            showToast(isVi ? `${modLabel}: Đáp án câu hỏi #${qIdx + 1} không được để trống!` : `${modLabel}: Correct answer #${qIdx + 1} cannot be empty!`);
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

      const mainDescription = assignmentData.modules
        .map((m, idx) => `[Phần ${idx + 1} - ${m.skill.toUpperCase()}${m.title ? `: ${m.title}` : ''}]: ${getInstructionsForModule(m)}`)
        .join('\n\n');

      // 1. Update assignment basics
      await assignmentService.updateAssignment(assignmentIdNum, {
        title: assignmentData.title,
        description: mainDescription,
        openAt: openDate,
        closeAt: closeDate,
        maxSubmissions: assignmentData.maxSubmissions ?? 1
      });

      // 2. Update status if changed
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

      // 3. Delete removed modules
      for (const delId of deletedModuleDbIds) {
        try {
          await moduleService.deleteModule(delId);
        } catch (delErr) {
          console.warn(`Failed to delete removed module #${delId}:`, delErr);
        }
      }
      setDeletedModuleDbIds([]);

      // 4. Update existing or create newly added modules
      const apiSkillMap: Record<AssignmentSkill, ApiSkill> = {
        writing: 'WRITING', speaking: 'SPEAKING', reading: 'READING', listening: 'LISTENING'
      };
      const taskTypeMap: Record<AssignmentSkill, 'ESSAY' | 'RECORDING' | 'QUIZ'> = {
        writing: 'ESSAY', speaking: 'RECORDING', reading: 'QUIZ', listening: 'QUIZ'
      };

      const updatedModulesList = [...assignmentData.modules];

      for (let sIdx = 0; sIdx < updatedModulesList.length; sIdx++) {
        const mod = updatedModulesList[sIdx];
        const orderIndex = sIdx + 1;
        const instructions = getInstructionsForModule(mod);
        let aiInstruction: string | undefined = undefined;
        if (mod.skill === 'writing') {
          aiInstruction = (mod.config as WritingConfig).aiInstruction || undefined;
        } else if (mod.skill === 'speaking') {
          aiInstruction = (mod.config as SpeakingConfig).aiInstruction || undefined;
        }

        let targetModuleId = mod.dbId;

        if (targetModuleId) {
          // Existing module -> update
          try {
            await moduleService.updateModule(targetModuleId, {
              instructions,
              aiInstruction,
              maxScore: mod.maxScore || 10,
              orderIndex
            });
          } catch (modErr) {
            console.warn(`Failed to update module #${targetModuleId}:`, modErr);
          }
        } else {
          // New module added in edit view -> create
          try {
            const newMod = await moduleService.createModule(assignmentIdNum, {
              skill: apiSkillMap[mod.skill],
              taskType: taskTypeMap[mod.skill],
              orderIndex,
              instructions,
              aiInstruction,
              maxScore: mod.maxScore || 10
            });
            targetModuleId = newMod.id;
            updatedModulesList[sIdx] = { ...mod, dbId: newMod.id };
          } catch (createErr) {
            console.warn(`Failed to create new module for ${mod.skill}:`, createErr);
          }
        }

        // Upload audio if listening and has new file
        if (targetModuleId && mod.skill === 'listening') {
          const lConfig = mod.config as ListeningConfig;
          if (lConfig.audioFile) {
            try {
              await moduleService.uploadAudio(targetModuleId, lConfig.audioFile);
            } catch (audioErr) {
              console.error('Failed to upload audio file:', audioErr);
              showToast(isVi ? 'Không thể tải lên tệp âm thanh bài nghe mới. Vui lòng thử lại!' : 'Failed to upload new listening audio file!');
              throw audioErr;
            }
          }
        }

        // Create / sync questions for reading / listening
        if (targetModuleId && (mod.skill === 'reading' || mod.skill === 'listening')) {
          const qList = (mod.config as (ReadingConfig | ListeningConfig)).questions || [];
          const moduleTotalScore = mod.maxScore || 10;
          const scorePerQ = qList.length > 0 ? moduleTotalScore / qList.length : 1;
          for (let i = 0; i < qList.length; i++) {
            const q = qList[i];
            const isExistingQuestion = q.id && !q.id.startsWith('new-') && !q.id.startsWith('mod-') && Number.isFinite(Number(q.id));
            if (!isExistingQuestion) {
              const payload = q.type === 'multiple_choice'
                ? buildMcqPayload({
                    content: q.prompt,
                    options: 'options' in q && Array.isArray((q as { options?: string[] }).options)
                      ? ((q as { options?: string[] }).options || [])
                      : [],
                    correctOptionIndexOrText: q.correctAnswer,
                    score: scorePerQ,
                    orderIndex: i + 1,
                  })
                : buildShortAnswerPayload({
                    content: q.prompt,
                    answerText: q.correctAnswer,
                    score: scorePerQ,
                    orderIndex: i + 1,
                  });
              try {
                await questionService.createQuestion(targetModuleId, payload);
              } catch (qErr) {
                console.warn('Failed to create question:', qErr);
              }
            }
          }
        }
      }

      setAssignmentData((prev) => ({ ...prev, modules: updatedModulesList }));
      setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      const successMsg = isVi ? 'Đã lưu thay đổi bài tập thành công!' : 'Assignment saved successfully!';
      toastSuccess(successMsg);
      setToastMessage(successMsg);
    } catch (err) {
      console.error('Failed to save assignment changes:', err);
      const errorMsg = isVi ? 'Có lỗi xảy ra khi lưu bài tập. Vui lòng thử lại!' : 'Failed to save assignment. Please try again!';
      toastError(errorMsg);
      setToastMessage(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const activeModule = assignmentData.modules[activeModuleIndex] || assignmentData.modules[0];

  if (isLoading) {
    return (
      <div className="teacher-container">
        <LoadingState 
          title={isVi ? 'Đang nạp chi tiết bài tập' : 'Loading Assignment Details'}
          description={isVi ? 'Vui lòng chờ trong giây lát...' : 'Please wait a moment...'}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-container">
        <div className="eh-card p-8 text-center my-8">
          <AlertCircle size={32} className="text-danger mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-main mb-2">
            {isVi ? 'Không thể tải thông tin bài tập' : 'Failed to load assignment'}
          </h3>
          <p className="text-sm text-muted mb-4">{error}</p>
          <button type="button" onClick={handleRetry} className="btn btn-secondary">
            {isVi ? 'Thử lại' : 'Retry'}
          </button>
        </div>
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
        <span>{assignmentData.className || (isVi ? 'Lớp học' : 'Class')}</span>
        <span>/</span>
        <span style={{ fontWeight: 700, color: 'var(--eh-text-primary, #161B19)' }}>
          {isVi ? 'Chỉnh sửa bài tập' : 'Edit Assignment'}
        </span>
      </div>

      {/* Header */}
      <div className="assignment-edit-header">
        <input 
          type="text" 
          className="assignment-edit-title-input"
          value={assignmentData.title}
          onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
          placeholder={isVi ? 'Nhập tiêu đề bài tập...' : 'Enter assignment title...'}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={selectedClassId ? String(selectedClassId) : ''}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="select-input font-semibold text-sm"
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
            backgroundColor: currentDbStatus === 'PUBLISHED' ? '#dcfce7' : currentDbStatus === 'DRAFT' ? '#f1f5f9' : '#fee2e2',
            color: currentDbStatus === 'PUBLISHED' ? '#15803d' : currentDbStatus === 'DRAFT' ? '#475569' : '#b91c1c',
            fontWeight: 700,
            fontSize: '12.5px'
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: currentDbStatus === 'PUBLISHED' ? '#16a34a' : currentDbStatus === 'DRAFT' ? '#64748b' : '#ef4444' 
            }}></span>
            {currentDbStatus === 'PUBLISHED' ? (isVi ? 'Đang mở (Active)' : 'Active') : currentDbStatus === 'DRAFT' ? (isVi ? 'Bản nháp (Draft)' : 'Draft') : (isVi ? 'Đã đóng (Closed)' : 'Closed')}
          </div>
        </div>
      </div>

      {/* DYNAMIC MULTI-MODULE MANAGEMENT BAR */}
      <div className="tae-module-bar-wrap">
        <div className="tae-module-bar-header">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-forest" />
            <span className="tae-module-bar-title">
              {isVi ? 'Các phần thi / Modules của bài tập' : 'Assignment Modules & Exam Parts'}
            </span>
            <span className="tae-module-count-badge">
              {assignmentData.modules.length} {isVi ? 'phần thi' : 'parts'}
            </span>
          </div>

          {/* Add Module Dropdown */}
          <div className="relative" ref={addMenuRef}>
            <button
              type="button"
              className="tae-btn-add-module"
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              <Plus size={15} />
              <span>{isVi ? 'Thêm module' : 'Add Module'}</span>
              <ChevronDown size={14} />
            </button>

            {showAddMenu && (
              <div className="tae-add-module-menu">
                <button
                  type="button"
                  className="tae-add-menu-item"
                  onClick={() => handleAddModule('writing')}
                >
                  <PenTool size={14} className="text-forest" />
                  <span>{isVi ? 'Thêm phần Viết (Writing)' : 'Add Writing Module'}</span>
                </button>
                <button
                  type="button"
                  className="tae-add-menu-item"
                  onClick={() => handleAddModule('speaking')}
                >
                  <Mic size={14} className="text-forest" />
                  <span>{isVi ? 'Thêm phần Nói (Speaking)' : 'Add Speaking Module'}</span>
                </button>
                <button
                  type="button"
                  className="tae-add-menu-item"
                  onClick={() => handleAddModule('reading')}
                >
                  <BookOpen size={14} className="text-forest" />
                  <span>{isVi ? 'Thêm phần Đọc (Reading)' : 'Add Reading Module'}</span>
                </button>
                <button
                  type="button"
                  className="tae-add-menu-item"
                  onClick={() => handleAddModule('listening')}
                >
                  <Headphones size={14} className="text-forest" />
                  <span>{isVi ? 'Thêm phần Nghe (Listening)' : 'Add Listening Module'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Module Chips Row */}
        <div className="tae-module-chips-list">
          {assignmentData.modules.map((mod, idx) => {
            const isSelected = idx === activeModuleIndex;
            const skillCode = mod.skill;
            return (
              <div
                key={mod.id || idx}
                className={`tae-module-chip ${isSelected ? 'active' : ''} skill-${skillCode}`}
                onClick={() => setActiveModuleIndex(idx)}
              >
                <div className="tae-chip-badge">{idx + 1}</div>
                <div className="tae-chip-icon">{getSkillIcon(mod.skill, 14)}</div>
                <div className="tae-chip-text">
                  <span className="tae-chip-skill">{getSkillName(mod.skill)}</span>
                  {mod.title && <span className="tae-chip-sub">• {mod.title}</span>}
                </div>

                {/* Move & Delete controls */}
                <div className="tae-chip-actions" onClick={(e) => e.stopPropagation()}>
                  {idx > 0 && (
                    <button
                      type="button"
                      className="tae-chip-action-btn"
                      title={isVi ? 'Di chuyển sang trái' : 'Move left'}
                      onClick={(e) => handleMoveModule(idx, 'up', e)}
                    >
                      <ArrowUp size={12} />
                    </button>
                  )}
                  {idx < assignmentData.modules.length - 1 && (
                    <button
                      type="button"
                      className="tae-chip-action-btn"
                      title={isVi ? 'Di chuyển sang phải' : 'Move right'}
                      onClick={(e) => handleMoveModule(idx, 'down', e)}
                    >
                      <ArrowDown size={12} />
                    </button>
                  )}
                  {assignmentData.modules.length > 1 && (
                    <button
                      type="button"
                      className="tae-chip-action-btn delete"
                      title={isVi ? 'Xóa phần thi này' : 'Remove module'}
                      onClick={(e) => handleRemoveModule(idx, e)}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Active Module Workspace (Left) + Settings Sidebar (Right) */}
      <div className="assignment-edit-grid">
        {/* LEFT COLUMN: Active Module Workspace */}
        <div>
          {/* Active Module Meta Row */}
          {activeModule && (
            <div className="tae-active-mod-meta-card">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="tae-meta-tag">
                  {isVi ? `Đang chỉnh sửa: Phần ${activeModuleIndex + 1}` : `Editing Part ${activeModuleIndex + 1}`}
                </span>
                <input
                  type="text"
                  className="tae-meta-title-input"
                  value={activeModule.title || ''}
                  onChange={(e) => handleActiveModuleMetaChange('title', e.target.value)}
                  placeholder={isVi ? 'Tên gợi nhớ (VD: Passage 1, Task 1: Chart Description...)' : 'Module custom title (optional)...'}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">
                  {isVi ? 'Thang điểm:' : 'Max score:'}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="tae-meta-score-input"
                  value={activeModule.maxScore === 0 ? '' : (activeModule.maxScore || 10)}
                  placeholder="10"
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const clean = raw.replace(/^0+/, '');
                    handleActiveModuleMetaChange('maxScore', clean === '' ? (raw === '0' ? 0 : 10) : Number(clean));
                  }}
                  onBlur={() => {
                    if (!activeModule.maxScore || activeModule.maxScore <= 0) {
                      handleActiveModuleMetaChange('maxScore', 10);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {activeModule?.skill === 'writing' && (
            <SkillWritingEditor 
              config={activeModule.config as WritingConfig}
              onChange={handleActiveModuleConfigChange}
            />
          )}

          {activeModule?.skill === 'speaking' && (
            <SkillSpeakingEditor 
              config={activeModule.config as SpeakingConfig}
              onChange={handleActiveModuleConfigChange}
            />
          )}

          {activeModule?.skill === 'reading' && (
            <SkillReadingEditor 
              config={activeModule.config as ReadingConfig}
              onChange={handleActiveModuleConfigChange}
              moduleMaxScore={activeModule.maxScore || 10}
            />
          )}

          {activeModule?.skill === 'listening' && (
            <SkillListeningEditor 
              config={activeModule.config as ListeningConfig}
              onChange={handleActiveModuleConfigChange}
              moduleMaxScore={activeModule.maxScore || 10}
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
                value={assignmentData.maxSubmissions === 0 ? '' : (assignmentData.maxSubmissions ?? 1)}
                placeholder="1"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setAssignmentData({ ...assignmentData, maxSubmissions: 1 });
                    return;
                  }
                  const clean = raw.replace(/^0+/, '');
                  setAssignmentData({ ...assignmentData, maxSubmissions: clean === '' ? 1 : Math.max(1, Number(clean)) });
                }}
                onBlur={() => {
                  if (!assignmentData.maxSubmissions || assignmentData.maxSubmissions <= 0) {
                    setAssignmentData({ ...assignmentData, maxSubmissions: 1 });
                  }
                }}
                style={{ width: '90px' }}
              />
            </div>
          </section>

          {/* Turnout Stats Card */}
          <section className="edit-card">
            <div className="edit-card-header">
              <h3 className="edit-card-title">
                {isVi ? 'Thống kê nộp bài lớp' : 'Class Turnout'}
              </h3>
            </div>
            <div className="edit-card-body">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted">{isVi ? 'Đã nộp bài:' : 'Submitted:'}</span>
                <span className="font-bold text-main">
                  {turnoutStats.submitted} / {turnoutStats.total} {isVi ? 'học viên' : 'students'}
                </span>
              </div>
              <div className="w-full bg-light h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-forest h-full transition-all duration-300"
                  style={{ width: `${turnoutStats.total > 0 ? (turnoutStats.submitted / turnoutStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </section>

          {/* Modules Overview Summary Card */}
          <section className="edit-card">
            <div className="edit-card-header">
              <h3 className="edit-card-title">
                {isVi ? 'Tổng quan đề thi' : 'Exam Structure'}
              </h3>
            </div>
            <div className="edit-card-body">
              <div className="flex flex-col gap-2">
                {assignmentData.modules.map((m, i) => {
                  const displayName = m.title?.trim() || getSkillName(m.skill);
                  return (
                    <div key={m.id || i} className="flex items-center justify-between py-2 border-b border-light text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-forest flex-shrink-0">#{i + 1}</span>
                        <span className="font-semibold text-main truncate" title={displayName}>
                          {displayName}
                        </span>
                      </div>
                      <span className="font-semibold text-muted flex-shrink-0 ml-2">
                        {m.maxScore || 10} {isVi ? 'điểm' : 'pts'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <StickyActionBar
        leftActions={
          <button
            type="button"
            className="btn btn-secondary bg-white btn-sm"
            onClick={() => setShowPreviewModal(true)}
          >
            <Eye size={16} />
            <span>{isVi ? 'Xem trước đề thi' : 'Preview Exam'}</span>
          </button>
        }
        rightActions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-2"
              onClick={() => saveAssignmentChanges()}
              disabled={isSaving}
            >
              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isSaving ? (isVi ? 'Đang lưu thay đổi...' : 'Saving...') : (isVi ? 'Lưu thay đổi bài tập' : 'Save Changes')}</span>
            </button>
            {currentDbStatus === 'DRAFT' ? (
              <button
                type="button"
                className="btn btn-secondary bg-white btn-sm text-forest"
                onClick={() => saveAssignmentChanges('PUBLISHED')}
                disabled={isSaving}
              >
                <Send size={16} />
                <span>{isVi ? 'Xuất bản bài tập' : 'Publish'}</span>
              </button>
            ) : currentDbStatus === 'PUBLISHED' ? (
              <button
                type="button"
                className="btn btn-secondary bg-white btn-sm text-danger"
                onClick={() => saveAssignmentChanges('CLOSED')}
                disabled={isSaving}
              >
                <AlertCircle size={16} />
                <span>{isVi ? 'Đóng nộp bài' : 'Close Assignment'}</span>
              </button>
            ) : null}
          </div>
        }
      />

      {/* Preview Modal */}
      {showPreviewModal && (
        <AssignmentPreviewModal 
          onClose={() => setShowPreviewModal(false)}
          data={assignmentData}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-8 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-forest text-white shadow-xl animate-fade-in font-medium text-sm">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
          {lastSavedTime && <span className="text-xs opacity-80">• {lastSavedTime}</span>}
        </div>
      )}
    </div>
  );
};

export default TeacherEditAssignment;
