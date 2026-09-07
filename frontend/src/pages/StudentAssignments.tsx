import React from 'react';

const StudentAssignments = () => {
  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Xem trạng thái bài làm</h1>
            <span style={{ 
              backgroundColor: 'var(--surface-container-low)', 
              color: '#2563EB', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-full)',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #BFDBFE'
            }}>Lớp: ENG-IELTS-6.5A</span>
          </div>
          <p className="body-md text-on-surface-variant">
            Học Viên Làm Bài • Theo dõi tiến trình bài tập của mình theo từng trạng thái và nhận kết quả chấm.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ backgroundColor: 'transparent', border: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>↻</span> Làm mới tiến trình
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>+</span> Nộp bài tập mới
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ padding: '32px', border: '1px solid var(--outline-variant)', boxShadow: 'none', backgroundColor: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px', fontSize: '20px' }}>Bảng trạng thái bài tập của bạn</h3>
            <p className="body-md text-on-surface-variant">
              Khóa học: IELTS Intensive Band 6.5 - 7.5 • GV phụ trách: ThS. Trần Thị Mai Lan
            </p>
          </div>
          <div className="body-md text-on-surface-variant">
            Tổng số bài tập đã giao: <strong style={{ color: 'var(--on-surface)' }}>15 bài</strong>
          </div>
        </div>

        {/* Status Summary Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {/* Chưa làm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>Chưa làm</span>
            <span style={{ backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>1</span>
          </div>
          {/* Chờ chấm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '2px solid #FBBF24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></span>
              Chờ chấm
            </span>
            <span style={{ backgroundColor: '#FDE68A', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#D97706' }}>2</span>
          </div>
          {/* AI Đang xử lý */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>✧</span>
              AI Đang xử lý
            </span>
            <span style={{ backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>1</span>
          </div>
          {/* Đã có điểm */}
          <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#16A34A' }}>Đã có điểm</span>
            <span style={{ backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>11</span>
          </div>
        </div>

        {/* Assignments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Assignment 1: Đang chấm điểm */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>HW-01: Renewable Energy Essay (Writing Task 2)</h4>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 Nộp ngày: 04/09/2026</span>
                <span>•</span>
                <span>Giảng viên: Cô Mai Lan</span>
                <span>•</span>
                <span>Hạn chót: 05/09/2026</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '14px', fontWeight: 500, padding: '6px 12px', backgroundColor: '#FFFBEB', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '16px' }}>🕒</span> Đang chấm điểm
              </div>
              <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid var(--outline-variant)', padding: '8px 16px', fontSize: '14px' }}>
                Xem lại bài nộp
              </button>
            </div>
          </div>

          {/* Assignment 2: AI Grading */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>HW-02: Technology Cue Card (Speaking Part 2)</h4>
                <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #C7D2FE' }}>Audio MP3</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 Nộp ngày: 04/09/2026</span>
                <span>•</span>
                <span>AI Pronunciation & Fluency Engine</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#EFF6FF', padding: '6px 16px', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                <div style={{ width: '60px', height: '6px', backgroundColor: '#DBEAFE', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', backgroundColor: '#2563EB' }}></div>
                </div>
                <span style={{ color: '#2563EB', fontSize: '14px', fontWeight: 600 }}>AI Grading: 85%</span>
              </div>
              <button className="btn btn-secondary" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '8px 16px', fontSize: '14px' }}>
                Chi tiết xử lý
              </button>
            </div>
          </div>

          {/* Assignment 3: Đã chấm */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>HW-03: Maya Civilization Reading Passage</h4>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✓ Hoàn thành: 03/09/2026</span>
                <span>•</span>
                <span>Độ chính xác: 38/40 câu đúng</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '14px', fontWeight: 600, padding: '6px 12px', backgroundColor: '#F0FDF4', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
                <span>✓</span> Đã chấm: 9.0/10
              </div>
              <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid #BBF7D0', color: '#16A34A', padding: '8px 16px', fontSize: '14px' }}>
                Xem Feedback & Bài chữa
              </button>
            </div>
          </div>

          {/* Assignment 4: Đã chấm */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface)' }}>HW-04: Academic Vocabulary Listening Mock Test</h4>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✓ Hoàn thành: 01/09/2026</span>
                <span>•</span>
                <span>Độ chính xác: 36/40 câu đúng</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '14px', fontWeight: 600, padding: '6px 12px', backgroundColor: '#F0FDF4', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
                <span>✓</span> Đã chấm: 8.5/10
              </div>
              <button className="btn btn-secondary" style={{ backgroundColor: 'white', border: '1px solid #BBF7D0', color: '#16A34A', padding: '8px 16px', fontSize: '14px' }}>
                Xem Feedback & Bài chữa
              </button>
            </div>
          </div>

          {/* Assignment 5: Chưa làm */}
          <div style={{ padding: '20px', borderRadius: '8px', border: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>HW-05: Environment Problem Solution Discussion (Speaking)</h4>
                <span style={{ backgroundColor: '#FEF2F2', color: '#EF4444', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>Sắp hết hạn</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#EF4444', fontWeight: 500 }}>Hạn nộp: 08/09/2026 (Còn 2 ngày)</span>
                <span>•</span>
                <span>Yêu cầu: Ghi âm tối thiểu 2 phút</span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ color: '#64748B', fontSize: '14px', fontWeight: 500, padding: '6px 16px', backgroundColor: '#E2E8F0', borderRadius: '4px' }}>
                Chưa làm
              </div>
              <button className="btn btn-primary" style={{ backgroundColor: '#2563EB', padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Bắt đầu làm bài <span>→</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
        <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
          Hiển thị <strong>5</strong> trên tổng số <strong>15</strong> bài tập đã giao <span style={{ margin: '0 8px' }}>•</span> <a href="#" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>Xem tất cả bài tập cũ</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981', fontWeight: 500 }}>
          <span style={{ border: '1px solid #10B981', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px' }}>✓</span> Hệ thống chấm điểm AI & Đồng bộ tự động 10 giây trước
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;
