import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'barber') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = getServiceClient();
  const { data: bookings } = await db
    .from('bookings')
    .select('guest_name, guest_email, guest_phone, appointment_date, total_price, status')
    .eq('barber_id', session.barberId!)
    .not('status', 'in', '("cancelled","no_show")')
    .order('appointment_date', { ascending: false });

  // Aggregate by email
  const customerMap = new Map<string, { name: string; email: string; phone?: string; visits: number; totalSpent: number; lastVisit: string }>();
  for (const b of bookings || []) {
    const key = b.guest_email;
    if (!customerMap.has(key)) {
      customerMap.set(key, { name: b.guest_name || 'Unknown', email: b.guest_email, phone: b.guest_phone, visits: 0, totalSpent: 0, lastVisit: b.appointment_date });
    }
    const c = customerMap.get(key)!;
    c.visits++;
    c.totalSpent += b.total_price;
    if (b.appointment_date > c.lastVisit) c.lastVisit = b.appointment_date;
  }

  const customers = Array.from(customerMap.values()).sort((a, b) => (b.lastVisit > a.lastVisit ? 1 : -1));
  return NextResponse.json({ customers });
}
