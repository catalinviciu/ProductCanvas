import React from 'react';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  type: 'ICE' | 'RICE';
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ 
  score, 
  type, 
  className 
}) => {
  // Determine badge border color based on score
  const getScoreColor = (score: number, type: string) => {
    if (type === 'ICE') {
      // ICE scores: 0-27 range (3 * 3 * 3), normalize to 0-10
      const normalizedScore = (score / 27) * 10;
      if (normalizedScore >= 7) return 'border-green-500 text-green-700';
      if (normalizedScore >= 4) return 'border-yellow-500 text-yellow-700';
      return 'border-red-500 text-red-700';
    } else {
      // RICE scores: variable scale, use relative thresholds
      if (score >= 10) return 'border-green-500 text-green-700';
      if (score >= 5) return 'border-yellow-500 text-yellow-700';
      return 'border-red-500 text-red-700';
    }
  };

  const colorClass = getScoreColor(score, type);
  const displayScore = type === 'ICE' ? score.toFixed(1) : score.toFixed(0);

  return (
    <div 
      className={cn(
        'absolute bottom-1 left-1 px-2 py-1 rounded-md text-xs font-medium',
        'bg-white/90 backdrop-blur-sm shadow-sm border-2',
        'transition-all duration-200',
        colorClass,
        className
      )}
    >
      {type}: {displayScore}
    </div>
  );
};