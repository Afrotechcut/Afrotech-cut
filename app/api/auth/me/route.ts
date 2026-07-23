import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ user: null });

  if (session.role === 'admin') {
    return NextResponse.json({ user: { id: 'admin', email: session.email, role: 'admin' } });
  }

  const db = getServiceClient();
  const { data: user } = await db
    .from('users')
    .select('id, email, full_name, phone, avatar_url, role')
    .eq('id', session.sub)
    .single();

  return NextResponse.json({ user, barberId: session.barberId });
}
