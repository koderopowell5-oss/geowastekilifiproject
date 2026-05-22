import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (!onComplete) return;
    const t = window.setTimeout(() => {
      setPhase('exit');
      window.setTimeout(onComplete, 600);
    }, 3200);
    return () => window.clearTimeout(t);
  }, [onComplete]);

  return (
    <div style={overlayStyle} data-phase={phase}>
      <style>{css}</style>
      <svg width="130" height="130" viewBox="0 0 180.2 180.2" fill="none" xmlns="http://www.w3.org/2000/svg">

        <path className="ls-arc1-stroke"
          d="M90.1,25.79v21.44c-23.68,0-42.87,19.19-42.87,42.87h-21.44c0-35.52,28.79-64.31,64.31-64.31Z"
          fill="none" stroke="#329d9c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="ls-arc1-fill"
          d="M90.1,25.79v21.44c-23.68,0-42.87,19.19-42.87,42.87h-21.44c0-35.52,28.79-64.31,64.31-64.31Z"
          fill="#329d9c"/>

        <path className="ls-arc2-stroke"
          d="M154.4,90.1c0,5.76-.76,11.35-2.18,16.66-7.34,27.44-32.37,47.65-62.13,47.65v-21.44c17.77,0,33.01-10.81,39.51-26.21h-18.53c-4.91,6.18-12.48,10.13-20.99,10.13s-16.08-3.96-20.99-10.13c-3.63-4.57-5.8-10.35-5.81-16.63-.01-14.59,11.82-26.61,26.4-26.82,14.98-.21,27.18,11.86,27.18,26.79h37.51Z"
          fill="none" stroke="#329d9c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="ls-arc2-fill"
          d="M154.4,90.1c0,5.76-.76,11.35-2.18,16.66-7.34,27.44-32.37,47.65-62.13,47.65v-21.44c17.77,0,33.01-10.81,39.51-26.21h-18.53c-4.91,6.18-12.48,10.13-20.99,10.13s-16.08-3.96-20.99-10.13c-3.63-4.57-5.8-10.35-5.81-16.63-.01-14.59,11.82-26.61,26.4-26.82,14.98-.21,27.18,11.86,27.18,26.79h37.51Z"
          fill="#329d9c"/>

        <g className="ls-ticks">
          <line x1="180.2" y1="90.1" x2="154.4" y2="90.1" stroke="#329d9c" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="25.79" y1="90.1" x2="0"     y2="90.1" stroke="#329d9c" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="90.1"  y1="25.79" x2="90.1"  y2="0"   stroke="#329d9c" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="90.1"  y1="180.2" x2="90.1"  y2="154.4" stroke="#329d9c" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      </svg>
    </div>
  );
}

export const LoadingIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <div style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <style>{css}</style>
    <svg width={size} height={size} viewBox="0 0 180.2 180.2" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path className="ls-arc1-stroke"
        d="M90.1,25.79v21.44c-23.68,0-42.87,19.19-42.87,42.87h-21.44c0-35.52,28.79-64.31,64.31-64.31Z"
        fill="none" stroke="#329d9c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path className="ls-arc1-fill"
        d="M90.1,25.79v21.44c-23.68,0-42.87,19.19-42.87,42.87h-21.44c0-35.52,28.79-64.31,64.31-64.31Z"
        fill="#329d9c"/>
      <path className="ls-arc2-stroke"
        d="M154.4,90.1c0,5.76-.76,11.35-2.18,16.66-7.34,27.44-32.37,47.65-62.13,47.65v-21.44c17.77,0,33.01-10.81,39.51-26.21h-18.53c-4.91,6.18-12.48,10.13-20.99,10.13s-16.08-3.96-20.99-10.13c-3.63-4.57-5.8-10.35-5.81-16.63-.01-14.59,11.82-26.61,26.4-26.82,14.98-.21,27.18,11.86,27.18,26.79h37.51Z"
        fill="none" stroke="#329d9c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path className="ls-arc2-fill"
        d="M154.4,90.1c0,5.76-.76,11.35-2.18,16.66-7.34,27.44-32.37,47.65-62.13,47.65v-21.44c17.77,0,33.01-10.81,39.51-26.21h-18.53c-4.91,6.18-12.48,10.13-20.99,10.13s-16.08-3.96-20.99-10.13c-3.63-4.57-5.8-10.35-5.81-16.63-.01-14.59,11.82-26.61,26.4-26.82,14.98-.21,27.18,11.86,27.18,26.79h37.51Z"
        fill="#329d9c"/>
      <g className="ls-ticks">
        <line x1="180.2" y1="90.1" x2="154.4" y2="90.1" stroke="#329d9c" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="25.79" y1="90.1" x2="0"     y2="90.1" stroke="#329d9c" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="90.1"  y1="25.79" x2="90.1"  y2="0"   stroke="#329d9c" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="90.1"  y1="180.2" x2="90.1"  y2="154.4" stroke="#329d9c" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  </div>
);

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ffffff',
};

