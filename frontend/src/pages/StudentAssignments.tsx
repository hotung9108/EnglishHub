import { useLanguage } from '../contexts/LanguageContext';

const StudentAssignments = () => {
  const { t } = useLanguage();
  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{t('studentAssignments.title')}</h1>
            <span style={{ 
              backgroundColor: 'var(--surface-container-low)', 
              color: '#2563EB', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-full)',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #BFDBFE'
            }}>{t('studentAssignments.classPrefix')}ENG-IELTS-6.5A</span>
          </div>
          <p className="body-md text-on-surface-variant">
            {t('studentAssignments.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ backgroundColor: 'transparent', border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>↻</span> {t('studentAssignments.btnRefresh')}
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>+</span> {t('studentAssignments.btnSubmitNew')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ padding: '32px', border: '1px solid var(--outline-variant)', boxShadow: 'none', backgroundColor: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px', fontSize: '20px' }}>{t('studentAssignments.tableTitle')}</h3>
            <p className="body-md text-on-surface-variant">
              {t('studentAssignments.courseInfoPrefix')}IELTS Intensive Band 6.5 - 7.5{t('studentAssignments.teacherPrefix')}ThS. Trần Thị Mai Lan
            </p>
          </div>
          <div className="body-md text-on-surface-variant">
            {t('studentAssignments.totalAssignedPrefix')}<strong style={{ color: 'var(--on-surface)' }}>15{t('studentAssignments.unitAssignments')}</strong>
          </div>
        </div>

        {/* Status Summary Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {/* Chưa làm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>{t('studentAssignments.statusNotStarted')}</span>
            <span style={{ backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>1</span>
          </div>
          {/* Chờ chấm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '2px solid #FBBF24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></span>
              {t('studentAssignments.statusPending')}
            </span>
            <span style={{ backgroundColor: '#FDE68A', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#D97706' }}>2</span>
          </div>
          {/* AI Đang xử lý */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>✧</span>
              {t('studentAssignments.statusAIProcessing')}
            </span>
            <span style={{ backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>1</span>
          </div>
          {/* Đã có điểm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#16A34A' }}>{t('studentAssignments.statusGraded')}</span>
            <span style={{ backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>11</span>
          </div>
        </div>

        {/* Assignments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Assignment 1: Đang chấm điểm */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>HW-01: Renewable Energy Essay (Writing Task 2)</h4>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 {t('studentAssignments.submittedOn')}04/09/2026</span>
                <span>•</span>
                <span>{t('studentAssignments.teacherLabel')}Cô Mai Lan</span>
                <span>•</span>
                <span>{t('studentAssignments.deadlinePrefix')}05/09/2026</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '14px', fontWeight: 500, padding: '6px 12px', backgroundColor: '#FFFBEB', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '16px' }}>🕒</span> {t('studentAssignments.statusGrading')}
              </div>
              <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid var(--outline-variant)', padding: '8px 16px', fontSize: '14px' }}>
                {t('studentAssignments.btnReview')}
              </button>
            </div>
          </div>

          {/* Assignment 2: AI Grading */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>HW-02: Technology Cue Card (Speaking Part 2)</h4>
                <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #C7D2FE' }}>{t('studentAssignments.badgeAudio')}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 {t('studentAssignments.submittedOn')}04/09/2026</span>
                <span>•</span>
                <span>{t('studentAssignments.aiEngine')}</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#EFF6FF', padding: '6px 16px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                <div style={{ width: '60px', height: '6px', backgroundColor: '#DBEAFE', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', backgroundColor: '#2563EB' }}></div>
                </div>
                <span style={{ color: '#2563EB', fontSize: '14px', fontWeight: 600 }}>{t('studentAssignments.aiGradingPrefix')}85%</span>
              </div>
              <button className="btn btn-secondary" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '8px 16px', fontSize: '14px' }}>
                {t('studentAssignments.btnDetails')}
              </button>
            </div>
          </div>

          {/* Assignment 3: Đã chấm */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>HW-03: Maya Civilization Reading Passage</h4>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✓ {t('studentAssignments.completedOn')}03/09/2026</span>
                <span>•</span>
                <span>{t('studentAssignments.accuracyPrefix')}38/40{t('studentAssignments.correctAnswers')}</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '14px', fontWeight: 600, padding: '6px 12px', backgroundColor: '#F0FDF4', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
                <span>✓</span> {t('studentAssignments.gradedPrefix')}9.0/10
              </div>
              <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid #BBF7D0', color: '#16A34A', padding: '8px 16px', fontSize: '14px' }}>
                {t('studentAssignments.btnFeedback')}
              </button>
            </div>
          </div>

          {/* Assignment 4: Đã chấm */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>HW-04: Academic Vocabulary Listening Mock Test</h4>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✓ {t('studentAssignments.completedOn')}01/09/2026</span>
                <span>•</span>
                <span>{t('studentAssignments.accuracyPrefix')}36/40{t('studentAssignments.correctAnswers')}</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '14px', fontWeight: 600, padding: '6px 12px', backgroundColor: '#F0FDF4', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
                <span>✓</span> {t('studentAssignments.gradedPrefix')}8.5/10
              </div>
              <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid #BBF7D0', color: '#16A34A', padding: '8px 16px', fontSize: '14px' }}>
                {t('studentAssignments.btnFeedback')}
              </button>
            </div>
          </div>

          {/* Assignment 5: Chưa làm */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ color: '#64748B', fontSize: '14px', fontWeight: 500, padding: '6px 16px', backgroundColor: '#E2E8F0', borderRadius: '4px' }}>
                {t('studentAssignments.statusNotStarted')}
              </div>
              <button className="btn btn-primary" style={{ backgroundColor: '#2563EB', padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {t('studentAssignments.btnStart')} <span>→</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
        <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
          {t('studentAssignments.paginationPrefix')}<strong>5</strong>{t('studentAssignments.paginationMid')}<strong>15</strong>{t('studentAssignments.paginationSuffix')} <span style={{ margin: '0 8px' }}>•</span> <button style={{ color: '#2563EB', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer', padding: 0 }}>{t('studentAssignments.btnViewAll')}</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981', fontWeight: 500 }}>
          <span style={{ border: '1px solid #10B981', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px' }}>✓</span> {t('studentAssignments.syncStatus')}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;
