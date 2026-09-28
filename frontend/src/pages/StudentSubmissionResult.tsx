import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  Download, 
  RotateCcw, 
  MessageSquare, 
  FileText, 
  Award,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AnnotationItem {
  id: number;
  type: 'grammar' | 'vocabulary' | 'positive';
  original: string;
  suggestion: string;
  explanation: string;
  teacherNote?: string;
  approved: boolean;
}

const StudentSubmissionResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeFilter, setActiveFilter] = useState<'all' | 'grammar' | 'vocabulary' | 'positive'>('all');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number>(1);

  const annotations: AnnotationItem[] = [
    {
      id: 1,
      type: 'grammar',
      original: 'has increase significantly',
      suggestion: 'has increased significantly',
      explanation: 'Lỗi thì hiện tại hoàn thành: sau trợ động từ "has", động từ chính phải chia ở dạng quá khứ phân từ (V3/ed).',
      teacherNote: 'Em chú ý các động từ có quy tắc khi chia ở thì hoàn thành nhé.',
      approved: true
    },
    {
      id: 2,
      type: 'vocabulary',
      original: 'big dilemma',
      suggestion: 'grave crisis / pressing predicament',
      explanation: 'Nâng cao vốn từ vựng học thuật (Collocation IELTS Band 7.5+): thay vì dùng "big dilemma", nên dùng các tính từ học thuật như "pressing" hoặc "grave".',
      teacherNote: 'Lựa chọn từ này rất tốt, giúp bài viết trang trọng hơn.',
      approved: true
    },
    {
      id: 3,
      type: 'grammar',
      original: 'affect on people life',
      suggestion: 'affects people\'s lives',
      explanation: 'Động từ "affect" là ngoại động từ tác động trực tiếp, không đi cùng giới từ "on". Sở hữu cách danh từ số nhiều: "people\'s lives".',
      teacherNote: 'Lưu ý phân biệt danh từ "effect on" và động từ "affect something".',
      approved: true
    },
    {
      id: 4,
      type: 'positive',
      original: 'transitional shift toward renewable energy sources',
      suggestion: 'Excellent academic phrasing',
      explanation: 'Cấu trúc câu học thuật rất tự nhiên, vận dụng tốt danh từ ghép và cụm giới từ chỉ mục đích.',
      teacherNote: 'Điểm sáng trong Task 2, phát huy em nhé!',
      approved: true
    }
  ];

  const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId) || annotations[0];

  const isHighlightVisible = (type: string) => {
    return activeFilter === 'all' || activeFilter === type;
  };

  return (
    <div className="container p-24">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-8 mb-24 text-sm text-on-surface-variant">
        <button 
          className="flex items-center gap-4 bg-transparent border-none cursor-pointer text-on-surface-variant font-medium p-0" 
          onClick={() => navigate('/student/assignments')}
          type="button"
        >
          <ArrowLeft size={14} />
          <span>{t('studentSpeaking.backToList') || 'Quay lại danh sách bài tập'}</span>
        </button>
        <span className="text-outline">/</span>
        <span>Hệ thống</span>
        <ChevronRight size={12} className="text-outline" />
        <span 
          className="text-primary cursor-pointer font-medium"
          onClick={() => navigate('/student/classes')}
          role="button"
          tabIndex={0}
        >
          Lớp học của tôi
        </span>
        <ChevronRight size={12} className="text-outline" />
        <span className="text-primary font-medium">ENG-IELTS-6.5A</span>
        <ChevronRight size={12} className="text-outline" />
        <span className="font-semibold text-on-surface">
          Kết quả &amp; Feedback ({id || 'HW-01'})
        </span>
      </div>

      {/* Hero Banner */}
      <section className="flex-between flex-wrap gap-24 p-32 rounded-xl mb-32 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)' }}>
        <div className="flex-col gap-12">
          <div className="inline-flex items-center gap-6 font-semibold text-xs tracking-wide uppercase px-12 py-4 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', width: 'fit-content' }}>
            <Award size={13} />
            Đã chấm điểm hoàn tất • Lần nộp 1/3
          </div>
          <h1 className="m-0 font-bold" style={{ fontSize: '24px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            HW-01: Renewable Energy &amp; Environmental Protection (Task 2)
          </h1>
          <div className="flex items-center gap-12 text-sm opacity-80" style={{ fontSize: '13.5px' }}>
            <span><strong>Khóa học:</strong> IELTS Intensive Band 6.5 - 7.5</span>
            <span>•</span>
            <span><strong>Nộp ngày:</strong> 04/09/2026</span>
            <span>•</span>
            <span><strong>Chấm bởi:</strong> Cô Trần Thị Mai Lan &amp; AI Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-16 flex-wrap">
          <div className="flex items-center gap-20 bg-white p-16-24 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <div className="flex-col items-center">
              <span className="font-bold leading-none" style={{ fontSize: '32px' }}>7.5</span>
              <span className="text-xs uppercase tracking-wide opacity-80 mt-4">IELTS Band</span>
            </div>
            <div style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)' }}></div>
            <div className="flex-col">
              <span className="font-bold text-lg" style={{ color: '#93c5fd' }}>86 / 100</span>
              <span className="text-xs opacity-80">Điểm hệ 100</span>
              <span className="text-xs font-bold mt-2" style={{ color: '#86efac' }}>
                ✓ Đạt chuẩn đầu ra
              </span>
            </div>
          </div>

          <div className="flex-col gap-10">
            <button 
              className="btn bg-white text-on-surface" 
              onClick={() => navigate(`/student/assignments/${id || 'HW-01'}/overview`)}
              type="button"
            >
              <RotateCcw size={14} />
              Làm lại bài (Còn 2 lượt)
            </button>
            <button 
              className="btn btn-secondary text-white"
              style={{ border: '1px solid rgba(255, 255, 255, 0.4)' }}
              onClick={() => alert('Đang xuất báo cáo kết quả đánh giá chi tiết (PDF)...')}
              type="button"
            >
              <Download size={14} />
              Tải báo cáo PDF
            </button>
          </div>
        </div>
      </section>

      {/* 4 Rubrics Breakdown */}
      <section className="grid gap-20 mb-32" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card p-20" style={{ borderTop: '4px solid #3b82f6' }}>
          <div className="flex-between items-center mb-12">
            <h3 className="m-0 font-bold text-on-surface text-base">Task Achievement</h3>
            <span className="font-bold text-primary text-base">7.5 / 9.0</span>
          </div>
          <p className="m-0 text-sm text-on-surface-variant leading-relaxed">
            Trả lời đầy đủ các vế của đề bài. Lập luận chặt chẽ và đưa ra ví dụ minh họa xác đáng về năng lượng tái tạo.
          </p>
        </div>

        <div className="card p-20" style={{ borderTop: '4px solid #8b5cf6' }}>
          <div className="flex-between items-center mb-12">
            <h3 className="m-0 font-bold text-on-surface text-base">Coherence &amp; Cohesion</h3>
            <span className="font-bold text-base" style={{ color: '#8b5cf6' }}>8.0 / 9.0</span>
          </div>
          <p className="m-0 text-sm text-on-surface-variant leading-relaxed">
            Cấu trúc đoạn văn chuẩn học thuật 4 phần. Sử dụng linh hoạt các liên từ chuyển tiếp ý tưởng mạch lạc.
          </p>
        </div>

        <div className="card p-20" style={{ borderTop: '4px solid #f59e0b' }}>
          <div className="flex-between items-center mb-12">
            <h3 className="m-0 font-bold text-on-surface text-base">Lexical Resource</h3>
            <span className="font-bold text-base" style={{ color: '#f59e0b' }}>7.0 / 9.0</span>
          </div>
          <p className="m-0 text-sm text-on-surface-variant leading-relaxed">
            Vốn từ phong phú về chủ đề môi trường. Cần hạn chế một số từ vựng lặp lại và chú ý thêm Collocations học thuật.
          </p>
        </div>

        <div className="card p-20" style={{ borderTop: '4px solid #10b981' }}>
          <div className="flex-between items-center mb-12">
            <h3 className="m-0 font-bold text-on-surface text-base">Grammatical Range &amp; Acc</h3>
            <span className="font-bold text-base" style={{ color: '#10b981' }}>7.5 / 9.0</span>
          </div>
          <p className="m-0 text-sm text-on-surface-variant leading-relaxed">
            Phối hợp tốt giữa câu đơn và câu ghép phức. Mắc 2 lỗi nhỏ chia thì hoàn thành và mạo từ sở hữu.
          </p>
        </div>
      </section>

      {/* Main Workspace: Left Essay Annotations, Right Inspector & Thread */}
      <div className="grid gap-32 items-start" style={{ gridTemplateColumns: '6fr 4fr' }}>
        
        {/* Left Column: Submission with Inline Annotations */}
        <div className="card p-0 overflow-hidden">
          <div className="flex-between items-center border-b bg-surface-container-low p-16-24">
            <h2 className="flex items-center gap-10 m-0 font-bold text-on-surface text-base">
              <FileText size={18} className="text-primary" />
              Bài Nộp &amp; Highlight Sửa Lỗi Tương Tác
            </h2>
            <span className="text-xs font-medium text-on-surface-variant">
              Tổng cộng 4 ghi chú sửa lỗi
            </span>
          </div>

          <div className="p-24">
            {/* Filter Buttons */}
            <div className="flex items-center gap-8 mb-24 flex-wrap">
              <span className="text-xs font-semibold text-on-surface-variant mr-4">
                Lọc sửa lỗi:
              </span>
              <button 
                className={`text-xs text-nowrap flex-shrink-0 font-semibold rounded-full border cursor-pointer px-14 py-6 transition-all ${activeFilter === 'all' ? 'bg-on-surface text-white border-on-surface' : 'bg-transparent text-on-surface-variant'}`}
                onClick={() => setActiveFilter('all')}
                type="button"
              >
                Tất cả ({annotations.length})
              </button>
              <button 
                className={`text-xs text-nowrap flex-shrink-0 font-semibold rounded-full border cursor-pointer px-14 py-6 transition-all ${activeFilter === 'grammar' ? 'bg-error text-white border-error' : 'bg-transparent text-on-surface-variant'}`}
                onClick={() => setActiveFilter('grammar')}
                type="button"
              >
                Ngữ pháp (2)
              </button>
              <button 
                className={`text-xs text-nowrap flex-shrink-0 font-semibold rounded-full border cursor-pointer px-14 py-6 transition-all ${activeFilter === 'vocabulary' ? 'bg-tertiary text-white border-tertiary' : 'bg-transparent text-on-surface-variant'}`}
                onClick={() => setActiveFilter('vocabulary')}
                type="button"
              >
                Từ vựng (1)
              </button>
              <button 
                className={`text-xs text-nowrap flex-shrink-0 font-semibold rounded-full border cursor-pointer px-14 py-6 transition-all ${activeFilter === 'positive' ? 'bg-secondary text-white border-secondary' : 'bg-transparent text-on-surface-variant'}`}
                onClick={() => setActiveFilter('positive')}
                type="button"
              >
                Khen ngợi (1)
              </button>
            </div>

            {/* Essay Text Canvas with Highlights */}
            <div className="rounded-lg p-24 bg-surface-container-low leading-loose text-on-surface text-base" style={{ border: '1px solid var(--outline-variant)' }}>
              <p className="m-0 mb-16">
                In the modern era, the depletion of fossil fuels and rising environmental pollution have emerged as a{' '}
                <span 
                  className={`font-semibold cursor-pointer px-4 rounded ${isHighlightVisible('vocabulary') ? 'bg-tertiary-fixed text-on-tertiary-container border-b-2' : ''}`}
                  style={{ borderBottomColor: isHighlightVisible('vocabulary') ? 'var(--tertiary)' : 'transparent' }}
                  onClick={() => setSelectedAnnotationId(2)}
                  title="Click để xem gợi ý sửa từ vựng"
                >
                  big dilemma
                </span>{' '}
                for developing nations. Over the past two decades, energy consumption{' '}
                <span 
                  className={`font-semibold cursor-pointer px-4 rounded ${isHighlightVisible('grammar') ? 'bg-error-container text-on-error-container border-b-2' : ''}`}
                  style={{ borderBottomColor: isHighlightVisible('grammar') ? 'var(--error)' : 'transparent' }}
                  onClick={() => setSelectedAnnotationId(1)}
                  title="Click để xem lỗi ngữ pháp"
                >
                  has increase significantly
                </span>{' '}
                due to rapid industrialization and private vehicular usage.
              </p>

              <p className="m-0 mb-16">
                Consequently, the emission of toxic exhaust gases directly{' '}
                <span 
                  className={`font-semibold cursor-pointer px-4 rounded ${isHighlightVisible('grammar') ? 'bg-error-container text-on-error-container border-b-2' : ''}`}
                  style={{ borderBottomColor: isHighlightVisible('grammar') ? 'var(--error)' : 'transparent' }}
                  onClick={() => setSelectedAnnotationId(3)}
                  title="Click để xem lỗi ngữ pháp"
                >
                  affect on people life
                </span>
                , leading to higher rates of cardiovascular and respiratory ailments among residents living near metropolis centers.
              </p>

              <p className="m-0">
                To mitigate this environmental catastrophe, international governments must advocate for a{' '}
                <span 
                  className={`font-semibold cursor-pointer px-4 rounded ${isHighlightVisible('positive') ? 'bg-secondary-container text-on-secondary-container border-b-2' : ''}`}
                  style={{ borderBottomColor: isHighlightVisible('positive') ? 'var(--secondary)' : 'transparent' }}
                  onClick={() => setSelectedAnnotationId(4)}
                  title="Click để xem lời khen ngợi"
                >
                  transitional shift toward renewable energy sources
                </span>{' '}
                such as solar and wind turbines. In conclusion, collective action from both policymakers and individuals is paramount to securing a sustainable future for forthcoming generations.
              </p>
            </div>

            <div className="flex items-center gap-16 mt-16 text-xs text-on-surface-variant">
              <span className="flex items-center gap-6">
                <span className="rounded-sm bg-error" style={{ width: 10, height: 10 }}></span>
                Đỏ: Lỗi ngữ pháp
              </span>
              <span className="flex items-center gap-6">
                <span className="rounded-sm bg-tertiary" style={{ width: 10, height: 10 }}></span>
                Vàng: Gợi ý nâng cao từ vựng
              </span>
              <span className="flex items-center gap-6">
                <span className="rounded-sm bg-secondary" style={{ width: 10, height: 10 }}></span>
                Xanh: Lối diễn đạt xuất sắc
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Annotation Inspector & Feedback Thread */}
        <div className="flex-col gap-24">
          
          {/* Selected Annotation Inspector */}
          <div className="card p-0 overflow-hidden">
            <div className="flex-between items-center border-b p-16-24">
              <h3 className="flex items-center gap-8 m-0 font-bold text-on-surface text-base">
                <Sparkles size={16} className="text-primary" />
                Chi Tiết Lỗi &amp; Gợi Ý Sửa
              </h3>
              <span className="text-xs font-bold text-uppercase text-primary tracking-wide">
                #{selectedAnnotation.id} • {selectedAnnotation.type}
              </span>
            </div>

            <div className="p-24">
              <div className="flex-col gap-16 rounded-lg p-20" style={{ 
                backgroundColor: selectedAnnotation.type === 'grammar' ? '#FEF2F2' : selectedAnnotation.type === 'vocabulary' ? '#FFFBEB' : '#F0FDF4',
                border: `1px solid ${selectedAnnotation.type === 'grammar' ? '#FECACA' : selectedAnnotation.type === 'vocabulary' ? '#FDE68A' : '#BBF7D0'}`
              }}>
                <div>
                  <div className="text-xs font-bold text-uppercase text-on-surface-variant mb-4">
                    Cụm từ gốc trong bài làm:
                  </div>
                  <div className="p-12 rounded bg-white border text-error font-medium" style={{ borderColor: 'var(--outline-variant)' }}>
                    "{selectedAnnotation.original}"
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-uppercase text-on-surface-variant mb-4">
                    AI Đề xuất chỉnh sửa chuẩn IELTS:
                  </div>
                  <div className="p-12 rounded bg-white border text-secondary font-medium" style={{ borderColor: 'var(--outline-variant)' }}>
                    "{selectedAnnotation.suggestion}"
                  </div>
                </div>

                <div className="text-sm text-on-surface leading-relaxed">
                  <strong>Giải thích nguyên tắc:</strong> {selectedAnnotation.explanation}
                </div>

                {selectedAnnotation.teacherNote && (
                  <div className="p-10-16 rounded text-xs mt-8" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
                    <div className="flex items-center gap-4 font-bold mb-4">
                      <UserCheck size={14} />
                      Lời phê của Cô Mai Lan:
                    </div>
                    "{selectedAnnotation.teacherNote}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Teacher & AI General Feedback */}
          <div className="card p-0 overflow-hidden">
            <div className="border-b p-16-24">
              <h3 className="flex items-center gap-8 m-0 font-bold text-on-surface text-base">
                <MessageSquare size={16} className="text-primary" />
                Nhận Xét Chung Của Giảng Viên
              </h3>
            </div>

            <div className="flex-col gap-16 p-24">
              <div className="p-20 rounded-lg bg-surface-container-low border relative" style={{ borderColor: 'var(--outline-variant)' }}>
                <div className="flex-between items-center mb-12">
                  <div className="flex items-center gap-10">
                    <span className="flex-center rounded-full text-white font-bold bg-primary" style={{ width: 26, height: 26, fontSize: 11 }}>
                      ML
                    </span>
                    <span className="font-semibold text-sm">ThS. Trần Thị Mai Lan (GV Phụ Trách)</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">05/09/2026 14:20</span>
                </div>
                <p className="m-0 text-sm leading-relaxed text-on-surface italic">
                  "Bài viết của Alice có cấu trúc rất vững, bố cục các luận điểm rõ ràng và giải quyết trọn vẹn yêu cầu của đề bài Task 2. Em đã tiến bộ vượt bậc so với tuần trước ở phần liên kết câu. Hãy chú ý hơn khi chia động từ ở các thì quá khứ/hoàn thành để không bị trừ điểm Grammatical Accuracy đáng tiếc nhé!"
                </p>
              </div>

              <button 
                type="button" 
                className="btn btn-primary w-full"
                onClick={() => alert('Mở hộp thư trao đổi riêng với giảng viên lớp ENG-IELTS-6.5A!')}
              >
                <MessageSquare size={15} />
                Gửi câu hỏi / Thảo luận thêm với Giảng viên
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentSubmissionResult;
