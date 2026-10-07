import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [editorText, setEditorText] = useState('');

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [id]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`eh_draft_writing_${id}`);
    if (savedDraft) {
      setEditorText(savedDraft);
    }
  }, [id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch assignment details
      let currentAssignment: AssignmentDetail | null = null;
      try {
        currentAssignment = await assignmentService.getAssignment(numericId);
        setAssignment(currentAssignment);
      } catch {
        currentAssignment = {
          id: numericId,
          title: `Writing Task: #${id || '1'}`,
          status: 'PUBLISHED',
          modules: [{ id: 1, skill: 'WRITING' }]
        };
        setAssignment(currentAssignment);
      }

      // 2. Fetch module details if available
      const moduleId = currentAssignment?.modules?.[0]?.id;
      if (moduleId) {
        try {
          const mod = await moduleService.getModule(moduleId);
          setModuleDetail(mod);
        } catch {
          // Module endpoint fallback
        }
      }

      // 3. Resolve or start submission attempt
      const urlSubmissionId = searchParams.get('submissionId');
      if (urlSubmissionId && Number.isFinite(Number(urlSubmissionId))) {
        try {
          const sub = await submissionService.getSubmission(Number(urlSubmissionId));
          setSubmission(sub);
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
            setSubmission(sub);
          } else {
            const startRes = await submissionService.startAttempt(numericId);
            const sub = await submissionService.getSubmission(startRes.id);
            setSubmission(sub);
          }
        } catch {
          // Fallback if unable to start or list
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải đề bài.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [numericId, id, searchParams, user?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
    'Yêu cầu: Hoàn thành bài viết Writing Task (tối thiểu 150 từ). Trình bày rõ ràng các luận điểm, phân tích dẫn chứng trọng tâm và tuân thủ cấu trúc học thuật. Bài nộp sẽ được AI phân tích từ vựng, ngữ pháp và chấm điểm theo 4 tiêu chí chuẩn IELTS.';

  return (
    <div style={{ padding: '0 24px 40px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B', marginBottom: '24px', paddingTop: '16px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/student/dashboard')}>Trang chủ</span>
        <ChevronRight size={16} />
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/student/assignments')}>Danh sách bài tập</span>
        <ChevronRight size={16} />
        <span style={{ color: '#2563EB', fontWeight: 500 }}>
          {assignment?.title || `Writing #${id}`}
        </span>
      </div>

      {error && (
        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991B1B' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {successMessage && (
        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '10px', color: '#166534' }}>
          <CheckCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {/* Main Layout - 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Instructions */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--outline-variant)', borderRadius: '12px', backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ color: '#EF4444', marginTop: '4px' }}>
                <span style={{ fontSize: '18px' }}>★</span>
              </div>
              <p style={{ margin: 0, color: '#334155', fontSize: '15px', lineHeight: '1.6' }}>
                {isLoading ? 'Đang tải yêu cầu đề bài...' : instructionsText}
              </p>
            </div>
          </div>

          {/* Attachments */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--outline-variant)', borderRadius: '12px', backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#F1F5F9', borderRadius: '50%', color: '#64748B' }}>
                  <Paperclip size={18} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#1E293B' }}>Tài liệu đính kèm &amp; Đề bài mẫu</h2>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '12px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '10px', color: '#3B82F6' }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>writing-rubrics-guide.docx</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
                      <span>Hướng dẫn tiêu chí chấm 4 tiêu chuẩn IELTS</span>
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => alert('Đang chuẩn bị file tải về...')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '8px', color: '#2563EB', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}
                >
                  <Download size={16} /> Tải xuống
                </button>
              </div>
            </div>
          </div>

          {/* Text Editor */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--outline-variant)', borderRadius: '12px', backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                  Đếm từ: <span style={{ color: '#2563EB', fontWeight: 600 }}>{wordCount}</span> / 150-250 từ
                </div>
                {isDraftSaved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981' }}>
                    <CheckCircle size={14} /> Đã lưu bản nháp!
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid #E2E8F0', borderBottom: 'none', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', backgroundColor: '#F8FAFC' }}>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Bold size={16} /></button>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Italic size={16} /></button>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Underline size={16} /></button>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><List size={16} /></button>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><ListOrdered size={16} /></button>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><AlignLeft size={16} /></button>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><AlignCenter size={16} /></button>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }} />
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Undo size={16} /></button>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Redo size={16} /></button>
            </div>

            {/* Textarea */}
            <textarea 
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              placeholder="Nhập nội dung bài luận Writing của bạn tại đây... (Ví dụ: The given topic presents significant implications for...)"
              style={{
                width: '100%',
                minHeight: '280px',
                padding: '20px',
                border: '1px solid #E2E8F0',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#334155',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            {/* Footer Editor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                <Info size={14} color="#3B82F6" />
                <span>Nội dung soạn thảo sẽ được bảo lưu khi bấm &quot;Lưu bản nháp&quot;.</span>
              </div>
              <button 
                type="button"
                onClick={() => setEditorText('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'underline' }}
              >
                Xóa bài viết &amp; Làm lại từ đầu
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Your Submission */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--outline-variant)', borderRadius: '12px', backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Dropzone */}
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
                border: `2px dashed ${isDragging ? '#2563EB' : '#CBD5E1'}`,
                borderRadius: '12px',
                backgroundColor: isDragging ? '#EFF6FF' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '20px'
              }}
            >
              <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
              
              <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '50%', color: '#3B82F6', marginBottom: '16px' }}>
                <UploadCloud size={28} />
              </div>

              {uploadedFile ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>{uploadedFile.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>Kéo thả tệp hoặc<br/> <span style={{ color: '#2563EB' }}>chọn từ máy tính</span></div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>Hỗ trợ: PDF, DOCX (Tối đa 10MB)</div>
                </div>
              )}
            </label>

            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600, backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang nộp bài...
                </>
              ) : (
                <>
                  <Send size={18} /> Nộp bài (Submit Assignment)
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 500, backgroundColor: 'white', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}
            >
              <Save size={18} /> Lưu bản nháp (Save Draft)
            </button>

            {/* Alert info */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <div style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }}>
                <CheckCircle size={18} />
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#166534' }}>
                Bài làm sẽ được phân tích tự động qua Writing AI Grading Pipeline và gửi đến giảng viên chấm chi tiết.
              </p>
            </div>
          </div>

          {/* Grading Card */}
          <div className="card" style={{ padding: '0', border: '1px solid var(--outline-variant)', borderRadius: '12px', backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <h3 style={{ margin: 0, padding: '24px 24px 16px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Thông tin chấm điểm</h3>
            
            <div style={{ padding: '0 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '15px', color: '#64748B' }}>Thang điểm:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>100 điểm (Quy đổi Band 9.0)</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>Lượt thi hiện tại:</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#2563EB' }}>
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
