// app/api/warga/alamat-bermasalah/route.ts
// Khusus master: daftar warga yang alamatnya tidak terbaca alamatKey, supaya bisa dirapikan. Hanya membaca.
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { WargaModel } from '@/lib/mongoose';
import { getScope, denied } from '@/lib/scope.server';
import { alamatKey } from '@/lib/alamat';

export async function GET() {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (scope.role !== 'master') return denied();
    await dbConnect();

    const docs = (await WargaModel.find({}).select('nama_lengkap rt alamat').lean()) as unknown as {
      _id: { toString(): string };
      nama_lengkap: string;
      rt: string;
      alamat?: string;
    }[];

    const data = docs
      .filter((d) => alamatKey(d.alamat) === null)
      .map((d) => ({ id: d._id.toString(), nama_lengkap: d.nama_lengkap, rt: d.rt, alamat: d.alamat ?? '' }))
      .sort((a, b) => a.rt.localeCompare(b.rt) || a.alamat.localeCompare(b.alamat, 'id', { numeric: true }));

    return NextResponse.json({ jumlah: data.length, total: docs.length, data });
  } catch (err) {
    console.error('[API/warga/alamat-bermasalah GET]', err);
    return NextResponse.json({ error: 'Gagal memeriksa alamat warga' }, { status: 500 });
  }
}
