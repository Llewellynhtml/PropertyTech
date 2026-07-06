import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
  src?: string;
}

export default function Logo({ className = "h-20 w-auto", showText = true, variant = 'light', src = '/proppost-logo.png' }: LogoProps) {
  const cyan = "#1E97AB"; 
  const textColor = variant === 'light' ? "#FFFFFF" : "#0A0A0B";

  if (!showText) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Roof Chevron */}
          <path 
            d="M20 35L50 15L80 35" 
            stroke={cyan} 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* The Loading O Mark */}
          <g transform="translate(30, 45)">
            <circle cx="20" cy="20" r="18" stroke={textColor} strokeWidth="1.5" opacity="0.2" />
            <path 
              d="M20 2C29.9411 2 38 10.0589 38 20" 
              stroke={cyan} 
              strokeWidth="6" 
              strokeLinecap="round" 
            />
            <circle cx="20" cy="20" r="12" fill={cyan} opacity="0.1" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img
        src={src}
        alt="PropPost Real Estate Marketing"
        className="h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
}
