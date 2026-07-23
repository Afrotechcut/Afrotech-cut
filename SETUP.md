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
- `RESEND_API_KEY` — from resend.com
- `RESEND_FROM_EMAIL` — verified sender email in Resend
- `JWT_SECRET` — run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate
- `ADMIN_EMAIL` — email for the admin account
- `ADMIN_PASSWORD` — password for the admin account
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local dev

## 3. Database setup

In the Supabase SQL Editor, run these three files **in order**:

1. `schema.sql` — creates all tables, indexes, triggers, and seeds hairstyles
2. `search_barbers.sql` — creates the geo-search RPC function
3. `rls.sql` — locks down Row Level Security so the public anon key can't read/write the database directly (required before deploying anywhere public — see comments in the file for the one intentional exception)

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

## 6. Supabase Realtime

Enable Realtime on the `bookings` table:
- Supabase Dashboard > Database > Replication > Tables
- Toggle `bookings` to enabled

## 7. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Demo flow

1. Register as a barber → complete the Settings page (shop details, hours, services, hairstyle specialisms)
2. Ask admin to approve the barber account at `/admin/barbers`
3. Register as a customer (or use guest booking)
4. Go to `/search`, find the barber, book an appointment
5. Watch the booking appear live in the barber dashboard `/dashboard`

## Admin login

Go to `/login` and sign in with `ADMIN_EMAIL` + `ADMIN_PASSWORD` from your `.env.local`.
