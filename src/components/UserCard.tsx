import React, { useState } from 'react';
import { UserProfile, MatchScoreResult } from '../types';
import { SkillBadge } from './SkillBadge';
import { RatingStars } from './RatingStars';
import { calculateMatchScore } from '../utils/matching';
import { Sparkles, MapPin, Calendar, Monitor, ArrowRightLeft, User } from 'lucide-react';
import { MatchExplainModal } from './MatchExplainModal';
import { SwapRequestModal } from './SwapRequestModal';
import { UserAvatar } from './UserAvatar';

interface UserCardProps {
  user: UserProfile;
  currentUser: UserProfile | null;
  onNavigate: (path: string) => void;
  onRequestSent?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  currentUser,
  onNavigate,
  onRequestSent,
}) => {
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const teachSkills = (user.skills || []).filter((s) => s.type === 'teach');
  const learnSkills = (user.skills || []).filter((s) => s.type === 'learn');

  const matchResult: MatchScoreResult | null = currentUser
    ? calculateMatchScore(currentUser, user)
    : null;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group">
        {/* Card Header & Profile Info */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <UserAvatar
                src={user.avatarUrl}
                name={user.fullName}
                size="lg"
                showOnlineStatus
                className="shadow-sm ring-2 ring-slate-100 group-hover:ring-indigo-200 transition-all cursor-pointer"
              />
              <div>
                <h3
                  onClick={() => onNavigate(`/profile/${user.id}`)}
                  className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {user.fullName}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{user.city || 'Global Remote'}</span>
                </div>
                <div className="mt-1">
                  <RatingStars rating={user.rating} showText count={user.reviewCount} size={14} />
                </div>
              </div>
            </div>

            {/* Match score badge */}
            {matchResult && matchResult.score > 0 && (
              <button
                type="button"
                onClick={() => setShowExplainModal(true)}
                className="shrink-0 flex flex-col items-end cursor-pointer group/badge"
                title="Click to view AI compatibility explanation"
              >
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-extrabold text-xs shadow-xs group-hover/badge:scale-105 transition-transform">
                  <Sparkles className="w-3 h-3" />
                  {matchResult.score}%
                </div>
                <span className="text-[10px] font-semibold text-purple-600 hover:underline mt-0.5">
                  Why match?
                </span>
              </button>
            )}
          </div>

          {/* Bio Snippet */}
          {user.bio && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Skills They Teach */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Can teach:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {teachSkills.length > 0 ? (
                teachSkills.map((s) => (
                  <SkillBadge
                    key={s.id}
                    name={s.name}
                    level={s.experienceLevel}
                    type="teach"
                  />
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills listed yet</span>
              )}
            </div>
          </div>

          {/* Skills They Want To Learn */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Wants to learn:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {learnSkills.length > 0 ? (
                learnSkills.map((s) => (
                  <SkillBadge
                    key={s.id}
                    name={s.name}
                    level={s.experienceLevel}
                    type="learn"
                  />
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Exploring new skills</span>
              )}
            </div>
          </div>

          {/* Availability & Mode metadata tags */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{user.learningMode} sessions</span>
            </div>
            {user.availability && user.availability.length > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.availability[0]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate(`/profile/${user.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            View Profile
          </button>

          {currentUser && currentUser.id !== user.id && (
            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:opacity-95 rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Swap Request
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {currentUser && matchResult && (
        <MatchExplainModal
          isOpen={showExplainModal}
          onClose={() => setShowExplainModal(false)}
          currentUser={currentUser}
          candidateUser={user}
          matchResult={matchResult}
          onSendRequestClick={() => setShowRequestModal(true)}
        />
      )}

      {currentUser && (
        <SwapRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          currentUser={currentUser}
          recipientUser={user}
          onRequestSent={onRequestSent}
        />
      )}
    </>
  );
};
