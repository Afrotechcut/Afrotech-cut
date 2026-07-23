'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import StatCard from '@/components/dashboard/StatCard';
import Badge from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/lib/slots';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Analytics {
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  uniqueCustomers: number;
  repeatRate: number;
  profileViews: number;
  avgRating: string;
  reviewCount: number;
}

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  appointment_date: string;
  appointment_time: string;
  total_price: number;
  status: string;
  services: { name: string };
}

export default function DashboardOverviewPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [analyticsRes, bookingsRes, meRes] = await Promise.all([
      fetch('/api/dashboard/analytics'),
      fetch('/api/dashboard/bookings?status=confirmed'),
      fetch('/api/auth/me'),
    ]);
    const [aData, bData, meData] = await Promise.all([analyticsRes.json(), bookingsRes.json(), meRes.json()]);
    setAnalytics(aData);
    setRecentBookings((bData.bookings || []).slice(0, 6));
    setBarberId(meData.barberId || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time: subscribe to new bookings for this barber
  useEffect(() => {
    if (!barberId) return;
    const channel = supabase
      .channel(`barber-${barberId}-bookings`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
        filter: `barber_id=eq.${barberId}`,
      }, (payload) => {
        setRecentBookings((prev) => [payload.new as Booking, ...prev].slice(0, 6));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [barberId]);

  const statusBadge = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
      confirmed: 'info', completed: 'success', cancelled: 'danger', no_show: 'warning',
    };
    return <Badge variant={(map[s] as any) || 'default'}>{s}</Badge>;
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">Your shop at a glance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total bookings" value={analytics?.totalBookings ?? 0} />
            <StatCard label="Revenue" value={`£${(analytics?.revenue ?? 0).toFixed(2)}`} />
            <StatCard label="Unique customers" value={analytics?.uniqueCustomers ?? 0} />
            <StatCard label="Repeat rate" value={`${analytics?.repeatRate ?? 0}%`} sub="Returning customers" />
            <StatCard label="Avg. rating" value={analytics?.avgRating ?? '—'} sub={`${analytics?.reviewCount ?? 0} reviews`} />
            <StatCard label="Profile views" value={analytics?.profileViews ?? 0} sub="Last 30 days" />
            <StatCard label="Completed" value={analytics?.completedBookings ?? 0} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Upcoming bookings</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-400">Live</span>
              </div>
            </div>
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No upcoming bookings.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <div key={b.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{b.guest_name}</p>
                      <p className="text-xs text-gray-500 truncate">{b.services?.name}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-medium text-gray-700">{formatDate(b.appointment_date)}</p>
                        <p className="text-xs text-gray-400">{formatTime(b.appointment_time?.slice(0, 5))}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-semibold text-sm text-gray-900">£{b.total_price.toFixed(2)}</span>
                        {statusBadge(b.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
