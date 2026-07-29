'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import BarberCard from '@/components/barber/BarberCard';
import type { Barber } from '@/types';

const BarberMap = dynamic(() => import('@/components/map/BarberMap'), { ssr: false });

const LONDON_CENTER: [number, number] = [-0.1278, 51.5074];
const RADIUS_OPTIONS = [
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
];

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const [styleFilterCleared, setStyleFilterCleared] = useState(false);
  const hairstyleId = styleFilterCleared ? null : searchParams.get('hairstyleId');

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);
  const [center, setCenter] = useState<[number, number]>(LONDON_CENTER);
  const [radius, setRadius] = useState(2000);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [locationInput, setLocationInput] = useState('');
  const [locating, setLocating] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchBarbers = useCallback(async (lng: number, lat: number, r: number, rating: number | null, price: number | null, styleId: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(r) });
      if (rating) params.set('minRating', String(rating));
      if (price) params.set('maxPrice', String(price));
      if (styleId) params.set('hairstyleId', styleId);
      const res = await fetch(`/api/barbers?${params}`);
      const data = await res.json();
      setBarbers(data.barbers || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBarbers(center[0], center[1], radius, minRating, maxPrice, hairstyleId);
    }, 300);
  }, [center, radius, minRating, maxPrice, hairstyleId, fetchBarbers]);

  const useMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.longitude, pos.coords.latitude]);
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  const handleSelectBarber = (id: string) => {
    setSelectedId(id);
    const el = document.getElementById(`barber-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* LEFT PANEL — filters + results */}
        <div className="w-full sm:w-[380px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          {/* Search / filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && alert('Geocoding: connect to Mapbox Geocoding API with your token.')}
                placeholder="Search location..."
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
                title="Use my location"
              >
                {locating ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                )}
              </button>
            </div>

            {/* Radius */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Search radius</p>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRadius(opt.value)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      radius === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters row */}
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Min. rating</p>
                <select
                  value={minRating ?? ''}
                  onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Any</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="4.5">4.5+</option>
                </select>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Max. price</p>
                <select
                  value={maxPrice ?? ''}
                  onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Any</option>
                  <option value="15">Under £15</option>
                  <option value="25">Under £25</option>
                  <option value="40">Under £40</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {hairstyleId && (
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-gray-600">Showing barbers who offer this cut</span>
                <button onClick={() => setStyleFilterCleared(true)} className="text-xs font-semibold text-gray-500 hover:text-gray-800">
                  Clear
                </button>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <svg className="w-6 h-6 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              </div>
            ) : barbers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">No barbers found in this area.</p>
                <p className="text-gray-400 text-xs mt-1">Try increasing the radius.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 font-medium">{barbers.length} barber{barbers.length !== 1 ? 's' : ''} found</p>
                {barbers.map((barber) => (
                  <div key={barber.id} id={`barber-${barber.id}`}>
                    <BarberCard barber={barber} highlight={selectedId === barber.id} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — map */}
        <div className="hidden sm:flex flex-1 p-3">
          <BarberMap
            barbers={barbers}
            center={center}
            radius={radius}
            selectedId={selectedId}
            onSelectBarber={handleSelectBarber}
          />
        </div>
      </div>
    </>
  );
}
