// app/api/statistik-ringkas/route.ts
// Ringkasan angka kependudukan RT 001-010 (tanpa nama/NIK). Boleh dibuka semua akun yang login.
// Data berlabel rt "012" (level RW) tidak dihitung.
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { WargaModel } from '@/lib/mongoose';
import { RT_LIST } from '@/lib/types';
import { getScope, denied } from '@/lib/scope.server';
import { getWargaAgeCategory } from '@/lib/wargaUtils';

type Ringkas = {
  total: number;
  tetap: number;
  kontrak: number;
  lansia: number;
  balita: number;
  anak: number;
  remaja: number;
  dewasa: number;
};

const kosong = (): Ringkas => ({ total: 0, tetap: 0, kontrak: 0, lansia: 0, balita: 0, anak: 0, remaja: 0, dewasa: 0 });

export async function GET() {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();

    const docs = (await WargaModel.find({ rt: { $in: RT_LIST } })
      .select('rt status_tinggal tanggal_lahir -_id')
      .lean()) as unknown as { rt: string; status_tinggal?: string; tanggal_lahir?: string }[];

    const per_rt: Record<string, Ringkas> = Object.fromEntries(RT_LIST.map((rt) => [rt, kosong()]));
    const total = kosong();

    for (const d of docs) {
      const kategori = getWargaAgeCategory({ tanggal_lahir: d.tanggal_lahir });
      for (const r of [per_rt[d.rt], total]) {
        if (!r) continue;
        r.total += 1;
        if (d.status_tinggal === 'Tetap') r.tetap += 1;
        else if (d.status_tinggal === 'Kontrak') r.kontrak += 1;
        if (kategori) r[kategori.toLowerCase() as 'balita' | 'anak' | 'remaja' | 'dewasa' | 'lansia'] += 1;
      }
    }

    return NextResponse.json({ ...total, per_rt });
  } catch (err) {
    console.error('[API/statistik-ringkas GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil ringkasan statistik' }, { status: 500 });
  }
}
