import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileEdit, BookOpen, Clock,
  ArrowRight, Plus, Trash2, CheckCircle2,
  Download, BookmarkCheck, PenTool, Mic, Headphones,
  Copy, Check, FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DraftItem {
  id: string;
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
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'drafts' | 'notes' | 'resources'>('drafts');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // In-progress drafts
  const [drafts, setDrafts] = useState<DraftItem[]>([
    {
      id: 'draft-1',
      title: 'Writing Task 2: Artificial Intelligence & Future Workforce',
      type: 'writing',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      wordCount: 185,
      lastSaved: isVi ? '15 phút trước' : '15 mins ago',
      route: '/student/assignments/1',
      progress: 74
    },
    {
      id: 'draft-2',
      title: 'Speaking Part 2: Environmental Pollution in Urban Cities',
      type: 'speaking',
      className: 'IELTS Speaking Master',
      duration: '01:58 / 02:00',
      lastSaved: isVi ? 'Hôm qua lúc 18:30' : 'Yesterday at 18:30',
      route: '/student/assignments/speaking/2',
      progress: 90
    },
    {
      id: 'draft-3',
      title: 'Reading Test 4: Section 2 - Biomimicry Innovation & Design',
      type: 'reading',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      lastSaved: isVi ? '2 ngày trước' : '2 days ago',
      route: '/student/assignments/reading/3',
      progress: 45
    }
  ]);

  // Quick notes
  const [notes, setNotes] = useState<QuickNote[]>([
    {
      id: 'note-1',
      title: 'Academic Collocations for Writing Task 2',
      category: 'Vocabulary',
      content: '• Play a pivotal role in (= have crucial significance)\n• Exert a detrimental impact on (= severely damage)\n• Bridge the socioeconomic divide (= narrow the inequality gap)',
      date: '2026-03-18'
    },
    {
      id: 'note-2',
      title: 'Speaking Fluency Checklist & Conversational Anchors',
      category: 'Speaking',
      content: '1. Avoid silent pauses -> Use conversational anchors: "Well, frankly speaking...", "From my personal perspective..."\n2. Stress key lexical words (nouns, main verbs) and link ending consonants to vowels.',
      date: '2026-03-15'
    },
    {
      id: 'note-3',
      title: 'Complex Sentences: Inversion & Cleft Sentences',
      category: 'Grammar',
      content: '• "Not only does AI automate repetitive tasks, but it also creates novel job roles."\n• "It was the rapid industrialization that led to severe air degradation in metropolitan hubs."',
      date: '2026-03-12'
    }
  ]);

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Vocabulary' | 'Speaking' | 'Grammar' | 'General'>('Vocabulary');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Study resources
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
    setNotes([note, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrafts(drafts.filter(d => d.id !== id));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
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
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PenTool size={20} />
          </div>
        );
      case 'speaking':
        return (
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={20} />
          </div>
        );
      case 'reading':
        return (
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} />
          </div>
        );
      default:
        return (
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Headphones size={20} />
          </div>
        );
    }
  };

  return (
    <div className="std-eco-container">
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

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="std-eco-btn-primary"
            onClick={() => navigate('/student/assignments')}
          >
            <Plus size={16} />
            <span>{isVi ? 'Làm bài tập mới' : 'Start New Assignment'}</span>
          </button>
        </div>
      </div>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>
              {isVi 
                ? `Bạn có ${drafts.length} bài làm chưa nộp. Tiếp tục hoàn thiện để nộp đúng hạn!` 
                : `You have ${drafts.length} ongoing drafts. Complete and submit them before the deadline!`}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {drafts.map((draft) => (
              <div key={draft.id} className="workspace-draft-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
                    {getDraftTypeIcon(draft.type)}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className={`std-skill-tag ${draft.type}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {draft.type}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          title={isVi ? 'Xóa bản nháp' : 'Delete draft'}
                          style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)', margin: '8px 0 4px 0', lineHeight: 1.4 }}>
                        {draft.title}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                        {draft.className}
                      </div>
                    </div>
                  </div>

                  {/* Progress & metrics */}
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>
                      <span>{isVi ? 'Tiến độ hoàn thành' : 'Completion'}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{draft.progress}%</span>
                    </div>
                    <div className="workspace-progress-bar">
                      <div className="workspace-progress-fill" style={{ width: `${draft.progress}%` }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '12px' }}>
                    <span>
                      {draft.wordCount && `📝 ${draft.wordCount} ${isVi ? 'từ' : 'words'}`}
                      {draft.duration && `🎙️ ${draft.duration}`}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {draft.lastSaved}
                    </span>
                  </div>
                </div>

                <div style={{ paddingTop: '14px', borderTop: '1px solid var(--outline-variant)' }}>
                  <button
                    type="button"
                    className="std-eco-btn-primary"
                    style={{ width: '100%' }}
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
            <div className="std-eco-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700 }}>
                {isVi ? 'Không có bản nháp nào đang dở dang!' : 'No unfinished drafts!'}
              </h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '13.5px', margin: '0 0 18px 0' }}>
                {isVi ? 'Tuyệt vời, bạn đã hoàn tất nộp tất cả bài tập.' : 'Great job! You have submitted all assigned work.'}
              </p>
              <button 
                type="button" 
                className="std-eco-btn-primary"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--on-surface)' }}>
                {isVi ? 'Sổ Tay Học Tập Cá Nhân' : 'Personal Study Notebook'}
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                {isVi ? 'Lưu trữ các mẫu câu hay, sửa lỗi phát âm và từ vựng band cao dùng cho phòng thi.' : 'Save high-band collocations, grammar patterns, and speaking reminders.'}
              </p>
            </div>

            <button
              type="button"
              className="std-eco-btn-primary"
              onClick={() => setIsAddingNote(!isAddingNote)}
            >
              <Plus size={16} />
              <span>{isVi ? 'Thêm ghi chú mới' : 'Add New Note'}</span>
            </button>
          </div>

          {/* Form thêm ghi chú mới */}
          {isAddingNote && (
            <div className="std-eco-card" style={{ marginBottom: '22px', border: '2px solid var(--primary-container)' }}>
              <div className="std-eco-card-header">
                <span style={{ fontWeight: 700, fontSize: '14px' }}>
                  {isVi ? 'Tạo ghi chú mới' : 'Create New Study Note'}
                </span>
              </div>
              <div className="std-eco-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="std-eco-search-input"
                    placeholder={isVi ? 'Tiêu đề ghi chú (VD: Idioms for Environment...)' : 'Note title...'}
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    style={{ flex: 2, paddingLeft: 14 }}
                  />
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as 'Vocabulary' | 'Speaking' | 'Grammar' | 'General')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1px solid var(--outline-variant)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--on-surface)'
                    }}
                  >
                    <option value="Vocabulary">Vocabulary</option>
                    <option value="Speaking">Speaking</option>
                    <option value="Grammar">Grammar</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <textarea
                  rows={4}
                  className="std-eco-search-input"
                  placeholder={isVi ? 'Nội dung ghi chú, từ vựng hoặc ví dụ câu...' : 'Write note contents or example sentences...'}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', padding: '10px 14px' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="std-eco-btn-secondary"
                    onClick={() => setIsAddingNote(false)}
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className="std-eco-btn-primary"
                    onClick={handleAddNote}
                  >
                    {isVi ? 'Lưu ghi chú' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách ghi chú */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span 
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb'
                      }}
                    >
                      {note.category}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--on-surface-variant)' }}>
                      {note.date}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 10px 0' }}>
                    {note.title}
                  </h4>

                  <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-line', backgroundColor: 'var(--surface-container-low)', padding: '12px 14px', borderRadius: '8px' }}>
                    {note.content}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--outline-variant)' }}>
                  <button
                    type="button"
                    className="std-eco-btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    onClick={() => handleCopyNote(note)}
                  >
                    {copiedNoteId === note.id ? (
                      <>
                        <Check size={13} color="#16a34a" />
                        <span style={{ color: '#16a34a' }}>{isVi ? 'Đã sao chép!' : 'Copied!'}</span>
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
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  >
                    <Trash2 size={13} />
                    <span>{isVi ? 'Xóa' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESOURCES */}
      {activeTab === 'resources' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--on-surface)' }}>
              {isVi ? 'Thư Viện Tài Liệu & Đề Thi Mẫu' : 'Official IELTS Practice Materials & Guides'}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              {isVi ? 'Tài liệu tiêu chuẩn do EnglishHub biên soạn và chọn lọc từ Cambridge & Hội đồng Anh.' : 'Verified academic materials, rubrics, and high-band practice audio files.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '18px' }}>
            {resources.map((res) => (
              <div key={res.id} className="resource-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--surface-container-high)', padding: '2px 8px', borderRadius: '4px', color: 'var(--on-surface)' }}>
                        {res.format}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                        {res.size} • {res.downloads.toLocaleString()} {isVi ? 'lượt tải' : 'downloads'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                      {res.title}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.5 }}>
                      {res.description}
                    </p>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <button
                    type="button"
                    className="std-eco-btn-secondary"
                    style={{ padding: '8px 12px' }}
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