const css = `
  @keyframes arc1-draw-reverse {
    0%   { stroke-dashoffset: 600; }
    40%  { stroke-dashoffset: 0;   }
    60%  { stroke-dashoffset: 0;   }
    100% { stroke-dashoffset: 600; }
  }
  @keyframes arc2-draw-reverse {
    0%   { stroke-dashoffset: 700; }
    40%  { stroke-dashoffset: 0;   }
    60%  { stroke-dashoffset: 0;   }
    100% { stroke-dashoffset: 700; }
  }
  @keyframes arc1-fill-loop {
    0%   { opacity: 0; }
    42%  { opacity: 0; }
    52%  { opacity: 1; }
    88%  { opacity: 1; }
    98%  { opacity: 0; }
    100% { opacity: 0; }
  }
  @keyframes arc2-fill-loop {
    0%   { opacity: 0; }
    46%  { opacity: 0; }
    56%  { opacity: 1; }
    88%  { opacity: 1; }
    98%  { opacity: 0; }
    100% { opacity: 0; }
  }
  @keyframes tick-draw-reverse {
    0%   { stroke-dashoffset: 26; }
    40%  { stroke-dashoffset: 0;  }
    60%  { stroke-dashoffset: 0;  }
    100% { stroke-dashoffset: 26; }
  }

  .ls-arc1-stroke {
    stroke-dasharray: 600;
    stroke-dashoffset: 600;
    animation: arc1-draw-reverse 3.2s cubic-bezier(0.4,0,0.2,1) infinite;
  }
  .ls-arc2-stroke {
    stroke-dasharray: 700;
    stroke-dashoffset: 700;
    animation: arc2-draw-reverse 3.2s cubic-bezier(0.4,0,0.2,1) 0.18s infinite;
  }
  .ls-arc1-fill {
    opacity: 0;
    animation: arc1-fill-loop 3.2s ease-in-out infinite;
  }
  .ls-arc2-fill {
    opacity: 0;
    animation: arc2-fill-loop 3.2s ease-in-out 0.18s infinite;
  }

  .ls-ticks line { stroke-dasharray: 26; stroke-dashoffset: 26; }
  .ls-ticks line:nth-child(1) { animation: tick-draw-reverse 3.2s ease-in-out 0.05s infinite; }
  .ls-ticks line:nth-child(2) { animation: tick-draw-reverse 3.2s ease-in-out 0.10s infinite; }
  .ls-ticks line:nth-child(3) { animation: tick-draw-reverse 3.2s ease-in-out 0.15s infinite; }
  .ls-ticks line:nth-child(4) { animation: tick-draw-reverse 3.2s ease-in-out 0.20s infinite; }

  [data-phase="exit"] { animation: ls-fade-out 0.6s ease-in forwards; }
  @keyframes ls-fade-out { to { opacity: 0; pointer-events: none; } }
`;

export default LoadingScreen;