import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

// Icon component
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
          background: 'transparent',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle with Croatian Red */}
          <circle cx="50" cy="50" r="48" fill="#E03131" />

          {/* White Circle for contrast */}
          <circle cx="50" cy="50" r="42" fill="white" />

          {/* Stylized "S" with Croatian pleter-inspired curves */}
          <path
            d="M 35 30 Q 28 30 28 37 Q 28 42 33 44 L 55 52 Q 62 54 62 60 Q 62 66 55 66 L 40 66 Q 35 66 35 61"
            stroke="#E03131"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Top decorative pleter knot */}
          <circle cx="35" cy="30" r="4" fill="#0066CC" />

          {/* Bottom decorative pleter knot */}
          <circle cx="35" cy="61" r="4" fill="#0066CC" />

          {/* Small accent dots (pleter pattern) */}
          <circle cx="68" cy="35" r="2.5" fill="#0066CC" opacity="0.6" />
          <circle cx="72" cy="45" r="2.5" fill="#0066CC" opacity="0.6" />
          <circle cx="68" cy="55" r="2.5" fill="#0066CC" opacity="0.6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
