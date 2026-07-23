import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';
import { subDays, format, startOfDay } from 'date-fns';

// Default shape returned whenever we can't compute real numbers (no session,
// no barber profile yet, or a query failure) — the dashboard always gets
// something safe to render rather than a partial/error object.
function emptyAnalytics() {
  const bookingsByDay = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
    count: 0,
  }));
  return {
    totalBookings: 0,
    completedBookings: 0,
    revenue: 0,
    uniqueCustomers: 0,
    repeatRate: 0,
    profileViews: 0,
    avgRating: '—',
    reviewCount: 0,
    bookingsByDay,
  };
}

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'barber') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  if (!session.barberId) return NextResponse.json(emptyAnalytics());

  try {
    const db = getServiceClient();
    const barberId = session.barberId;

    const thirtyDaysAgo = format(subDays(startOfDay(new Date()), 30), 'yyyy-MM-dd');

    const [{ data: allBookings }, { data: recentBookings }, { data: events }, { data: reviews }] =
      await Promise.all([
        db.from('bookings').select('total_price, status, guest_email, appointment_date, created_at').eq('barber_id', barberId),
        db.from('bookings').select('total_price, status, guest_email, appointment_date').eq('barber_id', barberId).gte('appointment_date', thirtyDaysAgo),
        db.from('analytics_events').select('event_type, created_at').eq('barber_id', barberId).gte('created_at', thirtyDaysAgo + 'T00:00:00Z'),
        db.from('reviews').select('rating').eq('barber_id', barberId),
      ]);

    const confirmed = (allBookings || []).filter((b) => b.status !== 'cancelled' && b.status !== 'no_show');
    const revenue = confirmed.filter((b) => b.status === 'completed').reduce((s, b) => s + (b.total_price || 0), 0);
    const uniqueEmails = new Set(confirmed.map((b) => b.guest_email));
    const repeatEmails = Array.from(uniqueEmails).filter(
      (e) => confirmed.filter((b) => b.guest_email === e).length > 1,
    );
    const repeatRate = uniqueEmails.size > 0 ? Math.round((repeatEmails.length / uniqueEmails.size) * 100) : 0;

    const profileViews = (events || []).filter((e) => e.event_type === 'profile_view').length;

    // Build last 30 days booking counts for the chart
    const bookingsByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      bookingsByDay[d] = 0;
    }
    (recentBookings || []).forEach((b) => {
      if (b.appointment_date in bookingsByDay) bookingsByDay[b.appointment_date]++;
    });

    return NextResponse.json({
      totalBookings: confirmed.length,
      completedBookings: confirmed.filter((b) => b.status === 'completed').length,
      revenue,
      uniqueCustomers: uniqueEmails.size,
      repeatRate,
      profileViews,
      avgRating: reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—',
      reviewCount: reviews?.length || 0,
      bookingsByDay: Object.entries(bookingsByDay).map(([date, count]) => ({ date, count })),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json(emptyAnalytics());
  }
}
