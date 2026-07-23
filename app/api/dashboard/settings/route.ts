import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'barber') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const db = getServiceClient();

  const [{ data: barber }, { data: availability }, { data: services }, { data: hairstyles }] =
    await Promise.all([
      db.from('barbers').select('*').eq('id', session.barberId!).single(),
      db.from('barber_availability').select('*').eq('barber_id', session.barberId!).order('day_of_week'),
      db.from('services').select('*').eq('barber_id', session.barberId!).order('price'),
      db.from('barber_hairstyles').select('hairstyle_id').eq('barber_id', session.barberId!),
    ]);

  return NextResponse.json({ barber, availability, services, hairstyleIds: (hairstyles || []).map((h) => h.hairstyle_id) });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'barber') return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = getServiceClient();
  const body = await req.json();
  const { availability, services, hairstyleIds, ...barberFields } = body;

  // Update barber profile
  if (Object.keys(barberFields).length > 0) {
    // If lat/lng provided, build geography point
    if (barberFields.lat !== undefined && barberFields.lng !== undefined) {
      barberFields.location = `POINT(${barberFields.lng} ${barberFields.lat})`;
      delete barberFields.lat;
      delete barberFields.lng;
    }
    await db.from('barbers').update(barberFields).eq('id', session.barberId!);
  }

  // Update availability
  if (availability) {
    for (const slot of availability) {
      await db
        .from('barber_availability')
        .upsert({ ...slot, barber_id: session.barberId! }, { onConflict: 'barber_id,day_of_week' });
    }
  }

  // Upsert services
  if (services) {
    for (const svc of services) {
      if (svc.id) {
        await db.from('services').update(svc).eq('id', svc.id).eq('barber_id', session.barberId!);
      } else {
        await db.from('services').insert({ ...svc, barber_id: session.barberId! });
      }
    }
  }

  // Sync hairstyle associations
  if (hairstyleIds) {
    await db.from('barber_hairstyles').delete().eq('barber_id', session.barberId!);
    if (hairstyleIds.length > 0) {
      await db.from('barber_hairstyles').insert(
        hairstyleIds.map((id: string) => ({ barber_id: session.barberId!, hairstyle_id: id })),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
