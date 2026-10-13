import { type ReactNode } from 'react';

export type StatusType = 
  | 'success' 
  | 'error' 
  | 'info' 
  | 'warning' 
  | 'neutral'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing';

interface StatusBadgeProps {
  status: StatusType;
  label: ReactNode;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge = ({ status, label, showDot = true, className = '' }: StatusBadgeProps) => {
  const isSkill = ['listening', 'speaking', 'reading', 'writing'].includes(status);
  
  if (isSkill) {
    return (
      <span className={`skill-badge ${status} ${className}`.trim()}>
        {label}
      </span>
    );
  }

  return (
    <span className={`status-badge ${status} ${className}`.trim()}>
      {showDot && <span className="status-badge-dot" />}
      {label}
    </span>
  );
};
