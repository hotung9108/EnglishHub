import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Sparkles, 
  Headphones, 
  PenTool, 
  Mic, 
  TrendingUp,
  Award
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="std-dashboard-container">
      {/* Greeting Hero Banner */}
      <section className="std-dash-hero">
        <div className="std-dash-hero-content">
          <div>
            <h1 className="std-dash-greeting">Chào mừng trở lại, Alice Johnson! 👋</h1>
            <p className="std-dash-subgreeting">
              Hôm nay là một ngày tuyệt vời để nâng cao kỹ năng Tiếng Anh. Bạn có <strong>2 bài tập</strong> sắp đến hạn cần hoàn thành trong 48 giờ tới.
            </p>
          </div>

          <div className="std-dash-target-pill">
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8 }}>Mục tiêu chứng chỉ</div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>IELTS Academic</div>
            </div>
            <div style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
            <div>
              <div className="std-dash-target-val">7.5</div>
              <div style={{ fontSize: '10px', opacity: 0.8, textAlign: 'center' }}>Target Band</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Metrics Grid */}
      <section className="std-dash-stats-grid">
        <div className="std-dash-stat-card">
          <div className="std-dash-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="std-dash-stat-num">14 / 16</div>
            <div className="std-dash-stat-label">Bài tập đã hoàn thành</div>
          </div>
        </div>

        <div className="std-dash-stat-card">
          <div className="std-dash-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="std-dash-stat-num">Band 7.2</div>
            <div className="std-dash-stat-label">Điểm TB 4 Kỹ năng</div>
          </div>
        </div>

        <div className="std-dash-stat-card">
          <div className="std-dash-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="std-dash-stat-num">2 bài</div>
            <div className="std-dash-stat-label">Đang chờ chấm điểm</div>
          </div>
        </div>

        <div className="std-dash-stat-card">
          <div className="std-dash-stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <Flame size={24} />
          </div>
          <div>
            <div className="std-dash-stat-num">7 Ngày 🔥</div>
            <div className="std-dash-stat-label">Chuỗi học tập liên tục</div>
          </div>
        </div>
      </section>

      {/* Main Two Column Layout */}
      <div className="std-dash-main-grid">
        
        {/* Left Column: Upcoming Deadlines & My Classes */}
        <div>
          
          {/* Upcoming Deadlines */}
          <div className="std-dash-card">
            <div className="std-dash-card-header">
              <h2 className="std-dash-card-title">
                <Clock size={18} color="var(--primary)" />
                Bài Tập Sắp Đến Hạn (Deadlines)
              </h2>
              <button 
                type="button"
                className="speaking-btn-link"
                onClick={() => navigate('/student/assignments')}
              >
                Xem tất cả bài tập →
              </button>
            </div>

            <div className="std-dash-card-body" style={{ padding: '16px' }}>
              {/* Item 1 */}
              <div className="std-deadline-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PenTool size={18} />
                  </div>
                  <div>
                    <h3 className="std-deadline-title">HW-01: Renewable Energy Essay (Writing Task 2)</h3>
                    <div className="std-deadline-meta">
                      <span>ENG-IELTS-6.5A</span>
                      <span>•</span>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>Hạn nộp: 23:59 - Hôm nay</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => navigate('/student/assignments/HW-01/overview')}
                >
                  Làm bài
                </button>
              </div>

              {/* Item 2 */}
              <div className="std-deadline-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={18} />
                  </div>
                  <div>
                    <h3 className="std-deadline-title">HW-05: Environment Problem Discussion (Speaking)</h3>
                    <div className="std-deadline-meta">
                      <span>ENG-GRAM-ADV</span>
                      <span>•</span>
                      <span style={{ color: '#d97706', fontWeight: 600 }}>Hạn nộp: 08/09/2026 (Còn 2 ngày)</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => navigate('/student/assignments/speaking/HW-05')}
                >
                  Thu âm
                </button>
              </div>
            </div>
          </div>

          {/* My Classes Snapshot */}
          <div className="std-dash-card">
            <div className="std-dash-card-header">
              <h2 className="std-dash-card-title">
                <BookOpen size={18} color="var(--primary)" />
                Lớp Học Đang Diễn Ra
              </h2>
              <button 
                type="button"
                className="speaking-btn-link"
                onClick={() => navigate('/student/classes')}
              >
                Tất cả lớp học →
              </button>
            </div>

            <div className="std-dash-card-body" style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div 
                  onClick={() => navigate('/student/classes/1')}
                  style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>ENG-IELTS-6.5A</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: 6 }}>IELTS Intensive Band 6.5 - 7.5</div>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>GV: ThS. Trần Thị Mai Lan</div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                    <span>15 bài tập</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Điểm TB: 7.2</span>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/student/classes/2')}
                  style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>ENG-GRAM-ADV</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: 6 }}>Chuyên đề Ngữ pháp &amp; Viết nâng cao</div>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>GV: Thầy Hoàng Minh Đức</div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                    <span>8 bài tập</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Điểm TB: 8.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: 4-Skill Progress & AI Recommendations */}
        <div>
          
          {/* 4-Skill Proficiency Bars */}
          <div className="std-dash-card">
            <div className="std-dash-card-header">
              <h2 className="std-dash-card-title">
                <TrendingUp size={18} color="var(--primary)" />
                Năng Lực 4 Kỹ Năng
              </h2>
            </div>

            <div className="std-dash-card-body">
              <div className="skill-bar-row">
                <div className="skill-bar-info">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Headphones size={15} color="#3b82f6" /> Listening
                  </span>
                  <span>Band 7.5</span>
                </div>
                <div className="skill-bar-track">
                  <div className="skill-bar-fill listening" style={{ width: '83%' }}></div>
                </div>
              </div>

              <div className="skill-bar-row">
                <div className="skill-bar-info">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={15} color="#10b981" /> Reading
                  </span>
                  <span>Band 7.0</span>
                </div>
                <div className="skill-bar-track">
                  <div className="skill-bar-fill reading" style={{ width: '77%' }}></div>
                </div>
              </div>

              <div className="skill-bar-row">
                <div className="skill-bar-info">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PenTool size={15} color="#f59e0b" /> Writing
                  </span>
                  <span>Band 6.5</span>
                </div>
                <div className="skill-bar-track">
                  <div className="skill-bar-fill writing" style={{ width: '72%' }}></div>
                </div>
              </div>

              <div className="skill-bar-row">
                <div className="skill-bar-info">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mic size={15} color="#8b5cf6" /> Speaking
                  </span>
                  <span>Band 7.0</span>
                </div>
                <div className="skill-bar-track">
                  <div className="skill-bar-fill speaking" style={{ width: '77%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Daily Recommendation */}
          <div className="std-dash-card">
            <div className="std-dash-card-header">
              <h2 className="std-dash-card-title">
                <Sparkles size={18} color="#16a34a" />
                AI Đề Xuất Bổ Trợ Hôm Nay
              </h2>
            </div>

            <div className="std-dash-card-body" style={{ padding: '16px' }}>
              <div className="ai-recommend-box">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: 2 }}>
                    Khắc phục lỗi phát âm âm đuôi /s/ &amp; /z/
                  </div>
                  <div style={{ fontSize: '11px', color: '#15803d', lineHeight: 1.4 }}>
                    Dựa trên phân tích âm phổ của bài Speaking gần nhất, AI phát hiện bạn thường nuốt âm cuối ở số nhiều.
                  </div>
                  <button 
                    type="button"
                    style={{ marginTop: 8, padding: '4px 10px', fontSize: '11px', fontWeight: 700, backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => navigate('/student/assignments/speaking/HW-02')}
                  >
                    Luyện tập ngay (5 phút)
                  </button>
                </div>
              </div>

              <div className="ai-recommend-box" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderColor: '#bfdbfe' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: 2 }}>
                    Cấu trúc câu phức &amp; Mạo từ Writing
                  </div>
                  <div style={{ fontSize: '11px', color: '#1d4ed8', lineHeight: 1.4 }}>
                    Ôn lại 3 mẫu câu phức ghép mệnh đề quan hệ để đẩy band Grammatical Range từ 6.5 lên 7.5.
                  </div>
                  <button 
                    type="button"
                    style={{ marginTop: 8, padding: '4px 10px', fontSize: '11px', fontWeight: 700, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => navigate('/student/assignments/HW-01/overview')}
                  >
                    Làm bài test mẫu
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
