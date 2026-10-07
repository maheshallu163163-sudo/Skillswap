import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, CallType, CallStatus } from '../types';
import { DatabaseService } from '../services/db';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  Monitor,
  Volume2,
  VolumeX,
  MessageSquare,
  Sparkles,
  Wifi,
  Radio,
  Maximize2,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  peerUser: UserProfile;
  initialCallType?: CallType;
  conversationId?: string;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  peerUser,
  initialCallType = 'video',
  conversationId,
}) => {
  const [callType, setCallType] = useState<CallType>(initialCallType);
  const [callStatus, setCallStatus] = useState<CallStatus>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(initialCallType === 'voice');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'Excellent' | 'Good' | 'Fair'>('Excellent');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  // Initialize call in database & start timer
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const initCall = async () => {
      try {
        const call = await DatabaseService.createCall(
          currentUser.id,
          peerUser.id,
          callType,
          conversationId
        );
        if (mounted) {
          setActiveCallId(call.id);
          // Simulate connection establishment
          setTimeout(() => {
            if (mounted) {
              setCallStatus('connected');
              DatabaseService.updateCallStatus(call.id, 'connected');
            }
          }, 1800);
        }
      } catch (err) {
        console.error('Call initialization error:', err);
      }
    };

    initCall();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Duration counter once connected
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Try real webcam feed if available and video is on
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen && !isVideoOff && callType === 'video') {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((s) => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Camera permission denied or not available; fallback to simulated avatar/video state cleanly
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, isVideoOff, callType]);

  if (!isOpen) return null;

  const handleEndCall = async () => {
    if (activeCallId) {
      await DatabaseService.updateCallStatus(activeCallId, 'completed', durationSeconds);
      // Award points for participating in live call session
      if (durationSeconds > 5) {
        await DatabaseService.addPoints(currentUser.id, 10, `Completed ${callType} call with ${peerUser.fullName}`);
        fireCelebrationConfetti();
      }
    }
    setCallStatus('completed');
    onClose();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[86vh] max-h-[720px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 flex items-center justify-between text-white border-b border-slate-800/80 bg-slate-950/40 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-sm shadow-md">
              {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">{peerUser.fullName}</h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  {callType} Call
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {callStatus === 'calling' && <span className="animate-pulse">Calling peer...</span>}
                {callStatus === 'connected' && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {formatDuration(durationSeconds)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {callStatus === 'connected' && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">{connectionQuality}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleEndCall}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close window"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Center Calling Area (Main Remote Participant + Picture-in-Picture) */}
        <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-slate-950">
          {/* Main Remote View */}
          {callType === 'video' ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {/* Remote Participant Avatar / Video Presentation */}
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <img
                    src={peerUser.avatarUrl}
                    alt={peerUser.fullName}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-slate-700 shadow-xl mx-auto"
                  />
                  {callStatus === 'calling' && (
                    <div className="absolute inset-0 rounded-3xl ring-4 ring-indigo-500 animate-ping pointer-events-none" />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">{peerUser.fullName}</h4>
                  <p className="text-xs text-slate-400">
                    {callStatus === 'calling'
                      ? 'Waiting for peer to accept call...'
                      : 'Audio & Video Connected via WebRTC'}
                  </p>
                </div>
              </div>

              {/* Local Picture-in-Picture (PiP) Window */}
              <div className="absolute bottom-4 right-4 w-32 sm:w-44 h-24 sm:h-32 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-2xl z-20">
                {isVideoOff ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Camera Off</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}
                <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-black/60 px-1.5 rounded">
                  You
                </div>
              </div>
            </div>
          ) : (
            /* Voice Call Graphic View */
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <img
                  src={peerUser.avatarUrl}
                  alt={peerUser.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500 shadow-2xl mx-auto"
                />
                <div className="absolute -bottom-1 right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900">
                  <Mic className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-xl">{peerUser.fullName}</h4>
                <p className="text-xs text-indigo-300 font-medium">
                  {callStatus === 'connected' ? `Active Voice Call • ${formatDuration(durationSeconds)}` : 'Connecting audio stream...'}
                </p>
              </div>

              {/* Waveform Animation for Voice */}
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[40, 70, 30, 90, 60, 45, 80, 35, 65, 50].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${callStatus === 'connected' ? h : 12}%`,
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 sm:p-6 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-center gap-3 sm:gap-4 z-20">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera */}
          {callType === 'video' && (
            <button
              type="button"
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isVideoOff
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Screen Sharing Toggle */}
          <button
            type="button"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Speaker Mute */}
          <button
            type="button"
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isSpeakerMuted ? 'bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title="Speaker Volume"
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-14 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold shadow-lg shadow-red-600/30 hover:scale-105 transition-all cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
