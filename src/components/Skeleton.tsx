import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div className={twMerge(clsx("animate-pulse bg-gray-200", className))} />
  );
}
