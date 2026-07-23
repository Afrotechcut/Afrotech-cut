import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = getServiceClient();
  const { data } = await db
    .from('bookings')
    .select('*, barbers(shop_name, city), services(name, price)')
    .order('created_at', { ascending: false })
    .limit(200);

  return NextResponse.json({ bookings: data || [] });
}
