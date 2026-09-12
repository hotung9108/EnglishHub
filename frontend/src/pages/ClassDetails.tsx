import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Plus, Users,
  ClipboardList, Settings, CheckCircle2
} from 'lucide-react';
import TabStudents from '../components/classes/ClassDetails/TabStudents';
import TabAssignments from '../components/classes/ClassDetails/TabAssignments';
import TabSettings from '../components/classes/ClassDetails/TabSettings';

const ClassDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('students');

  // Mock data for the layout
  const classData = {
    code: 'ENG-IELTS-6.5A',
    name: 'IELTS Intensive Band 6.5 - 7.5',
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
    { id: 'students', label: 'Danh sách học viên', icon: Users, badge: 24 },
    { id: 'assignments', label: 'Bài tập & Điểm số', icon: ClipboardList, badge: '15 bài' },
    { id: 'settings', label: 'Cài đặt lớp học', icon: Settings }
  ];

  return (
    <div>
      {/* Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Admin</span>
            <span>&rsaquo;</span>
            <Link to="/admin/classes" style={{ color: '#6B7280', textDecoration: 'none' }}>Quản lý lớp học</Link>
            <span>&rsaquo;</span>
            <span style={{ fontWeight: '500', color: '#111827' }}>Chi tiết lớp học {classData.code}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <h1 className="display-sm" style={{ fontSize: '28px' }}>{classData.name}</h1>
            <span className="badge badge-primary" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '12px', padding: '4px 8px' }}>
              {classData.code}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '12px', padding: '4px 8px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
              {classData.status}
            </span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>{classData.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" style={{ backgroundColor: 'white', border: '1px solid #D1D5DB', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} />
            Danh sách lớp
          </button>
          <button className="btn" style={{ backgroundColor: 'white', border: '1px solid #D1D5DB', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} />
            Xuất báo cáo
          </button>

        </div>
      </div>

      {/* 2 Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Teacher */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Giáo viên phụ trách</span>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#EFF6FF', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3B82F6' }}>
              <ArrowLeft size={16} style={{ transform: 'rotate(135deg)' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{classData.teacher.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#4B5563' }}>
              {classData.teacher.name.charAt(4)}
            </div>
            <div>
              <span style={{ display: 'inline-block', backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px' }}>
                IELTS {classData.teacher.ielts}
              </span>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>{classData.teacher.title}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Sĩ số lớp hiện tại</span>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#EFF6FF', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3B82F6' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px', fontWeight: '700' }}>{classData.studentsCount}</span>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>/ {classData.studentsMax} học viên</span>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#4B5563', fontWeight: '500' }}>Tỷ lệ lấp đầy</span>
              <span style={{ color: '#059669', fontWeight: '600' }}>{Math.round((classData.studentsCount / classData.studentsMax) * 100)}% (Còn {classData.studentsMax - classData.studentsCount} chỗ)</span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(classData.studentsCount / classData.studentsMax) * 100}%`, backgroundColor: '#059669', borderRadius: '3px' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', overflowX: 'auto', padding: '0 16px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 20px',
                backgroundColor: activeTab === tab.id ? '#EFF6FF' : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#2563EB' : 'transparent'}`,
                color: activeTab === tab.id ? '#1D4ED8' : '#6B7280',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.badge && (
                <span style={{
                  backgroundColor: activeTab === tab.id ? '#2563EB' : '#F3F4F6',
                  color: activeTab === tab.id ? 'white' : '#4B5563',
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '16px', gap: '8px', fontSize: '12px', color: '#6B7280' }}>
            <CheckCircle2 size={14} color="#059669" /> Dữ liệu đồng bộ lúc: 14:32 hôm nay
          </div>
        </div>

        {/* Tab Content Area */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'students' && <TabStudents />}
          {activeTab === 'assignments' && <TabAssignments />}
          {activeTab === 'settings' && <TabSettings />}
        </div>
      </div>

    </div>
  );
};

export default ClassDetails;
