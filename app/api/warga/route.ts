import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Warga } from '@/lib/mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const rt = searchParams.get('rt');

    let query = {};
    if (rt && rt !== 'ALL') {
      query = { rt };
    }

    const wargaList = await Warga.find(query).sort({ created_at: -1 });
    
    return NextResponse.json(wargaList);
  } catch (error) {
    console.error('GET /api/warga error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data warga' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validasi
    if (!body.nama_lengkap || !body.alamat) {
      return NextResponse.json(
        { error: 'Nama lengkap dan alamat wajib diisi' },
        { status: 400 }
      );
    }

    const newWarga = new Warga({
      nama_lengkap: body.nama_lengkap,
      tanggal_lahir: body.tanggal_lahir || '',
      status_tinggal: body.status_tinggal || 'Tetap',
      rt: body.rt || '002',
      rw: body.rw || '012',
      no_hp: body.no_hp || '',
      alamat: body.alamat,
    });

    const saved = await newWarga.save();

    return NextResponse.json(
      {
        id: saved._id,
        ...saved.toObject()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/warga error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan data warga' },
      { status: 500 }
    );
  }
}
