import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Clock, FileText, ChevronLeft, ChevronRight,
  User, Star, Sparkles, MessageSquare,
  List, ListOrdered, Save, Send
} from 'lucide-react';
import { MetricCard, FileItem, StickyActionBar } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';

const TeacherSubmissionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();

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
            <ArrowLeft size={16} /> {t('submissionDetails.backToList')}
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '4px', border: '1px solid #E2E8F0' }}>
            <button style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500 }}>
              <ChevronLeft size={14} /> {t('submissionDetails.btnPrev')}
            </button>
            <span style={{ padding: '0 8px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>14 / 28</span>
            <button style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
              {t('submissionDetails.btnNextPrefix')} (David Pham) <ChevronRight size={14} />
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
          {t('submissionDetails.duePrefix')} <span style={{ fontWeight: 500, color: '#334155' }}>Jan 05, 2026, 23:59</span> • {t('submissionDetails.targetBandPrefix')} <span style={{ fontWeight: 600, color: '#334155' }}>6.5 - 7.5</span> • {t('submissionDetails.topicPrefix')} <span style={{ color: '#475569', fontStyle: 'italic' }}>"Should governments invest solely in renewable energy sources?"</span>
        </p>
      </div>

      {/* Quick Actions Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button className="btn btn-secondary bg-white btn-sm" style={{ fontWeight: 500, color: '#334155', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <Download size={14} color="#64748B" /> {t('submissionDetails.btnDownloadAll')}
        </button>
        <button className="btn btn-secondary bg-white btn-sm" style={{ fontWeight: 500, color: '#334155', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <Printer size={14} color="#64748B" /> {t('submissionDetails.btnPrint')}
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
                {t('submissionDetails.statusSubmitted')}
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>HV-8801</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>alice.j@student.edu.vn</span>
              <span>•</span>
              <span>{t('submissionDetails.coursePrefix')}IELTS Intensive 2026</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#94A3B8', fontSize: '11px' }}>{t('submissionDetails.submissionTimePrefix')}</div>
            <div style={{ fontWeight: 600, color: '#334155' }}>04/01/2026 - 21:30:15</div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: '#E2E8F0' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            <span style={{ fontWeight: 500, color: '#334155' }}>{t('submissionDetails.statusOnTime')}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Score Card */}
        <MetricCard 
          title={t('submissionDetails.metricBand')}
          value="7.5"
          suffix="/ 9.0"
          icon={<Star size={16} />}
          footerText={<span style={{ color: 'var(--success)', fontWeight: 500 }}><Star size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> {t('submissionDetails.metricBandAchieved')} (≥ 6.5)</span>}
        />

        {/* Time Spent Card */}
        <MetricCard 
          title={t('submissionDetails.metricTime')}
          value="45"
          suffix={t('submissionDetails.unitMinutes')}
          icon={<Clock size={16} />}
          iconBgColor="var(--surface-container)"
          iconColor="var(--on-surface-variant)"
          footerText={t('submissionDetails.metricTimeHint')}
        />
      </div>

      {/* Submission Files */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FileText size={16} color="#2563EB" /> {t('submissionDetails.filesTitle')}
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>2{t('submissionDetails.filesCountSuffix')}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <FileItem 
            name="writing-task-2-renewable-energy.docx"
            extension="docx"
            size="2.4 MB"
            details={`${t('submissionDetails.submittedOn')}04/01/2026, 21:30`}
            onDownload={() => {}}
          />

          <FileItem 
            name="explanation-and-brainstorming-outline.pdf"
            extension="pdf"
            size="1.2 MB"
            details={`${t('submissionDetails.submittedOn')}04/01/2026, 21:28`}
            onDownload={() => {}}
          />
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
                <span>{t('submissionDetails.docViewerTitle')}<strong style={{ fontWeight: 600, color: '#0F172A' }}>writing-task-2-renewable-energy.docx</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></span> {t('submissionDetails.noteGrammar')}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#10B981', borderRadius: '50%' }}></span> {t('submissionDetails.noteVocab')}
                </span>
              </div>
            </div>

            <div style={{ padding: '24px', fontFamily: 'serif', color: '#1E293B', lineHeight: 1.8, fontSize: '15px', maxHeight: '580px', overflowY: 'auto' }}>
              <div style={{ fontFamily: 'sans-serif', fontWeight: 600, fontSize: '14px', color: '#94A3B8', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', letterSpacing: '0.025em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Topic: Some people believe that governments should prioritize renewable energy over fossil fuels. To what extent do you agree or disagree?
              </div>
              <p style={{ marginBottom: '16px' }}>
                In recent decades, global warming and climate change have escalated into critical international concerns. Consequently, an increasing number of analysts assert that national authorities ought to allocate their financial and infrastructural resources <span className="lexical-highlight" title={t('submissionDetails.lexicalHint1')}>predominantly towards</span> renewable energy sources rather than persisting with fossil fuels. I wholeheartedly agree with this proposition, considering both the undeniable environmental preservation and the long-term economic sustainability.
              </p>
              <p style={{ marginBottom: '16px' }}>
                First and foremost, the ecological hazards posed by conventional energy extraction cannot be overstated. Traditional coal and petroleum combustion releases massive volumes of greenhouse gases, notably carbon dioxide and methane, which expedite polar ice melting and severe meteorological anomalies. Conversely, clean alternatives such as solar arrays, wind turbines, and hydroelectric generators produce virtually zero carbon emissions during operational cycles. For instance, countries like Denmark and Iceland have witnessed <span className="lexical-highlight" title={t('submissionDetails.lexicalHint2')}>remarkable ecological revitalisation</span> by shifting their national grids towards zero-emission technologies.
              </p>
              <p style={{ marginBottom: '16px' }}>
                Furthermore, from an economic and geopolitical standpoint, renewable infrastructure offers a hedge against unpredictable global oil market volatilities. While establishing clean energy facilities demands substantial initial capital investments, their operational and maintenance expenses remain exceptionally low over time. <span className="grammar-highlight" title={t('submissionDetails.grammarHint')}>Moreover, government subsidy</span> directed towards green energy stimulate technological innovation and generate numerous high-skilled employment positions, effectively invigorating the national economic landscape.
              </p>
              <p style={{ marginBottom: '16px' }}>
                In conclusion, although the immediate transition to clean energy involves considerable fiscal commitments, the multifaceted advantages regarding biosphere preservation and future-proof economic resilience justify prioritized state expenditure. It is imperative that global policymakers accelerate this structural paradigm shift before environmental damages become irreversible.
              </p>
            </div>

            <div style={{ padding: '10px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>{t('submissionDetails.wordCountPrefix')}<strong style={{ color: '#1E293B', fontWeight: 600 }}>285{t('submissionDetails.wordCountSuffix')}</strong></span>
              </div>
              <button style={{ color: '#2563EB', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <MessageSquare size={14} /> {t('submissionDetails.btnAddNote')}
              </button>
            </div>
          </div>

          {/* Right Column: AI Insights & Feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* AI Grading Insight */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(239, 246, 255, 0.8)', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1E3A8A', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#2563EB" /> {t('submissionDetails.aiSuggestionsTitle')}
                </span>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(191, 219, 254, 0.7)', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>{t('submissionDetails.aiConfidence')}94%</span>
              </div>
              <p style={{ color: '#334155', lineHeight: 1.6, fontSize: '11px', margin: 0 }}>
                "Bài viết có cấu trúc mở - thân - kết rất chặt chẽ, luận điểm rõ ràng và dẫn chứng thuyết phục. Sử dụng tự nhiên nhiều thuật ngữ chuyên đề (meteorological anomalies, paradigm shift). Điểm cần cải thiện: Lưu ý mạo từ ở câu đầu đoạn thân bài 2."
              </p>
            </div>

            {/* Feedback Editor */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <MessageSquare size={16} color="#475569" /> {t('submissionDetails.feedbackTitle')}
                </h3>
                <button style={{ fontSize: '12px', color: '#2563EB', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <List size={12} /> {t('submissionDetails.btnInsertTemplate')}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '6px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', border: '1px solid #E2E8F0', borderBottom: 'none', color: '#475569', fontSize: '12px' }}>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>B</button>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', fontStyle: 'italic', fontFamily: 'serif' }}>I</button>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>U</button>
                <span style={{ width: '1px', height: '16px', backgroundColor: '#CBD5E1', margin: '0 4px' }}></span>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><List size={14} /></button>
                <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ListOrdered size={14} /></button>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94A3B8' }}>{t('submissionDetails.draftSaving')}</span>
              </div>
              
              <textarea 
                style={{ 
                  width: '100%', fontSize: '12px', color: '#1E293B', borderColor: '#E2E8F0', 
                  borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', outline: 'none',
                  padding: '12px', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box'
                }} 
                placeholder={t('submissionDetails.feedbackPlaceholder')} 
                rows={5}
                defaultValue="Chào Alice, bài viết này em thể hiện vốn từ vựng học thuật rất tốt, đặc biệt là các thuật ngữ về môi trường & năng lượng tái tạo (TR & LR rất ấn tượng). Em duy trì phong độ này cho bài Task 1 tuần tới nhé! Cần lưu ý một chút về việc kiểm tra mạo từ hạn định (determiners) ở các câu phức."
              ></textarea>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', paddingTop: '4px' }}>
                <span>{t('submissionDetails.notificationHint')}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>238{t('submissionDetails.unitChars')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StickyActionBar 
        leftActions={
          <>
            <button className="btn btn-secondary border-none" style={{ color: '#475569' }}>
              {t('submissionDetails.btnDiscard')}
            </button>
            <button className="btn btn-secondary" style={{ backgroundColor: '#F1F5F9', color: '#334155' }}>
              <Save size={14} color="#64748B" /> {t('submissionDetails.btnSaveDraft')}
            </button>
          </>
        }
        rightActions={
          <button className="btn btn-primary" style={{ fontWeight: 700 }}>
            <Send size={16} /> {t('submissionDetails.btnSend')}
          </button>
        }
      />
    </div>
  );
};

export default TeacherSubmissionDetails;
