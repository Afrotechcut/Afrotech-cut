'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { formatDate, formatTime } from '@/lib/slots';

export default function BookingSuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense>
        <BookingSuccessContent />
      </Suspense>
    </>
  );
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => setBooking(d.booking));
  }, [bookingId]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">
          {/* Checkmark */}
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're booked in</h1>
          <p className="text-gray-500 mb-8">
            {booking ? `A confirmation has been sent to ${booking.guest_email}.` : 'Your booking is confirmed.'}
          </p>

          {booking && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left mb-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Barber</span>
                  <span className="font-medium text-gray-900">{booking.barbers?.shop_name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium text-gray-900">{booking.services?.name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-900">{booking.appointment_date ? formatDate(booking.appointment_date) : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium text-gray-900">{booking.appointment_time ? formatTime(booking.appointment_time.slice(0, 5)) : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Address</span>
                  <span className="font-medium text-gray-900 text-right">
                    {booking.barbers?.address ? `${booking.barbers.address}, ${booking.barbers.city || ''} ${booking.barbers.postcode || ''}` : '—'}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">£{booking.total_price?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/search"
              className="block w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm"
            >
              Find another barber
            </Link>
            <Link
              href="/"
              className="block w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Back to home
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Need to cancel? Contact the barber directly with the details in your confirmation email.
          </p>
        </div>
      </main>
  );
}
