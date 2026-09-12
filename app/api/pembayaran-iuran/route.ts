import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PembayaranIuranModel } from '@/lib/mongoose';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const rt = searchParams.get('rt');
    const warga_id = searchParams.get('warga_id');

    const query: Record<string, unknown> = {};

    if (rt && rt !== 'ALL') query.rt = rt;
    if (warga_id) query.warga_id = warga_id;

    const docs = await PembayaranIuranModel.find(query)
      .sort({ tanggal_pembayaran: -1, created_at: -1 })
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
    console.error('GET /api/pembayaran-iuran error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pembayaran iuran' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const doc = await PembayaranIuranModel.create(body);

    const data = doc.toObject() as Record<string, unknown>;
    data.id = String(data._id);
    delete data._id;
    delete data.__v;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/pembayaran-iuran error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan pembayaran iuran' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID pembayaran wajib diisi' },
        { status: 400 }
      );
    }

    const deleted = await PembayaranIuranModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Data pembayaran tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/pembayaran-iuran error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus pembayaran iuran' },
      { status: 500 }
    );
  }
}
