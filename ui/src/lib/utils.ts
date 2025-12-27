// Utility functions

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours.toFixed(0)}h`;
}
