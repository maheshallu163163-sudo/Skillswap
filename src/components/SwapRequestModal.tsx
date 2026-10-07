import React, { useState } from 'react';
import { Modal } from './Modal';
import { UserProfile } from '../types';
import { DatabaseService } from '../services/db';
import { GeminiService } from '../services/gemini';
import { Sparkles, Loader2, ArrowRightLeft, Send, CheckCircle2 } from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  recipientUser: UserProfile;
  onRequestSent?: () => void;
}

export const SwapRequestModal: React.FC<SwapRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  recipientUser,
  onRequestSent,
}) => {
  const userTeachSkills = (currentUser.skills || []).filter((s) => s.type === 'teach');
  const recipientTeachSkills = (recipientUser.skills || []).filter((s) => s.type === 'teach');

  const [teachSkillName, setTeachSkillName] = useState(
    userTeachSkills[0]?.name || 'My Technical Skills'
  );
  const [learnSkillName, setLearnSkillName] = useState(
    recipientTeachSkills[0]?.name || 'Your Expertise'
  );
  const [message, setMessage] = useState(
    `Hi ${recipientUser.fullName.split(' ')[0]}! I saw you teach ${recipientTeachSkills[0]?.name || 'skills'}. I'd love to help you with ${userTeachSkills[0]?.name || 'my skills'} in exchange for some 1-on-1 sessions!`
  );

  const [loadingAiStarter, setLoadingAiStarter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleGenerateStarter = async () => {
    try {
      setLoadingAiStarter(true);
      const starter = await GeminiService.generateConversationStarter({
        myName: currentUser.fullName,
        partnerName: recipientUser.fullName.split(' ')[0],
        teachSkill: teachSkillName,
        learnSkill: learnSkillName,
      });
      if (starter) setMessage(starter);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAiStarter(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSubmitting(true);
      await DatabaseService.createSwapRequest(
        currentUser.id,
        recipientUser.id,
        teachSkillName,
        learnSkillName,
        message
      );
      setSentSuccess(true);
      fireCelebrationConfetti();
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
        if (onRequestSent) onRequestSent();
      }, 1400);
    } catch (err) {
      console.error('Failed to create swap request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Skill Swap Request"
      subtitle={`Propose a reciprocal peer-learning exchange with ${recipientUser.fullName}`}
      maxWidth="lg"
    >
      {sentSuccess ? (
        <div className="py-10 text-center space-y-3 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Request Sent Successfully!</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {recipientUser.fullName.split(' ')[0]} has received your proposal. We'll notify you as soon as they respond!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reciprocal Skill Selectors */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                What I can teach:
              </label>
              {userTeachSkills.length > 0 ? (
                <select
                  value={teachSkillName}
                  onChange={(e) => setTeachSkillName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {userTeachSkills.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.experienceLevel})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={teachSkillName}
                  onChange={(e) => setTeachSkillName(e.target.value)}
                  placeholder="e.g. Python, Web Development"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              )}
            </div>

            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                What I want to learn from {recipientUser.fullName.split(' ')[0]}:
              </label>
              {recipientTeachSkills.length > 0 ? (
                <select
                  value={learnSkillName}
                  onChange={(e) => setLearnSkillName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {recipientTeachSkills.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.experienceLevel})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={learnSkillName}
                  onChange={(e) => setLearnSkillName(e.target.value)}
                  placeholder="e.g. UI/UX Design, Figma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              )}
            </div>
          </div>

          {/* Personal Message Area + AI Starter Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Personal Message:
              </label>
              <button
                type="button"
                onClick={handleGenerateStarter}
                disabled={loadingAiStarter}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingAiStarter ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating starter...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    ✨ AI Intro Starter
                  </>
                )}
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Introduce yourself, explain your mutual learning interest, and propose session timing..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Friendly, concise introductions have a 92% higher acceptance rate!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:opacity-95 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Proposal
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
