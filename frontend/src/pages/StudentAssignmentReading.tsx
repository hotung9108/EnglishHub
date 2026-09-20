import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, Search, Bell, BookOpen, 
  Timer, Pause, Save, Send, Bookmark, Highlighter, 
  ChevronLeft
} from 'lucide-react';

const StudentAssignmentReading: React.FC = () => {
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
            <span style={{ padding: '4px 12px', backgroundColor: '#3B82F6', color: 'white', fontSize: '13px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>Reading 01</span>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1E293B', textTransform: 'uppercase' }}>THE EVOLUTION OF PRINTING & TYPOGRAPHY</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={16} /> IELTS Academic Passage 1</span>
            <span style={{ width: '4px', height: '4px', backgroundColor: '#CBD5E1', borderRadius: '50%' }}></span>
            <span>Tổng số: <strong style={{ color: '#1E293B' }}>10 câu</strong></span>
            <span style={{ width: '4px', height: '4px', backgroundColor: '#CBD5E1', borderRadius: '50%' }}></span>
            <span>Mã đề: RD-ENG-01</span>
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
        
        {/* Left Column: Passage */}
        <div style={{ borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0 }}>ĐOẠN VĂN ĐỌC (PASSAGE 1)</h2>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>(Khoảng 820 từ)</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '6px 12px', border: '1px solid #E2E8F0', backgroundColor: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>A-</button>
              <button style={{ padding: '6px 12px', border: '1px solid #E2E8F0', backgroundColor: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>A+</button>
              <button style={{ padding: '6px 16px', border: '1px solid #E2E8F0', backgroundColor: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Highlighter size={14} /> Đánh dấu
              </button>
            </div>
          </div>

          <div style={{ padding: '32px 48px', flex: 1 }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '16px', lineHeight: '1.4' }}>The Origin and Enduring Legacy of Typesetting Standards</h1>
              <p style={{ fontSize: '16px', fontStyle: 'italic', color: '#475569', marginBottom: '40px' }}>Source: Excerpts from Classical Typography & Publication Archival Studies</p>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 700, borderRadius: '4px' }}>PARAGRAPH A</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>What is Lorem Ipsum?</span>
                </div>
                <p style={{ fontSize: '17px', lineHeight: '1.8', color: '#334155', textAlign: 'justify' }}>
                  <strong>Lorem Ipsum</strong> is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. Designers at <span style={{ backgroundColor: '#FEF08A', padding: '2px 4px', borderRadius: '2px' }}>Letraset and James Mosley</span>, the librarian at St Bride Printing Library in London, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 700, borderRadius: '4px' }}>PARAGRAPH B</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Why do we use it?</span>
                </div>
                <p style={{ fontSize: '17px', lineHeight: '1.8', color: '#334155', textAlign: 'justify' }}>
                  It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using <em>'Content here, content here'</em>, making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 700, borderRadius: '4px' }}>PARAGRAPH C</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Where does it come from?</span>
                </div>
                <p style={{ fontSize: '17px', lineHeight: '1.8', color: '#334155', textAlign: 'justify' }}>
                  Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 700, borderRadius: '4px' }}>PARAGRAPH D</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>The Transition to Digital Publishing</span>
                </div>
                <p style={{ fontSize: '17px', lineHeight: '1.8', color: '#334155', textAlign: 'justify' }}>
                  The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham. With the advent of digital typesetting in the late 20th century, the role of dummy text became even more critical. Graphical user interfaces (GUI) required designers to map out visual hierarchy before final copy was approved. This led to Lorem Ipsum being hardcoded into early design software.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 700, borderRadius: '4px' }}>PARAGRAPH E</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Modern Interpretations and Variants</span>
                </div>
                <p style={{ fontSize: '17px', lineHeight: '1.8', color: '#334155', textAlign: 'justify' }}>
                  Today, there are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.
                </p>
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

export default StudentAssignmentReading;
