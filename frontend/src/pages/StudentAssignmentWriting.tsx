import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ChevronRight, Paperclip, FileText, Download, 
  UploadCloud, Send, Save, CheckCircle, 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, Undo, Redo, Info
} from 'lucide-react';

const StudentAssignmentWriting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Mock State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [editorText, setEditorText] = useState('');

  const assignmentMock = {
    id: id,
    title: 'Writing 1',
    courseCode: 'ENG-IELTS-6.5A',
    instructions: 'Yêu cầu bổ sung từ Giảng viên (Cô Trần Thị Mai Lan): Hoàn thành bài viết Writing Task 1 phân tích biểu đồ (tối thiểu 150 từ). Trình bày rõ ràng các xu hướng chính, so sánh dữ liệu trọng điểm và không đưa ra ý kiến cá nhân. Học viên có thể tải tài liệu hướng dẫn mẫu bên dưới để tham khảo cấu trúc. File nộp yêu cầu định dạng PDF hoặc DOCX (dung lượng tối đa 10MB).',
    attachments: [
      { name: 'writing-1-answers.docx', type: 'Định dạng Word', size: '2.4 MB', color: '#3B82F6', bgColor: '#EFF6FF' },
      { name: 'explanation.docx', type: 'Hướng dẫn chi tiết & Bảng số liệu mẫu', size: '3.6 MB', color: '#EF4444', bgColor: '#FEF2F2' }
    ],
    status: 'Not Submitted'
  };

  // Drag and drop handlers
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

  // Editor word count mock (simple split by space)
  const wordCount = editorText.trim() === '' ? 0 : editorText.trim().split(/\s+/).length;

  return (
    <div style={{ padding: '0 24px 40px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B', marginBottom: '24px', paddingTop: '16px' }}>
        <span>Hệ thống</span>
        <ChevronRight size={16} />
        <span>Lớp học của tôi</span>
        <ChevronRight size={16} />
        <span style={{ color: '#2563EB', fontWeight: 500 }}>{assignmentMock.courseCode}</span>
        <ChevronRight size={16} />
        <span style={{ color: '#1E293B', fontWeight: 500 }}>{assignmentMock.title}</span>
      </div>

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
                {assignmentMock.instructions}
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
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#1E293B' }}>Tài liệu đính kèm (Attachments)</h2>
              </div>
              <span style={{ fontSize: '14px', color: '#64748B' }}>{assignmentMock.attachments.length} tệp tin đính kèm</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {assignmentMock.attachments.map((file, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '12px', backgroundColor: '#fff', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', backgroundColor: file.bgColor, borderRadius: '10px', color: file.color }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>{file.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B' }}>
                        <span>{file.size}</span>
                        <span style={{ width: '4px', height: '4px', backgroundColor: '#CBD5E1', borderRadius: '50%' }}></span>
                        <span>{file.type}</span>
                      </div>
                    </div>
                  </div>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '8px', color: '#2563EB', fontWeight: 500, cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
                    <Download size={16} /> Tải xuống (Download)
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Rich Text Editor Mock */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--outline-variant)', borderRadius: '12px', backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                  Đếm từ: <span style={{ color: '#2563EB', fontWeight: 600 }}>{wordCount}</span> / 150-200 từ
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981' }}>
                  <CheckCircle size={14} /> Đã lưu bản nháp tự động
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid #E2E8F0', borderBottom: 'none', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', backgroundColor: '#F8FAFC' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Bold size={16} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Italic size={16} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Underline size={16} /></button>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }}></div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><List size={16} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><ListOrdered size={16} /></button>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }}></div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><AlignLeft size={16} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><AlignCenter size={16} /></button>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1', margin: '0 4px' }}></div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Undo size={16} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}><Redo size={16} /></button>
            </div>

            {/* Textarea */}
            <textarea 
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              placeholder="Nhập nội dung bài luận Writing Task 1 của bạn tại đây... (Ví dụ: The given line graph illustrates the changes in...)"
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
                <span>Nội dung soạn thảo sẽ được bảo lưu khi chuyển đổi giữa các trang.</span>
              </div>
              <button 
                onClick={() => setEditorText('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'underline' }}
              >
                Xóa bài viết & Làm lại từ đầu
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
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>Drag and drop your files here or<br/> <span style={{ color: '#2563EB' }}>click to browse</span></div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>Supported formats: PDF, DOCX, JPG.<br/>Max 10MB</div>
                </div>
              )}
            </label>

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600, backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <Send size={18} /> Submit Assignment
            </button>

            <button className="btn btn-secondary" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 500, backgroundColor: 'white', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <Save size={18} /> Lưu bản nháp (Save Draft)
            </button>

            {/* Alert info */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <div style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }}>
                <CheckCircle size={18} />
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#166534' }}>
                Bài làm sẽ được hệ thống kiểm tra đối chiếu tự động với cơ sở dữ liệu học liệu SmartLMS để phát hiện sao chép.
              </p>
            </div>
          </div>

          {/* Grading */}
          <div className="card" style={{ padding: '0', border: '1px solid var(--outline-variant)', borderRadius: '12px', backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <h3 style={{ margin: 0, padding: '24px 24px 16px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Grading</h3>
            
            <div style={{ padding: '0 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '15px', color: '#64748B' }}>Total points:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>100</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>Grade</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#94A3B8' }}>-- <span style={{ fontSize: '15px', fontWeight: 500 }}>/ 100</span></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                  ML
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Giảng viên phụ trách chấm</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Cô Trần Thị Mai Lan</div>
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
