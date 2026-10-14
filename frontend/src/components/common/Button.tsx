import React, { type ButtonHTMLAttributes, type ReactNode, type ElementType, isValidElement } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'error';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode | ElementType;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const variantClass = variant === 'danger' || variant === 'error' ? 'btn-danger' : `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  const classes = [
    'btn',
    variantClass,
    sizeClass,
    loading ? 'opacity-80 cursor-not-allowed' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    const IconComponent = icon as ElementType;
    return <IconComponent size={size === 'sm' ? 14 : 16} />;
  };

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />}
      {!loading && icon && iconPosition === 'left' && renderIcon()}
      {children}
      {!loading && icon && iconPosition === 'right' && renderIcon()}
    </button>
  );
};
