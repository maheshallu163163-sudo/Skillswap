import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, ExperienceLevel, LearningMode } from '../types';
import { DatabaseService } from '../services/db';
import { UserCard } from '../components/UserCard';
import { SKILL_CATEGORIES } from '../data/skills';
import { Search, Filter, Sparkles, MapPin, X, RotateCcw } from 'lucide-react';

interface DiscoverPageProps {
  onNavigate: (path: string) => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const list = await DatabaseService.getUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedMode('all');
    setSelectedAvailability('all');
    setMinRating(0);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Don't show current user in discovery
      if (currentUser && u.id === currentUser.id) return false;

      // 1. Text Search across skills, name, bio, city
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = u.fullName.toLowerCase().includes(query);
        const matchesCity = (u.city || '').toLowerCase().includes(query);
        const matchesSkills = (u.skills || []).some(
          (s) => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query)
        );
        const matchesBio = (u.bio || '').toLowerCase().includes(query);

        if (!matchesName && !matchesCity && !matchesSkills && !matchesBio) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        const hasCategory = (u.skills || []).some((s) => s.category === selectedCategory);
        if (!hasCategory) return false;
      }

      // 3. Experience level filter (on skills they teach)
      if (selectedLevel !== 'all') {
        const hasLevel = (u.skills || []).some(
          (s) => s.type === 'teach' && s.experienceLevel === selectedLevel
        );
        if (!hasLevel) return false;
      }

      // 4. Learning mode filter
      if (selectedMode !== 'all') {
        if (u.learningMode !== 'both' && u.learningMode !== selectedMode) return false;
      }

      // 5. Availability filter
      if (selectedAvailability !== 'all') {
        if (!(u.availability || []).includes(selectedAvailability)) return false;
      }

      // 6. Rating filter
      if (minRating > 0) {
        if (u.rating < minRating) return false;
      }

      return true;
    });
  }, [
    users,
    currentUser,
    searchQuery,
    selectedCategory,
    selectedLevel,
    selectedMode,
    selectedAvailability,
    minRating,
  ]);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & SEARCH BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Discover Skill Swappers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search practitioners ready to trade their knowledge. Filter by skill category, mode, and rating.
          </p>
        </div>

        {/* Big Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What skill do you want to learn? (e.g. Python, UI/UX, Spanish, Figma, Public Speaking)..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Level Dropdown */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Any Experience Level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>

          {/* Mode Dropdown */}
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Any Learning Mode</option>
            <option value="online">Online Sessions</option>
            <option value="in-person">In-person</option>
            <option value="both">Flexible (Both)</option>
          </select>

          {/* Availability Dropdown */}
          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Any Availability</option>
            <option value="Weekday mornings">Weekday mornings</option>
            <option value="Weekday evenings">Weekday evenings</option>
            <option value="Weekends">Weekends</option>
          </select>

          {/* Min Rating Dropdown */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="0">Any Community Rating</option>
            <option value="4.5">★ 4.5 & up</option>
            <option value="4.8">★ 4.8 & up</option>
          </select>

          {/* Reset Filters */}
          {(searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all' || selectedMode !== 'all' || selectedAvailability !== 'all' || minRating > 0) && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RESULTS COUNT & CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Showing {filteredUsers.length} active practitioners</span>
          {currentUser && (
            <span className="text-purple-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Match percentages tailored to your profile
            </span>
          )}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No matching members found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try broadening your search query or reset filters to explore all available skills and mentors.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                currentUser={currentUser}
                onNavigate={onNavigate}
                onRequestSent={() => {
                  fetchUsers();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
