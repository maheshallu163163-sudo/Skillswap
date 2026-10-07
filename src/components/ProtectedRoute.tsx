import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, ArrowRightLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onNavigate,
  redirectTo = '/login',
}) => {
  const { user, currentUser, loading } = useAuth();
  const isAuthenticated = Boolean(user || currentUser);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      onNavigate(redirectTo);
    }
  }, [loading, isAuthenticated, onNavigate, redirectTo]);

  // Section 18: Professional auth loading state without flickering
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* SkillSwap Gradient Badge */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
            }}
          >
            <ArrowRightLeft className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-1">
            SkillSwap
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-6">
            Learn. Teach. Grow.
          </p>

          <p className="text-sm font-medium text-slate-600 mb-6">
            Loading your account...
          </p>

          {/* Spinner */}
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
