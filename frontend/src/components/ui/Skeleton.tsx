'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton Loading Component
 * Displays a loading placeholder with animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  );
}

/**
 * Skeleton Text Component
 * Displays multiple lines of skeleton text
 */
export function SkeletonText({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index} 
          className={cn(
            'h-4',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Card Component
 * Displays a card-shaped skeleton
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 p-4 space-y-4', className)}>
      <Skeleton className="h-8 w-2/3" />
      <SkeletonText lines={2} />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * Skeleton Stats Card Component
 * Displays a statistics card skeleton
 */
export function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Avatar Component
 * Displays a circular avatar skeleton
 */
export function SkeletonAvatar({ 
  size = 'md',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Skeleton 
      className={cn('rounded-full', sizeClasses[size], className)} 
    />
  );
}

/**
 * Skeleton Table Row Component
 * Displays a table row skeleton
 */
export function SkeletonTableRow({ 
  columns = 4,
  className 
}: { 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4 p-4 border-b border-gray-100', className)}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton 
          key={index} 
          className={cn(
            'h-4',
            index === 0 ? 'w-8' : 'flex-1'
          )} 
        />
      ))}
    </div>
  );
}

export default Skeleton;

