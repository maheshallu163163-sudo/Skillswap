import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { UserProfile, AppNotification } from '../types';
import { AuthService, SignUpResult, SignInResult } from '../services/authService';
import { DatabaseService, subscribeToChannel } from '../services/db';
import { isSupabaseConfigured } from '../lib/supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  currentUser: UserProfile | null; // Alias for profile to support existing components
  loading: boolean;
  isConfigured: boolean;

  // Supabase Auth Methods
  signIn: (email: string, password?: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, fullName?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ url?: string; data?: any }>;
  resendVerification: (email: string) => Promise<void>;

  // Profile & User State
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  switchUser: (userId: string) => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'skillswap_current_user_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load user profile and notifications
  const syncProfileData = useCallback(async (targetUserId: string, fallbackEmail?: string) => {
    try {
      let prof = await AuthService.getProfileByUserId(targetUserId);
      if (!prof && fallbackEmail) {
        prof = await AuthService.syncOrCreateProfile(targetUserId, fallbackEmail);
      }
      if (prof) {
        setProfile(prof);
        localStorage.setItem(CURRENT_USER_KEY, prof.id);
        const notifs = await DatabaseService.getNotifications(prof.id);
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('Error syncing profile data:', err);
    }
  }, []);

  // Initialize auth state and restore session
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        if (isSupabaseConfigured) {
          const currentSession = await AuthService.getCurrentSession();
          if (currentSession && isMounted) {
            setSession(currentSession);
            setUser(currentSession.user);
            await syncProfileData(currentSession.user.id, currentSession.user.email);
          } else if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else {
          // Local fallback / evaluator demo mode
          const savedUserId = localStorage.getItem(CURRENT_USER_KEY) || 'user-alex';
          let localUser = await DatabaseService.getUserById(savedUserId);
          if (!localUser) {
            const allUsers = await DatabaseService.getUsers();
            localUser = allUsers[0] || null;
          }

          if (localUser && isMounted) {
            setProfile(localUser);
            setUser({ id: localUser.id, email: localUser.email } as any);
            setSession({
              access_token: 'demo-access-token',
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'demo-refresh-token',
              user: { id: localUser.id, email: localUser.email } as any,
            } as any);
            const notifs = await DatabaseService.getNotifications(localUser.id);
            setNotifications(notifs);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to Supabase Auth State changes
    const authSubscription = AuthService.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
        await syncProfileData(newSession.user.id, newSession.user.email);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setNotifications([]);
        localStorage.removeItem(CURRENT_USER_KEY);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
      } else if (event === 'USER_UPDATED' && newSession) {
        setUser(newSession.user);
        await syncProfileData(newSession.user.id, newSession.user.email);
      } else if (event === 'PASSWORD_RECOVERY') {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    });

    // Listen to local realtime profile updates
    const unsubProfiles = subscribeToChannel('profiles', (updatedUser: UserProfile) => {
      setProfile((curr) => (curr && curr.id === updatedUser.id ? updatedUser : curr));
    });

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
      unsubProfiles();
    };
  }, [syncProfileData]);

  // Sign In implementation
  const signIn = async (email: string, password?: string): Promise<SignInResult> => {
    // If password is not provided (e.g. quick login fallback), use default demo password
    const pwd = password || 'password123';
    const result = await AuthService.signIn(email, pwd);

    if (result.session) {
      setSession(result.session);
    }
    if (result.user) {
      setUser(result.user);
    }
    if (result.profile) {
      setProfile(result.profile);
      const notifs = await DatabaseService.getNotifications(result.profile.id);
      setNotifications(notifs);
    }

    return result;
  };

  // Sign Up implementation
  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<SignUpResult> => {
    const result = await AuthService.signUp(email, password, fullName);

    if (result.session) {
      setSession(result.session);
    }
    if (result.user) {
      setUser(result.user);
    }
    if (result.profile) {
      setProfile(result.profile);
    }

    return result;
  };

  // Sign Out implementation
  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password request
  const resetPassword = async (email: string): Promise<void> => {
    await AuthService.resetPassword(email);
  };

  // Update Password
  const updatePassword = async (newPassword: string): Promise<void> => {
    await AuthService.updatePassword(newPassword);
  };

  // Google OAuth sign in
  const signInWithGoogle = async () => {
    return await AuthService.signInWithGoogle();
  };

  // Resend verification email
  const resendVerification = async (email: string): Promise<void> => {
    await AuthService.resendVerification(email);
  };

  // Refresh current user profile
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await syncProfileData(user.id, user.email);
    } else if (profile) {
      const refreshed = await DatabaseService.getUserById(profile.id);
      if (refreshed) setProfile(refreshed);
    }
  };

  // Update user profile
  const updateUser = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!profile) throw new Error('No active user session');
    const updated = await DatabaseService.updateUser({ ...profile, ...updates });
    setProfile(updated);
    return updated;
  };

  // Demo user switcher
  const switchUser = async (userId: string): Promise<void> => {
    const targetUser = await DatabaseService.getUserById(userId);
    if (targetUser) {
      setProfile(targetUser);
      setUser({ id: targetUser.id, email: targetUser.email } as any);
      localStorage.setItem(CURRENT_USER_KEY, targetUser.id);
      const notifs = await DatabaseService.getNotifications(targetUser.id);
      setNotifications(notifs);
    }
  };

  // Mark notification read
  const markNotificationRead = async (id: string): Promise<void> => {
    await DatabaseService.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Mark all notifications read
  const markAllNotificationsRead = async (): Promise<void> => {
    if (!profile) return;
    await DatabaseService.markAllNotificationsRead(profile.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const value: AuthContextType = {
    user,
    session,
    profile,
    currentUser: profile, // backward compatibility
    loading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    resendVerification,
    refreshProfile,
    updateUser,
    switchUser,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
