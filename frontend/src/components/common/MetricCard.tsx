import { type ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  footerText?: ReactNode;
  isSecondary?: boolean;
}

export const MetricCard = ({
  title,
  value,
  suffix,
  icon,
  iconBgColor = 'var(--primary-container)',
  iconColor = 'var(--primary)',
  footerText,
  isSecondary
}: MetricCardProps) => {
  return (
    <div className="metric-card" style={isSecondary ? { backgroundColor: 'var(--surface-container-low)' } : {}}>
      <div className="metric-card-header">
        <span>{title}</span>
        <div className="metric-card-icon" style={{ backgroundColor: iconBgColor, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="metric-card-value">
        <span className="metric-card-number">{value}</span>
        {suffix && <span className="metric-card-suffix">{suffix}</span>}
      </div>
      {footerText && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
          {footerText}
        </div>
      )}
    </div>
  );
};
