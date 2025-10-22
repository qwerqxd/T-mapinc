'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  starClassName?: string;
}

export function StarRating({
  rating,
  interactive = false,
  onRatingChange,
  className,
  starClassName,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index);
    }
  };

  const handleStarHover = (index: number) => {
    if (interactive) {
      setHoverRating(index);
    }
  };

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={() => interactive && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        const fillValue = hoverRating > 0 ? hoverRating : rating;
        return (
          <Star
            key={index}
            className={cn(
              'h-5 w-5',
              fillValue >= index
                ? 'text-accent fill-accent'
                : 'text-muted-foreground/50',
              interactive && 'cursor-pointer transition-transform hover:scale-125',
              starClassName
            )}
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => handleStarHover(index)}
          />
        );
      })}
    </div>
  );
}
