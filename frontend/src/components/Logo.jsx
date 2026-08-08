import React from "react";

/**
 * Custom "K" logo for Haryana Enterprises (Kagdana).
 * - Circular badge with a subtle gradient (emerald → amber)
 * - Stylised "K" mark whose top arm is a sun ray + rays around
 * - Solar panel bar at the base
 * - Works on any dark or light background
 *
 * Props:
 *  - size: number (px) — outer dimension, default 40
 *  - className: extra classes for the wrapper
 */
const Logo = ({ size = 40, className = "" }) => {
  const id = React.useId(); // unique gradient ids for multiple instances
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Haryana Enterprises logo"
      className={className}
      data-testid="brand-logo"
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="55%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id={`k-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <radialGradient id={`sun-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="1" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer badge */}
      <circle cx="32" cy="32" r="30" fill={`url(#bg-${id})`} stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="28.5" fill="none" stroke="rgba(52,211,153,0.35)" strokeWidth="0.6" />

      {/* Sun glow behind K */}
      <circle cx="44" cy="22" r="12" fill={`url(#sun-${id})`} />

      {/* Sun rays around the top-right */}
      <g stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
        <line x1="44" y1="8"  x2="44" y2="12" />
        <line x1="55" y1="12" x2="52" y2="15" />
        <line x1="60" y1="22" x2="56" y2="22" />
        <line x1="55" y1="32" x2="52" y2="29" />
        <line x1="33" y1="12" x2="36" y2="15" />
      </g>

      {/* Letter K */}
      <g filter={`url(#glow-${id})`}>
        {/* Vertical stem */}
        <rect x="18" y="14" width="6" height="36" rx="2" fill={`url(#k-${id})`} />
        {/* Upper arm — angled from stem toward top-right */}
        <path d="M24 32 L44 14 L48 18 L28 34 Z" fill={`url(#k-${id})`} />
        {/* Lower arm — angled from stem toward bottom-right */}
        <path d="M24 32 L44 50 L48 46 L28 30 Z" fill={`url(#k-${id})`} />
      </g>

      {/* Solar panel bar at bottom */}
      <g transform="translate(14 52)">
        <rect x="0" y="0" width="36" height="6" rx="1.2" fill="#0f172a" stroke="#34d399" strokeWidth="0.8" />
        <line x1="9"  y1="0" x2="9"  y2="6" stroke="#34d399" strokeWidth="0.6" />
        <line x1="18" y1="0" x2="18" y2="6" stroke="#34d399" strokeWidth="0.6" />
        <line x1="27" y1="0" x2="27" y2="6" stroke="#34d399" strokeWidth="0.6" />
      </g>
    </svg>
  );
};

export default Logo;
