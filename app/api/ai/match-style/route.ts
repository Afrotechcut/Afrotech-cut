import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getOpenAIClient, VISION_MODEL } from '@/lib/openai';
import type { Hairstyle, Barber } from '@/types';

// Default to central London, matching the rest of the app's location defaults,
// when the browser didn't share the customer's real coordinates.
const DEFAULT_LAT = 51.5074;
const DEFAULT_LNG = -0.1278;
const NEARBY_RADIUS_METRES = 25000;
const MAX_BARBERS_PER_STYLE = 4;

interface Recommendation {
  hairstyle: Hairstyle;
  reason: string;
}

async function pickHairstyles(dataUrl: string, hairstyles: Hairstyle[]): Promise<Recommendation[] | null> {
  const openai = getOpenAIClient();
  if (!openai) throw new Error('OpenAI is not configured');

  const catalogue = hairstyles.map((h) => ({ slug: h.slug, name: h.name, description: h.description, tags: h.tags }));

  const completion = await openai.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 500,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'style_match',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            face_detected: { type: 'boolean' },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  slug: { type: 'string', enum: hairstyles.map((h) => h.slug) },
                  reason: { type: 'string' },
                },
                required: ['slug', 'reason'],
                additionalProperties: false,
              },
            },
          },
          required: ['face_detected', 'recommendations'],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: 'system',
        content:
          "You are an expert barber and hairstylist who specialises in Afro-textured hair. You will be shown a customer's photo and a catalogue of hairstyles a barbershop offers. Pick exactly two hairstyles from the catalogue that best suit this specific person's face shape, hairline, and features. You must only pick from the given catalogue slugs — never invent a style that isn't listed. If the photo does not clearly show a human face, set face_detected to false.",
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Catalogue of available hairstyles:\n${JSON.stringify(catalogue)}\n\nPick exactly two that best suit this person. For each, write a short one-line reason (under 15 words) referencing their face shape, hairline, or features — e.g. "Suits your face shape and hairline".`,
          },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '{}';
  const parsed = JSON.parse(raw) as { face_detected: boolean; recommendations: { slug: string; reason: string }[] };

  if (!parsed.face_detected) return null;

  const bySlug = new Map(hairstyles.map((h) => [h.slug, h]));
  const seen = new Set<string>();
  const picks: Recommendation[] = [];

  for (const rec of parsed.recommendations || []) {
    const hairstyle = bySlug.get(rec.slug);
    if (!hairstyle || seen.has(hairstyle.slug)) continue;
    seen.add(hairstyle.slug);
    picks.push({ hairstyle, reason: rec.reason });
    if (picks.length === 2) break;
  }

  // Guard against the model returning fewer than two valid, unique picks —
  // top up deterministically so the response always has exactly two.
  for (const h of hairstyles) {
    if (picks.length === 2) break;
    if (seen.has(h.slug)) continue;
    seen.add(h.slug);
    picks.push({ hairstyle: h, reason: 'A great alternative look for you.' });
  }

  return picks.slice(0, 2);
}

async function nearbyBarbersForStyle(
  db: ReturnType<typeof getServiceClient>,
  hairstyleId: string,
  lat: number,
  lng: number,
): Promise<Barber[]> {
  const { data, error } = await db.rpc('search_barbers', {
    p_lat: lat,
    p_lng: lng,
    p_radius: NEARBY_RADIUS_METRES,
    p_min_price: null,
    p_max_price: null,
    p_min_rating: null,
    p_hairstyle_id: hairstyleId,
  });

  if (!error && data) return (data as Barber[]).slice(0, MAX_BARBERS_PER_STYLE);

  // Fallback if the search_barbers RPC isn't set up yet — same pattern as /api/barbers.
  const { data: fallback } = await db
    .from('barbers')
    .select('id, shop_name, city, postcode, address, rating, review_count, avatar_url, cover_image_url, is_approved, is_active')
    .eq('is_active', true)
    .eq('is_approved', true)
    .limit(MAX_BARBERS_PER_STYLE);

  return (fallback as Barber[]) || [];
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const lat = parseFloat((formData.get('lat') as string) || '') || DEFAULT_LAT;
    const lng = parseFloat((formData.get('lng') as string) || '') || DEFAULT_LNG;

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const db = getServiceClient();
    const { data: hairstyles } = await db.from('hairstyles').select('*').eq('is_active', true);

    if (!hairstyles || hairstyles.length < 2) {
      return NextResponse.json({ error: 'Not enough hairstyles configured yet.' }, { status: 500 });
    }

    const picks = await pickHairstyles(dataUrl, hairstyles as Hairstyle[]);

    if (!picks) {
      return NextResponse.json({ error: 'No face detected. Please use a clear front-facing photo.' }, { status: 422 });
    }

    const recommendations = await Promise.all(
      picks.map(async (pick) => ({
        hairstyle: pick.hairstyle,
        reason: pick.reason,
        barbers: await nearbyBarbersForStyle(db, pick.hairstyle.id, lat, lng),
      })),
    );

    return NextResponse.json({ recommendations });
  } catch (err: any) {
    console.error('AI match-style error:', err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
