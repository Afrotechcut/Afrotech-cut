import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const db = getServiceClient();
    const { data, error } = await db
      .from('bookings')
      .select('id, appointment_date, appointment_time, total_price, status, service_id, barber_id, barbers(id, shop_name, avatar_url, city), services(id, name, image_url)')
      .eq('user_id', session.sub)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (error) return NextResponse.json({ bookings: [] });
    return NextResponse.json({ bookings: data || [] });
  } catch (err) {
    console.error('Customer bookings error:', err);
    return NextResponse.json({ bookings: [] });
  }
}
