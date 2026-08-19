// app/api/surat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SuratModel } from '@/lib/mongoose';

function toPlain(d: Record<string, unknown>) {
  return { ...d, id: (d._id as { toString(): string })?.toString(), _id: undefined, __v: undefined };
}

// GET /api/surat?rt=002
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const rt = req.nextUrl.searchParams.get('rt');
    const query = rt && rt !== 'ALL' ? { rt } : {};
    const docs = await SuratModel.find(query).sort({ tanggal_pengajuan: -1 }).lean();
    return NextResponse.json(docs.map((d) => toPlain(d as Record<string, unknown>)));
  } catch (err) {
    console.error('[API/surat GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil data surat' }, { status: 500 });
  }
}

// POST /api/surat
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    // Auto generate no_surat
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const count = await SuratModel.countDocuments();
    body.no_surat = `SRT/${year}/${month}/${(count + 1).toString().padStart(3, '0')}`;
    body.status = 'Pending';
    body.tanggal_pengajuan = now.toISOString().split('T')[0];
    const doc = await SuratModel.create(body);
    return NextResponse.json(toPlain(doc.toObject() as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('[API/surat POST]', err);
    return NextResponse.json({ error: 'Gagal menyimpan data surat' }, { status: 500 });
  }
}

// PATCH /api/surat  — update status
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const { id, status } = await req.json();
    const doc = await SuratModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!doc) return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 });
    return NextResponse.json(toPlain(doc.toObject() as Record<string, unknown>));
  } catch (err) {
    console.error('[API/surat PATCH]', err);
    return NextResponse.json({ error: 'Gagal update status surat' }, { status: 500 });
  }
}

// DELETE /api/surat?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    const doc = await SuratModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/surat DELETE]', err);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
