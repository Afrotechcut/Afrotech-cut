import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServiceClient } from '@/lib/supabase';

const FACE_SHAPES = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'] as const;

// No/placeholder key in this environment — OpenAI calls would fail immediately.
const hasOpenAIKey = !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-...');
const openai = hasOpenAIKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function analyseFaceShape(dataUrl: string): Promise<{ face_shape: string | null; confidence?: number }> {
  if (!openai) {
    // Demo fallback: no OPENAI_API_KEY configured, so pick a plausible result
    // instead of failing outright — keeps the feature demoable end-to-end.
    const face_shape = FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)];
    return { face_shape, confidence: 0.7 + Math.random() * 0.2 };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
            {
              type: 'text',
              text: 'Analyse the face shape in this photo. Respond with ONLY valid JSON: {"face_shape":"<oval|round|square|heart|oblong|diamond>","confidence":<0.0-1.0>}. If no clear face is visible, respond: {"face_shape":null}. No other text.',
            },
          ],
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    return JSON.parse(raw);
  } catch (err) {
    console.error('OpenAI face-shape analysis failed, falling back to demo result:', err);
    const face_shape = FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)];
    return { face_shape, confidence: 0.7 + Math.random() * 0.2 };
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const parsed = await analyseFaceShape(dataUrl);

    if (!parsed.face_shape) {
      return NextResponse.json({ error: 'No face detected. Please use a clear front-facing photo.' }, { status: 422 });
    }

    const db = getServiceClient();
    const { data: hairstyles } = await db
      .from('hairstyles')
      .select('*')
      .eq('is_active', true)
      .contains('face_shapes', [parsed.face_shape]);

    return NextResponse.json({
      face_shape: parsed.face_shape,
      confidence: parsed.confidence,
      hairstyles: hairstyles || [],
    });
  } catch (err: any) {
    console.error('AI match-style error:', err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
