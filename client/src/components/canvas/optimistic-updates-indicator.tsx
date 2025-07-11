import React from 'react';
import { CheckCircle, Loader2, Clock, AlertCircle, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface OptimisticUpdatesIndicatorProps {
  pendingCount: number;
  errorCount: number;
  isSaving: boolean;
  lastSaved: Date | null;
  className?: string;
}

export function OptimisticUpdatesIndicator({ 
  pendingCount, 
  errorCount,
  isSaving, 
  lastSaved,
  className 
}: OptimisticUpdatesIndicatorProps) {
  // Error state
  if (errorCount > 0) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md",
        className
      )}>
        <AlertCircle className="w-4 h-4" />
        <span>{errorCount} failed to save</span>
      </div>
    );
  }

  // Saving state
  if (isSaving) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md",
        className
      )}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Saving {pendingCount} changes...</span>
      </div>
    );
  }

  // Pending state
  if (pendingCount > 0) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md",
        className
      )}>
        <Clock className="w-4 h-4" />
        <span>{pendingCount} changes pending</span>
      </div>
    );
  }

  // Saved state
  if (lastSaved) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md",
        className
      )}>
        <CheckCircle className="w-4 h-4" />
        <span>Saved {formatDistanceToNow(lastSaved)} ago</span>
      </div>
    );
  }

  // No status to show
  return null;
}

interface DetailedSaveStatusProps {
  pendingCount: number;
  errorCount: number;
  isSaving: boolean;
  lastSaved: Date | null;
  pendingNodeIds: string[];
  errorNodeIds: string[];
  onRetry?: () => void;
  onClear?: () => void;
}

export function DetailedSaveStatus({
  pendingCount,
  errorCount,
  isSaving,
  lastSaved,
  pendingNodeIds,
  errorNodeIds,
  onRetry,
  onClear
}: DetailedSaveStatusProps) {
  if (pendingCount === 0 && errorCount === 0 && !isSaving) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">Save Status</h3>
        {lastSaved && (
          <span className="text-xs text-gray-500">
            Last saved {formatDistanceToNow(lastSaved)} ago
          </span>
        )}
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Saving {pendingCount} changes...</span>
        </div>
      )}

      {/* Pending changes */}
      {pendingCount > 0 && !isSaving && (
        <div className="flex items-center gap-2 text-yellow-600 mb-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{pendingCount} changes pending</span>
        </div>
      )}

      {/* Error status */}
      {errorCount > 0 && (
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errorCount} failed to save</span>
        </div>
      )}

      {/* Actions */}
      {(errorCount > 0 || pendingCount > 0) && (
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry Now
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Pending
            </button>
          )}
        </div>
      )}
    </div>
  );
}