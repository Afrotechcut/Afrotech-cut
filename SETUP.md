# AFROTECHCUTS — Setup Guide

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project Settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key (safe to expose)
- `SUPABASE_SERVICE_ROLE_KEY` — secret service role key (server-only)
- `NEXT_PUBLIC_MAPTILER_KEY` — free account at maptiler.com (no card required); copy your key from Account > Keys
- `OPENAI_API_KEY` — from platform.openai.com
- `OPENAI_IMAGE_MODEL` — optional, defaults to `gpt-image-1` (the only OpenAI image-edit model generally available besides `dall-e-2`)
- `RESEND_API_KEY` — from resend.com
- `RESEND_FROM_EMAIL` — verified sender email in Resend
- `JWT_SECRET` — run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate
- `ADMIN_EMAIL` — email for the admin account
- `ADMIN_PASSWORD` — password for the admin account
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local dev

## 3. Database setup

In the Supabase SQL Editor, run these three files **in order**:

1. `schema.sql` — creates all tables, indexes, triggers, and seeds hairstyles + hair types
2. `search_barbers.sql` — creates the geo-search RPC function
3. `rls.sql` — locks down Row Level Security so the public anon key can't read/write the database directly (required before deploying anywhere public — see comments in the file for the one intentional exception)

**Already have a database from before hair-type matching was added?** Don't re-run `schema.sql` (it'll fail on existing tables). Instead run only the block at the bottom of `schema.sql` headed `MIGRATION: adding hair-type matching to an existing database`, then re-run the (unchanged-elsewhere) `search_barbers.sql` and `rls.sql` — both are safe to run again on top of an existing setup.

## 4. Supabase Storage

Create two storage buckets in Supabase:
- `assets` — set to **Public**
- `face-captures` — set to **Private**

## 5. Hairstyle images

Upload 15 images (one per hairstyle slug) to the `assets` bucket at path `hairstyles/<slug>.jpg`:

| Slug | File |
|------|------|
| high-top-fade | hairstyles/high-top-fade.jpg |
| low-skin-fade | hairstyles/low-skin-fade.jpg |
| mid-fade-waves | hairstyles/mid-fade-waves.jpg |
| full-afro | hairstyles/full-afro.jpg |
| twist-out | hairstyles/twist-out.jpg |
| mohawk-fade | hairstyles/mohawk-fade.jpg |
| starter-locs | hairstyles/starter-locs.jpg |
| caesar-taper | hairstyles/caesar-taper.jpg |
| line-up | hairstyles/line-up.jpg |
| burst-fade | hairstyles/burst-fade.jpg |
| taper-fade | hairstyles/taper-fade.jpg |
| temple-fade | hairstyles/temple-fade.jpg |
| freeform-locs | hairstyles/freeform-locs.jpg |
| cornrows-straight-back | hairstyles/cornrows-straight-back.jpg |
| drop-fade-curl-top | hairstyles/drop-fade-curl-top.jpg |

After uploading, update the `image_url` column in the `hairstyles` table with the full public URL:
`https://<project-ref>.supabase.co/storage/v1/object/public/assets/hairstyles/<slug>.jpg`

Good sources for barber/hairstyle photos: Unsplash (search "fade haircut", "afro", "twist out"), Pexels.

## 6. Hair type matching

Nothing to set up for the demo — the 6 seeded hair types (the standard 3A–4C curl-pattern scale used across the natural/Afro hair community) ship with generated reference graphics already committed at `public/hairtypes/<code>.svg`, so the visual picker works out of the box with no Supabase Storage upload required.

**To add a new hair type later** (this is the whole point — it's built to extend without touching code):
1. Insert a row into the `hair_types` table: `code` (e.g. `'3d'`), `name` (plain-language, e.g. `'Voluminous Curls'`), `description`, `swatch_url`, and `sort_order` (controls where it falls in the picker).
2. For `swatch_url`, either:
   - Drop an image at `public/hairtypes/<file>` and set `swatch_url` to `/hairtypes/<file>`, or
   - Upload to the `assets` Storage bucket at `hairtypes/<file>` and set `swatch_url` to `hairtypes/<file>` (same convention as `hairstyles.image_url` — anything not starting with `/` or `http` is resolved against that bucket).
3. That's it — it appears automatically in the barber settings picker, the customer search filter, and any barber profile that selects it. No code changes, no redeploy.

Barbers select hair types by their technical code (`3A`, `4C`, etc. — they know the terminology). Customers pick by sight from the swatch images, since most people don't know their type's jargon name; the swatch is the primary identifier there, with the plain-language name underneath.

## 7. Supabase Realtime

Enable Realtime on the `bookings` table:
- Supabase Dashboard > Database > Replication > Tables
- Toggle `bookings` to enabled

## 8. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Demo flow

1. Register as a barber → complete the Settings page (shop details, hours, services, hairstyle specialisms, hair types you work with)
2. Ask admin to approve the barber account at `/admin/barbers`
3. Register as a customer (or use guest booking)
4. Go to `/search`, pick your hair type from the visual picker (and/or filter by hairstyle), find the barber, book an appointment
5. Watch the booking appear live in the barber dashboard `/dashboard`

## AI Style Match

`/style-match` lets a customer upload or capture a photo. It makes two OpenAI calls:

1. `gpt-4o` (vision) picks exactly two hairstyles from the seeded catalogue that suit the photo, each with a one-line reason. It can only pick from the seeded list — never invents a style.
2. For each pick, `gpt-image-1` (image edit, `input_fidelity: high`) generates the customer wearing that cut, using their photo as the reference. The prompt is strict about preserving their exact face, skin tone and identity — only the hair changes. If a generation fails, the UI falls back to that style's reference photo instead of showing a broken image.

This is a face-shape/style match, separate from hair-type matching above — it doesn't ask about or infer curl pattern; hair type is only ever customer-declared, used purely to filter search.

Each generated image is a separate async call, so the two results load independently with their own spinners — expect a few seconds per image. Nearby barbers who offer each cut are shown underneath (uses the browser's geolocation if granted, otherwise falls back to a wide radius around the app's default city).

## Admin login

Go to `/login` and sign in with `ADMIN_EMAIL` + `ADMIN_PASSWORD` from your `.env.local`.
