'use client';

import React, { useImperativeHandle, useRef, useState } from 'react';

const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308'];
const MAX_SEG = 24;

export type SpinWheelHandle = { spinTo: (winnerLabel: string, pool: string[]) => Promise<void> };

// Roda hanya animasi: pemenang sudah ditentukan backend. Untuk peserta banyak, roda berisi pemenang + sampel acak (visual saja).
export default function SpinWheel({ ref, onClick, disabled, className = 'max-w-[320px]' }: { ref: React.Ref<SpinWheelHandle>; onClick?: () => void; disabled?: boolean; className?: string }) {
  const [labels, setLabels] = useState<string[]>(['?', '?', '?', '?']);
  const [rot, setRot] = useState(0);
  const [ms, setMs] = useState(0);
  const resolver = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    spinTo(winner, pool) {
      const others = pool.filter((x) => x !== winner).sort(() => Math.random() - 0.5).slice(0, MAX_SEG - 1);
      const segs = [...others];
      segs.splice(Math.floor(Math.random() * (segs.length + 1)), 0, winner);
      while (segs.length < 4) segs.push('•');
      const n = segs.length, a = 360 / n, wi = segs.indexOf(winner);
      const jitter = (Math.random() - 0.5) * a * 0.6;
      const target = 360 * 6 + (360 - (wi * a + a / 2)) + jitter;
      setLabels(segs); setMs(0); setRot((r) => r % 360);
      return new Promise<void>((res) => {
        resolver.current = res;
        window.setTimeout(() => { resolver.current?.(); resolver.current = null; }, 7000); // jaga-jaga bila transisi tidak selesai (tab tersembunyi)
        requestAnimationFrame(() => requestAnimationFrame(() => { setMs(5500); setRot(target); }));
      });
    },
  }));

  const n = labels.length, a = 360 / n, R = 150;
  const pt = (deg: number, r = R) => [R + r * Math.sin((deg * Math.PI) / 180), R - r * Math.cos((deg * Math.PI) / 180)];
  return (
    <div className={`relative w-full ${className} aspect-square mx-auto select-none ${onClick && !disabled ? 'cursor-pointer' : ''}`}
      onClick={() => { if (onClick && !disabled) onClick(); }} role={onClick ? 'button' : undefined} aria-label={onClick ? 'Putar roda' : undefined}>
      <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[22px] border-l-transparent border-r-transparent border-t-white drop-shadow" />
      <svg viewBox={`0 0 ${R * 2} ${R * 2}`} className="w-full h-full rounded-full border-4 border-slate-700"
        style={{ transform: `rotate(${rot}deg)`, transition: ms ? `transform ${ms}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : 'none' }}
        onTransitionEnd={() => { resolver.current?.(); resolver.current = null; }}>
        {labels.map((l, i) => {
          const [x1, y1] = pt(i * a), [x2, y2] = pt((i + 1) * a);
          const mid = i * a + a / 2, [tx, ty] = pt(mid, R * 0.62);
          return (
            <g key={i}>
              <path d={`M${R},${R} L${x1},${y1} A${R},${R} 0 0 1 ${x2},${y2} Z`} fill={COLORS[i % COLORS.length]} stroke="#0f172a" strokeWidth="1" />
              <text x={tx} y={ty} fill="#fff" fontSize={n > 14 ? 8 : 11} fontWeight="600" textAnchor="middle" dominantBaseline="middle"
                transform={`rotate(${mid - 90} ${tx} ${ty})`}>{l.length > 14 ? l.slice(0, 13) + '…' : l}</text>
            </g>
          );
        })}
        <circle cx={R} cy={R} r="26" fill="#0f172a" stroke="#f8fafc" strokeWidth="3" />
      </svg>
      {onClick && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="w-[17%] aspect-square rounded-full flex items-center justify-center text-[clamp(8px,1.6vw,14px)] font-black text-white">{disabled ? '…' : 'PUTAR'}</span>
        </div>
      )}
    </div>
  );
}
