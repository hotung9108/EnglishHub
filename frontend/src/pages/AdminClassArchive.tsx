import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Archive, ArrowLeft, Search, 
  RotateCcw, Download, 
  User, CheckCircle2, XCircle,
  GraduationCap, Calendar, Award
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ArchivedClass {
  id: string;
  code: string;
  name: string;
  teacher: string;
  enrolledStudents: number;
  avgFinalScore: number;
  passRate: number;
  completedDate: string;
  status: 'COMPLETED' | 'CANCELLED';
  reason?: string;
}

export const AdminClassArchive: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const [classes, setClasses] = useState<ArchivedClass[]>([
    {
      id: 'arch-1',
      code: 'ENG-IELTS-5.0-K11',
      name: 'IELTS Pre-Intermediate Khóa 11',
      teacher: 'Cô Trần Thị Mai Lan',
      enrolledStudents: 22,
      avgFinalScore: 7.4,
      passRate: 95.4,
      completedDate: '2026-01-15',
      status: 'COMPLETED'
    },
    {
      id: 'arch-2',
      code: 'ENG-TOEIC-650-K08',
      name: 'Luyện thi TOEIC Cấp tốc 650+ (Khóa 8)',
      teacher: 'Thầy Nguyễn Văn Nam',
      enrolledStudents: 18,
      avgFinalScore: 780,
      passRate: 88.8,
      completedDate: '2025-12-28',
      status: 'COMPLETED'
    },
    {
      id: 'arch-3',
      code: 'ENG-SPEAK-ADV-K02',
      name: 'Chuyên đề Nói & Thuyết trình Tiếng Anh Nâng cao',
      teacher: 'Thầy David Miller',
      enrolledStudents: 8,
      avgFinalScore: 0,
      passRate: 0,
      completedDate: '2025-11-05',
      status: 'CANCELLED',
      reason: isVi ? 'Không đủ sĩ số tối thiểu mở lớp (< 10 học viên)' : 'Minimum enrollment quorum not met'
    },
    {
      id: 'arch-4',
      code: 'ENG-IELTS-7.0-SUMMER',
      name: 'IELTS Master 7.5+ Khóa Hè Cấp Tốc',
      teacher: 'Cô Lê Hoàng Oanh',
      enrolledStudents: 25,
      avgFinalScore: 7.8,
      passRate: 100,
      completedDate: '2025-08-30',
      status: 'COMPLETED'
    }
  ]);

  const filtered = classes.filter(cls => {
    if (statusFilter !== 'ALL' && cls.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        cls.code.toLowerCase().includes(q) ||
        cls.name.toLowerCase().includes(q) ||
        cls.teacher.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRestore = (code: string) => {
    if (confirm(isVi ? `Xác nhận mở lại lớp ${code} về trạng thái ACTIVE?` : `Restore class ${code} to ACTIVE status?`)) {
      setClasses(prev => prev.filter(c => c.code !== code));
      alert(isVi ? `Đã khôi phục lớp ${code} thành công!` : `Class ${code} restored!`);
    }
  };

  const handleExport = (code: string) => {
    alert(isVi ? `Đang kết xuất học bạ và bảng điểm cuối khóa của lớp ${code}...` : `Exporting final academic record for ${code}...`);
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => navigate('/admin/classes')}
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>{t('classArchive.btnBack')}</span>
          </button>
          <div className="adm-title-group">
            <h1 className="adm-title">
              <Archive size={26} color="var(--primary)" />
              <span>{t('classArchive.title')}</span>
              <span className="adm-title-badge">Historical Records</span>
            </h1>
            <p className="adm-subtitle">
              {t('classArchive.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'TỔNG LỚP ĐÃ KẾT KHÓA' : 'CONCLUDED COURSES'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
              <Archive size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value">3</span>
            <span className="adm-kpi-badge positive">Graduated</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Tổng 65 học viên tốt nghiệp' : '65 alumni completed graduation'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'TỶ LỆ ĐỖ BÌNH QUÂN' : 'AVG PASS ATTAINMENT'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value" style={{ color: '#16a34a' }}>94.7%</span>
            <span className="adm-kpi-badge positive">High Retention</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Đạt cam kết hợp đồng đào tạo' : 'Met academic service SLA'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'LỚP HỦY DO THIẾU SĨ SỐ' : 'CANCELLED ENROLLMENTS'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value" style={{ color: '#dc2626' }}>1</span>
            <span className="adm-kpi-badge neutral">&lt; 10 Students</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Đã hoàn tiền hoặc chuyển lớp' : 'Refunded or migrated cohort'}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-filter-bar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} className="text-on-surface-variant" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder={t('classArchive.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div className="adm-pills" style={{ margin: 0 }}>
          {(
            [
              { key: 'ALL', label: isVi ? 'Tất cả trạng thái' : 'All Statuses' },
              { key: 'COMPLETED', label: isVi ? 'Đã hoàn thành' : 'Completed' },
              { key: 'CANCELLED', label: isVi ? 'Đã hủy bỏ' : 'Cancelled' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`adm-pill-item ${statusFilter === item.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(item.key)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Archive Table */}
      <div className="adm-table-card">
        <div className="adm-table-header">
          <div>
            <h3 className="adm-table-title">
              {isVi ? 'Danh Sách Lớp Học Đã Lưu Trữ' : 'Archived Classrooms'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              {isVi ? `Hiển thị ${filtered.length} lớp học trong kho lưu trữ` : `Showing ${filtered.length} archived classrooms`}
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>{isVi ? 'MÃ LỚP' : 'CLASS CODE'}</th>
                <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                <th>{isVi ? 'GIÁO VIÊN PHỤ TRÁCH' : 'INSTRUCTOR'}</th>
                <th>{isVi ? 'SĨ SỐ' : 'STUDENTS'}</th>
                <th>{isVi ? 'ĐIỂM TB KẾT KHÓA' : 'FINAL AVG'}</th>
                <th>{isVi ? 'TỶ LỆ ĐỖ' : 'PASS RATE'}</th>
                <th>{isVi ? 'NGÀY KẾT THÚC' : 'CONCLUDED DATE'}</th>
                <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                <th style={{ textAlign: 'right' }}>{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cls) => (
                <tr key={cls.id}>
                  <td className="font-semibold text-primary font-mono">{cls.code}</td>
                  <td className="font-medium" style={{ fontSize: '14.5px' }}>{cls.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} className="text-on-surface-variant" />
                      <span>{cls.teacher}</span>
                    </div>
                  </td>
                  <td>
                    <span className="adm-badge" style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
                      <GraduationCap size={12} style={{ marginRight: '4px' }} />
                      {cls.enrolledStudents} {isVi ? 'học viên' : 'students'}
                    </span>
                  </td>
                  <td className="font-semibold font-mono">
                    {cls.status === 'COMPLETED' ? cls.avgFinalScore : '—'}
                  </td>
                  <td>
                    {cls.status === 'COMPLETED' ? (
                      <span className="adm-badge badge-active">{cls.passRate}%</span>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="text-on-surface-variant font-mono" style={{ fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} />
                      <span>{cls.completedDate}</span>
                    </div>
                  </td>
                  <td>
                    {cls.status === 'COMPLETED' ? (
                      <span className="adm-badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> {isVi ? 'Đã hoàn thành' : 'Completed'}
                      </span>
                    ) : (
                      <span className="adm-badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} /> {isVi ? 'Đã hủy' : 'Cancelled'}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExport(cls.code)}
                        title={t('classArchive.btnExport')}
                        style={{ padding: '6px 10px' }}
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRestore(cls.code)}
                        title={t('classArchive.btnRestore')}
                        style={{ padding: '6px 10px' }}
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminClassArchive;
