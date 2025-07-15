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
  // Determine badge border color based on score (aligned with side drawer)
  const getScoreColor = (score: number, type: string) => {
    if (type === 'ICE') {
      // ICE thresholds: <15 red, <60 yellow, ≥60 green
      if (score < 15) return 'border-red-500 text-red-700';
      if (score < 60) return 'border-yellow-500 text-yellow-700';
      return 'border-green-500 text-green-700';
    } else {
      // RICE thresholds: <1 red, <5 yellow, ≥5 green
      if (score < 1) return 'border-red-500 text-red-700';
      if (score < 5) return 'border-yellow-500 text-yellow-700';
      return 'border-green-500 text-green-700';
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