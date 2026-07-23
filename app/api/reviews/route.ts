import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  const db = getServiceClient();
  const { booking_id, rating, comment } = await req.json();

  if (!booking_id || !rating) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Verify the booking exists and belongs to this user/guest
  const { data: booking } = await db
    .from('bookings')
    .select('id, barber_id, guest_email, user_id, guest_name, status')
    .eq('id', booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.status !== 'completed') return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });

  const reviewer_name = session
    ? (await db.from('users').select('full_name').eq('id', session.sub).single()).data?.full_name || 'Anonymous'
    : booking.guest_name || 'Anonymous';

  const { data, error } = await db
    .from('reviews')
    .insert({ barber_id: booking.barber_id, booking_id, reviewer_name, rating, comment })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  return NextResponse.json({ review: data });
}
