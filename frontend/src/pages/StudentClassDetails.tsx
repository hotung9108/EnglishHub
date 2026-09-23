import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const StudentClassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Mock data for the specific class based on ID
  // In a real app, we would fetch this using a custom hook, e.g., useStudentClass(id)
  const classInfo = {
    id: id,
    code: 'ENG-IELTS-6.5A',
    name: 'IELTS Intensive Band 6.5 - 7.5',
    instructorName: 'Cô Trần Thị Mai Lan',
    status: 'active',
  };

  return (
    <div className="container" style={{ padding: '24px' }}>
      {/* Back button */}
      <button 
        onClick={() => navigate('/student/classes')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
      >
        <ArrowLeft size={20} /> Quay lại danh sách lớp
      </button>

      {/* Class Header Area */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{classInfo.name}</h1>
            <span style={{ 
              backgroundColor: 'var(--surface-container-low)', 
              color: '#2563EB', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-full)',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #BFDBFE'
            }}>{classInfo.code}</span>
          </div>
          <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Giảng viên: <strong>{classInfo.instructorName}</strong></span>
            <span>•</span>
            {classInfo.status === 'active' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                Đang diễn ra
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                <CheckCircle2 size={12} />
                Đã hoàn thành
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Assignments Section */}
      <div className="card" style={{ padding: '32px', border: '1px solid var(--outline-variant)', boxShadow: 'none', backgroundColor: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px', fontSize: '20px' }}>Danh sách bài tập</h3>
          </div>
          <div className="body-md text-on-surface-variant">
            {t('studentAssignments.totalAssignedPrefix')}<strong style={{ color: 'var(--on-surface)' }}>15{t('studentAssignments.unitAssignments')}</strong>
          </div>
        </div>

        {/* Status Summary Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>{t('studentAssignments.statusNotStarted')}</span>
            <span style={{ backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>1</span>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', border: '2px solid #FBBF24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></span>
              {t('studentAssignments.statusPending')}
            </span>
            <span style={{ backgroundColor: '#FDE68A', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#D97706' }}>2</span>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#16A34A' }}>{t('studentAssignments.statusGraded')}</span>
            <span style={{ backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>11</span>
          </div>
        </div>

        {/* Assignments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div 
            onClick={() => navigate('/student/assignments/HW-01')}
            style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>HW-01: Renewable Energy Essay (Writing Task 2)</h4>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{t('studentAssignments.submittedOn')}04/09/2026</span>
                <span>•</span>
                <span>{t('studentAssignments.deadlinePrefix')}05/09/2026</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '13px', fontWeight: 500, padding: '6px 12px', backgroundColor: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                {t('studentAssignments.statusGrading')}
              </div>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={(e) => { e.stopPropagation(); navigate('/student/assignments/HW-01'); }}
              >
                {t('studentAssignments.btnReview')}
              </button>
            </div>
          </div>

          <div 
            onClick={() => navigate('/student/assignments/speaking/HW-02')}
            style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>HW-02: Technology Cue Card (Speaking Part 2)</h4>
                <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #C7D2FE' }}>{t('studentAssignments.badgeAudio')}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{t('studentAssignments.submittedOn')}04/09/2026</span>
                <span>•</span>
                <span>{t('studentAssignments.aiEngine')}</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#16A34A', fontSize: '13px', fontWeight: 500, padding: '6px 12px', backgroundColor: '#DCFCE7', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                {t('studentAssignments.statusGraded')}
              </div>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={(e) => { e.stopPropagation(); navigate('/student/assignments/speaking/HW-02'); }}
              >
                {t('studentAssignments.btnReview')}
              </button>
            </div>
          </div>

          <div 
            onClick={() => navigate('/student/assignments/speaking/HW-05')}
            style={{ padding: '20px', borderRadius: '8px', border: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>HW-05: Environment Problem Solution Discussion (Speaking)</h4>
                <span style={{ backgroundColor: '#FEF2F2', color: '#EF4444', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>{t('studentAssignments.badgeExpiring')}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#EF4444', fontWeight: 500 }}>{t('studentAssignments.duePrefix')}08/09/2026 {t('studentAssignments.daysLeftPrefix')}2{t('studentAssignments.daysLeftSuffix')}</span>
                <span>•</span>
                <span>{t('studentAssignments.requirePrefix')}Ghi âm tối thiểu 2 phút</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#475569', fontSize: '13px', fontWeight: 500, padding: '6px 14px', backgroundColor: '#E2E8F0', borderRadius: '6px' }}>
                {t('studentAssignments.statusNotStarted')}
              </div>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={(e) => { e.stopPropagation(); navigate('/student/assignments/speaking/HW-05'); }}
              >
                {t('studentAssignments.btnStart')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentClassDetails;
