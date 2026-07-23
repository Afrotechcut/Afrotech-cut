import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';
import { subDays, format } from 'date-fns';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = getServiceClient();
  const thirtyAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [{ count: totalBarbers }, { count: pendingBarbers }, { count: totalUsers }, { count: totalBookings }, { data: revenue }, { count: recentBookings }] =
    await Promise.all([
      db.from('barbers').select('id', { count: 'exact', head: true }),
      db.from('barbers').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      db.from('users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      db.from('bookings').select('id', { count: 'exact', head: true }).not('status', 'in', '("cancelled","no_show")'),
      db.from('bookings').select('total_price').eq('status', 'completed'),
      db.from('bookings').select('id', { count: 'exact', head: true }).gte('appointment_date', thirtyAgo),
    ]);

  const totalRevenue = (revenue || []).reduce((s: number, b: any) => s + b.total_price, 0);

  return NextResponse.json({
    totalBarbers: totalBarbers || 0,
    pendingBarbers: pendingBarbers || 0,
    totalCustomers: totalUsers || 0,
    totalBookings: totalBookings || 0,
    totalRevenue,
    recentBookings: recentBookings || 0,
  });
}
