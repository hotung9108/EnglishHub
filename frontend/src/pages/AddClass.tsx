import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Step1ClassInfo from '../components/classes/AddClass/Step1ClassInfo';
import Step2AssignTeacher from '../components/classes/AddClass/Step2AssignTeacher';
import Step3AddStudents from '../components/classes/AddClass/Step3AddStudents';
import { useLanguage } from '../contexts/LanguageContext';

const AddClass = () => {
  const { t } = useLanguage();
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
      <div className="pb-24">
        <Link to="/admin/classes" className="back-link">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
           {t('addClass.backToList')}
        </Link>
        <div className="flex-between-start">
          <div>
            <h1 className="display-lg page-title-with-step">
               {t('addClass.title')}
               <span className="step-counter">{t('addClass.stepProgressPrefix')}{currentStep}/3</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="card p-24 mb-24">
         <div className="stepper">
            <div className="stepper-line stepper-line-3step"></div>
            
            {[
               { id: 1, label: t('addClass.step1'), status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending' },
               { id: 2, label: t('addClass.step2'), status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending' },
               { id: 3, label: t('addClass.step3'), status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending' },
            ].map(step => (
               <div key={step.id} className="stepper-item stepper-item-3">
                  <div className={`stepper-circle stepper-circle-${step.status}`}>
                     {step.status === 'completed' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : step.id}
                  </div>
                  <div className="text-center">
                     <p className={`stepper-status stepper-status-${step.status}`}>
                        {t('addClass.stepPrefix')}{step.id}{step.status === 'completed' ? t('addClass.stepCompleted') : step.status === 'current' ? t('addClass.stepCurrent') : ''}
                     </p>
                     <p className={`label-md ${step.status === 'pending' ? 'stepper-label-pending' : 'stepper-label-active'}`}>
                        {step.label}
                     </p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Content */}
      <div className="mb-32">
         {currentStep === 1 && <Step1ClassInfo />}
         {currentStep === 2 && <Step2AssignTeacher />}
         {currentStep === 3 && <Step3AddStudents />}
      </div>

      {/* Footer Actions */}
      <div className="card p-24 flex-between">
         <button className="btn btn-secondary" onClick={handlePrev} disabled={currentStep === 1} style={{ opacity: currentStep === 1 ? 0.5 : 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            {t('addClass.btnBack')}
         </button>
         <div className="flex gap-16">
            <button className="btn btn-draft">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
               {t('addClass.btnSaveDraft')}
            </button>
            <button className="btn btn-primary" onClick={handleNext}>
               {currentStep < 3 ? (currentStep === 1 ? t('addClass.btnNextStep2') : t('addClass.btnNextStep3')) : t('addClass.btnCreateClass')}
               {currentStep < 3 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
            </button>
         </div>
      </div>
    </div>
  );
};

export default AddClass;
