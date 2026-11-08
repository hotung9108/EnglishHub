import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, PenTool, Mic, BookOpen, Headphones, 
  Eye, Save, Send, Plus, Trash2, ArrowUp, ArrowDown,
  Layers, CheckCircle2, ChevronDown, RefreshCw
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
import { 
  type AssignmentEditorData, 
  type AssignmentSkill,
  type EditorModuleItem,
  type WritingConfig,
  type SpeakingConfig,
  type ReadingConfig,
  type ListeningConfig,
  createDefaultModuleItem
} from '../types/assignment-editor.types';
import { 
  SkillWritingEditor, 
  SkillSpeakingEditor, 
  SkillReadingEditor, 
  SkillListeningEditor,
  AssignmentPreviewModal
} from '../components/assignments/editor';
import { useToast } from '../components/common/ToastContext';
import { StickyActionBar } from '../components/common';
import { formatToLocalDateTimeInput, addDays } from '../utils/dateTime.utils';
import '../styles/teacher-assignment-edit.css';

export const TeacherCreateAssignment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

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

  // Multi-module management state
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const [assignmentData, setAssignmentData] = useState<AssignmentEditorData>(() => {
    const initialMod = createDefaultModuleItem(initialSkill, 1);
    return {
      id: `new-${Date.now()}`,
      code: `HW-${initialSkill.slice(0, 2).toUpperCase()}`,
      title: '',
      skill: initialSkill,
      className: '',
      startDate: formatToLocalDateTimeInput(),
      dueDate: formatToLocalDateTimeInput(addDays(new Date(), 7)),
      durationMinutes: 60,
      allowLate: true,
      status: 'active',
      targetAudience: 'all',
      notifyStudents: true,
      maxSubmissions: 3,
      modules: [initialMod]
    };
  });

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
    toastWarning(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClassSelectionChange = (classIdNum: number) => {
    setSelectedClassId(classIdNum);
    const matched = classes.find((c) => c.id === classIdNum);
    if (matched) {
      setAssignmentData((prev) => ({ ...prev, className: matched.name }));
    }
  };

  // Add a new module of any skill
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

  // Remove a module by index
  const handleRemoveModule = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (assignmentData.modules.length <= 1) {
      showToast(isVi ? 'Bài tập phải có ít nhất 1 phần thi / module!' : 'Assignment must contain at least 1 module!');
      return;
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

  // Update current active module's config
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

  // Update current active module's metadata (title, maxScore)
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

  const executeCreateAssignment = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!selectedClassId) {
      showToast(isVi ? 'Vui lòng chọn lớp học trước khi tạo đề!' : 'Please select a class!');
      return;
    }

    if (!assignmentData.title.trim()) {
      showToast(isVi ? 'Tiêu đề bài tập không được để trống!' : 'Title cannot be empty!');
      return;
    }

    const openTimestamp = assignmentData.startDate 
      ? new Date(assignmentData.startDate).getTime() 
      : Date.now();
    const closeTimestamp = assignmentData.dueDate 
      ? new Date(assignmentData.dueDate).getTime() 
      : Date.now() + 7 * 24 * 60 * 60 * 1000;

    if (!isNaN(openTimestamp) && !isNaN(closeTimestamp) && closeTimestamp <= openTimestamp) {
      showToast(isVi ? 'Ngày đóng phải sau ngày mở!' : 'Due date must be after opening date!');
      return;
    }

    if (assignmentData.modules.length === 0) {
      showToast(isVi ? 'Bài tập phải có ít nhất 1 phần thi!' : 'Assignment must have at least 1 module!');
      return;
    }

    // Comprehensive validation for all modules
    const isMulti = assignmentData.modules.length > 1;
    for (let i = 0; i < assignmentData.modules.length; i++) {
      const mod = assignmentData.modules[i];
      const modNum = i + 1;
      const modLabel = mod.title ? `"${mod.title}" (Phần ${modNum})` : `Phần ${modNum}: ${getSkillName(mod.skill)}`;
      const prefix = isMulti ? `${modLabel}: ` : '';

      if (mod.skill === 'writing') {
        const c = mod.config as WritingConfig;
        if (!c.promptText.trim()) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${prefix}Nội dung đề bài Writing không được để trống!` : `${prefix}Writing prompt cannot be empty!`);
          return;
        }
      } else if (mod.skill === 'speaking') {
        const c = mod.config as SpeakingConfig;
        const spPrompt = (c.promptText || c.cueCardTopic || '').trim();
        if (!spPrompt) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${prefix}Nội dung đề bài Speaking không được để trống!` : `${prefix}Speaking prompt cannot be empty!`);
          return;
        }
      } else if (mod.skill === 'reading') {
        const c = mod.config as ReadingConfig;
        if (!c.passageTitle.trim()) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${prefix}Tiêu đề bài đọc không được để trống!` : `${prefix}Passage title cannot be empty!`);
          return;
        }
        const pContent = (c.passageContent || c.paragraphs?.map(p => p.content).join('\n\n') || '').trim();
        if (!pContent) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${prefix}Nội dung văn bản bài đọc không được để trống!` : `${prefix}Passage content cannot be empty!`);
          return;
        }
        if (!c.questions || c.questions.length === 0) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${prefix}Vui lòng tạo ít nhất 1 câu hỏi cho bài đọc!` : `${prefix}Please add at least 1 question for the reading assignment!`);
          return;
        }
        for (let qIdx = 0; qIdx < c.questions.length; qIdx++) {
          const q = c.questions[qIdx];
          if (!q.prompt.trim()) {
            setActiveModuleIndex(i);
            showToast(isVi ? `${prefix}Nội dung câu hỏi Reading #${qIdx + 1} không được để trống!` : `${prefix}Reading question #${qIdx + 1} statement cannot be empty!`);
            return;
          }
          if (q.type === 'short_answer' && !q.correctAnswer.trim()) {
            setActiveModuleIndex(i);
            showToast(isVi ? `${prefix}Đáp án chính xác cho câu hỏi Reading #${qIdx + 1} không được để trống!` : `${prefix}Correct answer for reading question #${qIdx + 1} cannot be empty!`);
            return;
          }
        }
      } else if (mod.skill === 'listening') {
        const c = mod.config as ListeningConfig;
        if (!c.audioFile && !c.audioUrl?.trim()) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${prefix}Vui lòng chọn tệp âm thanh cho bài nghe!` : `${prefix}Please select an audio file for the listening assignment!`);
          return;
        }
        if (!c.questions || c.questions.length === 0) {
          setActiveModuleIndex(i);
          showToast(isVi ? `${prefix}Vui lòng tạo ít nhất 1 câu hỏi cho bài nghe!` : `${prefix}Please add at least 1 question for the listening assignment!`);
          return;
        }
        for (let qIdx = 0; qIdx < c.questions.length; qIdx++) {
          const q = c.questions[qIdx];
          if (!q.prompt.trim()) {
            setActiveModuleIndex(i);
            showToast(isVi ? `${prefix}Nội dung câu hỏi Listening #${qIdx + 1} không được để trống!` : `${prefix}Listening question #${qIdx + 1} statement cannot be empty!`);
            return;
          }
          if (q.type === 'short_answer' && !q.correctAnswer.trim()) {
            setActiveModuleIndex(i);
            showToast(isVi ? `${prefix}Đáp án chính xác cho câu hỏi Listening #${qIdx + 1} không được để trống!` : `${prefix}Correct answer for listening question #${qIdx + 1} cannot be empty!`);
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

      const mainDescription = isMulti
        ? assignmentData.modules
            .map((m, idx) => `[Phần ${idx + 1} - ${m.skill.toUpperCase()}${m.title ? `: ${m.title}` : ''}]: ${getInstructionsForModule(m)}`)
            .join('\n\n')
        : getInstructionsForModule(assignmentData.modules[0]);

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

      for (let sIdx = 0; sIdx < assignmentData.modules.length; sIdx++) {
        const mod = assignmentData.modules[sIdx];
        const orderIndex = sIdx + 1;
        const instructions = getInstructionsForModule(mod);
        let aiInstruction: string | undefined = undefined;
        if (mod.skill === 'writing') {
          aiInstruction = (mod.config as WritingConfig).aiInstruction || undefined;
        } else if (mod.skill === 'speaking') {
          aiInstruction = (mod.config as SpeakingConfig).aiInstruction || undefined;
        }

        const modRes = await moduleService.createModule(newAssignmentId, {
          skill: apiSkillMap[mod.skill],
          taskType: taskTypeMap[mod.skill],
          orderIndex,
          instructions,
          aiInstruction,
          maxScore: mod.maxScore || 10
        });
        const createdModuleId = modRes.id;

        // Upload audio file if skill is listening and file is present
        if (createdModuleId && mod.skill === 'listening') {
          const lConfig = mod.config as ListeningConfig;
          if (lConfig.audioFile) {
            try {
              await moduleService.uploadAudio(createdModuleId, lConfig.audioFile);
            } catch (audioErr) {
              console.error('Failed to upload audio file:', audioErr);
              showToast(isVi ? 'Không thể tải lên tệp âm thanh bài nghe. Vui lòng thử lại!' : 'Failed to upload audio file!');
              throw audioErr;
            }
          }
        }

        // Create questions for reading / listening in parallel with Promise.all
        if (createdModuleId && (mod.skill === 'reading' || mod.skill === 'listening')) {
          const qList = (mod.config as (ReadingConfig | ListeningConfig)).questions || [];
          if (qList.length > 0) {
            const moduleTotalScore = mod.maxScore || 10;
            const scorePerQ = moduleTotalScore / qList.length;
            const questionPromises = qList.map((q, i) => {
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
              return questionService.createQuestion(createdModuleId, payload);
            });
            await Promise.all(questionPromises);
          }
        }
      }

      // If status is PUBLISHED, publish assignment
      if (status === 'PUBLISHED') {
        try {
          await assignmentService.updateAssignmentStatus(newAssignmentId, 'PUBLISHED');
        } catch {
          // Status might already be active
        }
      }

      const successMsg = isVi 
        ? (status === 'PUBLISHED' ? 'Giao bài tập mới thành công!' : 'Đã lưu bản nháp bài tập mới!') 
        : (status === 'PUBLISHED' ? 'Assignment published successfully!' : 'Assignment draft saved!');
      toastSuccess(successMsg);
      setToastMessage(successMsg);

      setTimeout(() => {
        navigate('/teacher/assignments');
      }, 1000);
    } catch (err) {
      console.error('Failed to create assignment:', err);
      const errMsg = isVi ? 'Có lỗi xảy ra khi tạo bài tập. Vui lòng thử lại!' : 'Failed to create assignment. Please try again!';
      toastError(errMsg);
      showToast(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeModule = assignmentData.modules[activeModuleIndex] || assignmentData.modules[0];

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
        <span style={{ fontWeight: 700, color: 'var(--eh-text-primary, #161B19)' }}>
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
          {/* Schedule */}
          <section className="edit-card">
            <div className="edit-card-header">
              <h3 className="edit-card-title">
                {isVi ? 'Lịch trình bài tập' : 'Assignment Schedule'}
              </h3>
            </div>
            <div className="edit-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                  {isVi ? 'Thời gian mở đề' : 'Open Date'}
                </label>
                <input 
                  type="datetime-local" 
                  className="text-input"
                  value={assignmentData.startDate}
                  onChange={(e) => setAssignmentData({ ...assignmentData, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                  {isVi ? 'Hạn chót nộp bài (Deadline)' : 'Due Date'}
                </label>
                <input 
                  type="datetime-local" 
                  className="text-input"
                  value={assignmentData.dueDate}
                  onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
                  {isVi ? 'Số lần nộp tối đa' : 'Max Submissions'}
                </label>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  className="text-input"
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
            onClick={() => navigate('/teacher/assignments')}
          >
            {isVi ? 'Hủy bỏ' : 'Cancel'}
          </button>
        }
        rightActions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-secondary bg-white btn-sm"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye size={16} />
              <span>{isVi ? 'Xem thử giao diện học viên' : 'Preview as Student'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary bg-white btn-sm flex items-center gap-2"
              onClick={() => executeCreateAssignment('DRAFT')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isSubmitting ? (isVi ? 'Đang lưu...' : 'Saving...') : (isVi ? 'Lưu bản nháp' : 'Save Draft')}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => executeCreateAssignment('PUBLISHED')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span>{isSubmitting ? (isVi ? 'Đang giao bài...' : 'Publishing...') : (isVi ? 'Giao bài tập' : 'Create & Publish')}</span>
            </button>
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
        </div>
      )}
    </div>
  );
};

export default TeacherCreateAssignment;
