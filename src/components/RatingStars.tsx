import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showText?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 16,
  showText = false,
  count,
  interactive = false,
  onChange,
}) => {
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              className={`${
                interactive
                  ? 'cursor-pointer hover:scale-115 transition-transform'
                  : 'cursor-default'
              } p-0.5 text-amber-400`}
              aria-label={`Rate ${starValue} stars`}
            >
              <Star
                size={size}
                className={isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
              />
            </button>
          );
        })}
      </div>
      {showText && (
        <span className="text-sm font-semibold text-slate-700 ml-0.5">
          {rating.toFixed(1)}
          {count !== undefined && (
            <span className="text-slate-400 font-normal ml-1">({count})</span>
          )}
        </span>
      )}
    </div>
  );
};
