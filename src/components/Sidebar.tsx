import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  Sparkles,
  MessageSquare,
  Phone,
  GraduationCap,
  Inbox,
  Calendar,
  Star,
  Award,
  BookOpen,
  Settings,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  // Calculate profile completion score
  const calculateCompletion = () => {
    let score = 20; // base
    if (currentUser.bio && currentUser.bio.length > 20) score += 20;
    if ((currentUser.skills || []).some((s) => s.type === 'teach')) score += 20;
    if ((currentUser.skills || []).some((s) => s.type === 'learn')) score += 20;
    if (currentUser.city) score += 10;
    if (currentUser.learningGoals) score += 10;
    return Math.min(100, score);
  };

  const completionPercent = calculateCompletion();

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Discover', path: '/discover', icon: Search },
    { label: 'My Matches', path: '/matches', icon: Sparkles, badge: 'High Match' },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Calls', path: '/calls', icon: Phone },
    { label: 'Learning Rooms', path: '/rooms', icon: GraduationCap, badge: 'Live' },
    { label: 'Requests', path: '/requests', icon: Inbox },
    { label: 'Sessions', path: '/sessions', icon: Calendar },
    { label: 'Learning Plans', path: '/learning-plans', icon: BookOpen, badge: 'AI' },
    { label: 'Reviews', path: '/reviews', icon: Star },
    { label: 'Achievements', path: '/badges', icon: Award },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-[calc(100vh-4rem)] p-4 justify-between shrink-0 z-20">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Platform Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    item.badge === 'AI'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile Completion Card */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div
          onClick={() => onNavigate(`/profile/${currentUser.id}`)}
          className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-10 h-10 rounded-xl object-cover border-2 border-indigo-200"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                {currentUser.fullName}
              </h4>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{currentUser.points} points</span>
              </div>
            </div>
          </div>

          {/* Completion Bar */}
          <div className="mt-3 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Profile setup
              </span>
              <span className="font-bold text-slate-800">{completionPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
