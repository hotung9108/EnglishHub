import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Step1ClassInfo from '../components/classes/AddClass/Step1ClassInfo';
import Step2AssignTeacher from '../components/classes/AddClass/Step2AssignTeacher';
import Step3AddStudents from '../components/classes/AddClass/Step3AddStudents';

const AddClass = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
    else navigate('/admin/classes'); // redirect after completion
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div>
      <div style={{ padding: '0 0 24px 0' }}>
        <Link to="/admin/classes" style={{ color: '#4B5563', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '16px', textDecoration: 'none' }}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
           Quay lại danh sách lớp học
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="display-lg" style={{ fontSize: '32px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               Tạo lớp học mới
               <span style={{ fontSize: '16px', fontWeight: '400', color: '#6B7280' }}>• Bước {currentStep}/3</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', left: '16%', right: '16%', height: '2px', backgroundColor: '#E5E7EB', zIndex: 0 }}></div>
            
            {[
               { id: 1, label: 'Thông tin lớp học', status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending' },
               { id: 2, label: 'Phân công giáo viên', status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending' },
               { id: 3, label: 'Thêm học viên', status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending' },
            ].map(step => (
               <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '33.33%' }}>
                  <div style={{ 
                     width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                     backgroundColor: step.status === 'completed' ? '#34D399' : step.status === 'current' ? '#2563EB' : '#F3F4F6',
                     color: step.status === 'completed' ? 'white' : step.status === 'current' ? 'white' : '#9CA3AF',
                     fontWeight: '600', marginBottom: '8px'
                  }}>
                     {step.status === 'completed' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : step.id}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                     <p style={{ fontSize: '10px', fontWeight: '600', color: step.status === 'completed' ? '#059669' : step.status === 'current' ? '#1D4ED8' : '#9CA3AF', textTransform: 'uppercase' }}>
                        BƯỚC {step.id} • {step.status === 'completed' ? 'HOÀN THÀNH' : step.status === 'current' ? 'ĐANG ĐIỀN' : ''}
                     </p>
                     <p className="label-md" style={{ color: step.status === 'pending' ? '#9CA3AF' : '#111827', fontWeight: step.status === 'current' ? '700' : '500' }}>
                        {step.label}
                     </p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Content */}
      <div style={{ marginBottom: '32px' }}>
         {currentStep === 1 && <Step1ClassInfo />}
         {currentStep === 2 && <Step2AssignTeacher />}
         {currentStep === 3 && <Step3AddStudents />}
      </div>

      {/* Footer Actions */}
      <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <button className="btn btn-secondary" onClick={handlePrev} disabled={currentStep === 1} style={{ opacity: currentStep === 1 ? 0.5 : 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Quay lại
         </button>
         <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--radius-default)', fontWeight: '500' }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
               Lưu nháp
            </button>
            <button className="btn btn-primary" onClick={handleNext}>
               {currentStep < 3 ? `Tiếp theo: ${currentStep === 1 ? 'Phân công giáo viên' : 'Thêm học viên'}` : 'Tạo lớp học'}
               {currentStep < 3 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
            </button>
         </div>
      </div>
    </div>
  );
};

export default AddClass;
