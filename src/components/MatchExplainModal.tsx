import React, { useState } from 'react';
import { Modal } from './Modal';
import { UserProfile, MatchScoreResult } from '../types';
import { GeminiService } from '../services/gemini';
import { Sparkles, CheckCircle2, Loader2, ArrowRightLeft } from 'lucide-react';

interface MatchExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  candidateUser: UserProfile;
  matchResult: MatchScoreResult;
  onSendRequestClick?: () => void;
}

export const MatchExplainModal: React.FC<MatchExplainModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  candidateUser,
  matchResult,
  onSendRequestClick,
}) => {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleExplainWithAi = async () => {
    try {
      setLoadingAi(true);
      const text = await GeminiService.explainMatch(currentUser, candidateUser, matchResult.reasons);
      setAiExplanation(text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Why You Match"
      subtitle={`Compatibility breakdown between you and ${candidateUser.fullName}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Header Match Hero */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={candidateUser.avatarUrl}
                alt={candidateUser.fullName}
                className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">{candidateUser.fullName}</h4>
              <p className="text-xs text-slate-500">{candidateUser.city || 'Global Community'}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-extrabold text-sm shadow-sm shadow-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              {matchResult.score}% Match
            </div>
            <p className="text-[11px] text-indigo-700 font-semibold mt-1">Exceptional Synergy</p>
          </div>
        </div>

        {/* Deterministic Breakdown Factors */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Deterministic Compatibility Factors
          </h4>
          <div className="space-y-2">
            {matchResult.reasons.length > 0 ? (
              matchResult.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{reason}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">
                You both share cross-category curiosities and learning interests.
              </p>
            )}
          </div>
        </div>

        {/* AI Natural Language Breakdown */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-purple-900 tracking-wide uppercase">
                AI Match Companion
              </span>
            </div>
            {!aiExplanation && (
              <button
                type="button"
                onClick={handleExplainWithAi}
                disabled={loadingAi}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer disabled:opacity-50"
              >
                {loadingAi ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing with Gemini...
                  </>
                ) : (
                  '✨ Explain with AI'
                )}
              </button>
            )}
          </div>

          {aiExplanation ? (
            <div className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-purple-100 shadow-xs animate-fade-in">
              <p className="italic text-slate-800">"{aiExplanation}"</p>
              <div className="mt-2 text-[10px] font-bold text-purple-600 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Powered by Gemini
              </div>
            </div>
          ) : (
            <p className="text-xs text-purple-700/80">
              Want deeper context? Click above to have Gemini explain why this bilateral exchange is high leverage for both of your schedules and goals.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>
          {onSendRequestClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSendRequestClick();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Send Swap Request
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
