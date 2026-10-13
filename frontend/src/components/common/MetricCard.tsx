import { type ReactNode, type ElementType, isValidElement } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon: ReactNode | ElementType;
  iconBgColor?: string;
  iconColor?: string;
  footerText?: ReactNode;
  isSecondary?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  value,
  suffix,
  icon,
  iconBgColor,
  iconColor,
  footerText,
  isSecondary,
  className = '',
  onClick
}: MetricCardProps) => {
  const cardClasses = [
    'metric-card',
    isSecondary ? 'bg-surface-low' : '',
    onClick ? 'cursor-pointer hover-card' : '',
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    const IconComponent = icon as ElementType;
    return <IconComponent size={20} />;
  };

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex justify-between items-start">
        <span className="metric-title">{title}</span>
        <div 
          className="metric-icon-wrap"
          style={{
            backgroundColor: iconBgColor,
            color: iconColor
          }}
        >
          {renderIcon()}
        </div>
      </div>
      <div className="metric-value-wrap">
        <span className="metric-value">{value}</span>
        {suffix && <span className="metric-suffix">{suffix}</span>}
      </div>
      {footerText && (
        <div className="metric-footer">
          {footerText}
        </div>
      )}
    </div>
  );
};
