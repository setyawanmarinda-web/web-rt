import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Pengumuman } from '@/lib/mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const rt = searchParams.get('rt');
    let query = rt && rt !== 'ALL' ? { rt } : {};
    const list = await Pengumuman.find(query).sort({ created_at: -1 });
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const newItem = new Pengumuman(body);
    const saved = await newItem.save();
    return NextResponse.json({ id: saved._id, ...saved.toObject() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
