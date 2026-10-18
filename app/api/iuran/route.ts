import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { IuranKewajibanModel } from '@/lib/mongoose';
import { getScope, denied, forceRt, ownershipDenied } from '@/lib/scope.server';

export async function GET(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const rt = searchParams.get('rt');
    const tahun = searchParams.get('tahun');
    const warga_id = searchParams.get('warga_id');

    const query: Record<string, unknown> = {};

    if (!scope.all) query.rt = scope.rt;
    else if (rt && rt !== 'ALL') query.rt = rt;
    if (tahun) query.tahun = Number(tahun);
    if (warga_id) query.warga_id = warga_id;

    const docs = await IuranKewajibanModel.find(query)
      .sort({ tahun: 1, bulan: 1 })
      .lean();

    const data = docs.map((doc) => {
      const item = { ...doc } as Record<string, unknown>;
      item.id = String(item._id);
      delete item._id;
      delete item.__v;
      return item;
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/iuran error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data iuran' },
      { status: 500 }
    );
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

    const doc = await IuranKewajibanModel.create(body);

    const data = doc.toObject() as Record<string, unknown>;
    data.id = String(data._id);
    delete data._id;
    delete data.__v;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/iuran error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan kewajiban iuran' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.canWrite) return denied();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID iuran wajib diisi' },
        { status: 400 }
      );
    }

    const denyOwn = await ownershipDenied(scope, IuranKewajibanModel, id);
    if (denyOwn) return denyOwn;
    const deleted = await IuranKewajibanModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Data iuran tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/iuran error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data iuran' },
      { status: 500 }
    );
  }
}
