import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileEdit, BookOpen, Clock,
  ArrowRight, Plus, Trash2, CheckCircle2,
  Download, BookmarkCheck, PenTool, Mic, Headphones,
  Copy, Check, FileText, RotateCcw, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { classService, type ClassSummary } from '../api/services/class.service';

interface DraftItem {
  id: string;
  assignmentId: string;
  title: string;
  type: 'writing' | 'speaking' | 'reading' | 'listening';
  className: string;
  wordCount?: number;
  duration?: string;
  lastSaved: string;
  route: string;
  progress: number;
}

interface QuickNote {
  id: string;
  title: string;
  category: 'Vocabulary' | 'Speaking' | 'Grammar' | 'General';
  content: string;
  date: string;
}

interface StudyResource {
  id: string;
  title: string;
  category: string;
  format: 'PDF' | 'Audio MP3' | 'Docs';
  size: string;
  downloads: number;
  description: string;
}

export const StudentWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'drafts' | 'notes' | 'resources'>('drafts');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-progress drafts
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  // Quick notes
  const [notes, setNotes] = useState<QuickNote[]>(() => {
    try {
      const saved = localStorage.getItem('student_workspace_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Vocabulary' | 'Speaking' | 'Grammar' | 'General'>('Vocabulary');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchWorkspaceDrafts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [submissionsRes, classesRes] = await Promise.allSettled([
        submissionService.listSubmissions({ studentId: user?.id, status: 'IN_PROGRESS' }),
        classService.list()
      ]);

      const submissions: SubmissionListItem[] = submissionsRes.status === 'fulfilled'
        ? (submissionsRes.value?.data || (Array.isArray(submissionsRes.value) ? submissionsRes.value : []))
        : [];
      const classes: ClassSummary[] = classesRes.status === 'fulfilled'
        ? (classesRes.value?.data || (Array.isArray(classesRes.value) ? classesRes.value : []))
        : [];

      const assignmentsWithClass = (await Promise.all(
        classes.map(async (c) => {
          try {
            const res = await assignmentService.listAssignments(c.id);
            return (res.data || []).map((a) => ({ ...a, className: c.name, classId: c.id }));
          } catch {
            return [];
          }
        })
      )).flat();

      const assignmentMap = new Map<string, AssignmentSummary & { className: string; classId: number }>();
      assignmentsWithClass.forEach(a => assignmentMap.set(String(a.id), a));

      // Resolve real assignmentId for each in-progress submission
      const detailedSubmissions = await Promise.all(
        submissions.map(async (sub) => {
          try {
            const detail = await submissionService.getSubmission(sub.id);
            return { ...sub, assignmentId: detail.assignmentId };
          } catch {
            return sub;
          }
        })
      );

      const dynamicDrafts: DraftItem[] = detailedSubmissions.map((sub) => {
        const assignmentIdStr = String(sub.assignmentId || sub.id);
        const assignment = assignmentMap.get(assignmentIdStr);
        const className = assignment?.className || (classes.length > 0 ? classes[0].name : 'Lớp học của tôi');
        
        let type: 'writing' | 'speaking' | 'reading' | 'listening' = 'writing';
        let route = `/student/assignments/${assignmentIdStr}`;
        const titleLower = (assignment?.title || '').toLowerCase();
        if (titleLower.includes('speak') || titleLower.includes('nói')) {
          type = 'speaking';
          route = `/student/assignments/speaking/${assignmentIdStr}`;
        } else if (titleLower.includes('read') || titleLower.includes('đọc')) {
          type = 'reading';
          route = `/student/assignments/reading/${assignmentIdStr}`;
        } else if (titleLower.includes('listen') || titleLower.includes('nghe')) {
          type = 'listening';
          route = `/student/assignments/listening/${assignmentIdStr}`;
        }

        return {
          id: `draft-${sub.id}`,
          assignmentId: assignmentIdStr,
          title: assignment?.title || `Bản nháp bài tập #${assignmentIdStr}`,
          type,
          className,
          lastSaved: isVi ? 'Vừa lưu gần đây' : 'Recently saved',
          route,
          progress: 50
        };
      });

      // Also scan localStorage for cached client drafts
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('eh_draft_writing_') || key.startsWith('writing_draft_'))) {
            const assignmentId = key.replace('eh_draft_writing_', '').replace('writing_draft_', '');
            if (!dynamicDrafts.find(d => d.assignmentId === assignmentId)) {
              const assignment = assignmentMap.get(assignmentId);
              const className = assignment?.className || 'Lớp học của tôi';
              const content = localStorage.getItem(key) || '';
              const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
              dynamicDrafts.push({
                id: `local-draft-${assignmentId}`,
                assignmentId,
                title: assignment?.title || `Bản nháp Writing Task #${assignmentId}`,
                type: 'writing',
                className,
                wordCount,
                lastSaved: isVi ? 'Lưu trong trình duyệt' : 'Local draft',
                route: `/student/assignments/${assignmentId}`,
                progress: Math.min(95, Math.round((wordCount / 250) * 100))
              });
            }
          }
        }
      } catch (e) {
        console.warn('Could not read local draft items', e);
      }

      setDrafts(dynamicDrafts);
    } catch (err) {
      console.error('Failed to load workspace drafts', err);
      setError('Không thể tải các bản nháp đang làm.');
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceDrafts();
  }, [user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('student_workspace_notes', JSON.stringify(notes));
    } catch (e) {
      console.warn('Could not persist notes to localStorage', e);
    }
  }, [notes]);

  const resources: StudyResource[] = [
    {
      id: 'res-1',
      title: 'IELTS Academic Writing Task 2 Official Band Descriptors',
      category: 'Writing Guide',
      format: 'PDF',
      size: '2.4 MB',
      downloads: 1420,
      description: isVi ? 'Chi tiết 4 tiêu chí chấm điểm: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range.' : 'Official 4-criteria assessment rubric published by British Council / IDP.'
    },
    {
      id: 'res-2',
      title: 'Speaking Part 2 & 3 High-Band Idiomatic Phrases & Fillers',
      category: 'Speaking Materials',
      format: 'PDF',
      size: '1.8 MB',
      downloads: 980,
      description: isVi ? 'Tổng hợp 100+ thành ngữ học thuật, cụm collocations tự nhiên và từ nối tư duy phản biện.' : '100+ natural academic idioms, discourse markers, and thinking fillers.'
    },
    {
      id: 'res-3',
      title: 'Cambridge IELTS 19 Academic Listening Practice Audio Test 1-4',
      category: 'Listening Practice',
      format: 'Audio MP3',
      size: '64 MB',
      downloads: 2150,
      description: isVi ? 'Trọn bộ audio chuẩn giọng Anh - Úc - Mỹ kèm bảng script phân tích bẫy nghe.' : 'Complete audio tracks with scripts and distractor analysis.'
    },
    {
      id: 'res-4',
      title: 'Model Essays Band 8.5+ with Teacher Annotations',
      category: 'Writing Samples',
      format: 'PDF',
      size: '3.1 MB',
      downloads: 1890,
      description: isVi ? 'Tuyển tập 25 bài luận mẫu điểm cao phân tích cấu trúc lập luận và ngữ pháp phức hợp.' : 'Collection of 25 band 8.5+ essays with thorough analytical breakdown.'
    }
  ];

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    const note: QuickNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      category: newNoteCategory,
      content: newNoteContent.trim(),
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [note, ...notes];
    setNotes(updated);
    try {
      localStorage.setItem('student_workspace_notes', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id.startsWith('local-draft-')) {
      const assignmentId = id.replace('local-draft-', '');
      localStorage.removeItem(`eh_draft_writing_${assignmentId}`);
      localStorage.removeItem(`writing_draft_${assignmentId}`);
    }
    setDrafts(drafts.filter(d => d.id !== id));
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    try {
      localStorage.setItem('student_workspace_notes', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleCopyNote = (note: QuickNote) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const getDraftTypeIcon = (type: string) => {
    switch (type) {
      case 'writing':
        return (
          <div className="flex justify-center items-center rounded-md text-primary" style={{ width: 44, height: 44, backgroundColor: '#eff6ff' }}>
            <PenTool size={20} />
          </div>
        );
      case 'speaking':
        return (
          <div className="flex justify-center items-center rounded-md" style={{ width: 44, height: 44, backgroundColor: '#faf5ff', color: '#9333ea' }}>
            <Mic size={20} />
          </div>
        );
      case 'reading':
        return (
          <div className="flex justify-center items-center rounded-md" style={{ width: 44, height: 44, backgroundColor: '#fffbeb', color: '#d97706' }}>
            <BookOpen size={20} />
          </div>
        );
      default:
        return (
          <div className="flex justify-center items-center rounded-md" style={{ width: 44, height: 44, backgroundColor: '#f0fdfa', color: '#0d9488' }}>
            <Headphones size={20} />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container p-24">
        <div className="skeleton mb-24" style={{ height: '36px', width: '320px', borderRadius: '8px' }}></div>
        <div className="skeleton mb-32" style={{ height: '44px', width: '400px', borderRadius: '8px' }}></div>
        <div className="grid gap-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '12px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container p-24">
      {/* Header */}
      <div className="flex-between items-start mb-24">
        <div>
          <h1 className="flex items-center gap-12 m-0 text-on-surface font-bold mb-8" style={{ fontSize: '28px' }}>
            <FileEdit size={28} color="var(--primary)" />
            {isVi ? 'Không Gian Học Tập & Tự Luyện (Workspace)' : 'Personal Study & Practice Workspace'}
          </h1>
          <p className="m-0 text-on-surface-variant" style={{ fontSize: '15px' }}>
            {isVi
              ? 'Quản lý bản nháp đang làm dở, sổ tay ghi chú từ vựng/ngữ pháp và tài liệu ôn thi độc quyền.'
              : 'Resume in-progress drafts, manage your vocabulary notebook, and access curated exam materials.'}
          </p>
        </div>

        <div className="flex gap-10">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => navigate('/student/assignments')}
          >
            <Plus size={16} />
            <span>{isVi ? 'Làm bài tập mới' : 'Start New Assignment'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-16 mb-24 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchWorkspaceDrafts} className="btn btn-sm btn-secondary flex items-center gap-6">
            <RotateCcw size={14} />
            <span>{isVi ? 'Thử lại' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-12 mb-32 border-b">
        <button
          type="button"
          className={`flex items-center gap-8 font-medium p-12-18 border-none bg-transparent cursor-pointer transition-all ${activeTab === 'drafts' ? 'text-primary' : 'text-on-surface-variant'}`}
          style={{ borderBottom: activeTab === 'drafts' ? '2px solid var(--primary)' : '2px solid transparent' }}
          onClick={() => setActiveTab('drafts')}
        >
          <Clock size={16} />
          <span>{isVi ? 'Bản nháp đang làm' : 'In-Progress Drafts'}</span>
          <span className="flex justify-center items-center rounded-full text-white bg-primary" style={{ fontSize: '11px', padding: '2px 8px', marginLeft: '4px' }}>{drafts.length}</span>
        </button>

        <button
          type="button"
          className={`flex items-center gap-8 font-medium p-12-18 border-none bg-transparent cursor-pointer transition-all ${activeTab === 'notes' ? 'text-primary' : 'text-on-surface-variant'}`}
          style={{ borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent' }}
          onClick={() => setActiveTab('notes')}
        >
          <BookmarkCheck size={16} />
          <span>{isVi ? 'Sổ tay từ vựng & Ghi chú' : 'Vocabulary & Notes'}</span>
          <span className="flex justify-center items-center rounded-full text-white bg-primary" style={{ fontSize: '11px', padding: '2px 8px', marginLeft: '4px' }}>{notes.length}</span>
        </button>

        <button
          type="button"
          className={`flex items-center gap-8 font-medium p-12-18 border-none bg-transparent cursor-pointer transition-all ${activeTab === 'resources' ? 'text-primary' : 'text-on-surface-variant'}`}
          style={{ borderBottom: activeTab === 'resources' ? '2px solid var(--primary)' : '2px solid transparent' }}
          onClick={() => setActiveTab('resources')}
        >
          <BookOpen size={16} />
          <span>{isVi ? 'Kho tài liệu & Đề mẫu' : 'Curated Resources'}</span>
          <span className="flex justify-center items-center rounded-full text-white bg-primary" style={{ fontSize: '11px', padding: '2px 8px', marginLeft: '4px' }}>{resources.length}</span>
        </button>
      </div>

      {/* TAB 1: DRAFTS */}
      {activeTab === 'drafts' && (
        <div>
          <div className="flex-between items-center mb-20">
            <span className="text-on-surface-variant" style={{ fontSize: '14px' }}>
              {isVi 
                ? `Bạn có ${drafts.length} bài làm chưa nộp. Tiếp tục hoàn thiện để nộp đúng hạn!` 
                : `You have ${drafts.length} ongoing drafts. Complete and submit them before the deadline!`}
            </span>
          </div>

          <div className="grid gap-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
            {drafts.map((draft) => (
              <div key={draft.id} className="card bg-white p-20 flex-col justify-between">
                <div>
                  <div className="flex items-start gap-16 mb-12">
                    {getDraftTypeIcon(draft.type)}
                    <div className="flex-1">
                      <div className="flex-between items-center">
                        <span className="font-bold text-uppercase rounded" style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                          {draft.type}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          title={isVi ? 'Xóa bản nháp' : 'Delete draft'}
                          className="bg-transparent border-none cursor-pointer text-on-surface-variant p-4"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <h3 className="font-bold text-on-surface m-0 mt-8 mb-4 leading-snug" style={{ fontSize: '15px' }}>
                        {draft.title}
                      </h3>
                      <div className="text-on-surface-variant" style={{ fontSize: '12px' }}>
                        {draft.className}
                      </div>
                    </div>
                  </div>

                  <div className="flex-between items-center mt-16 text-on-surface-variant" style={{ fontSize: '12px' }}>
                    <span>
                      {draft.wordCount ? `📝 ${draft.wordCount} ${isVi ? 'từ' : 'words'}` : null}
                      {draft.duration ? `🎙️ ${draft.duration}` : null}
                    </span>
                    <span className="inline-flex items-center gap-4">
                      <Clock size={12} />
                      {draft.lastSaved}
                    </span>
                  </div>
                </div>

                <div className="mt-16 pt-16 border-t">
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    onClick={() => navigate(draft.route)}
                  >
                    <span>{isVi ? 'Tiếp tục làm bài' : 'Resume Assignment'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {drafts.length === 0 && (
            <div className="card text-center py-48">
              <CheckCircle2 size={40} color="#16a34a" className="mx-auto mb-12" />
              <h3 className="m-0 font-bold mb-6" style={{ fontSize: '16px' }}>
                {isVi ? 'Không có bản nháp nào đang dở dang!' : 'No unfinished drafts!'}
              </h3>
              <p className="text-on-surface-variant m-0 mb-20" style={{ fontSize: '13.5px' }}>
                {isVi ? 'Tuyệt vời, bạn đã hoàn tất nộp tất cả bài tập.' : 'Great job! You have submitted all assigned work.'}
              </p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => navigate('/student/assignments')}
              >
                {isVi ? 'Khám phá bài tập mới' : 'Browse Assignments'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NOTES */}
      {activeTab === 'notes' && (
        <div>
          <div className="flex-between items-center flex-wrap gap-12 mb-20">
            <div>
              <h3 className="m-0 font-bold text-on-surface" style={{ fontSize: '16px' }}>
                {isVi ? 'Sổ Tay Học Tập Cá Nhân' : 'Personal Study Notebook'}
              </h3>
              <p className="m-0 mt-4 text-on-surface-variant" style={{ fontSize: '13px' }}>
                {isVi ? 'Lưu trữ các mẫu câu hay, sửa lỗi phát âm và từ vựng band cao dùng cho phòng thi.' : 'Save high-band collocations, grammar patterns, and speaking reminders.'}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddingNote(!isAddingNote)}
            >
              <Plus size={16} />
              <span>{isVi ? 'Thêm ghi chú mới' : 'Add New Note'}</span>
            </button>
          </div>

          {/* Form thêm ghi chú mới */}
          {isAddingNote && (
            <div className="card mb-24" style={{ border: '2px solid var(--primary-container)' }}>
              <div className="mb-16">
                <span className="font-bold" style={{ fontSize: '14px' }}>
                  {isVi ? 'Tạo ghi chú mới' : 'Create New Study Note'}
                </span>
              </div>
              <div className="flex-col gap-16">
                <div className="flex flex-wrap gap-12">
                  <input
                    type="text"
                    className="flex-1 p-12-18 border rounded outline-none"
                    placeholder={isVi ? 'Tiêu đề ghi chú (VD: Idioms for Environment...)' : 'Note title...'}
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <select
                    value={newNoteCategory}
                    className="p-12 border rounded outline-none"
                    onChange={(e) => setNewNoteCategory(e.target.value as 'Vocabulary' | 'Speaking' | 'Grammar' | 'General')}
                    style={{ fontSize: '13px' }}
                  >
                    <option value="Vocabulary">Vocabulary</option>
                    <option value="Speaking">Speaking</option>
                    <option value="Grammar">Grammar</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <textarea
                  rows={4}
                  className="w-full p-12 border rounded outline-none"
                  placeholder={isVi ? 'Nội dung ghi chú, từ vựng hoặc ví dụ câu...' : 'Write note contents or example sentences...'}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  style={{ resize: 'vertical' }}
                />

                <div className="flex justify-end gap-12">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsAddingNote(false)}
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddNote}
                  >
                    {isVi ? 'Lưu ghi chú' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách ghi chú */}
          {notes.length === 0 ? (
            <div className="card text-center py-48">
              <BookmarkCheck size={40} color="#94a3b8" className="mx-auto mb-12" />
              <h3 className="m-0 font-bold mb-6" style={{ fontSize: '16px' }}>
                {isVi ? 'Bạn chưa có ghi chú nào!' : 'No notes yet!'}
              </h3>
              <p className="text-on-surface-variant m-0 mb-20" style={{ fontSize: '13.5px' }}>
                {isVi ? 'Hãy lưu lại các từ vựng, cấu trúc ngữ pháp hay để ôn tập trước kỳ thi.' : 'Save vocabulary and grammar structures to review anytime.'}
              </p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setIsAddingNote(true)}
              >
                {isVi ? 'Thêm ghi chú đầu tiên' : 'Add First Note'}
              </button>
            </div>
          ) : (
            <div className="grid gap-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
              {notes.map((note) => (
                <div key={note.id} className="card bg-white p-20 flex-col justify-between">
                  <div>
                    <div className="flex-between items-center mb-8">
                      <span className="font-bold text-uppercase rounded text-primary" style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#EFF6FF' }}>
                        {note.category}
                      </span>
                      <span className="text-on-surface-variant" style={{ fontSize: '11.5px' }}>
                        {note.date}
                      </span>
                    </div>

                    <h4 className="font-bold text-on-surface m-0 mb-12" style={{ fontSize: '15px' }}>
                      {note.title}
                    </h4>

                    <div className="leading-relaxed text-on-surface-variant p-12 rounded" style={{ fontSize: '13px', whiteSpace: 'pre-line', backgroundColor: '#F3F4F6' }}>
                      {note.content}
                    </div>
                  </div>

                  <div className="flex-between items-center pt-12 mt-16 border-t">
                    <button
                      type="button"
                      className="flex items-center gap-6 font-medium bg-transparent border cursor-pointer rounded p-6-12"
                      style={{ fontSize: '12px', color: copiedNoteId === note.id ? '#16A34A' : '#475569', borderColor: copiedNoteId === note.id ? '#16A34A' : '#E2E8F0' }}
                      onClick={() => handleCopyNote(note)}
                    >
                      {copiedNoteId === note.id ? (
                        <>
                          <Check size={13} color="#16a34a" />
                          <span>{isVi ? 'Đã sao chép!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>{isVi ? 'Sao chép' : 'Copy'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="flex items-center gap-6 font-medium bg-transparent border-none cursor-pointer text-error p-6-12"
                      style={{ fontSize: '12px' }}
                    >
                      <Trash2 size={13} />
                      <span>{isVi ? 'Xóa' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESOURCES */}
      {activeTab === 'resources' && (
        <div>
          <div className="mb-24">
            <h3 className="m-0 font-bold text-on-surface" style={{ fontSize: '16px' }}>
              {isVi ? 'Thư Viện Tài Liệu & Đề Thi Mẫu' : 'Official IELTS Practice Materials & Guides'}
            </h3>
            <p className="m-0 mt-4 text-on-surface-variant" style={{ fontSize: '13px' }}>
              {isVi ? 'Tài liệu tiêu chuẩn do EnglishHub biên soạn và chọn lọc từ Cambridge & Hội đồng Anh.' : 'Verified academic materials, rubrics, and high-band practice audio files.'}
            </p>
          </div>

          <div className="grid gap-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
            {resources.map((res) => (
              <div key={res.id} className="flex-between items-start card bg-white p-20 gap-16">
                <div className="flex items-start gap-16">
                  <div className="flex-center rounded text-primary flex-shrink-0" style={{ width: 44, height: 44, backgroundColor: '#EFF6FF' }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-8 mb-4">
                      <span className="font-bold text-on-surface rounded" style={{ fontSize: '11px', backgroundColor: '#F3F4F6', padding: '2px 8px' }}>
                        {res.format}
                      </span>
                      <span className="text-on-surface-variant" style={{ fontSize: '12px' }}>
                        {res.size} • {res.downloads.toLocaleString()} {isVi ? 'lượt tải' : 'downloads'}
                      </span>
                    </div>
                    <h4 className="font-bold text-on-surface m-0 mb-8 leading-snug" style={{ fontSize: '14.5px' }}>
                      {res.title}
                    </h4>
                    <p className="m-0 leading-normal text-on-surface-variant" style={{ fontSize: '12.5px' }}>
                      {res.description}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-secondary bg-white"
                    onClick={() => alert(isVi ? `Đang bắt đầu tải: ${res.title}` : `Downloading: ${res.title}`)}
                  >
                    <Download size={15} />
                    <span>{isVi ? 'Tải về' : 'Download'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWorkspace;
