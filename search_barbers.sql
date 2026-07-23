-- Run this in Supabase SQL Editor AFTER running schema.sql
-- This creates the stored procedure used by /api/barbers

CREATE OR REPLACE FUNCTION search_barbers(
  p_lat         FLOAT,
  p_lng         FLOAT,
  p_radius      FLOAT,
  p_min_price   FLOAT DEFAULT NULL,
  p_max_price   FLOAT DEFAULT NULL,
  p_min_rating  FLOAT DEFAULT NULL,
  p_hairstyle_id UUID  DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  shop_name       TEXT,
  bio             TEXT,
  address         TEXT,
  city            TEXT,
  postcode        TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  cover_image_url TEXT,
  rating          NUMERIC,
  review_count    INTEGER,
  is_approved     BOOLEAN,
  is_active       BOOLEAN,
  lat             FLOAT,
  lng             FLOAT,
  distance_metres FLOAT,
  min_price       NUMERIC
)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT ON (b.id)
    b.id,
    b.shop_name,
    b.bio,
    b.address,
    b.city,
    b.postcode,
    b.phone,
    b.avatar_url,
    b.cover_image_url,
    b.rating,
    b.review_count,
    b.is_approved,
    b.is_active,
    ST_Y(b.location::geometry)                                          AS lat,
    ST_X(b.location::geometry)                                          AS lng,
    ST_Distance(b.location, ST_MakePoint(p_lng, p_lat)::geography)     AS distance_metres,
    MIN(s.price) OVER (PARTITION BY b.id)                               AS min_price
  FROM barbers b
  LEFT JOIN services s ON s.barber_id = b.id AND s.is_active = TRUE
  LEFT JOIN barber_hairstyles bh ON bh.barber_id = b.id
  WHERE
    b.is_active   = TRUE
    AND b.is_approved = TRUE
    AND ST_DWithin(b.location, ST_MakePoint(p_lng, p_lat)::geography, p_radius)
    AND (p_min_price   IS NULL OR s.price >= p_min_price)
    AND (p_max_price   IS NULL OR s.price <= p_max_price)
    AND (p_min_rating  IS NULL OR b.rating >= p_min_rating)
    AND (p_hairstyle_id IS NULL OR bh.hairstyle_id = p_hairstyle_id)
  ORDER BY b.id, distance_metres
$$;
