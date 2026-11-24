import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  circle?: boolean;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className = '',
  circle = false,
  borderRadius
}) => {
  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : '16px',
    borderRadius: circle ? '50%' : (borderRadius !== undefined ? (typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius) : undefined)
  };

  return <div className={`eh-skeleton ${className}`.trim()} style={style} />;
};
