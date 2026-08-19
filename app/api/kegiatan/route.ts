// app/api/kegiatan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { KegiatanModel } from '@/lib/mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const rt = req.nextUrl.searchParams.get('rt');
    const query = rt && rt !== 'ALL' ? { rt } : {};
    const docs = await KegiatanModel.find(query).sort({ tanggal: -1 }).lean();
    const data = docs.map((d) => {
      const obj = { ...d } as Record<string, unknown>;
      obj.id = (obj._id as { toString(): string })?.toString();
      delete obj._id; delete obj.__v;
      return obj;
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/kegiatan GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil data kegiatan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const doc = await KegiatanModel.create(body);
    const obj = doc.toObject() as Record<string, unknown>;
    return NextResponse.json({ ...obj, id: (obj._id as { toString(): string })?.toString(), _id: undefined, __v: undefined }, { status: 201 });
  } catch (err) {
    console.error('[API/kegiatan POST]', err);
    return NextResponse.json({ error: 'Gagal menyimpan data kegiatan' }, { status: 500 });
  }
}

// DELETE /api/kegiatan?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    const doc = await KegiatanModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/kegiatan DELETE]', err);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
