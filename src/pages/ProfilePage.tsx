import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserSkill, Review, UserBadge, ExperienceLevel } from '../types';
import { DatabaseService } from '../services/db';
import { SkillBadge } from '../components/SkillBadge';
import { RatingStars } from '../components/RatingStars';
import { Modal } from '../components/Modal';
import { SwapRequestModal } from '../components/SwapRequestModal';
import { UserAvatar } from '../components/UserAvatar';
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader';
import { GeminiService } from '../services/gemini';
import {
  MapPin,
  Calendar,
  Monitor,
  Flame,
  Award,
  Star,
  Plus,
  Edit3,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRightLeft,
  Loader2,
  Globe,
  Briefcase,
  Camera,
  Upload,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface ProfilePageProps {
  userId: string;
  onNavigate: (path: string) => void;
  initialEditOpen?: boolean;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  onNavigate,
  initialEditOpen = false,
}) => {
  const { currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // Photo Uploader Modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(initialEditOpen);
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [loadingAiBio, setLoadingAiBio] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Skill Modal
  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Programming & Web Dev');
  const [newSkillType, setNewSkillType] = useState<'teach' | 'learn'>('teach');
  const [newSkillLevel, setNewSkillLevel] = useState<ExperienceLevel>('Intermediate');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [savingSkill, setSavingSkill] = useState(false);

  // Send Swap Request Modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await DatabaseService.getUserById(userId);
      setProfile(user);
      if (user) {
        setEditBio(user.bio || '');
        setEditCity(user.city || '');
        setEditExperience(user.experience || '');
        setEditGoals(user.learningGoals || '');

        const [rList, bList] = await Promise.all([
          DatabaseService.getReviews(user.id),
          DatabaseService.getUserBadges(user.id),
        ]);
        setReviews(rList);
        setBadges(bList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // Keep profile in sync if currentUser avatar or details change while viewing own profile
  useEffect(() => {
    if (currentUser && profile && currentUser.id === profile.id) {
      setProfile((prev) => (prev ? { ...prev, ...currentUser } : currentUser));
    }
  }, [currentUser]);

  if (loading && !profile) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 h-64 flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-slate-200" />
          <div className="space-y-3 flex-1">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-32 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Profile Not Found</h3>
        <p className="text-xs text-slate-500">The requested user profile does not exist.</p>
        <button
          type="button"
          onClick={() => onNavigate('/discover')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Explore Discover
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const teachSkills = (profile.skills || []).filter((s) => s.type === 'teach');
  const learnSkills = (profile.skills || []).filter((s) => s.type === 'learn');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updated = await updateUser({
        bio: editBio,
        city: editCity,
        experience: editExperience,
        learningGoals: editGoals,
      });
      setProfile(updated);
      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGenerateBioWithAi = async () => {
    try {
      setLoadingAiBio(true);
      const res = await GeminiService.generateProfileBio({
        fullName: profile.fullName,
        skillsTeach: teachSkills.map((s) => s.name),
        skillsLearn: learnSkills.map((s) => s.name),
        experience: editExperience,
        goals: editGoals,
      });
      if (res) setEditBio(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAiBio(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      setSavingSkill(true);
      const updated = await DatabaseService.addSkill(profile.id, {
        skillId: `s-${newSkillName.toLowerCase().replace(/\s+/g, '-')}`,
        name: newSkillName.trim(),
        category: newSkillCategory,
        type: newSkillType,
        experienceLevel: newSkillLevel,
        description: newSkillDesc,
      });
      setProfile(updated);
      setAddSkillModalOpen(false);
      setNewSkillName('');
      setNewSkillDesc('');
      fireCelebrationConfetti();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      const updated = await DatabaseService.removeSkill(profile.id, skillId);
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ------------------------------------------------------------- */}
      {/* PROFILE HEADER HERO */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Real User Avatar with interactive photo edit button */}
            <div className="relative group">
              <UserAvatar
                src={profile.avatarUrl}
                name={profile.fullName}
                size="2xl"
                shape="rounded"
                showOnlineStatus
                className="border-4 border-white shadow-md ring-2 ring-indigo-100"
              />

              {/* If viewing own profile, show interactive camera button overlay */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                  title="Change your profile photo"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {profile.fullName}
                </h1>
                <div className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{profile.points} pts</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.city || 'Global Remote'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span className="capitalize">{profile.learningMode} sessions</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{(profile.languages || ['English']).join(', ')}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-center sm:justify-start gap-4">
                <RatingStars rating={profile.rating} showText count={profile.reviewCount} size={16} />
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">
                  {profile.completedSwapsCount} completed swaps
                </span>
              </div>
            </div>
          </div>

          {/* Action Button: Edit vs Send Swap Request */}
          <div className="flex items-center justify-center sm:justify-end gap-3">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-white" />
                  <span>Edit Profile</span>
                </button>
              </div>
            ) : (
              currentUser && (
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Send Swap Request</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Bio & Background */}
        {profile.bio && (
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">About & Learning Philosophy</span>
            {profile.bio}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SKILLS GRID: TEACH VS LEARN */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Can Teach Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Can Teach ({teachSkills.length})</span>
            </h2>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  setNewSkillType('teach');
                  setAddSkillModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            )}
          </div>

          {teachSkills.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No teaching skills listed yet.</p>
          ) : (
            <div className="space-y-3">
              {teachSkills.map((sk) => (
                <div
                  key={sk.id}
                  className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100/70 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{sk.name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {sk.experienceLevel}
                      </span>
                    </div>
                    {sk.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{sk.description}</p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wants to Learn Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Wants to Learn ({learnSkills.length})</span>
            </h2>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  setNewSkillType('learn');
                  setAddSkillModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            )}
          </div>

          {learnSkills.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No learning goals listed yet.</p>
          ) : (
            <div className="space-y-3">
              {learnSkills.map((sk) => (
                <div
                  key={sk.id}
                  className="p-3.5 rounded-2xl bg-cyan-50/40 border border-cyan-100/70 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{sk.name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        Target: {sk.experienceLevel}
                      </span>
                    </div>
                    {sk.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{sk.description}</p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REVIEWS & BADGES */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reviews Box */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Peer Reviews & Testimonials ({reviews.length})</span>
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400">No peer reviews yet. Complete a swap session to earn reputation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        src={rev.reviewerAvatar}
                        name={rev.reviewerName}
                        size="sm"
                        shape="circle"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900">{rev.reviewerName}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <RatingStars rating={rev.rating} size={13} />
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{rev.comment}"
                  </p>

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rev.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold"
                        >
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges Box */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Badges ({badges.length})</span>
          </h2>

          {badges.length === 0 ? (
            <p className="text-xs text-slate-400">No badges earned yet.</p>
          ) : (
            <div className="space-y-2">
              {badges.map((ub) => (
                <div
                  key={ub.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">
                    🏆
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{ub.badge.name}</div>
                    <div className="text-[10px] text-slate-500">{ub.badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EDIT PROFILE MODAL (Includes Profile Photo Card Section 5 & 17) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile"
        subtitle="Update your profile photo, biographical info, and learning goals"
      >
        <div className="space-y-6">
          {/* Profile Photo Editor Box (Sections 5 & 17) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <UserAvatar
              src={currentUser?.avatarUrl}
              name={currentUser?.fullName}
              size="xl"
              shape="rounded"
              className="border-2 border-indigo-200 shadow-sm"
            />
            <div className="flex-1 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Profile Photo
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Personal photos help build reciprocal trust. JPG, PNG or WEBP, maximum 5 MB.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Change Photo</span>
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                City / Location
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Background / Experience
              </label>
              <input
                type="text"
                value={editExperience}
                onChange={(e) => setEditExperience(e.target.value)}
                placeholder="e.g. Senior Software Engineer (6 yrs)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Learning Goals
              </label>
              <input
                type="text"
                value={editGoals}
                onChange={(e) => setEditGoals(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Profile Bio
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBioWithAi}
                  disabled={loadingAiBio}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 disabled:opacity-50 cursor-pointer"
                >
                  {loadingAiBio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" /> ✨ Generate Bio with AI
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* PROFILE PHOTO UPLOADER MODAL (Section 5, 6, 7, 8, 9, 10)       */}
      {/* ------------------------------------------------------------- */}
      <ProfilePhotoUploader
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onSuccess={(newUrl) => {
          setProfile((prev) => (prev ? { ...prev, avatarUrl: newUrl } : null));
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* ADD SKILL MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={addSkillModalOpen}
        onClose={() => setAddSkillModalOpen(false)}
        title={newSkillType === 'teach' ? 'Add Skill You Can Teach' : 'Add Skill You Want to Learn'}
        subtitle="List practical competencies to improve reciprocal matching"
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Skill Name
            </label>
            <input
              type="text"
              required
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="e.g. Next.js, Product Management, Spanish"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Programming & Web Dev">Programming & Web Dev</option>
                <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                <option value="Languages">Languages</option>
                <option value="Music & Audio">Music & Audio</option>
                <option value="Business & Marketing">Business & Marketing</option>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Creative Arts & Media">Creative Arts & Media</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Experience Level
              </label>
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={newSkillDesc}
              onChange={(e) => setNewSkillDesc(e.target.value)}
              placeholder="What specifically can you teach or what are you hoping to learn?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddSkillModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingSkill}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs hover:opacity-95 shadow-md cursor-pointer disabled:opacity-50"
            >
              {savingSkill ? 'Adding...' : 'Add Skill (+10 pts)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* SWAP REQUEST MODAL */}
      {/* ------------------------------------------------------------- */}
      {currentUser && (
        <SwapRequestModal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          currentUser={currentUser}
          recipientUser={profile}
        />
      )}
    </div>
  );
};
