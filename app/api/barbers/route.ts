import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') || '51.5074');
  const lng = parseFloat(searchParams.get('lng') || '-0.1278');
  const radius = Math.min(parseFloat(searchParams.get('radius') || '5000'), 50000);
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
  const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null;
  const hairstyleId = searchParams.get('hairstyleId') || null;

  const db = getServiceClient();

  // PostGIS radius query — ST_DWithin with geography type returns accurate metres
  const { data, error } = await db.rpc('search_barbers', {
    p_lat: lat,
    p_lng: lng,
    p_radius: radius,
    p_min_price: minPrice,
    p_max_price: maxPrice,
    p_min_rating: minRating,
    p_hairstyle_id: hairstyleId,
  });

  if (error) {
    // Fallback: return all active approved barbers if RPC not yet created
    const { data: all } = await db
      .from('barbers')
      .select('id, shop_name, city, postcode, address, rating, review_count, avatar_url, cover_image_url, is_approved, is_active')
      .eq('is_active', true)
      .eq('is_approved', true)
      .limit(50);

    return NextResponse.json({ barbers: all || [] });
  }

  return NextResponse.json({ barbers: data || [] });
}
