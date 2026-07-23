# AFROTECHCUTS — System Design

## 1. Data Model Overview

```
users ──────────── barbers ─────┬── barber_availability
  (customer / barber)            ├── services
                                 ├── barber_hairstyles ── hairstyles
                                 ├── barber_portfolio
                                 ├── inventory
                                 └── bookings ─── reviews
                                                   └── analytics_events
```

- **users** is the single auth table. Role distinguishes customers from barbers; admin is env-only.
- **barbers** extends a user with a shop profile. `location` is a PostGIS GEOGRAPHY(POINT) — the centre of every geo query.
- **bookings** accepts both registered users (user_id FK) and guests (guest_* TEXT columns). A DB-level partial unique index prevents double-booking at the same time slot without touching application code.
- **hairstyles** is pre-seeded with 15 styles. The `face_shapes TEXT[]` and `tags TEXT[]` columns are GIN-indexed so the AI matching query (face shape → candidate styles) is a single `@>` array-contains lookup.


---

## 2. Main User Flows

### Customer — Discover → Book

```
Landing page
  → Search (map + filters)
      ↳ GET /api/barbers?lat=&lng=&radius=&price=&rating=&styleId=
        SQL: ST_DWithin(location, point, radius_metres) ORDER BY distance
  → Barber profile page
      ↳ GET /api/barbers/[id] — services, portfolio, reviews, availability
  → AI Style Match (optional)
      ↳ POST /api/ai/match-style
        Upload photo → Supabase Storage → OpenAI Vision → face shape → hairstyles WHERE face_shapes @> [shape]
  → Booking page
      ↳ GET /api/barbers/[id]/slots?date=YYYY-MM-DD
        Compute: barber_availability for that weekday → subtract booked time slots → return free 30-min windows
  → Checkout (demo payment — click to pay)
      ↳ POST /api/bookings
        Insert booking (status='confirmed') → Resend confirmation email → Resend barber notification
  → Success page
```

### Barber — Manage Shop

```
Register (creates users row + barbers row)
  → Onboarding: shop details, map pin, weekly hours (barber_availability), services, hairstyles
  → Dashboard (real-time)
      ↳ Incoming bookings: Supabase Realtime subscription on bookings WHERE barber_id=X
      ↳ Calendar view, customer history, reviews, inventory, analytics
```

### Admin — Platform Control

```
Login with ADMIN_EMAIL / ADMIN_PASSWORD (env vars, not users table)
  → Admin dashboard
      ↳ All bookings, barber approval queue, user counts, revenue totals
      ↳ Approve / suspend barbers, view platform health
```


---

## 3. Authentication

**No Supabase Auth.** Custom email/password with bcrypt + JWT.

### Flow

1. **Register** — `POST /api/auth/register`
   - Hash password with bcrypt (cost 12)
   - Insert into `users`, create `barbers` row if role=barber
   - Issue JWT, set as httpOnly Secure cookie (`token`)

2. **Login** — `POST /api/auth/login`
   - For admin: compare email to `ADMIN_EMAIL`, password to `ADMIN_PASSWORD`
   - For users: look up by email, bcrypt.compare
   - Issue JWT, set cookie

3. **Session** — stateless JWT stored in httpOnly cookie
   - Payload: `{ sub: userId, role: 'customer'|'barber'|'admin', exp: +7d }`
   - Every API route reads the cookie, verifies the JWT with `JWT_SECRET`
   - No refresh token for MVP — 7-day sliding window is sufficient

4. **Logout** — clear the cookie

### Why stateless JWT over sessions table?
No round-trip to the database on every request. For an MVP with light traffic this is correct. If the product grows, adding a token revocation table is a one-day job.

