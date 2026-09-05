// app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { InventoryModel } from '@/lib/mongoose';

// Helper: convert Mongoose doc ke plain object dengan id string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlain(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id?.toString(),
    _id: undefined,
    __v: undefined,
  };
}

// GET /api/inventory?rt=002
// tanpa rt = semua
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const rt = req.nextUrl.searchParams.get('rt');
    const query = rt && rt !== 'ALL' ? { rt } : {};

    const docs = await InventoryModel
      .find(query)
      .sort({ created_at: -1 })
      .lean();

    const data = docs.map((d) => {
      const obj = { ...d } as Record<string, unknown>;

      obj.id = (obj._id as { toString(): string })?.toString();

      delete obj._id;
      delete obj.__v;

      return obj;
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/inventory GET]', err);

    return NextResponse.json(
      { error: 'Gagal mengambil data inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const doc = await InventoryModel.create(body);

    return NextResponse.json(toPlain(doc), {
      status: 201,
    });
  } catch (err) {
    console.error('[API/inventory POST]', err);

    return NextResponse.json(
      { error: 'Gagal menyimpan data inventory' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID tidak diberikan' },
        { status: 400 }
      );
    }

    const doc = await InventoryModel.findByIdAndDelete(id);

    if (!doc) {
      return NextResponse.json(
        { error: 'Data inventory tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/inventory DELETE]', err);

    return NextResponse.json(
      { error: 'Gagal menghapus data inventory' },
      { status: 500 }
    );
  }
}