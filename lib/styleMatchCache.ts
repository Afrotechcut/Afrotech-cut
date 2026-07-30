'use client';
import type { StyleRecommendation } from '@/types';

// Persists the last AI style-match result (photo + picks + generated images) in the
// browser's IndexedDB, so a page refresh restores it instead of paying for a fresh
// OpenAI vision + image-edit run. Nothing here ever leaves the browser — this is not
// server storage, just a local cache with a TTL. IndexedDB (not localStorage) because
// the generated images are multi-megabyte base64 strings that can exceed localStorage's
// ~5-10MB quota.
//
// The photo is stored as a base64 data URL string, not a Blob/File object. Safari has a
// long history of silently failing (or corrupting) structured-clone of Blobs in
// IndexedDB — storing plain strings sidesteps that entirely and works identically across
// all browsers.

const DB_NAME = 'afrotechcuts-style-match';
const STORE_NAME = 'results';
const CACHE_KEY = 'latest';
const DB_VERSION = 1;

// "For some time" — long enough to survive an accidental refresh or a browser restart
// later the same day, short enough that it doesn't quietly serve week-old results.
export const STYLE_MATCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface CachedGeneration {
  status: 'done' | 'error';
  image?: string;
}

export interface CachedStyleMatch {
  savedAt: number;
  photoDataUrl: string;
  recommendations: StyleRecommendation[];
  generations: CachedGeneration[];
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const blob = await fetch(dataUrl).then((r) => r.blob());
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveStyleMatchCache(entry: Omit<CachedStyleMatch, 'savedAt'>): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ ...entry, savedAt: Date.now() }, CACHE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Best-effort — if IndexedDB is unavailable (private browsing, storage full,
    // unsupported browser), just skip caching rather than breaking the page. Logged
    // (not silent) so a real failure is diagnosable instead of looking like "it just
    // didn't work".
    console.warn('style-match cache: save failed', err);
  }
}

export async function loadStyleMatchCache(): Promise<CachedStyleMatch | null> {
  try {
    const db = await openDb();
    const entry = await new Promise<CachedStyleMatch | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(CACHE_KEY);
      req.onsuccess = () => resolve(req.result as CachedStyleMatch | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!entry) return null;
    if (Date.now() - entry.savedAt > STYLE_MATCH_CACHE_TTL_MS) {
      await clearStyleMatchCache();
      return null;
    }
    return entry;
  } catch (err) {
    console.warn('style-match cache: load failed', err);
    return null;
  }
}

export async function clearStyleMatchCache(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(CACHE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}
