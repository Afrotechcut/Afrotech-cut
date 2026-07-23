'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/dashboard/StatCard';

interface Stats {
  totalBarbers: number;
  pendingBarbers: number;
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  recentBookings: number;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 401) { router.replace('/login'); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setStats(d); setLoading(false); } });
  }, [router]);

  if (loading || !stats) {
    return <div className="flex items-center justify-center py-32"><svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500">Platform-wide metrics</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total barbers" value={stats.totalBarbers ?? 0} />
        <StatCard label="Pending approval" value={stats.pendingBarbers ?? 0} sub={stats.pendingBarbers > 0 ? 'Action required' : undefined} trend={stats.pendingBarbers > 0 ? 'down' : 'neutral'} />
        <StatCard label="Total customers" value={stats.totalCustomers ?? 0} />
        <StatCard label="Total bookings" value={stats.totalBookings ?? 0} />
        <StatCard label="Platform revenue" value={`£${(stats.totalRevenue ?? 0).toFixed(2)}`} />
        <StatCard label="Bookings (30 days)" value={stats.recentBookings ?? 0} />
      </div>
    </div>
  );
}
