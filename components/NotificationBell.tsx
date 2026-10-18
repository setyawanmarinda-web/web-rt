'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CalendarDays, Megaphone } from 'lucide-react';
import { useScope } from '@/lib/scope';
import type { Kegiatan, Pengumuman } from '@/lib/types';

type Item = {
  key: string;
  kind: 'pengumuman' | 'kegiatan';
  judul: string;
  tanggal: string;
  tag: string;
  href: string;
};

const SEEN_PREFIX = 'sim_rw_bell_seen_v1:';
const ISO = /^\d{4}-\d{2}-\d{2}/;

function fmt(d?: string) {
  if (!d) return '';
  if (ISO.test(d)) {
    const dt = new Date(d.slice(0, 10) + 'T00:00:00');
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return d;
}

export default function NotificationBell({
  pengumuman,
  kegiatan,
  selectedRt,
}: {
  pengumuman: Pengumuman[];
  kegiatan: Kegiatan[];
  selectedRt: string;
}) {
  const { user } = useScope();
  const isWarga = user?.role === 'warga';
  const storeKey = SEEN_PREFIX + (user?.name || 'anon');

  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[] | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(storeKey);
      setSeen(raw ? JSON.parse(raw) : []);
    } catch {
      setSeen([]);
    }
  }, [user, storeKey]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const inScope = (rt: string) => selectedRt === 'ALL' || rt === selectedRt || rt === '012';

    const p: Item[] = (pengumuman || [])
      .filter((x) => x.status === 'Aktif' && inScope(x.rt))
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
      .slice(0, 6)
      .map((x) => ({
        key: 'p:' + x.id,
        kind: 'pengumuman' as const,
        judul: x.judul,
        tanggal: fmt(x.tanggal),
        tag: x.rt === '012' ? 'RW 012' : 'RT ' + x.rt,
        href: '/dashboard/pengumuman',
      }));
    if (isWarga) return p;

    const today = new Date().toLocaleDateString('en-CA');
    const k: Item[] = (kegiatan || [])
      .filter(
        (x) =>
          x.status === 'Akan Datang' &&
          inScope(x.rt) &&
          (!ISO.test(String(x.tanggal)) || String(x.tanggal).slice(0, 10) >= today),
      )
      .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)))
      .slice(0, 4)
      .map((x) => ({
        key: 'k:' + x.id,
        kind: 'kegiatan' as const,
        judul: x.judul,
        tanggal: fmt(x.tanggal) + (x.waktu ? ' ' + x.waktu : ''),
        tag: x.rt === '012' ? 'RW 012' : 'RT ' + x.rt,
        href: '/dashboard/kegiatan',
      }));
    return [...p, ...k];
  }, [pengumuman, kegiatan, selectedRt, isWarga]);

  const unread = seen ? items.filter((i) => !seen.includes(i.key)) : [];

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setFresh(unread.map((i) => i.key));
    setOpen(true);
    const next = Array.from(new Set([...(seen || []), ...items.map((i) => i.key)])).slice(-300);
    setSeen(next);
    try {
      localStorage.setItem(storeKey, JSON.stringify(next));
    } catch {}
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Informasi terbaru"
        aria-expanded={open}
        className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all relative"
      >
        <Bell className="w-4 h-4" />
        {unread.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-300">
            Informasi terbaru
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-800">
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-slate-500">Belum ada informasi terbaru.</p>
            )}
            {items.map((i) => (
              <Link
                key={i.key}
                href={i.href}
                onClick={() => setOpen(false)}
                className="flex gap-3 px-4 py-3 hover:bg-slate-800/70 transition-colors"
              >
                <span
                  className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center ${
                    i.kind === 'pengumuman'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-sky-500/10 border-sky-500/20 text-sky-300'
                  }`}
                >
                  {i.kind === 'pengumuman' ? <Megaphone className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-300">{i.tag}</span>
                    {fresh.includes(i.key) && (
                      <span className="text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 px-1.5">Baru</span>
                    )}
                  </span>
                  <span className="block text-sm font-semibold text-slate-100 break-words">{i.judul}</span>
                  <span className="block text-[11px] text-slate-400">
                    {i.kind === 'kegiatan' ? 'Agenda: ' : ''}
                    {i.tanggal}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
