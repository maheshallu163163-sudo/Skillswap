import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CallRecord, UserProfile, CallType } from '../types';
import { DatabaseService } from '../services/db';
import {
  Phone,
  Video,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { CallModal } from '../components/CallModal';

interface CallsPageProps {
  onNavigate: (path: string) => void;
}

export const CallsPage: React.FC<CallsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [peers, setPeers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Call Modal state
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [activeCallTarget, setActiveCallTarget] = useState<UserProfile | null>(null);
  const [activeCallType, setActiveCallType] = useState<CallType>('video');

  const loadCallsAndPeers = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [callList, userList] = await Promise.all([
        DatabaseService.getCalls(currentUser.id),
        DatabaseService.getUsers(),
      ]);
      setCalls(callList);
      setPeers(userList.filter((u) => u.id !== currentUser.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCallsAndPeers();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const handleStartCall = (peer: UserProfile, type: CallType) => {
    setActiveCallTarget(peer);
    setActiveCallType(type);
    setCallModalOpen(true);
  };

  const totalMinutes = Math.round(
    calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / 60
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-300 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-Time WebRTC Peer Sessions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Voice & Video Calls
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Connect live with your matched peers for 1-on-1 paired coding, screen sharing, and interactive language practice.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
          <div>
            <div className="text-[11px] font-bold text-slate-300 uppercase">Live Practice Time</div>
            <div className="text-2xl font-extrabold text-white">{totalMinutes} mins</div>
            <div className="text-[10px] text-cyan-300 font-medium">
              {calls.filter((c) => c.status === 'completed').length} completed sessions
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Call with Matched Peers */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span>Quick Call with Matched Peers</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {peers.slice(0, 4).map((peer) => (
            <div
              key={peer.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={peer.avatarUrl}
                  alt={peer.fullName}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{peer.fullName}</h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    Teaches: {peer.skills?.filter((s) => s.type === 'teach')[0]?.name || 'Skills'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => handleStartCall(peer, 'voice')}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartCall(peer, 'video')}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold hover:opacity-95 shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call History Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600" />
          <span>Call History</span>
        </h2>

        {calls.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
            No calls recorded yet. Click above to start a voice or video call with a matched peer!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {calls.map((call) => {
              const isCaller = call.callerId === currentUser.id;
              const partner = isCaller ? call.receiverProfile : call.callerProfile;
              const durationMins = Math.round((call.durationSeconds || 0) / 60);

              return (
                <div
                  key={call.id}
                  className="py-3.5 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        call.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {call.callType === 'video' ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <Phone className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{partner?.fullName || 'Community Peer'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({isCaller ? 'Outgoing' : 'Incoming'})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(call.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-slate-800">
                        {call.status === 'completed' ? `${durationMins} min` : 'Missed'}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          call.status === 'completed' ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {call.status}
                      </span>
                    </div>

                    {partner && (
                      <button
                        type="button"
                        onClick={() => handleStartCall(partner, call.callType)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                      >
                        Call Back
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Call Modal */}
      {activeCallTarget && (
        <CallModal
          isOpen={callModalOpen}
          onClose={() => {
            setCallModalOpen(false);
            loadCallsAndPeers();
          }}
          currentUser={currentUser}
          peerUser={activeCallTarget}
          initialCallType={activeCallType}
        />
      )}
    </div>
  );
};
