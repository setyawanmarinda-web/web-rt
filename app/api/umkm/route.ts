// app/api/umkm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { UMKMModel } from '@/lib/mongoose';
import { getScope, denied, rtQuery, forceRt, lockRt, ownershipDenied } from '@/lib/scope.server';

export async function GET(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();
    const rt = req.nextUrl.searchParams.get('rt');
    const query = rtQuery(scope, rt);
    const docs = await UMKMModel.find(query).sort({ _id: -1 }).lean();
    const data = docs.map((d) => {
      const obj = { ...d } as Record<string, unknown>;
      obj.id = (obj._id as { toString(): string })?.toString();
      delete obj._id; delete obj.__v;
      return obj;
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/umkm GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil data UMKM' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.canWrite) return denied();
    await dbConnect();
    const body = await req.json();
    forceRt(scope, body);
    const doc = await UMKMModel.create(body);
    const obj = doc.toObject() as Record<string, unknown>;
    return NextResponse.json({ ...obj, id: (obj._id as { toString(): string })?.toString(), _id: undefined, __v: undefined }, { status: 201 });
  } catch (err) {
    console.error('[API/umkm POST]', err);
    return NextResponse.json({ error: 'Gagal menyimpan data UMKM' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.canWrite) return denied();
    await dbConnect();
    const { id, ...changes } = await req.json();
    lockRt(scope, changes);
    const denyOwn = await ownershipDenied(scope, UMKMModel, id);
    if (denyOwn) return denyOwn;
    const doc = await UMKMModel.findByIdAndUpdate(id, changes, { new: true });
    if (!doc) return NextResponse.json({ error: 'UMKM tidak ditemukan' }, { status: 404 });
    const obj = doc.toObject() as Record<string, unknown>;
    return NextResponse.json({ ...obj, id: doc._id.toString(), _id: undefined, __v: undefined });
  } catch (err) {
    console.error('[API/umkm PATCH]', err);
    return NextResponse.json({ error: 'Gagal mengubah data UMKM' }, { status: 500 });
  }
}

// DELETE /api/umkm?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.canWrite) return denied();
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    const denyOwn = await ownershipDenied(scope, UMKMModel, id);
    if (denyOwn) return denyOwn;
    const doc = await UMKMModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/umkm DELETE]', err);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
