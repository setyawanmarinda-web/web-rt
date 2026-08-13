import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Kegiatan } from '@/lib/mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const rt = searchParams.get('rt');

    let query = {};
    if (rt && rt !== 'ALL') {
      query = { rt };
    }

    const kegiatanList = await Kegiatan.find(query).sort({ created_at: -1 });
    return NextResponse.json(kegiatanList);
  } catch (error) {
    console.error('GET /api/kegiatan error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kegiatan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const newKegiatan = new Kegiatan({
      judul: body.judul,
      deskripsi: body.deskripsi || '',
      tanggal: body.tanggal,
      waktu: body.waktu || '',
      lokasi: body.lokasi || '',
      rt: body.rt || '002',
      kategori: body.kategori || 'Lainnya',
      status: body.status || 'Akan Datang',
    });

    const saved = await newKegiatan.save();
    return NextResponse.json({ id: saved._id, ...saved.toObject() }, { status: 201 });
  } catch (error) {
    console.error('POST /api/kegiatan error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan kegiatan' }, { status: 500 });
  }
}
