import React from 'react';

interface LiquidLogoProps {
  className?: string;
  size?: number;
  opacity?: number;
}

export const LiquidLogo: React.FC<LiquidLogoProps> = ({ className = "", size = 32, opacity = 1 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
    >
      <defs>
        <linearGradient id="liquidBrandGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" /> {/* cyan-400 */}
          <stop offset="1" stopColor="#3b82f6" /> {/* blue-500 */}
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* The Pound/L Shape */}
      {/* Top hook and down stroke */}
      <path 
        d="M 70 28 C 65 15, 40 15, 38 35 C 36 50, 36 60, 36 80 L 80 80" 
        stroke="url(#liquidBrandGradient)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* The Crossbar */}
      <path 
        d="M 24 52 L 60 52" 
        stroke="url(#liquidBrandGradient)" 
        strokeWidth="10" 
        strokeLinecap="round"
      />
      
      {/* Optional Dot for modern feel */}
      <circle cx="82" cy="28" r="6" fill="#22d3ee" fillOpacity="0.8" />
    </svg>
  );
};