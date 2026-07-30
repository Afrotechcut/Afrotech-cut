import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(pence: number): string {
  return `£${pence.toFixed(2)}`;
}

export function starArray(rating: number): (0 | 0.5 | 1)[] {
  return [1, 2, 3, 4, 5].map((n) => {
    if (rating >= n) return 1;
    if (rating >= n - 0.5) return 0.5;
    return 0;
  });
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// Convert a PostGIS geography point from the DB into {lat, lng}
export function parsePoint(wkt: string): { lat: number; lng: number } | null {
  const match = wkt.match(/POINT\(([^ ]+) ([^ )]+)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

export function buildStorageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

// Resolves any asset reference to a usable URL: a full URL or a root-relative
// path (e.g. a static file under /public) is used as-is; anything else is
// treated as a path inside the given Supabase Storage bucket. Used for hair
// type swatches so seed data can point at local generated graphics while still
// allowing a real photo to be swapped in later via Storage, unchanged callers.
export function resolveAssetUrl(bucket: string, path: string): string {
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return buildStorageUrl(bucket, path);
}

// Return day name from 0-indexed day_of_week (0=Sunday)
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
