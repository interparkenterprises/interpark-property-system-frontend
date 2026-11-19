import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive';
}

export const Alert: React.FC<AlertProps> = ({
  children,
  className = '',
  variant = 'default',
}) => {
  const variantClasses =
    variant === 'destructive'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-gray-200 bg-gray-50 text-gray-800';

  return (
    <div
      role="alert"
      className={`rounded-md border px-4 py-3 text-sm ${variantClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`leading-relaxed ${className}`}>{children}</div>;
};