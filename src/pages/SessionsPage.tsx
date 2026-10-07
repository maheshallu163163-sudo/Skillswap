import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Session, Review, SessionSummaryResult } from '../types';
import { DatabaseService } from '../services/db';
import { GeminiService } from '../services/gemini';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  Star,
  ExternalLink,
  MessageSquare,
  Sparkles,
  BookOpen,
  HelpCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { RatingStars } from '../components/RatingStars';
import { fireCelebrationConfetti } from '../utils/confetti';
import { UserAvatar } from '../components/UserAvatar';

interface SessionsPageProps {
  onNavigate: (path: string) => void;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [targetSessionForReview, setTargetSessionForReview] = useState<Session | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Helpful', 'Great Teacher']);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // AI Session Summary Modal State
  const [aiSummaryModalOpen, setAiSummaryModalOpen] = useState(false);
  const [targetSessionForAi, setTargetSessionForAi] = useState<Session | null>(null);
  const [aiSummaryData, setAiSummaryData] = useState<SessionSummaryResult | null>(null);
  const [generatingAiSummary, setGeneratingAiSummary] = useState(false);

  const availableTags = ['Helpful', 'Friendly', 'Knowledgeable', 'Punctual', 'Great Teacher', 'Patient'];

  const loadSessions = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const list = await DatabaseService.getSessions(currentUser.id);
      setSessions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const handleMarkCompleted = async (session: Session) => {
    try {
      await DatabaseService.completeSession(session.id, currentUser.id);
      fireCelebrationConfetti();
      await loadSessions();

      // Open review modal
      setTargetSessionForReview(session);
      setReviewModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAiSummary = async (session: Session) => {
    setTargetSessionForAi(session);
    setAiSummaryModalOpen(true);
    setGeneratingAiSummary(true);
    setAiSummaryData(null);

    const isTeacher = session.teacherId === currentUser.id;
    const teacherName = isTeacher ? currentUser.fullName : session.teacherProfile?.fullName || 'Teacher';
    const learnerName = !isTeacher ? currentUser.fullName : session.learnerProfile?.fullName || 'Learner';

    try {
      const res = await GeminiService.summarizeSession({
        skillName: session.skillName,
        teacherName,
        learnerName,
        notes: session.notes,
        topicsCovered: [session.skillName, 'Paired review', 'Practice challenge'],
      });
      setAiSummaryData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAiSummary(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSessionForReview) return;

    const partnerId =
      targetSessionForReview.teacherId === currentUser.id
        ? targetSessionForReview.learnerId
        : targetSessionForReview.teacherId;

    try {
      setSubmittingReview(true);
      await DatabaseService.addReview({
        sessionId: targetSessionForReview.id,
        reviewerId: currentUser.id,
        revieweeId: partnerId,
        reviewerName: currentUser.fullName,
        reviewerAvatar: currentUser.avatarUrl,
        rating,
        comment: reviewComment,
        tags: selectedTags,
      });

      setReviewSuccess(true);
      fireCelebrationConfetti();
      setTimeout(() => {
        setReviewSuccess(false);
        setReviewModalOpen(false);
        setReviewComment('');
      }, 1400);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const scheduled = sessions.filter((s) => s.status === 'scheduled');
  const completed = sessions.filter((s) => s.status === 'completed');

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Learning Sessions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track upcoming 1-on-1 swaps, launch video meeting rooms, and complete sessions to earn points.
        </p>
      </div>

      {/* Scheduled Sessions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <span>Upcoming Scheduled Sessions ({scheduled.length})</span>
        </h2>

        {scheduled.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-500">No upcoming sessions on your schedule.</p>
            <button
              type="button"
              onClick={() => onNavigate('/requests')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Check active swaps to schedule one →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scheduled.map((sess) => {
              const isTeacher = sess.teacherId === currentUser.id;
              const partner = isTeacher ? sess.learnerProfile : sess.teacherProfile;
              return (
                <div
                  key={sess.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={partner?.avatarUrl}
                          name={partner?.fullName}
                          size="lg"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">
                            {partner?.fullName || 'Swap Partner'}
                          </h3>
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {isTeacher ? 'You are teaching' : 'You are learning'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Scheduled
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="font-bold text-slate-900">{sess.skillName}</div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(sess.scheduledAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>({sess.durationMinutes} mins)</span>
                      </div>
                      {sess.notes && (
                        <p className="text-[11px] text-slate-600 italic pt-1">
                          Agenda: {sess.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {sess.meetingLink ? (
                      <a
                        href={sess.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Video className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Join Meeting Room</span>
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">In-person session</span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleMarkCompleted(sess)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-2xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed (+50 pts)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed History */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Completed Sessions ({completed.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completed.map((sess) => {
            const isTeacher = sess.teacherId === currentUser.id;
            const partner = isTeacher ? sess.learnerProfile : sess.teacherProfile;
            return (
              <div
                key={sess.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={partner?.avatarUrl}
                      name={partner?.fullName}
                      size="md"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{sess.skillName}</h4>
                      <p className="text-[11px] text-slate-500">
                        With {partner?.fullName} • Completed
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Completed
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAiSummary(sess)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors cursor-pointer border border-purple-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>✨ AI Summary & Homework</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetSessionForReview(sess);
                      setReviewModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Review Peer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {targetSessionForReview && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title="Review Your SkillSwap Experience"
          subtitle={`Leave structured feedback for ${
            targetSessionForReview.teacherId === currentUser.id
              ? targetSessionForReview.learnerProfile?.fullName
              : targetSessionForReview.teacherProfile?.fullName
          }`}
        >
          {reviewSuccess ? (
            <div className="py-8 text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 fill-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Review Submitted!</h3>
              <p className="text-xs text-slate-500">
                You earned +20 points for contributing valuable feedback to the SkillSwap community!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="text-center py-2 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Select Rating (1 to 5 Stars)
                </span>
                <RatingStars
                  rating={rating}
                  size={28}
                  interactive={true}
                  onChange={(val) => setRating(val)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Highlight Tags:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((t) => {
                    const active = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                          active
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Feedback:
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  required
                  placeholder="What went well? How was their pacing, clarity, and collaboration?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  Submit Review (+20 pts)
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* AI Session Summary Modal */}
      {targetSessionForAi && (
        <Modal
          isOpen={aiSummaryModalOpen}
          onClose={() => setAiSummaryModalOpen(false)}
          title="AI Session Takeaways & Homework"
          subtitle={`Personalized educational review for ${targetSessionForAi.skillName}`}
          maxWidth="xl"
        >
          {generatingAiSummary ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                Gemini is synthesizing session notes, key takeaways, and practice exercises...
              </p>
            </div>
          ) : aiSummaryData ? (
            <div className="space-y-5 text-xs text-slate-700 animate-fade-in">
              {/* Summary */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1.5">
                <div className="font-extrabold text-purple-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Executive Session Summary</span>
                </div>
                <p className="leading-relaxed text-slate-800">{aiSummaryData.summary}</p>
              </div>

              {/* Key Takeaways */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Takeaways
                </h4>
                <div className="space-y-1.5">
                  {aiSummaryData.keyTakeaways.map((k, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                      <span className="font-extrabold text-indigo-600">•</span>
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice Questions */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-600" /> Self-Check Questions
                </h4>
                <div className="space-y-1.5">
                  {aiSummaryData.practiceQuestions.map((q, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-cyan-50/50 border border-cyan-200/70 text-cyan-950">
                      <strong>Q{i + 1}:</strong> {q}
                    </div>
                  ))}
                </div>
              </div>

              {/* Homework & Next Topics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 text-[11px] uppercase block">
                    Recommended Homework
                  </span>
                  <ul className="space-y-1 text-slate-700">
                    {aiSummaryData.homework.map((hw, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>→</span> <span>{hw}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                  <span className="font-bold text-indigo-900 text-[11px] uppercase block">
                    Suggested Next Session
                  </span>
                  <ul className="space-y-1 text-slate-700">
                    {aiSummaryData.nextTopics.map((nt, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>→</span> <span>{nt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAiSummaryModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
};

