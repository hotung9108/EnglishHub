import { type ReactNode } from 'react';

interface StickyActionBarProps {
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}

export const StickyActionBar = ({ leftActions, rightActions }: StickyActionBarProps) => {
  return (
    <div className="sticky-action-bar">
      <div className="flex items-center gap-12">
        {leftActions}
      </div>
      <div className="flex items-center gap-12">
        {rightActions}
      </div>
    </div>
  );
};
