import React, { useState, useMemo } from 'react';
import { Search, BookOpen, CheckCircle2, GraduationCap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import StudentClassCard from '../components/classes/StudentClassCard';
import type { StudentClassInfo } from '../components/classes/StudentClassCard';

const MOCK_CLASSES: StudentClassInfo[] = [
  {
    id: '1',
    code: 'ENG-IELTS-6.5A',
    name: 'IELTS Intensive Band 6.5 - 7.5',
    instructorName: 'Cô Trần Thị Mai Lan',
    status: 'active',
    stats: {
      assigned: 15,
      pending: 2,
      avgScore: 7.2
    }
  },
  {
    id: '2',
    code: 'ENG-GRAM-ADV',
    name: 'Chuyên đề Ngữ pháp & Viết học thuật nâng cao',
    instructorName: 'Thầy Hoàng Minh Đức',
    status: 'active',
    stats: {
      assigned: 8,
      pending: 0,
      avgScore: 8.0
    }
  },
  {
    id: '3',
    code: 'ENG-TOEIC-750',
    name: 'Luyện thi TOEIC Cấp tốc Mục tiêu 750+',
    instructorName: 'Cô Nguyễn Thu Trang',
    status: 'active',
    stats: {
      assigned: 12,
      pending: 1,
      avgScore: 7.8
    }
  },
  {
    id: '4',
    code: 'ENG-SPK-WS',
    name: 'IELTS Speaking & Pronunciation Workshop',
    instructorName: 'Thầy Mark Reynolds',
    status: 'active',
    stats: {
      assigned: 6,
      pending: 0,
      avgScore: 7.5
    }
  },
  {
    id: '5',
    code: 'ENG-IELTS-5.0',
    name: 'IELTS Pre-Intermediate Khóa 12',
    instructorName: 'Thầy Hoàng Minh Đức',
    status: 'completed',
    hasCertificate: true,
    stats: {
      assigned: 20,
      pending: 0,
      result: 'Tốt',
      finalScore: 7.5
    }
  },
  {
    id: '6',
    code: 'ENG-COMM-B2',
    name: 'Tiếng Anh Giao tiếp Chuyên sâu Trình độ B2',
    instructorName: 'Thầy Mark Reynolds',
    status: 'completed',
    hasCertificate: true,
    stats: {
      assigned: 15,
      pending: 0,
      result: 'Xuất sắc',
      finalScore: 8.0
    }
  }
];

const StudentClasses: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const counts = useMemo(() => ({
    all: MOCK_CLASSES.length,
    active: MOCK_CLASSES.filter(c => c.status === 'active').length,
    completed: MOCK_CLASSES.filter(c => c.status === 'completed').length,
    certificates: MOCK_CLASSES.filter(c => c.hasCertificate).length
  }), []);

  const filteredClasses = useMemo(() => {
    return MOCK_CLASSES.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'active') return matchesSearch && c.status === 'active';
      if (filter === 'completed') return matchesSearch && c.status === 'completed';
      return matchesSearch;
    });
  }, [searchTerm, filter]);

  const handleViewClass = (id: string) => {
    navigate(`/student/classes/${id}`);
  };

  const handleViewMaterials = (id: string) => {
    navigate(`/student/classes/${id}`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* 1. Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)', margin: 0 }}>
            {t('studentClasses.title')}
          </h1>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            padding: '3px 10px', 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: 'var(--primary-fixed)', 
            color: 'var(--primary)' 
          }}>
            {counts.all} {counts.all > 1 ? 'lớp học' : 'lớp'}
          </span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.5 }}>
          {t('studentClasses.subtitle')}
        </p>
      </div>

      {/* 2. Overview Metric Cards (Mobbin Dashboard Style) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '16px', 
        marginBottom: '28px' 
      }}>
        {/* Active Classes Card */}
        <div 
          onClick={() => setFilter('active')}
          style={{ 
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)', 
            padding: '20px 24px', 
            border: filter === 'active' ? '2px solid var(--secondary)' : '1px solid var(--outline-variant)',
            boxShadow: filter === 'active' 
              ? '0 10px 25px -5px rgba(5, 150, 105, 0.18)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (filter !== 'active') {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(0, 0, 0, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'active') {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.04)';
            }
          }}
        >
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {t('studentClasses.filterActive')}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>
              {counts.active}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
              Khóa học đang tham gia
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: 'var(--secondary-fixed)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--secondary)' 
          }}>
            <BookOpen size={22} strokeWidth={2.2} />
          </div>
        </div>

        {/* Completed Classes Card */}
        <div 
          onClick={() => setFilter('completed')}
          style={{ 
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)', 
            padding: '20px 24px', 
            border: filter === 'completed' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
            boxShadow: filter === 'completed' 
              ? '0 10px 25px -5px rgba(37, 99, 235, 0.18)' 
              : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (filter !== 'completed') {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(0, 0, 0, 0.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'completed') {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.04)';
            }
          }}
        >
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              {t('studentClasses.filterCompleted')}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>
              {counts.completed}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
              Đã kết thúc khóa học
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: 'var(--primary-fixed)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--primary)' 
          }}>
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
        </div>

        {/* Certificates Card */}
        <div 
          onClick={() => setFilter('completed')}
          style={{ 
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)', 
            padding: '20px 24px', 
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.04)';
          }}
        >
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Chứng chỉ hoàn thành
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>
              {counts.certificates}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
              Chứng nhận chính thức
            </div>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: 'var(--tertiary-container)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--tertiary)' 
          }}>
            <GraduationCap size={22} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="student-classes-filter-bar">
        {/* Segmented Tab Pills */}
        <div className="student-classes-segmented-tabs">
          <button 
            className={`student-classes-tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({counts.all})
          </button>
          <button 
            className={`student-classes-tab-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            {t('studentClasses.filterActive')} ({counts.active})
          </button>
          <button 
            className={`student-classes-tab-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            {t('studentClasses.filterCompleted')} ({counts.completed})
          </button>
        </div>

        {/* Instant Search Bar */}
        <div className="student-classes-search">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder={t('studentClasses.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--on-surface-variant)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div style={{ 
          backgroundColor: 'var(--surface)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '48px 24px', 
          textAlign: 'center', 
          border: '1px dashed var(--outline-variant)',
          marginTop: '24px'
        }}>
          <BookOpen size={36} color="var(--on-surface-variant)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '4px' }}>
            Không tìm thấy lớp học phù hợp
          </div>
          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
            Hãy thử thay đổi trạng thái lọc hoặc từ khóa tìm kiếm.
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setFilter('all'); }}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-fixed)',
              color: 'var(--primary)',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="student-classes-grid">
          {filteredClasses.map(classInfo => (
            <StudentClassCard 
              key={classInfo.id} 
              classInfo={classInfo} 
              onViewClass={handleViewClass}
              onViewMaterials={handleViewMaterials}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentClasses;
