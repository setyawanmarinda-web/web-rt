// app/api/warga/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { WargaModel } from '@/lib/mongoose';

// Helper: convert Mongoose doc ke plain object dengan id string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlain(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj._id?.toString(), _id: undefined, __v: undefined };
}

// GET /api/warga?rt=002   (tanpa rt = semua)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const rt = req.nextUrl.searchParams.get('rt');
    const query = rt && rt !== 'ALL' ? { rt } : {};
    const docs = await WargaModel.find(query).sort({ created_at: -1 }).lean();
    const data = docs.map((d) => {
      const obj = { ...d } as Record<string, unknown>;
      obj.id = (obj._id as { toString(): string })?.toString();
      delete obj._id;
      delete obj.__v;
      return obj;
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/warga GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil data warga' }, { status: 500 });
  }
}

// POST /api/warga
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const doc = await WargaModel.create(body);
    return NextResponse.json(toPlain(doc), { status: 201 });
  } catch (err) {
    console.error('[API/warga POST]', err);
    return NextResponse.json({ error: 'Gagal menyimpan data warga' }, { status: 500 });
  }
}

// DELETE /api/warga?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    const doc = await WargaModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/warga DELETE]', err);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
