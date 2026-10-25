import React from 'react';
import { CheckCircle2, Lock, Circle, Play, ChevronRight } from 'lucide-react';
import { Button } from '../common';
import {
  calculateExamSteps,
  type ExamModuleItem,
  type SubmissionModuleItem,
  type ExamStepInfo
} from '../../utils/examStepper.utils';
import '../../styles/exam-stepper.css';

export interface ExamStepperProps {
  modules: ExamModuleItem[];
  submissionModules?: SubmissionModuleItem[];
  currentSkill?: string;
  assignmentId: number | string;
  submissionId?: number;
  hasActiveAttempt?: boolean;
  canReviewCompleted?: boolean;
  variant?: 'overview' | 'compact';
  onSelectModule?: (skill: string, step: ExamStepInfo) => void;
  disabled?: boolean;
  isClosed?: boolean;
}

export const ExamStepper: React.FC<ExamStepperProps> = ({
  modules,
  submissionModules,
  currentSkill,
  assignmentId,
  submissionId,
  hasActiveAttempt,
  canReviewCompleted,
  variant = 'overview',
  onSelectModule,
  disabled = false,
  isClosed = false
}) => {
  const steps = calculateExamSteps(
    modules,
    submissionModules,
    currentSkill,
    assignmentId,
    submissionId,
    hasActiveAttempt
  );

  if (steps.length === 0) {
    return null;
  }

  const allowReviewCompleted = canReviewCompleted ?? !hasActiveAttempt;

  if (variant === 'compact') {
    return (
      <nav className="eh-stepper-compact" aria-label="Tiến trình làm bài thi">
        {steps.map((step, idx) => {
          const isCurrentSkill = step.status === 'ACTIVE';
          const isInteractive = Boolean(
            onSelectModule && !step.isCompleted && step.isAccessible && !isCurrentSkill && !disabled
          );

          const handleClick = () => {
            if (isInteractive && onSelectModule) {
              onSelectModule(step.module.skill, step);
            }
          };

          const stepTitle =
            step.status === 'LOCKED'
              ? `Phần ${step.index + 1}: Cần hoàn thành phần thi trước`
              : step.status === 'COMPLETED'
              ? `Phần ${step.index + 1}: ${step.skillName} (Đã hoàn thành)`
              : step.status === 'ACTIVE'
              ? `Phần ${step.index + 1}: ${step.skillName} (Đang làm)`
              : `Phần ${step.index + 1}: ${step.skillName}`;

          return (
            <React.Fragment key={step.module.id || idx}>
              {idx > 0 && (
                <span className="eh-stepper-compact-separator" aria-hidden="true">
                  <ChevronRight size={14} />
                </span>
              )}
              <button
                type="button"
                className={`eh-stepper-compact-step ${step.status.toLowerCase()} ${isInteractive ? 'interactive' : ''}`}
                onClick={handleClick}
                disabled={!isInteractive}
                title={stepTitle}
              >
                {step.status === 'COMPLETED' ? (
                  <CheckCircle2 size={14} />
                ) : step.status === 'LOCKED' ? (
                  <Lock size={13} />
                ) : step.status === 'ACTIVE' ? (
                  <Play size={13} />
                ) : (
                  <Circle size={13} />
                )}
                <span>
                  {step.index + 1}. {step.skillName.split(' ')[0]}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    );
  }

  // Default: Overview Variant
  return (
    <div className="eh-stepper-overview">
      <div className="eh-stepper-track">
        {steps.map((step) => {
          const isInteractive =
            ((step.isCompleted && allowReviewCompleted) || (!step.isCompleted && step.isAccessible)) &&
            !disabled;
          const isLocked = step.status === 'LOCKED';

          const handleAction = () => {
            if (onSelectModule && isInteractive) {
              onSelectModule(step.module.skill, step);
            }
          };

          return (
            <div
              key={step.module.id || step.index}
              className={`eh-stepper-step-card ${step.status.toLowerCase()}`}
            >
              <div className="eh-stepper-step-top">
                <span className={`eh-stepper-step-badge ${step.status.toLowerCase()}`}>
                  {step.status === 'COMPLETED' ? (
                    <>
                      <CheckCircle2 size={13} />
                      Đã hoàn thành
                    </>
                  ) : step.status === 'ACTIVE' ? (
                    <>
                      <Play size={13} />
                      Đang làm
                    </>
                  ) : step.status === 'LOCKED' ? (
                    <>
                      <Lock size={13} />
                      Chưa mở
                    </>
                  ) : (
                    <>
                      <Circle size={13} />
                      Sẵn sàng
                    </>
                  )}
                </span>
                <span className="eh-stepper-step-number">Phần {step.index + 1}/{steps.length}</span>
              </div>

              <div className="eh-stepper-step-main">
                <h4 className="eh-stepper-step-title">{step.skillName}</h4>
                <div className="eh-stepper-step-skill-tag">
                  {isLocked
                    ? `Mở sau khi hoàn thành Phần ${step.index}`
                    : step.isCompleted
                    ? allowReviewCompleted
                      ? 'Có thể xem lại bài làm'
                      : 'Đã nộp phần thi này'
                    : 'Bắt buộc hoàn thành để tiếp tục'}
                </div>
              </div>

              <div className="eh-stepper-step-action">
                {step.isCompleted ? (
                  allowReviewCompleted ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAction}
                      disabled={disabled}
                    >
                      Xem lại
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      icon={CheckCircle2}
                    >
                      Đã hoàn thành
                    </Button>
                  )
                ) : isLocked ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    icon={Lock}
                    title={`Vui lòng hoàn thành Phần ${step.index} trước`}
                  >
                    Chưa mở
                  </Button>
                ) : isClosed ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                  >
                    Đã đóng
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAction}
                    disabled={disabled}
                    icon={Play}
                  >
                    {step.status === 'ACTIVE' ? 'Tiếp tục làm' : 'Bắt đầu làm'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
