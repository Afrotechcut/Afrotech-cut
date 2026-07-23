'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Barber } from '@/types';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
// streets-v2 gives a clean, modern light style — no account tier restrictions on the free plan
const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

interface BarberMapProps {
  barbers: Barber[];
  center: [number, number]; // [lng, lat]
  radius: number;           // metres
  selectedId?: string;
  onSelectBarber: (id: string) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function toGeoJSON(barbers: Barber[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: barbers
      .filter((b) => (b as any).lat != null && (b as any).lng != null)
      .map((b) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [(b as any).lng as number, (b as any).lat as number],
        },
        properties: {
          id: b.id,
          shop_name: b.shop_name,
          city: b.city,
          rating: b.rating,
        },
      })),
  };
}

function circleGeoJSON(lng: number, lat: number, radiusM: number): GeoJSON.Feature {
  const pts = 64;
  const R = 6371000;
  const coords: [number, number][] = [];
  for (let i = 0; i <= pts; i++) {
    const angle = (i * 2 * Math.PI) / pts;
    const dLat = (radiusM / R) * Math.cos(angle) * (180 / Math.PI);
    const dLng = ((radiusM / R) * Math.sin(angle) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180);
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

function radiusToZoom(m: number): number {
  return m <= 1000 ? 14 : m <= 2000 ? 13 : 12;
}

// ── component ────────────────────────────────────────────────────────────────

export default function BarberMap({ barbers, center, radius, selectedId, onSelectBarber }: BarberMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<maplibregl.Map | null>(null);
  const loadedRef   = useRef(false);
  const popupRef    = useRef<maplibregl.Popup | null>(null);

  // Keep the callback in a ref so closures in event handlers never go stale
  const onSelectRef = useRef(onSelectBarber);
  useEffect(() => { onSelectRef.current = onSelectBarber; }, [onSelectBarber]);

  // Also keep the latest props in refs so the load handler can pick them up
  // if barbers / selectedId / center / radius changed while tiles were loading
  const latestBarbersRef    = useRef(barbers);
  const latestSelectedRef   = useRef(selectedId);
  const latestCenterRef     = useRef(center);
  const latestRadiusRef     = useRef(radius);
  useEffect(() => { latestBarbersRef.current  = barbers;    }, [barbers]);
  useEffect(() => { latestSelectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { latestCenterRef.current   = center;     }, [center]);
  useEffect(() => { latestRadiusRef.current   = radius;     }, [radius]);

  // ── init (runs once on mount) ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center,
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      loadedRef.current = true;

      // Use the latest prop values (may have changed while tiles were fetching)
      const c  = latestCenterRef.current;
      const r  = latestRadiusRef.current;
      const bs = latestBarbersRef.current;
      const si = latestSelectedRef.current;

      // ── radius circle ──
      map.addSource('radius', {
        type: 'geojson',
        data: circleGeoJSON(c[0], c[1], r),
      });
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius',
        paint: { 'fill-color': '#111827', 'fill-opacity': 0.05 },
      });
      map.addLayer({
        id: 'radius-line',
        type: 'line',
        source: 'radius',
        paint: { 'line-color': '#111827', 'line-width': 1.5, 'line-opacity': 0.2, 'line-dasharray': [3, 3] },
      });

      // ── barbers (clustered GeoJSON source) ──
      map.addSource('barbers', {
        type: 'geojson',
        data: toGeoJSON(bs),
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      });

      // Cluster bubble
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'barbers',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#111827',
          // Grow with point count: ≤5 → 18px, ≤20 → 24px, more → 30px
          'circle-radius': ['step', ['get', 'point_count'], 18, 5, 24, 20, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Cluster count label
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'barbers',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual barber pin — gold when selected, dark otherwise
      map.addLayer({
        id: 'barbers-pin',
        type: 'circle',
        source: 'barbers',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'id'], si ?? ''],
            '#c98518',  // brand gold — selected
            '#111827',  // near-black  — default
          ],
          'circle-radius': 10,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      // ── interactions ──

      // Click cluster → zoom in to expand it
      map.on('click', 'clusters', (e) => {
        const [feature] = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!feature) return;
        const source = map.getSource('barbers') as maplibregl.GeoJSONSource;
        const clusterId = feature.properties?.cluster_id as number;
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          map.easeTo({ center: coords, zoom: zoom + 0.5, duration: 400 });
        });
      });

      // Click individual pin → show popup, fire callback
      map.on('click', 'barbers-pin', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const p = feature.properties as { id: string; shop_name: string; city: string; rating: number };
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: '220px' })
          .setLngLat([lng, lat])
          .setHTML(`
            <div style="font-family:Inter,system-ui,sans-serif;padding:4px 0">
              <p style="font-weight:600;font-size:13px;color:#111827;margin:0 0 2px">${p.shop_name}</p>
              <p style="font-size:12px;color:#6b7280;margin:0 0 4px">${p.city}</p>
              <p style="font-size:12px;color:#c98518;font-weight:600;margin:0">${Number(p.rating) > 0 ? `${Number(p.rating).toFixed(1)} stars` : 'New barber'}</p>
            </div>
          `)
          .addTo(map);

        onSelectRef.current(p.id);
      });

      // Pointer cursor on hover
      for (const layer of ['clusters', 'barbers-pin']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── sync helpers (safe to call before load — each uses map.once as fallback) ──

  // Update barbers GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      (map.getSource('barbers') as maplibregl.GeoJSONSource | undefined)?.setData(toGeoJSON(barbers));
    };
    if (loadedRef.current) apply(); else map.once('load', apply);
  }, [barbers]);

  // Update selected-pin highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer('barbers-pin')) return;
      map.setPaintProperty('barbers-pin', 'circle-color', [
        'case',
        ['==', ['get', 'id'], selectedId ?? ''],
        '#c98518',
        '#111827',
      ]);
    };
    if (loadedRef.current) apply(); else map.once('load', apply);
  }, [selectedId]);

  // Fly to new center + update radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      map.flyTo({ center, zoom: radiusToZoom(radius), duration: 600 });
      (map.getSource('radius') as maplibregl.GeoJSONSource | undefined)
        ?.setData(circleGeoJSON(center[0], center[1], radius));
    };
    if (loadedRef.current) apply(); else map.once('load', apply);
  }, [center, radius]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />;
}
