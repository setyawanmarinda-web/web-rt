// app/api/pengumuman/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PengumumanModel } from '@/lib/mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const rt = req.nextUrl.searchParams.get('rt');
    const query = rt && rt !== 'ALL' ? { rt } : {};
    const docs = await PengumumanModel.find(query).sort({ tanggal: -1 }).lean();
    const data = docs.map((d) => {
      const obj = { ...d } as Record<string, unknown>;
      obj.id = (obj._id as { toString(): string })?.toString();
      delete obj._id; delete obj.__v;
      return obj;
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/pengumuman GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil data pengumuman' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const doc = await PengumumanModel.create(body);
    const obj = doc.toObject() as Record<string, unknown>;
    return NextResponse.json({ ...obj, id: (obj._id as { toString(): string })?.toString(), _id: undefined, __v: undefined }, { status: 201 });
  } catch (err) {
    console.error('[API/pengumuman POST]', err);
    return NextResponse.json({ error: 'Gagal menyimpan pengumuman' }, { status: 500 });
  }
}

// DELETE /api/pengumuman?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    const doc = await PengumumanModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/pengumuman DELETE]', err);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
