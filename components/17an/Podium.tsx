'use client';

import React from 'react';
import type { Match } from '@/lib/event/bracket';
import { MEDAL_COLOR, TATA_DEFAULT, type Tata } from '@/lib/event/tata';
import { nameOf } from './BracketView';
import type { TParticipant } from './types';

const loserOf = (m?: Match) => (m && m.status === 'done' && m.winner ? (m.winner === m.a ? m.b : m.a) : null);

// Juara 1–3 (dan 4) dari final & perebutan juara 3. Warna tepi sama dengan kotak Juara di bagan.
export default function Podium({ matches, participants, tata = TATA_DEFAULT, judul, cabang }: { matches: Match[]; participants: TParticipant[]; tata?: Tata; judul?: string; cabang?: string }) {
  const ko = matches.filter((m) => m.stage === 'ko' && !m.third);
  if (!ko.length) return null;
  const final = ko.reduce((a, b) => (b.round > a.round ? b : a));
  if (final.status !== 'done' || !final.winner) return null;
  const thirdM = matches.find((m) => m.third);
  const places = [
    { n: 1 as const, id: final.winner, h: 'h-28', medal: '🥇' },
    { n: 2 as const, id: loserOf(final), h: 'h-20', medal: '🥈' },
    { n: 3 as const, id: thirdM?.winner ?? null, h: 'h-14', medal: '🥉' },
  ];
  const fourth = loserOf(thirdM);
  const colored = tata.borderMode !== 'mati';
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="text-center space-y-0.5">
        <div className="text-[11px] font-black tracking-[0.25em] text-amber-300">KLASEMEN AKHIR</div>
        {judul && <h3 className="text-lg sm:text-xl font-black text-white break-words">{judul}</h3>}
        {cabang && <div className="text-xs text-slate-400">{cabang}</div>}
      </div>
      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {[places[1], places[0], places[2]].map((p) => {
          const c = MEDAL_COLOR[p.n];
          return (
            <div key={p.n} className="flex flex-col items-center w-28 sm:w-36">
              <div className="text-2xl">{p.medal}</div>
              <div className="text-sm font-semibold text-center truncate w-full">{p.id ? nameOf(participants, p.id).label : '—'}</div>
              <div className={`mt-1 w-full ${p.h} rounded-t-lg border-2 flex items-center justify-center font-bold bg-slate-950/40`}
                style={{ borderColor: colored ? c : '#475569', color: colored ? c : '#cbd5e1', boxShadow: colored && tata.glow ? `0 0 12px ${c}99, inset 0 0 8px ${c}33` : undefined }}>
                Juara {p.n}
              </div>
            </div>
          );
        })}
      </div>
      {thirdM && <p className="text-center text-xs text-slate-400">{thirdM.status === 'done' ? `Juara 4: ${nameOf(participants, fourth).label}` : 'Juara 3 menunggu hasil perebutan juara 3.'}</p>}
    </div>
  );
}
