import React from 'react';
import { FileText, Download } from 'lucide-react';

const TabAssignments = () => {
  const assignments = [
    { id: 1, title: 'Homework: True/False/Not Given Practice', deadline: '17/10/2024 23:59', submitted: 0, total: 24, status: 'Đang mở' },
    { id: 2, title: 'Mock Test Mini: Listening Section 3', deadline: '14/10/2024 23:59', submitted: 22, total: 24, status: 'Đã đóng' },
    { id: 3, title: 'Speaking Recording Part 2', deadline: '12/10/2024 23:59', submitted: 24, total: 24, status: 'Đã chấm điểm' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 className="headline-sm">Bài tập & Đánh giá</h3>
        <button className="btn btn-primary">Tạo bài tập mới</button>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {assignments.map(ass => (
          <div key={ass.id} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#EEF2FF', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#4F46E5' }}>
              <FileText size={24} />
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{ass.title}</h4>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>Hạn nộp: <span style={{ color: '#374151', fontWeight: '500' }}>{ass.deadline}</span></p>
            </div>

            <div style={{ width: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: '#4B5563' }}>Tỷ lệ nộp bài</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>{ass.submitted}/{ass.total}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(ass.submitted / ass.total) * 100}%`, backgroundColor: ass.submitted === ass.total ? '#10B981' : '#3B82F6', borderRadius: '3px' }}></div>
              </div>
            </div>

            <div style={{ width: '120px', textAlign: 'right' }}>
              <span style={{ 
                backgroundColor: ass.status === 'Đang mở' ? '#D1FAE5' : ass.status === 'Đã đóng' ? '#FEE2E2' : '#E0E7FF',
                color: ass.status === 'Đang mở' ? '#065F46' : ass.status === 'Đã đóng' ? '#991B1B' : '#3730A3',
                padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' 
              }}>
                {ass.status}
              </span>
            </div>

            <div>
               <button className="btn" style={{ padding: '8px', border: '1px solid #D1D5DB', backgroundColor: 'transparent', color: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                  <Download size={16} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabAssignments;
