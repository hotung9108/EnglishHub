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
import { Button, EmptyState, Skeleton } from '../components/common';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { classService, type ClassSummary } from '../api/services/class.service';
import '../styles/student-ecosystem.css';

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

  const [reloadKey, setReloadKey] = useState(0);
  const handleReload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

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
        const modSkill = (sub as { modules?: Array<{ skill?: string }> }).modules?.[0]?.skill?.toLowerCase();
        const titleLower = (assignment?.title || '').toLowerCase();
        if (modSkill === 'speaking' || titleLower.includes('speak') || titleLower.includes('nói')) {
          type = 'speaking';
          route = `/student/assignments/speaking/${assignmentIdStr}`;
        } else if (modSkill === 'reading' || titleLower.includes('read') || titleLower.includes('đọc')) {
          type = 'reading';
          route = `/student/assignments/reading/${assignmentIdStr}`;
        } else if (modSkill === 'listening' || titleLower.includes('listen') || titleLower.includes('nghe')) {
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

        if (isMounted) {
          setDrafts(dynamicDrafts);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load workspace drafts', err);
        setError('Không thể tải các bản nháp đang làm.');
        setDrafts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchWorkspaceDrafts();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isVi, reloadKey]);

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
      title: 'Hướng Dẫn Làm Bài & Tiêu Chí Đánh Giá Writing (Thang 10)',
      category: 'Writing Guide',
      format: 'PDF',
      size: '2.4 MB',
      downloads: 1420,
      description: isVi ? 'Chi tiết các tiêu chí đánh giá kỹ năng Viết: Bố cục, Ngữ pháp, Từ vựng, Sự mạch lạc.' : 'Detailed assessment criteria for Writing: Structure, Grammar, Vocabulary, and Coherence.'
    },
    {
      id: 'res-2',
      title: 'Tổng Hợp Từ Vựng & Cụm Từ Giao Tiếp Speaking Thông Dụng',
      category: 'Speaking Materials',
      format: 'PDF',
      size: '1.8 MB',
      downloads: 980,
      description: isVi ? 'Tổng hợp 100+ từ vựng, thành ngữ giao tiếp tự nhiên và các cấu trúc câu phản xạ nhanh.' : '100+ natural idioms, discourse markers, and thinking fillers.'
    },
    {
      id: 'res-3',
      title: 'Luyện Nghe Tiếng Anh Tổng Quát & Audio File 1-4',
      category: 'Listening Practice',
      format: 'Audio MP3',
      size: '64 MB',
      downloads: 2150,
      description: isVi ? 'Trọn bộ audio chuẩn giọng đọc kèm bảng script và giải thích chi tiết.' : 'Complete audio tracks with scripts and explanations.'
    },
    {
      id: 'res-4',
      title: 'Tuyển Tập Bài Luận Mẫu Điểm Cao (Thang 10) Có Nhận Xét',
      category: 'Writing Samples',
      format: 'PDF',
      size: '3.1 MB',
      downloads: 1890,
      description: isVi ? 'Tuyển tập 25 bài luận mẫu xuất sắc phân tích cấu trúc lập luận và cách dùng từ.' : 'Collection of 25 top essays with thorough analytical breakdown.'
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
          <div className="std-asg-icon-box writing">
            <PenTool size={20} />
          </div>
        );
      case 'speaking':
        return (
          <div className="std-asg-icon-box speaking">
            <Mic size={20} />
          </div>
        );
      case 'reading':
        return (
          <div className="std-asg-icon-box reading">
            <BookOpen size={20} />
          </div>
        );
      default:
        return (
          <div className="std-asg-icon-box listening">
            <Headphones size={20} />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="std-eco-container pb-48">
        <Skeleton height="36px" width="320px" borderRadius="8px" className="mb-24" />
        <Skeleton height="44px" width="400px" borderRadius="8px" className="mb-32" />
        <div className="std-ws-draft-grid">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height="240px" borderRadius="12px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="std-eco-container pb-48">
      {/* Header */}
      <div className="std-eco-header">
        <div>
          <h1 className="std-eco-title">
            <FileEdit size={28} color="var(--primary)" />
            {isVi ? 'Không Gian Học Tập & Tự Luyện (Workspace)' : 'Personal Study & Practice Workspace'}
          </h1>
          <p className="std-eco-subtitle">
            {isVi
              ? 'Quản lý bản nháp đang làm dở, sổ tay ghi chú từ vựng/ngữ pháp và tài liệu ôn thi độc quyền.'
              : 'Resume in-progress drafts, manage your vocabulary notebook, and access curated exam materials.'}
          </p>
        </div>

        <div className="flex gap-10">
          <Button 
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/student/assignments')}
          >
            {isVi ? 'Làm bài tập mới' : 'Start New Assignment'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="analytics-error-banner">
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={handleReload}>
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="std-eco-tabs">
        <button
          type="button"
          className={`std-eco-tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          <Clock size={16} />
          <span>{isVi ? 'Bản nháp đang làm' : 'In-Progress Drafts'}</span>
          <span className="std-eco-pill-badge">{drafts.length}</span>
        </button>

        <button
          type="button"
          className={`std-eco-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <BookmarkCheck size={16} />
          <span>{isVi ? 'Sổ tay từ vựng & Ghi chú' : 'Vocabulary & Notes'}</span>
          <span className="std-eco-pill-badge">{notes.length}</span>
        </button>

        <button
          type="button"
          className={`std-eco-tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <BookOpen size={16} />
          <span>{isVi ? 'Kho tài liệu & Đề mẫu' : 'Curated Resources'}</span>
          <span className="std-eco-pill-badge">{resources.length}</span>
        </button>
      </div>

      {/* TAB 1: DRAFTS */}
      {activeTab === 'drafts' && (
        <div>
          <div className="flex justify-between items-center mb-20">
            <span className="text-sm text-slate-500">
              {isVi 
                ? `Bạn có ${drafts.length} bài làm chưa nộp. Tiếp tục hoàn thiện để nộp đúng hạn!` 
                : `You have ${drafts.length} ongoing drafts. Complete and submit them before the deadline!`}
            </span>
          </div>

          <div className="std-ws-draft-grid">
            {drafts.map((draft) => (
              <div key={draft.id} className="std-ws-draft-card">
                <div>
                  <div className="flex items-start gap-16 mb-12">
                    {getDraftTypeIcon(draft.type)}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`std-skill-tag ${draft.type}`}>
                          {draft.type}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          title={isVi ? 'Xóa bản nháp' : 'Delete draft'}
                          className="std-ws-del-btn"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 m-0 mt-8 mb-4">
                        {draft.title}
                      </h3>
                      <div className="text-xs text-slate-500">
                        {draft.className}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-16 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      {draft.wordCount ? (
                        <span className="inline-flex items-center gap-1">
                          <FileText size={12} />
                          <span>{draft.wordCount} {isVi ? 'từ' : 'words'}</span>
                        </span>
                      ) : null}
                      {draft.duration ? (
                        <span className="inline-flex items-center gap-1">
                          <Mic size={12} />
                          <span>{draft.duration}</span>
                        </span>
                      ) : null}
                    </span>
                    <span className="inline-flex items-center gap-4">
                      <Clock size={12} />
                      {draft.lastSaved}
                    </span>
                  </div>
                </div>

                <div className="mt-16 pt-16 border-t border-slate-100">
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={<ArrowRight size={15} />}
                    onClick={() => navigate(draft.route)}
                  >
                    {isVi ? 'Tiếp tục làm bài' : 'Resume Assignment'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {drafts.length === 0 && (
            <EmptyState
              icon={<CheckCircle2 size={40} className="text-emerald-600" />}
              title={isVi ? 'Không có bản nháp nào đang dở dang!' : 'No unfinished drafts!'}
              description={isVi ? 'Tuyệt vời, bạn đã hoàn tất nộp tất cả bài tập.' : 'Great job! You have submitted all assigned work.'}
              action={
                <Button 
                  variant="primary"
                  onClick={() => navigate('/student/assignments')}
                >
                  {isVi ? 'Khám phá bài tập mới' : 'Browse Assignments'}
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* TAB 2: NOTES */}
      {activeTab === 'notes' && (
        <div>
          <div className="flex justify-between items-center flex-wrap gap-12 mb-20">
            <div>
              <h3 className="m-0 font-bold text-slate-900 text-base">
                {isVi ? 'Sổ Tay Học Tập Cá Nhân' : 'Personal Study Notebook'}
              </h3>
              <p className="m-0 mt-4 text-xs text-slate-500">
                {isVi ? 'Lưu trữ các mẫu câu hay, sửa lỗi phát âm và từ vựng band cao dùng cho phòng thi.' : 'Save high-band collocations, grammar patterns, and speaking reminders.'}
              </p>
            </div>

            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsAddingNote(!isAddingNote)}
            >
              {isVi ? 'Thêm ghi chú mới' : 'Add New Note'}
            </Button>
          </div>

          {/* Form thêm ghi chú mới */}
          {isAddingNote && (
            <div className="std-ws-note-form">
              <div className="mb-16">
                <span className="font-bold text-sm text-slate-900">
                  {isVi ? 'Tạo ghi chú mới' : 'Create New Study Note'}
                </span>
              </div>
              <div className="flex flex-col gap-16">
                <div className="flex flex-wrap gap-12">
                  <input
                    type="text"
                    className="std-ws-note-input"
                    placeholder={isVi ? 'Tiêu đề ghi chú (VD: Idioms for Environment...)' : 'Note title...'}
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <select
                    value={newNoteCategory}
                    className="std-ws-note-select"
                    onChange={(e) => setNewNoteCategory(e.target.value as 'Vocabulary' | 'Speaking' | 'Grammar' | 'General')}
                  >
                    <option value="Vocabulary">Vocabulary</option>
                    <option value="Speaking">Speaking</option>
                    <option value="Grammar">Grammar</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <textarea
                  rows={4}
                  className="std-ws-note-textarea"
                  placeholder={isVi ? 'Nội dung ghi chú, từ vựng hoặc ví dụ câu...' : 'Write note contents or example sentences...'}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                />

                <div className="flex justify-end gap-12">
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddingNote(false)}
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddNote}
                  >
                    {isVi ? 'Lưu ghi chú' : 'Save Note'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách ghi chú */}
          {notes.length === 0 ? (
            <EmptyState
              icon={<BookmarkCheck size={40} />}
              title={isVi ? 'Bạn chưa có ghi chú nào!' : 'No notes yet!'}
              description={isVi ? 'Hãy lưu lại các từ vựng, cấu trúc ngữ pháp hay để ôn tập trước kỳ thi.' : 'Save vocabulary and grammar structures to review anytime.'}
              action={
                <Button 
                  variant="primary"
                  onClick={() => setIsAddingNote(true)}
                >
                  {isVi ? 'Thêm ghi chú đầu tiên' : 'Add First Note'}
                </Button>
              }
            />
          ) : (
            <div className="std-ws-draft-grid">
              {notes.map((note) => (
                <div key={note.id} className="std-ws-note-card">
                  <div>
                    <div className="flex justify-between items-center mb-8">
                      <span className="std-skill-tag writing">
                        {note.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {note.date}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-900 m-0 mb-12 text-base">
                      {note.title}
                    </h4>

                    <div className="std-ws-note-content">
                      {note.content}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-12 mt-16 border-t border-slate-100">
                    <button
                      type="button"
                      className={`std-ws-copy-btn ${copiedNoteId === note.id ? 'copied' : ''}`}
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

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      icon={<Trash2 size={13} />}
                      className="text-red-600 hover:bg-red-50"
                    >
                      {isVi ? 'Xóa' : 'Delete'}
                    </Button>
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
            <h3 className="m-0 font-bold text-slate-900 text-base">
              {isVi ? 'Thư Viện Tài Liệu 4 Kỹ Năng' : '4-Skill Study Materials & Guides'}
            </h3>
            <p className="m-0 mt-4 text-xs text-slate-500">
              {isVi ? 'Tài liệu học tập và rèn luyện 4 kỹ năng do EnglishHub biên soạn và chọn lọc.' : 'Study materials and practice resources curated for the 4 core English skills.'}
            </p>
          </div>

          <div className="std-ws-draft-grid">
            {resources.map((res) => (
              <div key={res.id} className="std-ws-res-card">
                <div className="flex items-start gap-16">
                  <div className="std-asg-icon-box reading">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-8 mb-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {res.format}
                      </span>
                      <span className="text-xs text-slate-500">
                        {res.size} • {res.downloads.toLocaleString()} {isVi ? 'lượt tải' : 'downloads'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 m-0 mb-8 text-sm">
                      {res.title}
                    </h4>
                    <p className="m-0 text-xs text-slate-600 line-clamp-2">
                      {res.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={() => alert(isVi ? `Đang bắt đầu tải: ${res.title}` : `Downloading: ${res.title}`)}
                  >
                    {isVi ? 'Tải về' : 'Download'}
                  </Button>
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
