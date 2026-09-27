import React from 'react';
import { User, ArrowRight, CheckCircle2, GraduationCap, FileText, Clock, Award } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface StudentClassInfo {
  id: string;
  code: string;
  name: string;
  instructorName: string;
  status: 'active' | 'completed';
  stats: {
    assigned: number;
    pending: number;
    avgScore?: number;
    result?: string;
    finalScore?: number;
  };
  hasCertificate?: boolean;
}

interface StudentClassCardProps {
  classInfo: StudentClassInfo;
  onViewClass: (id: string) => void;
  onViewMaterials: (id: string) => void;
}

const StudentClassCard: React.FC<StudentClassCardProps> = ({ classInfo, onViewClass, onViewMaterials }) => {
  const { t } = useLanguage();

  return (
    <div className="student-class-card">
      {/* Header: Course Code & Status Badge */}
      <div className="card-header">
        <span className="course-code">{classInfo.code}</span>
        {classInfo.status === 'active' ? (
          <span className="badge-active-course">
            <span className="badge-active-dot"></span>
            {t('studentClasses.filterActive')}
          </span>
        ) : (
          <span className="badge-completed-course">
            <CheckCircle2 size={13} />
            {t('studentClasses.filterCompleted')}
          </span>
        )}
      </div>

      {/* Course Title */}
      <h3 className="course-title">{classInfo.name}</h3>
      
      {/* Instructor info */}
      <div className="instructor-info">
        <div className="flex justify-center items-center rounded-full text-on-surface-variant" style={{ width: '24px', height: '24px', backgroundColor: 'var(--surface-dim)' }}>
          <User size={14} />
        </div>
        <span>{t('studentClasses.instructorPrefix')}<strong>{classInfo.instructorName}</strong></span>
      </div>

      {/* Metrics Section */}
      {classInfo.status === 'active' ? (
        <div className="student-class-metrics">
          {/* Assigned */}
          <div className="student-class-metric-item">
            <span className="metric-label">{t('studentClasses.statsAssigned')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={13} color="var(--on-surface-variant)" />
              <span className="metric-value">{classInfo.stats.assigned}</span>
            </div>
          </div>

          {/* Pending */}
          <div className="student-class-metric-item">
            <span className="metric-label">{t('studentClasses.statsPending')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color={classInfo.stats.pending > 0 ? 'var(--error)' : 'var(--secondary)'} />
              <span className={`metric-value ${classInfo.stats.pending > 0 ? 'highlight-red' : 'highlight-green'}`}>
                {classInfo.stats.pending}
              </span>
            </div>
          </div>

          {/* Avg Score */}
          <div className="student-class-metric-item">
            <span className="metric-label">{t('studentClasses.statsAvgScore')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={13} color="var(--secondary)" />
              <span className="metric-value highlight-green">
                {classInfo.stats.avgScore ? `${classInfo.stats.avgScore.toFixed(1)}/10` : '-.-'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-auto mb-16">
          {classInfo.hasCertificate && (
            <div className="badge-cert-issued">
              <GraduationCap size={15} />
              <span>{t('studentClasses.certIssued')}</span>
            </div>
          )}
          <div className="student-class-metrics grid grid-2 mb-0">
            <div className="student-class-metric-item">
              <span className="metric-label">{t('studentClasses.statsResult')}</span>
              <span className="metric-value highlight-green">{classInfo.stats.result || '-'}</span>
            </div>
            <div className="student-class-metric-item">
              <span className="metric-label">{t('studentClasses.statsFinalScore')}</span>
              <span className="metric-value">{classInfo.stats.finalScore ? `${classInfo.stats.finalScore.toFixed(1)}/10` : '-.-'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {classInfo.status === 'active' ? (
        <button 
          className="btn-primary-card"
          onClick={() => onViewClass(classInfo.id)}
        >
          <span>{t('studentClasses.btnViewClass')}</span>
          <ArrowRight size={16} />
        </button>
      ) : (
        <button 
          className="btn-secondary-card"
          onClick={() => onViewMaterials(classInfo.id)}
        >
          <span>{t('studentClasses.btnViewMaterials')}</span>
        </button>
      )}
    </div>
  );
};

export default StudentClassCard;
