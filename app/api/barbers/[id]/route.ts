import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getServiceClient();
  const { id } = params;

  const [{ data: barber }, { data: services }, { data: availability }, { data: portfolio }, { data: reviews }, { data: hairstyles }] =
    await Promise.all([
      db.from('barbers').select('*').eq('id', id).single(),
      db.from('services').select('*').eq('barber_id', id).eq('is_active', true).order('price'),
      db.from('barber_availability').select('*').eq('barber_id', id).order('day_of_week'),
      db.from('barber_portfolio').select('*').eq('barber_id', id).order('sort_order'),
      db.from('reviews').select('*').eq('barber_id', id).order('created_at', { ascending: false }).limit(20),
      db.from('barber_hairstyles')
        .select('hairstyle_id, hairstyles(id, name, slug, description, image_url, face_shapes, tags)')
        .eq('barber_id', id),
    ]);

  if (!barber) return NextResponse.json({ error: 'Barber not found' }, { status: 404 });

  return NextResponse.json({
    barber,
    services: services || [],
    availability: availability || [],
    portfolio: portfolio || [],
    reviews: reviews || [],
    hairstyles: (hairstyles || []).map((h: any) => h.hairstyles).filter(Boolean),
  });
}
