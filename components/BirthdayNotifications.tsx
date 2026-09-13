'use client';

import { Cake } from 'lucide-react';
import type { Warga } from '@/lib/types';
import { getUpcomingBirthdays } from '@/lib/wargaUtils';

export default function BirthdayNotifications({ wargaList }: { wargaList: Warga[] }) {
  const notices = getUpcomingBirthdays(wargaList);
  if (notices.length === 0) return null;

  return (
    <section className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
          <Cake className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Pengingat Ulang Tahun Warga</h2>
          <p className="text-xs text-slate-400">Hari ini sampai H-7</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {notices.map(({ warga, daysUntil }) => (
          <div key={warga.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{warga.nama_lengkap}</p>
              <p className="text-xs text-slate-400">{warga.tanggal_lahir}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-amber-500/15 px-2 py-1 text-[11px] font-bold text-amber-300">
              {daysUntil === 0 ? 'Hari ini' : `H-${daysUntil}`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
