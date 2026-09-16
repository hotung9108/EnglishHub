import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

type AssignmentStatus = 'not_started' | 'pending' | 'ai_processing' | 'graded';

interface MockAssignment {
  id: string;
  classId: string;
  title: string;
  type: string; // e.g. 'Writing Task 2', 'Speaking Part 2'
  status: AssignmentStatus;
  submittedOn?: string;
  deadline?: string;
  teacherName: string;
  hasAudio?: boolean;
  score?: number;
  accuracy?: string; // e.g. '38/40'
  aiScore?: number; // e.g. 85 for 85%
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const filteredAssignments = selectedClassId === 'all' 
    ? MOCK_ASSIGNMENTS 
    : MOCK_ASSIGNMENTS.filter(a => a.classId === selectedClassId);

  const selectedClass = MOCK_CLASSES.find(c => c.id === selectedClassId);

  // Calculate dynamic stats
  const stats = {
    notStarted: filteredAssignments.filter(a => a.status === 'not_started').length,
    pending: filteredAssignments.filter(a => a.status === 'pending').length,
    aiProcessing: filteredAssignments.filter(a => a.status === 'ai_processing').length,
    graded: filteredAssignments.filter(a => a.status === 'graded').length,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{t('studentAssignments.title')}</h1>
          </div>
          <p className="body-md text-on-surface-variant">
            {t('studentAssignments.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ padding: '32px', border: '1px solid var(--outline-variant)', boxShadow: 'none', backgroundColor: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px', fontSize: '20px' }}>{t('studentAssignments.tableTitle')}</h3>
            <p className="body-md text-on-surface-variant">
              {selectedClass ? (
                <>{t('studentAssignments.courseInfoPrefix')}{selectedClass.name}{t('studentAssignments.teacherPrefix')}{selectedClass.teacher}</>
              ) : (
                <>Tất cả các khoá học của bạn</>
              )}
            </p>
          </div>
          <div className="body-md text-on-surface-variant">
            {t('studentAssignments.totalAssignedPrefix')}<strong style={{ color: 'var(--on-surface)' }}>{filteredAssignments.length}{t('studentAssignments.unitAssignments')}</strong>
          </div>
        </div>

        {/* Filter Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
              Lọc theo lớp học:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setSelectedClassId('all')}
                style={{ 
                  padding: '6px 16px', 
                  borderRadius: '20px', 
                  fontSize: '14px', 
                  fontWeight: selectedClassId === 'all' ? 600 : 500,
                  cursor: 'pointer',
                  border: selectedClassId === 'all' ? '1px solid #2563EB' : '1px solid var(--outline-variant)',
                  backgroundColor: selectedClassId === 'all' ? '#EFF6FF' : 'transparent',
                  color: selectedClassId === 'all' ? '#2563EB' : 'var(--on-surface-variant)',
                  transition: 'all 0.2s ease'
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
                    borderRadius: '20px', 
                    fontSize: '14px', 
                    fontWeight: selectedClassId === c.id ? 600 : 500,
                    cursor: 'pointer',
                    border: selectedClassId === c.id ? '1px solid #2563EB' : '1px solid var(--outline-variant)',
                    backgroundColor: selectedClassId === c.id ? '#EFF6FF' : 'transparent',
                    color: selectedClassId === c.id ? '#2563EB' : 'var(--on-surface-variant)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Summary Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {/* Chưa làm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>{t('studentAssignments.statusNotStarted')}</span>
            <span style={{ backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>{stats.notStarted}</span>
          </div>
          {/* Chờ chấm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '2px solid #FBBF24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></span>
              {t('studentAssignments.statusPending')}
            </span>
            <span style={{ backgroundColor: '#FDE68A', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#D97706' }}>{stats.pending}</span>
          </div>
          {/* AI Đang xử lý */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>✧</span>
              {t('studentAssignments.statusAIProcessing')}
            </span>
            <span style={{ backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>{stats.aiProcessing}</span>
          </div>
          {/* Đã có điểm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#16A34A' }}>{t('studentAssignments.statusGraded')}</span>
            <span style={{ backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>{stats.graded}</span>
          </div>
        </div>

        {/* Assignments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {filteredAssignments.map((assignment) => {
            if (assignment.status === 'pending') {
              return (
                <div key={assignment.id} style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>{assignment.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 {t('studentAssignments.submittedOn')}{assignment.submittedOn}</span>
                      <span>•</span>
                      <span>{t('studentAssignments.teacherLabel')}{assignment.teacherName}</span>
                      <span>•</span>
                      <span>{t('studentAssignments.deadlinePrefix')}{assignment.deadline}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '14px', fontWeight: 500, padding: '6px 12px', backgroundColor: '#FFFBEB', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                      <span style={{ fontSize: '16px' }}>🕒</span> {t('studentAssignments.statusGrading')}
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                      style={{ backgroundColor: 'white', border: '1px solid var(--outline-variant)', padding: '8px 16px', fontSize: '14px' }}
                    >
                      {t('studentAssignments.btnReview')}
                    </button>
                  </div>
                </div>
              );
            }

            if (assignment.status === 'ai_processing') {
              return (
                <div key={assignment.id} style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>{assignment.title}</h4>
                      {assignment.hasAudio && <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #C7D2FE' }}>{t('studentAssignments.badgeAudio')}</span>}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 {t('studentAssignments.submittedOn')}{assignment.submittedOn}</span>
                      <span>•</span>
                      <span>{t('studentAssignments.aiEngine')}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#EFF6FF', padding: '6px 16px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                      <div style={{ width: '60px', height: '6px', backgroundColor: '#DBEAFE', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${assignment.aiScore}%`, height: '100%', backgroundColor: '#2563EB' }}></div>
                      </div>
                      <span style={{ color: '#2563EB', fontSize: '14px', fontWeight: 600 }}>{t('studentAssignments.aiGradingPrefix')}{assignment.aiScore}%</span>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                      style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '8px 16px', fontSize: '14px' }}
                    >
                      {t('studentAssignments.btnDetails')}
                    </button>
                  </div>
                </div>
              );
            }

            if (assignment.status === 'graded') {
              return (
                <div key={assignment.id} style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>{assignment.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✓ {t('studentAssignments.completedOn')}{assignment.submittedOn}</span>
                      <span>•</span>
                      <span>{t('studentAssignments.accuracyPrefix')}{assignment.accuracy}{t('studentAssignments.correctAnswers')}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '14px', fontWeight: 600, padding: '6px 12px', backgroundColor: '#F0FDF4', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
                      <span>✓</span> {t('studentAssignments.gradedPrefix')}{assignment.score?.toFixed(1)}/10
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                      style={{ backgroundColor: 'white', border: '1px solid #BBF7D0', color: '#16A34A', padding: '8px 16px', fontSize: '14px' }}
                    >
                      {t('studentAssignments.btnFeedback')}
                    </button>
                  </div>
                </div>
              );
            }

            if (assignment.status === 'not_started') {
              return (
                <div key={assignment.id} style={{ padding: '20px', borderRadius: '8px', border: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>{assignment.title}</h4>
                      {assignment.daysLeft && assignment.daysLeft <= 3 && (
                        <span style={{ backgroundColor: '#FEF2F2', color: '#EF4444', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>{t('studentAssignments.badgeExpiring')}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#EF4444', fontWeight: 500 }}>{t('studentAssignments.duePrefix')}{assignment.deadline} {t('studentAssignments.daysLeftPrefix')}{assignment.daysLeft}{t('studentAssignments.daysLeftSuffix')}</span>
                      <span>•</span>
                      <span>{t('studentAssignments.requirePrefix')}{assignment.requirement}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ color: '#64748B', fontSize: '14px', fontWeight: 500, padding: '6px 16px', backgroundColor: '#E2E8F0', borderRadius: '4px' }}>
                      {t('studentAssignments.statusNotStarted')}
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        if (assignment.title.includes('Reading')) navigate(`/student/assignments/reading/${assignment.id}`);
                        else if (assignment.title.includes('Listening')) navigate(`/student/assignments/listening/${assignment.id}`);
                        else navigate(`/student/assignments/${assignment.id}`);
                      }}
                      style={{ backgroundColor: '#2563EB', padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {t('studentAssignments.btnStart')} <span>→</span>
                    </button>
                  </div>
                </div>
              );
            }
            
            return null;
          })}

        </div>
      </div>

      {/* Footer info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
        <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
          {t('studentAssignments.paginationPrefix')}<strong>{filteredAssignments.length > 5 ? 5 : filteredAssignments.length}</strong>{t('studentAssignments.paginationMid')}<strong>{filteredAssignments.length}</strong>{t('studentAssignments.paginationSuffix')} <span style={{ margin: '0 8px' }}>•</span> <button style={{ color: '#2563EB', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer', padding: 0 }}>{t('studentAssignments.btnViewAll')}</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981', fontWeight: 500 }}>
          <span style={{ border: '1px solid #10B981', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px' }}>✓</span> {t('studentAssignments.syncStatus')}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;
