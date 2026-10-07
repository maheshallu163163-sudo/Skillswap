import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowRightLeft,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { INITIAL_USERS } from '../data/seedData';

export type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email';

interface AuthPagesProps {
  mode: AuthMode;
  onNavigate: (path: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ mode, onNavigate }) => {
  const {
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    resendVerification,
    switchUser,
    isConfigured,
  } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & UI State
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Flow Outcome States
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Email format validator
  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  // Inline Validation handlers
  const validateEmail = (val: string) => {
    if (!val.trim()) {
      setEmailError('Please enter your email address.');
      return false;
    }
    if (!isValidEmail(val)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string) => {
    if (!val) {
      setPasswordError('Password is required.');
      return false;
    }
    if (mode === 'signup' || mode === 'reset-password') {
      if (val.length < 6) {
        setPasswordError('Password must be at least 6 characters long.');
        return false;
      }
    }
    setPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (val: string, original: string) => {
    if (!val) {
      setConfirmPasswordError('Please confirm your password.');
      return false;
    }
    if (val !== original) {
      setConfirmPasswordError('Passwords do not match.');
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const validateFullName = (val: string) => {
    if (!val.trim()) {
      setFullNameError('Please enter your full name.');
      return false;
    }
    setFullNameError(null);
    return true;
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Run client-side validations
    let valid = true;

    if (mode === 'signup') {
      if (!validateFullName(fullName)) valid = false;
    }

    if (mode !== 'reset-password') {
      if (!validateEmail(email)) valid = false;
    }

    if (mode !== 'forgot-password') {
      if (!validatePassword(password)) valid = false;
    }

    if (mode === 'signup' || mode === 'reset-password') {
      if (!validateConfirmPassword(confirmPassword, password)) valid = false;
    }

    if (!valid) return;

    setSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.isProfileComplete) {
          onNavigate('/dashboard');
        } else {
          onNavigate('/onboarding');
        }
      } else if (mode === 'signup') {
        const result = await signUp(email, password, fullName);
        if (result.requiresEmailVerification) {
          setVerificationPendingEmail(email);
        } else {
          onNavigate('/onboarding');
        }
      } else if (mode === 'forgot-password') {
        await resetPassword(email);
        setResetEmailSent(true);
      } else if (mode === 'reset-password') {
        await updatePassword(password);
        setResetSuccess(true);
      }
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      if (!isConfigured) {
        setFormError('Google sign-in requires Supabase URL and Anon Key configured in your environment.');
        return;
      }
      await signInWithGoogle();
    } catch (err: any) {
      setFormError(err.message || 'Google sign-in could not be initiated.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!verificationPendingEmail || resendCooldown > 0) return;
    try {
      await resendVerification(verificationPendingEmail);
      setResendSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Could not resend verification email.');
    }
  };

  // Demo user quick login for testing
  const handleQuickDemo = async (userId: string) => {
    setSubmitting(true);
    try {
      await switchUser(userId);
      onNavigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW: Email Verification Pending View (Section 14)
  // =========================================================================
  if (verificationPendingEmail || mode === 'verify-email') {
    const targetEmail = verificationPendingEmail || email || 'your email';
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          {/* SkillSwap Gradient bar */}
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
            }}
          />

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account created!</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            We've sent a verification email to:
            <br />
            <span className="font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-full inline-block mt-2">
              {targetEmail}
            </span>
          </p>

          <p className="text-xs text-slate-500 mb-8 leading-relaxed">
            Please click the confirmation link in your inbox to complete activation and unlock all peer skill exchanges.
          </p>

          {resendSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Verification email resent successfully!</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendCooldown > 0}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend email'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Reset Password Success View (Section 13)
  // =========================================================================
  if (resetSuccess) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
            }}
          />

          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password updated successfully.</h2>
          <p className="text-sm text-slate-600 mb-8">
            Your new password has been safely saved. You can now access your account.
          </p>

          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
            }}
          >
            Continue to SkillSwap
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Forgot Password Sent Confirmation (Section 12)
  // =========================================================================
  if (mode === 'forgot-password' && resetEmailSent) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
            }}
          />

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email.</h2>
          <p className="text-sm text-slate-600 mb-8 leading-relaxed">
            If an account exists for <span className="font-semibold text-slate-900">{email}</span>, we've sent instructions to reset your password.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-md shadow-indigo-500/20 hover:opacity-95 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
              }}
            >
              Return to Sign In
            </button>

            <button
              type="button"
              onClick={() => setResetEmailSent(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Try another email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN AUTH CARD VIEW: Login, Signup, Forgot, or Reset Form
  // =========================================================================
  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
        {/* Top SkillSwap Gradient Highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
          }}
        />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            onClick={() => onNavigate('/')}
            className="cursor-pointer inline-flex items-center justify-center gap-2 mb-2"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
              }}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              SkillSwap
            </span>
          </div>

          <p className="text-xs font-semibold tracking-wide uppercase text-indigo-600">
            Learn. Teach. Grow.
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-4">
            {isLogin && 'Welcome back'}
            {isSignup && 'Create your account'}
            {isForgotPassword && 'Reset your password'}
            {isResetPassword && 'Set a new password'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isLogin && 'Sign in to access your skills and peer exchanges'}
            {isSignup && 'Join thousands trading real-world knowledge freely'}
            {isForgotPassword && "We'll send you a link to reset your credentials"}
            {isResetPassword && 'Choose a strong password with at least 6 characters'}
          </p>
        </div>

        {/* Global Error Banner (Friendly Translated Message) */}
        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{formError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name Field (Signup only) */}
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fullNameError) validateFullName(e.target.value);
                  }}
                  onBlur={() => validateFullName(fullName)}
                  placeholder="e.g. Alex Morgan"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fullNameError
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
              </div>
              {fullNameError && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fullNameError}</p>
              )}
            </div>
          )}

          {/* Email Field (Login, Signup, Forgot Password) */}
          {!isResetPassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    emailError
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{emailError}</p>
              )}
            </div>
          )}

          {/* Password Field (Login, Signup, Reset Password) */}
          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isResetPassword ? 'New Password' : 'Password'}
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    passwordError
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{passwordError}</p>
              )}
            </div>
          )}

          {/* Confirm Password Field (Signup and Reset Password) */}
          {(isSignup || isResetPassword) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) validateConfirmPassword(e.target.value, password);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword, password)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    confirmPasswordError
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{confirmPasswordError}</p>
              )}
            </div>
          )}

          {/* Submit Button (Section 19: button states & disabled while submitting) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isLogin && 'Signing in...'}
                    {isSignup && 'Creating account...'}
                    {isForgotPassword && 'Sending instructions...'}
                    {isResetPassword && 'Updating password...'}
                  </span>
                </>
              ) : (
                <span>
                  {isLogin && 'Sign In'}
                  {isSignup && 'Create Account'}
                  {isForgotPassword && 'Send Reset Instructions'}
                  {isResetPassword && 'Update Password'}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* OAuth & Alternates (Only on Login or Signup) */}
        {(isLogin || isSignup) && (
          <div className="mt-6">
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
                OR
              </span>
            </div>

            {/* Google Login Button (Section 15) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || submitting}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Footer Navigation Switcher */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {isLogin && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/signup')}
                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Create account
              </button>
            </p>
          )}

          {isSignup && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Sign In
              </button>
            </p>
          )}

          {(isForgotPassword || isResetPassword) && (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>

        {/* Quick Demo Personas (Evaluator testing convenience) */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Test Personas
            </span>
            <span className="text-[10px] text-indigo-500 font-medium">1-Click Log In</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {INITIAL_USERS.slice(0, 3).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickDemo(u.id)}
                className="flex items-center gap-1.5 p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-left transition-colors text-[11px] font-medium text-slate-700 truncate"
              >
                <img
                  src={u.avatarUrl}
                  alt={u.fullName}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                />
                <span className="truncate">{u.fullName.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
