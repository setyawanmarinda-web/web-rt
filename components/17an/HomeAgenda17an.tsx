'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BellRing, CalendarPlus, MapPin, Trophy, Swords, ChevronsRight } from 'lucide-react';
import { standings } from '@/lib/event/bracket';
import { buildIcs, countdown, inWindow, parseJadwal, type Level } from '@/lib/event/jadwal';
import { mergeTata } from '@/lib/event/tata';
import BracketView, { fmtJadwal, nameOf } from './BracketView';
import Podium from './Podium';
import ExportBar from './ExportBar';
import type { Tournament } from './types';

type Upcoming = {
  key: string; tournamentId: string; tournamentNama: string; cabang: string; babak: string;
  a: string; b: string; jadwal: string; lokasi: string; startsAt: number; allDay: boolean;
};
export type Beranda17an = { upcoming: Upcoming[]; tournaments: Tournament[]; ready: boolean };

// Data dimuat sekali oleh halaman, dipakai bersama oleh banner pengingat & bagian bagan.
export function useBeranda17an(): Beranda17an {
  const [data, setData] = useState<Beranda17an>({ upcoming: [], tournaments: [], ready: false });
  useEffect(() => {
    let alive = true;
    fetch('/api/17an/beranda')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setData(d ? { upcoming: d.upcoming ?? [], tournaments: d.tournaments ?? [], ready: true } : { upcoming: [], tournaments: [], ready: true }); })
      .catch(() => { if (alive) setData((x) => ({ ...x, ready: true })); });
    return () => { alive = false; };
  }, []);
  return data;
}

// Jam sekarang, diperbarui tiap menit agar hitung mundur tidak basi.
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

const LEVEL: Record<Level, { color: string; chip: string }> = {
  now: { color: '#ff2bd6', chip: 'animate-pulse' },
  today: { color: '#ff9100', chip: 'animate-pulse' },
  soon: { color: '#ffea00', chip: '' },
  week: { color: '#00e5ff', chip: '' },
};

// ─── Banner pengingat (paling atas beranda) ─────────────────────────────────
export function Banner17an({ data, onOpen }: { data: Beranda17an; onOpen?: () => void }) {
  const now = useNow();
  const live = data.upcoming.filter((u) => inWindow({ start: u.startsAt, allDay: u.allDay }, now));
  if (!live.length) return null;
  const next = live[0];
  const cd = countdown({ start: next.startsAt, allDay: next.allDay }, now);
  const c = LEVEL[cd.level].color;
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left rounded-xl border border-amber-500/30 bg-gradient-to-r from-rose-950/60 via-slate-950 to-amber-950/40 hover:brightness-110 transition">
      <div className="px-4 py-2.5 flex items-center gap-3 text-xs sm:text-sm">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: c }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: c }} />
        </span>
        <BellRing className="w-4 h-4 shrink-0 text-amber-300" />
        <span className="min-w-0 truncate">
          <b className="text-white">Pengingat 17an:</b>{' '}
          <span className="text-slate-300">{live.length} pertandingan dalam 7 hari ke depan — berikutnya </span>
          <b className="text-white">{next.a} vs {next.b}</b>{' '}
          <b style={{ color: c, textShadow: `0 0 8px ${c}88` }}>{cd.label}</b>
        </span>
        <span className="ml-auto shrink-0 hidden sm:inline-flex items-center gap-1 font-bold text-amber-300">Lihat jadwal <ArrowRight className="w-3.5 h-3.5" /></span>
      </div>
    </button>
  );
}

function icsHref(u: Upcoming) {
  const ics = buildIcs({ id: u.key, judul: `${u.a} vs ${u.b} — ${u.tournamentNama}`, jadwal: u.jadwal, lokasi: u.lokasi, deskripsi: `${u.babak} · Agenda 17an RW 012` });
  return ics ? `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` : null;
}

