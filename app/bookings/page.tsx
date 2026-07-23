'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/ui/Badge';
import { buildStorageUrl, formatPrice } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/slots';

interface CustomerBooking {
  id: string;
  appointment_date: string;
  appointment_time: string;
  total_price: number;
  status: string;
  service_id: string;
  barber_id: string;
  barbers?: { id: string; shop_name: string; avatar_url?: string; city: string } | null;
  services?: { id: string; name: string; image_url?: string } | null;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/customer/bookings')
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s: string) => {
    const map: Record<string, any> = { confirmed: 'info', completed: 'success', cancelled: 'danger', no_show: 'warning' };
    return <Badge variant={map[s] || 'default'}>{s.replace('_', ' ')}</Badge>;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-500">Shops you've visited and appointments you've made</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-sm">Something went wrong loading your bookings. Please try again.</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-900 font-semibold mb-1">No bookings yet</p>
              <p className="text-gray-500 text-sm mb-6">Once you book an appointment, it'll show up here.</p>
              <Link
                href="/search"
                className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Find a barber
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const shopName = b.barbers?.shop_name || 'Shop no longer available';
                const avatarUrl = b.barbers?.avatar_url?.startsWith('http')
                  ? b.barbers.avatar_url
                  : b.barbers?.avatar_url
                  ? buildStorageUrl('assets', b.barbers.avatar_url)
                  : null;

                return (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={shopName} width={64} height={64} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">{shopName[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-gray-900 truncate">{shopName}</p>
                        {statusBadge(b.status)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{b.services?.name || 'Service'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(b.appointment_date)} · {formatTime(b.appointment_time?.slice(0, 5))} · {formatPrice(b.total_price)}
                      </p>
                    </div>

                    {b.barbers?.id && (
                      <Link
                        href={`/book/${b.barbers.id}${b.service_id ? `?serviceId=${b.service_id}` : ''}`}
                        className="flex-shrink-0 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Rebook
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
