import React, { useState } from 'react';
import { 
  History, Search, Download, 
  CheckCircle2, Clock, X, 
  PenTool, Mic, RotateCcw, 
  Award
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterSkill, setFilterSkill] = useState<'all' | 'writing' | 'speaking'>('all');
  const [filterType, setFilterType] = useState<'all' | 'writing' | 'speaking' | 'high'>('all');
  const [selectedItem, setSelectedItem] = useState<GradingHistoryItem | null>(null);

  const gradingHistory: GradingHistoryItem[] = [
    {
      id: 'GR-8812',
      gradingId: 8812,
      gradedBy: {
        name: 'Cô Trần Thị Mai Lan',
        code: 'GV-088'
      },
      student: {
        name: 'Alice Johnson',
        code: 'HV-8801'
      },
      assignment: {
        code: 'HW-01',
        title: 'Writing Task 2: Artificial Intelligence & Workforce Evolution',
        className: 'ENG-IELTS-6.5A',
        skill: 'writing',
        submittedAt: '2026-03-20 20:15:00'
      },
      score: 7.0,
      gradedAt: '2026-03-21 14:32:10',
      status: 'completed',
      teacherFeedback: isVi 
        ? 'Học sinh có ý tưởng phát triển bài viết rất tốt, lập luận chặt chẽ và sử dụng chính xác 4 cấu trúc câu phức hợp (Inversion & Cleft sentences). Bài làm hoàn thành xuất sắc yêu cầu đề bài.' 
        : 'Student demonstrated solid paragraph coherence, accurate complex syntax (inversion and cleft sentences), and comprehensive task achievement.',
      submissionExcerpt: isVi
        ? 'Trích đoạn bài viết: "In contemporary society, the rapid emergence of generative artificial intelligence has catalyzed a profound paradigm shift across global employment sectors..."'
        : 'Essay excerpt: "In contemporary society, the rapid emergence of generative artificial intelligence has catalyzed a profound paradigm shift across global employment sectors..."'
    },
    {
      id: 'GR-8815',
      gradingId: 8815,
      gradedBy: {
        name: 'Cô Trần Thị Mai Lan',
        code: 'GV-088'
      },
      student: {
        name: 'David Pham',
        code: 'HV-8802'
      },
      assignment: {
        code: 'HW-02',
        title: 'Speaking Part 2: Environmental Pollution in Urban Megacities',
        className: 'ENG-IELTS-6.5A',
        skill: 'speaking',
        submittedAt: '2026-03-20 10:30:12'
      },
      score: 5.5,
      gradedAt: '2026-03-20 18:05:44',
      status: 'completed',
      teacherFeedback: isVi 
        ? 'Phần mở đầu trôi chảy nhưng đoạn sau học viên phụ thuộc vào kịch bản đọc sẵn, làm giảm độ tự nhiên trong giao tiếp tự phát (Spontaneous Speech). Cần luyện phản xạ nói trực tiếp không nhìn tài liệu.' 
        : 'Opening was fluent but subsequent delivery relied heavily on scripted reading, decreasing spontaneous speaking naturalness.',
      submissionExcerpt: isVi
        ? 'Bản ghi âm 2 phút 15 giây: Học viên trình bày về giải pháp xử lý rác thải đô thị và giao thông công cộng, ngữ điệu còn đều đều.'
        : 'Audio recording 2m 15s: Student discussed urban waste management and public transit; intonation remained slightly monotonic.'
    },
    {
      id: 'GR-8819',
      gradingId: 8819,
      gradedBy: {
        name: 'Thầy Nguyễn Văn Nam',
        code: 'GV-042'
      },
      student: {
        name: 'Nguyễn Minh Huy',
        code: 'HV-8809'
      },
      assignment: {
        code: 'HW-05',
        title: 'Writing Task 1: Comparative Bar Chart on Carbon Emissions',
        className: 'ENG-IELTS-6.5A',
        skill: 'writing',
        submittedAt: '2026-03-18 22:45:00'
      },
      score: 7.0,
      gradedAt: '2026-03-19 11:20:15',
      status: 'completed',
      teacherFeedback: isVi 
        ? 'Bố cục tổng quan (Overview) xuất sắc, chỉ ra được xu hướng chủ đạo của biểu đồ carbon. Các đoạn thân bài phân chia logic, lựa chọn số liệu nổi bật tốt.' 
        : 'Outstanding overview paragraph identifying key macro-trends. Logical grouping of data categories with precise comparative vocabulary.',
      submissionExcerpt: isVi
        ? 'Trích đoạn bài viết: "The provided bar chart delineates a comparative analysis of annual carbon footprint metrics across five primary industrialized territories over a 20-year timeframe..."'
        : 'Essay excerpt: "The provided bar chart delineates a comparative analysis of annual carbon footprint metrics across five primary industrialized territories over a 20-year timeframe..."'
    },
    {
      id: 'GR-8824',
      gradingId: 8824,
      gradedBy: {
        name: 'Thầy David Miller',
        code: 'GV-019'
      },
      student: {
        name: 'Lê Bảo Trâm',
        code: 'HV-8803'
      },
      assignment: {
        code: 'HW-02',
        title: 'Speaking Part 2: Urban Environment & Green Living',
        className: 'ENG-TOEIC-750',
        skill: 'speaking',
        submittedAt: '2026-03-17 15:20:00'
      },
      score: 7.5,
      gradedAt: '2026-03-18 09:45:00',
      status: 'completed',
      teacherFeedback: isVi 
        ? 'Phát âm chuẩn xác, trọng âm từ và ngữ điệu tự nhiên. Vốn từ vựng chuyên đề môi trường rất đa dạng và sử dụng thành thạo.' 
        : 'Excellent phonetic stress accuracy and natural cadence. Rich environmental lexicon deployed effortlessly throughout the response.',
      submissionExcerpt: isVi
        ? 'Bản ghi âm 2 phút 40 giây: Học viên trả lời lưu loát về lối sống xanh, giải pháp năng lượng tái tạo trong các tòa nhà thông minh.'
        : 'Audio recording 2m 40s: Fluent elaboration on green lifestyles and sustainable architecture solutions.'
    },
    {
      id: 'GR-8830',
      gradingId: 8830,
      gradedBy: {
        name: 'Thầy David Miller',
        code: 'GV-019'
      },
      student: {
        name: 'Alice Johnson',
        code: 'HV-8801'
      },
      assignment: {
        code: 'HW-03',
        title: 'Writing Task 2: Remote Work & Corporate Culture Integration',
        className: 'ENG-IELTS-6.5A',
        skill: 'writing',
        submittedAt: '2026-03-15 19:40:00'
      },
      score: 8.0,
      gradedAt: '2026-03-16 16:10:20',
      status: 'completed',
      teacherFeedback: isVi 
        ? 'Bài viết mẫu mực ở band 8.0. Luận điểm sắc sảo, cấu trúc ngữ pháp phong phú và phong cách viết học thuật tự nhiên.' 
        : 'Exemplary Band 8.0 performance. Sophisticated arguments, diverse syntactic variety, and natural academic register.',
      submissionExcerpt: isVi
        ? 'Trích đoạn bài viết: "While proponents argue that telecommuting bolsters operational efficiency and work-life balance, detractors highlight potential risks to corporate cultural cohesion..."'
        : 'Essay excerpt: "While proponents argue that telecommuting bolsters operational efficiency and work-life balance, detractors highlight potential risks to corporate cultural cohesion..."'
    }
  ];

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

      {/* KPI Bento Grid: Graded Assignments Overview */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-label">{isVi ? 'TỔNG SỐ BÀI ĐÃ CHẤM' : 'TOTAL GRADED ASSIGNMENTS'}</span>
            <div className="adm-kpi-icon adm-gh-kpi-icon-blue">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="adm-gh-kpi-value-row">
            <span className="adm-kpi-value">148</span>
            <span className="adm-kpi-delta pos">+18.5%</span>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-gh-kpi-footer-text">
              {isVi ? 'Đã hoàn tất chấm điểm trên hệ thống' : 'Completed grading evaluations'}
            </span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-label">{isVi ? 'BÀI TỰ LUẬN (WRITING)' : 'WRITING ASSIGNMENTS'}</span>
            <div className="adm-kpi-icon adm-gh-kpi-icon-emerald">
              <PenTool size={20} />
            </div>
          </div>
          <div className="adm-gh-kpi-value-row">
            <span className="adm-kpi-value adm-gh-kpi-value-emerald">86</span>
            <span className="adm-kpi-delta pos">58.1%</span>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-gh-kpi-footer-text">
              {isVi ? 'Bài viết Task 1 & Task 2 đã chấm' : 'Essay submissions verified'}
            </span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-label">{isVi ? 'BÀI NÓI (SPEAKING)' : 'SPEAKING ASSIGNMENTS'}</span>
            <div className="adm-kpi-icon adm-gh-kpi-icon-violet">
              <Mic size={20} />
            </div>
          </div>
          <div className="adm-gh-kpi-value-row">
            <span className="adm-kpi-value adm-gh-kpi-value-violet">62</span>
            <span className="adm-kpi-delta neutral">41.9%</span>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-gh-kpi-footer-text">
              {isVi ? 'Ghi âm Speaking Part 2 & Part 3' : 'Audio responses evaluated'}
            </span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-label">{isVi ? 'ĐIỂM TRUNG BÌNH TOÀN TRƯỜNG' : 'COHORT AVERAGE SCORE'}</span>
            <div className="adm-kpi-icon adm-gh-kpi-icon-blue">
              <Award size={20} />
            </div>
          </div>
          <div className="adm-gh-kpi-value-row">
            <span className="adm-kpi-value">6.8</span>
            <span className="adm-kpi-delta pos">
              {isVi ? '91.2% Đạt' : '91.2% Pass'}
            </span>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-gh-kpi-footer-text">
              {isVi ? 'Tỷ lệ đạt chuẩn đầu ra đề ra' : 'Target attainment standard'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-filter-bar">
        <div className="adm-gh-filter-controls">
          <div className="adm-gh-search-container">
            <Search size={16} className="adm-gh-search-icon" />
            <input 
              type="text" 
              className="adm-gh-search-input" 
              placeholder={t('auditLogs.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select 
            className="adm-gh-select" 
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
          >
            <option value="all">{t('auditLogs.filterAllTeachers')}</option>
            <option value="GV-088">Cô Trần Thị Mai Lan (GV-088)</option>
            <option value="GV-042">Thầy Nguyễn Văn Nam (GV-042)</option>
            <option value="GV-019">Thầy David Miller (GV-019)</option>
          </select>

          <select 
            className="adm-gh-select" 
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value as 'all' | 'writing' | 'speaking')}
          >
            <option value="all">{t('auditLogs.filterAllSkills')}</option>
            <option value="writing">{t('auditLogs.filterSkillWriting')}</option>
            <option value="speaking">{t('auditLogs.filterSkillSpeaking')}</option>
          </select>
        </div>

        <div className="adm-gh-pills">
          <button
            type="button"
            className={`adm-gh-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <span>{isVi ? 'Tất cả bài chấm' : 'All Graded'}</span>
            <span className="adm-gh-pill-count">{gradingHistory.length}</span>
          </button>
          <button
            type="button"
            className={`adm-gh-pill ${filterType === 'writing' ? 'active' : ''}`}
            onClick={() => setFilterType('writing')}
          >
            <span>{isVi ? 'Bài Viết (Writing)' : 'Writing'}</span>
            <span className="adm-gh-pill-count">{countWriting}</span>
          </button>
          <button
            type="button"
            className={`adm-gh-pill ${filterType === 'speaking' ? 'active' : ''}`}
            onClick={() => setFilterType('speaking')}
          >
            <span>{isVi ? 'Bài Nói (Speaking)' : 'Speaking'}</span>
            <span className="adm-gh-pill-count">{countSpeaking}</span>
          </button>
          <button
            type="button"
            className={`adm-gh-pill ${filterType === 'high' ? 'active' : ''}`}
            onClick={() => setFilterType('high')}
          >
            <span>{isVi ? 'Điểm cao (≥ 7.0)' : 'High Score (≥ 7.0)'}</span>
            <span className="adm-gh-pill-count">{countHigh}</span>
          </button>
        </div>
      </div>

      {/* Modern Rounded Table Card */}
      <div className="adm-gh-table-card">
        <div className="adm-gh-table-header">
          <div className="adm-gh-table-title-group">
            <h3 className="adm-gh-table-title">
              {isVi ? 'Danh Sách Bài Đã Chấm Điểm' : 'Graded Assignments Registry'}
            </h3>
            <p className="adm-gh-table-subtitle">
              {isVi 
                ? `Hiển thị ${filteredHistory.length} bài tập đã chấm phù hợp với tiêu chí lọc (Click vào hàng để xem chi tiết bài chấm)` 
                : `Showing ${filteredHistory.length} evaluated submissions (Click row to inspect grading details)`}
            </p>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="adm-gh-empty">
            <div className="adm-gh-empty-icon">
              <RotateCcw size={24} />
            </div>
            <div className="adm-gh-empty-title">
              {isVi ? 'Không tìm thấy bài chấm nào' : 'No grading records found'}
            </div>
            <div className="adm-gh-empty-desc">
              {isVi 
                ? 'Không có dữ liệu phù hợp với từ khóa hoặc bộ lọc đã chọn. Vui lòng thử lại.' 
                : 'No results match your search or filter criteria. Try resetting filters.'}
            </div>
            <button 
              type="button" 
              className="adm-gh-empty-btn"
              onClick={handleResetFilters}
            >
              {isVi ? 'Xóa bộ lọc' : 'Reset filters'}
            </button>
          </div>
        ) : (
          <div className="adm-gh-table-overflow">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{t('auditLogs.colTime')}</th>
                  <th>{t('auditLogs.colTeacher')}</th>
                  <th>{t('auditLogs.colStudent')}</th>
                  <th>{t('auditLogs.colAssignment')}</th>
                  <th>{t('auditLogs.colScore')}</th>
                  <th>{t('auditLogs.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr 
                    key={item.id} 
                    className="adm-table-row-clickable"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td>
                      <div className="adm-gh-time-cell">
                        <Clock size={13} />
                        <span>{item.gradedAt}</span>
                      </div>
                    </td>
                    <td>
                      <div className="adm-gh-user-info">
                        <div className="adm-gh-user-name">{item.gradedBy.name}</div>
                        <div className="adm-gh-user-code">{item.gradedBy.code}</div>
                      </div>
                    </td>
                    <td>
                      <div className="adm-gh-student-name">{item.student.name}</div>
                      <div className="adm-gh-student-code">{item.student.code}</div>
                    </td>
                    <td>
                      <div className="adm-gh-assignment-wrap">
                        <div className="adm-gh-assignment-title" title={item.assignment.title}>
                          {item.assignment.title}
                        </div>
                        <div className="adm-gh-assignment-meta">
                          <span className="adm-gh-class-chip">{item.assignment.className}</span>
                          <span className={`adm-gh-skill-chip ${item.assignment.skill === 'writing' ? 'adm-gh-skill-chip-writing' : 'adm-gh-skill-chip-speaking'}`}>
                            {item.assignment.skill === 'writing' ? <PenTool size={10} /> : <Mic size={10} />}
                            {item.assignment.skill}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="adm-gh-score-text">
                        {item.score.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span className="adm-gh-status-text">
                        {isVi ? 'Đã chấm điểm' : 'Graded'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="adm-gh-table-footer">
          <span>
            {isVi 
              ? `Hiển thị ${filteredHistory.length} trên tổng số ${gradingHistory.length} bài chấm` 
              : `Showing ${filteredHistory.length} of ${gradingHistory.length} recorded submissions`}
          </span>
          <span className="adm-gh-count-badge">grading_records v2</span>
        </div>
      </div>

      {/* Slide-over Inspection Drawer (Chi tiết bài chấm điểm) */}
      {selectedItem && (
        <div className="adm-drawer-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <div className="adm-gh-assignment-meta">
                <span className="adm-gh-count-badge">{selectedItem.id}</span>
                <h2 className="adm-drawer-title">
                  {isVi ? 'Chi Tiết Bài Chấm Điểm' : 'Graded Assignment Details'}
                </h2>
              </div>
              <button 
                type="button" 
                className="adm-gh-drawer-close"
                onClick={() => setSelectedItem(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="adm-drawer-body">
              {/* Graded Score Highlight Card */}
              <div className="adm-gh-drawer-grade-card">
                <div>
                  <div className="adm-gh-drawer-score-label">
                    {isVi ? 'ĐIỂM SỐ ĐẠT ĐƯỢC' : 'FINAL EVALUATION SCORE'}
                  </div>
                  <div className="adm-gh-drawer-grade-val">
                    {selectedItem.score.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Execution Details Grid */}
              <div className="adm-gh-drawer-section">
                <div className="adm-gh-drawer-section-title">
                  {isVi ? 'Thông Tin Thực Hiện' : 'Grading Information'}
                </div>
                <div className="adm-gh-drawer-meta-grid">
                  <div className="adm-gh-drawer-meta-item">
                    <span className="adm-gh-drawer-meta-label">{isVi ? 'Giáo viên chấm' : 'Graded By'}</span>
                    <span className="adm-gh-drawer-meta-val">{selectedItem.gradedBy.name}</span>
                    <span className="adm-gh-user-code">{selectedItem.gradedBy.code}</span>
                  </div>
                  <div className="adm-gh-drawer-meta-item">
                    <span className="adm-gh-drawer-meta-label">{isVi ? 'Học viên nộp bài' : 'Student'}</span>
                    <span className="adm-gh-drawer-meta-val">{selectedItem.student.name}</span>
                    <span className="adm-gh-student-code">{selectedItem.student.code}</span>
                  </div>
                  <div className="adm-gh-drawer-meta-item">
                    <span className="adm-gh-drawer-meta-label">{isVi ? 'Bài tập & Lớp' : 'Assignment & Class'}</span>
                    <span className="adm-gh-drawer-meta-val">{selectedItem.assignment.code}</span>
                    <span className="adm-gh-user-code">{selectedItem.assignment.className}</span>
                  </div>
                  <div className="adm-gh-drawer-meta-item">
                    <span className="adm-gh-drawer-meta-label">{isVi ? 'Thời gian hoàn tất chấm' : 'Graded Timestamp'}</span>
                    <span className="adm-gh-drawer-meta-val">{selectedItem.gradedAt}</span>
                    <span className="adm-gh-user-code">{isVi ? `Nộp: ${selectedItem.assignment.submittedAt}` : `Submitted: ${selectedItem.assignment.submittedAt}`}</span>
                  </div>
                </div>
              </div>

              {/* Teacher Feedback / Comments (Lời phê của giáo viên) */}
              <div className="adm-gh-drawer-section">
                <div className="adm-gh-drawer-section-title">
                  {isVi ? 'Lời Phê & Nhận Xét Của Giáo Viên' : 'Teacher Comments & Feedback'}
                </div>
                <div className="adm-gh-drawer-feedback-box">
                  {selectedItem.teacherFeedback}
                </div>
              </div>

              {/* Student Submission Content Excerpt (Nội dung bài làm của học sinh) */}
              <div className="adm-gh-drawer-section">
                <div className="adm-gh-drawer-section-title">
                  {isVi ? 'Nội Dung Bài Nộp Của Học Viên' : 'Student Submission Excerpt'}
                </div>
                <div className="adm-gh-drawer-submission-preview">
                  {selectedItem.submissionExcerpt}
                </div>
              </div>
            </div>

            <div className="adm-gh-drawer-footer">
              <button 
                type="button" 
                className="adm-gh-btn-secondary"
                onClick={() => setSelectedItem(null)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
              <button 
                type="button" 
                className="adm-gh-btn-primary"
                onClick={() => {
                  alert(isVi ? `Đang mở toàn bộ bài làm và chi tiết bài thi ${selectedItem.id}...` : `Opening full submission record ${selectedItem.id}...`);
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isVi ? 'Xem toàn bộ bài làm' : 'View Full Submission'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGradingAuditLogs;
