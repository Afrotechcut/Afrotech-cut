import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'barber') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to   = searchParams.get('to');

  const db = getServiceClient();
  let query = db
    .from('bookings')
    .select('*, services(name, price, duration_minutes)')
    .eq('barber_id', session.barberId!)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (status) query = query.eq('status', status);
  if (from)   query = query.gte('appointment_date', from);
  if (to)     query = query.lte('appointment_date', to);

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data });
}
