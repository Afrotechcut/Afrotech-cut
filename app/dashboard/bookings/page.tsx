'use client';
import { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate, formatTime } from '@/lib/slots';

const STATUSES = ['all', 'confirmed', 'completed', 'cancelled', 'no_show'];

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  appointment_date: string;
  appointment_time: string;
  total_price: number;
  status: string;
  notes?: string;
  services: { name: string; duration_minutes: number };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async (status?: string) => {
    setLoading(true);
    const url = status && status !== 'all' ? `/api/dashboard/bookings?status=${status}` : '/api/dashboard/bookings';
    const data = await fetch(url).then((r) => r.json());
    setBookings(data.bookings || []);
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setUpdating(null);
    load(filter);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, any> = { confirmed: 'info', completed: 'success', cancelled: 'danger', no_show: 'warning' };
    return <Badge variant={map[s] || 'default'}>{s.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500">All your appointments in one place</p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No bookings found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <div key={b.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{b.guest_name}</p>
                      {statusBadge(b.status)}
                    </div>
                    <p className="text-sm text-gray-500">{b.services?.name} · {b.services?.duration_minutes} min</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.guest_email} {b.guest_phone && `· ${b.guest_phone}`}</p>
                    {b.notes && <p className="text-xs text-gray-400 mt-1 italic">"{b.notes}"</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900">{formatDate(b.appointment_date)}</p>
                    <p className="text-sm text-gray-500">{formatTime(b.appointment_time?.slice(0, 5))}</p>
                    <p className="font-bold text-gray-900 mt-1">£{b.total_price.toFixed(2)}</p>
                  </div>
                </div>
                {b.status === 'confirmed' && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button size="sm" variant="outline" loading={updating === b.id} onClick={() => updateStatus(b.id, 'completed')}>Mark completed</Button>
                    <Button size="sm" variant="ghost" loading={updating === b.id} onClick={() => updateStatus(b.id, 'no_show')}>No-show</Button>
                    <Button size="sm" variant="danger" loading={updating === b.id} onClick={() => updateStatus(b.id, 'cancelled')}>Cancel</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
