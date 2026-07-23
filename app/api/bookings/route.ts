import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';
import { sendBookingConfirmation, sendBarberNotification } from '@/lib/email';
import { formatDate, formatTime } from '@/lib/slots';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { barber_id, service_id, guest_name, guest_email, guest_phone, appointment_date, appointment_time, notes } = body;

    if (!barber_id || !service_id || !guest_email || !appointment_date || !appointment_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getServiceClient();
    const session = await getSessionFromCookies();

    // Load service details
    const { data: service } = await db
      .from('services')
      .select('name, price, duration_minutes, barber_id')
      .eq('id', service_id)
      .single();

    if (!service || service.barber_id !== barber_id) {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }

    // Load barber details
    const { data: barber } = await db
      .from('barbers')
      .select('shop_name, address, city, postcode, is_approved, is_active')
      .eq('id', barber_id)
      .single();

    if (!barber || !barber.is_active || !barber.is_approved) {
      return NextResponse.json({ error: 'Barber not available' }, { status: 400 });
    }

    // Load barber user email for notification
    const { data: barberUser } = await db
      .from('users')
      .select('email')
      .eq('role', 'barber')
      .eq('id', (await db.from('barbers').select('user_id').eq('id', barber_id).single()).data?.user_id)
      .single();

    const customerName = guest_name || (session ? (await db.from('users').select('full_name').eq('id', session.sub).single()).data?.full_name : 'Guest');

    const { data: booking, error } = await db
      .from('bookings')
      .insert({
        barber_id,
        service_id,
        user_id: session?.role === 'customer' ? session.sub : null,
        guest_name: customerName,
        guest_email: guest_email.toLowerCase(),
        guest_phone,
        appointment_date,
        appointment_time,
        duration_minutes: service.duration_minutes,
        total_price: service.price,
        status: 'confirmed',
        notes,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'That time slot has just been taken. Please choose another.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // Track analytics event
    await db.from('analytics_events').insert({
      barber_id,
      event_type: 'booking_made',
      user_id: session?.role === 'customer' ? session.sub : null,
    });

    const emailData = {
      customerName: customerName || 'Customer',
      customerEmail: guest_email,
      shopName: barber.shop_name,
      shopAddress: `${barber.address}, ${barber.city} ${barber.postcode}`,
      serviceName: service.name,
      appointmentDate: formatDate(appointment_date),
      appointmentTime: formatTime(appointment_time),
      totalPrice: service.price,
      bookingId: booking.id,
    };

    // Send emails — fire and forget, don't fail the booking if email fails
    Promise.allSettled([
      sendBookingConfirmation(emailData),
      barberUser?.email
        ? sendBarberNotification({ ...emailData, barberEmail: barberUser.email })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ booking });
  } catch (err) {
    console.error('Booking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
