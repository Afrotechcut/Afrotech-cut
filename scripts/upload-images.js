// Uploads local photos from supabase-uploads/{barbers,hairstyles} into the Supabase "assets"
// bucket and links them to the matching DB rows. Safe to re-run — re-uploads overwrite in place.
// Usage: node scripts/upload-images.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].split('#')[0].trim();
});

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const CONTENT_TYPE = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
}

async function uploadBarberPhotos() {
  const dir = path.join(__dirname, '..', 'supabase-uploads', 'barbers');
  const files = listImages(dir);
  if (!files.length) {
    console.log('No barber photos found in supabase-uploads/barbers — skipping.');
    return;
  }

  const { data: barbers } = await db.from('barbers').select('id, shop_name, avatar_url').order('created_at');

  const bySlug = new Map(barbers.map((b) => [slugify(b.shop_name), b]));
  const matched = new Set();
  const assignments = []; // { barber, file }

  // Pass 1: exact slug matches
  for (const file of files) {
    const slug = slugify(path.basename(file, path.extname(file)));
    const barber = bySlug.get(slug);
    if (barber) {
      assignments.push({ barber, file });
      matched.add(file);
      matched.add(barber.id);
    }
  }

  // Pass 2: round-robin remaining files onto barbers that still have no photo assigned
  const unmatchedFiles = files.filter((f) => !matched.has(f));
  const unassignedBarbers = barbers.filter((b) => !matched.has(b.id));
  unmatchedFiles.forEach((file, i) => {
    if (i < unassignedBarbers.length) {
      assignments.push({ barber: unassignedBarbers[i], file });
    }
  });

  for (const { barber, file } of assignments) {
    const ext = path.extname(file).toLowerCase();
    const storagePath = `avatars/${barber.id}${ext}`;
    const buffer = fs.readFileSync(path.join(dir, file));

    const { error: uploadErr } = await db.storage
      .from('assets')
      .upload(storagePath, buffer, { contentType: CONTENT_TYPE[ext], upsert: true });
    if (uploadErr) {
      console.error(`  Failed to upload ${file} for ${barber.shop_name}: ${uploadErr.message}`);
      continue;
    }

    const { error: updateErr } = await db.from('barbers').update({ avatar_url: storagePath }).eq('id', barber.id);
    if (updateErr) {
      console.error(`  Failed to link ${file} to ${barber.shop_name}: ${updateErr.message}`);
      continue;
    }
    console.log(`  ${barber.shop_name} <- ${file}`);
  }

  const stillMissing = barbers.filter((b) => !assignments.some((a) => a.barber.id === b.id) && !b.avatar_url);
  if (stillMissing.length) {
    console.log(`  ${stillMissing.length} barber(s) still without a photo (add more files to get full coverage): ${stillMissing.map((b) => b.shop_name).join(', ')}`);
  }
}

async function uploadHairstylePhotos() {
  const dir = path.join(__dirname, '..', 'supabase-uploads', 'hairstyles');
  const files = listImages(dir);
  if (!files.length) {
    console.log('No hairstyle photos found in supabase-uploads/hairstyles — skipping.');
    return;
  }

  const { data: hairstyles } = await db.from('hairstyles').select('id, slug, name');
  const bySlug = new Map(hairstyles.map((h) => [h.slug, h]));

  for (const file of files) {
    const slug = path.basename(file, path.extname(file));
    const hairstyle = bySlug.get(slug);
    if (!hairstyle) {
      console.warn(`  No hairstyle matches slug "${slug}" (from ${file}) — skipping. Check the README for valid slugs.`);
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    const storagePath = `hairstyles/${slug}${ext}`;
    const buffer = fs.readFileSync(path.join(dir, file));

    const { error: uploadErr } = await db.storage
      .from('assets')
      .upload(storagePath, buffer, { contentType: CONTENT_TYPE[ext], upsert: true });
    if (uploadErr) {
      console.error(`  Failed to upload ${file}: ${uploadErr.message}`);
      continue;
    }

    const { data: pub } = db.storage.from('assets').getPublicUrl(storagePath);
    const { error: updateErr } = await db.from('hairstyles').update({ image_url: pub.publicUrl }).eq('id', hairstyle.id);
    if (updateErr) {
      console.error(`  Failed to link ${file} to ${hairstyle.name}: ${updateErr.message}`);
      continue;
    }
    console.log(`  ${hairstyle.name} <- ${file}`);
  }
}

async function main() {
  console.log('Uploading barber photos...');
  await uploadBarberPhotos();
  console.log('\nUploading hairstyle photos...');
  await uploadHairstylePhotos();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
