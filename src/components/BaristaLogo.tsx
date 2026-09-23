import React from 'react';

interface BaristaLogoProps {
  className?: string;
  size?: number;
}

export const BaristaLogo: React.FC<BaristaLogoProps> = ({ className = 'w-9 h-9', size }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full shadow-md overflow-hidden bg-[#1c110b] border border-amber-600/60 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full p-1"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="logoBgGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#2c1a11" />
            <stop offset="100%" stopColor="#120a06" />
          </radialGradient>
          <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Circular Dark Badge Background */}
        <circle cx="50" cy="50" r="48" fill="url(#logoBgGrad)" stroke="url(#logoGoldGrad)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#d97706" strokeWidth="0.75" strokeDasharray="2,2" opacity="0.6" />

        {/* Coffee Swirl & Bean Silhouette (Barista Signature) */}
        <path 
          d="M 50 20 C 35 20, 24 31, 24 46 C 24 64, 38 78, 50 80 C 47 70, 48 58, 53 50 C 58 42, 67 36, 68 28 C 65 23, 58 20, 50 20 Z" 
          fill="url(#logoGoldGrad)" 
        />
        <path 
          d="M 50 80 C 65 80, 76 69, 76 54 C 76 36, 62 22, 50 20 C 53 30, 52 42, 47 50 C 42 58, 33 64, 32 72 C 35 77, 42 80, 50 80 Z" 
          fill="#fbbf24" 
          opacity="0.9" 
        />
        
        {/* Central S-Curve Crema Stream */}
        <path 
          d="M 49 23 C 51 35, 43 45, 45 57 C 47 67, 53 74, 51 77" 
          stroke="#120a06" 
          strokeWidth="3.2" 
          strokeLinecap="round" 
        />
      </svg>
    </div>
  );
};
