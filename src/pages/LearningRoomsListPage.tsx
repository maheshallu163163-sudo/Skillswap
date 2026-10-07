import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LearningRoom, ExperienceLevel, RoomLearningMode, RoomType } from '../types';
import { DatabaseService } from '../services/db';
import {
  GraduationCap,
  Sparkles,
  Plus,
  Users,
  Video,
  Radio,
  Lock,
  Globe,
  ArrowRight,
  Search,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { fireCelebrationConfetti } from '../utils/confetti';
import { UserAvatar } from '../components/UserAvatar';

interface LearningRoomsListPageProps {
  onNavigate: (path: string) => void;
}

export const LearningRoomsListPage: React.FC<LearningRoomsListPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<LearningRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'scheduled' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Room Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [skillName, setSkillName] = useState('Python');
  const [skillLevel, setSkillLevel] = useState<ExperienceLevel>('Beginner');
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [learningMode, setLearningMode] = useState<RoomLearningMode>('hybrid');
  const [roomType, setRoomType] = useState<RoomType>('public');
  const [scheduledAt, setScheduledAt] = useState('2026-10-07T18:00');
  const [isLiveNow, setIsLiveNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const list = await DatabaseService.getLearningRooms();
      setRooms(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !roomName.trim()) return;

    try {
      setSubmitting(true);
      const newRoom = await DatabaseService.createLearningRoom({
        creatorId: currentUser.id,
        name: roomName.trim(),
        description: description.trim(),
        skillName: skillName.trim(),
        skillLevel,
        maxParticipants,
        learningMode,
        roomType,
        status: isLiveNow ? 'live' : 'scheduled',
        scheduledAt: new Date(scheduledAt).toISOString(),
      });

      fireCelebrationConfetti();
      setCreateModalOpen(false);
      onNavigate(`/rooms/${newRoom.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    if (activeTab === 'live' && r.status !== 'live') return false;
    if (activeTab === 'scheduled' && r.status !== 'scheduled') return false;
    if (activeTab === 'private' && r.roomType !== 'private') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchSkill = r.skillName.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      if (!matchName && !matchSkill && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-300 font-bold text-xs">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Interactive Collaborative Spaces</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Learning Rooms
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Dedicated spaces where mentors and learners connect for live video lectures, paired coding, Q&A, and shared resources.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Learning Room</span>
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learning rooms by skill or topic (e.g. Python, Figma, React)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-100 gap-4 overflow-x-auto text-xs font-bold">
          {[
            { id: 'all', label: 'All Rooms' },
            { id: 'live', label: '● Live Now' },
            { id: 'scheduled', label: 'Upcoming / Scheduled' },
            { id: 'private', label: 'Private 1-on-1 Rooms' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="space-y-4">
        {filteredRooms.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900">No learning rooms found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to host a public study room or launch a private swap session!
            </p>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >
              Create Learning Room (+40 pts)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredRooms.map((r) => {
              const isLive = r.status === 'live';
              return (
                <div
                  key={r.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                            {r.skillName}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {r.skillLevel}
                          </span>
                          {r.roomType === 'private' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3" /> Private
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-slate-900 mt-1.5">{r.name}</h3>
                      </div>

                      {/* Status Indicator */}
                      {isLive ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold uppercase shrink-0">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          Live Now
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                          Scheduled
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {r.description || 'Interactive collaborative learning room.'}
                    </p>

                    {/* Metadata: Host & Mode */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          src={r.creatorProfile?.avatarUrl}
                          name={r.creatorProfile?.fullName}
                          size="xs"
                          shape="circle"
                        />
                        <span className="font-semibold text-slate-800">
                          Hosted by {r.creatorProfile?.fullName?.split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.currentParticipantsCount} / {r.maxParticipants}</span>
                        </span>
                        <span className="capitalize text-indigo-600 font-semibold">
                          {r.learningMode} mode
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Join Room CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/rooms/${r.id}`)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CREATE ROOM MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Learning Room"
        subtitle="Host a dedicated collaborative room for teaching, pair coding, or group discussions"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              required
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Python for Beginners Lab, Figma Auto-Layout Sprint"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Learning Goal
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What hands-on skills or exercises will participants practice?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Skill
              </label>
              <input
                type="text"
                required
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g. Python, UI/UX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Skill Level
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Participants
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Learning Mode
              </label>
              <select
                value={learningMode}
                onChange={(e) => setLearningMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="hybrid">Hybrid (Video, Voice, Chat)</option>
                <option value="video">Live Video Only</option>
                <option value="voice">Audio / Voice Only</option>
                <option value="chat">Interactive Chat Lab</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Room Privacy
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="public">Public (Open to Community)</option>
                <option value="private">Private (Invite / Swap Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="liveCheck"
                  checked={isLiveNow}
                  onChange={(e) => setIsLiveNow(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
                <label htmlFor="liveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Launch Live Now
                </label>
              </div>
            </div>

            {!isLiveNow && (
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 pb-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Launching...' : 'Create Room (+40 pts)'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
