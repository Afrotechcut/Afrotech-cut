// One-off demo data seeder for the pitch. Safe to re-run — skips barbers whose email already exists.
// Usage: node scripts/seed-demo.js

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].split('#')[0].trim();
});

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DEMO_PASSWORD = 'Demo12345';

const PORTFOLIO_IMAGES = [
  '1503951914875-452162b0f3f1',
  '1605497788044-5a32c7078486',
  '1585747860715-2ba37e788b70',
  '1599351431202-1e0f0137899a',
  '1622286342621-4bd786c2447c',
  '1519345182560-3f2917c472ef',
  '1517832606299-7ae9b720a186',
  '1487412947147-5cebf100ffc2',
  '1621607512214-68297480165e',
  '1560869713-7d0a29430803',
  '1516975080664-ed2fc6a32937',
  '1580618672591-eb180b1a973f',
  '1583864697784-a0efc8379f70',
  '1601288496920-b6154fe3626a',
].map((id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&fit=crop`);

function img(i) {
  return PORTFOLIO_IMAGES[i % PORTFOLIO_IMAGES.length];
}

const AREAS = [
  { area: 'Shoreditch', postcode: 'E1 6JN', lat: 51.5255, lng: -0.0778 },
  { area: 'Brixton', postcode: 'SW9 8PS', lat: 51.4613, lng: -0.1156 },
  { area: 'Peckham', postcode: 'SE15 5DQ', lat: 51.4736, lng: -0.0687 },
  { area: 'Hackney', postcode: 'E8 1DY', lat: 51.5450, lng: -0.0553 },
  { area: 'Camden', postcode: 'NW1 8AH', lat: 51.5390, lng: -0.1426 },
  { area: 'Croydon', postcode: 'CR0 1EA', lat: 51.3762, lng: -0.0982 },
  { area: 'Tottenham', postcode: 'N17 6QN', lat: 51.5883, lng: -0.0680 },
  { area: 'Dalston', postcode: 'E8 3BQ', lat: 51.5465, lng: -0.0754 },
  { area: 'Clapham', postcode: 'SW4 7AA', lat: 51.4618, lng: -0.1384 },
  { area: 'Deptford', postcode: 'SE8 4RT', lat: 51.4791, lng: -0.0246 },
  { area: 'Lewisham', postcode: 'SE13 6LG', lat: 51.4624, lng: -0.0121 },
  { area: 'Walthamstow', postcode: 'E17 7JN', lat: 51.5908, lng: -0.0134 },
  { area: 'Stratford', postcode: 'E15 1XE', lat: 51.5416, lng: -0.0042 },
  { area: 'Wood Green', postcode: 'N22 6XF', lat: 51.5975, lng: -0.1092 },
  { area: 'Harlesden', postcode: 'NW10 4SX', lat: 51.5387, lng: -0.2513 },
  { area: 'Ealing', postcode: 'W5 5EP', lat: 51.5130, lng: -0.3089 },
  { area: 'Wembley', postcode: 'HA9 6AZ', lat: 51.5528, lng: -0.2963 },
  { area: 'Catford', postcode: 'SE6 4RU', lat: 51.4452, lng: -0.0209 },
  { area: 'Elephant & Castle', postcode: 'SE1 6TE', lat: 51.4943, lng: -0.1000 },
  { area: 'Angel', postcode: 'N1 8DU', lat: 51.5322, lng: -0.1058 },
  { area: 'Bethnal Green', postcode: 'E2 0RY', lat: 51.5270, lng: -0.0549 },
  { area: 'New Cross', postcode: 'SE14 6AB', lat: 51.4757, lng: -0.0339 },
];

const SHOPS = [
  'Sharp Kutz', 'The Fade Lab', 'Royal Clippers', 'Kings & Crowns Barbers', 'Blessed Hands Barbershop',
  'Distinction Barbers', 'The Gentlemen\'s Cut', 'Crown & Glory', 'Fresh Fadez', 'Sculpted Barbershop',
  'Legacy Cuts', 'The Grooming Room', 'Prestige Barbers', 'Elite Edge Barbers', 'Nu Vibe Barbershop',
  'The Barber Bench', 'Immaculate Cuts', 'Sleek Styles Barbershop', 'The Clipper House', 'Finesse Barbers',
  'Top Tier Cuts', 'The Sharp Shop',
];

const BARBER_NAMES = [
  'Marcus Bailey', 'Kwame Osei', 'Andre Campbell', 'Tyrell Grant', 'Michael Adeyemi',
  'Junior Thompson', 'Kobi Mensah', 'Leon Richards', 'Dwayne Forsythe', 'Isaiah Clarke',
  'Rasheed Cole', 'Malachi Brown', 'Jerome Anderson', 'Elijah Bennett', 'Kai Robinson',
  'Emmanuel Boateng', 'Ricardo Stephenson', 'Nathaniel Reid', 'Samuel Owusu', 'Devante Miller',
  'Tariq Henry', 'Solomon Asante',
];

const SERVICE_CATALOG = [
  { name: 'Skin Fade', price: 25, duration_minutes: 30 },
  { name: 'Low Fade', price: 22, duration_minutes: 30 },
  { name: 'Afro Trim', price: 20, duration_minutes: 30 },
  { name: 'Beard Trim', price: 12, duration_minutes: 30 },
  { name: 'Hot Towel Shave', price: 18, duration_minutes: 30 },
  { name: 'Kids Cut (Under 12)', price: 15, duration_minutes: 30 },
  { name: 'Full Groom (Cut + Beard)', price: 35, duration_minutes: 60 },
  { name: 'Line Up', price: 10, duration_minutes: 30 },
  { name: 'Twist Out Styling', price: 30, duration_minutes: 30 },
  { name: 'Locs Retwist', price: 40, duration_minutes: 60 },
  { name: 'Cornrows', price: 35, duration_minutes: 60 },
  { name: '360 Waves Cut', price: 28, duration_minutes: 30 },
];

const REVIEW_COMMENTS = [
  { rating: 5, comment: 'Best fade I\'ve had in years, will be back every 2 weeks.' },
  { rating: 5, comment: 'Clean lines, great vibe in the shop. Highly recommend.' },
  { rating: 4, comment: 'Solid cut, took a little longer than expected but worth it.' },
  { rating: 5, comment: 'Booked online in seconds, barber was spot on with the style.' },
  { rating: 5, comment: 'My go-to spot now. Always consistent.' },
  { rating: 3, comment: 'Good cut but the shop was quite busy and felt rushed.' },
  { rating: 5, comment: 'Attention to detail is unmatched. Left very happy.' },
  { rating: 4, comment: 'Great service, friendly barber, will return.' },
];

const CUSTOMER_NAMES = [
  'James Okafor', 'Daniel Smith', 'Chris Ade', 'Ryan Douglas', 'Tom Baptiste', 'Liam Forde',
  'Josh Nkemelu', 'Ben Whyte', 'Aaron Lindo', 'Connor James', 'Mason Blair', 'Ellis Grant',
];

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function deleteDebugAccounts() {
  const debugNames = ['Debug Test', 'Debug Barber', 'Dup Test'];
  const { data: users } = await db.from('users').select('id, full_name').in('full_name', debugNames);
  if (users && users.length) {
    const ids = users.map((u) => u.id);
    await db.from('users').delete().in('id', ids); // cascades to barbers -> availability/services/etc.
    console.log(`Deleted ${ids.length} debug account(s): ${users.map((u) => u.full_name).join(', ')}`);
  } else {
    console.log('No debug accounts found to delete.');
  }
}

async function seedBarber(i, hairstyles) {
  const personName = BARBER_NAMES[i];
  const shopName = SHOPS[i];
  const area = AREAS[i];
  const firstName = personName.split(' ')[0].toLowerCase();
  const shopSlug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const email = `${firstName}@${shopSlug}.co.uk`;

  const { data: existing } = await db.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) {
    console.log(`Skipping ${shopName} — already seeded (${email})`);
    return;
  }

  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const { data: user, error: userErr } = await db
    .from('users')
    .insert({
      email,
      password_hash,
      full_name: personName,
      phone: `+44 7${randomInt(100000000, 999999999)}`,
      role: 'barber',
    })
    .select()
    .single();
  if (userErr) throw new Error(`user insert failed for ${shopName}: ${userErr.message}`);

  const { data: barber, error: barberErr } = await db
    .from('barbers')
    .insert({
      user_id: user.id,
      shop_name: shopName,
      bio: `${shopName} in ${area.area} — specialists in fades, afro cuts, and precision grooming for the whole family.`,
      address: `${randomInt(2, 180)} High Street, ${area.area}`,
      city: 'London',
      postcode: area.postcode,
      location: `POINT(${area.lng} ${area.lat})`,
      phone: `+44 20 7${randomInt(1000000, 9999999)}`,
      is_approved: true,
      is_active: true,
    })
    .select()
    .single();
  if (barberErr) throw new Error(`barber insert failed for ${shopName}: ${barberErr.message}`);

  // Availability: Mon–Sat 09:00–18:00, Sunday closed
  const availability = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    barber_id: barber.id,
    day_of_week: day,
    is_open: day !== 0,
    open_time: '09:00',
    close_time: '18:00',
  }));
  await db.from('barber_availability').insert(availability);

  // Services: 4-6 random from catalog
  const chosenServices = pickRandom(SERVICE_CATALOG, randomInt(4, 6));
  const { data: services, error: servicesErr } = await db
    .from('services')
    .insert(chosenServices.map((s) => ({ barber_id: barber.id, ...s })))
    .select();
  if (servicesErr) throw new Error(`services insert failed for ${shopName}: ${servicesErr.message}`);

  // Hairstyle specialisms: 3-5 random
  const chosenStyles = pickRandom(hairstyles, randomInt(3, 5));
  await db.from('barber_hairstyles').insert(
    chosenStyles.map((h) => ({ barber_id: barber.id, hairstyle_id: h.id })),
  );

  // Portfolio: 2-3 photos
  const portfolioCount = randomInt(2, 3);
  await db.from('barber_portfolio').insert(
    Array.from({ length: portfolioCount }, (_, idx) => ({
      barber_id: barber.id,
      image_url: img(i * 3 + idx),
      caption: null,
      sort_order: idx,
    })),
  );

  // Completed bookings + reviews for social proof
  const reviewCount = randomInt(3, 6);
  for (let r = 0; r < reviewCount; r++) {
    const service = services[randomInt(0, services.length - 1)];
    const daysAgo = randomInt(3, 90);
    const appointmentDate = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
    const hour = randomInt(9, 17);
    const appointmentTime = `${String(hour).padStart(2, '0')}:00`;
    const customerName = CUSTOMER_NAMES[randomInt(0, CUSTOMER_NAMES.length - 1)];

    const { data: booking, error: bookingErr } = await db
      .from('bookings')
      .insert({
        barber_id: barber.id,
        service_id: service.id,
        guest_name: customerName,
        guest_email: `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        duration_minutes: service.duration_minutes,
        total_price: service.price,
        status: 'completed',
      })
      .select()
      .single();
    if (bookingErr) {
      console.warn(`  booking skipped (${bookingErr.message})`);
      continue;
    }

    const review = REVIEW_COMMENTS[randomInt(0, REVIEW_COMMENTS.length - 1)];
    await db.from('reviews').insert({
      barber_id: barber.id,
      booking_id: booking.id,
      reviewer_name: customerName,
      rating: review.rating,
      comment: review.comment,
    });
  }

  console.log(`Seeded ${shopName} (${area.area}) — ${chosenServices.length} services, ${chosenStyles.length} styles, ${reviewCount} reviews`);
}

async function main() {
  await deleteDebugAccounts();

  const { data: hairstyles } = await db.from('hairstyles').select('id, slug');
  if (!hairstyles || !hairstyles.length) throw new Error('No hairstyles found — run schema.sql first.');

  for (let i = 0; i < AREAS.length; i++) {
    await seedBarber(i, hairstyles);
  }

  console.log('\nDone. All demo barbers can log in at /login with password: ' + DEMO_PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
