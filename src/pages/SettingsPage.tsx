import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Bell,
  Sparkles,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  Sliders,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, updateUser } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [learningMode, setLearningMode] = useState(currentUser?.learningMode || 'online');
  const [enableAi, setEnableAi] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [notifRequests, setNotifRequests] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSessions, setNotifSessions] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser({
      fullName,
      city,
      learningMode: learningMode as any,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure your personal profile, notification preferences, privacy, and Gemini AI assistance.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Account & Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>Learning Mode & Location</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Location / City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Mode
              </label>
              <select
                value={learningMode}
                onChange={(e) => setLearningMode(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="online">Online Video Sessions</option>
                <option value="in-person">In-person Meetings</option>
                <option value="both">Flexible (Both)</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI & Automation Preferences */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Gemini AI Features & Preferences</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Enable AI Learning Companion
                </div>
                <div className="text-[11px] text-slate-500">
                  Generate curriculum outlines, explain match reasoning, and refine message drafts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableAi}
                onChange={(e) => setEnableAi(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Notifications & Privacy */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>Notifications & Privacy</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-900">New Swap Request Alerts</div>
                <div className="text-[11px] text-slate-500">Notify me immediately when peers send proposals</div>
              </div>
              <input
                type="checkbox"
                checked={notifRequests}
                onChange={(e) => setNotifRequests(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-900">Direct Messages</div>
                <div className="text-[11px] text-slate-500">Receive in-app alerts on new chat messages</div>
              </div>
              <input
                type="checkbox"
                checked={notifMessages}
                onChange={(e) => setNotifMessages(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <div className="text-xs font-bold text-slate-900">Upcoming Session Reminders</div>
                <div className="text-[11px] text-slate-500">Alerts prior to scheduled video or meetup times</div>
              </div>
              <input
                type="checkbox"
                checked={notifSessions}
                onChange={(e) => setNotifSessions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
