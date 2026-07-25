'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/lib/slots';

interface AdminBooking {
  id: string;
  guest_name: string;
  guest_email: string;
  appointment_date: string;
  appointment_time: string;
  total_price: number;
  status: string;
  barbers: { shop_name: string; city: string };
  services: { name: string; price: number };
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then((r) => {
        if (r.status === 401) { router.replace('/login'); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setBookings(d.bookings || []); setLoading(false); } });
  }, [router]);

  const statusBadge = (s: string) => {
    const map: Record<string, any> = { confirmed: 'info', completed: 'success', cancelled: 'danger', no_show: 'warning' };
    return <Badge variant={map[s] || 'default'}>{s.replace('_', ' ')}</Badge>;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-sm text-gray-500">{bookings.length} total bookings (latest 200)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Barber</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-400">Loading...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-400">No bookings yet.</td></tr>
            ) : bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-gray-900">{b.guest_name}</p>
                  <p className="text-xs text-gray-400">{b.guest_email}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-gray-900">{b.barbers?.shop_name}</p>
                  <p className="text-xs text-gray-400">{b.barbers?.city}</p>
                </td>
                <td className="px-5 py-3.5 text-gray-700">{b.services?.name}</td>
                <td className="px-5 py-3.5 text-gray-700">
                  <p>{formatDate(b.appointment_date)}</p>
                  <p className="text-xs text-gray-400">{b.appointment_time ? formatTime(b.appointment_time.slice(0, 5)) : ''}</p>
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-900">£{b.total_price?.toFixed(2)}</td>
                <td className="px-5 py-3.5">{statusBadge(b.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
