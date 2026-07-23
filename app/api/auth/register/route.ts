import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, phone, role, shop_name } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['customer', 'barber'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = getServiceClient();

    // Check email is not already registered
    const { data: existing } = await db.from('users').select('id').eq('email', email.toLowerCase()).single();
    if (existing) {
      return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userErr } = await db
      .from('users')
      .insert({ email: email.toLowerCase(), password_hash, full_name, phone, role })
      .select()
      .single();

    if (userErr || !user) {
      console.error('Failed to create user:', userErr);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    let barberId: string | undefined;

    if (role === 'barber') {
      // Create a placeholder barber profile — they'll fill details in onboarding
      const { data: barber, error: barberErr } = await db
        .from('barbers')
        .insert({
          user_id: user.id,
          shop_name: shop_name || full_name + "'s Barbershop",
          address: 'To be set',
          city: 'London',
          postcode: 'To be set',
          location: 'POINT(-0.1278 51.5074)', // default London centre — updated in settings
          is_approved: false,
        })
        .select()
        .single();

      if (barberErr || !barber) {
        console.error('Failed to create barber profile:', barberErr);
        // Rollback user
        await db.from('users').delete().eq('id', user.id);
        return NextResponse.json({ error: 'Failed to create barber profile' }, { status: 500 });
      }

      barberId = barber.id;

      // Seed default weekly availability (Mon–Sat, 09:00–18:00)
      const availability = [0,1,2,3,4,5,6].map((day) => ({
        barber_id: barber.id,
        day_of_week: day,
        is_open: day !== 0, // Sunday closed by default
        open_time: '09:00',
        close_time: '18:00',
      }));
      await db.from('barber_availability').insert(availability);
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role,
      barberId,
    });

    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, full_name: user.full_name, role },
      barberId,
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
