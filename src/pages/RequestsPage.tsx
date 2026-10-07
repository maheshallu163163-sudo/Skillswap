import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SwapRequest, UserProfile } from '../types';
import { DatabaseService } from '../services/db';
import {
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  MessageSquare,
  Calendar,
  User,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';
import { Modal } from '../components/Modal';
import { UserAvatar } from '../components/UserAvatar';

interface RequestsPageProps {
  onNavigate: (path: string) => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'active' | 'completed'>('incoming');

  // Schedule Session Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [targetRequest, setTargetRequest] = useState<SwapRequest | null>(null);
  const [scheduledDate, setScheduledDate] = useState('2026-10-12T18:00');
  const [meetingMode, setMeetingMode] = useState<'online' | 'in-person'>('online');
  const [meetingLink, setMeetingLink] = useState('https://meet.skillswap.dev/session-room');
  const [sessionNotes, setSessionNotes] = useState('Initial 1-on-1 swap session setup');
  const [submittingSession, setSubmittingSession] = useState(false);

  const loadRequests = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const list = await DatabaseService.getSwapRequests(currentUser.id);
      setRequests(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const incoming = requests.filter((r) => r.receiverId === currentUser.id && r.status === 'pending');
  const sent = requests.filter((r) => r.senderId === currentUser.id && r.status === 'pending');
  const activeSwaps = requests.filter((r) => r.status === 'accepted');
  const completedSwaps = requests.filter((r) => r.status === 'completed');

  const handleUpdateStatus = async (requestId: string, newStatus: SwapRequest['status']) => {
    try {
      await DatabaseService.updateSwapRequestStatus(requestId, newStatus, currentUser.id);
      if (newStatus === 'accepted') {
        fireCelebrationConfetti();
      }
      await loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartChat = async (partnerId: string) => {
    const conv = await DatabaseService.getOrCreateConversation(currentUser.id, partnerId);
    onNavigate(`/messages/${conv.id}`);
  };

  const handleOpenScheduleModal = (req: SwapRequest) => {
    setTargetRequest(req);
    setScheduleModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRequest) return;
    try {
      setSubmittingSession(true);
      await DatabaseService.createSession({
        swapRequestId: targetRequest.id,
        teacherId: targetRequest.receiverId,
        learnerId: targetRequest.senderId,
        skillId: targetRequest.teachSkillId,
        skillName: `${targetRequest.teachSkillName} ↔ ${targetRequest.learnSkillName}`,
        scheduledAt: new Date(scheduledDate).toISOString(),
        durationMinutes: 60,
        meetingMode: meetingMode as any,
        meetingLink,
        notes: sessionNotes,
      });
      setScheduleModalOpen(false);
      fireCelebrationConfetti();
      onNavigate('/sessions');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSession(false);
    }
  };

  const currentList = {
    incoming,
    sent,
    active: activeSwaps,
    completed: completedSwaps,
  }[activeTab];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Swap Proposals & Requests
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage incoming invitations, track sent proposals, and launch collaborative learning sessions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-1">
        {[
          { id: 'incoming', label: 'Incoming Requests', count: incoming.length, icon: Inbox },
          { id: 'sent', label: 'Sent Requests', count: sent.length, icon: Send },
          { id: 'active', label: 'Active Swaps', count: activeSwaps.length, icon: ArrowRightLeft },
          { id: 'completed', label: 'Completed', count: completedSwaps.length, icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-2 border-b-2 font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {currentList.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              No {activeTab} swap proposals
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'incoming' && 'When other members discover your skills and propose a trade, they will appear here.'}
              {activeTab === 'sent' && 'Explore the Discover directory to find members and send your first swap proposal.'}
              {activeTab === 'active' && 'Once a request is accepted, your active partnership displays here with chat & scheduling.'}
              {activeTab === 'completed' && 'Completed swaps will be recorded here with ratings and earned points.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/discover')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >
              Discover Skills Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentList.map((req) => {
              const otherUser = req.senderId === currentUser.id ? req.receiverProfile : req.senderProfile;
              return (
                <div
                  key={req.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Partner Info */}
                    <div className="flex items-center gap-3.5">
                      <UserAvatar
                        src={otherUser?.avatarUrl}
                        name={otherUser?.fullName}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-bold text-base text-slate-900">
                          {otherUser?.fullName || 'Community Peer'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {otherUser?.city || 'Remote'} • Rating: ★ {otherUser?.rating || 5.0}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wider ${
                          req.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : req.status === 'cancelled'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>

                  {/* Reciprocal Skills Visual */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">Offers to teach:</span>
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
                        {req.teachSkillName}
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center mx-auto sm:mx-0">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">Wants to learn:</span>
                      <span className="font-extrabold text-cyan-700 bg-cyan-50 px-2 py-1 rounded-lg border border-cyan-200">
                        {req.learnSkillName}
                      </span>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="text-xs text-slate-700 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 italic">
                    "{req.message}"
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Proposed on {new Date(req.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {otherUser && (
                        <button
                          type="button"
                          onClick={() => onNavigate(`/profile/${otherUser.id}`)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                        >
                          View Profile
                        </button>
                      )}

                      {/* Pending Incoming Actions */}
                      {req.status === 'pending' && req.receiverId === currentUser.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'declined')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'accepted')}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs hover:opacity-95 shadow-xs transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Proposal (+30 pts)
                          </button>
                        </>
                      )}

                      {/* Pending Sent Actions */}
                      {req.status === 'pending' && req.senderId === currentUser.id && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Cancel Request
                        </button>
                      )}

                      {/* Active Actions */}
                      {req.status === 'accepted' && otherUser && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartChat(otherUser.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal(req)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-xs transition-all cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Schedule Session
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Session Modal */}
      {targetRequest && (
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title="Schedule Learning Session"
          subtitle={`Plan your 1-on-1 swap meeting for ${targetRequest.teachSkillName} ↔ ${targetRequest.learnSkillName}`}
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Meeting Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMeetingMode('online')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                    meetingMode === 'online'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  Online Video
                </button>
                <button
                  type="button"
                  onClick={() => setMeetingMode('in-person')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                    meetingMode === 'in-person'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  In-Person Meetup
                </button>
              </div>
            </div>

            {meetingMode === 'online' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Meeting Video Link (Google Meet / Zoom / Discord)
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Meeting Location / Venue
                </label>
                <input
                  type="text"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="e.g. Central Library Study Room 4, San Francisco"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session Agenda & Topics
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
                placeholder="What topics will you cover in the first 30m vs second 30m?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingSession}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
              >
                Confirm & Add to Calendar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
