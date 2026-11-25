'use client';

import { useEffect, useState } from 'react';

export default function FloatingPetals() {
  const [petals, setPetals] = useState<Array<{ 
    id: number, 
    symbol: string, 
    left: string, 
    top: string, 
    duration: string, 
    delay: string, 
    size: string,
    color: string,
    blur: string,
    sway: string
  }>>([]);

  useEffect(() => {
    const symbols = ['✿', '❀', '✾', '❁', '✻', '✧', '❊'];
    const colors = [
      'var(--rose-300)', 
      'var(--rose-400)', 
      'var(--rose-200)', 
      'var(--gold-light)',
      '#fecdd3' // Light rose
    ];
    
    const newPetals = [];
    for (let i = 0; i < 8; i++) {
      const size = (0.6 + Math.random() * 1.2) + 'rem';
      newPetals.push({
        id: i,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        left: Math.random() * 100 + 'vw',
        top: -(10 + Math.random() * 20) + 'vh', // Start above screen
        duration: (12 + Math.random() * 20) + 's',
        delay: -(Math.random() * 30) + 's',
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        blur: Math.random() > 0.7 ? 'blur(1px)' : 'none',
        sway: (10 + Math.random() * 30) + 'px',
      });
    }
    setPetals(newPetals);
  }, []);

  if (petals.length === 0) return null;

  return (
    <div className="petals-canvas" aria-hidden="true">
      {petals.map(p => (
        <div 
          key={p.id} 
          className="petal"
          style={{
            left: p.left,
            top: p.top,
            animationDuration: p.duration,
            animationDelay: p.delay,
            fontSize: p.size,
            color: p.color,
            filter: p.blur,
            '--sway-amount': p.sway,
          } as any}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
}
