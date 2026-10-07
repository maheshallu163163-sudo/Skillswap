import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LearningPlan, ExperienceLevel } from '../types';
import { DatabaseService } from '../services/db';
import { GeminiService } from '../services/gemini';
import {
  BookOpen,
  Sparkles,
  Loader2,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../utils/confetti';

interface LearningPlansPageProps {
  onNavigate: (path: string) => void;
}

export const LearningPlansPage: React.FC<LearningPlansPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [skillName, setSkillName] = useState('UI/UX Design & Figma');
  const [currentLevel, setCurrentLevel] = useState<ExperienceLevel>('Beginner');
  const [goal, setGoal] = useState('Design responsive SaaS app with components and tokens');
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<LearningPlan | null>(null);

  const loadPlans = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const list = await DatabaseService.getLearningPlans(currentUser.id);
      setPlans(list);
      if (list.length > 0 && !activePlan) {
        setActivePlan(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const result = await GeminiService.generateLearningPlan({
        skillName,
        currentLevel,
        goal,
        hoursPerWeek,
        durationWeeks,
      });

      const saved = await DatabaseService.saveLearningPlan({
        userId: currentUser.id,
        skillName,
        currentLevel,
        goal,
        hoursPerWeek,
        durationWeeks,
        overview: result.overview,
        weeks: result.weeks,
      });

      setActivePlan(saved);
      fireCelebrationConfetti();
      await loadPlans();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (planId: string) => {
    await DatabaseService.deleteLearningPlan(planId);
    if (activePlan?.id === planId) {
      setActivePlan(null);
    }
    await loadPlans();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-300 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Curriculum Architect</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Personalized AI Learning Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Input the skill and goal you want to master. Gemini generates a structured 4-week sprint curriculum with practice tasks and recommended 1-on-1 swap agendas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Plan Generator (lg: 5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Create New Learning Curriculum</span>
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Skill
              </label>
              <input
                type="text"
                required
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g. Python, UI/UX Design, Spanish"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Level
                </label>
                <select
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hours / Week
                </label>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Outcome / Project Goal
              </label>
              <textarea
                required
                rows={2}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Build an interactive Figma design system or create Python data scripts..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating 4-Week Plan with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Learning Plan
                </>
              )}
            </button>
          </form>

          {/* Saved Plans List */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Saved Curriculums ({plans.length})
            </span>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {plans.map((p) => {
                const isSelected = p.id === activePlan?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePlan(p)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-purple-50 border-purple-200 text-purple-950 font-bold'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{p.skillName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {p.goal}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      className="text-slate-300 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right View: Active Plan Content (lg: 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activePlan ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> 4-Week AI Roadmap
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{activePlan.skillName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target: {activePlan.goal} • {activePlan.hoursPerWeek} hrs/week
                  </p>
                </div>
              </div>

              {activePlan.overview && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                  "{activePlan.overview}"
                </div>
              )}

              {/* Weekly Modules */}
              <div className="space-y-4">
                {activePlan.weeks.map((week) => (
                  <div
                    key={week.weekNumber}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                          W{week.weekNumber}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900">{week.title}</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        ~{week.estimatedHours} Hours
                      </span>
                    </div>

                    {/* Topics */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Core Topics:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {week.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 text-[11px] font-medium border border-indigo-100"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tasks */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Practice Tasks:
                      </span>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {week.practiceTasks.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Session Structure */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-700 bg-purple-50/50 p-2.5 rounded-xl">
                      <span className="font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Paired 1-on-1 Agenda:
                      </span>
                      <span className="font-medium text-slate-700">{week.sessionStructure}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900">No Plan Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill in the form on the left to generate an end-to-end 4-week learning roadmap with Gemini!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
