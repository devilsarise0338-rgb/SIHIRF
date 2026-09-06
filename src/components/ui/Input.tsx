import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`border bg-transparent px-3 py-2 outline-none focus:border-pine placeholder:text-neutral-grey
            ${error ? 'border-ember' : 'border-neutral-grey/30'}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-sm text-ember">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
