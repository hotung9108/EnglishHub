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
    <div className="result-container">
      {/* Breadcrumbs */}
      <div className="result-breadcrumbs">
        <button 
          className="result-back-btn" 
          onClick={() => navigate('/student/assignments')}
          type="button"
        >
          <ArrowLeft size={14} />
          <span>{t('studentSpeaking.backToList') || 'Quay lại danh sách bài tập'}</span>
        </button>
        <span style={{ color: 'var(--outline-variant)' }}>/</span>
        <span>Hệ thống</span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span 
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => navigate('/student/classes')}
          role="button"
          tabIndex={0}
        >
          Lớp học của tôi
        </span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>ENG-IELTS-6.5A</span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
          Kết quả &amp; Feedback ({id || 'HW-01'})
        </span>
      </div>

      {/* Hero Banner */}
      <section className="result-hero-banner">
        <div className="result-hero-info">
          <div className="result-hero-tag">
            <Award size={13} />
            Đã chấm điểm hoàn tất • Lần nộp 1/3
          </div>
          <h1 className="result-hero-title">
            HW-01: Renewable Energy &amp; Environmental Protection (Task 2)
          </h1>
          <div className="result-hero-meta">
            <span><strong>Khóa học:</strong> IELTS Intensive Band 6.5 - 7.5</span>
            <span>•</span>
            <span><strong>Nộp ngày:</strong> 04/09/2026</span>
            <span>•</span>
            <span><strong>Chấm bởi:</strong> Cô Trần Thị Mai Lan &amp; AI Engine</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="result-hero-score-box">
            <div className="result-score-main">
              <span className="result-score-number">7.5</span>
              <span className="result-score-label">IELTS Band</span>
            </div>
            <div style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#93c5fd' }}>86 / 100</span>
              <span style={{ fontSize: '11px', opacity: 0.85 }}>Điểm hệ 100</span>
              <span style={{ fontSize: '11px', color: '#86efac', fontWeight: 700, marginTop: 2 }}>
                ✓ Đạt chuẩn đầu ra
              </span>
            </div>
          </div>

          <div className="result-hero-actions">
            <button 
              className="result-btn-white" 
              onClick={() => navigate(`/student/assignments/${id || 'HW-01'}/overview`)}
              type="button"
            >
              <RotateCcw size={14} />
              Làm lại bài (Còn 2 lượt)
            </button>
            <button 
              className="result-btn-outline-white" 
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
      <section className="result-rubrics-grid">
        <div className="result-rubric-card fluency">
          <div className="result-rubric-header">
            <h3 className="result-rubric-title">Task Achievement</h3>
            <span className="result-rubric-score">7.5 / 9.0</span>
          </div>
          <p className="result-rubric-desc">
            Trả lời đầy đủ các vế của đề bài. Lập luận chặt chẽ và đưa ra ví dụ minh họa xác đáng về năng lượng tái tạo.
          </p>
        </div>

        <div className="result-rubric-card lexical">
          <div className="result-rubric-header">
            <h3 className="result-rubric-title">Coherence &amp; Cohesion</h3>
            <span className="result-rubric-score">8.0 / 9.0</span>
          </div>
          <p className="result-rubric-desc">
            Cấu trúc đoạn văn chuẩn học thuật 4 phần. Sử dụng linh hoạt các liên từ chuyển tiếp ý tưởng mạch lạc.
          </p>
        </div>

        <div className="result-rubric-card grammar">
          <div className="result-rubric-header">
            <h3 className="result-rubric-title">Lexical Resource</h3>
            <span className="result-rubric-score">7.0 / 9.0</span>
          </div>
          <p className="result-rubric-desc">
            Vốn từ phong phú về chủ đề môi trường. Cần hạn chế một số từ vựng lặp lại và chú ý thêm Collocations học thuật.
          </p>
        </div>

        <div className="result-rubric-card pronunciation">
          <div className="result-rubric-header">
            <h3 className="result-rubric-title">Grammatical Range &amp; Acc</h3>
            <span className="result-rubric-score">7.5 / 9.0</span>
          </div>
          <p className="result-rubric-desc">
            Phối hợp tốt giữa câu đơn và câu ghép phức. Mắc 2 lỗi nhỏ chia thì hoàn thành và mạo từ sở hữu.
          </p>
        </div>
      </section>

      {/* Main Workspace: Left Essay Annotations, Right Inspector & Thread */}
      <div className="result-content-grid">
        
        {/* Left Column: Submission with Inline Annotations */}
        <div className="result-card">
          <div className="result-card-header">
            <h2 className="result-card-title">
              <FileText size={16} color="var(--primary)" />
              Bài Nộp &amp; Highlight Sửa Lỗi Tương Tác
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
              Tổng cộng 4 ghi chú sửa lỗi
            </span>
          </div>

          <div className="result-card-body">
            {/* Filter Buttons */}
            <div className="annotation-filters">
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--on-surface-variant)', marginRight: 4 }}>
                Lọc sửa lỗi:
              </span>
              <button 
                className={`annotation-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
                type="button"
              >
                Tất cả ({annotations.length})
              </button>
              <button 
                className={`annotation-filter-btn ${activeFilter === 'grammar' ? 'active' : ''}`}
                onClick={() => setActiveFilter('grammar')}
                type="button"
              >
                Ngữ pháp (2)
              </button>
              <button 
                className={`annotation-filter-btn ${activeFilter === 'vocabulary' ? 'active' : ''}`}
                onClick={() => setActiveFilter('vocabulary')}
                type="button"
              >
                Từ vựng (1)
              </button>
              <button 
                className={`annotation-filter-btn ${activeFilter === 'positive' ? 'active' : ''}`}
                onClick={() => setActiveFilter('positive')}
                type="button"
              >
                Khen ngợi (1)
              </button>
            </div>

            {/* Essay Text Canvas with Highlights */}
            <div className="submission-text-canvas">
              <p style={{ marginTop: 0 }}>
                In the modern era, the depletion of fossil fuels and rising environmental pollution have emerged as a{' '}
                <span 
                  className={isHighlightVisible('vocabulary') ? 'hl-vocabulary' : ''}
                  onClick={() => setSelectedAnnotationId(2)}
                  title="Click để xem gợi ý sửa từ vựng"
                >
                  big dilemma
                </span>{' '}
                for developing nations. Over the past two decades, energy consumption{' '}
                <span 
                  className={isHighlightVisible('grammar') ? 'hl-grammar' : ''}
                  onClick={() => setSelectedAnnotationId(1)}
                  title="Click để xem lỗi ngữ pháp"
                >
                  has increase significantly
                </span>{' '}
                due to rapid industrialization and private vehicular usage.
              </p>

              <p>
                Consequently, the emission of toxic exhaust gases directly{' '}
                <span 
                  className={isHighlightVisible('grammar') ? 'hl-grammar' : ''}
                  onClick={() => setSelectedAnnotationId(3)}
                  title="Click để xem lỗi ngữ pháp"
                >
                  affect on people life
                </span>
                , leading to higher rates of cardiovascular and respiratory ailments among residents living near metropolis centers.
              </p>

              <p style={{ marginBottom: 0 }}>
                To mitigate this environmental catastrophe, international governments must advocate for a{' '}
                <span 
                  className={isHighlightVisible('positive') ? 'hl-positive' : ''}
                  onClick={() => setSelectedAnnotationId(4)}
                  title="Click để xem lời khen ngợi"
                >
                  transitional shift toward renewable energy sources
                </span>{' '}
                such as solar and wind turbines. In conclusion, collective action from both policymakers and individuals is paramount to securing a sustainable future for forthcoming generations.
              </p>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 10, height: 10, backgroundColor: '#ef4444', borderRadius: 2 }}></span>
                Đỏ: Lỗi ngữ pháp
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 10, height: 10, backgroundColor: '#f59e0b', borderRadius: 2 }}></span>
                Vàng: Gợi ý nâng cao từ vựng
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 10, height: 10, backgroundColor: '#10b981', borderRadius: 2 }}></span>
                Xanh: Lối diễn đạt xuất sắc
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Annotation Inspector & Feedback Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Selected Annotation Inspector */}
          <div className="result-card">
            <div className="result-card-header">
              <h3 className="result-card-title">
                <Sparkles size={16} color="var(--primary)" />
                Chi Tiết Lỗi &amp; Gợi Ý Sửa
              </h3>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                #{selectedAnnotation.id} • {selectedAnnotation.type}
              </span>
            </div>

            <div className="result-card-body">
              <div className={`annotation-inspect-card ${selectedAnnotation.type}`}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Cụm từ gốc trong bài làm:
                  </div>
                  <div className="annotation-original-box">
                    "{selectedAnnotation.original}"
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 4 }}>
                    AI Đề xuất chỉnh sửa chuẩn IELTS:
                  </div>
                  <div className="annotation-suggest-box">
                    "{selectedAnnotation.suggestion}"
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--on-surface)', lineHeight: 1.5 }}>
                  <strong>Giải thích nguyên tắc:</strong> {selectedAnnotation.explanation}
                </div>

                {selectedAnnotation.teacherNote && (
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 12px', fontSize: '12px', color: '#92400e' }}>
                    <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
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
          <div className="result-card">
            <div className="result-card-header">
              <h3 className="result-card-title">
                <MessageSquare size={16} color="var(--primary)" />
                Nhận Xét Chung Của Giảng Viên
              </h3>
            </div>

            <div className="result-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="feedback-bubble">
                <div className="feedback-bubble-header">
                  <div className="feedback-author-badge">
                    <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                      ML
                    </span>
                    <span>ThS. Trần Thị Mai Lan (GV Phụ Trách)</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>05/09/2026 14:20</span>
                </div>
                <p className="feedback-bubble-text">
                  "Bài viết của Alice có cấu trúc rất vững, bố cục các luận điểm rõ ràng và giải quyết trọn vẹn yêu cầu của đề bài Task 2. Em đã tiến bộ vượt bậc so với tuần trước ở phần liên kết câu. Hãy chú ý hơn khi chia động từ ở các thì quá khứ/hoàn thành để không bị trừ điểm Grammatical Accuracy đáng tiếc nhé!"
                </p>
              </div>

              {/* Action */}
              <button 
                type="button" 
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px' }}
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
