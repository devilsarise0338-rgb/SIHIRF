import React, { useEffect, useState } from 'react';

interface LiveCounterProps {
  value: number;
  label?: string;
  size?: 'large' | 'small';
}

export function LiveCounter({ value, label, size = 'large' }: LiveCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 300); // match transition duration
      
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  const textSize = size === 'large' ? 'text-6xl md:text-8xl' : 'text-3xl md:text-4xl';

  return (
    <div className="flex flex-col items-start">
      <div 
        className={`font-display font-medium text-pine transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'} ${textSize}`}
      >
        {displayValue}
      </div>
      {label && <div className="text-sm font-medium text-neutral-grey uppercase tracking-widest mt-2">{label}</div>}
    </div>
  );
}
