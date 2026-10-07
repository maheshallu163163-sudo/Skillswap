import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Session, SwapRequest, MatchScoreResult } from '../types';
import { DatabaseService } from '../services/db';
import { calculateMatchScore } from '../utils/matching';
import { UserCard } from '../components/UserCard';
import { UserAvatar } from '../components/UserAvatar';
import {
  Sparkles,
  ArrowRightLeft,
  Calendar,
  Clock,
  ArrowRight,
  Flame,
  Award,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Inbox,
  Star,
  Users,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const [usersList, sessionList, reqList] = await Promise.all([
          DatabaseService.getUsers(),
          DatabaseService.getSessions(currentUser.id),
          DatabaseService.getSwapRequests(currentUser.id),
        ]);
        setAllUsers(usersList.filter((u) => u.id !== currentUser.id));
        setSessions(sessionList);
        setRequests(reqList);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  // Calculate highest match
  const matchesWithScores: MatchScoreResult[] = allUsers.map((u) =>
    calculateMatchScore(currentUser, u)
  );
  matchesWithScores.sort((a, b) => b.score - a.score);
  const topMatch = matchesWithScores[0] || null;

  // Upcoming scheduled session
  const upcomingSession = sessions.find((s) => s.status === 'scheduled');
  const pendingRequests = requests.filter((r) => r.status === 'pending' && r.receiverId === currentUser.id);

  const teachSkills = (currentUser.skills || []).filter((s) => s.type === 'teach');
  const learnSkills = (currentUser.skills || []).filter((s) => s.type === 'learn');

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER GREETING */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {currentUser.fullName.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome to your SkillSwap control center. Here's your reciprocal learning roadmap today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/discover')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Matches</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* KEY METRICS & TOP MATCH HIGHLIGHT */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TOP MATCH BANNER CARD (lg: 8 cols) */}
        {topMatch && (
          <div className="lg:col-span-8 p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-300 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Top High-Compatibility Match</span>
                </div>
                <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                  {topMatch.score}% Match
                </span>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <UserAvatar
                  src={topMatch.user.avatarUrl}
                  name={topMatch.user.fullName}
                  size="lg"
                  className="border-2 border-white/80 shadow-md"
                />
                <div>
                  <h3 className="font-bold text-lg text-white">{topMatch.user.fullName}</h3>
                  <p className="text-xs text-slate-300">
                    {topMatch.user.city} • Rating: ★ {topMatch.user.rating} ({topMatch.user.reviewCount} reviews)
                  </p>
                </div>
              </div>

              {/* Match reasons pills */}
              <div className="space-y-1.5 pt-1">
                <div className="text-xs text-slate-300 font-medium">Why you match:</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {topMatch.reasons.slice(0, 3).map((r, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-slate-200"
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-3 pt-6 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={() => onNavigate(`/profile/${topMatch.user.id}`)}
                className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                View Full Match
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/requests')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Send Proposal
              </button>
            </div>
          </div>
        )}

        {/* PROGRESS & REPUTATION CARD (lg: 4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Your Learning Reputation
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>Points</span>
                </div>
                <div className="text-2xl font-extrabold text-amber-900 mt-1">
                  {currentUser.points}
                </div>
                <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                  +50 on completed session
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Swaps</span>
                </div>
                <div className="text-2xl font-extrabold text-indigo-900 mt-1">
                  {currentUser.completedSwapsCount}
                </div>
                <div className="text-[10px] text-indigo-700 font-medium mt-0.5">
                  ★ {currentUser.rating} community rating
                </div>
              </div>
            </div>

            {/* Quick Pending Requests notification alert */}
            {pendingRequests.length > 0 && (
              <div
                onClick={() => onNavigate('/requests')}
                className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 hover:bg-purple-100/60 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-xs font-bold text-purple-900">
                      {pendingRequests.length} Incoming Request{pendingRequests.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-[11px] text-purple-700">Awaiting your response</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/badges')}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4 text-indigo-600" />
            <span>View All Badges & Ledger</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* UPCOMING SESSION & ACTIVE SKILLS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UPCOMING SESSION CARD */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Upcoming Session</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('/sessions')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              All Sessions
            </button>
          </div>

          {upcomingSession ? (
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{upcomingSession.skillName}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(upcomingSession.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Confirmed
                </span>
              </div>

              {upcomingSession.meetingLink && (
                <div className="pt-2 border-t border-indigo-100/70 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Meeting link attached</span>
                  <a
                    href={upcomingSession.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Join Room →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <p className="text-xs text-slate-500">No scheduled sessions right now.</p>
              <button
                type="button"
                onClick={() => onNavigate('/requests')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Schedule with an accepted swap →
              </button>
            </div>
          )}
        </div>

        {/* SKILLS PORTFOLIO SUMMARY */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-purple-600" />
              <span>Your Skills Matrix</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate(`/profile/${currentUser.id}`)}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Manage Skills
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Skills you teach:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {teachSkills.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs"
                  >
                    {s.name} ({s.experienceLevel})
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Skills you want to learn:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {learnSkills.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold text-xs"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RECOMMENDED COMMUNITY MATCHES */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Recommended Swappers For You
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified based on reciprocal skills, schedules, and learning modes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/discover')}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Explore all members →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allUsers.slice(0, 3).map((u) => (
            <UserCard
              key={u.id}
              user={u}
              currentUser={currentUser}
              onNavigate={onNavigate}
              onRequestSent={() => {
                DatabaseService.getSwapRequests(currentUser.id).then(setRequests);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
