import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SuratModel } from '@/lib/mongoose';
import { Types } from 'mongoose';
import { getScope, denied, lockRt, ownershipDenied } from '@/lib/scope.server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.canWrite) return denied();
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    lockRt(scope, body);

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const denyOwn = await ownershipDenied(scope, SuratModel, id);
    if (denyOwn) return denyOwn;
    const updated = await SuratModel.findByIdAndUpdate(
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
