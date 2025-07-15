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
  // Determine badge color based on score
  const getScoreColor = (score: number, type: string) => {
    if (type === 'ICE') {
      // ICE scores: 0-27 range (3 * 3 * 3), normalize to 0-10
      const normalizedScore = (score / 27) * 10;
      if (normalizedScore >= 7) return 'bg-green-500 text-white';
      if (normalizedScore >= 4) return 'bg-yellow-500 text-white';
      return 'bg-red-500 text-white';
    } else {
      // RICE scores: variable scale, use relative thresholds
      if (score >= 10) return 'bg-green-500 text-white';
      if (score >= 5) return 'bg-yellow-500 text-white';
      return 'bg-red-500 text-white';
    }
  };

  const colorClass = getScoreColor(score, type);
  const displayScore = type === 'ICE' ? score.toFixed(1) : score.toFixed(0);

  return (
    <div 
      className={cn(
        'absolute bottom-1 left-1 px-2 py-1 rounded-md text-xs font-medium',
        'shadow-sm border border-white/20',
        'transition-all duration-200',
        colorClass,
        className
      )}
    >
      {type}: {displayScore}
    </div>
  );
};