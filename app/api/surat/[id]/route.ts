import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Surat } from '@/lib/mongoose';
import { Types } from 'mongoose';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const updated = await Surat.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Surat not found' }, { status: 404 });
    }

    return NextResponse.json({ id: updated._id, ...updated.toObject() });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
