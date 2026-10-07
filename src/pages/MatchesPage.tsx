import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, MatchScoreResult } from '../types';
import { DatabaseService } from '../services/db';
import { calculateMatchScore } from '../utils/matching';
import { UserCard } from '../components/UserCard';
import { Sparkles, ArrowRightLeft, ShieldCheck, HeartHandshake } from 'lucide-react';

interface MatchesPageProps {
  onNavigate: (path: string) => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const list = await DatabaseService.getUsers();
        setUsers(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (!currentUser) return null;

  // Calculate scores and sort descending
  const matches: MatchScoreResult[] = users
    .filter((u) => u.id !== currentUser.id)
    .map((u) => calculateMatchScore(currentUser, u))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-300 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic Scoring Algorithm</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            High Compatibility Matches
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Our algorithm cross-analyzes the skills you teach against what others want to learn, and vice versa. Overlapping availability, language, and modes are weighted to maximize swap success.
          </p>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{matches.length} Compatible Matches Ranked by Synergy</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((m) => (
            <UserCard
              key={m.userId}
              user={m.user}
              currentUser={currentUser}
              onNavigate={onNavigate}
              onRequestSent={() => {
                DatabaseService.getUsers().then(setUsers);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
