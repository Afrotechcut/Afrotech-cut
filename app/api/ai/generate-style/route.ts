import { NextRequest, NextResponse } from 'next/server';
import { toFile } from 'openai';
import { getServiceClient } from '@/lib/supabase';
import { getOpenAIClient, IMAGE_MODEL } from '@/lib/openai';

// GPT Image edits can take a while — allow platforms like Vercel to extend the
// serverless timeout for this route (ignored where unsupported, e.g. local dev).
export const maxDuration = 60;

function buildPrompt(name: string, description: string) {
  return `Edit this exact photo. Do not create a new person or change the face in any way.

Keep completely unchanged: this person's exact facial features, bone structure, skin tone, complexion, expression, eyes, and background.

Change ONLY the hair: give this person the "${name}" hairstyle — ${description}.

This is a precise hair-only edit for a Black customer with Afro-textured hair. Preserve their real skin tone and complexion faithfully — do not lighten, darken, or alter it. The result must be immediately recognisable as the same person in the same photo, wearing only a new haircut. Do not change age, gender presentation, pose, or any other feature.`;
}

export async function POST(req: NextRequest) {
  try {
    const openai = getOpenAIClient();
    if (!openai) return NextResponse.json({ error: 'AI is not configured' }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const hairstyleId = formData.get('hairstyleId') as string | null;

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    if (!hairstyleId) return NextResponse.json({ error: 'No hairstyle specified' }, { status: 400 });

    const db = getServiceClient();
    const { data: hairstyle } = await db.from('hairstyles').select('name, description').eq('id', hairstyleId).single();
    if (!hairstyle) return NextResponse.json({ error: 'Unknown hairstyle' }, { status: 404 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = await toFile(buffer, file.name || 'photo.jpg', { type: file.type || 'image/jpeg' });

    const result = await openai.images.edit({
      model: IMAGE_MODEL,
      image,
      prompt: buildPrompt(hairstyle.name, hairstyle.description),
      size: '1024x1024',
      quality: 'high',
      // Not in the installed SDK's types yet, but the API supports it — pushes the
      // model to preserve the input face/identity instead of loosely reinterpreting it.
      input_fidelity: 'high',
    } as Parameters<typeof openai.images.edit>[0] & { input_fidelity: 'high' });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image returned');

    return NextResponse.json({ image: `data:image/png;base64,${b64}` });
  } catch (err: any) {
    // err.status/err.code come from the OpenAI SDK's APIError — logging them explicitly
    // (rate limits, concurrency limits, content-policy rejections all surface here)
    // makes this diagnosable from Vercel's function logs instead of just "it failed".
    console.error('AI generate-style error:', { status: err?.status, code: err?.code, message: err?.message || err });
    const status = err?.status === 429 ? 429 : 500;
    return NextResponse.json({ error: status === 429 ? 'Too many requests — please try again shortly.' : 'Image generation failed' }, { status });
  }
}
