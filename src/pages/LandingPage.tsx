import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Sparkles,
  Search,
  BookOpen,
  Users,
  Award,
  Star,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Calendar,
  Zap,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { UserProfile } from '../types';
import { INITIAL_USERS } from '../data/seedData';
import { UserCard } from '../components/UserCard';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  currentUser: UserProfile | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'match' | 'ai' | 'chat'>('match');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32">
        {/* Subtle decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-cyan-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Zero-Fee Peer-to-Peer Learning Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Learn a skill.{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                  Teach a skill.
                </span>{' '}
                Grow together.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                SkillSwap connects people who want to exchange knowledge, build new skills, and learn from real practitioners around the world. No tuition fees, no rigid schedules — just mutual growth.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate(currentUser ? '/discover' : '/signup')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <span>Find Your Skill Match</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 transition-all shadow-2xs"
                >
                  Explore How It Works
                </a>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>100% Free peer swaps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>AI match companion</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Verified ratings & badges</span>
                </div>
              </div>
            </div>

            {/* Right: Visual representation of two users exchanging skills */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
                {/* Person A Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-indigo-100/30 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                      alt="Alex"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-2xs"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Alex Morgan</div>
                      <div className="text-xs text-indigo-700 font-medium">Teaches: Python</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-2xs">
                    Expert
                  </span>
                </div>

                {/* Animated Mutual Exchange Indicator */}
                <div className="my-4 relative flex items-center justify-center">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500" />
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                </div>

                {/* Person B Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50/70 to-cyan-100/30 border border-cyan-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
                      alt="Priya"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-2xs"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Priya Sharma</div>
                      <div className="text-xs text-cyan-700 font-medium">Teaches: UI/UX Design</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-600 text-white shadow-2xs">
                    Expert
                  </span>
                </div>

                {/* Match Banner overlay */}
                <div className="mt-5 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold">Mutual Match Score</span>
                  </div>
                  <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    92% Match
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* TRUST & STATS SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 border-y border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                10K+
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600">Active Learners</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                5K+
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600">Verified Skills</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                25K+
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600">Skill Swaps Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-500 flex items-center justify-center gap-1">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                4.9/5
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600">Community Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* HOW IT WORKS SECTION (Section 8) */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How SkillSwap Works
          </h2>
          <p className="text-slate-600 text-base">
            Exchange real-world expertise seamlessly without money changing hands. You teach what you know, they teach what you need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-extrabold text-lg flex items-center justify-center border border-indigo-100">
              01
            </div>
            <h3 className="font-bold text-lg text-slate-900">Create your profile</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tell the community what you know and what you want to learn. Set your preferred availability and learning mode.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 font-extrabold text-lg flex items-center justify-center border border-purple-100">
              02
            </div>
            <h3 className="font-bold text-lg text-slate-900">Find your match</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our deterministic matching algorithm scores people with complementary skills, timeframes, and learning preferences.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 font-extrabold text-lg flex items-center justify-center border border-cyan-100">
              03
            </div>
            <h3 className="font-bold text-lg text-slate-900">Exchange knowledge</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Chat in real-time, schedule structured 1-on-1 sessions, and learn hands-on together via video or in-person.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-extrabold text-lg flex items-center justify-center border border-emerald-100">
              04
            </div>
            <h3 className="font-bold text-lg text-slate-900">Grow together</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Complete swaps, write genuine reviews, earn reputation points, unlock badges, and build your collaborative network.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* AI SUITE SECTION (Section 9) */}
      {/* ------------------------------------------------------------- */}
      <section id="ai-features" className="py-20 bg-gradient-to-b from-white via-indigo-50/20 to-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Your AI-powered learning companion
            </h2>
            <p className="text-slate-600 text-base">
              SkillSwap embeds intelligent assistance throughout your journey: explaining compatibility, scaffolding 4-week curriculums, and drafting messages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Match Explanation */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">AI Match Explanation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Understand immediately why you two complement each other: highlighting direct skill reciprocities and scheduling overlaps in natural language.
              </p>
            </div>

            {/* AI Learning Plan */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">AI Learning Plans</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate a custom 4-week step-by-step curriculum with weekly milestones, practice tasks, and recommended paired session formats.
              </p>
            </div>

            {/* AI Profile Writer */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">AI Profile Writer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stuck on what to write? Click "✨ Generate My Bio" and Gemini crafts an authentic, engaging profile summary that attracts great partners.
              </p>
            </div>

            {/* AI Message Assistant */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">AI Message Assistant</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Improve your drafts, suggest polite replies, tone-shift to professional or casual, or translate messages for international partners.
              </p>
            </div>

            {/* AI Skill Recommendations */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">AI Skill Recommendations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Analyzes your current skill portfolio and career trajectory to recommend high-leverage adjacent skills to prioritize next.
              </p>
            </div>

            {/* AI Conversation Starter */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">AI Conversation Starters</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never experience writer's block when reaching out. Generate personalized, respectful intro messages tailored to your candidate's exact bio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FEATURED MATCHES DEMO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section id="community" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Community Members
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Explore Active Skill Swappers
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Browse real peers available for bilateral knowledge exchange.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/discover')}
            className="inline-flex items-center gap-2 font-bold text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>View all skills & members</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_USERS.slice(0, 3).map((u) => (
            <UserCard
              key={u.id}
              user={u}
              currentUser={currentUser}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FINAL CTA BANNER */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to exchange skills and grow?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Join thousands of lifelong learners, engineers, designers, and creators leveling up through reciprocal mentorship.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate(currentUser ? '/dashboard' : '/signup')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-500/30 hover:scale-105 transition-all cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-sm text-slate-900">SkillSwap</span>
            <span>— Learn together. Teach what you know. Grow together.</span>
          </div>

          <div className="flex items-center gap-6">
            <button type="button" onClick={() => onNavigate('/discover')} className="hover:text-slate-900">
              Discover
            </button>
            <button type="button" onClick={() => onNavigate('/login')} className="hover:text-slate-900">
              Sign In
            </button>
            <button type="button" onClick={() => onNavigate('/signup')} className="hover:text-slate-900">
              Register
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
