import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LearningRoom,
  RoomMember,
  RoomMessage,
  RoomResource,
  RoomRole,
  RoomMessageType,
} from '../types';
import { DatabaseService, subscribeToChannel } from '../services/db';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  BookOpen,
  Hand,
  Settings,
  PhoneOff,
  Pin,
  Send,
  Plus,
  Download,
  ExternalLink,
  Sparkles,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  Megaphone,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';
import { Modal } from '../components/Modal';

interface LearningRoomViewPageProps {
  roomId: string;
  onNavigate: (path: string) => void;
}

export const LearningRoomViewPage: React.FC<LearningRoomViewPageProps> = ({
  roomId,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const [room, setRoom] = useState<LearningRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [resources, setResources] = useState<RoomResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Active side panel: 'chat' | 'participants' | 'resources'
  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | 'resources'>('chat');

  // Media Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Chat input & message type filter
  const [chatInput, setChatInput] = useState('');
  const [messageType, setMessageType] = useState<RoomMessageType>('normal');

  // Add Resource Modal
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState<RoomResource['type']>('link');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceSize, setResourceSize] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const loadRoomData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const roomData = await DatabaseService.getLearningRoomById(roomId);
      if (roomData) {
        setRoom(roomData);
        // Ensure current user is in members list
        await DatabaseService.joinRoom(
          roomId,
          currentUser.id,
          currentUser.id === roomData.creatorId ? 'host' : 'participant'
        );
        const [memList, msgList, resList] = await Promise.all([
          DatabaseService.getRoomMembers(roomId),
          DatabaseService.getRoomMessages(roomId),
          DatabaseService.getRoomResources(roomId),
        ]);
        setMembers(memList);
        setMessages(msgList);
        setResources(resList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomData();

    // Subscribe to room realtime channels
    const unsubMembers = subscribeToChannel(`room-${roomId}-members`, (mList: RoomMember[]) => {
      setMembers(mList);
    });
    const unsubMessages = subscribeToChannel(`room-${roomId}-messages`, (newMsg: RoomMessage) => {
      setMessages((prev) => [...prev, newMsg]);
    });
    const unsubResources = subscribeToChannel(`room-${roomId}-resources`, (newRes: RoomResource) => {
      if (newRes) setResources((prev) => [newRes, ...prev]);
    });

    return () => {
      unsubMembers();
      unsubMessages();
      unsubResources();
    };
  }, [roomId, currentUser?.id]);

  // Try opening local camera feed
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!isVideoOff) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((s) => {
          stream = s;
          if (localVideoRef.current) localVideoRef.current.srcObject = s;
        })
        .catch(() => {});
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isVideoOff]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePanel]);

  if (!currentUser) return null;
  if (!room) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Loading learning room...</p>
      </div>
    );
  }

  const isHost = room.creatorId === currentUser.id;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    await DatabaseService.sendRoomMessage(
      roomId,
      currentUser.id,
      currentUser.fullName,
      currentUser.avatarUrl,
      chatInput.trim(),
      messageType
    );
    setChatInput('');
    setMessageType('normal');
  };

  const handleToggleHand = async () => {
    const next = !handRaised;
    setHandRaised(next);
    await DatabaseService.updateRoomMember(roomId, currentUser.id, { handRaised: next });
    if (next) fireCelebrationConfetti();
  };

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    await DatabaseService.updateRoomMember(roomId, currentUser.id, { isMuted: next });
  };

  const handleToggleVideo = async () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    await DatabaseService.updateRoomMember(roomId, currentUser.id, { isVideoOff: next });
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;

    await DatabaseService.addRoomResource(
      roomId,
      currentUser.id,
      currentUser.fullName,
      resourceTitle.trim(),
      resourceType,
      resourceUrl.trim(),
      resourceSize || 'External Asset'
    );
    setAddResourceModalOpen(false);
    setResourceTitle('');
    setResourceUrl('');
    setResourceSize('');
  };

  const handleLeaveRoom = async () => {
    await DatabaseService.leaveRoom(roomId, currentUser.id);
    onNavigate('/rooms');
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-fade-in">
      {/* ------------------------------------------------------------- */}
      {/* ROOM HEADER BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => onNavigate('/rooms')}
            className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            ← Exit
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {room.name}
              </h1>
              {room.status === 'live' && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-extrabold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Skill: {room.skillName} • Level: {room.skillLevel} • {members.length} participants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Panel Toggle Tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setActivePanel('chat')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activePanel === 'chat' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('participants')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activePanel === 'participants' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('resources')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activePanel === 'resources' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Resources ({resources.length})
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA: VIDEO GRID + SIDE PANEL */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Presentation / Video Area */}
        <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden bg-slate-950">
          {/* Main Video Presentation Screen */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            {/* Screen Content Simulation */}
            {isScreenSharing ? (
              <div className="w-full h-full p-8 flex flex-col justify-center items-center text-center bg-indigo-950/40">
                <Monitor className="w-16 h-16 text-cyan-400 mb-3 animate-pulse" />
                <h3 className="text-xl font-bold text-white">Live Screen Sharing Active</h3>
                <p className="text-xs text-slate-300 max-w-md mt-1">
                  Broadcasting live code editor & slides to all {members.length} participants in the room.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full h-full p-3 overflow-y-auto">
                {/* Local user tile */}
                <div className="relative rounded-2xl bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center min-h-[140px]">
                  {isVideoOff ? (
                    <div className="text-center space-y-1">
                      <img
                        src={currentUser.avatarUrl}
                        alt="You"
                        className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-slate-600"
                      />
                      <span className="text-xs font-bold text-slate-300 block">{currentUser.fullName} (You)</span>
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
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white flex items-center gap-1">
                    <span>You {isHost ? '(Host)' : ''}</span>
                    {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                    {handRaised && <span>✋</span>}
                  </div>
                </div>

                {/* Other members tiles */}
                {members
                  .filter((m) => m.userId !== currentUser.id)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="relative rounded-2xl bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center min-h-[140px]"
                    >
                      <div className="text-center space-y-1">
                        <img
                          src={m.userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                          alt={m.userProfile?.fullName || 'Peer'}
                          className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-slate-600"
                        />
                        <span className="text-xs font-bold text-slate-300 block">
                          {m.userProfile?.fullName || 'Peer'}
                        </span>
                      </div>

                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white flex items-center gap-1">
                        <span>{m.userProfile?.fullName?.split(' ')[0]}</span>
                        {m.role === 'host' && <span className="text-amber-400">👑</span>}
                        {m.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                        {m.handRaised && <span className="animate-bounce">✋</span>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Tab Side Panel (Chat, Participants, Resources) */}
        <div className="w-80 sm:w-96 border-l border-slate-800 bg-slate-900 flex flex-col justify-between">
          {/* TAB 1: ROOM CHAT */}
          {activePanel === 'chat' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Pinned Messages Header */}
              {pinnedMessages.length > 0 && (
                <div className="p-3 bg-indigo-950/60 border-b border-indigo-800/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-indigo-400">
                    <Pin className="w-3 h-3" /> Pinned Announcement
                  </div>
                  <p className="text-xs text-indigo-200 line-clamp-2 italic">
                    "{pinnedMessages[0].content}"
                  </p>
                </div>
              )}

              {/* Chat Messages Stream */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-300">{msg.senderName}</span>
                        {msg.type === 'question' && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 rounded bg-amber-500/20 text-amber-400">
                            Question
                          </span>
                        )}
                        {msg.type === 'announcement' && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 rounded bg-purple-500/20 text-purple-400">
                            Host Note
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p
                      className={`p-2 rounded-xl text-slate-200 leading-relaxed ${
                        msg.type === 'question'
                          ? 'bg-amber-950/30 border border-amber-800/40'
                          : msg.type === 'announcement'
                          ? 'bg-purple-950/40 border border-purple-800/40 font-semibold'
                          : 'bg-slate-800/70'
                      }`}
                    >
                      {msg.content}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Message Type Selector + Input */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400 font-bold">Type:</span>
                  <button
                    type="button"
                    onClick={() => setMessageType('normal')}
                    className={`px-2 py-0.5 rounded-md font-bold ${
                      messageType === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('question')}
                    className={`px-2 py-0.5 rounded-md font-bold ${
                      messageType === 'question' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Question ❓
                  </button>
                  {isHost && (
                    <button
                      type="button"
                      onClick={() => setMessageType('announcement')}
                      className={`px-2 py-0.5 rounded-md font-bold ${
                        messageType === 'announcement' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Announcement 📢
                    </button>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question or chat..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: PARTICIPANTS */}
          {activePanel === 'participants' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Room Members ({members.length})
              </div>
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                        alt={m.userProfile?.fullName || 'User'}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{m.userProfile?.fullName}</span>
                          {m.userId === currentUser.id && <span className="text-[10px] text-slate-400">(You)</span>}
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase">
                          {m.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.handRaised && <span className="text-sm">✋</span>}
                      {m.isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SHARED RESOURCES */}
          {activePanel === 'resources' && (
            <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Room Resources ({resources.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddResourceModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Resource
                  </button>
                </div>

                <div className="space-y-2">
                  {resources.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 text-center">
                      No shared materials yet. Upload slides, notes, or links!
                    </p>
                  ) : (
                    resources.map((res) => (
                      <div
                        key={res.id}
                        className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{res.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Uploaded by {res.uploaderName} • {res.size}
                          </div>
                        </div>

                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROOM CONTROLS FOOTER BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            type="button"
            onClick={handleToggleVideo}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Share Screen */}
          <button
            type="button"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={handleToggleHand}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              handRaised ? 'bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Raise / Lower Hand"
          >
            <Hand className="w-5 h-5" />
          </button>
        </div>

        {/* Leave Room Button */}
        <button
          type="button"
          onClick={handleLeaveRoom}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave Room</span>
        </button>
      </div>

      {/* Add Resource Modal */}
      <Modal
        isOpen={addResourceModalOpen}
        onClose={() => setAddResourceModalOpen(false)}
        title="Share Learning Resource"
        subtitle="Add a PDF, documentation link, code repo, or study notes for room members"
      >
        <form onSubmit={handleAddResource} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Resource Title
            </label>
            <input
              type="text"
              required
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
              placeholder="e.g. Python Asynchronous Cheat Sheet"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Resource Type
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="link">Web Link / Repo</option>
                <option value="pdf">PDF Document</option>
                <option value="note">Study Notes</option>
                <option value="video">Recorded Video</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                File Size / Label
              </label>
              <input
                type="text"
                value={resourceSize}
                onChange={(e) => setResourceSize(e.target.value)}
                placeholder="e.g. 1.8 MB or GitHub"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Resource URL
            </label>
            <input
              type="url"
              required
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddResourceModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Share with Room
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
