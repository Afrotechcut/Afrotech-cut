'use client';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';

interface AdminBarber {
  id: string;
  shop_name: string;
  city: string;
  postcode: string;
  is_approved: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  users: { email: string; full_name: string };
}

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<AdminBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetch('/api/admin/barbers').then((r) => r.json());
    setBarbers(data.barbers || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Record<string, boolean>) => {
    setUpdating(id);
    await fetch('/api/admin/barbers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    setUpdating(null);
    load();
  };

  const filtered = barbers.filter((b) => {
    if (filter === 'pending') return !b.is_approved;
    if (filter === 'approved') return b.is_approved;
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Barbers</h1>
        <p className="text-sm text-gray-500">{barbers.length} registered barbers</p>
      </div>

      <div className="flex gap-2 mb-5">
        {(['all', 'pending', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {f}
            {f === 'pending' && barbers.filter((b) => !b.is_approved).length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                {barbers.filter((b) => !b.is_approved).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No barbers to show.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((b) => (
              <div key={b.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900">{b.shop_name}</p>
                    {b.is_approved ? (
                      <Badge variant="success">Approved</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                    {!b.is_active && <Badge variant="danger">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{b.city} · {b.postcode}</p>
                  <p className="text-xs text-gray-400">{b.users?.email} · {b.users?.full_name}</p>
                  <div className="mt-1">
                    <StarRating rating={b.rating} />
                  </div>
                </div>
                <div className="flex gap-2">
                  {!b.is_approved && (
                    <Button size="sm" loading={updating === b.id} onClick={() => update(b.id, { is_approved: true })}>
                      Approve
                    </Button>
                  )}
                  {b.is_active ? (
                    <Button size="sm" variant="danger" loading={updating === b.id} onClick={() => update(b.id, { is_active: false })}>
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" loading={updating === b.id} onClick={() => update(b.id, { is_active: true })}>
                      Reinstate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
