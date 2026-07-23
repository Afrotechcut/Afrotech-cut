import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const db = getServiceClient();
  const { data } = await db.from('hairstyles').select('*').eq('is_active', true).order('name');
  return NextResponse.json({ hairstyles: data || [] });
}
