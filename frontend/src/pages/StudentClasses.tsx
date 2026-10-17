import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, X, RotateCcw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import StudentClassCard from '../components/classes/StudentClassCard';
import type { StudentClassInfo } from '../components/classes/StudentClassCard';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, isSubmissionGraded, getSubmissionFinalScore } from '../api/services/submission.service';
import { Button, MetricCard, EmptyState, Skeleton, Pagination } from '../components/common';
import '../styles/student-classes.css';
import '../styles/student-ecosystem.css';

const StudentClasses: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classesList, setClassesList] = useState<StudentClassInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const handleFilterChange = (f: 'all' | 'active' | 'completed') => {
    setFilter(f);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const [reloadKey, setReloadKey] = useState(0);
  const handleReload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);

        const [classesRes, submissionsRes] = await Promise.allSettled([
          classService.list(),
          submissionService.listSubmissions({ studentId: user?.id })
        ]);

        if (!isMounted) return;

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

          if (!isMounted) return;

          const mapped: StudentClassInfo[] = rawClasses.map(c => {
            const classAssignments = assignmentsByClass.find(item => item.classId === c.id)?.assignments || [];
            const classSubmissions = submissions.filter(s => {
              return classAssignments.some(a => a.id === s.assignmentId || a.id === s.id);
            });

            const graded = classSubmissions.filter(s => isSubmissionGraded(s));
            const avgScore = graded.length > 0 
              ? parseFloat((graded.reduce((acc, curr) => acc + (getSubmissionFinalScore(curr) || 0), 0) / (graded.length * 10)).toFixed(1))
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
        if (!isMounted) return;
        console.error('Failed to load student classes', err);
        setError('Không thể tải danh sách lớp học từ máy chủ.');
        setClassesList([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchClasses();

    return () => {
      isMounted = false;
    };
  }, [user?.id, reloadKey]);

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
    }).sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [classesList, searchTerm, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedClasses = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredClasses.slice(start, start + pageSize);
  }, [filteredClasses, safeCurrentPage, pageSize]);

  const handleViewClass = (id: string) => {
    navigate(`/student/classes/${id}`);
  };

  const handleViewMaterials = (id: string) => {
    navigate(`/student/classes/${id}`);
  };

  if (loading) {
    return (
      <div className="std-eco-container pb-48">
        <Skeleton height="36px" width="240px" borderRadius="8px" className="mb-24" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height="110px" borderRadius="12px" />
          ))}
        </div>
        <div className="student-classes-grid">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height="260px" borderRadius="14px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="std-eco-container pb-48">
      {/* 1. Page Header */}
      <div className="std-eco-header">
        <div>
          <h1 className="std-eco-title">
            {t('studentClasses.title')}
          </h1>
        </div>
      </div>

      {error && (
        <div className="analytics-error-banner">
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={handleReload}>
            Thử lại
          </Button>
        </div>
      )}

      {/* 2. Overview Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          title={isVi ? 'Tất cả lớp học' : 'All Classes'}
          value={counts.all}
          onClick={() => setFilter('all')}
          className="cursor-pointer"
        />
        <MetricCard
          title={t('studentClasses.filterActive')}
          value={counts.active}
          onClick={() => setFilter('active')}
          className="cursor-pointer"
        />
        <MetricCard
          title={t('studentClasses.filterCompleted')}
          value={counts.completed}
          onClick={() => setFilter('completed')}
          className="cursor-pointer"
        />
        <MetricCard
          title={isVi ? 'Chứng chỉ hoàn thành' : 'Certificates'}
          value={counts.certificates}
          onClick={() => setFilter('completed')}
          className="cursor-pointer"
        />
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="student-classes-filter-bar">
        {/* Segmented Tab Pills */}
        <div className="student-classes-segmented-tabs">
          <button 
            className={`student-classes-tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            Tất cả ({counts.all})
          </button>
          <button 
            className={`student-classes-tab-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => handleFilterChange('active')}
          >
            {t('studentClasses.filterActive')} ({counts.active})
          </button>
          <button 
            className={`student-classes-tab-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => handleFilterChange('completed')}
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
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="student-classes-search-clear"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Classes Grid */}
      {filteredClasses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} />}
          title={classesList.length === 0 ? 'Bạn chưa tham gia lớp học nào' : 'Không tìm thấy lớp học phù hợp'}
          description={classesList.length === 0 
            ? 'Khi bạn được ghi danh vào lớp học, thông tin lớp và bài tập sẽ xuất hiện tại đây.' 
            : 'Hãy thử thay đổi trạng thái lọc hoặc từ khóa tìm kiếm.'}
          action={classesList.length > 0 ? (
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => { setSearchTerm(''); setFilter('all'); }}
            >
              Đặt lại bộ lọc
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="student-classes-grid">
            {paginatedClasses.map(classInfo => (
              <StudentClassCard 
                key={classInfo.id} 
                classInfo={classInfo} 
                onViewClass={handleViewClass}
                onViewMaterials={handleViewMaterials}
              />
            ))}
          </div>

          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredClasses.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[6, 9, 12, 18]}
            itemLabel={isVi ? 'lớp học' : 'classes'}
            isVi={isVi}
            variant="standalone"
          />
        </>
      )}
    </div>
  );
};

export default StudentClasses;
