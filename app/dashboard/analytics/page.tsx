'use client';
import { useEffect, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';

interface Analytics {
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  uniqueCustomers: number;
  repeatRate: number;
  profileViews: number;
  avgRating: string;
  reviewCount: number;
  bookingsByDay: { date: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d && !d.error ? d : null); })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-32">
        <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-5xl">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          Couldn't load analytics right now. Try refreshing the page.
        </div>
      </div>
    );
  }

  const bookingsByDay = data.bookingsByDay || [];
  const maxCount = Math.max(...bookingsByDay.map((d) => d.count), 1);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Performance over the last 30 days</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Profile views" value={data.profileViews} sub="Last 30 days" />
        <StatCard label="Bookings" value={data.totalBookings} />
        <StatCard label="Revenue" value={`£${data.revenue.toFixed(2)}`} />
        <StatCard label="Unique customers" value={data.uniqueCustomers} />
        <StatCard label="Repeat rate" value={`${data.repeatRate}%`} sub={data.repeatRate > 30 ? 'Strong retention' : 'Build loyalty'} trend={data.repeatRate > 30 ? 'up' : 'neutral'} />
        <StatCard label="Avg. rating" value={data.avgRating} sub={`${data.reviewCount} reviews`} />
        <StatCard label="Completed" value={data.completedBookings} />
        <StatCard label="Conversion" value={data.totalBookings > 0 ? `${Math.round((data.completedBookings / data.totalBookings) * 100)}%` : '—'} sub="Booked → completed" />
      </div>

      {/* Bookings chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Bookings — last 30 days</h2>
        {bookingsByDay.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No booking activity yet.</p>
        ) : (
          <>
            <div className="flex items-end gap-0.5 h-32">
              {bookingsByDay.map(({ date, count }) => (
                <div key={date} className="flex-1 flex flex-col items-center justify-end group">
                  <div
                    className="w-full bg-gray-900 rounded-t transition-all hover:bg-brand-500"
                    style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '3px' : '0' }}
                    title={`${date}: ${count} booking${count !== 1 ? 's' : ''}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-gray-400">{bookingsByDay[0]?.date}</p>
              <p className="text-xs text-gray-400">{bookingsByDay[bookingsByDay.length - 1]?.date}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
