'use client';
import { useEffect, useState } from 'react';
import StarRating from '@/components/ui/StarRating';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    fetch('/api/dashboard/analytics')
      .then((r) => r.json())
      .then((d) => setAvgRating(parseFloat(d.avgRating) || 0))
      .catch(() => setAvgRating(0));

    // Fetch barber ID then reviews
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(async (me) => {
        if (!me.barberId) { setLoading(false); return; }
        const res = await fetch(`/api/barbers/${me.barberId}`);
        const data = await res.json();
        setReviews(data.reviews || []);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
        {avgRating > 0 && (
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
            <StarRating rating={avgRating} size="md" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No reviews yet. Reviews appear here after customers rate their visits.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{r.reviewer_name}</p>
                  <StarRating rating={r.rating} />
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {r.comment && <p className="mt-3 text-sm text-gray-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
