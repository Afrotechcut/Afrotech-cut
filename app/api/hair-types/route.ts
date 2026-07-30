import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const db = getServiceClient();
  const { data } = await db.from('hair_types').select('*').eq('is_active', true).order('sort_order');
  return NextResponse.json({ hairTypes: data || [] });
}
