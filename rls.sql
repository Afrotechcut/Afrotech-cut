-- =============================================================
-- AFROTECHCUTS — Row Level Security lockdown
-- Run this once in the Supabase SQL Editor, after schema.sql.
--
-- Why: NEXT_PUBLIC_SUPABASE_ANON_KEY ships to the browser by design.
-- Supabase auto-exposes a REST + Realtime API over every table to
-- whoever holds that key, UNLESS RLS blocks it. All server-side app
-- code uses the service role key, which always bypasses RLS — so
-- enabling RLS here does not affect any existing API route.
--
-- Policy: default-deny on every table (anon/authenticated get zero
-- access), with a single exception: `bookings` gets a public SELECT
-- policy so the barber dashboard's client-side Realtime subscription
-- (app/dashboard/page.tsx) keeps working.
--
-- Chosen tradeoff: this means guest_name / guest_email / guest_phone
-- on bookings are readable by anyone holding the anon key (trivial to
-- extract from the browser bundle). Revisit before handling real
-- customer PII at scale — e.g. move to Supabase Realtime Authorization
-- (private channels) or replace the subscription with a cookie-
-- authenticated polling endpoint.
-- =============================================================

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_availability   ENABLE ROW LEVEL SECURITY;
ALTER TABLE services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE hairstyles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_hairstyles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_portfolio       ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events       ENABLE ROW LEVEL SECURITY;

-- No policies on the above = default deny for anon/authenticated roles.
-- Service role (used by every API route) bypasses RLS entirely.

-- Exception: allow public SELECT on bookings for the live-dashboard
-- Realtime subscription. No INSERT/UPDATE/DELETE — writes still only
-- happen server-side via the service role key.
CREATE POLICY bookings_public_read ON bookings
  FOR SELECT
  USING (true);
