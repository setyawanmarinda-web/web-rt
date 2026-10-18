'use client';

import { useEffect, useState } from 'react';

export type Ringkas = {
  total: number;
  tetap: number;
  kontrak: number;
  lansia: number;
  balita: number;
  anak: number;
  remaja: number;
  dewasa: number;
};

export type StatistikRingkas = Ringkas & { per_rt: Record<string, Ringkas> };

// Ringkasan angka RT 001-010 dari /api/statistik-ringkas (null selama memuat / gagal).
export function useStatistikRingkas(): StatistikRingkas | null {
  const [data, setData] = useState<StatistikRingkas | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/statistik-ringkas')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.total === 'number') setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

// RW 012 ('ALL') = jumlah semua RT; selain itu angka RT yang dipilih.
export function ringkasUntuk(data: StatistikRingkas | null, selectedRt: string): Ringkas | null {
  if (!data) return null;
  return selectedRt === 'ALL' ? data : data.per_rt[selectedRt] ?? null;
}
