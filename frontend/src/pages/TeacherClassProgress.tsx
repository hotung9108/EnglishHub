import React, { useState } from 'react';
import { 
  ChevronRight, TrendingUp, ArrowUp, Search, Filter, 
  Headphones, BookOpen, Mic, Edit3, CheckCircle2, 
  AlertCircle, ChevronLeft
} from 'lucide-react';

const TeacherClassProgress = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Navigation & Header */}
      <div style={{ marginBottom: '24px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '13px', marginBottom: '8px' }}>
          <a href="#" style={{ color: '#64748B', textDecoration: 'none' }}>Lớp học của tôi</a>
          <ChevronRight size={14} />
          <span style={{ color: '#2563EB', fontWeight: 500 }}>ENG-IELTS-6.5A</span>
          <ChevronRight size={14} />
          <span style={{ color: '#0F172A', fontWeight: 600 }}>Tiến độ học tập lớp</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.025em' }}>Tiến độ học tập & Lộ trình đào tạo</h1>
          <span style={{ padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '12px', fontWeight: 600 }}>
            IELTS Intensive Band 6.5 - 7.5
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
          Theo dõi thời gian thực dựa trên tiến độ làm bài tập và kết quả điểm số của 24 học viên.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Assignment Completion */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiến độ làm bài tập</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>88.3%</span>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={14} /> Tốt
              </span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#2563EB', height: '100%', borderRadius: '9999px', width: '88.3%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: '#64748B' }}>212 / 240 bài hoàn thành</span>
              <span style={{ color: '#2563EB', fontWeight: 500 }}>28 bài chưa nộp</span>
            </div>
          </div>
        </div>

        {/* Card 2: On-time Rate */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tỷ lệ nộp đúng hạn</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>91.5%</span>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUp size={14} /> +4.1%
              </span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#059669', height: '100%', borderRadius: '9999px', width: '91.5%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: '#64748B' }}>194 bài nộp đúng hạn</span>
              <span style={{ color: '#059669', fontWeight: 500 }}>Tích cực</span>
            </div>
          </div>
        </div>

        {/* Card 3: Average Score */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Điểm trung bình bài tập</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>6.8</span>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={14} /> +0.4
              </span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#2563EB', height: '100%', borderRadius: '9999px', width: '76%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: '#64748B' }}>Mục tiêu: 6.5 - 7.5</span>
              <span style={{ color: '#2563EB', fontWeight: 500 }}>Đạt chuẩn</span>
            </div>
          </div>
        </div>

        {/* Card 4: Target Attainment */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đạt chuẩn điểm mục tiêu</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>87.5%</span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                21 / 24 HV
              </span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#D97706', height: '100%', borderRadius: '9999px', width: '87.5%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px' }}>
              <span style={{ color: '#64748B' }}>3 học viên cần cải thiện</span>
              <span style={{ color: '#E11D48', fontWeight: 500 }}>Cần hỗ trợ</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bento Layout: Table and Insights */}
      <style>{`
        @media (min-width: 1280px) {
          .progress-grid { grid-template-columns: 2fr 1fr !important; }
        }
        .filter-btn {
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .filter-btn.active {
          background-color: #F1F5F9;
          color: #2563EB;
          font-weight: 600;
        }
        .filter-btn:not(.active) {
          background-color: transparent;
          color: #64748B;
        }
        .filter-btn:not(.active):hover {
          background-color: #F8FAFC;
          color: #334155;
        }
      `}</style>
      <div className="progress-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Left Column: Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px 0' }}>Theo dõi tiến độ chi tiết từng học viên</h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Cập nhật tự động dựa trên 10 bài tập rèn luyện và điểm kiểm tra định kỳ.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Tìm tên, mã học viên..." 
                  style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', width: '200px' }} 
                />
              </div>
              <button style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Filter size={16} color="#64748B" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9', marginBottom: '8px' }}>
            <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>Tất cả (24)</button>
            <button className={`filter-btn ${activeFilter === 'ontime' ? 'active' : ''}`} onClick={() => setActiveFilter('ontime')}>Đúng tiến độ (18)</button>
            <button className={`filter-btn ${activeFilter === 'support' ? 'active' : ''}`} onClick={() => setActiveFilter('support')} style={{ color: activeFilter === 'support' ? '#E11D48' : undefined }}>Cần hỗ trợ (3)</button>
            <button className={`filter-btn ${activeFilter === 'exceed' ? 'active' : ''}`} onClick={() => setActiveFilter('exceed')}>Vượt mục tiêu (3)</button>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>Học viên & Mục tiêu</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tiến độ bài tập</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Điểm TB</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody style={{ color: '#334155' }}>
                
                {/* Student 1 */}
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                        AJ
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>Alice Johnson</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>HV-2024-0891</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ width: '140px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500 }}>10 / 10 bài</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>100%</span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '6px' }}>
                        <div style={{ backgroundColor: '#059669', height: '100%', borderRadius: '9999px', width: '100%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>8.2</div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>+0.7 so Target</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span> Vượt mục tiêu
                    </span>
                  </td>
                </tr>

                {/* Student 2 */}
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                        DP
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: '#0F172A', marginBottom: '2px' }}>David Phạm</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>HV-2024-0712</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ width: '140px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500 }}>9 / 10 bài</span>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>90%</span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '6px' }}>
                        <div style={{ backgroundColor: '#2563EB', height: '100%', borderRadius: '9999px', width: '90%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>6.7</div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>Đạt chuẩn</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span> Đúng tiến độ
                    </span>
                  </td>
                </tr>

                {/* Student 3 */}
                <tr style={{ backgroundColor: 'rgba(254, 226, 226, 0.4)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FECDD3', color: '#BE123C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                        TL
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>Trần Hoàng Long</div>
                        <div style={{ fontSize: '12px', color: '#E11D48', fontWeight: 500 }}>HV-2024-0419</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ width: '140px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: '#E11D48', fontWeight: 600 }}>6 / 10 bài</span>
                        <span style={{ color: '#E11D48', fontWeight: 600 }}>Thiếu 4 bài</span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '6px' }}>
                        <div style={{ backgroundColor: '#E11D48', height: '100%', borderRadius: '9999px', width: '60%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#E11D48', fontSize: '14px' }}>5.3</div>
                    <div style={{ fontSize: '11px', color: '#E11D48', fontWeight: 500 }}>-1.2 so Target</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#FFE4E6', color: '#BE123C', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#E11D48' }}></span> Cần hỗ trợ
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', fontSize: '13px', color: '#64748B' }}>
            <span>Hiển thị <strong>1 - 3</strong> trên tổng số <strong>24</strong> học viên</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'none', color: '#94A3B8', cursor: 'not-allowed' }}><ChevronLeft size={16} /></button>
              <button style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#DBEAFE', color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}>1</button>
              <button style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'none', color: '#475569', cursor: 'pointer' }}>2</button>
              <button style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'none', color: '#475569', cursor: 'pointer' }}>3</button>
              <button style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'none', color: '#475569', cursor: 'pointer' }}><ChevronRight size={16} /></button>
            </div>
          </div>

        </div>

        {/* Right Column: Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Skills Breakdown */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Tiến độ theo 4 Kỹ năng</h3>
              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Độ thuần thục</span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', marginTop: 0 }}>Mức độ đạt chuẩn trung bình của lớp theo yêu cầu đầu ra Band 6.5 - 7.5.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}><Headphones size={16} color="#2563EB" /> Listening</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>85%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '8px' }}>
                  <div style={{ backgroundColor: '#2563EB', height: '100%', borderRadius: '9999px', width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}><BookOpen size={16} color="#2563EB" /> Reading</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>82%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '8px' }}>
                  <div style={{ backgroundColor: '#2563EB', height: '100%', borderRadius: '9999px', width: '82%' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}><Mic size={16} color="#059669" /> Speaking</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>74%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '8px' }}>
                  <div style={{ backgroundColor: '#059669', height: '100%', borderRadius: '9999px', width: '74%' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}><Edit3 size={16} color="#D97706" /> Writing</span>
                  <span style={{ color: '#D97706', fontWeight: 600 }}>68%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '9999px', height: '8px' }}>
                  <div style={{ backgroundColor: '#D97706', height: '100%', borderRadius: '9999px', width: '68%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Alert Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Thống kê nộp bài</h3>
              <TrendingUp size={20} color="#2563EB" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>Hoàn thành đủ 10/10 bài</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>16 HV</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#E2E8F0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={16} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>Còn thiếu 1 - 2 bài</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>5 HV</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(254, 226, 226, 0.4)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FFE4E6', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={16} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#E11D48' }}>Thiếu từ 3 bài trở lên</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#E11D48' }}>3 HV</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', fontSize: '13px' }}>
              <span style={{ color: '#64748B' }}>Điểm bài kiểm tra cao nhất:</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#2563EB' }}>8.5</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TeacherClassProgress;
