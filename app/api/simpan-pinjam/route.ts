import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SimpanPinjamModel } from '@/lib/mongoose';
import { getScope, denied, rtQuery, forceRt, lockRt, ownershipDenied } from '@/lib/scope.server';

function serialize(doc: Record<string, unknown>) {
  const item = { ...doc };
  item.id = String(item._id);
  delete item._id;
  delete item.__v;
  return item;
}

export async function GET(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();
    const rt = req.nextUrl.searchParams.get('rt');
    const query = rtQuery(scope, rt);
    const docs = await SimpanPinjamModel.find(query).sort({ tanggal_transaksi: -1, created_at: -1 }).lean();
    return NextResponse.json(docs.map((doc) => serialize(doc as Record<string, unknown>)));
  } catch (error) {
    console.error('[API/simpan-pinjam GET]', error);
    return NextResponse.json({ error: 'Gagal mengambil data simpan pinjam' }, { status: 500 });
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
    if (!body.nama || !body.alamat || !['Simpan', 'Pinjam', 'Cicilan'].includes(body.jenis) || Number(body.nominal) <= 0) {
      return NextResponse.json({ error: 'Data transaksi simpan pinjam tidak valid' }, { status: 400 });
    }
    if (body.jenis === 'Pinjam' && ![3, 6, 12].includes(Number(body.tenor_bulan))) {
      return NextResponse.json({ error: 'Tenor pinjaman harus 3, 6, atau 12 bulan' }, { status: 400 });
    }
    if (body.jenis === 'Pinjam' && (body.bunga_persen === undefined || Number(body.bunga_persen) < 0)) {
      return NextResponse.json({ error: 'Bunga pinjaman tidak valid' }, { status: 400 });
    }
    const doc = await SimpanPinjamModel.create({ ...body, nominal: Number(body.nominal) });
    return NextResponse.json(serialize(doc.toObject() as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error('[API/simpan-pinjam POST]', error);
    return NextResponse.json({ error: 'Gagal menyimpan transaksi simpan pinjam' }, { status: 500 });
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
    const denyOwn = await ownershipDenied(scope, SimpanPinjamModel, id);
    if (denyOwn) return denyOwn;
    const doc = await SimpanPinjamModel.findByIdAndUpdate(id, changes, { new: true, runValidators: true });
    if (!doc) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    return NextResponse.json(serialize(doc.toObject() as Record<string, unknown>));
  } catch (error) {
    console.error('[API/simpan-pinjam PATCH]', error);
    return NextResponse.json({ error: 'Gagal mengubah transaksi simpan pinjam' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.canWrite) return denied();
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID transaksi wajib diisi' }, { status: 400 });
    const denyOwn = await ownershipDenied(scope, SimpanPinjamModel, id);
    if (denyOwn) return denyOwn;
    const doc = await SimpanPinjamModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/simpan-pinjam DELETE]', error);
    return NextResponse.json({ error: 'Gagal menghapus transaksi simpan pinjam' }, { status: 500 });
  }
}
