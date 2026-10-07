import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';
import { DatabaseService } from './db';
import { INITIAL_USERS } from '../data/seedData';

/**
 * Translates raw Supabase authentication errors into friendly, professional user messages.
 */
export function formatAuthError(error: any): string {
  if (!error) return 'Something went wrong. Please try again.';
  const message = error.message || error.error_description || String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_grant') ||
    lower.includes('wrong password')
  ) {
    return 'The email or password is incorrect. Please check your details and try again.';
  }

  if (
    lower.includes('email not confirmed') ||
    lower.includes('email_not_confirmed') ||
    lower.includes('verify your email')
  ) {
    return 'Email not verified. Please check your inbox to verify your account.';
  }

  if (
    lower.includes('user already registered') ||
    lower.includes('already registered') ||
    lower.includes('user_already_exists')
  ) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  if (
    lower.includes('password should be at least 6') ||
    lower.includes('weak_password') ||
    lower.includes('short password')
  ) {
    return 'Password must be at least 6 characters long.';
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('over_email_send_rate_limit')
  ) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Unable to reach authentication server. Please check your connection.';
  }

  return 'Something went wrong. Please check your details and try again.';
}

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  requiresEmailVerification: boolean;
  profile?: UserProfile | null;
}

export interface SignInResult {
  user: User | null;
  session: Session | null;
  profile?: UserProfile | null;
  isProfileComplete?: boolean;
}

