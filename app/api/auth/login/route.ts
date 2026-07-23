import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check admin credentials first (env-based, not in DB)
    if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) {
      const match = password === process.env.ADMIN_PASSWORD;
      if (!match) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      const token = await signToken({ sub: 'admin', email: process.env.ADMIN_EMAIL!, role: 'admin' });
      setAuthCookie(token);
      return NextResponse.json({ user: { id: 'admin', email: process.env.ADMIN_EMAIL, role: 'admin' } });
    }

    const db = getServiceClient();
    const { data: user } = await db
      .from('users')
      .select('id, email, password_hash, full_name, role')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let barberId: string | undefined;
    if (user.role === 'barber') {
      const { data: barber } = await db
        .from('barbers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      barberId = barber?.id;
    }

    const token = await signToken({ sub: user.id, email: user.email, role: user.role, barberId });
    setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      barberId,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
