import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Review } from '../types';
import { DatabaseService } from '../services/db';
import { RatingStars } from '../components/RatingStars';
import { Star, MessageSquare, Award, CheckCircle2, Flame } from 'lucide-react';

interface ReviewsPageProps {
  onNavigate: (path: string) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filterType, setFilterType] = useState<'received' | 'community'>('received');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const list = await DatabaseService.getReviews();
        setReviews(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, []);

  if (!currentUser) return null;

  const myReceivedReviews = reviews.filter((r) => r.revieweeId === currentUser.id);
  const communityReviews = reviews;

  const displayedReviews = filterType === 'received' ? myReceivedReviews : communityReviews;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Reviews & Reputation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Peer testimonials establish authenticity and unlock higher reputation tiers across the platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Your Rating</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {currentUser.rating} / 5.0
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Total Reviews</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {myReceivedReviews.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Swaps Completed</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {currentUser.completedSwapsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setFilterType('received')}
          className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            filterType === 'received'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Testimonials ({myReceivedReviews.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('community')}
          className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            filterType === 'community'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Community Feedback ({communityReviews.length})
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayedReviews.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-500">No reviews to display in this view yet.</p>
          </div>
        ) : (
          displayedReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.reviewerAvatar}
                    alt={rev.reviewerName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{rev.reviewerName}</h3>
                    <div className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <RatingStars rating={rev.rating} size={14} />
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
          ))
        )}
      </div>
    </div>
  );
};
