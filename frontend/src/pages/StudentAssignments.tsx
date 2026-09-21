import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  PenTool, 
  Mic, 
  BookOpen, 
  Headphones, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Hourglass, 
  Search, 
  Calendar, 
  User, 
  Sparkles,
  Layers,
  Check
} from 'lucide-react';

type AssignmentStatus = 'not_started' | 'pending' | 'ai_processing' | 'graded';

interface MockAssignment {
  id: string;
  classId: string;
  title: string;
  type: string; // e.g. 'Writing Task 2', 'Speaking Part 2', 'Reading', 'Listening'
  status: AssignmentStatus;
  submittedOn?: string;
  deadline?: string;
  teacherName: string;
  hasAudio?: boolean;
  score?: number;
  accuracy?: string; // e.g. '38/40'
  
  aiScore?: number;
  daysLeft?: number;
  requirement?: string;
}

const MOCK_CLASSES = [
  { id: '1', name: 'IELTS Intensive Band 6.5 - 7.5', code: 'ENG-IELTS-6.5A', teacher: 'ThS. Trần Thị Mai Lan' },
  { id: '2', name: 'Chuyên đề Ngữ pháp & Viết học thuật nâng cao', code: 'ENG-GRAM-ADV', teacher: 'Thầy Hoàng Minh Đức' },
];

const MOCK_ASSIGNMENTS: MockAssignment[] = [
  {
    id: 'a1', classId: '1', title: 'HW-01: Renewable Energy Essay (Writing Task 2)', type: 'Writing Task 2', status: 'pending',
    submittedOn: '04/09/2026', deadline: '05/09/2026', teacherName: 'Cô Mai Lan'
  },
  {
    id: 'a2', classId: '1', title: 'HW-02: Technology Cue Card (Speaking Part 2)', type: 'Speaking Part 2', status: 'ai_processing',
    submittedOn: '04/09/2026', hasAudio: true, aiScore: 85, teacherName: 'Cô Mai Lan'
  },
  {
    id: 'a3', classId: '1', title: 'HW-03: Maya Civilization Reading Passage', type: 'Reading', status: 'graded',
    submittedOn: '03/09/2026', accuracy: '38/40', score: 9.0, teacherName: 'Cô Mai Lan'
  },
  {
    id: 'a4', classId: '2', title: 'HW-04: Academic Vocabulary Listening Mock Test', type: 'Listening', status: 'graded',
    submittedOn: '01/09/2026', accuracy: '36/40', score: 8.5, teacherName: 'Thầy Hoàng Minh Đức'
  },
  {
    id: 'a5', classId: '2', title: 'HW-05: Environment Problem Solution Discussion (Speaking)', type: 'Speaking', status: 'not_started',
    deadline: '08/09/2026', daysLeft: 2, requirement: 'Ghi âm tối thiểu 2 phút', teacherName: 'Thầy Hoàng Minh Đức'
  },
  {
    id: 'a6', classId: '2', title: 'HW-06: Multiple Choice (Listening Part 3)', type: 'Listening', status: 'not_started',
    deadline: '11/09/2026', daysLeft: 5, requirement: '1 task', teacherName: 'Thầy Hoàng Minh Đức'
  },
  {
    id: 'a7', classId: '1', title: 'RD-01: The Evolution of Printing (Reading)', type: 'Reading', status: 'not_started',
    deadline: '10/09/2026', daysLeft: 4, teacherName: 'Cô Mai Lan'
  }
];