### Supabase access
All server-side Supabase calls use the **service role key** (never the anon key on the server). This bypasses RLS entirely, which is correct since all auth/authorisation is enforced in the Next.js API layer. The anon key is only used client-side for Supabase Realtime subscriptions (read-only, scoped to the current barber's bookings).


---

## 4. Map and Geo-Search

**Library: Mapbox GL JS**

Chosen over Leaflet for three reasons:
1. WebGL rendering — smooth at 60fps as pins animate in, critical for a pitch demo
2. First-class clustering API (`mapbox-gl-js` supercluster) — multiple barbers in the same postcode cluster into a numbered badge, exactly like Google Maps
3. Visual polish — Mapbox's default style is contemporary and premium-looking without custom configuration

Trade-off: Mapbox costs money past 50k map loads/month (free tier). For a UK MVP this is not a concern. If it becomes one, the codebase can swap to `maplibre-gl` (drop-in OSS fork) with no code changes.

**Geo query pattern:**
```sql
SELECT
  b.*,
  ROUND(ST_Distance(b.location, ST_GeomFromText('POINT($lng $lat)', 4326)::geography)::numeric, 0) AS distance_metres
FROM barbers b
JOIN services s ON s.barber_id = b.id AND s.is_active = TRUE
WHERE
  b.is_active = TRUE AND b.is_approved = TRUE
  AND ST_DWithin(b.location, ST_GeomFromText('POINT($lng $lat)', 4326)::geography, $radius_metres)
  AND ($min_price IS NULL OR s.price >= $min_price)
  AND ($max_price IS NULL OR s.price <= $max_price)
  AND ($rating IS NULL OR b.rating >= $rating)
ORDER BY distance_metres;
```

Using `GEOGRAPHY` (not `GEOMETRY`) ensures distances are calculated on the real spheroid, not a flat projection. This matters at UK scales — at 5km the error from flat projection is ~30m, acceptable, but GEOGRAPHY is the correct default.

**Radius slider:** 1km / 2km / 5km maps to 1000 / 2000 / 5000 metres. The slider fires a debounced API call on change; the Mapbox viewport updates to fit all returned pins using `map.fitBounds`.


---

## 5. Time Slot System

**Design: dynamic computation, no pre-generated rows.**

When a customer selects a date on the booking page:
1. Fetch `barber_availability` for that `day_of_week`
2. Fetch existing `bookings` for that barber on that date (status NOT IN ('cancelled','no_show'))
3. Generate 30-minute slots from `open_time` to `close_time - service.duration_minutes`
4. Subtract any slot that overlaps an existing booking
5. Return the free windows

Why not pre-generate slots? Pre-generation creates a synchronisation problem — you need to delete slots when bookings are cancelled, add slots when availability changes, and the table gets large fast. Dynamic computation runs in milliseconds and is always correct. The double-booking partial unique index at the DB layer is the safety net if two users race to book the same slot.

Displayed like Calendly: date picker → time grid of available slots → click to select.


---

## 6. Real-Time Updates

**Supabase Realtime** (built on PostgreSQL logical replication + WebSockets).

Used in one place: the barber's live bookings feed.

```js
// Client-side in the barber dashboard
const channel = supabase
  .channel('barber-bookings')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bookings',
    filter: `barber_id=eq.${barberId}`,
  }, (payload) => {
    // prepend new booking to the list
  })
  .subscribe()
```

The anon key is used here (client-side, read-only). Supabase Realtime does not enforce RLS on its own without policies, so the filter `barber_id=eq.X` is enforced in the subscription filter parameter. For production you'd add RLS; for this MVP the API key is public anyway.


---

## 7. Face AI Flow

1. Customer takes a photo or uploads one
2. Client uploads directly to Supabase Storage bucket `face-captures` (via signed upload URL to avoid routing the image through the Next.js server)
3. Client sends the storage URL to `POST /api/ai/match-style`
4. Server calls OpenAI `gpt-4o` with the image URL:

```
Prompt: "Analyse the face shape in this photo. 
Respond with ONLY a JSON object: { "face_shape": "<oval|round|square|heart|oblong|diamond>", "confidence": <0-1> }.
If no face is visible, return { "face_shape": null }."
```

5. Server queries `hairstyles WHERE face_shapes @> ARRAY[face_shape] AND is_active = TRUE`
6. Returns 3–5 matched hairstyles with their images and descriptions
7. Client shows the matches with a "Find barbers who do this" CTA, which pre-fills the style filter on the map

Why `gpt-4o` over a custom model? Zero training data required. For an MVP pitch, prompt engineering against a vision model is the correct move. The call takes ~2s which is acceptable for a non-blocking feature.

Supabase Storage for face images uses a private bucket with a short-lived signed URL — images are never permanently public.


---

## 8. Email (Resend)

Two transactional emails:

**Booking confirmation → customer**
```
Subject: Your booking at [Shop Name] is confirmed
Body: Date, time, service, price, barber address + map link, cancellation note
```

**New booking notification → barber**
```
Subject: New booking: [Customer Name] — [Date] at [Time]
Body: Customer contact details, service, any notes
```

Both send from `noreply@afrotechcuts.co.uk` using Resend. The API call is fire-and-forget (awaited but failures don't roll back the booking).


---

## 9. Environment Variables

Create a `.env.local` file at the project root with these:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # safe to expose — client-side Realtime only
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # server-only — never expose to client

# Map
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...           # Mapbox public token

# AI
OPENAI_API_KEY=sk-...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@afrotechcuts.co.uk

# Auth
JWT_SECRET=<at-least-32-chars-of-random-entropy>  # e.g. openssl rand -hex 32

# Admin account (not stored in database)
ADMIN_EMAIL=admin@afrotechcuts.co.uk
ADMIN_PASSWORD=<strong-password>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```


---

## 10. Key Technical Decisions — Summary

| Decision | Choice | Why |
|---|---|---|
| Map library | Mapbox GL JS | WebGL perf + built-in clustering + premium visual quality |
| Geo type | GEOGRAPHY | Spheroid-accurate distances, correct for UK radius search |
| Auth model | Custom JWT (httpOnly cookie) | No Supabase Auth per spec; stateless = no DB round-trip per request |
| Time slots | Dynamic computation | Always accurate; no sync burden; slot conflict blocked at DB level |
| Real-time | Supabase Realtime | Already using Supabase; zero extra infrastructure |
| Face AI | GPT-4o Vision | No training data needed; prompt engineering sufficient for MVP |
| Payment | Demo only | Spec requirement; realistic UX (loading state → success) |
| Admin auth | Env var credentials | Spec requirement; single account, no signup surface |
| Supabase access | Service role key server-side | Eliminates RLS complexity; auth enforced in API layer |
| Image storage | Supabase Storage | Already on Supabase; signed URLs for private face captures |


---

## 11. What to Prepare Before We Build

1. **Supabase project** — run `schema.sql` in the SQL editor. Enable Storage and create two buckets:
   - `assets` (public) — barber photos, portfolio, hairstyle images
   - `face-captures` (private) — AI face uploads

2. **Hairstyle images** — upload 15 photos (one per slug) to `assets/hairstyles/<slug>.jpg`. Stock photo sources: Unsplash, Pexels (search "barber fade", "afro", "twist out", etc.). Update the `image_url` column after uploading.

3. **Mapbox account** — create a token at mapbox.com with `styles:read` and `tiles:read` scope.

4. **OpenAI account** — API key with access to `gpt-4o`.

5. **Resend account** — API key + verify your sending domain.

6. **Domain** — optional for local dev but needed for Resend email delivery in production.

Once these are ready, confirm and we build the full application end to end.
