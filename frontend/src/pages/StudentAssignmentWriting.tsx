import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight, Paperclip, FileText, Download, 
  UploadCloud, Send, Save, CheckCircle, 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, Undo, Redo, Info,
  AlertCircle, RefreshCw, Loader2
} from 'lucide-react';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { submissionService, type SubmissionDetail } from '../api/services/submission.service';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common';
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

          // If this assignment is actually READING, LISTENING, or SPEAKING, redirect to appropriate skill route
          const targetSkill = currentAssignment?.modules?.[0]?.skill?.toLowerCase();
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
        } catch {
          currentAssignment = {
            id: numericId,
            title: `Writing Task: #${id || '1'}`,
            status: 'PUBLISHED',
            modules: [{ id: 1, skill: 'WRITING' }]
          };
          if (isMounted) setAssignment(currentAssignment);
        }

        // 2. Fetch module details if available
        const moduleId = currentAssignment?.modules?.[0]?.id;
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
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const wordCount = editorText.trim() === '' ? 0 : editorText.trim().split(/\s+/).length;

  const handleSaveDraft = () => {
    localStorage.setItem(`eh_draft_writing_${id}`, editorText);
    setIsDraftSaved(true);
    setTimeout(() => setIsDraftSaved(false), 3000);
  };

  const handleSubmit = async () => {
    if (editorText.trim() === '' && !uploadedFile) {
      setError('Vui lòng nhập nội dung bài luận hoặc tải lên tệp bài làm trước khi nộp.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const subId = submission?.id;
      const subModuleId = submission?.modules?.[0]?.id;

      if (subModuleId) {
        try {
          await submissionService.submitModule(subModuleId, {
            answers: [
              {
                questionId: 1,
                content: { text: editorText }
              }
            ]
          });
        } catch {
          // Continue if already submitted
        }
      }

      if (subId) {
        try {
          await submissionService.submitSubmission(subId);
        } catch {
          // Continue
        }
      }

      // Clear draft
      localStorage.removeItem(`eh_draft_writing_${id}`);
      setSuccessMessage('Nộp bài thành công! Đang chuyển đến màn hình kết quả...');

      setTimeout(() => {
        if (subId) {
          navigate(`/student/submissions/${subId}`);
        } else {
          navigate(`/student/assignments/${id}/result`);
        }
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.';
      setError(msg);
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

          {/* Attachments */}
          <div className="writing-card">
            <div className="flex justify-between items-center mb-20">
              <div className="flex items-center gap-12">
                <div className="p-8 bg-slate-100 rounded-full text-slate-500">
                  <Paperclip size={18} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 m-0">Tài liệu đính kèm &amp; Đề bài mẫu</h2>
              </div>
            </div>
            
            <div className="flex flex-col gap-16">
              <div className="flex justify-between items-center p-16 border border-slate-200 rounded-xl bg-white">
                <div className="flex items-center gap-16">
                  <div className="p-12 bg-blue-50 rounded-lg text-blue-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="m-0 mb-4 text-sm font-semibold text-slate-800">writing-instructions.docx</h4>
                    <div className="text-xs text-slate-500">
                      Hướng dẫn làm bài và tiêu chí đánh giá Writing
                    </div>
                  </div>
                </div>
                <Button 
                  variant="secondary"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={() => alert('Đang chuẩn bị file tải về...')}
                >
                  Tải xuống
                </Button>
              </div>
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
            {/* Dropzone */}
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`writing-dropzone mb-20 block ${isDragging ? 'dragging' : ''}`}
            >
              <input type="file" className="hidden" onChange={handleFileChange} />
              
              <div className="p-16 bg-blue-50 rounded-full text-blue-600 inline-flex mb-16">
                <UploadCloud size={28} />
              </div>

              {uploadedFile ? (
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-800 mb-4">{uploadedFile.name}</div>
                  <div className="text-xs text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-800 mb-4">Kéo thả tệp hoặc<br/> <span className="text-primary">chọn từ máy tính</span></div>
                  <div className="text-xs text-slate-400">Hỗ trợ: PDF, DOCX (Tối đa 10MB)</div>
                </div>
              )}
            </label>

            <Button 
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full mb-12"
              icon={isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            >
              {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài (Submit Assignment)'}
            </Button>

            <Button 
              variant="secondary"
              onClick={handleSaveDraft}
              className="w-full mb-20"
              icon={<Save size={18} />}
            >
              Lưu bản nháp (Save Draft)
            </Button>

            {/* Alert info */}
            <div className="flex gap-12 p-16 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-emerald-600 shrink-0 mt-2">
                <CheckCircle size={18} />
              </div>
              <p className="m-0 text-xs leading-relaxed text-emerald-800">
                Bài làm sẽ được phân tích tự động qua Writing AI Grading Pipeline và gửi đến giảng viên chấm chi tiết.
              </p>
            </div>
          </div>

          {/* Grading Card */}
          <div className="writing-card">
            <h3 className="m-0 mb-16 text-base font-bold text-slate-800">Thông tin chấm điểm</h3>
            
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
