import React from 'react';

type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: string;
};

export function Button({ variant = 'primary', size, className = '', children, ...props }: ButtonProps) {
  const base = "px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:   "bg-pine text-white hover:bg-pine/90",
    secondary: "bg-transparent border border-pine text-pine hover:bg-pine/5",
    ghost:     "bg-transparent text-neutral-grey hover:text-ink hover:bg-black/5",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
