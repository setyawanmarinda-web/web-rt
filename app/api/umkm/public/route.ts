// app/api/umkm/public/route.ts
// Direktori UMKM lintas RT untuk semua akun yang login. Alamat rumah sengaja tidak dikirim.
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { UMKMModel } from '@/lib/mongoose';
import { getScope, denied } from '@/lib/scope.server';

export async function GET() {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();
    const docs = await UMKMModel.find({}).sort({ _id: -1 }).lean();
    const data = docs.map((d) => {
      const o = d as Record<string, unknown>;
      return {
        id: (o._id as { toString(): string })?.toString(),
        nama_usaha: o.nama_usaha,
        pemilik: o.pemilik,
        deskripsi: o.deskripsi,
        kategori: o.kategori,
        whatsapp: o.whatsapp,
        foto_url: o.foto_url,
        rt: o.rt,
        urutan: o.urutan,
      };
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/umkm/public GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil data UMKM' }, { status: 500 });
  }
}
