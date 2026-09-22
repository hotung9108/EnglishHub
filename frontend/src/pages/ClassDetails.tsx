import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Users,
  ClipboardList, Settings, CheckCircle2
} from 'lucide-react';
import TabStudents from '../components/classes/ClassDetails/TabStudents';
import TabAssignments from '../components/classes/ClassDetails/TabAssignments';
import TabSettings from '../components/classes/ClassDetails/TabSettings';
import { useLanguage } from '../contexts/LanguageContext';

const ClassDetails = () => {
  const { t } = useLanguage();
  // id removed, not used

  const [activeTab, setActiveTab] = useState('students');

  // Mock data for the layout
  const classData = {
    code: 'ENG-IELTS-6.5A',
    name: 'IELTS Intensive Band 6.5 - 7.5',
    description: 'Khóa học tăng cường 4 kỹ năng chuẩn đầu ra IELTS 6.5+',
    status: 'Đang diễn ra',
    teacher: {
      name: 'Cô Trần Thị Mai Lan',
      title: 'Cựu Giảng viên ĐHNN',
      ielts: '8.5'
    },
    studentsCount: 24,
    studentsMax: 25
  };

  const tabs = [
    { id: 'students', label: t('classDetails.tabStudents'), icon: Users, badge: 24 },
    { id: 'assignments', label: t('classDetails.tabAssignments'), icon: ClipboardList, badge: '15' },
    { id: 'settings', label: t('classDetails.tabSettings'), icon: Settings }
  ];

  return (
    <div>
      {/* Breadcrumb & Actions */}
      <div className="flex-between-start mb-24">
        <div>
          <div className="breadcrumb-nav">
            <span>{t('classDetails.breadcrumbAdmin')}</span>
            <span>&rsaquo;</span>
            <Link to="/admin/classes">{t('classDetails.breadcrumbManage')}</Link>
            <span>&rsaquo;</span>
            <span className="breadcrumb-current">{t('classDetails.breadcrumbPrefix')}{classData.code}</span>
          </div>
          <div className="flex items-center gap-16 mb-12">
            <h1 style={{ fontSize: '28px' }}>{classData.name}</h1>
            <span className="badge badge-code">
              {classData.code}
            </span>
          </div>
          <div className="flex items-center gap-12 mb-8">
            <span className="badge badge-status-active">
              <span className="status-dot status-dot-active"></span>
              {t('active')}
            </span>
          </div>
          <p className="text-on-surface-variant" style={{ fontSize: '14px' }}>{classData.description}</p>
        </div>

        <div className="flex gap-12">
          <button className="btn btn-white">
            <ArrowLeft size={16} />
            {t('classDetails.btnBack')}
          </button>
          <button className="btn btn-white">
            <Download size={16} />
            {t('classDetails.btnExport')}
          </button>
        </div>
      </div>

      {/* 2 Info Cards */}
      <div className="grid grid-2 gap-20 mb-24">
        {/* Card 1: Teacher */}
        <div className="card p-20 flex-col">
          <div className="flex-between-start mb-12">
            <span className="info-card-label">{t('classDetails.teacherInCharge')}</span>
            <div className="info-card-icon">
              <ArrowLeft size={16} style={{ transform: 'rotate(135deg)' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{classData.teacher.name}</h3>
          <div className="flex items-center gap-12 mt-auto">
            <div className="info-card-avatar">
              {classData.teacher.name.charAt(4)}
            </div>
            <div>
              <span className="badge-ielts">
                IELTS {classData.teacher.ielts}
              </span>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>{classData.teacher.title}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="card p-20 flex-col">
          <div className="flex-between-start mb-12">
            <span className="info-card-label">{t('classDetails.currentClassSize')}</span>
            <div className="info-card-icon">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-8 mb-16">
            <span style={{ fontSize: '32px', fontWeight: '700' }}>{classData.studentsCount}</span>
            <span className="text-on-surface-variant" style={{ fontSize: '14px' }}>/ {classData.studentsMax}{t('classDetails.studentUnit')}</span>
          </div>
          <div className="mt-auto">
            <div className="flex-between mb-8" style={{ fontSize: '12px' }}>
              <span style={{ color: '#4B5563', fontWeight: '500' }}>{t('classDetails.occupancyRate')}</span>
              <span style={{ color: '#059669', fontWeight: '600' }}>{Math.round((classData.studentsCount / classData.studentsMax) * 100)}% {t('classDetails.seatsLeftPrefix')}{classData.studentsMax - classData.studentsCount}{t('classDetails.seatsLeftSuffix')}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${(classData.studentsCount / classData.studentsMax) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-24">
        <div className="tab-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.badge && (
                <span className={`tab-badge ${activeTab === tab.id ? 'tab-badge-active' : 'tab-badge-inactive'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
          <div className="tab-sync-status">
            <CheckCircle2 size={14} color="#059669" /> {t('classDetails.syncStatus')}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="tab-content">
          {activeTab === 'students' && <TabStudents />}
          {activeTab === 'assignments' && <TabAssignments />}
          {activeTab === 'settings' && <TabSettings />}
        </div>
      </div>

    </div>
  );
};

export default ClassDetails;
