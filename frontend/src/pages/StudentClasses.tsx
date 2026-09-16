import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
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

  const filteredClasses = MOCK_CLASSES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'active') return matchesSearch && c.status === 'active';
    if (filter === 'completed') return matchesSearch && c.status === 'completed';
    return matchesSearch;
  });

  const handleViewClass = (id: string) => {
    navigate(`/student/classes/${id}`);
  };

  const handleViewMaterials = (id: string) => {
    console.log('View materials', id);
  };

  return (
    <div className="container" style={{ padding: '24px' }}>
      <div>
        <h1 className="headline-lg">{t('studentClasses.title')}</h1>
        <p className="text-on-surface-variant" style={{ marginTop: '8px' }}>
          {t('studentClasses.subtitle')}
        </p>
      </div>

      <div className="student-classes-filter-bar">
        <div className="student-classes-search">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            className="input" 
            placeholder={t('studentClasses.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="student-classes-dropdown">
          <select 
            className="input" 
            style={{ appearance: 'none', background: 'transparent' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'completed')}
          >
            <option value="all">Tất cả ({MOCK_CLASSES.length})</option>
            <option value="active">{t('studentClasses.filterActive')} ({MOCK_CLASSES.filter(c => c.status === 'active').length})</option>
            <option value="completed">{t('studentClasses.filterCompleted')} ({MOCK_CLASSES.filter(c => c.status === 'completed').length})</option>
          </select>
          <ChevronDown size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--on-surface-variant)' }} />
        </div>
      </div>

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
    </div>
  );
};

export default StudentClasses;
