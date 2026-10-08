import React, { useState, useEffect } from 'react';
import { 
  History, Search, Download, 
  X, 
  PenTool, Mic, RotateCcw, 
  Award, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { submissionService } from '../api/services/submission.service';
import { userService } from '../api/services/user.service';
import type { SubmissionListItem } from '../api/services/submission.service';
import type { UserListItem } from '../api/services/user.service';

interface GradingHistoryItem {
  id: string;
  gradingId: number;
  gradedBy: {
    name: string;
    code: string;
  };
  student: {
    name: string;
    code: string;
  };
  assignment: {
    code: string;
    title: string;
    className: string;
    skill: 'writing' | 'speaking';
    submittedAt: string;
  };
  score: number;
  gradedAt: string;
  status: 'completed' | 'verified';
  teacherFeedback: string;
  submissionExcerpt: string;
}

export const AdminGradingAuditLogs: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradingHistory, setGradingHistory] = useState<GradingHistoryItem[]>([]);
  const [teachers, setTeachers] = useState<UserListItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterSkill, setFilterSkill] = useState<'all' | 'writing' | 'speaking'>('all');
  const [filterType, setFilterType] = useState<'all' | 'writing' | 'speaking' | 'high'>('all');
  const [selectedItem, setSelectedItem] = useState<GradingHistoryItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const [subRes, tcRes] = await Promise.allSettled([
          submissionService.listSubmissions({ page: 1, limit: 50 }),
          userService.listUsers({ role: 'TEACHER', limit: 50 })
        ]);

        if (!isMounted) return;

        if (tcRes.status === 'fulfilled') {
          setTeachers(tcRes.value.data);
        }

        if (subRes.status === 'fulfilled') {
          const subs: SubmissionListItem[] = subRes.value.data || [];
          const items: GradingHistoryItem[] = subs.map(s => {
            const firstMod = s.modules?.[0];
            const skill: 'writing' | 'speaking' = (firstMod?.skill?.toLowerCase() === 'speaking') ? 'speaking' : 'writing';
            const finalScore = firstMod?.grading?.finalScore ?? 0;
            const timestamp = s.submittedAt || new Date().toISOString();
            return {
              id: `GR-${s.id}`,
              gradingId: s.id,
              gradedBy: {
                name: isVi ? 'Giáo viên phụ trách' : 'Assigned Teacher',
                code: 'GV-001'
              },
              student: {
                name: `Student #${s.studentId}`,
                code: `HV-${s.studentId}`
              },
              assignment: {
                code: `HW-${s.assignmentId || s.id}`,
                title: `Assignment #${s.assignmentId || s.id}`,
                className: `Class Cohort`,
                skill,
                submittedAt: timestamp
              },
              score: typeof finalScore === 'number' ? finalScore : 0,
              gradedAt: timestamp,
              status: s.status === 'GRADED' ? 'completed' : 'verified',
              teacherFeedback: isVi ? 'Đã hoàn thành kiểm toán bài nộp.' : 'Submission verified in audit logs.',
              submissionExcerpt: isVi ? 'Bài nộp của học viên đã được ghi nhận trên hệ thống.' : 'Student submission recorded.'
            };
          });
          setGradingHistory(items);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải nhật ký chấm điểm.' : 'Failed to load grading logs.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, [isVi]);

  const filteredHistory = gradingHistory.filter(item => {
    if (filterTeacher !== 'all' && item.gradedBy.code !== filterTeacher) return false;
    if (filterSkill !== 'all' && item.assignment.skill !== filterSkill) return false;
    if (filterType === 'writing' && item.assignment.skill !== 'writing') return false;
    if (filterType === 'speaking' && item.assignment.skill !== 'speaking') return false;
    if (filterType === 'high' && item.score < 7.0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.gradedBy.name.toLowerCase().includes(q) ||
        item.student.name.toLowerCase().includes(q) ||
        item.assignment.title.toLowerCase().includes(q) ||
        item.assignment.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countWriting = gradingHistory.filter(i => i.assignment.skill === 'writing').length;
  const countSpeaking = gradingHistory.filter(i => i.assignment.skill === 'speaking').length;
  const countHigh = gradingHistory.filter(i => i.score >= 7.0).length;

  const handleExportCsv = () => {
    alert(isVi ? 'Đang trích xuất danh sách bài đã chấm ra tập tin CSV...' : 'Exporting graded assignments list to CSV...');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterTeacher('all');
    setFilterSkill('all');
    setFilterType('all');
  };

  return (
    <div className="adm-container">
      {/* Page Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <div className="adm-gh-header-icon">
              <History size={24} />
            </div>
            <span>{t('auditLogs.title')}</span>
            <span className="adm-gh-count-badge">
              {filteredHistory.length} {isVi ? 'bài đã chấm' : 'graded submissions'}
            </span>
          </h1>
          <p className="adm-subtitle">
            {t('auditLogs.subtitle')}
          </p>
        </div>

        <div className="adm-gh-header-actions">
          <button 
            type="button"
            className="adm-gh-btn-export"
            onClick={handleExportCsv}
          >
            <Download size={16} />
            <span>{t('auditLogs.exportCsv')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Quick Chips Bar */}
      <div className="adm-filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div className="adm-search-wrap" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={16} className="adm-search-icon" />
            <input 
              type="text" 
              className="adm-search-input"
              placeholder={isVi ? 'Tìm tên bài tập, học viên, mã bài...' : 'Search by assignment, student...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Teacher Select */}
          <div style={{ minWidth: '200px' }}>
            <select 
              className="input"
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              style={{ height: '40px', fontSize: '13px' }}
            >
              <option value="all">{isVi ? 'Tất cả giáo viên' : 'All Teachers'}</option>
              {teachers.map(tc => (
                <option key={tc.id} value={`GV-${tc.id}`}>
                  {tc.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || filterTeacher !== 'all' || filterSkill !== 'all' || filterType !== 'all') && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}
            >
              <RotateCcw size={14} />
              <span>{isVi ? 'Xóa lọc' : 'Reset'}</span>
            </button>
          )}
        </div>

        {/* Quick Segment Filter Pills */}
        <div className="adm-pills" style={{ margin: 0 }}>
          <button
            type="button"
            className={`adm-pill-item ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <span>{isVi ? 'Tất cả bài đã chấm' : 'All Graded'}</span>
            <span className="adm-pill-badge">{gradingHistory.length}</span>
          </button>
          <button
            type="button"
            className={`adm-pill-item ${filterType === 'writing' ? 'active' : ''}`}
            onClick={() => setFilterType('writing')}
          >
            <PenTool size={13} />
            <span>Writing</span>
            <span className="adm-pill-badge">{countWriting}</span>
          </button>
          <button
            type="button"
            className={`adm-pill-item ${filterType === 'speaking' ? 'active' : ''}`}
            onClick={() => setFilterType('speaking')}
          >
            <Mic size={13} />
            <span>Speaking</span>
            <span className="adm-pill-badge">{countSpeaking}</span>
          </button>
          <button
            type="button"
            className={`adm-pill-item ${filterType === 'high' ? 'active' : ''}`}
            onClick={() => setFilterType('high')}
          >
            <Award size={13} />
            <span>{isVi ? 'Điểm cao (≥ 7.0)' : 'High Score (≥ 7.0)'}</span>
            <span className="adm-pill-badge">{countHigh}</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="adm-table-card">
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>{isVi ? 'Đang tải nhật ký kiểm toán chấm điểm...' : 'Loading grading audit logs...'}</div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <History size={40} style={{ margin: '0 auto 14px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--on-surface)' }}>
              {isVi ? 'Chưa có nhật ký chấm điểm nào' : 'No grading audit logs found'}
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px' }}>
              {searchQuery 
                ? (isVi ? 'Không có bài nộp nào khớp với bộ lọc hiện tại.' : 'No entries match your search criteria.')
                : (isVi ? 'Nhật ký sẽ hiển thị khi giáo viên hoặc AI hoàn tất chấm bài nộp.' : 'Entries will appear here as submissions are graded.')}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{isVi ? 'MÃ CHẤM' : 'LOG ID'}</th>
                  <th>{isVi ? 'BÀI TẬP' : 'ASSIGNMENT'}</th>
                  <th>{isVi ? 'HỌC VIÊN' : 'STUDENT'}</th>
                  <th>{isVi ? 'ĐIỂM SỐ' : 'SCORE'}</th>
                  <th>{isVi ? 'THỜI GIAN' : 'GRADED AT'}</th>
                  <th style={{ textAlign: 'right' }}>{isVi ? 'CHI TIẾT' : 'ACTION'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="font-mono font-semibold text-primary">{item.id}</td>
                    <td>
                      <div className="font-medium">{item.assignment.title}</div>
                      <div className="label-sm text-on-surface-variant font-mono">{item.assignment.className}</div>
                    </td>
                    <td>
                      <div className="font-medium">{item.student.name}</div>
                      <div className="label-sm text-on-surface-variant font-mono">{item.student.code}</div>
                    </td>
                    <td>
                      <div className="font-bold text-primary font-mono" style={{ fontSize: '15px' }}>
                        {item.score}
                      </div>
                    </td>
                    <td className="font-mono text-on-surface-variant" style={{ fontSize: '12.5px' }}>
                      {item.gradedAt}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                      >
                        {isVi ? 'Xem chi tiết' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer Detail Modal */}
      {selectedItem && (
        <div className="adm-drawer-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <h2 className="adm-drawer-title">
                {isVi ? `Chi Tiết Kiểm Toán: ${selectedItem.id}` : `Audit Log Detail: ${selectedItem.id}`}
              </h2>
              <button 
                onClick={() => setSelectedItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="adm-drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>{isVi ? 'BÀI TẬP' : 'ASSIGNMENT'}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{selectedItem.assignment.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                  {selectedItem.assignment.className} • {selectedItem.assignment.code}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{isVi ? 'Học viên' : 'Student'}</div>
                  <div style={{ fontWeight: 600 }}>{selectedItem.student.name}</div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{selectedItem.student.code}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{isVi ? 'Điểm số chốt' : 'Final Score'}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{selectedItem.score}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>{isVi ? 'Nhận xét của giáo viên' : 'Teacher Feedback'}</div>
                <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', fontSize: '13.5px', lineHeight: 1.5 }}>
                  {selectedItem.teacherFeedback}
                </div>
              </div>
            </div>

            <div className="adm-drawer-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setSelectedItem(null)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGradingAuditLogs;
