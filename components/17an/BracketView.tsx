'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { BYE, type Match } from '@/lib/event/bracket';
import { roundName } from '@/lib/event/labels';
import type { TParticipant } from './types';
import { MEDAL_COLOR, NEON, NEON_TEXT, TATA_DEFAULT, type Tata } from '@/lib/event/tata';

export { roundName } from '@/lib/event/labels';

// "2026-08-01T21:30" -> "1 Agu 2026 · 21.30"
export function fmtJadwal(j?: string) {
  if (!j) return '';
  const [d, t] = j.split('T');
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt.getTime())) return j;
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + (t ? ` · ${t.replace(':', '.')}` : '');
}

export function nameOf(parts: TParticipant[], id: string | null) {
  if (id === BYE) return { label: 'BYE', cls: 'text-slate-500 italic' };
  if (!id) return { label: 'Menunggu…', cls: 'text-slate-500' };
  const p = parts.find((x) => x.id === id);
  return { label: p ? p.nama : '?', cls: 'text-slate-100', tim: p?.tim };
}

type Badges = { winner: string; loser: string };

function MatchCard({ m, parts, onSelect, badges, edge, glow }: { m: Match; parts: TParticipant[]; onSelect?: (m: Match) => void; badges?: Badges; edge?: string; glow?: boolean }) {
  const row = (id: string | null, score?: number) => {
    const n = nameOf(parts, id);
    const win = m.winner && id === m.winner;
    const lose = m.status === 'done' && !!m.winner && !!id && id !== BYE && id !== m.winner; // yang kalah: redup seperti BYE
    const badge = badges && m.status === 'done' && id && id !== BYE ? (win ? badges.winner : badges.loser) : '';
    return (
      <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 ${win ? 'bg-emerald-500/15' : ''}`}>
        <span className={`truncate text-sm ${lose ? 'text-slate-500' : n.cls} ${win ? 'font-semibold text-emerald-200' : ''}`}>
          {n.label}{n.tim ? <span className="text-[10px] text-slate-500"> · {n.tim}</span> : null}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {badge && <span className="text-[10px] font-bold text-amber-300 whitespace-nowrap">{badge}</span>}
          <span className={`text-sm font-mono tabular-nums ${lose ? 'text-slate-500' : 'text-slate-300'}`}>{m.status === 'done' ? score : ''}</span>
        </span>
      </div>
    );
  };
  const clickable = onSelect && (m.a || m.b);
  return (
    <div role="button" tabIndex={clickable ? 0 : -1} aria-disabled={!clickable}
      onClick={() => clickable && onSelect(m)}
      onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(m); } }}
      style={edge ? { borderColor: edge, borderWidth: 2, boxShadow: glow ? `0 0 10px ${edge}99, inset 0 0 6px ${edge}33` : undefined } : undefined}
      className={`w-full text-left rounded-lg border bg-slate-900 divide-y divide-slate-800 overflow-hidden ${edge ? '' : m.status === 'bye' ? 'border-slate-800' : 'border-slate-700'} ${m.status === 'bye' ? 'opacity-70' : ''} ${clickable ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'}`}>
      {(m.third || m.half !== undefined) && (
        <div className="px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-950/60">
          {[m.half !== undefined ? `Kelompok ${m.half === 0 ? 'A' : 'B'}` : '', m.third ? 'Perebutan juara 3' : ''].filter(Boolean).join(' · ')}
        </div>
      )}
      {row(m.a, m.scoreA)}
      {row(m.b, m.scoreB)}
      {m.status === 'bye' ? (
        <div className="px-2.5 py-1 text-[11px] text-center text-slate-500 italic">BYE — lolos otomatis (tanpa skor)</div>
      ) : (m.jadwal || m.lokasi) ? (
        <div className="px-2.5 py-1.5 text-center text-[13px] font-semibold leading-tight space-y-0.5">
          {m.jadwal && <div className="truncate" style={{ color: NEON_TEXT.jadwal, textShadow: glow ? `0 0 6px ${NEON_TEXT.jadwal}99` : undefined }}>{fmtJadwal(m.jadwal)}</div>}
          {m.lokasi && <div className="truncate" style={{ color: edge ?? '#cbd5e1', textShadow: glow && edge ? `0 0 6px ${edge}99` : undefined }}>{m.lokasi}</div>}
        </div>
      ) : null}
    </div>
  );
}

type Line = { d: string; kind: 'idle' | 'done' | 'loser'; key: string; hidden: boolean };

// Bracket gugur: kolom per babak + garis alur pemenang + kolom juara; scroll horizontal di HP.
// `tata` mengatur jarak/lebar/gaya garis/posisi kartu; saat `editing`, kartu & garis bisa digeser/disembunyikan.
export default function BracketView({ matches, participants, onSelect, layout = 'standard', tata: tataIn, editing, onTata, canArrange, onArrange }: {
  matches: Match[]; participants: TParticipant[]; onSelect?: (m: Match) => void; layout?: 'standard' | 'dua-kelompok';
  tata?: Tata; editing?: boolean; onTata?: (t: Tata) => void; canArrange?: boolean; onArrange?: () => void;
}) {
  const tata = tataIn ?? TATA_DEFAULT;
  const ko = matches.filter((m) => m.stage === 'ko' && !m.third); // perebutan juara 3 ditampilkan terpisah
  const total = Math.max(0, ...ko.map((m) => m.round));
  const third = matches.find((m) => m.third);
  const final = total ? ko.reduce((a, b) => (b.round > a.round ? b : a)) : undefined;
  const inner = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0); // lebar area bagan -> kartu & jarak kolom disesuaikan agar muat (FIT), tidak disimpan
  const [lines, setLines] = useState<Line[]>([]);
  const [labels, setLabels] = useState<Record<string, { left: number; width: number; top: number }>>({}); // judul kolom mengikuti kartu

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const read = () => setAvail(el.clientWidth);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [total]);
  const natural = total * (tata.cardW + tata.gapX) + 176 + 32;
  const fit = avail ? Math.max(0.55, Math.min(1.25, avail / natural)) : 1;
  const cardW = Math.round(tata.cardW * fit), gapX = Math.round(tata.gapX * fit), juaraW = Math.round(176 * fit);

  const roundList = (r: number) => {
    const base = ko.filter((m) => m.round === r).sort((a, b) => a.index - b.index);
    const ord = tata.order[String(r)];
    if (!ord) return base;
    const rank = (m: Match) => { const i = ord.indexOf(m.id); return i < 0 ? 1e6 + m.index : i; };
    return [...base].sort((a, b) => rank(a) - rank(b));
  };
  const patch = (p: Partial<Tata>) => onTata?.({ ...tata, ...p });
  // Tahan kartu ±0,5 detik -> mode atur (kartu bergoyang) -> seret bebas. Garis mengikuti pusat kartu.
  const tataRef = useRef(tata);
  useLayoutEffect(() => { tataRef.current = tata; });
  const press = useRef<{ t: number | null; x: number; y: number; x0: number; y0: number; pid: number }>({ t: null, x: 0, y: 0, x0: 0, y0: 0, pid: 0 });
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const longFired = useRef(false);
  const clearPress = () => { if (press.current.t !== null) window.clearTimeout(press.current.t); press.current.t = null; };
  const beginDrag = (id: string, x: number, y: number) => {
    const p = tataRef.current.pos[id] ?? { x: 0, y: 0 };
    drag.current = { id, sx: x, sy: y, ox: p.x, oy: p.y };
  };
  const dragHandlers = (id: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (editing) { e.currentTarget.setPointerCapture(e.pointerId); beginDrag(id, e.clientX, e.clientY); return; }
      if (!canArrange) return;
      longFired.current = false;
      const el = e.currentTarget;
      press.current = {
        x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, pid: e.pointerId,
        t: window.setTimeout(() => {
          longFired.current = true; press.current.t = null;
          try { el.setPointerCapture(press.current.pid); } catch { /* pointer sudah lepas */ }
          beginDrag(id, press.current.x, press.current.y); // lanjut menyeret dengan tekanan yang sama
          onArrange?.();
        }, 550),
      };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      press.current.x = e.clientX; press.current.y = e.clientY;
      const d = drag.current;
      if (d) {
        const x = Math.max(-1200, Math.min(1200, Math.round(d.ox + e.clientX - d.sx)));
        const y = Math.max(-1200, Math.min(1200, Math.round(d.oy + e.clientY - d.sy)));
        const cur = tataRef.current;
        onTata?.({ ...cur, pos: { ...cur.pos, [d.id]: { x, y } } });
        return;
      }
      if (press.current.t !== null && Math.hypot(e.clientX - press.current.x0, e.clientY - press.current.y0) > 8) clearPress(); // menggeser = scroll biasa
    },
    onPointerUp: () => { clearPress(); drag.current = null; },
    onPointerCancel: () => { clearPress(); drag.current = null; },
    onContextMenu: canArrange || editing ? (e: React.MouseEvent) => e.preventDefault() : undefined,
  });
  const guardSelect = onSelect && ((m: Match) => { if (longFired.current) { longFired.current = false; return; } onSelect(m); });
  const toggleLine = (key: string) => patch({ hidden: tata.hidden.includes(key) ? tata.hidden.filter((k) => k !== key) : [...tata.hidden, key] });

  // Pertandingan yang pemenangnya mengisi `m`. Data lama tanpa feeder eksplisit: pasangan berurutan di babak sebelumnya.
  const hasFeeders = ko.some((m) => m.fa);
  const feedersOf = (m: Match): Match[] => {
    if (m.fa || m.fb) return [m.fa, m.fb].map((id) => matches.find((x) => x.id === id)).filter((x): x is Match => !!x);
    if (hasFeeders || m.round <= 1) return [];
    return ko.filter((x) => x.round === m.round - 1 && (x.index === 2 * m.index || x.index === 2 * m.index + 1));
  };
  const palette = (r: number) => (tata.borderMode === 'babak' ? NEON[(r - 1) % NEON.length] : tata.borderMode === 'satu' ? tata.colors.border : undefined);
  const stroke = tata.colors;

  const sig = ko.map((m) => `${m.id}:${m.winner ?? ''}:${m.a ?? ''}:${m.b ?? ''}`).join('|') + JSON.stringify(tata) + `|${cardW}|${gapX}` + (editing ? 'E' : '') + (third ? third.id + (third.winner ?? '') + (third.a ?? '') + (third.b ?? '') : '');
  useLayoutEffect(() => {
    const root = inner.current;
    if (!root) return;
    const draw = () => {
      const base = root.getBoundingClientRect();
      const pos = (id: string) => {
        const el = root.querySelector<HTMLElement>(`[data-mid="${id}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { l: r.left - base.left, r: r.right - base.left, y: r.top - base.top + r.height / 2 };
      };
      const out: Line[] = [];
      const link = (fromId: string, toId: string, kind: Line['kind']) => {
        const key = `${fromId}>${toId}`;
        const hidden = tata.hidden.includes(key);
        if (!tata.showLines && !editing) return;
        if (tata.lineMode === 'hanya-menang' && kind === 'idle' && !editing) return;
        if (hidden && !editing) return;
        const f = pos(fromId), t = pos(toId);
        if (!f || !t) return;
        const x1 = f.r, y1 = f.y, x2 = t.l - 2, y2 = t.y;
        const xm = Math.max(x1 + 4, t.l - gapX / 2);
        const d = tata.lineStyle === 'lurus' ? `M${x1} ${y1} L${x2} ${y2}`
          : tata.lineStyle === 'lengkung' ? `M${x1} ${y1} C${xm} ${y1}, ${xm} ${y2}, ${x2} ${y2}`
          : `M${x1} ${y1} H${xm} V${y2} H${x2}`;
        out.push({ key, kind, d, hidden });
      };
      for (const m of ko) {
        for (const f of feedersOf(m)) link(f.id, m.id, f.winner ? 'done' : 'idle');
      }
      if (third) {
        // yang kalah di semifinal -> perebutan juara 3
        for (const f of feedersOf(third)) link(f.id, third.id, f.status === 'done' ? 'loser' : 'idle');
        link(third.id, '__j3', third.winner ? 'done' : 'idle');
      }
      if (final) {
        link(final.id, '__j1', final.winner ? 'done' : 'idle');
        link(final.id, '__j2', final.winner ? 'loser' : 'idle');
      }
      setLines(out);

      // Judul kolom (Babak 1, Semifinal, Juara, ...): semua sejajar pada satu garis (setinggi kartu paling atas di seluruh bagan),
      // dan tiap judul berada di tengah kolomnya, mengikuti kartu yang digeser kiri/kanan.
      const groups: Record<string, string[]> = { j: ['__j1', '__j2', '__j3'] };
      for (let r = 1; r <= total; r++) groups[String(r)] = ko.filter((m) => m.round === r).map((m) => m.id);
      const spans: Record<string, { left: number; right: number }> = {};
      let lineTop = Infinity;
      for (const [key, ids] of Object.entries(groups)) {
        let top = Infinity, left = Infinity, right = -Infinity;
        for (const id of ids) {
          const el = root.querySelector<HTMLElement>(`[data-mid="${id}"]`);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          top = Math.min(top, r.top - base.top);
          left = Math.min(left, r.left - base.left);
          right = Math.max(right, r.right - base.left);
        }
        if (top !== Infinity) { spans[key] = { left, right }; lineTop = Math.min(lineTop, top); }
      }
      const lab: Record<string, { left: number; width: number; top: number }> = {};
      for (const [key, sp] of Object.entries(spans)) lab[key] = { left: Math.round(sp.left), width: Math.round(sp.right - sp.left), top: Math.round(lineTop) - 6 };
      setLabels(lab);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(root);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, total]);

  if (!total) return null;
  const champ = final?.winner ? nameOf(participants, final.winner).label : null;
  const runner = final && final.status === 'done' && final.winner ? nameOf(participants, final.winner === final.a ? final.b : final.a).label : null;
  const thirdName = third?.winner ? nameOf(participants, third.winner).label : null;
  const slot = (id: string, medal: string, title: string, name: string | null, hint: string, cls: string, i: number) => (
    <div data-mid={id} className={`relative z-10 ${editing ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
      style={{ transform: pos(id), touchAction: editing ? 'none' : undefined }} {...dragHandlers(id)}>
      <div className={editing ? 'tw-wiggle' : undefined} style={editing ? { animationDelay: `${i * -0.07}s` } : undefined}>
        <div className={`rounded-lg border px-3 py-2 ${cls}`}
          style={tata.borderMode === 'mati' ? undefined : { borderColor: medalColor[id], borderWidth: 2, boxShadow: tata.glow ? `0 0 10px ${medalColor[id]}99` : undefined }}>
          <div className="text-[11px] font-bold">{medal} {title}</div>
          <div className={`text-sm truncate ${name ? 'font-semibold text-slate-100' : 'text-slate-500 italic'}`}>{name ?? hint}</div>
        </div>
      </div>
    </div>
  );
  const medalColor: Record<string, string> = { __j1: MEDAL_COLOR[1], __j2: MEDAL_COLOR[2], __j3: MEDAL_COLOR[3] };
  const pos = (id: string) => { const p = tata.pos[id]; return p ? `translate(${p.x}px, ${p.y}px)` : undefined; };

  return (
    <div className="space-y-2">
      <style>{`@keyframes tw-wiggle{0%,100%{transform:rotate(-1.1deg)}50%{transform:rotate(1.1deg)}}.tw-wiggle{animation:tw-wiggle .26s ease-in-out infinite}`}</style>
      <div ref={wrap} className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full bg-slate-950 p-4 rounded-xl">
        <div ref={inner} className="relative flex min-w-max" style={{ gap: gapX }}>
          <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" aria-hidden>
            <defs>
              {(['idle', 'done', 'loser'] as const).map((k) => (
                <marker key={k} id={`arr-${k}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0 L8 4 L0 8 z" fill={stroke[k]} />
                </marker>
              ))}
            </defs>
            {lines.map((l) => (
              <g key={l.key} opacity={l.hidden ? 0.25 : 1}>
                <path d={l.d} fill="none" stroke={stroke[l.kind]} strokeWidth={tata.lineW} strokeLinejoin="round" style={tata.glow ? { filter: `drop-shadow(0 0 3px ${stroke[l.kind]})` } : undefined}
                  strokeDasharray={l.kind === 'loser' || l.hidden ? '5 4' : undefined} markerEnd={`url(#arr-${l.kind})`} />
                {editing && (
                  <path d={l.d} fill="none" stroke="transparent" strokeWidth={14} className="pointer-events-auto cursor-pointer" onClick={() => toggleLine(l.key)}>
                    <title>{l.hidden ? 'Klik untuk menampilkan garis' : 'Klik untuk menyembunyikan garis'}</title>
                  </path>
                )}
              </g>
            ))}
          </svg>
          {/* judul kolom: dihitung dari posisi kartu (lihat draw), sehingga ikut bergeser */}
          {Array.from({ length: total }, (_, i) => i + 1).map((r) => labels[String(r)] && (
            <div key={`lab${r}`} className="absolute z-10 pointer-events-none text-[11px] font-semibold uppercase tracking-wide text-center"
              style={{ left: labels[String(r)].left, top: labels[String(r)].top, width: labels[String(r)].width, transform: 'translateY(-100%)', color: palette(r) ?? '#94a3b8' }}>
              {roundName(r, total, layout)}
            </div>
          ))}
          {labels.j && (
            <div className="absolute z-10 pointer-events-none text-[11px] font-semibold uppercase tracking-wide text-amber-300 text-center"
              style={{ left: labels.j.left, top: labels.j.top, width: labels.j.width, transform: 'translateY(-100%)' }}>Juara</div>
          )}
          {Array.from({ length: total }, (_, i) => i + 1).map((r) => (
            <div key={r} className="flex flex-col shrink-0" style={{ width: cardW }}>
              <div aria-hidden className="text-[11px] font-semibold uppercase tracking-wide mb-2 invisible">{roundName(r, total, layout)}</div>
              <div className="flex-1 flex flex-col justify-around" style={{ gap: tata.gapY }}>
                {roundList(r).map((m, i) => (
                  <div key={m.id} data-mid={m.id} className={`relative z-10 ${editing ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
                    style={{ transform: pos(m.id), touchAction: editing ? 'none' : undefined }} {...dragHandlers(m.id)}>
                    <div className={editing ? 'tw-wiggle' : undefined} style={editing ? { animationDelay: `${(i % 5) * -0.06}s` } : undefined}>
                      <MatchCard m={m} parts={participants} onSelect={editing ? undefined : guardSelect} edge={palette(r)} glow={tata.glow}
                        badges={m.id === final?.id ? { winner: '🥇 Juara 1', loser: '🥈 Juara 2' } : undefined} />
                    </div>
                  </div>
                ))}
                {r === total && third && (
                  <div key={third.id} className="mt-6">
                    <div data-mid={third.id} className={`relative z-10 ${editing ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
                      style={{ transform: pos(third.id), touchAction: editing ? 'none' : undefined }} {...dragHandlers(third.id)}>
                      <div className="absolute -top-5 left-0 right-0 text-center text-[11px] font-semibold uppercase tracking-wide pointer-events-none" style={{ color: MEDAL_COLOR[3] }}>Perebutan Juara 3</div>
                      <div className={editing ? 'tw-wiggle' : undefined}>
                        <MatchCard m={third} parts={participants} onSelect={editing ? undefined : guardSelect} edge={tata.borderMode === 'mati' ? undefined : MEDAL_COLOR[3]} glow={tata.glow}
                          badges={{ winner: '🥉 Juara 3', loser: 'Juara 4' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="shrink-0 flex flex-col" style={{ width: juaraW }}>
            <div aria-hidden className="text-[11px] font-semibold uppercase tracking-wide mb-2 invisible">Juara</div>
            <div className="flex-1 flex flex-col justify-center gap-3">
              {slot('__j1', '🥇', 'Juara 1', champ, 'Pemenang Final', 'border-amber-400/60 bg-amber-500/10 text-amber-200', 0)}
              {slot('__j2', '🥈', 'Juara 2', runner, 'Yang kalah di Final', 'border-slate-400/50 bg-slate-400/10 text-slate-200', 1)}
              {third && slot('__j3', '🥉', 'Juara 3', thirdName, 'Pemenang perebutan juara 3', 'border-orange-500/50 bg-orange-700/10 text-orange-200', 2)}
            </div>
          </div>
        </div>
        </div>
      </div>
      <p data-export-skip className="text-[11px] text-slate-500">
        <span className="inline-block w-5 border-t-2 align-middle mr-1" style={{ borderColor: stroke.done }} />pemenang sudah maju ·
        <span className="inline-block w-5 border-t-2 align-middle mx-1" style={{ borderColor: stroke.idle }} />menunggu hasil ·
        <span className="inline-block w-5 border-t-2 align-middle mx-1" style={{ borderColor: stroke.loser }} />yang kalah (final → juara 2, semifinal → perebutan juara 3)
      </p>
    </div>
  );
}

// Bagan terpisah untuk perebutan juara 3.
export function ThirdPlaceView({ matches, participants, onSelect }: { matches: Match[]; participants: TParticipant[]; onSelect?: (m: Match) => void }) {
  const m = matches.find((x) => x.third);
  if (!m) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Perebutan Juara 3</h3>
      <div className="max-w-xs"><MatchCard m={m} parts={participants} onSelect={onSelect} badges={{ winner: '🥉 Juara 3', loser: 'Juara 4' }} /></div>
    </div>
  );
}
