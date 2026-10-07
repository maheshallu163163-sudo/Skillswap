import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ArrowRightLeft, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthCallbackProps {
  onNavigate: (path: string) => void;
}

export const AuthCallbackPage: React.FC<AuthCallbackProps> = ({ onNavigate }) => {
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          // In fallback mode, simply direct to dashboard
          setTimeout(() => {
            if (isMounted) onNavigate('/dashboard');
          }, 800);
          return;
        }

        // Get session after OAuth or email verification redirect
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          if (isMounted) {
            setStatus('success');
            await refreshProfile();
            setTimeout(() => {
              if (isMounted) onNavigate('/dashboard');
            }, 800);
          }
        } else {
          // Check if there is an error in URL hash or search params
          const hash = window.location.hash;
          const search = window.location.search;
          const params = new URLSearchParams(search || hash.replace('#', '?'));
          const errorDesc = params.get('error_description') || params.get('error');

          if (errorDesc) {
            throw new Error(errorDesc);
          }

          // If no error but no immediate session, retry once after short delay
          setTimeout(async () => {
            const retry = await supabase!.auth.getSession();
            if (retry.data.session && isMounted) {
              setStatus('success');
              await refreshProfile();
              onNavigate('/dashboard');
            } else if (isMounted) {
              onNavigate('/login');
            }
          }, 1200);
        }
      } catch (err: any) {
        console.error('Auth callback verification error:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Authentication verification failed.');
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [onNavigate, refreshProfile]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col items-center">
        {/* SkillSwap Gradient Badge */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-6"
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
          }}
        >
          <ArrowRightLeft className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 mb-1">
          SkillSwap
          <Sparkles className="w-4 h-4 text-amber-500" />
        </h2>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 mb-6">
          Learn. Teach. Grow.
        </p>

        {status === 'verifying' && (
          <>
            <p className="text-sm font-medium text-slate-700 mb-4">
              Verifying your authentication credentials...
            </p>
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin mb-2" />
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">
              Authentication Confirmed!
            </p>
            <p className="text-xs text-slate-500">
              Redirecting you to SkillSwap...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">
              Verification Issue
            </p>
            <p className="text-xs text-rose-600 mb-6 leading-relaxed">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-500/20"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
              }}
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};
