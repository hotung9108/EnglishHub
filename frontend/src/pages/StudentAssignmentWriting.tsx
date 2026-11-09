import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight, FileText, 
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
import { Button } from '../components/common';
import { ExamStepper } from '../components/assignments/ExamStepper';
import {
  getSkillRoute,
  getNextIncompleteModule,
  getSkillLabel,
  getExamPageRedirectRoute,
  resolveEffectiveModules,
  getBackendDocumentMimeType
} from '../utils/examStepper.utils';
import { notifyAssignmentSubmitted } from '../utils/assignmentEvents.utils';
import '../styles/student-writing.css';

const StudentAssignmentWriting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetailResponse | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editorText, setEditorText] = useState(() => {
    return localStorage.getItem(`eh_draft_writing_${id}`) || '';
  });

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
              moduleId
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
                moduleId
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
                  moduleId
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
  }, [numericId, id, searchParams, user?.id, reloadKey, navigate]);

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
      setError('Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp PDF hoặc DOCX.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('Kích thước tệp vượt quá giới hạn 10MB. Vui lòng chọn tệp nhỏ hơn.');
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

  const wordCount = editorText.trim() === '' ? 0 : editorText.trim().split(/\s+/).length;

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
    setEditorText('');
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
      setError('Bài tập này đã được giáo viên đóng. Không thể nộp bài.');
      return;
    }

    const trimmedText = editorText.trim();
    if (trimmedText === '' && !uploadedFile) {
      setError('Vui lòng nhập nội dung bài luận hoặc tải lên tệp bài làm trước khi nộp.');
      return;
    }
    if (!submission) {
      setError('Không tìm thấy phiên làm bài hợp lệ. Vui lòng tải lại trang hoặc liên hệ giáo viên.');
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
      setError('Không tìm thấy thông tin phần làm bài viết trong bài nộp.');
      return;
    }

    if (writingSubMod && (writingSubMod.status === 'SUBMITTED' || writingSubMod.status === 'GRADED')) {
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

      if (subId && allOthersDone) {
        await submissionService.submitSubmission(subId);
      }

      // Clear draft
      localStorage.removeItem(`eh_draft_writing_${id}`);

      if (allOthersDone) {
        notifyAssignmentSubmitted();
        setSuccessMessage('Nộp bài thành công! Đang chuyển đến màn hình kết quả...');
        setTimeout(() => {
          if (subId) {
            navigate(`/student/submissions/${subId}`, { replace: true });
          } else {
            navigate(`/student/assignments/${id}/result`, { replace: true });
          }
        }, 1200);
      } else {
        const resolvedMods = resolveEffectiveModules(assignment?.modules, currentSubModules);
        const nextMod = getNextIncompleteModule(resolvedMods, currentSubModules);
        if (nextMod) {
          const nextSkillLabel = getSkillLabel(nextMod.skill);
          setSuccessMessage(`Đã hoàn thành phần thi Writing! Đang chuyển tiếp sang ${nextSkillLabel}...`);
          const nextRoute = getSkillRoute(nextMod.skill, numericId, subId, nextMod.id);
          setTimeout(() => {
            navigate(nextRoute, { replace: true });
          }, 1200);
        } else {
          setSuccessMessage('Đã hoàn thành phần thi Writing! Đang quay lại trang tổng quan bài tập...');
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
    <div className="writing-container">
      {/* Breadcrumbs */}
      <div className="writing-breadcrumbs">
        <span className="writing-crumb-link" onClick={() => navigate('/student/dashboard')}>Trang chủ</span>
        <ChevronRight size={16} />
        <span className="writing-crumb-link" onClick={() => navigate('/student/assignments')}>Danh sách bài tập</span>
        <ChevronRight size={16} />
        <span className="writing-crumb-active">
          {assignment?.title || `Writing #${id}`}
        </span>
        {effectiveModules.length > 1 && (
          <div className="writing-stepper-wrapper">
            <ExamStepper
              variant="compact"
              modules={effectiveModules}
              submissionModules={submission?.modules}
              currentSkill="WRITING"
              assignmentId={numericId}
              submissionId={submission?.id}
              onSelectModule={(skill, step) => {
                if (!step.isCompleted && step.isAccessible && step.status !== 'ACTIVE') {
                  navigate(getSkillRoute(skill, numericId, submission?.id));
                }
              }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="analytics-error-banner">
          <div className="flex items-center gap-10">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRetry}
            icon={<RefreshCw size={13} />}
          >
            Thử lại
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="p-16 mb-20 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-10 text-emerald-800">
          <CheckCircle size={20} />
          <span className="text-sm font-semibold">{successMessage}</span>
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
              <div className="flex items-center gap-16">
                <div className="px-12 py-4 bg-slate-100 rounded-md text-xs text-slate-700 font-medium">
                  Đếm từ: <span className="text-primary font-bold">{wordCount}</span> / tối thiểu {parsedInstructions.minWords} từ
                </div>
                {isDraftSaved && (
                  <div className="flex items-center gap-6 text-xs text-emerald-600 font-medium">
                    <CheckCircle size={14} /> Đã lưu bản nháp!
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="writing-toolbar">
              <button type="button" className="writing-tool-btn"><Bold size={16} /></button>
              <button type="button" className="writing-tool-btn"><Italic size={16} /></button>
              <button type="button" className="writing-tool-btn"><Underline size={16} /></button>
              <div className="writing-tool-divider" />
              <button type="button" className="writing-tool-btn"><List size={16} /></button>
              <button type="button" className="writing-tool-btn"><ListOrdered size={16} /></button>
              <div className="writing-tool-divider" />
              <button type="button" className="writing-tool-btn"><AlignLeft size={16} /></button>
              <button type="button" className="writing-tool-btn"><AlignCenter size={16} /></button>
              <div className="writing-tool-divider" />
              <button type="button" className="writing-tool-btn"><Undo size={16} /></button>
              <button type="button" className="writing-tool-btn"><Redo size={16} /></button>
            </div>

            {/* Textarea */}
            <textarea 
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              placeholder="Nhập nội dung bài luận Writing của bạn tại đây... (Ví dụ: The given topic presents significant implications for...)"
              className="writing-textarea"
            />

            {/* Footer Editor */}
            <div className="writing-editor-footer">
              <div className="flex items-center gap-6 text-xs text-slate-500">
                <Info size={14} className="text-blue-500" />
                <span>Nội dung soạn thảo sẽ được bảo lưu khi bấm &quot;Lưu bản nháp&quot;.</span>
              </div>
              <button 
                type="button"
                onClick={handleClearEditor}
                className="bg-transparent border-none cursor-pointer text-xs font-semibold text-slate-600 underline"
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
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
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
                  <div className="writing-dropzone-hint">Hỗ trợ: PDF, DOCX (Tối đa 10MB)</div>
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
                {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài (Submit Writing)'}
              </Button>
              <p className="text-[11px] text-muted text-center -mt-1 mb-1">
                Lưu ý: Nộp bài cho riêng phần thi Viết này (không nộp toàn bộ bài tập).
              </p>

              <Button 
                variant="secondary"
                onClick={handleSaveDraft}
                className="w-full"
                icon={<Save size={18} />}
              >
                Lưu bản nháp (Save Draft)
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
  );
};

export default StudentAssignmentWriting;
