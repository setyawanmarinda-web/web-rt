'use client';

import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { useScope } from '@/lib/scope';
import { useStatistikRingkas, ringkasUntuk, type Ringkas } from '@/lib/useStatistikRingkas';

const USIA: { key: 'balita' | 'anak' | 'remaja' | 'dewasa' | 'lansia'; label: string; dot: string }[] = [
  { key: 'balita', label: 'Balita', dot: 'bg-pink-400' },
  { key: 'anak', label: 'Anak', dot: 'bg-amber-400' },
  { key: 'remaja', label: 'Remaja', dot: 'bg-sky-400' },
  { key: 'dewasa', label: 'Dewasa', dot: 'bg-emerald-400' },
  { key: 'lansia', label: 'Lansia', dot: 'bg-violet-400' },
];

function Kolom({ judul, data, aksen }: { judul: string; data: Ringkas | null; aksen: 'emerald' | 'sky' }) {
  const warna =
    aksen === 'emerald'
      ? { badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', angka: 'from-emerald-300 to-teal-400' }
      : { badge: 'border-sky-500/30 bg-sky-500/10 text-sky-300', angka: 'from-sky-300 to-indigo-400' };
  const total = data?.total ?? 0;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${warna.badge}`}>{judul}</span>
      <div className="mt-2 flex items-baseline gap-1">
        {data ? (
          <span className={`bg-gradient-to-r bg-clip-text text-3xl font-black leading-none text-transparent ${warna.angka}`}>
            {total.toLocaleString('id-ID')}
          </span>
        ) : (
          <span className="h-7 w-14 animate-pulse rounded bg-slate-800" />
        )}
        <span className="text-[10px] text-slate-500">warga</span>
      </div>
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="bg-teal-400" style={{ width: `${pct(data?.tetap ?? 0)}%` }} />
        <div className="bg-purple-400" style={{ width: `${pct(data?.kontrak ?? 0)}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>Tetap <b className="text-white">{data?.tetap ?? '-'}</b></span>
        <span>Kontrak <b className="text-white">{data?.kontrak ?? '-'}</b></span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {USIA.map((u) => (
          <div key={u.key} title={u.label} className="text-center">
            <div className="text-xs font-bold leading-none text-slate-100">{data ? data[u.key] : '-'}</div>
            <div className="mt-1 flex items-center justify-center gap-0.5 text-[8px] text-slate-500">
              <i className={`h-1 w-1 rounded-full ${u.dot}`} />
              {u.label.slice(0, 3)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Kartu ringkas: kiri = RT akun (atau RT terpilih untuk admin), kanan = gabungan RT 001-010.
// Dipakai sebagai satu sel di grid kartu beranda (lebar 2 kolom).
export default function StatistikPanel({ className = '' }: { className?: string }) {
  const stat = useStatistikRingkas();
  const { selectedRt } = useScope();
  const rt = ringkasUntuk(stat, selectedRt);
  const rtLabel = selectedRt === 'ALL' ? 'RW 012' : `RT ${selectedRt}`;

  return (
    <Link
      href="/dashboard/statistik"
      className={`group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 sm:p-6 ${className}`}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400 sm:h-12 sm:w-12">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h3 className="text-base font-bold text-white sm:text-lg">Statistik & Kependudukan</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Kolom judul={rtLabel} data={rt} aksen="emerald" />
          <Kolom judul="RW 012" data={stat} aksen="sky" />
        </div>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 transition-all group-hover:gap-2">
        Buka <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
