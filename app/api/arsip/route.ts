import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Arsip } from '@/lib/mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const list = await Arsip.find().sort({ created_at: -1 });
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const newItem = new Arsip({
      ...body,
      tanggal_upload: new Date().toISOString().split('T')[0]
    });
    const saved = await newItem.save();
    return NextResponse.json({ id: saved._id, ...saved.toObject() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
