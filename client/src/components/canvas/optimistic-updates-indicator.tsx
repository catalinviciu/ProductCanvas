import { memo } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface OptimisticUpdatesIndicatorProps {
  pendingUpdatesCount: number;
  isProcessingUpdates: boolean;
}

const OptimisticUpdatesIndicator = memo(function OptimisticUpdatesIndicator({
  pendingUpdatesCount,
  isProcessingUpdates
}: OptimisticUpdatesIndicatorProps) {
  if (pendingUpdatesCount === 0 && !isProcessingUpdates) {
    return null;
  }

  const getStatusConfig = () => {
    if (isProcessingUpdates) {
      return {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        message: 'Saving changes...'
      };
    }

    if (pendingUpdatesCount > 0) {
      return {
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        message: `${pendingUpdatesCount} changes pending`
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      message: 'All changes saved'
    };
  };

  const { icon: StatusIcon, color, bgColor, borderColor, message } = getStatusConfig();

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor} ${borderColor} shadow-sm transition-all duration-200`}>
      <StatusIcon className={`h-4 w-4 ${color} ${isProcessingUpdates ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${color}`}>
        {message}
      </span>
    </div>
  );
});

export { OptimisticUpdatesIndicator };