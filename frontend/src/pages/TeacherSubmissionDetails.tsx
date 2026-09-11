import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Clock, FileText, ChevronLeft, ChevronRight,
  User, Star, Sparkles, MessageSquare, Bold, Italic, Underline, CheckCircle,
  File, List, ListOrdered, Save, Send
} from 'lucide-react';

const TeacherSubmissionDetails = () => {
  const navigate = useNavigate();
  const { id, studentId } = useParams();

  return (
    <div style={{ paddingBottom: '80px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Breadcrumbs & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate(`/teacher/assignments/${id}`)}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px', 
              color: '#2563EB', background: 'none', border: 'none', 
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0
            }}
          >
            <ArrowLeft size={16} /> Quay lại danh sách bài nộp
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '4px', border: '1px solid #E2E8F0' }}>
            <button style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500 }}>
              <ChevronLeft size={14} /> Trước
            </button>
            <span style={{ padding: '0 8px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>14 / 28</span>
            <button style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              Tiếp (David Pham) <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Header Info */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>WRITING TASK 2 - ESSAY</h1>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '9999px', backgroundColor: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
            IELTS Academic
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
          Hạn nộp: <span style={{ fontWeight: 500, color: '#334155' }}>Jan 05, 2026, 23:59</span> • Mục tiêu Band: <span style={{ fontWeight: 600, color: '#334155' }}>6.5 - 7.5</span> • Đề tài: <span style={{ color: '#475569', fontStyle: 'italic' }}>"Should governments invest solely in renewable energy sources?"</span>
        </p>
      </div>

      {/* Quick Actions Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <Download size={14} color="#64748B" /> Tải toàn bộ bài nộp (.zip)
        </button>
        <button style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <Printer size={14} color="#64748B" /> In phiếu chấm
        </button>
      </div>

      {/* Student Banner */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="#94A3B8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Alice Johnson</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                Đã nộp bài (On-time)
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>HV-8801</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>alice.j@student.edu.vn</span>
              <span>•</span>
              <span>Khóa IELTS Intensive 2026</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#94A3B8', fontSize: '11px' }}>Thời gian nộp bài:</div>
            <div style={{ fontWeight: 600, color: '#334155' }}>04/01/2026 - 21:30:15</div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: '#E2E8F0' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            <span style={{ fontWeight: 500, color: '#334155' }}>Đúng thời hạn</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Score Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '8px' }}>
            <span>Overall IELTS Band</span>
            <span style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '4px', backgroundColor: '#DBEAFE', color: '#1D4ED8', textTransform: 'uppercase' }}>Estimated</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: '#2563EB', letterSpacing: '-0.025em' }}>7.5</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>/ 9.0</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', marginLeft: 'auto' }}>(Tương đương 8.5/10)</span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#059669', fontWeight: 500 }}>
            <Star size={14} /> Đạt mục tiêu đầu ra (≥ 6.5)
          </div>
        </div>

        {/* Time Spent Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '8px' }}>
            <span>Time Spent (Thời gian làm)</span>
            <Clock size={16} color="#94A3B8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '30px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.025em' }}>45</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>phút</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B' }}>
            Chuẩn thời gian thi IELTS Task 2 (40-45m)
          </div>
        </div>
      </div>

      {/* Submission Files */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FileText size={16} color="#2563EB" /> Submission Files (Tệp bài làm đính kèm)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>2 tệp được gửi lên</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'rgba(248, 250, 252, 0.7)', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, border: '1px solid #BFDBFE' }}>
                DOCX
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '2px' }}>
                  writing-task-2-renewable-energy.docx
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 500 }}>2.4 MB</span>
                  <span>•</span>
                  <span>Nộp ngày 04/01/2026, 21:30</span>
                  <span>•</span>
                  <span style={{ color: '#2563EB', fontWeight: 500 }}>Bản chính thức</span>
                </div>
              </div>
            </div>
            <button style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 500, color: '#1D4ED8', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} color="#2563EB" /> Tải xuống
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#FFE4E6', color: '#BE123C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, border: '1px solid #FECDD3' }}>
                PDF
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1E293B', marginBottom: '2px' }}>
                  explanation-and-brainstorming-outline.pdf
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 500 }}>1.2 MB</span>
                  <span>•</span>
                  <span>Nộp ngày 04/01/2026, 21:28</span>
                  <span>•</span>
                  <span>Tài liệu nháp dàn ý</span>
                </div>
              </div>
            </div>
            <button style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 500, color: '#334155', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} color="#64748B" /> Tải xuống
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Working Space */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <style>{`
          @media (min-width: 1024px) {
            .grading-grid { grid-template-columns: 7fr 5fr !important; }
          }
          .grammar-highlight {
            background-color: #FEF3C7;
            border-bottom: 2px dashed #F59E0B;
            padding: 1px 3px;
            border-radius: 2px;
            cursor: pointer;
          }
          .lexical-highlight {
            background-color: #DCFCE7;
            border-bottom: 2px solid #10B981;
            padding: 1px 3px;
            border-radius: 2px;
            cursor: pointer;
          }
        `}</style>
        <div className="grading-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* Left Column: Document Viewer */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: '#334155' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span>
                <span>Bài làm văn bản: <strong style={{ fontWeight: 600, color: '#0F172A' }}>writing-task-2-renewable-energy.docx</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></span> 1 Lưu ý Ngữ pháp
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#10B981', borderRadius: '50%' }}></span> 2 Từ vựng C1/C2
                </span>
              </div>
            </div>

            <div style={{ padding: '24px', fontFamily: 'serif', color: '#1E293B', lineHeight: 1.8, fontSize: '15px', maxHeight: '580px', overflowY: 'auto' }}>
              <div style={{ fontFamily: 'sans-serif', fontWeight: 600, fontSize: '14px', color: '#94A3B8', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', letterSpacing: '0.025em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Topic: Some people believe that governments should prioritize renewable energy over fossil fuels. To what extent do you agree or disagree?
              </div>
              <p style={{ marginBottom: '16px' }}>
                In recent decades, global warming and climate change have escalated into critical international concerns. Consequently, an increasing number of analysts assert that national authorities ought to allocate their financial and infrastructural resources <span className="lexical-highlight" title="Từ vựng học thuật tốt (C1 - Collocation)">predominantly towards</span> renewable energy sources rather than persisting with fossil fuels. I wholeheartedly agree with this proposition, considering both the undeniable environmental preservation and the long-term economic sustainability.
              </p>
              <p style={{ marginBottom: '16px' }}>
                First and foremost, the ecological hazards posed by conventional energy extraction cannot be overstated. Traditional coal and petroleum combustion releases massive volumes of greenhouse gases, notably carbon dioxide and methane, which expedite polar ice melting and severe meteorological anomalies. Conversely, clean alternatives such as solar arrays, wind turbines, and hydroelectric generators produce virtually zero carbon emissions during operational cycles. For instance, countries like Denmark and Iceland have witnessed <span className="lexical-highlight" title="Collocation chính xác Band 8.0">remarkable ecological revitalisation</span> by shifting their national grids towards zero-emission technologies.
              </p>
              <p style={{ marginBottom: '16px' }}>
                Furthermore, from an economic and geopolitical standpoint, renewable infrastructure offers a hedge against unpredictable global oil market volatilities. While establishing clean energy facilities demands substantial initial capital investments, their operational and maintenance expenses remain exceptionally low over time. <span className="grammar-highlight" title="Lưu ý ngữ pháp: Cần dùng mạo từ 'the' hoặc dạng số nhiều 'government subsidies'">Moreover, government subsidy</span> directed towards green energy stimulate technological innovation and generate numerous high-skilled employment positions, effectively invigorating the national economic landscape.
              </p>
              <p style={{ marginBottom: '16px' }}>
                In conclusion, although the immediate transition to clean energy involves considerable fiscal commitments, the multifaceted advantages regarding biosphere preservation and future-proof economic resilience justify prioritized state expenditure. It is imperative that global policymakers accelerate this structural paradigm shift before environmental damages become irreversible.
              </p>
            </div>

            <div style={{ padding: '10px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>Số từ: <strong style={{ color: '#1E293B', fontWeight: 600 }}>285 từ</strong></span>
              </div>
              <button style={{ color: '#2563EB', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <MessageSquare size={14} /> Thêm ghi chú trực tiếp vào văn bản
              </button>
            </div>
          </div>

          {/* Right Column: AI Insights & Feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* AI Grading Insight */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(239, 246, 255, 0.8)', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1E3A8A', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#2563EB" /> Gợi ý từ Trợ lý AI Grading:
                </span>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(191, 219, 254, 0.7)', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>Độ tin cậy 94%</span>
              </div>
              <p style={{ color: '#334155', lineHeight: 1.6, fontSize: '11px', margin: 0 }}>
                "Bài viết có cấu trúc mở - thân - kết rất chặt chẽ, luận điểm rõ ràng và dẫn chứng thuyết phục. Sử dụng tự nhiên nhiều thuật ngữ chuyên đề (meteorological anomalies, paradigm shift). Điểm cần cải thiện: Lưu ý mạo từ ở câu đầu đoạn thân bài 2."
              </p>
            </div>

            {/* Feedback Editor */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <MessageSquare size={16} color="#475569" /> Feedback / Nhận xét của Giáo viên
                </h3>
                <button style={{ fontSize: '12px', color: '#2563EB', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <List size={12} /> Chèn mẫu câu nhận xét nhanh
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '6px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', border: '1px solid #E2E8F0', borderBottom: 'none', color: '#475569', fontSize: '12px' }}>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>B</button>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'serif' }}>I</button>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>U</button>
                <span style={{ width: '1px', height: '16px', backgroundColor: '#CBD5E1', margin: '0 4px' }}></span>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><List size={14} /></button>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ListOrdered size={14} /></button>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94A3B8' }}>Tự động lưu nháp</span>
              </div>
              
              <textarea 
                style={{ 
                  width: '100%', fontSize: '12px', color: '#1E293B', borderColor: '#E2E8F0', 
                  borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', outline: 'none',
                  padding: '12px', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box'
                }} 
                placeholder="Nhập nhận xét chi tiết, lời khuyên và hướng khắc phục cho bài viết của Alice Johnson..." 
                rows={5}
                defaultValue="Chào Alice, bài viết này em thể hiện vốn từ vựng học thuật rất tốt, đặc biệt là các thuật ngữ về môi trường & năng lượng tái tạo (TR & LR rất ấn tượng). Em duy trì phong độ này cho bài Task 1 tuần tới nhé! Cần lưu ý một chút về việc kiểm tra mạo từ hạn định (determiners) ở các câu phức."
              ></textarea>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', paddingTop: '4px' }}>
                <span>Học sinh sẽ nhận được thông báo qua Email & App</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>238 ký tự</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: '256px', right: 0, 
        backgroundColor: 'white', borderTop: '1px solid #E2E8F0', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 30
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
            Hủy bỏ thay đổi
          </button>
          <button style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#334155', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Save size={14} color="#64748B" /> Lưu bản nháp nhận xét
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', display: 'none' }}>Trạng thái: <strong style={{ color: '#059669', fontWeight: 500 }}>Sẵn sàng gửi điểm</strong></span>
          <button style={{ padding: '8px 20px', fontSize: '12px', fontWeight: 700, color: 'white', backgroundColor: '#2563EB', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
            <Send size={16} /> Lưu & Gửi điểm cho học sinh
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSubmissionDetails;
