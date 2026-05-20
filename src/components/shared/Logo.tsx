import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function Logo({ className = "h-20 w-auto", showText = true, variant = 'light' }: LogoProps) {
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
      <svg 
        viewBox="0 0 2100 840" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Roof Chevron - Scaled 3x */}
        <path 
          d="M780 135L1050 45L1320 135" 
          stroke={cyan} 
          strokeWidth="48" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* PROPPOST Text Group - Scaled 3x */}
        <g transform="translate(60, 315)">
          <g style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            <text x="0" y="195" fill="none" stroke={textColor} strokeWidth="9" fontSize="330" fontWeight="700" letterSpacing="0.02em">P</text>
            <text x="255" y="195" fill="none" stroke={textColor} strokeWidth="9" fontSize="330" fontWeight="700" letterSpacing="0.02em">R</text>
            
            {/* The Icon O - Scaled 3x */}
            <g transform="translate(555, -45)">
              <circle cx="126" cy="135" r="120" stroke={textColor} strokeWidth="7.5" opacity="0.15" />
              <path 
                d="M126 15C192.274 15 246 68.7258 246 135" 
                stroke={cyan} 
                strokeWidth="48" 
                strokeLinecap="round" 
              />
              <circle cx="126" cy="135" r="90" fill={cyan} opacity="0.1" />
            </g>
            
            <text x="870" y="195" fill="none" stroke={textColor} strokeWidth="9" fontSize="330" fontWeight="700" letterSpacing="0.02em">P</text>
            <text x="1125" y="195" fill="none" stroke={textColor} strokeWidth="9" fontSize="330" fontWeight="700" letterSpacing="0.02em">P</text>
            <text x="1380" y="195" fill="none" stroke={textColor} strokeWidth="9" fontSize="330" fontWeight="700" letterSpacing="0.02em">O</text>
            <text x="1650" y="195" fill="none" stroke={textColor} strokeWidth="9" fontSize="330" fontWeight="700" letterSpacing="0.02em">S</text>
            <text x="1905" y="195" fill="none" stroke={textColor} strokeWidth="9" fontSize="330" fontWeight="700" letterSpacing="0.02em">T</text>
            
            {/* TM symbol */}
            <text x="2190" y="30" fill={textColor} fontSize="72" fontWeight="800" opacity="0.4" stroke="none">TM</text>
          </g>
        </g>
        
        {/* Tagline - Scaled 3x */}
        <text 
          x="1095" y="735" 
          textAnchor="middle" 
          fill={cyan} 
          fontSize="144" 
          fontWeight="600" 
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          letterSpacing="0.06em"
        >
          Real Estate Marketing
        </text>
      </svg>
    </div>
  );
}
