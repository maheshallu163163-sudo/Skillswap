import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Bell,
  Check,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Flame,
  ArrowRightLeft,
  Menu,
  X,
  Compass,
  Award,
  Layers,
} from 'lucide-react';
import { INITIAL_USERS } from '../data/seedData';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const {
    currentUser,
    switchUser,
    signOut,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const switchMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (switchMenuRef.current && !switchMenuRef.current.contains(event.target as Node)) {
        setShowSwitchMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => onNavigate(currentUser ? '/dashboard' : '/')}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  SkillSwap
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-1 hidden sm:block">
                  Peer Knowledge Exchange
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            {!currentUser ? (
              <div className="hidden md:flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => onNavigate('/discover')}
                  className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                    currentPath === '/discover' ? 'text-indigo-600 font-semibold' : 'text-slate-600'
                  }`}
                >
                  Discover
                </button>
                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    if (currentPath !== '/') {
                      e.preventDefault();
                      onNavigate('/');
                      setTimeout(() => {
                        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#ai-features"
                  onClick={(e) => {
                    if (currentPath !== '/') {
                      e.preventDefault();
                      onNavigate('/');
                      setTimeout(() => {
                        document.getElementById('ai-features')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  AI Features
                </a>
                <a
                  href="#community"
                  onClick={(e) => {
                    if (currentPath !== '/') {
                      e.preventDefault();
                      onNavigate('/');
                      setTimeout(() => {
                        document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Community
                </a>
              </div>
            ) : null}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {!currentUser ? (
              <div className="hidden sm:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/signup')}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:opacity-95 shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Get Started Free
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Demo Switcher Quick Pill */}
                <div className="relative" ref={switchMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-700 text-xs font-semibold transition-all cursor-pointer"
                    title="Switch persona for testing reciprocal swaps"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden sm:inline">Role:</span>
                    <span className="font-bold">{currentUser.fullName.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-purple-500" />
                  </button>

                  {showSwitchMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-scale-up">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Demo Persona
                      </div>
                      <div className="space-y-1">
                        {INITIAL_USERS.map((u) => {
                          const isCurrent = u.id === currentUser.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                switchUser(u.id);
                                setShowSwitchMenu(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-purple-50 text-purple-900 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  src={u.avatarUrl}
                                  name={u.fullName}
                                  size="xs"
                                  shape="circle"
                                />
                                <div>
                                  <div className="font-semibold text-slate-900">{u.fullName}</div>
                                  <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                    Teaches: {u.skills?.filter((s) => s.type === 'teach')[0]?.name || 'N/A'}
                                  </div>
                                </div>
                              </div>
                              {isCurrent && <Check className="w-4 h-4 text-purple-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Points Pill */}
                <button
                  type="button"
                  onClick={() => onNavigate('/badges')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100/70 transition-colors cursor-pointer"
                  title="Your Skill Points & Badges"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{currentUser.points} pts</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative" ref={notifMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-scale-up">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-2">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadNotificationsCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 py-1">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">No notifications yet</div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotificationRead(notif.id);
                                if (notif.link) {
                                  onNavigate(notif.link);
                                  setShowNotifMenu(false);
                                }
                              }}
                              className={`p-3 rounded-xl cursor-pointer transition-colors ${
                                notif.read ? 'hover:bg-slate-50 opacity-80' : 'bg-indigo-50/50 hover:bg-indigo-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-xs text-slate-900">{notif.title}</span>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <UserAvatar
                      src={currentUser.avatarUrl}
                      name={currentUser.fullName}
                      size="sm"
                      shape="rounded"
                      className="border-2 border-indigo-200"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-scale-up">
                      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-100">
                        <UserAvatar
                          src={currentUser.avatarUrl}
                          name={currentUser.fullName}
                          size="sm"
                          shape="rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-slate-900 truncate">{currentUser.fullName}</div>
                          <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
                        </div>
                      </div>
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate(`/profile/${currentUser.id}`);
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          View My Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('/settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Settings & Preferences
                        </button>
                      </div>
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                            onNavigate('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          {!currentUser ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/discover');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                Discover Skills
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/signup');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 font-bold text-center text-white bg-indigo-600 rounded-xl"
              >
                Get Started
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/discover');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                Discover Skills & Members
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/matches');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                My High Matches
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/requests');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                Swap Requests
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/messages');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                Messages
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/sessions');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                Sessions
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/learning-plans');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                AI Learning Plans
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/badges');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 font-semibold text-slate-700"
              >
                Badges & Reputation
              </button>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                  onNavigate('/login');
                }}
                className="w-full text-left py-2 font-semibold text-red-600"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
