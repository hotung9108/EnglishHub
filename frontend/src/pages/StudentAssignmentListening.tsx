import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, Search, Bell, Headphones, 
  Timer, Pause, Save, Send, Bookmark, ChevronLeft,
  Play, Volume2, SkipBack, SkipForward
} from 'lucide-react';

const StudentAssignmentListening: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // The id can be used to fetch assignment details. Console log to avoid unused variable warning.
  console.log('Assignment ID:', id);
  
  // Mock State
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<number, boolean>>({});

  const totalQuestions = 10;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectAnswer = (qId: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const toggleBookmark = (qId: number) => {
    setBookmarkedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div style={{ 
      margin: 'calc(var(--margin-desktop, 40px) * -1)',
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#F8FAFC'
    }}>
      
      {/* Page Header (replaces standard header) */}
      <div style={{ padding: '16px 24px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#475569', fontWeight: 500, cursor: 'pointer' }}>
            <ArrowLeft size={16} /> Quay lại danh sách bài tập
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' }}>
            <span>Hệ thống</span> <ChevronRight size={14} />
            <span>Lớp học của tôi</span> <ChevronRight size={14} />
            <span>ENG-IELTS-6.5A</span> <ChevronRight size={14} />
            <span style={{ color: '#2563EB', fontWeight: 500 }}>Reading 01</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Tìm kiếm tài liệu..." style={{ padding: '8px 16px 8px 36px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '14px', width: '240px', outline: 'none' }} />
          </div>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={20} color="#64748B" />
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%' }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#4F46E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>AJ</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Alice Johnson</span>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Học viên IELTS 6.5A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Header - Title only (scrolls away) */}
      <div style={{ padding: '24px 24px 16px 24px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ padding: '4px 12px', backgroundColor: '#3B82F6', color: 'white', fontSize: '13px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>Listening 01</span>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1E293B', textTransform: 'uppercase' }}>CAMBRIDGE IELTS 15 - TEST 1</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Headphones size={16} /> IELTS Academic Listening Part 1</span>
            <span style={{ width: '4px', height: '4px', backgroundColor: '#CBD5E1', borderRadius: '50%' }}></span>
            <span>Tổng số: <strong style={{ color: '#1E293B' }}>10 câu</strong></span>
            <span style={{ width: '4px', height: '4px', backgroundColor: '#CBD5E1', borderRadius: '50%' }}></span>
            <span>Mã đề: LS-CAM15-01</span>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div style={{ position: 'sticky', top: '64px', zIndex: 50, padding: '10px 24px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', color: '#D97706' }}>
            <Timer size={16} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700 }}>TIME LEFT</span>
              <span style={{ fontSize: '16px', fontWeight: 800, lineHeight: '1' }}>58:24</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 600, borderRadius: '6px' }}>
            <Pause size={14} /> Tạm dừng
          </button>
          <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 600, borderRadius: '6px' }}>
            <Save size={14} /> Lưu nháp
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: '#3B82F6', border: 'none', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '13px', fontWeight: 600, borderRadius: '6px' }}>
            <Send size={14} /> Nộp bài thi
          </button>
        </div>
      </div>

      {/* Split View Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', flex: 1 }}>
        
        {/* Left Column: Audio & Context */}
        <div style={{ borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          
          {/* Custom Audio Player UI */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)' }}>
                  <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Audio Track 01</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Part 1: Bank Account Opening</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <SkipBack size={18} cursor="pointer" />
                  <SkipForward size={18} cursor="pointer" />
                </div>
                <div style={{ width: '1px', height: '24px', backgroundColor: '#CBD5E1' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <Volume2 size={18} />
                  <div style={{ width: '80px', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '60%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '2px' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Audio Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>02:14</span>
              <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', position: 'relative', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '35%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '3px' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '35%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', backgroundColor: '#3B82F6', borderRadius: '50%', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>06:45</span>
            </div>
          </div>

          <div style={{ padding: '32px 48px', flex: 1 }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ padding: '24px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#B45309', fontWeight: 700 }}>Instructions:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400E', fontSize: '15px', lineHeight: '1.6' }}>
                  <li>You will hear a conversation between a bank clerk and a customer.</li>
                  <li>Write <strong>NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> for each answer.</li>
                  <li>Listen carefully, the recording will be played <strong>ONLY ONCE</strong>.</li>
                </ul>
              </div>

              {/* Visual Context (Diagram / Note completion preview) */}
              <div style={{ padding: '32px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '24px', textTransform: 'uppercase' }}>Bank Account Application</h2>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px dashed #CBD5E1' }}>
                      <td style={{ padding: '16px 0', fontWeight: 600, color: '#475569', width: '40%' }}>Account Type:</td>
                      <td style={{ padding: '16px 0', color: '#1E293B' }}>Select <span style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', fontWeight: 'bold' }}>1</span> account</td>
                    </tr>
                    <tr style={{ borderBottom: '1px dashed #CBD5E1' }}>
                      <td style={{ padding: '16px 0', fontWeight: 600, color: '#475569' }}>First Name:</td>
                      <td style={{ padding: '16px 0', color: '#1E293B' }}>Pieter</td>
                    </tr>
                    <tr style={{ borderBottom: '1px dashed #CBD5E1' }}>
                      <td style={{ padding: '16px 0', fontWeight: 600, color: '#475569' }}>Surname:</td>
                      <td style={{ padding: '16px 0', color: '#1E293B' }}><span style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', fontWeight: 'bold' }}>2</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px dashed #CBD5E1' }}>
                      <td style={{ padding: '16px 0', fontWeight: 600, color: '#475569' }}>Date of Birth:</td>
                      <td style={{ padding: '16px 0', color: '#1E293B' }}>27th <span style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', fontWeight: 'bold' }}>3</span> 1991</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '16px 0', fontWeight: 600, color: '#475569' }}>Current Address:</td>
                      <td style={{ padding: '16px 0', color: '#1E293B' }}>14 <span style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', fontWeight: 'bold' }}>4</span> Street, Exeter</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Questions (Sticky) */}
        <div style={{ position: 'sticky', top: '128px', height: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
          
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>Danh sách câu hỏi (Questions 1 - 10)</h2>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Chọn một đáp án đúng nhất cho mỗi câu hỏi</span>
              </div>
              <div style={{ padding: '6px 16px', backgroundColor: '#EFF6FF', borderRadius: '20px', color: '#2563EB', fontSize: '14px', fontWeight: 600 }}>
                {answeredCount} / {totalQuestions} đã làm
              </div>
            </div>

            {/* Question Navigator */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Array.from({ length: 10 }).map((_, i) => {
                const qId = i + 1;
                const isAnswered = !!selectedAnswers[qId];
                const isBookmarked = bookmarkedQuestions[qId];
                const isActive = activeQuestion === qId;
                
                let bgColor = '#F1F5F9';
                let textColor = '#475569';

                if (isActive) {
                  bgColor = '#2563EB';
                  textColor = 'white';
                } else if (isBookmarked) {
                  bgColor = '#FEF08A';
                  textColor = '#A16207';
                } else if (isAnswered) {
                  bgColor = '#DBEAFE';
                  textColor = '#1D4ED8';
                }

                return (
                  <button 
                    key={qId}
                    onClick={() => setActiveQuestion(qId)}
                    style={{ 
                      width: '40px', height: '40px', borderRadius: '6px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', fontWeight: 600, cursor: 'pointer', border: 'none',
                      backgroundColor: bgColor, color: textColor,
                      transition: 'all 0.2s'
                    }}
                  >
                    {qId}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            
            {/* Question Card 1 */}
            <div className="card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '13px', fontWeight: 700, borderRadius: '4px' }}>Question 1</span>
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>(Paragraph A)</span>
                </div>
                <button 
                  onClick={() => toggleBookmark(1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: bookmarkedQuestions[1] ? '#D97706' : '#94A3B8', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  <Bookmark size={14} fill={bookmarkedQuestions[1] ? '#D97706' : 'none'} /> Đánh dấu
                </button>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', lineHeight: '1.6', marginBottom: '20px' }}>
                According to paragraph A, what role did the Letraset sheets play in the 1960s?
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'A', text: 'This is an example of the first popularized typographic specimen' },
                  { id: 'B', text: 'Some classical Latin texts discovered in Virginia library' },
                  { id: 'C', text: 'Examples of the answers derived from modern translations' },
                  { id: 'D', text: 'Of the answers provided solely by Aldus PageMaker' }
                ].map(opt => {
                  const isSelected = selectedAnswers[1] === opt.id;
                  return (
                    <label 
                      key={opt.id}
                      style={{ 
                        display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', 
                        border: `1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`, 
                        borderRadius: '8px', cursor: 'pointer',
                        backgroundColor: isSelected ? '#EFF6FF' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ 
                        width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${isSelected ? '#3B82F6' : '#CBD5E1'}`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', backgroundColor: 'white'
                      }}>
                        {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>}
                      </div>
                      <input 
                        type="radio" 
                        name="q1" 
                        value={opt.id} 
                        checked={isSelected}
                        onChange={() => handleSelectAnswer(1, opt.id)}
                        style={{ display: 'none' }}
                      />
                      <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.5' }}>
                        <strong style={{ color: '#1E293B' }}>{opt.id}.</strong> {opt.text}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Question Card 2 */}
            <div className="card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '13px', fontWeight: 700, borderRadius: '4px' }}>Question 2</span>
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>(Paragraph B)</span>
                </div>
                <button 
                  onClick={() => toggleBookmark(2)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: bookmarkedQuestions[2] ? '#D97706' : '#94A3B8', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                >
                  <Bookmark size={14} fill={bookmarkedQuestions[2] ? '#D97706' : 'none'} /> Đánh dấu
                </button>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', lineHeight: '1.6', marginBottom: '20px' }}>
                Why do desktop publishing packages and layout designers actively utilize Lorem Ipsum?
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'A', text: 'This is used to maintain a realistic distribution of letters without distraction' },
                  { id: 'B', text: 'It contains readable English translations from Cicero' },
                ].map(opt => {
                  const isSelected = selectedAnswers[2] === opt.id;
                  return (
                    <label 
                      key={opt.id}
                      style={{ 
                        display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', 
                        border: `1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`, 
                        borderRadius: '8px', cursor: 'pointer',
                        backgroundColor: isSelected ? '#EFF6FF' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ 
                        width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${isSelected ? '#3B82F6' : '#CBD5E1'}`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', backgroundColor: 'white'
                      }}>
                        {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>}
                      </div>
                      <input 
                        type="radio" 
                        name="q2" 
                        value={opt.id} 
                        checked={isSelected}
                        onChange={() => handleSelectAnswer(2, opt.id)}
                        style={{ display: 'none' }}
                      />
                      <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.5' }}>
                        <strong style={{ color: '#1E293B' }}>{opt.id}.</strong> {opt.text}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column Footer (Sticky) */}
          <div style={{ padding: '16px 24px', backgroundColor: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setActiveQuestion(Math.max(1, activeQuestion - 1))}
                style={{ padding: '10px 16px', border: '1px solid #E2E8F0', backgroundColor: 'white', borderRadius: '8px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <ChevronLeft size={18} /> Câu trước
              </button>
              <button 
                onClick={() => setActiveQuestion(Math.min(10, activeQuestion + 1))}
                style={{ padding: '10px 16px', border: '1px solid #E2E8F0', backgroundColor: 'white', borderRadius: '8px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                Câu tiếp theo <ChevronRight size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button style={{ padding: '10px 32px', border: 'none', backgroundColor: '#2563EB', color: 'white', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                Hoàn thành
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentAssignmentListening;
