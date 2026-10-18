// app/api/arsip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ArsipModel } from '@/lib/mongoose';
import { getScope, denied, forceRt, lockRt, ownershipDenied } from '@/lib/scope.server';

export async function GET(_req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();
    const docs = await ArsipModel.find().sort({ tanggal_upload: -1 }).lean();
    const data = docs.map((d) => {
      const obj = { ...d } as Record<string, unknown>;
      obj.id = (obj._id as { toString(): string })?.toString();
      delete obj._id; delete obj.__v;
      return obj;
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/arsip GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil data arsip' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.all) return denied();
    await dbConnect();
    const body = await req.json();
    forceRt(scope, body);
    const doc = await ArsipModel.create(body);
    const obj = doc.toObject() as Record<string, unknown>;
    return NextResponse.json({ ...obj, id: (obj._id as { toString(): string })?.toString(), _id: undefined, __v: undefined }, { status: 201 });
  } catch (err) {
    console.error('[API/arsip POST]', err);
    return NextResponse.json({ error: 'Gagal menyimpan data arsip' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.all) return denied();
    await dbConnect();
    const { id, ...changes } = await req.json();
    lockRt(scope, changes);
    const denyOwn = await ownershipDenied(scope, ArsipModel, id);
    if (denyOwn) return denyOwn;
    const doc = await ArsipModel.findByIdAndUpdate(id, changes, { new: true });
    if (!doc) return NextResponse.json({ error: 'Arsip tidak ditemukan' }, { status: 404 });
    const obj = doc.toObject() as Record<string, unknown>;
    return NextResponse.json({ ...obj, id: doc._id.toString(), _id: undefined, __v: undefined });
  } catch (err) {
    console.error('[API/arsip PATCH]', err);
    return NextResponse.json({ error: 'Gagal mengubah arsip' }, { status: 500 });
  }
}

// DELETE /api/arsip?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.all) return denied();
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    const denyOwn = await ownershipDenied(scope, ArsipModel, id);
    if (denyOwn) return denyOwn;
    const doc = await ArsipModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/arsip DELETE]', err);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
