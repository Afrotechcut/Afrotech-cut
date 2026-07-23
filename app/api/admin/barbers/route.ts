import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = getServiceClient();
  const { data } = await db
    .from('barbers')
    .select('*, users(email, full_name)')
    .order('created_at', { ascending: false });

  return NextResponse.json({ barbers: data || [] });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = getServiceClient();
  const { id, is_approved, is_active } = await req.json();

  const update: Record<string, boolean> = {};
  if (is_approved !== undefined) update.is_approved = is_approved;
  if (is_active !== undefined) update.is_active = is_active;

  const { data, error } = await db.from('barbers').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ barber: data });
}
