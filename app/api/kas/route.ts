import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { KasRT } from '@/lib/mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const rt = searchParams.get('rt');

    let query = {};
    if (rt && rt !== 'ALL') {
      query = { rt };
    }

    const kasList = await KasRT.find(query).sort({ created_at: -1 });
    
    return NextResponse.json(kasList);
  } catch (error) {
    console.error('GET /api/kas error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validasi
    if (!body.jumlah || body.jumlah <= 0) {
      return NextResponse.json(
        { error: 'Nominal harus lebih besar dari 0' },
        { status: 400 }
      );
    }

    const newKas = new KasRT({
      keterangan: body.keterangan || '',
      jumlah: body.jumlah,
      jenis: body.jenis || 'Masuk',
      pos: body.pos || 'Kas RT',
      rt: body.rt || '002',
      metode: body.metode || 'Transfer',
      nama_pembayar: body.nama_pembayar || '',
      perantara_list: body.perantara_list || [],
      rincian_split: body.rincian_split || '',
      diskon_keringanan: body.diskon_keringanan || false,
      tanggal_transaksi: body.tanggal_transaksi || new Date().toISOString().split('T')[0],
    });

    const saved = await newKas.save();

    return NextResponse.json(
      {
        id: saved._id,
        ...saved.toObject()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/kas error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan transaksi kas' },
      { status: 500 }
    );
  }
}
