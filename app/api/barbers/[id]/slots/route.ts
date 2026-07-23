import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { generateSlots } from '@/lib/slots';
import { getDay } from 'date-fns';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get('date');         // "YYYY-MM-DD"
  const serviceId = searchParams.get('serviceId');

  if (!date || !serviceId) {
    return NextResponse.json({ error: 'date and serviceId are required' }, { status: 400 });
  }

  const db = getServiceClient();
  const dayOfWeek = getDay(new Date(date + 'T12:00:00')); // avoid timezone edge cases

  const [{ data: avail }, { data: service }, { data: existingBookings }] = await Promise.all([
    db.from('barber_availability')
      .select('is_open, open_time, close_time')
      .eq('barber_id', params.id)
      .eq('day_of_week', dayOfWeek)
      .single(),
    db.from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single(),
    db.from('bookings')
      .select('appointment_time, duration_minutes')
      .eq('barber_id', params.id)
      .eq('appointment_date', date)
      .not('status', 'in', '("cancelled","no_show")'),
  ]);

  if (!avail || !avail.is_open) {
    return NextResponse.json({ slots: [], closed: true });
  }

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  // Build list of taken slot start times
  const taken = (existingBookings || []).map((b: any) => b.appointment_time.slice(0, 5));

  const slots = generateSlots(
    avail.open_time!.slice(0, 5),
    avail.close_time!.slice(0, 5),
    service.duration_minutes,
    taken,
  );

  return NextResponse.json({ slots, closed: false });
}