export const AuthService = {
  /**
   * Check if real Supabase environment is active
   */
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  /**
   * Sign Up with Email and Password
   */
  async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<SignUpResult> {
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: fullName || trimmedEmail.split('@')[0],
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(formatAuthError(error));
      }

      const user = data.user;
      const session = data.session;
      const requiresEmailVerification = Boolean(user && !session);

      let profile: UserProfile | null = null;
      if (user) {
        profile = await this.syncOrCreateProfile(user.id, trimmedEmail, fullName);
      }

      return {
        user,
        session,
        requiresEmailVerification,
        profile,
      };
    }

    // Local persistent fallback when Supabase keys are not set
    const fallbackUserId = `user-${Date.now()}`;
    const name = fullName || trimmedEmail.split('@')[0];
    const newProfile: UserProfile = {
      id: fallbackUserId,
      userId: fallbackUserId,
      fullName: name,
      email: trimmedEmail,
      avatarUrl: '',
      city: 'San Francisco, CA',
      country: 'United States',
      bio: 'Lifelong learner excited to share knowledge and discover new skills.',
      experience: 'Getting started on SkillSwap',
      languages: ['English'],
      learningMode: 'online',
      availability: ['Weekday evenings', 'Weekends'],
      learningGoals: 'Connect with mentors and level up practical skills',
      points: 50,
      rating: 5.0,
      reviewCount: 0,
      completedSwapsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skills: [],
    };

    await DatabaseService.updateUser(newProfile);
    localStorage.setItem('skillswap_current_user_id', newProfile.id);

    return {
      user: { id: fallbackUserId, email: trimmedEmail } as any,
      session: { access_token: 'mock-session-token', user: { id: fallbackUserId } } as any,
      requiresEmailVerification: false,
      profile: newProfile,
    };
  },

  /**
   * Sign In with Email and Password
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw new Error(formatAuthError(error));
      }

      const user = data.user;
      const session = data.session;

      let profile: UserProfile | null = null;
      let isProfileComplete = false;

      if (user) {
        profile = await this.getProfileByUserId(user.id);
        if (!profile) {
          profile = await this.syncOrCreateProfile(
            user.id,
            user.email || trimmedEmail,
            user.user_metadata?.full_name
          );
        }
        isProfileComplete = Boolean(
          profile &&
          profile.skills &&
          profile.skills.length > 0 &&
          profile.city &&
          profile.city.length > 0
        );
      }

      return {
        user,
        session,
        profile,
        isProfileComplete,
      };
    }

    // Local fallback when Supabase keys are not set
    const allUsers = await DatabaseService.getUsers();
    let matched = allUsers.find(
      (u) => u.email.toLowerCase() === trimmedEmail
    );

    if (!matched) {
      // Find seed user or create on the fly for seamless demo
      matched = INITIAL_USERS.find(
        (u) => u.email.toLowerCase() === trimmedEmail
      );
      if (matched) {
        await DatabaseService.updateUser(matched);
      } else {
        // If password is provided and credentials check
        matched = {
          id: `user-${Date.now()}`,
          userId: `user-${Date.now()}`,
          fullName: trimmedEmail.split('@')[0],
          email: trimmedEmail,
          avatarUrl: '',
          city: 'San Francisco, CA',
          bio: 'Passionate learner on SkillSwap.',
          experience: 'Enthusiast',
          languages: ['English'],
          learningMode: 'online',
          availability: ['Weekends'],
          learningGoals: 'Broaden horizons',
          points: 50,
          rating: 5.0,
          reviewCount: 0,
          completedSwapsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          skills: [],
        };
        await DatabaseService.updateUser(matched);
      }
    }

    localStorage.setItem('skillswap_current_user_id', matched.id);

    return {
      user: { id: matched.id, email: matched.email } as any,
      session: { access_token: 'mock-session-token', user: { id: matched.id } } as any,
      profile: matched,
      isProfileComplete: Boolean(matched.skills && matched.skills.length > 0),
    };
  },

  /**
   * Sign Out
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Error during Supabase signout:', error);
      }
    }
    localStorage.removeItem('skillswap_current_user_id');
  },

  /**
   * Request Password Reset Email
   */
  async resetPassword(email: string): Promise<void> {
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(formatAuthError(error));
      }
      return;
    }

    // Local simulation: Always succeed cleanly so users see the check-email prompt
    await new Promise((resolve) => setTimeout(resolve, 600));
  },

  /**
   * Update User Password (used after clicking password reset link)
   */
  async updatePassword(newPassword: string): Promise<void> {
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(formatAuthError(error));
      }
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
  },

  /**
   * Resend Verification Email
   */
  async resendVerification(email: string): Promise<void> {
    const trimmedEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        throw new Error(formatAuthError(error));
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  },

  /**
   * Sign In with Google OAuth
   */
  async signInWithGoogle(): Promise<{ url?: string; data?: any }> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Google OAuth requires Supabase project configuration in .env (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).'
      );
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(formatAuthError(error));
    }

    return data;
  },

  /**
   * Get Current Authenticated User from Supabase
   */
  async getCurrentUser(): Promise<User | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      return data.user;
    }
    return null;
  },

  /**
   * Get Current Active Session from Supabase
   */
  async getCurrentSession(): Promise<Session | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return null;
      return data.session;
    }
    return null;
  },

  /**
   * Fetch Profile record for a given Supabase auth user_id
   */
  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching profile from Supabase:', error);
      }

      if (data) {
        // Map postgres snake_case to UserProfile
        return {
          id: data.id || data.user_id,
          userId: data.user_id,
          fullName: data.full_name || 'Member',
          email: data.email || '',
          avatarUrl: data.avatar_url || '',
          city: data.city || '',
          country: data.country || '',
          bio: data.bio || '',
          experience: data.experience || '',
          languages: data.languages || ['English'],
          learningMode: data.learning_mode || 'online',
          availability: data.availability || ['Weekday evenings'],
          learningGoals: data.learning_goals || '',
          points: data.points ?? 50,
          rating: Number(data.rating || 5.0),
          reviewCount: data.review_count || 0,
          completedSwapsCount: data.completed_swaps_count || 0,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
          skills: [],
        };
      }
    }

    return await DatabaseService.getUserById(userId);
  },

  /**
   * Ensure a profile record exists in profiles table for this auth user
   */
  async syncOrCreateProfile(
    userId: string,
    email: string,
    fullName?: string
  ): Promise<UserProfile> {
    const existing = await this.getProfileByUserId(userId);
    if (existing) return existing;

    const name = fullName || email.split('@')[0];
    const defaultProfile: UserProfile = {
      id: userId,
      userId: userId,
      fullName: name,
      email: email,
      avatarUrl: '',
      city: '',
      country: '',
      bio: '',
      experience: '',
      languages: ['English'],
      learningMode: 'online',
      availability: ['Weekday evenings', 'Weekends'],
      learningGoals: '',
      points: 50,
      rating: 5.0,
      reviewCount: 0,
      completedSwapsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skills: [],
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').upsert({
          user_id: userId,
          full_name: name,
          avatar_url: null,
          city: '',
          bio: '',
          languages: ['English'],
          learning_mode: 'online',
          availability: ['Weekday evenings', 'Weekends'],
          learning_goals: '',
          points: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to upsert Supabase profile:', err);
      }
    }

    await DatabaseService.updateUser(defaultProfile);
    return defaultProfile;
  },

  /**
   * Subscribe to Supabase auth state change events
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(callback);
      return data.subscription;
    }
    return { unsubscribe: () => {} };
  },
};
