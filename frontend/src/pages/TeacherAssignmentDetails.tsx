import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Download, Calendar, Shield, PenTool, 
  Zap, FileText, Search, Mail, Eye, Bell
} from 'lucide-react';

const TeacherAssignmentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('all');
  const [subTab, setSubTab] = useState('graded');

  const students = [
    {
      id: 'HV-8881',
      name: 'Alice Johnson',
      email: 'alice.j@gmail.com',
      initials: 'AJ',
      avatarBg: '#E0E7FF',
      avatarColor: '#4338CA',
      status: 'submitted',
      gradingStatus: 'graded'
    },
    {
      id: 'HV-8882',
      name: 'David Pham',
      email: 'david.p@outlook.com',
      initials: 'DP',
      avatarBg: '#FEF3C7',
      avatarColor: '#D97706',
      status: 'submitted',
      gradingStatus: 'pending'
    },
    {
      id: 'HV-8883',
      name: 'Lê Bảo Trâm',
      email: 'tram.lb@gmail.com',
      initials: 'BT',
      avatarBg: '#FCE7F3',
      avatarColor: '#BE185D',
      status: 'missing',
      gradingStatus: 'none'
    },
    {
      id: 'HV-8885',
      name: 'Trần Hoàng Long',
      email: 'long.th@yahoo.com',
      initials: 'HL',
      avatarBg: '#E0E7FF',
      avatarColor: '#4338CA',
      status: 'submitted',
      gradingStatus: 'graded'
    },
    {
      id: 'HV-8886',
      name: 'Nguyễn Thảo Hương',
      email: 'huong.nguyen@gmail.com',
      initials: 'TH',
      avatarBg: '#F3E8FF',
      avatarColor: '#7E22CE',
      status: 'submitted',
      gradingStatus: 'pending'
    }
  ];

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Back button */}
      <button 
        onClick={() => navigate('/teacher/assignments')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#2563EB', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '20px',
          padding: 0
        }}
      >
        <ArrowLeft size={16} /> Quay lại Thư viện bài tập
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 700, color: '#111827' }}>
            HW-01: IELTS Writing Task 2: Renewable Energy Essay
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
              Đang mở (Open)
            </span>
            <span style={{ backgroundColor: '#F3E8FF', color: '#9333EA', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>
              Writing Task 2
            </span>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>•</span>
            <span style={{ color: '#4B5563', fontSize: '14px', fontWeight: 500 }}>
              Lớp: ENG-IELTS-6.5A
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', borderRadius: '8px', 
            border: '1px solid #D1D5DB', backgroundColor: 'white', 
            color: '#374151', fontWeight: 500, cursor: 'pointer' 
          }}>
            <Edit2 size={16} /> Chỉnh sửa bài tập
          </button>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', borderRadius: '8px', 
            border: '1px solid #D1D5DB', backgroundColor: 'white', 
            color: '#374151', fontWeight: 500, cursor: 'pointer' 
          }}>
            <Download size={16} /> Xuất danh sách (Excel)
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1 */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>Thời gian & Hạn chót</h3>
            <div style={{ backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '8px', borderRadius: '8px' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ color: '#6B7280', fontSize: '14px', marginBottom: '8px' }}>
            Giao: <span style={{ color: '#374151', fontWeight: 500 }}>10/09 (08:00)</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
            15/09/2026 (23:59)
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>Tiến độ nộp bài</h3>
            <div style={{ backgroundColor: '#ECFDF5', color: '#10B981', padding: '8px', borderRadius: '8px' }}>
              <Shield size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            22<span style={{ fontSize: '16px', color: '#9CA3AF', fontWeight: 500 }}>/24</span>
          </div>
          <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: '90%', backgroundColor: '#10B981' }}></div>
            <div style={{ width: '10%', backgroundColor: '#EF4444' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#6B7280' }}>Đã nộp: <span style={{ color: '#374151', fontWeight: 500 }}>22</span></span>
            <span style={{ color: '#EF4444', fontWeight: 500 }}>Chưa nộp: 2</span>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>Tình trạng chấm điểm</h3>
            <div style={{ backgroundColor: '#FFFBEB', color: '#D97706', padding: '8px', borderRadius: '8px' }}>
              <PenTool size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
              16<span style={{ fontSize: '16px', color: '#9CA3AF', fontWeight: 500 }}>/22</span>
            </div>
            <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
              72.7% đã chấm
            </span>
          </div>
          <div style={{ color: '#D97706', fontSize: '13px', fontWeight: 600, backgroundColor: '#FEF3C7', display: 'inline-block', padding: '4px 12px', borderRadius: '12px' }}>
            6 bài chờ chấm
          </div>
        </div>

        {/* Card 4 */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>Điểm TB hiện tại</h3>
            <div style={{ backgroundColor: '#F5F3FF', color: '#8B5CF6', padding: '8px', borderRadius: '8px' }}>
              <Zap size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2563EB' }}>
              6.8
            </div>
            <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>
              / 9.0 IELTS Band
            </span>
          </div>
        </div>
      </div>

      {/* Prompt & Rubrics Box */}
      <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            <FileText size={20} color="#2563EB" /> Nội dung đề bài & Tiêu chí chấm (Prompt & Rubrics)
          </h2>
          <span style={{ border: '1px solid #E5E7EB', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', color: '#6B7280', backgroundColor: '#F9FAFB' }}>
            IELTS Academic
          </span>
        </div>
        <div style={{ color: '#374151', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
          <strong>Topic:</strong> The burning of fossil fuels has caused substantial environmental damage over the last century. Some people believe that renewable energy resources should replace fossil fuels entirely, while others argue that doing so is impractical. Discuss both views and give your opinion.<br/>
          <span style={{ color: '#2563EB' }}>(Tối thiểu 250 từ, đảm bảo 4 tiêu chí: TR, CC, LR, GRA).</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: '#6B7280', fontSize: '14px' }}>Tài liệu đính kèm:</span>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', borderRadius: '20px', 
            border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', 
            color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' 
          }}>
            <FileText size={16} color="#EF4444" /> De_bai_Writing_Task_2.pdf <span style={{ color: '#9CA3AF' }}>(1.2 MB)</span>
          </button>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', borderRadius: '20px', 
            border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', 
            color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' 
          }}>
            <FileText size={16} color="#3B82F6" /> Rubric_IELTS_Writing_Band_Descriptors.pdf <span style={{ color: '#9CA3AF' }}>(450 KB)</span>
          </button>
        </div>
      </div>

      {/* Students List */}
      <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB', display: 'flex', padding: '0 16px', gap: '24px' }}>
          {[
            { id: 'all', label: 'Tất cả học sinh', count: 24 },
            { id: 'submitted', label: 'Đã nộp bài', count: 22 },
            { id: 'missing', label: 'Chưa nộp bài', count: 2, isRed: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #111827' : '2px solid transparent',
                color: activeTab === tab.id ? '#111827' : (tab.isRed ? '#EF4444' : '#6B7280'),
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab.label} {tab.count !== undefined && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setSubTab('graded')}
              style={{ 
                padding: '6px 16px', 
                borderRadius: '20px', 
                border: subTab === 'graded' ? '1px solid #D1D5DB' : '1px solid transparent', 
                backgroundColor: subTab === 'graded' ? 'white' : 'transparent', 
                color: subTab === 'graded' ? '#374151' : '#6B7280', 
                fontSize: '13px', 
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Đã chấm (16)
            </button>
            <button 
              onClick={() => setSubTab('pending')}
              style={{ 
                padding: '6px 16px', 
                borderRadius: '20px', 
                border: subTab === 'pending' ? '1px solid #FCD34D' : '1px solid transparent', 
                backgroundColor: subTab === 'pending' ? '#FEF3C7' : 'transparent', 
                color: '#D97706', 
                fontSize: '13px', 
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Chờ chấm (6)
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Tìm theo tên hoặc mã HV..." 
                style={{ 
                  padding: '8px 16px 8px 36px', 
                  borderRadius: '8px', 
                  border: '1px solid #D1D5DB', 
                  fontSize: '14px', 
                  width: '240px',
                  outline: 'none'
                }} 
              />
              <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            </div>
            <button style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '8px 16px', borderRadius: '8px', 
              border: '1px solid #FCD34D', backgroundColor: '#FFFBEB', 
              color: '#D97706', fontSize: '14px', fontWeight: 500, cursor: 'pointer' 
            }}>
              <Bell size={16} /> Nhắc nhở nộp bài (2 bạn)
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '12px', fontWeight: 600 }}>
                <th style={{ padding: '16px', width: '40px' }}>
                  <input type="checkbox" style={{ cursor: 'pointer' }} />
                </th>
                <th style={{ padding: '16px' }}>HỌC SINH / MÃ HV</th>
                <th style={{ padding: '16px' }}>TÌNH TRẠNG NỘP BÀI</th>
                <th style={{ padding: '16px' }}>TRẠNG THÁI CHẤM ĐIỂM</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={student.id} style={{ borderBottom: idx === students.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                  <td style={{ padding: '16px' }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        backgroundColor: student.avatarBg, color: student.avatarColor, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 600, fontSize: '14px' 
                      }}>
                        {student.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{student.name}</div>
                        <div style={{ color: '#6B7280', fontSize: '13px' }}>{student.email} • {student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {student.status === 'submitted' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ECFDF5', color: '#10B981', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                        Đã nộp bài
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF2F2', color: '#EF4444', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
                        Chưa nộp bài
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {student.gradingStatus === 'graded' && (
                      <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>
                        Đã chấm
                      </span>
                    )}
                    {student.gradingStatus === 'pending' && (
                      <span style={{ border: '1px solid #FCD34D', color: '#D97706', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>
                        Chưa chấm
                      </span>
                    )}
                    {student.gradingStatus === 'none' && (
                      <span style={{ color: '#9CA3AF', fontSize: '13px' }}>— Chưa có bài —</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {student.gradingStatus === 'graded' && (
                      <button 
                        onClick={() => navigate(`/teacher/assignments/${id}/submissions/${student.id}`)}
                        style={{ 
                        border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', 
                        padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' 
                      }}>
                        Xem bài nộp
                      </button>
                    )}
                    {student.gradingStatus === 'pending' && (
                      <button 
                        onClick={() => navigate(`/teacher/assignments/${id}/submissions/${student.id}`)}
                        style={{ 
                        border: 'none', backgroundColor: '#2563EB', color: 'white', 
                        padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' 
                      }}>
                        Chấm bài ngay
                      </button>
                    )}
                    {student.gradingStatus === 'none' && (
                      <button style={{ 
                        border: '1px solid #FCD34D', backgroundColor: 'white', color: '#D97706', 
                        padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' 
                      }}>
                        Gửi nhắc nhở
                      </button>
                    )}
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

export default TeacherAssignmentDetails;
