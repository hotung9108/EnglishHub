import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, FileText, 
  UploadCloud, Send, Save, CheckCircle, 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, Undo, Redo, Info,
  AlertCircle, RefreshCw, Loader2, X
} from 'lucide-react';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import {
  submissionService,
  type SubmissionDetail,
  type SubmissionListItem,
  type SubmitModulePayload,
} from '../api/services/submission.service';
import { parseApiError } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/ToastContext';
import { Button, MarkdownView } from '../components/common';
import { ExamStepper } from '../components/assignments/ExamStepper';
import {
  getSkillRoute,
  getNextIncompleteModule,
  getSkillLabel,
  getExamPageRedirectRoute,
  resolveEffectiveModules,
  getBackendDocumentMimeType
} from '../utils/examStepper.utils';
import { MIN_WRITING_WORDS, countWritingWords } from '../utils/writingEditor.utils';
import '../styles/student-exam.css';
import '../styles/student-writing.css';

const StudentAssignmentWriting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { warning: toastWarning, error: toastError, success: toastSuccess } = useToast();
  const isReviewMode = searchParams.get('mode') === 'review';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetailResponse | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editorText, setEditorText] = useState(() => {
    return localStorage.getItem(`eh_draft_writing_${id}`) || localStorage.getItem(`eh_last_writing_${id}`) || '';
  });
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [historyState, setHistoryState] = useState<{ entries: string[]; index: number }>(() => {
    const init = localStorage.getItem(`eh_draft_writing_${id}`) || localStorage.getItem(`eh_last_writing_${id}`) || '';
    return { entries: [init], index: 0 };
  });
  const history = historyState.entries;
  const historyIndex = historyState.index;
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [id]);

  const [reloadKey, setReloadKey] = useState(0);
  const handleRetry = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const parsedId = Number(id);
      if (!Number.isFinite(parsedId) || parsedId <= 0) {
        if (isMounted) {
          setError('Mã bài tập không hợp lệ.');
          setIsLoading(false);
        }
        return;
      }

      const resolveSubModuleQuestions = async (sub: SubmissionDetail) => {
        const writingMod = sub.modules?.find((m) => m.skill?.toUpperCase() === 'WRITING') || sub.modules?.[0];
        if (writingMod?.id) {
          try {
            await submissionService.getSubmissionModuleDetail(writingMod.id);
          } catch {
            // Fallback if detail call fails
          }
        }
      };

      try {
        // 1. Fetch assignment details
        let currentAssignment: AssignmentDetail | null = null;
        try {
          currentAssignment = await assignmentService.getAssignment(numericId);
          if (isMounted) setAssignment(currentAssignment);

          // If this assignment does NOT contain WRITING, redirect to appropriate skill route
          const hasWriting = currentAssignment?.modules?.some((m) => m.skill?.toUpperCase() === 'WRITING');
          if (!hasWriting && currentAssignment?.modules && currentAssignment.modules.length > 0) {
            const targetSkill = currentAssignment.modules[0].skill?.toLowerCase();
            const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
            if (targetSkill === 'reading') {
              navigate(`/student/assignments/reading/${numericId}${queryStr}`, { replace: true });
              return;
            }
            if (targetSkill === 'listening') {
              navigate(`/student/assignments/listening/${numericId}${queryStr}`, { replace: true });
              return;
            }
            if (targetSkill === 'speaking') {
              navigate(`/student/assignments/speaking/${numericId}${queryStr}`, { replace: true });
              return;
            }
          }
        } catch {
          currentAssignment = {
            id: numericId,
            title: `Writing Task: #${id || '1'}`,
            status: 'PUBLISHED',
            modules: [{ id: 1, skill: 'WRITING' }]
          };
          if (isMounted) setAssignment(currentAssignment);
        }

        // 2. Fetch writing module details & initial submission in parallel
        const urlModId = Number(searchParams.get('moduleId'));
        const matchedMod = urlModId
          ? currentAssignment?.modules?.find((m) => m.id === urlModId)
          : null;
        const writingMod = matchedMod || currentAssignment?.modules?.find((m) => m.skill?.toUpperCase() === 'WRITING');
        const moduleId = writingMod?.id || currentAssignment?.modules?.[0]?.id;
        const urlSubmissionId = searchParams.get('submissionId');

        const [modRes, initialSubRes] = await Promise.allSettled([
          moduleId ? moduleService.getModule(moduleId) : Promise.reject('No module'),
          urlSubmissionId && Number.isFinite(Number(urlSubmissionId))
            ? submissionService.getSubmission(Number(urlSubmissionId))
            : user?.id
            ? submissionService.listSubmissions({
                assignmentId: numericId,
                studentId: user.id,
                status: 'IN_PROGRESS',
                limit: 1,
              })
            : Promise.reject('No submission query')
        ]);

        if (!isMounted) return;

        if (modRes.status === 'fulfilled') {
          setModuleDetail(modRes.value);
        }

        // 3. Resolve or start submission attempt with Route Guard
        if (urlSubmissionId && Number.isFinite(Number(urlSubmissionId))) {
          if (initialSubRes.status === 'fulfilled' && 'id' in initialSubRes.value) {
            const sub = initialSubRes.value as SubmissionDetail;
            const redirectRoute = getExamPageRedirectRoute(
              sub,
              'WRITING',
              numericId,
              currentAssignment?.modules,
              moduleId,
              isReviewMode
            );
            if (redirectRoute) {
              navigate(redirectRoute, { replace: true });
              return;
            }
            setSubmission(sub);
            void resolveSubModuleQuestions(sub);
          } else if (initialSubRes.status === 'rejected') {
            const apiErr = parseApiError(initialSubRes.reason);
            setError(apiErr.message || 'Không thể tải thông tin bài nộp.');
          }
        } else if (user?.id) {
          try {
            let inProgressItem: SubmissionListItem | undefined;
            if (initialSubRes.status === 'fulfilled' && 'data' in initialSubRes.value) {
              inProgressItem = initialSubRes.value.data?.[0];
            } else {
              const inProgressRes = await submissionService.listSubmissions({
                assignmentId: numericId,
                studentId: user.id,
                status: 'IN_PROGRESS',
                limit: 1,
              });
              inProgressItem = inProgressRes.data?.[0];
            }

            if (inProgressItem) {
              const sub = await submissionService.getSubmission(inProgressItem.id);
              if (!isMounted) return;
              const redirectRoute = getExamPageRedirectRoute(
                sub,
                'WRITING',
                numericId,
                currentAssignment?.modules,
                moduleId,
                isReviewMode
              );
              if (redirectRoute) {
                navigate(redirectRoute, { replace: true });
                return;
              }
              setSubmission(sub);
              void resolveSubModuleQuestions(sub);
            } else {
              const subList = await submissionService.listSubmissions({
                assignmentId: numericId,
                studentId: user.id,
                limit: 10,
              });
              const subs = subList.data || [];
              const completedItem =
                subs.find((s) => s.status === 'GRADED') ||
                subs.find((s) => s.status === 'SUBMITTED') ||
                subs[0];

              if (completedItem && (completedItem.status === 'GRADED' || completedItem.status === 'SUBMITTED')) {
                if (isMounted) {
                  navigate(`/student/submissions/${completedItem.id}`, { replace: true });
                }
                return;
              }

              if (currentAssignment?.status === 'PUBLISHED') {
                const startRes = await submissionService.startAttempt(numericId);
                const sub = await submissionService.getSubmission(startRes.id);
                if (!isMounted) return;
                const redirectRoute = getExamPageRedirectRoute(
                  sub,
                  'WRITING',
                  numericId,
                  currentAssignment?.modules,
                  moduleId,
                  isReviewMode
                );
                if (redirectRoute) {
                  navigate(redirectRoute, { replace: true });
                  return;
                }
                setSubmission(sub);
                void resolveSubModuleQuestions(sub);
              } else if (currentAssignment?.status === 'CLOSED') {
                if (isMounted) {
                  setError('Bài tập này đã được giáo viên đóng. Học viên không thể làm bài hoặc nộp bài.');
                }
              } else if (currentAssignment?.status) {
                if (isMounted) {
                  const statusLabel = currentAssignment.status === 'DRAFT' ? 'Nháp (DRAFT - Chưa công bố)' : currentAssignment.status;
                  setError(`Bài tập này hiện không mở để làm bài (Trạng thái: ${statusLabel}). Vui lòng liên hệ giáo viên để công bố bài tập.`);
                }
              }
            }
          } catch (subErr: unknown) {
            if (isMounted) {
              const apiErr = parseApiError(subErr);
              setError(apiErr.message || 'Không thể bắt đầu phiên làm bài.');
            }
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải đề bài.';
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [numericId, id, searchParams, user?.id, reloadKey, navigate, isReviewMode]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validExtensions = ['.pdf', '.docx'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const hasValidMime = file.type ? validMimes.includes(file.type) : true;

    if (!hasValidExt && !hasValidMime) {
      toastError('Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp PDF hoặc DOCX.');
      return;
    }

    if (file.size === 0) {
      toastError('Tệp tải lên không được rỗng (0 bytes). Vui lòng chọn tệp bài viết hợp lệ.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toastError('Kích thước tệp vượt quá giới hạn 10MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const effectiveModules = useMemo(
    () => resolveEffectiveModules(assignment?.modules, submission?.modules),
    [assignment?.modules, submission?.modules]
  );

  const wordCount = useMemo(() => countWritingWords(editorText), [editorText]);

  const pushHistoryEntry = useCallback((newText: string, baseText?: string) => {
    setHistoryState((prev) => {
      const trimmed = prev.entries.slice(0, prev.index + 1);
      const next = [...trimmed];
      if (baseText !== undefined && (next.length === 0 || next[next.length - 1] !== baseText)) {
        next.push(baseText);
      }
      if (next.length === 0 || next[next.length - 1] !== newText) {
        next.push(newText);
      }
      return {
        entries: next,
        index: next.length - 1,
      };
    });
  }, []);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const target = e.target;
    selectionRef.current = { start: target.selectionStart, end: target.selectionEnd };
    const currentBase = editorText;
    setEditorText(val);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      pushHistoryEntry(val, currentBase);
    }, 400);
  };

  const updateTextWithHistory = (newText: string, newCursorStart?: number, newCursorEnd?: number) => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    const currentBase = editorText;
    setEditorText(newText);
    pushHistoryEntry(newText, currentBase);

    const targetStart = newCursorStart !== undefined ? newCursorStart : newText.length;
    const targetEnd = newCursorEnd !== undefined ? newCursorEnd : targetStart;
    selectionRef.current = { start: targetStart, end: targetEnd };

    if (textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(targetStart, targetEnd);
        }
      }, 0);
    }
  };

  const handleUndo = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    setHistoryState((prev) => {
      if (prev.index <= 0) return prev;
      const nextIdx = prev.index - 1;
      setEditorText(prev.entries[nextIdx]);
      return { ...prev, index: nextIdx };
    });
  };

  const handleRedo = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    setHistoryState((prev) => {
      if (prev.index >= prev.entries.length - 1) return prev;
      const nextIdx = prev.index + 1;
      setEditorText(prev.entries[nextIdx]);
      return { ...prev, index: nextIdx };
    });
  };

  const getActiveSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return selectionRef.current;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    if (start === 0 && end === 0 && selectionRef.current.end > 0) {
      return selectionRef.current;
    }
    return { start, end };
  };

  const applyWrap = (before: string, after: string, placeholder = 'nội dung') => {
    const { start, end } = getActiveSelection();
    const selected = editorText.substring(start, end);

    // Check if selection is already wrapped with before/after
    if (
      selected.startsWith(before) &&
      selected.endsWith(after) &&
      selected.length >= before.length + after.length
    ) {
      const unwrapped = selected.substring(before.length, selected.length - after.length);
      const nextText = editorText.substring(0, start) + unwrapped + editorText.substring(end);
      updateTextWithHistory(nextText, start, start + unwrapped.length);
      return;
    }

    // Check if surrounding text outside selection is before/after
    const outerBefore = editorText.substring(start - before.length, start);
    const outerAfter = editorText.substring(end, end + after.length);
    if (outerBefore === before && outerAfter === after) {
      const nextText = editorText.substring(0, start - before.length) + selected + editorText.substring(end + after.length);
      updateTextWithHistory(nextText, start - before.length, start - before.length + selected.length);
      return;
    }

    const content = selected || placeholder;
    const newSegment = `${before}${content}${after}`;
    const nextText = editorText.substring(0, start) + newSegment + editorText.substring(end);
    const newStart = selected ? start : start + before.length;
    const newEnd = selected ? start + newSegment.length : start + before.length + content.length;
    updateTextWithHistory(nextText, newStart, newEnd);
  };

  const applyList = (ordered: boolean) => {
    const { start, end } = getActiveSelection();

    const lineStart = editorText.lastIndexOf('\n', start - 1) + 1;
    const nextNewline = editorText.indexOf('\n', end);
    const lineEnd = nextNewline === -1 ? editorText.length : nextNewline;

    const targetText = editorText.substring(lineStart, lineEnd);
    if (!targetText.trim()) {
      const placeholder = ordered ? '1. ' : '- ';
      const nextText = editorText.substring(0, lineStart) + placeholder + editorText.substring(lineEnd);
      updateTextWithHistory(nextText, lineStart + placeholder.length, lineStart + placeholder.length);
      return;
    }

    const lines = targetText.split('\n');
    const isAlreadyBullet = lines.every((l) => l.trim().startsWith('- '));
    const isAlreadyOrdered = lines.every((l) => /^\d+\.\s/.test(l.trim()));

    let transformed: string[];
    if ((!ordered && isAlreadyBullet) || (ordered && isAlreadyOrdered)) {
      transformed = lines.map((l) => l.replace(/^\s*(- |\d+\.\s)/, ''));
    } else {
      transformed = lines.map((l, idx) => {
        const clean = l.replace(/^\s*(- |\d+\.\s)/, '');
        return ordered ? `${idx + 1}. ${clean}` : `- ${clean}`;
      });
    }

    const joined = transformed.join('\n');
    const nextText = editorText.substring(0, lineStart) + joined + editorText.substring(lineEnd);
    updateTextWithHistory(nextText, lineStart, lineStart + joined.length);
  };

  const applyAlignment = (alignment: 'left' | 'center') => {
    const { start, end } = getActiveSelection();
    const selected = editorText.substring(start, end) || editorText;

    if (alignment === 'left') {
      const cleaned = selected
        .replace(/<div align=["']?(?:center|right|left)["']?>\s*/gi, '')
        .replace(/\s*<\/div>/gi, '');
      if (selected === editorText) {
        updateTextWithHistory(cleaned, 0, cleaned.length);
      } else {
        const nextText = editorText.substring(0, start) + cleaned + editorText.substring(end);
        updateTextWithHistory(nextText, start, start + cleaned.length);
      }
    } else {
      const centerWrapped = `<div align="center">\n${selected.trim()}\n</div>`;
      if (selected === editorText) {
        updateTextWithHistory(centerWrapped, 0, centerWrapped.length);
      } else {
        const nextText = editorText.substring(0, start) + centerWrapped + editorText.substring(end);
        updateTextWithHistory(nextText, start, start + centerWrapped.length);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (isMod) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        applyWrap('**', '**', 'nội dung in đậm');
      } else if (key === 'i') {
        e.preventDefault();
        applyWrap('*', '*', 'nội dung in nghiêng');
      } else if (key === 'u') {
        e.preventDefault();
        applyWrap('<u>', '</u>', 'nội dung gạch chân');
      } else if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  // Auto-save draft with debounce when typing
  useEffect(() => {
    if (!id || isSubmitting) return;
    const trimmed = editorText.trim();
    if (!trimmed) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (!isSubmitting) {
        localStorage.setItem(`eh_draft_writing_${id}`, editorText);
      }
    }, 2500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [editorText, id, isSubmitting]);

  const handleClearEditor = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setEditorText('');
    setHistoryState({ entries: [''], index: 0 });
    localStorage.removeItem(`eh_draft_writing_${id}`);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(`eh_draft_writing_${id}`, editorText);
    setIsDraftSaved(true);
    setTimeout(() => setIsDraftSaved(false), 3000);
  };

  const handleSubmit = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (assignment?.status === 'CLOSED') {
      toastError('Bài tập này đã được giáo viên đóng. Không thể nộp bài.');
      return;
    }

    const trimmedText = editorText.trim();
    if (!uploadedFile) {
      if (trimmedText === '') {
        toastWarning('Vui lòng nhập nội dung bài luận hoặc tải lên tệp bài làm trước khi nộp.');
        return;
      }
      if (wordCount < MIN_WRITING_WORDS) {
        toastWarning(`Bài viết chưa đạt độ dài tối thiểu (${wordCount}/${MIN_WRITING_WORDS} từ). Vui lòng viết ít nhất ${MIN_WRITING_WORDS} từ trước khi nộp.`);
        return;
      }
    }
    if (!submission) {
      toastError('Không tìm thấy phiên làm bài hợp lệ. Vui lòng tải lại trang hoặc liên hệ giáo viên.');
      return;
    }

    const subId = submission.id;
    const urlModId = Number(searchParams.get('moduleId'));
    const matchedSubMod = urlModId
      ? submission.modules?.find((m) => m.moduleId === urlModId)
      : null;
    const writingSubMod = matchedSubMod || submission.modules?.find((m) => m.skill?.toUpperCase() === 'WRITING');
    const subModuleId = writingSubMod?.id || submission.modules?.[0]?.id;

    if (!subModuleId) {
      toastError('Không tìm thấy thông tin phần làm bài viết trong bài nộp.');
      return;
    }

    if (writingSubMod && (writingSubMod.status === 'SUBMITTED' || writingSubMod.status === 'GRADED') && !isReviewMode) {
      navigate(`/student/submissions/${subId}`, { replace: true });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      let uploadedStorageKey: string | undefined = undefined;

      // Determine file to upload: use user-attached file or package typed editor text into essay.txt
      let fileToUpload: File | null = uploadedFile;
      if (!fileToUpload && trimmedText !== '') {
        const textBlob = new Blob([trimmedText], { type: 'text/plain;charset=utf-8' });
        fileToUpload = new File([textBlob], 'essay.txt', { type: 'text/plain;charset=utf-8' });
      }

      // 1. Upload document file via consolidated helper (FE-73 / FE-74)
      if (fileToUpload) {
        const mimeType = getBackendDocumentMimeType(fileToUpload);
        try {
          const uploadRes = await submissionService.uploadDocument(subModuleId, fileToUpload, mimeType);
          if (!uploadRes || !uploadRes.storageKey) {
            throw new Error('Không nhận được mã lưu trữ tệp từ máy chủ.');
          }
          uploadedStorageKey = uploadRes.storageKey;
        } catch (uploadErr) {
          console.error('Document storage upload failed:', uploadErr);
          const uploadMsg = uploadErr instanceof Error ? uploadErr.message : 'Tải tệp bài làm lên kho lưu trữ thất bại.';
          setError(`Lỗi tải tệp đính kèm: ${uploadMsg}`);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Submit module with storageKey, eliminating raw text streaming to backend (FE-74)
      const submitPayload: SubmitModulePayload = {
        answers: [],
      };

      if (uploadedStorageKey) {
        submitPayload.storageKey = uploadedStorageKey;
      }

      await submissionService.submitModule(subModuleId, submitPayload);

      const currentSubModules = (submission.modules || []).map((m) =>
        m.id === subModuleId ? { ...m, status: 'SUBMITTED' as const } : m
      );
      setSubmission((prev) => (prev ? { ...prev, modules: currentSubModules } : prev));

      // 3. Check if all modules in this submission are now completed
      const otherModules = submission?.modules?.filter((m) => m.id !== subModuleId) || [];
      const allOthersDone = otherModules.length === 0 || otherModules.every((m) => m.status === 'SUBMITTED' || m.status === 'GRADED');

      // Save submitted text so student can review or edit if returning
      if (trimmedText) {
        localStorage.setItem(`eh_last_writing_${id}`, trimmedText);
      }
      // Clear draft
      localStorage.removeItem(`eh_draft_writing_${id}`);

      if (isReviewMode || allOthersDone) {
        toastSuccess('Nộp bài thành công! Đang chuyển đến màn hình xem lại bài làm...');
        setTimeout(() => {
          navigate(`/student/assignments/${id}/overview`, { replace: true });
        }, 1200);
      } else {
        const resolvedMods = resolveEffectiveModules(assignment?.modules, currentSubModules);
        const nextMod = getNextIncompleteModule(resolvedMods, currentSubModules);
        if (nextMod) {
          const nextSkillLabel = getSkillLabel(nextMod.skill);
          toastSuccess(`Đã hoàn thành phần thi Writing! Đang chuyển tiếp sang ${nextSkillLabel}...`);
          const nextRoute = getSkillRoute(nextMod.skill, numericId, subId, nextMod.id);
          setTimeout(() => {
            navigate(nextRoute, { replace: true });
          }, 1200);
        } else {
          toastSuccess('Đã hoàn thành phần thi Writing! Đang quay lại trang tổng quan bài tập...');
          setTimeout(() => {
            navigate(`/student/assignments/${id}/overview`, { replace: true });
          }, 1200);
        }
      }
    } catch (err: unknown) {
      console.error('Submit writing assignment error:', err);
      const apiErr = parseApiError(err);
      setError(apiErr.message || 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedInstructions = useMemo(() => {
    const raw = moduleDetail?.instructions || '';
    if (!raw.trim()) {
      return {
        prompt: 'Yêu cầu: Hoàn thành bài viết Writing (tối thiểu 150 từ). Trình bày rõ ràng các luận điểm, phân tích dẫn chứng trọng tâm và bố cục mạch lạc. Bài nộp sẽ được AI phân tích từ vựng, ngữ pháp và chấm điểm theo thang điểm 10.',
        minWords: 150,
        diagramUrl: null as string | null
      };
    }
    const minWordsMatch = raw.match(/<!--\s*minWords:\s*(\d+)\s*-->/i) || raw.match(/tối thiểu\s*(\d+)\s*từ/i) || raw.match(/minimum\s*(\d+)\s*words/i);
    const minWords = minWordsMatch ? Number(minWordsMatch[1]) : 150;
    
    const imgMatch = raw.match(/!\[(?:Diagram|Chart|Biểu đồ)?\]\((https?:\/\/[^\s)]+|data:image\/[^)]+)\)/i);
    const diagramUrl = imgMatch ? imgMatch[1] : null;

    const cleanPrompt = raw
      .replace(/<!--\s*minWords:\s*\d+\s*-->/gi, '')
      .replace(/!\[(?:Diagram|Chart|Biểu đồ)?\]\((https?:\/\/[^\s)]+|data:image\/[^)]+)\)/gi, '')
      .trim();

    return {
      prompt: cleanPrompt || raw,
      minWords,
      diagramUrl
    };
  }, [moduleDetail?.instructions]);

  const writingSubMod = submission?.modules?.find((m) => m.skill?.toUpperCase() === 'WRITING');
  const maxScore = moduleDetail?.maxScore ?? writingSubMod?.grading?.maxScoreSnapshot ?? 10;

  return (
    <div className="exam-page">
      {/* Unified Exam Header */}
      <div className="exam-header">
        <div className="exam-header-left">
          <Button 
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(`/student/assignments/${id}/overview`)}
          >
            Tổng quan bài thi
          </Button>
          
          <div className="exam-breadcrumbs">
            <span className="exam-breadcrumbs-link" onClick={() => navigate('/student/dashboard')}>
              Trang chủ
            </span>
            <ChevronRight size={14} />
            <span className="exam-breadcrumbs-link" onClick={() => navigate('/student/assignments')}>
              Danh sách bài tập
            </span>
            <ChevronRight size={14} />
            <span className="exam-breadcrumbs-title">
              {assignment?.title || `Writing #${id}`}
            </span>
            <ChevronRight size={14} />
            <span className="exam-skill-badge exam-skill-badge-writing">
              Kỹ năng Viết
            </span>
          </div>
        </div>

        {effectiveModules.length > 1 && (
          <div className="exam-header-right">
            <ExamStepper
              variant="compact"
              modules={effectiveModules}
              submissionModules={submission?.modules}
              currentSkill="WRITING"
              assignmentId={numericId}
              submissionId={submission?.id}
              onSelectModule={(skill, step) => {
                if (step.isAccessible && step.status !== 'ACTIVE') {
                  const baseRoute = getSkillRoute(skill, numericId, submission?.id, step.module.id);
                  const targetUrl = step.isCompleted ? `${baseRoute}&mode=review` : baseRoute;
                  navigate(targetUrl);
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="exam-workspace-full">
        {error && (
          <div className="exam-alert-error mb-4" role="alert">
            <div className="exam-alert-msg">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={RefreshCw}
              onClick={handleRetry}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Main Layout - 2 Columns */}
        <div className="writing-grid">
        {/* Left Column */}
        <div className="writing-main-col">
          {/* Instructions */}
          <div className="writing-card">
            <div className="writing-prompt-box">
              <span className="writing-prompt-icon"><Info size={16} /></span>
              <div className="writing-prompt-content flex flex-col gap-3 flex-1">
                <p className="writing-prompt-text whitespace-pre-line">
                  {isLoading ? 'Đang tải yêu cầu đề bài...' : parsedInstructions.prompt}
                </p>
                {parsedInstructions.diagramUrl && (
                  <div className="writing-diagram-container p-2 bg-white rounded-lg border border-slate-200 shadow-sm max-w-xl">
                    <img 
                      src={parsedInstructions.diagramUrl} 
                      alt="Writing Task Diagram" 
                      className="w-full max-h-96 object-contain rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text Editor */}
          <div className="writing-card">
            <div className="writing-editor-header">
              <div className="writing-word-counter-group">
                <div className={`writing-word-count-badge ${
                  wordCount >= MIN_WRITING_WORDS ? 'is-valid' : 'is-warning'
                }`}>
                  <span>Đếm từ: <span className={wordCount >= MIN_WRITING_WORDS ? 'text-primary font-bold' : 'text-amber-800 font-bold'}>{wordCount}</span> / tối thiểu {parsedInstructions.minWords} từ</span>
                </div>
                {wordCount < MIN_WRITING_WORDS && !uploadedFile && (
                  <span className="writing-min-pill" title="Yêu cầu tối thiểu để AI có thể chấm điểm bài viết">
                    (Tối thiểu hệ thống: {MIN_WRITING_WORDS} từ)
                  </span>
                )}
                {isDraftSaved && (
                  <div className="flex items-center gap-6 text-xs text-emerald-600 font-medium ml-4">
                    <CheckCircle size={14} /> Đã lưu bản nháp!
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="writing-toolbar">
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyWrap('**', '**', 'nội dung in đậm')} 
                title="In đậm (Ctrl+B)" 
                aria-label="In đậm (Ctrl+B)"
                disabled={editorMode === 'preview'}
              >
                <Bold size={16} />
              </button>
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyWrap('*', '*', 'nội dung in nghiêng')} 
                title="In nghiêng (Ctrl+I)" 
                aria-label="In nghiêng (Ctrl+I)"
                disabled={editorMode === 'preview'}
              >
                <Italic size={16} />
              </button>
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyWrap('<u>', '</u>', 'nội dung gạch chân')} 
                title="Gạch chân (Ctrl+U)" 
                aria-label="Gạch chân (Ctrl+U)"
                disabled={editorMode === 'preview'}
              >
                <Underline size={16} />
              </button>
              <div className="writing-tool-divider" />
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyList(false)} 
                title="Danh sách dấu đầu dòng" 
                aria-label="Danh sách dấu đầu dòng"
                disabled={editorMode === 'preview'}
              >
                <List size={16} />
              </button>
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyList(true)} 
                title="Danh sách số" 
                aria-label="Danh sách số"
                disabled={editorMode === 'preview'}
              >
                <ListOrdered size={16} />
              </button>
              <div className="writing-tool-divider" />
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyAlignment('left')} 
                title="Căn trái" 
                aria-label="Căn trái"
                disabled={editorMode === 'preview'}
              >
                <AlignLeft size={16} />
              </button>
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyAlignment('center')} 
                title="Căn giữa" 
                aria-label="Căn giữa"
                disabled={editorMode === 'preview'}
              >
                <AlignCenter size={16} />
              </button>
              <div className="writing-tool-divider" />
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleUndo} 
                title="Hoàn tác (Ctrl+Z)" 
                aria-label="Hoàn tác (Ctrl+Z)"
                disabled={historyIndex <= 0 || editorMode === 'preview'}
              >
                <Undo size={16} />
              </button>
              <button 
                type="button" 
                className="writing-tool-btn" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleRedo} 
                title="Làm lại (Ctrl+Y)" 
                aria-label="Làm lại (Ctrl+Y)"
                disabled={historyIndex >= history.length - 1 || editorMode === 'preview'}
              >
                <Redo size={16} />
              </button>

              <div className="writing-editor-mode-toggle">
                <button
                  type="button"
                  className={`writing-mode-tab ${editorMode === 'edit' ? 'is-active' : ''}`}
                  onClick={() => setEditorMode('edit')}
                  aria-label="Chế độ soạn thảo"
                >
                  Soạn thảo
                </button>
                <button
                  type="button"
                  className={`writing-mode-tab ${editorMode === 'preview' ? 'is-active' : ''}`}
                  onClick={() => setEditorMode('preview')}
                  aria-label="Chế độ xem trước định dạng"
                >
                  Xem trước
                </button>
              </div>
            </div>

            {/* Editor or Preview Container */}
            {editorMode === 'edit' ? (
              <textarea 
                ref={textareaRef}
                value={editorText}
                onChange={handleEditorChange}
                onSelect={(e) => {
                  const el = e.currentTarget;
                  selectionRef.current = { start: el.selectionStart, end: el.selectionEnd };
                }}
                onKeyDown={handleKeyDown}
                placeholder="Nhập nội dung bài luận Writing của bạn tại đây... (Ví dụ: The given topic presents significant implications for...)"
                className="writing-textarea"
              />
            ) : (
              <div className="writing-preview-container">
                {editorText.trim() ? (
                  <MarkdownView content={editorText} />
                ) : (
                  <div className="writing-preview-empty">
                    Chưa có nội dung để xem trước định dạng. Hãy chuyển sang tab "Soạn thảo" để nhập bài viết.
                  </div>
                )}
              </div>
            )}

            {/* Footer Editor */}
            <div className="writing-editor-footer">
              <button 
                type="button"
                onClick={handleClearEditor}
                className="bg-transparent border-none cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700 underline ml-auto"
              >
                Xóa bài viết &amp; Làm lại từ đầu
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="writing-side-col">
          {/* Your Submission */}
          <div className="writing-card">
            {/* File Upload / Dropzone */}
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain" 
              onChange={handleFileChange} 
            />

            {!uploadedFile ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`writing-dropzone ${isDragging ? 'dragging' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="writing-dropzone-icon">
                  <UploadCloud size={26} />
                </div>

                <div className="writing-dropzone-content">
                  <div className="writing-dropzone-title">
                    Kéo thả tệp hoặc <span className="writing-dropzone-highlight">chọn từ máy tính</span>
                  </div>
                  <div className="writing-dropzone-hint">Hỗ trợ: PDF, DOCX, TXT (Tối đa 10MB)</div>
                </div>
              </div>
            ) : (
              <div className="writing-uploaded-file">
                <div className={`writing-file-icon ${uploadedFile.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx'}`}>
                  <FileText size={20} />
                </div>
                <div className="writing-file-info">
                  <div className="writing-file-name" title={uploadedFile.name}>
                    {uploadedFile.name}
                  </div>
                  <div className="writing-file-size">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadedFile.name.toLowerCase().endsWith('.pdf') ? 'Tệp PDF' : 'Tệp Word (DOCX)'}
                  </div>
                </div>
                <div className="writing-file-actions">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer"
                    title="Chọn tệp khác"
                  >
                    Đổi tệp
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="writing-file-remove-btn"
                    title="Xóa tệp"
                    aria-label="Xóa tệp đã chọn"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="writing-submission-actions">
              <Button 
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
                icon={isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              >
                {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài (Submit)'}
              </Button>

              <Button 
                variant="secondary"
                onClick={handleSaveDraft}
                className="w-full"
                icon={<Save size={18} />}
              >
                Lưu bản nháp
              </Button>
            </div>
          </div>

          {/* Grading Card */}
          <div className="writing-card">
            <h3 className="writing-card-title">Thông tin chấm điểm</h3>
            
            <div>
              <div className="writing-info-row">
                <span className="writing-info-label">Thang điểm:</span>
                <span className="writing-info-val">{maxScore} điểm</span>
              </div>
              
              <div className="writing-info-row">
                <span className="writing-info-label">Lượt làm bài:</span>
                <span className="writing-info-val">
                  Lần {submission?.attemptNumber ?? 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default StudentAssignmentWriting;
