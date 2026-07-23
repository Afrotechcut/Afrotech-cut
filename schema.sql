-- =============================================================
-- AFROTECHCUTS — Complete Database Schema
-- Paste this entire file into the Supabase SQL Editor and run it.
-- PostGIS is enabled by default on all Supabase projects.
-- =============================================================


-- =============================================================
-- EXTENSIONS
-- =============================================================

CREATE EXTENSION IF NOT EXISTS postgis;


-- =============================================================
-- HELPER FUNCTIONS
-- =============================================================

-- Automatically stamps updated_at on any table
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recomputes a barber's rating aggregate whenever a review is written or removed
CREATE OR REPLACE FUNCTION refresh_barber_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_barber_id UUID;
BEGIN
  target_barber_id := COALESCE(NEW.barber_id, OLD.barber_id);
  UPDATE barbers
  SET
    rating       = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE barber_id = target_barber_id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE barber_id = target_barber_id)
  WHERE id = target_barber_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;


-- =============================================================
-- CORE TABLES
-- =============================================================

-- Users: customers and barbers share this table; role differentiates them.
-- Admin credentials live in environment variables, not here.
CREATE TABLE users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT         UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  full_name     TEXT         NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  role          TEXT         NOT NULL DEFAULT 'customer'
                             CHECK (role IN ('customer', 'barber')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Barbers: one profile per barber user.
-- location uses GEOGRAPHY so ST_DWithin returns metres on a real sphere.
CREATE TABLE barbers (
  id              UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID                   NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name       TEXT                   NOT NULL,
  bio             TEXT,
  address         TEXT                   NOT NULL,
  city            TEXT                   NOT NULL DEFAULT 'London',
  postcode        TEXT                   NOT NULL,
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  phone           TEXT,
  website         TEXT,
  avatar_url      TEXT,
  cover_image_url TEXT,
  is_approved     BOOLEAN                NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN                NOT NULL DEFAULT TRUE,
  rating          NUMERIC(3,2)           NOT NULL DEFAULT 0.00,
  review_count    INTEGER                NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

-- Barber availability: one row per day of week (0=Sunday … 6=Saturday).
-- open_time / close_time are NULL when is_open = false.
CREATE TABLE barber_availability (
  id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id    UUID     NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week  INTEGER  NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open      BOOLEAN  NOT NULL DEFAULT TRUE,
  open_time    TIME,
  close_time   TIME,
  UNIQUE (barber_id, day_of_week)
);

-- Services: everything a barber charges for.
CREATE TABLE services (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id        UUID         NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  name             TEXT         NOT NULL,
  description      TEXT,
  price            NUMERIC(8,2) NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER      NOT NULL DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes % 30 = 0),
  image_url        TEXT,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Hairstyle catalogue: pre-seeded below.
-- face_shapes and tags are GIN-indexed TEXT arrays — cheap to filter client-side too.
CREATE TABLE hairstyles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT        NOT NULL,
  image_url   TEXT        NOT NULL,
  -- which face shapes this style suits: oval | round | square | heart | oblong | diamond
  face_shapes TEXT[]      NOT NULL,
  -- searchable style tags
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE
);

-- Junction: barbers advertise which hairstyles they can execute.
CREATE TABLE barber_hairstyles (
  barber_id    UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  hairstyle_id UUID NOT NULL REFERENCES hairstyles(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, hairstyle_id)
);

-- Bookings: supports both registered users (user_id) and guests (guest_* fields).
-- Payment is demo-only so every booking is created as 'confirmed' immediately.
CREATE TABLE bookings (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id        UUID         NOT NULL REFERENCES barbers(id),
  service_id       UUID         NOT NULL REFERENCES services(id),
  user_id          UUID         REFERENCES users(id),   -- NULL for guest
  guest_name       TEXT,
  guest_email      TEXT         NOT NULL,
  guest_phone      TEXT,
  appointment_date DATE         NOT NULL,
  appointment_time TIME         NOT NULL,
  duration_minutes INTEGER      NOT NULL,
  total_price      NUMERIC(8,2) NOT NULL,
  status           TEXT         NOT NULL DEFAULT 'confirmed'
                                CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Reviews: one review per completed booking.
CREATE TABLE reviews (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id      UUID        NOT NULL REFERENCES barbers(id),
  booking_id     UUID        NOT NULL UNIQUE REFERENCES bookings(id),
  reviewer_name  TEXT        NOT NULL,
  rating         INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Portfolio: barber work photos, optionally tagged to a hairstyle.
CREATE TABLE barber_portfolio (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id    UUID        NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  image_url    TEXT        NOT NULL,
  caption      TEXT,
  hairstyle_id UUID        REFERENCES hairstyles(id),
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics events: lightweight event log for the barber dashboard metrics.
-- event_type values: 'profile_view' | 'booking_made' | 'search_appeared'
CREATE TABLE analytics_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id  UUID        REFERENCES barbers(id) ON DELETE CASCADE,
  event_type TEXT        NOT NULL,
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- INDEXES
-- =============================================================

-- Geo: GiST index powers ST_DWithin radius search
CREATE INDEX barbers_location_gist_idx        ON barbers USING GIST(location);
CREATE INDEX barbers_active_approved_idx       ON barbers(is_active, is_approved);

-- Bookings: most queries filter by barber + date
CREATE INDEX bookings_barber_date_idx          ON bookings(barber_id, appointment_date);
CREATE INDEX bookings_user_id_idx              ON bookings(user_id);
CREATE INDEX bookings_status_idx               ON bookings(status);
CREATE INDEX bookings_guest_email_idx          ON bookings(guest_email);

-- Prevent double-booking at the DB level (cancelled/no-show slots are freed)
CREATE UNIQUE INDEX bookings_no_double_book_idx
  ON bookings(barber_id, appointment_date, appointment_time)
  WHERE status NOT IN ('cancelled', 'no_show');

CREATE INDEX services_barber_active_idx        ON services(barber_id, is_active);

CREATE INDEX reviews_barber_id_idx             ON reviews(barber_id);

-- GIN indexes for array containment queries (@> operator)
CREATE INDEX hairstyles_face_shapes_gin_idx    ON hairstyles USING GIN(face_shapes);
CREATE INDEX hairstyles_tags_gin_idx           ON hairstyles USING GIN(tags);

CREATE INDEX barber_hairstyles_hairstyle_idx   ON barber_hairstyles(hairstyle_id);

CREATE INDEX portfolio_barber_sort_idx         ON barber_portfolio(barber_id, sort_order);

CREATE INDEX analytics_barber_type_date_idx    ON analytics_events(barber_id, event_type, created_at);

-- Login lookup
CREATE INDEX users_email_idx                   ON users(email);


-- =============================================================
-- TRIGGERS
-- =============================================================

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_barbers_updated_at
  BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Rating aggregation — fires on any review change
CREATE TRIGGER trg_rating_on_insert
  AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION refresh_barber_rating();

CREATE TRIGGER trg_rating_on_update
  AFTER UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION refresh_barber_rating();

CREATE TRIGGER trg_rating_on_delete
  AFTER DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION refresh_barber_rating();


-- =============================================================
-- SEED: HAIRSTYLE CATALOGUE
--
-- 15 styles covering the full Afro/Black hair spectrum
-- and all six face shapes used by the AI matching engine.
--
-- image_url values reference Supabase Storage paths.
-- After running this schema, create a public bucket called 'assets'
-- and upload one image per slug to: assets/hairstyles/<slug>.jpg
-- Then update image_url to the full public URL for each row,
-- or construct it in code: ${SUPABASE_URL}/storage/v1/object/public/assets/hairstyles/<slug>.jpg
-- =============================================================

INSERT INTO hairstyles (name, slug, description, image_url, face_shapes, tags) VALUES

('High Top Fade',
 'high-top-fade',
 'A bold silhouette with tapered sides and a flat, squared-off top. Height that commands presence.',
 'hairstyles/high-top-fade.jpg',
 ARRAY['oval','round','oblong'],
 ARRAY['fade','classic','volume','structured','retro']),

('Low Skin Fade',
 'low-skin-fade',
 'Skin-tight at the sides, graduating seamlessly into whatever you carry on top. The most versatile fade.',
 'hairstyles/low-skin-fade.jpg',
 ARRAY['oval','round','square','heart','oblong','diamond'],
 ARRAY['fade','skin','clean','versatile','modern']),

('Mid Fade with 360 Waves',
 'mid-fade-waves',
 '360 waves flowing from a crisp mid-fade — a look that rewards dedication and discipline.',
 'hairstyles/mid-fade-waves.jpg',
 ARRAY['oval','round','square','oblong'],
 ARRAY['fade','waves','360','textured','sleek']),

('Full Afro',
 'full-afro',
 'Natural, proud, and full of personality. The Afro is a statement that needs no introduction.',
 'hairstyles/full-afro.jpg',
 ARRAY['oval','heart','diamond','square'],
 ARRAY['natural','afro','volume','curly','bold']),

('Twist Out',
 'twist-out',
 'Defined spiral twists that give texture and personality — intentional but lived-in.',
 'hairstyles/twist-out.jpg',
 ARRAY['oval','square','heart','diamond'],
 ARRAY['natural','twists','textured','curly','definition']),

('Mohawk Fade',
 'mohawk-fade',
 'A strip of height running centre-crown to nape, faded clean at the sides. Bold but refined.',
 'hairstyles/mohawk-fade.jpg',
 ARRAY['oval','oblong','diamond'],
 ARRAY['fade','mohawk','bold','structured','edge']),

('Starter Locs',
 'starter-locs',
 'The beginning of a locs journey — neatly started sections with a clean, intentional look from day one.',
 'hairstyles/starter-locs.jpg',
 ARRAY['oval','round','square','heart'],
 ARRAY['locs','dreads','natural','commitment','protective']),

('Caesar with Taper',
 'caesar-taper',
 'Short, even, and forward-brushed with a soft taper at the edges. Understated and consistently sharp.',
 'hairstyles/caesar-taper.jpg',
 ARRAY['round','oval','square'],
 ARRAY['taper','caesar','short','clean','classic']),

('Line Up / Edge Up',
 'line-up',
 'Geometric lines carved at the hairline that turn any base style into something precision-crafted.',
 'hairstyles/line-up.jpg',
 ARRAY['oval','oblong','square'],
 ARRAY['lineup','edge','geometric','precision','sharp']),

('Burst Fade',
 'burst-fade',
 'A curved fade that fans out behind the ear — a distinctive, sculptural shape that sets you apart.',
 'hairstyles/burst-fade.jpg',
 ARRAY['oval','heart','round'],
 ARRAY['fade','burst','curved','modern','artistic']),

('Taper Fade',
 'taper-fade',
 'The evergreen. A gradual taper from crown to neckline that works with almost any texture or length.',
 'hairstyles/taper-fade.jpg',
 ARRAY['oval','square','oblong','diamond'],
 ARRAY['fade','taper','versatile','classic','clean']),

('Temple Fade',
 'temple-fade',
 'A tight fade focusing on the temples and around the ears — adds precision without going full skin.',
 'hairstyles/temple-fade.jpg',
 ARRAY['oval','round','square','heart'],
 ARRAY['fade','temple','neat','subtle','precise']),

('Freeform Locs',
 'freeform-locs',
 'Mature, free-growing locs that coil naturally — a look built by time and worn with ease.',
 'hairstyles/freeform-locs.jpg',
 ARRAY['oval','round','heart','diamond'],
 ARRAY['locs','dreads','freeform','natural','mature']),

('Cornrows (Straight Back)',
 'cornrows-straight-back',
 'Neat, protective braids running straight from the hairline to the nape. Timeless and practical.',
 'hairstyles/cornrows-straight-back.jpg',
 ARRAY['oval','oblong','heart','diamond'],
 ARRAY['braids','cornrows','protective','neat','traditional']),

('Drop Fade with Curl Top',
 'drop-fade-curl-top',
 'A low arc fade that drops behind the ear, leaving natural curl texture on top. Relaxed authority.',
 'hairstyles/drop-fade-curl-top.jpg',
 ARRAY['oval','round','heart','square'],
 ARRAY['fade','drop','curly','natural','modern']);


-- =============================================================
-- END OF SCHEMA
-- Total tables: 10 | Indexes: 17 | Triggers: 7 | Seed rows: 15
-- =============================================================

-- =============================================================
-- MIGRATION: dropping inventory from an existing database
-- Inventory was removed from the product — run this once against
-- any Supabase project that was set up before this change.
-- =============================================================
-- DROP TABLE IF EXISTS inventory;
