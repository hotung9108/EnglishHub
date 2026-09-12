import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, Plus, Mic, BookOpen, 
  Volume2, PenTool, Clock, Calendar, Search, X
} from 'lucide-react';

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showSkillModal, setShowSkillModal] = useState(false);

  const assignments = [
    {
      id: 'HW-01',
      type: 'writing',
      typeLabel: 'Writing Task 2',
      title: 'IELTS Writing Task 2: Renewable Energy Essay',
      dueDate: '15/09/2026 (23:59)',
      dueType: 'normal'
    },
    {
      id: 'HW-02',
      type: 'speaking',
      typeLabel: 'Speaking Part 2',
      title: 'Speaking Part 2: Describe an environmental problem',
      dueDate: '14/09/2026 (23:59)',
      dueType: 'normal'
    },
    {
      id: 'HW-03',
      type: 'reading',
      typeLabel: 'Reading',
      title: 'Cambridge 18 - Reading Test 1: Full Passage',
      dueDate: '10/09/2026',
      dueType: 'normal'
    },
    {
      id: 'HW-04',
      type: 'listening',
      typeLabel: 'Listening Section 3',
      title: 'IELTS Listening Section 3: Campus Conversation',
      dueDate: '08/09/2026',
      dueType: 'normal'
    },
    {
      id: 'HW-05',
      type: 'writing',
      typeLabel: 'Writing Task 1',
      title: 'IELTS Writing Task 1: Bar Chart Analysis',
      dueDate: '20/09/2026 (08:00)',
      dueType: 'upcoming',
      autoOpen: true
    }
  ];

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'writing':
        return { bg: '#F3E8FF', color: '#9333EA', icon: <PenTool size={14} /> };
      case 'speaking':
        return { bg: '#FCE7F3', color: '#DB2777', icon: <Mic size={14} /> };
      case 'reading':
        return { bg: '#DCFCE7', color: '#16A34A', icon: <BookOpen size={14} /> };
      case 'listening':
        return { bg: '#E0F2FE', color: '#0284C7', icon: <Volume2 size={14} /> };
      default:
        return { bg: '#F3F4F6', color: '#4B5563', icon: null };
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: '0 0 8px 0', fontSize: '28px' }}>Quản lý bài tập</h1>
          <p className="body-md text-on-surface-variant" style={{ margin: 0, color: '#6B7280' }}>
            Quản Lý Bài Tập • Kiểm soát thư viện bài tập của lớp, theo dõi tiến độ nộp và phân loại theo 4 kỹ năng.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <select 
              style={{
                appearance: 'none',
                padding: '8px 36px 8px 16px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option>Lớp: ENG-IELTS-6.5A (Intensive)</option>
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          
          <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid #D1D5DB', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
            <UploadCloud size={18} /> Kho đề mẫu
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowSkillModal(true)}
            style={{ backgroundColor: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 500, cursor: 'pointer' }}
          >
            <Plus size={18} /> Tạo bài tập mới
          </button>
        </div>
      </div>

      {/* Statistics & Filters Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #eef2ff 50%, #f5f3ff 100%)', 
        borderRadius: '12px', 
        border: '1px solid #e0e7ff', 
        marginBottom: '24px', 
        overflow: 'hidden',
        boxShadow: '0 4px 20px -4px rgba(79, 70, 229, 0.05)'
      }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(224, 231, 255, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>Thư viện bài tập lớp ENG-IELTS-6.5A</h2>
              <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '12px' }}>
                Active Term
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151', fontWeight: 500 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                12 <span style={{ color: '#6B7280', fontWeight: 400 }}>Đang mở</span>
              </div>
              <div style={{ color: '#D1D5DB' }}>|</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151', fontWeight: 500 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9CA3AF' }}></span>
                3 <span style={{ color: '#6B7280', fontWeight: 400 }}>Đã khóa</span>
              </div>
              <div style={{ color: '#D1D5DB' }}>|</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 12px', borderRadius: '16px', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
                Cần chấm: 6
              </div>
            </div>
          </div>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
            Tổng hợp 15 bài tập Nghe - Nói - Đọc - Viết • Tỷ lệ hoàn thành trung bình: <span style={{ color: '#10B981', fontWeight: 600 }}>88.4%</span>
          </p>
        </div>
        
        {/* Filters */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { id: 'all', label: 'Tất cả (15)' },
              { id: 'listening', label: 'Listening (4)' },
              { id: 'speaking', label: 'Speaking (3)' },
              { id: 'reading', label: 'Reading (4)' },
              { id: 'writing', label: 'Writing (4)' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: activeFilter === filter.id ? 'none' : '1px solid #E5E7EB',
                  backgroundColor: activeFilter === filter.id ? '#2563EB' : 'white',
                  color: activeFilter === filter.id ? 'white' : '#4B5563',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
            Hiển thị 5 / 15 bài gần nhất
          </div>
        </div>
      </div>

      {/* Assignment List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {assignments.map((item, index) => {
          const badge = getBadgeStyle(item.type);
          
          return (
            <div 
              key={item.id} 
              onClick={() => navigate(`/teacher/assignments/${item.id}`)}
              style={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB', 
                borderRadius: '12px', 
                padding: '20px 24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              {/* Highlight border left for the second item (warning state) */}
              {item.dueType === 'warning' && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#F59E0B' }}></div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ 
                  backgroundColor: '#F3F4F6', 
                  color: '#4B5563', 
                  fontWeight: 600, 
                  fontSize: '14px', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  minWidth: '60px',
                  textAlign: 'center'
                }}>
                  {item.id}
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      backgroundColor: badge.bg, 
                      color: badge.color, 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: 600 
                    }}>
                      {item.type !== 'reading' && item.type !== 'writing' ? badge.icon : null}
                      {item.typeLabel}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>{item.title}</h3>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    {item.autoOpen ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB', fontWeight: 500 }}>
                        <Calendar size={14} /> Tự động mở: {item.dueDate}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280' }}>
                        <Clock size={14} color={item.dueType === 'warning' ? '#4B5563' : '#9CA3AF'} /> 
                        Hạn nộp: <span style={{ color: item.dueType === 'warning' ? '#111827' : '#6B7280' }}>{item.dueDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress Line for HW-02 */}
              {item.hasProgress && (
                <div style={{ display: 'flex', alignItems: 'center', width: '200px' }}>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', backgroundColor: '#F59E0B' }}></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '14px' }}>
        <div>
          Hiển thị <strong>1-5</strong> trên tổng số <strong>15</strong> bài tập
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#9CA3AF', cursor: 'pointer' }}>Trước</button>
          <button style={{ padding: '6px 12px', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 500, cursor: 'pointer' }}>1</button>
          <button style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#374151', cursor: 'pointer' }}>2</button>
          <button style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#374151', cursor: 'pointer' }}>3</button>
          <button style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#374151', cursor: 'pointer' }}>Sau</button>
        </div>
      </div>

      {/* Skill Selection Modal */}
      {showSkillModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSkillModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#111827' }}>Chọn kỹ năng</h2>
              <button onClick={() => setShowSkillModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div 
                onClick={() => navigate('/teacher/assignments/create?skill=listening')}
                style={{ padding: '20px', border: '1px solid #E0F2FE', borderRadius: '12px', backgroundColor: '#F0F9FF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ padding: '16px', backgroundColor: '#E0F2FE', borderRadius: '50%', color: '#0284C7' }}>
                  <Volume2 size={28} />
                </div>
                <div style={{ fontWeight: 600, color: '#0369A1', fontSize: '16px' }}>Listening</div>
              </div>
              
              <div 
                onClick={() => navigate('/teacher/assignments/create?skill=speaking')}
                style={{ padding: '20px', border: '1px solid #FCE7F3', borderRadius: '12px', backgroundColor: '#FDF2F8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ padding: '16px', backgroundColor: '#FCE7F3', borderRadius: '50%', color: '#DB2777' }}>
                  <Mic size={28} />
                </div>
                <div style={{ fontWeight: 600, color: '#BE185D', fontSize: '16px' }}>Speaking</div>
              </div>
              
              <div 
                onClick={() => navigate('/teacher/assignments/create?skill=reading')}
                style={{ padding: '20px', border: '1px solid #DCFCE7', borderRadius: '12px', backgroundColor: '#F0FDF4', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ padding: '16px', backgroundColor: '#DCFCE7', borderRadius: '50%', color: '#16A34A' }}>
                  <BookOpen size={28} />
                </div>
                <div style={{ fontWeight: 600, color: '#15803D', fontSize: '16px' }}>Reading</div>
              </div>
              
              <div 
                onClick={() => navigate('/teacher/assignments/create?skill=writing')}
                style={{ padding: '20px', border: '1px solid #F3E8FF', borderRadius: '12px', backgroundColor: '#FAF5FF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ padding: '16px', backgroundColor: '#F3E8FF', borderRadius: '50%', color: '#9333EA' }}>
                  <PenTool size={28} />
                </div>
                <div style={{ fontWeight: 600, color: '#7E22CE', fontSize: '16px' }}>Writing</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
