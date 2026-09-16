import React from 'react';
import { User, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    <div className="card student-class-card">
      <div className="card-header">
        <span className="course-code">{classInfo.code}</span>
        {classInfo.status === 'active' ? (
          <span className="badge badge-active-course">
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
            {t('studentClasses.filterActive')}
          </span>
        ) : (
          <span className="badge badge-completed-course">
            <CheckCircle2 size={12} />
            {t('studentClasses.filterCompleted')}
          </span>
        )}
      </div>

      <h3 className="course-title">{classInfo.name}</h3>
      
      <div className="instructor-info">
        <User size={16} />
        <span>{t('studentClasses.instructorPrefix')}{classInfo.instructorName}</span>
      </div>

      {classInfo.status === 'active' ? (
        <div className="student-class-stats">
          <div className="student-class-stat-item">
            <span className="stat-label">{t('studentClasses.statsAssigned')}</span>
            <span className="stat-value">{classInfo.stats.assigned}{t('studentClasses.statsAssignedUnit')}</span>
          </div>
          <div className="student-class-stat-item">
            <span className="stat-label">{t('studentClasses.statsPending')}</span>
            <span className={`stat-value ${classInfo.stats.pending > 0 ? 'highlight-red' : 'highlight-green'}`}>
              {classInfo.stats.pending}{t('studentClasses.statsPendingUnit')}
            </span>
          </div>
          <div className="student-class-stat-item">
            <span className="stat-label">{t('studentClasses.statsAvgScore')}</span>
            <span className="stat-value highlight-green">{classInfo.stats.avgScore?.toFixed(1) || '-.-'}/10</span>
          </div>
        </div>
      ) : (
        <>
          {classInfo.hasCertificate && (
            <div className="badge-cert-issued">
              <CheckCircle2 size={16} />
              {t('studentClasses.certIssued')}
            </div>
          )}
          <div className="student-class-stats">
            <div className="student-class-stat-item">
              <span className="stat-label">{t('studentClasses.statsResult')}</span>
              <span className="stat-value highlight-green">{classInfo.stats.result || '-'}</span>
            </div>
            <div className="student-class-stat-item">
              <span className="stat-label">{t('studentClasses.statsFinalScore')}</span>
              <span className="stat-value">{classInfo.stats.finalScore?.toFixed(1) || '-.-'}/10</span>
            </div>
          </div>
        </>
      )}

      {classInfo.status === 'active' ? (
        <button 
          className="btn btn-dark"
          onClick={() => onViewClass(classInfo.id)}
        >
          {t('studentClasses.btnViewClass')} <ArrowRight size={16} />
        </button>
      ) : (
        <button 
          className="btn btn-light"
          onClick={() => onViewMaterials(classInfo.id)}
        >
          {t('studentClasses.btnViewMaterials')}
        </button>
      )}
    </div>
  );
};

export default StudentClassCard;
