import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, CheckCircle2, GraduationCap, X, RotateCcw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import StudentClassCard from '../components/classes/StudentClassCard';
import type { StudentClassInfo } from '../components/classes/StudentClassCard';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';

const StudentClasses: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classesList, setClassesList] = useState<StudentClassInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesRes, submissionsRes] = await Promise.allSettled([
        classService.list(),
        submissionService.listSubmissions({ studentId: user?.id })
      ]);

      const rawClasses: ClassSummary[] = classesRes.status === 'fulfilled'
        ? (classesRes.value?.data || (Array.isArray(classesRes.value) ? classesRes.value : []))
        : [];
      const submissions: SubmissionListItem[] = submissionsRes.status === 'fulfilled'
        ? (submissionsRes.value?.data || (Array.isArray(submissionsRes.value) ? submissionsRes.value : []))
        : [];

      if (rawClasses.length > 0) {
        // Fetch assignments for each class
        const assignmentsByClass = await Promise.all(
          rawClasses.map(async (c) => {
            try {
              const res = await assignmentService.listAssignments(c.id);
              return { classId: c.id, assignments: res.data || [] };
            } catch {
              return { classId: c.id, assignments: [] as AssignmentSummary[] };
            }
          })
        );

        const mapped: StudentClassInfo[] = rawClasses.map(c => {
          const classAssignments = assignmentsByClass.find(item => item.classId === c.id)?.assignments || [];
          const classSubmissions = submissions.filter(s => {
            return classAssignments.some(a => a.id === s.assignmentId || a.id === s.id);
          });

          const graded = classSubmissions.filter(s => s.status === 'GRADED');
          const avgScore = graded.length > 0 
            ? parseFloat((graded.reduce((acc, curr) => acc + (curr.modules?.[0]?.grading?.finalScore || 0), 0) / (graded.length * 10)).toFixed(1))
            : undefined;

          const isCompleted = c.status === 'COMPLETED';

          return {
            id: String(c.id),
            code: c.name.includes('-') ? c.name.split(' ')[0] : `ENG-CLS-${c.id}`,
            name: c.name,
            instructorName: 'Giáo viên phụ trách',
            status: isCompleted ? 'completed' : 'active',
            hasCertificate: isCompleted,
            stats: {
              assigned: classAssignments.length,
              pending: Math.max(0, classAssignments.length - classSubmissions.length),
              avgScore: avgScore ?? 0,
              result: isCompleted ? 'Đạt' : undefined,
              finalScore: isCompleted ? avgScore : undefined
            }
          };
        });

        setClassesList(mapped);
      } else {
        setClassesList([]);
      }
    } catch (err) {
      console.error('Failed to load student classes', err);
      setError('Không thể tải danh sách lớp học từ máy chủ.');
      setClassesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [user?.id]);

  const counts = useMemo(() => ({
    all: classesList.length,
    active: classesList.filter(c => c.status === 'active').length,
    completed: classesList.filter(c => c.status === 'completed').length,
    certificates: classesList.filter(c => c.hasCertificate).length
  }), [classesList]);

  const filteredClasses = useMemo(() => {
    return classesList.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'active') return matchesSearch && c.status === 'active';
      if (filter === 'completed') return matchesSearch && c.status === 'completed';
      return matchesSearch;
    });
  }, [classesList, searchTerm, filter]);

  const handleViewClass = (id: string) => {
    navigate(`/student/classes/${id}`);
  };

  const handleViewMaterials = (id: string) => {
    navigate(`/student/classes/${id}`);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 0 48px' }}>
        <div className="skeleton mb-24" style={{ height: '36px', width: '240px', borderRadius: '8px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '12px' }}></div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '260px', borderRadius: '14px' }}></div>
          ))}
        </div>
      </div>
    );
  }

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

      {error && (
        <div className="p-16 mb-24 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchClasses} className="btn btn-sm btn-secondary flex items-center gap-6">
            <RotateCcw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 2. Overview Metric Cards */}
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
            {classesList.length === 0 ? 'Bạn chưa tham gia lớp học nào' : 'Không tìm thấy lớp học phù hợp'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
            {classesList.length === 0 
              ? 'Khi bạn được ghi danh vào lớp học, thông tin lớp và bài tập sẽ xuất hiện tại đây.' 
              : 'Hãy thử thay đổi trạng thái lọc hoặc từ khóa tìm kiếm.'}
          </div>
          {classesList.length > 0 && (
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
          )}
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
