import React, { type ReactNode, type ElementType, isValidElement } from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode | ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  const renderIcon = () => {
    if (!icon) return <Inbox size={24} />;
    if (isValidElement(icon)) return icon;
    const IconComponent = icon as ElementType;
    return <IconComponent size={24} />;
  };

  return (
    <div className={`eh-empty-state ${className}`.trim()}>
      <div className="eh-empty-icon">
        {renderIcon()}
      </div>
      <h3 className="eh-empty-title">{title}</h3>
      {description && <p className="eh-empty-desc">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
