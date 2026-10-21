import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight, FileText, 
  UploadCloud, Send, Save, CheckCircle, 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, Undo, Redo, Info,
  AlertCircle, RefreshCw, Loader2, X
} from 'lucide-react';
import { parseApiError } from '../api';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { 
  submissionService, 
  type SubmissionDetail,
  type SubmitModulePayload 
} from '../api/services/submission.service';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common';
import '../styles/student-writing.css';

const getDocumentMimeType = (file: File): string => {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return 'application/pdf';
};

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
  const [editorText, setEditorText] = useState(() => {
    return localStorage.getItem(`eh_draft_writing_${id}`) || '';
  });

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [id]);

  const [reloadKey, setReloadKey] = useState(0);
  const handleRetry = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
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

        // 2. Fetch writing module details if available
        const writingMod = currentAssignment?.modules?.find((m) => m.skill?.toUpperCase() === 'WRITING');
        const moduleId = writingMod?.id || currentAssignment?.modules?.[0]?.id;
        if (moduleId) {
          try {
            const mod = await moduleService.getModule(moduleId);
            if (isMounted) setModuleDetail(mod);
          } catch {
            // Module endpoint fallback
          }
        }

        // 3. Resolve or start submission attempt
        const urlSubmissionId = searchParams.get('submissionId');
        if (urlSubmissionId && Number.isFinite(Number(urlSubmissionId))) {
          try {
            const sub = await submissionService.getSubmission(Number(urlSubmissionId));
            if (isMounted) setSubmission(sub);
          } catch {
            // Fallback
          }
        } else if (user?.id) {
          try {
            const subList = await submissionService.listSubmissions({
              assignmentId: numericId,
              studentId: user.id,
              status: 'IN_PROGRESS',
              limit: 1
            });
            if (subList.data && subList.data.length > 0) {
              const sub = await submissionService.getSubmission(subList.data[0].id);
              if (isMounted) setSubmission(sub);
            } else {
              const startRes = await submissionService.startAttempt(numericId);
              const sub = await submissionService.getSubmission(startRes.id);
              if (isMounted) setSubmission(sub);
            }
          } catch {
            // Fallback if unable to start or list
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

    if (!hasValidExt) {
      setError('Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp PDF (.pdf) hoặc Word (.docx).');
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

  const wordCount = editorText.trim() === '' ? 0 : editorText.trim().split(/\s+/).length;

  const handleSaveDraft = () => {
    localStorage.setItem(`eh_draft_writing_${id}`, editorText);
    setIsDraftSaved(true);
    setTimeout(() => setIsDraftSaved(false), 3000);
  };

  const handleSubmit = async () => {
    const trimmedText = editorText.trim();
    const hasText = trimmedText.length > 0;
    const hasFile = !!uploadedFile;

    if (!hasText && !hasFile) {
      setError('Vui lòng nhập nội dung bài luận hoặc tải lên tệp bài làm (.pdf, .docx) trước khi nộp.');
      return;
    }

    if (!submission?.id) {
      setError('Không tìm thấy phiên làm bài hợp lệ. Vui lòng tải lại trang hoặc liên hệ giáo viên.');
      return;
    }

    const writingSubMod = submission.modules?.find((m) => m.skill?.toUpperCase() === 'WRITING');
    const subModuleId = writingSubMod?.id || submission.modules?.[0]?.id;

    if (!subModuleId) {
      setError('Không tìm thấy thông tin phần làm bài viết trong bài nộp.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const subId = submission.id;
      let docStorageKey: string | undefined;

      // 1. Tải tệp lên kho lưu trữ trước nếu học sinh có đính kèm file
      if (uploadedFile) {
        const mimeType = getDocumentMimeType(uploadedFile);
        const { uploadUrl, storageKey } = await submissionService.getDocumentUploadUrl(
          subModuleId,
          mimeType
        );
        docStorageKey = storageKey;
        await submissionService.uploadDirectToStorage(uploadUrl, uploadedFile, mimeType);
      }

      // 2. Gửi bài làm module kèm storageKey (nếu có file) và/hoặc answers (nếu có text)
      const payload: SubmitModulePayload = {};
      if (docStorageKey) {
        payload.storageKey = docStorageKey;
      }
      if (hasText) {
        payload.answers = [
          {
            questionId: 1,
            content: { text: trimmedText }
          }
        ];
      }

      await submissionService.submitModule(subModuleId, payload);

      // 3. Kiểm tra xem tất cả các module trong submission đã hoàn thành chưa
      const otherModules = submission.modules?.filter((m) => m.id !== subModuleId) || [];
      const allOthersDone =
        otherModules.length === 0 ||
        otherModules.every((m) => m.status === 'SUBMITTED' || m.status === 'GRADED');

      if (allOthersDone) {
        try {
          await submissionService.submitSubmission(subId);
        } catch {
          // Bỏ qua nếu backend đã tự động submit submission cha
        }
      }

      // Xóa bản nháp sau khi nộp thành công
      localStorage.removeItem(`eh_draft_writing_${id}`);

      if (allOthersDone) {
        setSuccessMessage('Nộp bài thành công! Đang chuyển đến màn hình kết quả...');
        setTimeout(() => {
          navigate(`/student/submissions/${subId}`);
        }, 1200);
      } else {
        setSuccessMessage('Đã hoàn thành phần thi Writing! Đang quay lại trang tổng quan bài tập...');
        setTimeout(() => {
          navigate(`/student/assignments/${id}/overview`);
        }, 1200);
      }
    } catch (err: unknown) {
      const apiErr = parseApiError(err);
      setError(apiErr.message || 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const instructionsText = moduleDetail?.instructions || 
    'Yêu cầu: Hoàn thành bài viết Writing (tối thiểu 150 từ). Trình bày rõ ràng các luận điểm, phân tích dẫn chứng trọng tâm và bố cục mạch lạc. Bài nộp sẽ được AI phân tích từ vựng, ngữ pháp và chấm điểm theo thang điểm 10.';

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
              <p className="writing-prompt-text">
                {isLoading ? 'Đang tải yêu cầu đề bài...' : instructionsText}
              </p>
            </div>
          </div>

          {/* Text Editor */}
          <div className="writing-card">
            <div className="writing-editor-header">
              <div className="flex items-center gap-16">
                <div className="px-12 py-4 bg-slate-100 rounded-md text-xs text-slate-700 font-medium">
                  Đếm từ: <span className="text-primary font-bold">{wordCount}</span> / 150-250 từ
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
                onClick={() => setEditorText('')}
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
              style={{ display: 'none' }}
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
                {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài (Submit Assignment)'}
              </Button>

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
                <span className="writing-info-val">100 điểm (Quy đổi Band 9.0)</span>
              </div>
              
              <div className="writing-info-row">
                <span className="writing-info-label">Lượt thi hiện tại:</span>
                <span className="writing-info-val text-primary">
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
