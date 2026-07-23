import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { status } = await req.json();
  if (!['completed', 'cancelled', 'no_show'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getServiceClient();

  // Verify ownership — barber can only update their own bookings
  const { data: booking } = await db.from('bookings').select('barber_id').eq('id', params.id).single();
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.role === 'barber' && booking.barber_id !== session.barberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await db
    .from('bookings')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ booking: data });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getServiceClient();
  const { data } = await db
    .from('bookings')
    .select('*, barbers(shop_name, address, city, postcode, avatar_url), services(name, price, duration_minutes)')
    .eq('id', params.id)
    .single();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ booking: data });
}
