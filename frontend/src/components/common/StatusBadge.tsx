type StatusType = 'success' | 'error' | 'info' | 'warning';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  showDot?: boolean;
}

export const StatusBadge = ({ status, label, showDot = true }: StatusBadgeProps) => {
  return (
    <span className={`status-badge ${status}`}>
      {showDot && <span className="status-badge-dot" />}
      {label}
    </span>
  );
};
