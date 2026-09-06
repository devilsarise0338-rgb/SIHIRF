import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="text-sm font-medium text-neutral-grey mb-4">
      Step {currentStep} of {totalSteps}
    </div>
  );
}

interface StatusBadgeProps {
  status: 'registered' | 'shortlisted' | 'rejected' | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'registered': return 'text-ink';
      case 'shortlisted': return 'text-pine font-medium';
      case 'rejected': return 'text-ember';
      default: return 'text-neutral-grey';
    }
  };

  return (
    <span className={`text-sm uppercase tracking-wider ${getStatusColor()}`}>
      {status}
    </span>
  );
}