const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'not_started' | 'grading' | 'graded'>('all');

  const getAssignmentRoute = (assignment: MockAssignment) => {
    const typeLower = assignment.type.toLowerCase();
    if (typeLower.includes('speaking')) {
      return `/student/assignments/speaking/${assignment.id}`;
    }
    if (typeLower.includes('reading')) {
      return `/student/assignments/reading/${assignment.id}`;
    }
    if (typeLower.includes('listening')) {
      return `/student/assignments/listening/${assignment.id}`;
    }
    return `/student/assignments/${assignment.id}`;
  };

  // Filtered by class & search query & status filter
  const filteredAssignments = useMemo(() => {
    return MOCK_ASSIGNMENTS.filter((a) => {
      const matchClass = selectedClassId === 'all' || a.classId === selectedClassId;
      const matchSearch = searchQuery.trim() === '' || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchStatus = true;
      if (activeStatusFilter === 'not_started') {
        matchStatus = a.status === 'not_started';
      } else if (activeStatusFilter === 'grading') {
        matchStatus = a.status === 'pending' || a.status === 'ai_processing';
      } else if (activeStatusFilter === 'graded') {
        matchStatus = a.status === 'graded';
      }

      return matchClass && matchSearch && matchStatus;
    });
  }, [selectedClassId, searchQuery, activeStatusFilter]);

  // Overall counts for stats cards based on class filter
  const classAssignments = useMemo(() => {
    return selectedClassId === 'all' 
      ? MOCK_ASSIGNMENTS 
      : MOCK_ASSIGNMENTS.filter(a => a.classId === selectedClassId);
  }, [selectedClassId]);

  const stats = {
    notStarted: classAssignments.filter(a => a.status === 'not_started').length,
    grading: classAssignments.filter(a => a.status === 'pending' || a.status === 'ai_processing').length,
    graded: classAssignments.filter(a => a.status === 'graded').length,
  };

  const selectedClass = MOCK_CLASSES.find(c => c.id === selectedClassId);

  // Helper to render type icons & colors
  const getTypeBadge = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('writing')) {
      return {
        icon: <PenTool size={18} strokeWidth={2.2} />,
        bg: '#F5F3FF',
        color: '#7C3AED',
        label: type
      };
    }
    if (lower.includes('speaking')) {
      return {
        icon: <Mic size={18} strokeWidth={2.2} />,
        bg: '#FFF1F2',
        color: '#E11D48',
        label: type
      };
    }
    if (lower.includes('reading')) {
      return {
        icon: <BookOpen size={18} strokeWidth={2.2} />,
        bg: '#EFF6FF',
        color: '#2563EB',
        label: type
      };
    }
    if (lower.includes('listening')) {
      return {
        icon: <Headphones size={18} strokeWidth={2.2} />,
        bg: '#FFFBEB',
        color: '#D97706',
        label: type
      };
    }
    return {
      icon: <FileText size={18} strokeWidth={2.2} />,
      bg: '#F1F5F9',
      color: '#475569',
      label: type
    };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* 1. Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
            {t('studentAssignments.title')}
          </h1>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            padding: '3px 10px', 
            borderRadius: '9999px', 
            backgroundColor: '#EEF2FF', 
            color: '#4F46E5' 
          }}>
            {classAssignments.length} {t('studentAssignments.unitAssignments')}
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
          {t('studentAssignments.subtitle')}
        </p>
      </div>

      {/* 2. Stat Summary Cards (Mobbin Dashboard Cards) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '16px', 
        marginBottom: '28px' 
      }}>
        {/* Card: Chưa làm */}
        <div 
          onClick={() => setActiveStatusFilter(prev => prev === 'not_started' ? 'all' : 'not_started')}
          style={{ 
            backgroundColor: '#FFFFFF',
            borderRadius: '16px', 
            padding: '20px 24px', 
            border: activeStatusFilter === 'not_started' ? '2px solid #64748B' : '1px solid #E2E8F0',
            boxShadow: activeStatusFilter === 'not_started' 
              ? '0 10px 25px -5px rgba(100, 116, 139, 0.15)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (activeStatusFilter !== 'not_started') {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(0, 0, 0, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeStatusFilter !== 'not_started') {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
            }
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {t('studentAssignments.statusNotStarted')}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
              {stats.notStarted}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>
              Cần hoàn thành
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: '#F1F5F9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#475569' 
          }}>
            <Clock size={22} strokeWidth={2} />
          </div>
        </div>

        {/* Card: Đang chấm điểm */}
        <div 
          onClick={() => setActiveStatusFilter(prev => prev === 'grading' ? 'all' : 'grading')}
          style={{ 
            backgroundColor: '#FFFFFF',
            borderRadius: '16px', 
            padding: '20px 24px', 
            border: activeStatusFilter === 'grading' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
            boxShadow: activeStatusFilter === 'grading' 
              ? '0 10px 25px -5px rgba(245, 158, 11, 0.2)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (activeStatusFilter !== 'grading') {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(245, 158, 11, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeStatusFilter !== 'grading') {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
            }
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {t('studentAssignments.statusGrading')}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#D97706', lineHeight: 1 }}>
              {stats.grading}
            </div>
            <div style={{ fontSize: '12px', color: '#B45309', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }}></span>
              Đang chấm & AI xử lý
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: '#FFFBEB', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#D97706' 
          }}>
            <Hourglass size={22} strokeWidth={2} />
          </div>
        </div>

        {/* Card: Đã có điểm */}
        <div 
          onClick={() => setActiveStatusFilter(prev => prev === 'graded' ? 'all' : 'graded')}
          style={{ 
            backgroundColor: '#FFFFFF',
            borderRadius: '16px', 
            padding: '20px 24px', 
            border: activeStatusFilter === 'graded' ? '2px solid #10B981' : '1px solid #E2E8F0',
            boxShadow: activeStatusFilter === 'graded' 
              ? '0 10px 25px -5px rgba(16, 185, 129, 0.2)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (activeStatusFilter !== 'graded') {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(16, 185, 129, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeStatusFilter !== 'graded') {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
            }
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {t('studentAssignments.statusGraded')}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669', lineHeight: 1 }}>
              {stats.graded}
            </div>
            <div style={{ fontSize: '12px', color: '#047857', marginTop: '6px' }}>
              Đã hoàn tất đánh giá
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: '#ECFDF5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#059669' 
          }}>
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search (Mobbin Segmented Control & Clean Search) */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {/* Class Filter Segmented Pills */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          backgroundColor: '#F1F5F9', 
          borderRadius: '9999px', 
          padding: '4px', 
          gap: '4px',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)'
        }}>
          <button 
            onClick={() => setSelectedClassId('all')}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '9999px', 
              fontSize: '13px', 
              fontWeight: selectedClassId === 'all' ? 600 : 500,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: selectedClassId === 'all' ? '#FFFFFF' : 'transparent',
              color: selectedClassId === 'all' ? '#0F172A' : '#64748B',
              boxShadow: selectedClassId === 'all' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            Tất cả bài tập
          </button>
          {MOCK_CLASSES.map(c => (
            <button 
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              style={{ 
                padding: '6px 16px', 
                borderRadius: '9999px', 
                fontSize: '13px', 
                fontWeight: selectedClassId === c.id ? 600 : 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: selectedClassId === c.id ? '#FFFFFF' : 'transparent',
                color: selectedClassId === c.id ? '#0F172A' : '#64748B',
                boxShadow: selectedClassId === c.id ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              {c.code}
            </button>
          ))}
        </div>

        {/* Search & Active Status Filter Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', maxWidth: '380px', minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm theo tên bài, kỹ năng..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px 12px 8px 36px', 
                borderRadius: '10px', 
                border: '1px solid #E2E8F0', 
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366F1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
              }}
            />
          </div>
          {activeStatusFilter !== 'all' && (
            <button 
              onClick={() => setActiveStatusFilter('all')}
              style={{
                fontSize: '12px',
                color: '#64748B',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Bỏ lọc trạng thái ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. Active Course Info Banner (If specific class selected) */}
      {selectedClass && (
        <div style={{ 
          backgroundColor: '#F8FAFC', 
          border: '1px solid #E2E8F0', 
          borderRadius: '12px', 
          padding: '12px 18px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          color: '#475569'
        }}>
          <Layers size={16} color="#64748B" />
          <span>
            <strong>{selectedClass.name}</strong> • Giảng viên: {selectedClass.teacher}
          </span>
        </div>
      )}

      {/* 5. Assignment Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredAssignments.length === 0 ? (
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '16px', 
            padding: '48px 24px', 
            textAlign: 'center', 
            border: '1px dashed #CBD5E1' 
          }}>
            <FileText size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Không tìm thấy bài tập phù hợp
            </div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              Hãy thử chọn lớp học khác hoặc thay đổi từ khóa tìm kiếm.
            </div>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const typeBadge = getTypeBadge(assignment.type);
            const classObj = MOCK_CLASSES.find(c => c.id === assignment.classId);

            return (
              <div 
                key={assignment.id} 
                onClick={() => {
                  if (assignment.status === 'graded') {
                    navigate(`/student/assignments/${assignment.id}/result`);
                  } else if (assignment.status === 'not_started') {
                    navigate(`/student/assignments/${assignment.id}/overview`);
                  } else {
                    navigate(getAssignmentRoute(assignment));
                  }
                }}
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '16px', 
                  padding: '18px 22px', 
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                {/* Left: Icon Box + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '280px' }}>
                  {/* Skill Icon */}
                  <div style={{ 
                    width: '46px', 
                    height: '46px', 
                    borderRadius: '12px', 
                    backgroundColor: typeBadge.bg, 
                    color: typeBadge.color,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {typeBadge.icon}
                  </div>

                  {/* Content Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {/* Tags row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        backgroundColor: '#F1F5F9', 
                        color: '#475569' 
                      }}>
                        {classObj?.code || 'ENG'}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        backgroundColor: typeBadge.bg, 
                        color: typeBadge.color 
                      }}>
                        {assignment.type}
                      </span>
                      {assignment.daysLeft && assignment.daysLeft <= 3 && assignment.status === 'not_started' && (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 600, 
                          padding: '2px 8px', 
                          borderRadius: '6px', 
                          backgroundColor: '#FEF2F2', 
                          color: '#EF4444' 
                        }}>
                          {t('studentAssignments.badgeExpiring')}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      color: '#0F172A', 
                      margin: 0,
                      lineHeight: 1.4
                    }}>
                      {assignment.title}
                    </h3>

                    {/* Meta info row */}
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#64748B', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      flexWrap: 'wrap' 
                    }}>
                      {/* Status-specific metadata */}
                      {assignment.status === 'pending' && (
                        <>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="#94A3B8" /> {t('studentAssignments.submittedOn')}{assignment.submittedOn}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={13} color="#94A3B8" /> {t('studentAssignments.teacherLabel')}{assignment.teacherName}
                          </span>
                          {assignment.deadline && (
                            <>
                              <span>•</span>
                              <span>{t('studentAssignments.deadlinePrefix')}{assignment.deadline}</span>
                            </>
                          )}
                        </>
                      )}

                      {assignment.status === 'ai_processing' && (
                        <>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} color="#94A3B8" /> {t('studentAssignments.submittedOn')}{assignment.submittedOn}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706' }}>
                            <Sparkles size={13} color="#D97706" /> {t('studentAssignments.aiEngine')}
                          </span>
                        </>
                      )}

                      {assignment.status === 'graded' && (
                        <>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669' }}>
                            <Check size={13} color="#059669" /> {t('studentAssignments.completedOn')}{assignment.submittedOn}
                          </span>
                          {assignment.accuracy && (
                            <>
                              <span>•</span>
                              <span>{t('studentAssignments.accuracyPrefix')}{assignment.accuracy}{t('studentAssignments.correctAnswers')}</span>
                            </>
                          )}
                          {assignment.teacherName && (
                            <>
                              <span>•</span>
                              <span>{assignment.teacherName}</span>
                            </>
                          )}
                        </>
                      )}

                      {assignment.status === 'not_started' && (
                        <>
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            color: assignment.daysLeft && assignment.daysLeft <= 3 ? '#DC2626' : '#64748B',
                            fontWeight: assignment.daysLeft && assignment.daysLeft <= 3 ? 600 : 400
                          }}>
                            <Calendar size={13} color={assignment.daysLeft && assignment.daysLeft <= 3 ? '#DC2626' : '#94A3B8'} />
                            {t('studentAssignments.duePrefix')}{assignment.deadline} {t('studentAssignments.daysLeftPrefix')}{assignment.daysLeft}{t('studentAssignments.daysLeftSuffix')}
                          </span>
                          {assignment.requirement && (
                            <>
                              <span>•</span>
                              <span>{t('studentAssignments.requirePrefix')}{assignment.requirement}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Clean Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {(assignment.status === 'pending' || assignment.status === 'ai_processing') && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#B45309', 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      padding: '6px 14px', 
                      backgroundColor: '#FFFBEB', 
                      borderRadius: '9999px', 
                      border: '1px solid #FDE68A' 
                    }}>
                      <span style={{ 
                        width: '7px', 
                        height: '7px', 
                        borderRadius: '50%', 
                        backgroundColor: '#F59E0B', 
                        display: 'inline-block' 
                      }}></span>
                      {t('studentAssignments.statusGrading')}
                    </div>
                  )}

                  {assignment.status === 'graded' && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#059669', 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      padding: '6px 14px', 
                      backgroundColor: '#ECFDF5', 
                      borderRadius: '9999px', 
                      border: '1px solid #A7F3D0' 
                    }}>
                      <CheckCircle2 size={15} strokeWidth={2.2} />
                      {t('studentAssignments.statusGraded')}
                    </div>
                  )}

                  {assignment.status === 'not_started' && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#475569', 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      padding: '6px 14px', 
                      backgroundColor: '#F1F5F9', 
                      borderRadius: '9999px', 
                      border: '1px solid #E2E8F0' 
                    }}>
                      <Clock size={15} strokeWidth={2} />
                      {t('studentAssignments.statusNotStarted')}
                    </div>
                  )}

                  {/* Action CTA Button */}
                  <button
                    type="button"
                    style={{
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: assignment.status === 'not_started' ? 'none' : '1px solid #CBD5E1',
                      backgroundColor: assignment.status === 'not_started' ? '#2563EB' : '#FFFFFF',
                      color: assignment.status === 'not_started' ? '#FFFFFF' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (assignment.status === 'graded') {
                        navigate(`/student/assignments/${assignment.id}/result`);
                      } else if (assignment.status === 'not_started') {
                        navigate(`/student/assignments/${assignment.id}/overview`);
                      } else {
                        navigate(getAssignmentRoute(assignment));
                      }
                    }}
                  >
                    {assignment.status === 'not_started'
                      ? t('studentAssignments.btnStart')
                      : assignment.status === 'graded'
                        ? t('studentAssignments.btnFeedback')
                        : t('studentAssignments.btnReview')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Footer / Synchronization info */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '28px',
        paddingTop: '16px',
        borderTop: '1px solid #F1F5F9',
        fontSize: '13px', 
        color: '#64748B',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          {t('studentAssignments.paginationPrefix')}<strong>{filteredAssignments.length}</strong>{t('studentAssignments.paginationMid')}<strong>{classAssignments.length}</strong>{t('studentAssignments.paginationSuffix')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 500 }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: '#10B981', 
            display: 'inline-block' 
          }}></span>
          {t('studentAssignments.syncStatus')}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;
