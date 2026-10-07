import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Search, GraduationCap, MessageSquare, User } from 'lucide-react';

interface MobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPath, onNavigate }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const tabs = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Discover', path: '/discover', icon: Search },
    { label: 'Rooms', path: '/rooms', icon: GraduationCap },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Profile', path: `/profile/${currentUser.id}`, icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] px-3 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path;
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => onNavigate(tab.path)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
