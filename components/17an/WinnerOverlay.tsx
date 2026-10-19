'use client';

import React, { useEffect, useRef } from 'react';

const NEON = ['#ff2bd6', '#00e5ff', '#39ff14', '#ffea00', '#ff9100', '#b388ff', '#ff4081', '#76ff03'];

type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; kind: 'spark' | 'confetti'; rot: number; vr: number };

// Efek "duar": ledakan kembang api neon + hujan confetti di atas kanvas layar penuh.
function useFireworks(ref: React.RefObject<HTMLCanvasElement | null>, runKey: number | null) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || runKey === null) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ps: P[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const burst = (cx: number, cy: number, n: number) => {
      const color = NEON[Math.floor(Math.random() * NEON.length)];
      for (let i = 0; i < n; i++) {
        const a = rnd(0, Math.PI * 2), sp = rnd(2, 13);
        ps.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(55, 110), size: rnd(1.6, 3.4), color: Math.random() < 0.25 ? '#ffffff' : color, kind: 'spark', rot: 0, vr: 0 });
      }
    };
    const rain = (n: number) => {
      for (let i = 0; i < n; i++) ps.push({ x: rnd(0, W), y: rnd(-H * 0.4, -10), vx: rnd(-1.2, 1.2), vy: rnd(2, 5.5), life: 0, max: rnd(160, 260), size: rnd(6, 12), color: NEON[Math.floor(Math.random() * NEON.length)], kind: 'confetti', rot: rnd(0, 6.28), vr: rnd(-0.2, 0.2) });
    };
    const scale = reduce ? 0.25 : 1;
    const shots: [number, number, number][] = [[0.2, 0.35, 0], [0.5, 0.22, 120], [0.8, 0.35, 260], [0.35, 0.5, 520], [0.65, 0.45, 760], [0.5, 0.3, 1100]];
    const start = performance.now();
    let fired = 0, raf = 0, rained = false;
    const frame = (now: number) => {
      const t = now - start;
      while (fired < shots.length && t >= shots[fired][2]) { burst(shots[fired][0] * W, shots[fired][1] * H, Math.round(90 * scale)); fired++; }
      if (!rained) { rain(Math.round(140 * scale)); rained = true; }
      ctx.clearRect(0, 0, W, H);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life++;
        if (p.kind === 'spark') { p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.14; } else { p.vy = Math.min(p.vy + 0.02, 6); p.rot += p.vr; p.vx += Math.sin(p.life / 14) * 0.03; }
        p.x += p.vx; p.y += p.vy;
        const k = 1 - p.life / p.max;
        if (k <= 0 || p.y > H + 30) { ps.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, Math.min(1, k * 1.6));
        ctx.fillStyle = ctx.strokeStyle = p.color;
        if (p.kind === 'spark') {
          ctx.shadowColor = p.color; ctx.shadowBlur = 10;
          ctx.lineWidth = p.size; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8); ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      if (ps.length || fired < shots.length) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ref, runKey]);
}

// Layar penuh "SELAMAT!" untuk pemenang undian. Klik di mana saja untuk menutup.
export default function WinnerOverlay({ win, ms, onClose }: { win: { id: number; prize: string; name: string; alamat?: string } | null; ms: number; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useFireworks(canvas, win ? win.id : null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  const winId = win?.id;
  useEffect(() => {
    if (winId === undefined) return;
    const t = window.setTimeout(() => closeRef.current(), ms); // pewaktu tidak diulang saat komponen induk render ulang
    return () => window.clearTimeout(t);
  }, [winId, ms]);
  if (!win) return null;
  // ukuran huruf menyesuaikan panjang nama agar selalu muat selebar layar
  const chars = Math.max(6, win.name.length);
  const size = `clamp(2.6rem, calc(168vw / ${chars}), 15rem)`;
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center text-center px-[4vw] cursor-pointer select-none overflow-hidden tw-win-bg" onClick={onClose} role="dialog" aria-label="Pemenang">
      <style>{`
        @keyframes tw-win-in{0%{opacity:0;transform:scale(.3) rotate(-3deg)}55%{opacity:1;transform:scale(1.08) rotate(1deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
        @keyframes tw-win-fade{from{opacity:0}to{opacity:1}}
        @keyframes tw-win-glow{0%,100%{filter:drop-shadow(0 0 18px #ff2bd699) drop-shadow(0 0 40px #00e5ff55)}50%{filter:drop-shadow(0 0 30px #ffea00aa) drop-shadow(0 0 60px #ff2bd677)}}
        .tw-win-bg{background:radial-gradient(ellipse at center,rgba(15,23,42,.88) 0%,rgba(2,6,23,.96) 70%);animation:tw-win-fade .25s ease-out}
        .tw-win-name{animation:tw-win-in .7s cubic-bezier(.2,1.2,.3,1) both,tw-win-glow 2.2s ease-in-out .7s infinite;background:linear-gradient(100deg,#fff 10%,#ffea00 40%,#ff2bd6 70%,#00e5ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
        .tw-win-sub{animation:tw-win-fade .6s ease-out .45s both}
      `}</style>
      <canvas ref={canvas} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-[2vh] max-w-full">
        <div className="tw-win-sub text-[clamp(1rem,3vw,2rem)] font-black tracking-[0.5em] text-amber-300 pl-[0.5em]">🎉 SELAMAT 🎉</div>
        <div className="tw-win-name font-black leading-[1.02] tracking-tight [text-wrap:balance] break-words max-w-[94vw]" style={{ fontSize: size }}>{win.name}</div>
        <div className="tw-win-sub flex flex-col items-center gap-1">
          <div className="text-[clamp(1rem,2.6vw,1.8rem)] font-bold text-white/90">pemenang <span className="text-emerald-300">{win.prize}</span></div>
          {win.alamat && <div className="text-[clamp(.85rem,2vw,1.4rem)] text-slate-300">{win.alamat}</div>}
        </div>
      </div>
      <div className="absolute bottom-[3vh] text-[11px] text-slate-500">ketuk di mana saja untuk menutup</div>
    </div>
  );
}
