import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface LoadingStateProps {
  title?: string;
  description?: string;
  minHeight?: string | number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title,
  description,
  minHeight = '240px',
  className = '',
}) => {
  return (
    <div 
      className={`eh-loading-card ${className}`.trim()} 
      style={{ minHeight }} 
      role="status"
      aria-live="polite"
    >
      <div className="eh-loading-icon-wrap">
        <RefreshCw size={24} className="animate-spin text-primary" />
      </div>
      {title && <h3 className="eh-loading-title">{title}</h3>}
      {description && <p className="eh-loading-desc">{description}</p>}
    </div>
  );
};

export default LoadingState;
