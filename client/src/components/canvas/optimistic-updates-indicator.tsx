import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimisticUpdatesIndicatorProps {
  saveStatus: 'idle' | 'pending' | 'success' | 'error';
  hasUnsavedChanges: boolean;
  pendingCount: number;
  className?: string;
}

export function OptimisticUpdatesIndicator({
  saveStatus,
  hasUnsavedChanges,
  pendingCount,
  className
}: OptimisticUpdatesIndicatorProps) {
  // Don't show anything if idle with no unsaved changes
  if (saveStatus === 'idle' && !hasUnsavedChanges) {
    return null;
  }

  const getStatusConfig = () => {
    switch (saveStatus) {
      case 'pending':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: pendingCount > 0 ? `Saving ${pendingCount} changes...` : 'Saving...',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'All changes saved',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Failed to save changes',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: `${pendingCount} unsaved changes`,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
    }
  };

  const { icon, text, bgColor, textColor, borderColor } = getStatusConfig();

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
        bgColor,
        textColor,
        borderColor,
        'shadow-lg backdrop-blur-sm',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}