import { useState } from 'react';
import { Link } from 'react-router-dom';
import Step1PersonalInfo from '../components/students/AddStudent/Step1PersonalInfo';
import Step2Account from '../components/students/AddStudent/Step2Account';
import Step3LevelAndTarget from '../components/students/AddStudent/Step3LevelAndTarget';
import Step4ClassRegistration from '../components/students/AddStudent/Step4ClassRegistration';
import { useLanguage } from '../contexts/LanguageContext';

const AddStudent = () => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div>
      <div className="pb-24">
        <Link to="/admin/students" className="back-link">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
           {t('addStudent.backToList')}
        </Link>
        <div className="flex-between-start">
          <div>
            <h1 className="display-lg page-title-with-step">
               {t('addStudent.title')}
               <span className="step-counter">{t('addClass.stepProgressPrefix')}{currentStep}/4</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="card p-24 mb-24">
         <div className="stepper">
            <div className="stepper-line stepper-line-4step"></div>
            
            {[
               { id: 1, label: t('addStudent.step1'), status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending' },
               { id: 2, label: t('addStudent.step2'), status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending' },
               { id: 3, label: t('addStudent.step3'), status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending' },
               { id: 4, label: t('addStudent.step4'), status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'pending' },
            ].map(step => (
               <div key={step.id} className="stepper-item stepper-item-4">
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
         {currentStep === 1 && <Step1PersonalInfo />}
         {currentStep === 2 && <Step2Account />}
         {currentStep === 3 && <Step3LevelAndTarget />}
         {currentStep === 4 && <Step4ClassRegistration />}
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
               {currentStep < 4 ? (currentStep === 1 ? t('addStudent.btnNextStep2') : currentStep === 2 ? t('addStudent.btnNextStep3') : t('addStudent.btnNextStep4')) : t('addStudent.btnFinish')}
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
         </div>
      </div>
    </div>
  );
};

export default AddStudent;
