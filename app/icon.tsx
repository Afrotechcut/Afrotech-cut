import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111827',
          borderRadius: 7,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dea030" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="2.4" />
          <circle cx="6" cy="18" r="2.4" />
          <line x1="7.8" y1="7.6" x2="20" y2="19" />
          <line x1="7.8" y1="16.4" x2="20" y2="5" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
