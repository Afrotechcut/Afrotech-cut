import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AFROTECHCUTS — Find Your Barber';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 30 }}>
          <div
            style={{
              width: 90,
              height: 90,
              background: '#0b0f17',
              border: '2px solid #dea030',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dea030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="2.4" />
              <circle cx="6" cy="18" r="2.4" />
              <line x1="7.8" y1="7.6" x2="20" y2="19" />
              <line x1="7.8" y1="16.4" x2="20" y2="5" />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, color: '#ffffff', letterSpacing: -1 }}>
            AFROTECHCUTS
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 32, color: '#dea030', fontWeight: 600 }}>
          Find Your Barber
        </div>
        <div style={{ display: 'flex', fontSize: 23, color: '#9ca3af', marginTop: 18, maxWidth: 800, textAlign: 'center' }}>
          Discover top barbers near you, see their work, and book in seconds.
        </div>
      </div>
    ),
    { ...size },
  );
}
