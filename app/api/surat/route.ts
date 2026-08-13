import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Surat } from '@/lib/mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const rt = searchParams.get('rt');
    let query = rt && rt !== 'ALL' ? { rt } : {};
    const list = await Surat.find(query).sort({ created_at: -1 });
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Generate no_surat
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);
    const no_surat = `SRT/${year}/${month}/${random}`;

    const newItem = new Surat({
      ...body,
      no_surat,
      tanggal_pengajuan: new Date().toISOString().split('T')[0]
    });
    const saved = await newItem.save();
    return NextResponse.json({ id: saved._id, ...saved.toObject() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
