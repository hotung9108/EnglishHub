import { type ReactNode } from 'react';

interface StickyActionBarProps {
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

export const StickyActionBar = ({ leftActions, rightActions }: StickyActionBarProps) => {
  return (
    <div className="sticky-action-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {leftActions}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {rightActions}
      </div>
    </div>
  );
};
