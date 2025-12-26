// Gauge component for displaying sensor values

'use client';

import * as React from 'react';

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Gauge({
  value,
  min,
  max,
  label,
  unit,
  warningThreshold,
  criticalThreshold,
  size = 'md',
}: GaugeProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const getColor = () => {
    if (criticalThreshold && value >= criticalThreshold) return 'text-red-500';
    if (warningThreshold && value >= warningThreshold) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBarColor = () => {
    if (criticalThreshold && value >= criticalThreshold) return 'bg-red-500';
    if (warningThreshold && value >= warningThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const sizeClasses = {
    sm: 'h-16',
    md: 'h-20',
    lg: 'h-24',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex flex-col ${sizeClasses[size]}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className={`${textSizes[size]} font-bold ${getColor()}`}>
          {value.toFixed(1)}
          <span className="ml-1 text-xs font-normal text-zinc-500">{unit}</span>
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-zinc-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
