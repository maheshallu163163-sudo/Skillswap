import React from 'react';
import { ExperienceLevel, SkillType } from '../types';

interface SkillBadgeProps {
  name: string;
  type?: SkillType;
  level?: ExperienceLevel;
  category?: string;
  onRemove?: () => void;
  className?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  name,
  type,
  level,
  onRemove,
  className = '',
}) => {
  const isTeach = type === 'teach';

  const levelColor = {
    Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Intermediate: 'bg-sky-50 text-sky-700 border-sky-200',
    Advanced: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Expert: 'bg-purple-50 text-purple-700 border-purple-200',
  }[level || 'Intermediate'];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
        isTeach
          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
          : type === 'learn'
          ? 'bg-cyan-50/70 border-cyan-200 text-cyan-900'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      } ${className}`}
    >
      <span className="font-semibold">{name}</span>

      {level && (
        <span
          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${levelColor}`}
        >
          {level}
        </span>
      )}

      {type && (
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
            isTeach ? 'bg-indigo-100 text-indigo-700' : 'bg-cyan-100 text-cyan-700'
          }`}
        >
          {isTeach ? 'Teach' : 'Learn'}
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 text-slate-400 hover:text-red-500 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
