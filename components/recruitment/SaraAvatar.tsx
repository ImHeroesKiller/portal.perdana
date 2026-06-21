import React from 'react';

const SIZES = { sm: 32, md: 44, lg: 56 } as const;

export function SaraAvatar({
  size = 'md',
  className = '',
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const dim = SIZES[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#003087] via-blue-700 to-cyan-500 shadow-md ring-2 ring-white ${className}`}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label="Sara">
        <defs>
          <linearGradient id="saraSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d0b5" />
            <stop offset="100%" stopColor="#e8b896" />
          </linearGradient>
          <linearGradient id="saraHair" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#003087" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#saraHair)" opacity="0.15" />
        <ellipse cx="32" cy="38" rx="18" ry="20" fill="url(#saraSkin)" />
        <path
          d="M14 28c2-10 10-16 18-16s16 6 18 16c-6-4-12-6-18-6s-12 2-18 6z"
          fill="url(#saraHair)"
        />
        <ellipse cx="24" cy="36" rx="2.2" ry="2.8" fill="#2d3748" />
        <ellipse cx="40" cy="36" rx="2.2" ry="2.8" fill="#2d3748" />
        <path d="M26 44q6 5 12 0" stroke="#c97b5a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <ellipse cx="20" cy="40" rx="3" ry="2" fill="#f0a898" opacity="0.45" />
        <ellipse cx="44" cy="40" rx="3" ry="2" fill="#f0a898" opacity="0.45" />
        <path d="M22 52h20" stroke="#003087" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      </svg>
    </div>
  );
}