function ReminderCard({ u, now }: { u: Upcoming; now: number }) {
  const cd = countdown({ start: u.startsAt, allDay: u.allDay }, now);
  const { color, chip } = LEVEL[cd.level];
  const href = icsHref(u);
  return (
    <div className="snap-start shrink-0 w-[85%] sm:w-auto rounded-2xl p-[1.5px]" style={{ background: `linear-gradient(135deg, ${color}, transparent 60%)`, boxShadow: `0 0 22px ${color}33` }}>
      <div className="h-full rounded-[calc(1rem-1px)] bg-slate-900/95 backdrop-blur p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide ${chip}`} style={{ color: '#0b1220', background: color, boxShadow: `0 0 12px ${color}99` }}>{cd.label}</span>
          <span className="text-[11px] text-slate-400 truncate">{u.cabang || u.tournamentNama}</span>
        </div>
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{u.babak}</div>
          <div className="text-lg font-extrabold text-white leading-tight break-words">{u.a}</div>
          <div className="flex items-center gap-2 text-[11px] font-black text-slate-500"><span className="h-px flex-1 bg-slate-700" /><Swords className="w-3.5 h-3.5" />VS<span className="h-px flex-1 bg-slate-700" /></div>
          <div className="text-lg font-extrabold text-white leading-tight break-words">{u.b}</div>
        </div>
        <div className="mt-auto pt-2 border-t border-slate-800 space-y-1 text-center">
          <div className="text-sm font-bold" style={{ color: '#ffea00', textShadow: '0 0 8px #ffea0066' }}>{fmtJadwal(u.jadwal)}</div>
          {u.lokasi && <div className="text-sm font-semibold flex items-center justify-center gap-1" style={{ color }}><MapPin className="w-3.5 h-3.5" />{u.lokasi}</div>}
          {href && (
            <a href={href} download={`${u.a}-vs-${u.b}.ics`.replace(/[^\w.-]+/g, '_')} className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-300 hover:text-white">
              <CalendarPlus className="w-3.5 h-3.5" /> Simpan ke kalender HP
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bagian bagan & jadwal ──────────────────────────────────────────────────
export function Section17an({ data }: { data: Beranda17an }) {
  const now = useNow();
  const [sel, setSel] = useState<string | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const koRef = useRef<HTMLDivElement>(null);
  const podiumRef = useRef<HTMLDivElement>(null);
  const live = data.upcoming.filter((u) => inWindow({ start: u.startsAt, allDay: u.allDay }, now));
  const t = useMemo(() => data.tournaments.find((x) => x.id === sel) ?? data.tournaments[0], [data.tournaments, sel]);
  if (!data.ready) return <p className="text-sm text-slate-400">Memuat…</p>;
  if (!data.tournaments.length && !live.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center space-y-1">
        <Trophy className="w-8 h-8 mx-auto text-slate-600" />
        <p className="text-sm font-semibold text-slate-300">Belum ada bagan pertandingan</p>
        <p className="text-xs text-slate-500">Bagan dan jadwal akan tampil di sini setelah panitia membuatnya di tab Bracket Pertandingan.</p>
      </div>
    );
  }

  const real = t ? t.matches.filter((m) => m.status !== 'bye') : [];
  const done = real.filter((m) => m.status === 'done').length;
  const pct = real.length ? Math.round((done / real.length) * 100) : 0;
  const ko = t ? t.matches.filter((m) => m.stage === 'ko') : [];
  const gm = t ? t.matches.filter((m) => m.stage === 'group') : [];
  const jadwal = t ? t.matches.filter((m) => m.jadwal && m.status !== 'bye').sort((a, b) => (parseJadwal(a.jadwal)?.start ?? 0) - (parseJadwal(b.jadwal)?.start ?? 0)) : [];
  const tata = t ? mergeTata(t.tata_letak) : undefined;
  const finalM = ko.filter((m) => !m.third).reduce<(typeof ko)[number] | null>((a, b) => (!a || b.round > a.round ? b : a), null);
  const finalDone = !!finalM && finalM.status === 'done' && !!finalM.winner;

  return (
    <section id="agenda-17an" className="space-y-6 scroll-mt-20">
      {live.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-rose-950/50 via-slate-900 to-amber-950/30 p-4 sm:p-6 space-y-4">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300"><BellRing className="w-5 h-5 animate-[bell-ring_2s_ease-in-out_infinite]" /></div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Segera dimulai — jangan sampai ketinggalan!</h3>
              <p className="text-xs text-slate-400">{live.length} pertandingan dalam 7 hari ke depan. Ajak keluarga &amp; tetangga untuk menonton dan memberi semangat.</p>
            </div>
          </div>
          <div className="relative flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {live.map((u) => <ReminderCard key={u.key} u={u} now={now} />)}
          </div>
        </div>
      )}

      {t && (
        <div className="space-y-4">
          {data.tournaments.length > 1 && (
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {data.tournaments.map((x) => {
                const on = x.id === t.id;
                return (
                  <button key={x.id} onClick={() => setSel(x.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition ${on ? 'bg-rose-500/20 border-rose-400 text-rose-100 shadow-[0_0_14px_#ff2bd655]' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                    {x.nama}
                  </button>
                );
              })}
            </div>
          )}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center"><Trophy className="w-6 h-6" /></div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-white truncate">{t.nama}</h3>
                  <p className="text-xs text-slate-400">{t.cabang ? `${t.cabang} · ` : ''}{t.mode === 'single' ? 'Sistem gugur' : 'Sistem grup + babak gugur'} · {t.participants.length} peserta</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black ${t.status === 'berjalan' ? 'bg-emerald-400 text-slate-950 animate-pulse' : t.status === 'selesai' ? 'bg-amber-300 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>
                {t.status === 'berjalan' ? '● SEDANG BERJALAN' : t.status === 'selesai' ? 'SELESAI' : 'SEGERA'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400"><span>Progres pertandingan</span><span className="font-bold text-slate-200">{done}/{real.length} selesai · {pct}%</span></div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-amber-300 to-emerald-400 transition-all" style={{ width: `${pct}%` }} /></div>
            </div>

            <ExportBar title={t.nama}
              subtitle={[t.cabang, t.mode === 'single' ? 'Sistem gugur' : 'Sistem grup + babak gugur', `${t.participants.length} peserta`].filter(Boolean).join(' · ')}
              sections={[
                ...(gm.length ? [{ key: 'fase-grup', label: 'Fase grup', ref: groupRef, available: true }] : []),
                ...(ko.length ? [{ key: 'babak-gugur', label: t.mode === 'group' ? 'Babak gugur' : 'Bagan', ref: koRef, available: true }] : []),
                { key: 'klasemen-akhir', label: 'Klasemen akhir', ref: podiumRef, available: finalDone, hint: 'Tersedia setelah final selesai' },
              ]} />

            {gm.length > 0 && (
              <div ref={groupRef} className="space-y-3">
                <h4 className="text-sm font-bold text-white">Klasemen fase grup</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {t.groups.map((g, gi) => {
                    const rows = standings(t.matches, g, gi);
                    return (
                      <div key={gi} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                        <div className="text-sm font-bold text-white mb-2">{g.name}</div>
                        <table className="w-full text-xs">
                          <thead className="text-slate-500"><tr><th className="text-left font-medium">#</th><th className="text-left font-medium">Peserta</th><th className="font-medium">Main</th><th className="font-medium">SG</th><th className="font-medium">Poin</th></tr></thead>
                          <tbody>
                            {rows.map((r, i) => (
                              <tr key={r.id} className={i < t.advance_per_group ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                                <td className="py-0.5">{i + 1}</td><td className="truncate max-w-[9rem]">{nameOf(t.participants, r.id).label}</td>
                                <td className="text-center">{r.main}</td><td className="text-center">{r.gd}</td><td className="text-center font-bold">{r.pts}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
                {t.advance_per_group > 0 && <p className="text-[11px] text-slate-500">Warna hijau = lolos ke babak gugur.</p>}
              </div>
            )}

            {ko.length > 0 && (
              <div ref={koRef} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{t.mode === 'group' ? 'Babak gugur' : 'Bagan pertandingan'}</h4>
                  <span data-export-skip className="sm:hidden inline-flex items-center gap-1 text-[11px] text-slate-500">geser <ChevronsRight className="w-3.5 h-3.5" /></span>
                </div>
                <BracketView matches={t.matches} participants={t.participants} layout={t.layout} tata={tata} />
              </div>
            )}

            <div ref={podiumRef}>
              {finalDone && <Podium matches={t.matches} participants={t.participants} tata={tata} judul={t.nama} cabang={t.cabang} />}
            </div>

            {jadwal.length > 0 && (
              <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 group" open={jadwal.length <= 6}>
                <summary className="cursor-pointer text-sm font-bold text-white list-none flex items-center justify-between">
                  Jadwal lengkap ({jadwal.length})<span className="text-xs text-slate-500 group-open:hidden">tampilkan</span>
                </summary>
                <ul className="mt-3 divide-y divide-slate-800">
                  {jadwal.map((m) => (
                    <li key={m.id} className="py-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                      <span className="text-left text-xs sm:text-sm font-semibold leading-snug" style={{ color: '#ffea00' }}>{fmtJadwal(m.jadwal)}</span>
                      <span className="text-center">
                        <span className={`block text-sm sm:text-base font-bold leading-snug break-words ${m.status === 'done' ? 'text-slate-500' : 'text-white'}`}>
                          {nameOf(t.participants, m.a).label} <span className="mx-0.5 font-medium text-slate-500">vs</span> {nameOf(t.participants, m.b).label}
                        </span>
                        {m.status === 'done' && <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-mono font-bold text-slate-200">{m.scoreA} – {m.scoreB}</span>}
                      </span>
                      <span className="text-right text-xs sm:text-sm text-slate-400 leading-snug break-words">{m.lokasi}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
