import { memo } from 'react';
import { Move, CheckCircle } from 'lucide-react';

interface DragFeedbackIndicatorProps {
  isDragging: boolean;
  className?: string;
}

const DragFeedbackIndicator = memo(function DragFeedbackIndicator({
  isDragging,
  className = ''
}: DragFeedbackIndicatorProps) {
  if (!isDragging) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 shadow-sm transition-all duration-200 ${className}`}>
      <Move className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-700">
        Moving nodes... Release to save
      </span>
    </div>
  );
});

export { DragFeedbackIndicator };