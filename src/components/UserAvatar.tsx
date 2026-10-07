import React, { useState, useEffect } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  shape?: 'rounded' | 'circle';
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  loading?: boolean;
  className?: string;
  alt?: string;
}

// Preset size configurations with responsive dimensions & typography
const SIZE_MAP: Record<AvatarSize, { dimension: string; text: string; dot: string; radius: string }> = {
  xs: { dimension: 'w-6 h-6', text: 'text-[10px] font-bold', dot: 'w-1.5 h-1.5', radius: 'rounded-lg' },
  sm: { dimension: 'w-8 h-8', text: 'text-xs font-bold', dot: 'w-2 h-2', radius: 'rounded-xl' },
  md: { dimension: 'w-10 h-10', text: 'text-sm font-bold', dot: 'w-2.5 h-2.5', radius: 'rounded-xl' },
  lg: { dimension: 'w-12 h-12', text: 'text-base font-bold', dot: 'w-3 h-3', radius: 'rounded-2xl' },
  xl: { dimension: 'w-16 h-16', text: 'text-xl font-extrabold', dot: 'w-3.5 h-3.5', radius: 'rounded-2xl' },
  '2xl': { dimension: 'w-24 h-24 sm:w-28 sm:h-28', text: 'text-2xl sm:text-3xl font-extrabold', dot: 'w-4 h-4', radius: 'rounded-3xl' },
};

// Distinct, aesthetic gradient palettes for initials fallback
const GRADIENTS = [
  'from-indigo-600 to-violet-600',
  'from-purple-600 to-indigo-700',
  'from-cyan-600 to-blue-600',
  'from-teal-600 to-emerald-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-600 to-fuchsia-600',
  'from-blue-600 to-cyan-500',
];

/**
 * Deterministically pick gradient based on the user's name
 */
function getGradientForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

/**
 * Extract clean 1 or 2 letter initials from a name or email
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'SS';

  const clean = name.trim();
  // Handle email addresses
  if (clean.includes('@')) {
    const handle = clean.split('@')[0];
    return handle.slice(0, 2).toUpperCase();
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  shape = 'rounded',
  showOnlineStatus = false,
  isOnline = true,
  loading = false,
  className = '',
  alt,
}) => {
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false);
    setLoaded(false);
  }, [src]);

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const borderRadius = shape === 'circle' ? 'rounded-full' : sizeConfig.radius;
  const initials = getInitials(name);
  const gradientClass = getGradientForName(name || 'SkillSwap');
  const displayName = name || 'User';

  // Skeleton loading state
  if (loading) {
    return (
      <div
        className={`relative shrink-0 ${sizeConfig.dimension} ${borderRadius} bg-slate-200 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  const hasValidImage = Boolean(src && src.trim() && !imageError);

  return (
    <div className={`relative inline-flex shrink-0 select-none ${sizeConfig.dimension} ${className}`}>
      {hasValidImage ? (
        <>
          <img
            src={src!}
            alt={alt || displayName}
            onLoad={() => setLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover ${borderRadius} shadow-xs transition-opacity duration-200 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {!loaded && (
            <div
              className={`absolute inset-0 flex items-center justify-center ${borderRadius} bg-gradient-to-tr ${gradientClass} text-white ${sizeConfig.text}`}
            >
              {initials}
            </div>
          )}
        </>
      ) : (
        /* Initials Fallback */
        <div
          className={`w-full h-full flex items-center justify-center ${borderRadius} bg-gradient-to-tr ${gradientClass} text-white shadow-xs ${sizeConfig.text}`}
          title={displayName}
        >
          <span>{initials}</span>
        </div>
      )}

      {/* Online Status Badge */}
      {showOnlineStatus && (
        <span
          className={`absolute bottom-0 right-0 ${sizeConfig.dot} rounded-full ring-2 ring-white ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
