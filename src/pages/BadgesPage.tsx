import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge, UserBadge, PointsTransaction, UserProfile } from '../types';
import { DatabaseService } from '../services/db';
import { MASTER_BADGES } from '../data/seedData';
import {
  Trophy,
  Star,
  Rocket,
  Crown,
  Users,
  CheckCircle2,
  Flame,
  Award,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface BadgesPageProps {
  onNavigate: (path: string) => void;
}

export const BadgesPage: React.FC<BadgesPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGamification = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const [ubList, txList, uList] = await Promise.all([
          DatabaseService.getUserBadges(currentUser.id),
          DatabaseService.getPointsTransactions(currentUser.id),
          DatabaseService.getUsers(),
        ]);
        setUserBadges(ubList);
        setTransactions(txList);
        setAllUsers(uList.sort((a, b) => b.points - a.points));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadGamification();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy className="w-6 h-6 text-amber-500" />;
      case 'Star':
        return <Star className="w-6 h-6 text-amber-500" />;
      case 'Rocket':
        return <Rocket className="w-6 h-6 text-cyan-500" />;
      case 'Crown':
        return <Crown className="w-6 h-6 text-purple-500" />;
      case 'Users':
        return <Users className="w-6 h-6 text-emerald-500" />;
      default:
        return <Award className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Reputation Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-300 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Reputation & Tier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Badges, Points & Recognition
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            SkillSwap honors learners and mentors through peer recognition. Earn points for every completed session and unlocking badges boosts your match visibility.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Flame className="w-8 h-8 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase">Total Points</div>
            <div className="text-3xl font-extrabold text-white">{currentUser.points}</div>
            <div className="text-[11px] text-amber-300 font-medium">
              {earnedBadgeIds.size} of {MASTER_BADGES.length} Badges Unlocked
            </div>
          </div>
        </div>
      </div>

      {/* Badges Showcase Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span>Platform Achievement Badges</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MASTER_BADGES.map((b) => {
            const isEarned = earnedBadgeIds.has(b.id);
            return (
              <div
                key={b.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  isEarned
                    ? 'bg-white border-indigo-200 shadow-md ring-2 ring-indigo-100'
                    : 'bg-slate-50/70 border-slate-200/70 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isEarned ? 'bg-amber-50 border border-amber-200' : 'bg-slate-200'
                      }`}
                    >
                      {getBadgeIcon(b.icon)}
                    </div>
                    {isEarned ? (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
                        Locked
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{b.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{b.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
                  <span className="text-slate-400 font-medium">Reward:</span>
                  <span className="font-extrabold text-amber-600">+{b.pointsReward} Points</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Points Activity Ledger & Leaderboard (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Points Activity Ledger */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Recent Points Activity</span>
          </h2>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{tx.reason}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="font-extrabold text-sm text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  +{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Community Leaderboard */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Community Leaderboard</span>
          </h2>

          <div className="space-y-2">
            {allUsers.slice(0, 5).map((u, idx) => (
              <div
                key={u.id}
                onClick={() => onNavigate(`/profile/${u.id}`)}
                className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                  u.id === currentUser.id
                    ? 'bg-indigo-50/70 border border-indigo-200 font-bold'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-400 text-white'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <img
                    src={u.avatarUrl}
                    alt={u.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                      {u.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ★ {u.rating} ({u.completedSwapsCount} swaps)
                    </div>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-slate-800">{u.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
