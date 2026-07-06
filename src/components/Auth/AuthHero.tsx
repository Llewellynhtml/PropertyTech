import React from 'react';
import Logo from '../shared/Logo';

interface AuthHeroProps {
  tagline?: string;
  testimonial?: {
    name: string;
    quote: string;
  };
}

const PremiumHouse = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 21h18" />
    <path d="M5 21V8l7-4 7 4v13" />
    <path d="M10 21v-7h4v7" />
    <rect x="7" y="11" width="2" height="2" />
    <rect x="15" y="11" width="2" height="2" />
    <path d="M11 7h2" />
    <path d="M17 5v2" />
  </svg>
);

export default function AuthHero({ 
  tagline = "Your listings. Your brand. Everywhere.",
  testimonial = {
    name: "Sarah Jenkins",
    quote: "PropPost has completely transformed how our agency handles social media. Our brand consistency has never been better."
  }
}: AuthHeroProps) {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-brand-charcoal relative overflow-hidden p-12 text-white h-full">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-teal/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-teal-deep/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>
      
      {/* Logo */}
      <div className="relative z-10">
        <Logo className="h-40 w-full max-w-lg" variant="light" />
      </div>

      {/* Center Content */}
      <div className="relative z-10 max-w-md">
        <h1 className="text-6xl font-display font-bold leading-[1.1] tracking-tight mb-8">
          {tagline.split('.').map((part, i) => (
            <span key={i} className="block">{part}{i < tagline.split('.').length - 1 ? '.' : ''}</span>
          ))}
        </h1>
        <p className="text-brand-muted-light/60 text-lg font-medium leading-relaxed">
          The all-in-one marketing engine for South African real estate professionals.
        </p>
      </div>

      {/* Testimonial Card */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] max-w-md">
        <p className="text-white/90 font-medium leading-relaxed mb-6 italic">
          "{testimonial.quote}"
        </p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-teal/20 border border-brand-teal/30 flex items-center justify-center font-bold text-brand-teal">
            {testimonial.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-white">{testimonial.name}</p>
            <p className="text-xs text-brand-muted-light uppercase tracking-widest font-bold">Top Producer @ GroupTen</p>
          </div>
        </div>
      </div>
    </div>
  );
}
