import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MASTER_SKILLS, SKILL_CATEGORIES } from '../data/skills';
import { ExperienceLevel, LearningMode, UserSkill } from '../types';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  X,
  Compass,
  MapPin,
  Clock,
  Globe,
  Loader2,
} from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { fireCelebrationConfetti } from '../utils/confetti';

interface OnboardingPageProps {
  onNavigate: (path: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { currentUser, updateUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  );
  const [city, setCity] = useState(currentUser?.city || 'San Francisco, CA');
  const [teachSkills, setTeachSkills] = useState<string[]>(['Python']);
  const [learnSkills, setLearnSkills] = useState<string[]>(['UI/UX Design']);
  const [newTeachInput, setNewTeachInput] = useState('');
  const [newLearnInput, setNewLearnInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');
  const [language, setLanguage] = useState('English');
  const [learningMode, setLearningMode] = useState<LearningMode>('online');
  const [availability, setAvailability] = useState<string[]>(['Weekday evenings', 'Weekends']);
  const [goals, setGoals] = useState('Learn core frameworks and build real projects collaboratively.');
  const [bio, setBio] = useState('');
  const [loadingBio, setLoadingBio] = useState(false);
  const [saving, setSaving] = useState(false);

  // Available avatars to pick from
  const avatarOptions = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleAvailability = (slot: string) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleGenerateBio = async () => {
    try {
      setLoadingBio(true);
      const generated = await GeminiService.generateProfileBio({
        fullName,
        skillsTeach: teachSkills,
        skillsLearn: learnSkills,
        experience: `${experienceLevel} practitioner in ${city}`,
        goals,
      });
      if (generated) setBio(generated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBio(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      // Map skills to UserSkill objects
      const formattedSkills: UserSkill[] = [
        ...teachSkills.map((name, i) => ({
          id: `sk-t-${Date.now()}-${i}`,
          userId: currentUser?.id || 'user-new',
          skillId: `s-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name,
          category: 'Technology & Design',
          type: 'teach' as const,
          experienceLevel,
          isPrimary: i === 0,
        })),
        ...learnSkills.map((name, i) => ({
          id: `sk-l-${Date.now()}-${i}`,
          userId: currentUser?.id || 'user-new',
          skillId: `s-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name,
          category: 'Technology & Design',
          type: 'learn' as const,
          experienceLevel: 'Beginner' as const,
          isPrimary: i === 0,
        })),
      ];

      await updateUser({
        fullName,
        avatarUrl,
        city,
        languages: [language],
        learningMode,
        availability,
        learningGoals: goals,
        bio: bio || `Passionate about sharing ${teachSkills.join(', ')} and excited to learn ${learnSkills.join(', ')}!`,
        skills: formattedSkills,
      });

      fireCelebrationConfetti();
      setTimeout(() => {
        onNavigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setSaving(false);
    }
  };

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/80">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 space-y-6">
        {/* Progress Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Step {currentStep} of {totalSteps}</span>
            <span className="text-indigo-600 font-extrabold">{progressPercentage}% Completed</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step 1: Name and Profile Photo */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Let's start with your profile</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your preferred name and choose a photo so other learners recognize you.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Choose Profile Photo
              </label>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {avatarOptions.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="avatar option"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-14 h-14 rounded-2xl object-cover cursor-pointer transition-all border-2 ${
                      avatarUrl === url
                        ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: City / Location */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Where are you located?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This helps us match time zones and suggest in-person sessions if you choose.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                City / Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. San Francisco, CA or London, UK"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Skills I Can Teach */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">What skills can you teach?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pick or type skills where you feel comfortable guiding a beginner or intermediate peer.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTeachInput}
                onChange={(e) => setNewTeachInput(e.target.value)}
                placeholder="e.g. Python, Figma, Guitar..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newTeachInput.trim()) {
                      setTeachSkills([...teachSkills, newTeachInput.trim()]);
                      setNewTeachInput('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newTeachInput.trim()) {
                    setTeachSkills([...teachSkills, newTeachInput.trim()]);
                    setNewTeachInput('');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
              >
                Add
              </button>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Popular suggestions:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MASTER_SKILLS.slice(0, 8).map((ms) => {
                  const selected = teachSkills.includes(ms.name);
                  return (
                    <button
                      key={ms.id}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setTeachSkills(teachSkills.filter((s) => s !== ms.name));
                        } else {
                          setTeachSkills([...teachSkills, ms.name]);
                        }
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {ms.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="text-xs font-bold text-indigo-900 block mb-1.5">Selected to teach:</span>
              <div className="flex flex-wrap gap-1.5">
                {teachSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-800 rounded-lg text-xs font-bold"
                  >
                    {s}
                    <X
                      className="w-3 h-3 text-slate-400 hover:text-red-500 cursor-pointer"
                      onClick={() => setTeachSkills(teachSkills.filter((_, i) => i !== idx))}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Skills I Want to Learn */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">What skills do you want to learn?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose the domains you're most excited to explore through peer mentorship.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newLearnInput}
                onChange={(e) => setNewLearnInput(e.target.value)}
                placeholder="e.g. UI/UX Design, React, Public Speaking..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newLearnInput.trim()) {
                      setLearnSkills([...learnSkills, newLearnInput.trim()]);
                      setNewLearnInput('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newLearnInput.trim()) {
                    setLearnSkills([...learnSkills, newLearnInput.trim()]);
                    setNewLearnInput('');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-700"
              >
                Add
              </button>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Popular suggestions:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MASTER_SKILLS.slice(7, 15).map((ms) => {
                  const selected = learnSkills.includes(ms.name);
                  return (
                    <button
                      key={ms.id}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setLearnSkills(learnSkills.filter((s) => s !== ms.name));
                        } else {
                          setLearnSkills([...learnSkills, ms.name]);
                        }
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                        selected
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {ms.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100">
              <span className="text-xs font-bold text-cyan-900 block mb-1.5">Selected to learn:</span>
              <div className="flex flex-wrap gap-1.5">
                {learnSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-cyan-200 text-cyan-800 rounded-lg text-xs font-bold"
                  >
                    {s}
                    <X
                      className="w-3 h-3 text-slate-400 hover:text-red-500 cursor-pointer"
                      onClick={() => setLearnSkills(learnSkills.filter((_, i) => i !== idx))}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Experience Level */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Your teaching experience level</h3>
              <p className="text-xs text-slate-500 mt-1">
                How would you describe your overall mastery in what you teach?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['Beginner', 'Intermediate', 'Advanced', 'Expert'] as ExperienceLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExperienceLevel(lvl)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    experienceLevel === lvl
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm">{lvl}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lvl === 'Beginner' && 'Fundamental knowledge, great for newcomers'}
                    {lvl === 'Intermediate' && 'Solid hands-on project experience'}
                    {lvl === 'Advanced' && 'Multi-year practitioner, handles complex topics'}
                    {lvl === 'Expert' && 'Industry specialist, deep architectural knowledge'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Preferred Language */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Preferred speaking language</h3>
              <p className="text-xs text-slate-500 mt-1">
                Which language would you prefer to conduct your 1-on-1 swap sessions in?
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {['English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi', 'Japanese', 'Korean'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    language === lang
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Learning Mode */}
        {currentStep === 7 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Preferred learning mode</h3>
              <p className="text-xs text-slate-500 mt-1">
                Do you prefer online video sessions, meeting in person, or either?
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'online', title: 'Online Video / Calls', desc: 'Flexible video meetings (Google Meet, Zoom, Discord)' },
                { id: 'in-person', title: 'In-person Meetings', desc: 'Coffee shops, co-working spaces, local libraries' },
                { id: 'both', title: 'Both Online & In-person', desc: 'Completely flexible depending on partner' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLearningMode(m.id as LearningMode)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    learningMode === m.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm">{m.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Availability */}
        {currentStep === 8 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">When are you available?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select all recurring time windows that work for you.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                'Weekday mornings (8am - 12pm)',
                'Weekday afternoons (12pm - 5pm)',
                'Weekday evenings (5pm - 9pm)',
                'Weekends (Flexible timing)',
              ].map((slot) => {
                const checked = availability.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleAvailability(slot)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      checked
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{slot}</span>
                    {checked && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 9: Learning Goals & Bio */}
        {currentStep === 9 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Your goals & bio</h3>
              <p className="text-xs text-slate-500 mt-1">
                Share what you want to achieve. Gemini can even write your bio automatically!
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Learning Goals
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={2}
                placeholder="What tangible milestones do you want to achieve?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Profile Bio
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBio}
                  disabled={loadingBio}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loadingBio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating bio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      ✨ Generate My Bio
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell peers about your background, learning philosophy, and passion..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Step 10: Complete Profile Summary */}
        {currentStep === 10 && (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900">You're ready to Swap!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your profile is 100% complete. We've matched you with active peers and credited +50 welcome points to your account!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Name:</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Teaching:</span>
                <span className="font-bold text-indigo-600">{teachSkills.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Learning:</span>
                <span className="font-bold text-cyan-600">{learnSkills.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Location & Mode:</span>
                <span className="font-bold text-slate-900">{city} ({learningMode})</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Launching...
              </>
            ) : currentStep === totalSteps ? (
              'Launch Dashboard 🚀'
            ) : (
              <>
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
