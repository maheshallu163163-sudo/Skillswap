import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MatchesPage } from './pages/MatchesPage';
import { RequestsPage } from './pages/RequestsPage';
import { MessagesPage } from './pages/MessagesPage';
import { CallsPage } from './pages/CallsPage';
import { LearningRoomsListPage } from './pages/LearningRoomsListPage';
import { LearningRoomViewPage } from './pages/LearningRoomViewPage';
import { SessionsPage } from './pages/SessionsPage';
import { BadgesPage } from './pages/BadgesPage';
import { LearningPlansPage } from './pages/LearningPlansPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ReviewsPage } from './pages/ReviewsPage';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname && window.location.pathname !== '/'
      ? window.location.pathname
      : '/';
  });

  // Sync browser history state
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAuthOrPublicPage =
    currentPath === '/' ||
    currentPath === '/login' ||
    currentPath === '/signup' ||
    currentPath === '/forgot-password' ||
    currentPath === '/reset-password' ||
    currentPath === '/auth/callback' ||
    currentPath === '/onboarding';

  const isDashboardView = Boolean(currentUser && !isAuthOrPublicPage);

  const renderRoute = () => {
    // Top-level session resolving indicator
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-500">Loading SkillSwap...</span>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------
    // Public Routes
    // -------------------------------------------------------------
    if (currentPath === '/') {
      return <LandingPage onNavigate={navigate} currentUser={currentUser} />;
    }

    if (currentPath === '/login') {
      return <AuthPages mode="login" onNavigate={navigate} />;
    }

    if (currentPath === '/signup') {
      return <AuthPages mode="signup" onNavigate={navigate} />;
    }

    if (currentPath === '/forgot-password') {
      return <AuthPages mode="forgot-password" onNavigate={navigate} />;
    }

    if (currentPath === '/reset-password') {
      return <AuthPages mode="reset-password" onNavigate={navigate} />;
    }

    if (currentPath === '/auth/callback') {
      return <AuthCallbackPage onNavigate={navigate} />;
    }

    // -------------------------------------------------------------
    // Protected Routes (Section 10 & 11)
    // -------------------------------------------------------------
    if (currentPath === '/onboarding') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <OnboardingPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/dashboard') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <DashboardPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/discover') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <DiscoverPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/matches') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <MatchesPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/calls') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <CallsPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/rooms') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <LearningRoomsListPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath.startsWith('/rooms/')) {
      const parts = currentPath.split('/');
      const targetRoomId = parts[2];
      return (
        <ProtectedRoute onNavigate={navigate}>
          <LearningRoomViewPage roomId={targetRoomId} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/requests') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <RequestsPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath.startsWith('/messages')) {
      const parts = currentPath.split('/');
      const conversationId = parts[2];
      return (
        <ProtectedRoute onNavigate={navigate}>
          <MessagesPage initialConversationId={conversationId} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath.startsWith('/sessions')) {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <SessionsPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/badges' || currentPath === '/achievements') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <BadgesPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/learning-plans') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <LearningPlansPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/profile/edit') {
      const targetUserId = currentUser?.id || 'user-alex';
      return (
        <ProtectedRoute onNavigate={navigate}>
          <ProfilePage userId={targetUserId} onNavigate={navigate} initialEditOpen={true} />
        </ProtectedRoute>
      );
    }

    if (currentPath.startsWith('/profile/')) {
      const parts = currentPath.split('/');
      const targetUserId = parts[2] || currentUser?.id || 'user-alex';
      return (
        <ProtectedRoute onNavigate={navigate}>
          <ProfilePage userId={targetUserId} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/profile') {
      const targetUserId = currentUser?.id || 'user-alex';
      return (
        <ProtectedRoute onNavigate={navigate}>
          <ProfilePage userId={targetUserId} onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/settings') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <SettingsPage />
        </ProtectedRoute>
      );
    }

    if (currentPath === '/reviews') {
      return (
        <ProtectedRoute onNavigate={navigate}>
          <ReviewsPage onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    // Fallback: Dashboard if logged in, Landing if not
    return currentUser ? (
      <ProtectedRoute onNavigate={navigate}>
        <DashboardPage onNavigate={navigate} />
      </ProtectedRoute>
    ) : (
      <LandingPage onNavigate={navigate} currentUser={currentUser} />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      <div className="flex-1 flex">
        {isDashboardView && (
          <Sidebar currentPath={currentPath} onNavigate={navigate} />
        )}

        <main
          className={`flex-1 ${
            isDashboardView
              ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'
              : 'w-full'
          }`}
        >
          {renderRoute()}
        </main>
      </div>

      {isDashboardView && (
        <MobileNav currentPath={currentPath} onNavigate={navigate} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
