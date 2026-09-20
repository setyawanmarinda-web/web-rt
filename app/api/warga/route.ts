// app/api/warga/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { WargaModel } from '@/lib/mongoose';

// Helper: convert Mongoose doc ke plain object dengan id string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlain(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj._id?.toString(), _id: undefined, __v: undefined };
}

// GET /api/warga?rt=002   (tanpa rt = semua)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const rt = req.nextUrl.searchParams.get('rt');
    const query = rt && rt !== 'ALL' ? { rt } : {};
    const docs = await WargaModel.find(query).sort({ created_at: -1 }).lean();
    const data = docs.map((d) => {
      const obj = { ...d } as Record<string, unknown>;
      obj.id = (obj._id as { toString(): string })?.toString();
      obj.nominal_iuran = Number(obj.nominal_iuran ?? 0);
      delete obj._id;
      delete obj.__v;
      return obj;
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[API/warga GET]', err);
    return NextResponse.json({ error: 'Gagal mengambil data warga' }, { status: 500 });
  }
}

// POST /api/warga
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    if (!/^\d{16}$/.test(String(body.nik ?? ''))) {
      return NextResponse.json({ error: 'NIK wajib terdiri dari tepat 16 angka' }, { status: 400 });
    }
    const nominalIuran = Number(body.nominal_iuran ?? 0);
    if (!Number.isFinite(nominalIuran) || nominalIuran < 0) {
      return NextResponse.json({ error: 'Nominal iuran harus berupa angka 0 atau lebih' }, { status: 400 });
    }
    const doc = await WargaModel.create({ ...body, nominal_iuran: nominalIuran });
    return NextResponse.json(toPlain(doc), { status: 201 });
  } catch (err) {
    console.error('[API/warga POST]', err);
    return NextResponse.json({ error: 'Gagal menyimpan data warga' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const { id, ...changes } = await req.json();
    if (changes.nik !== undefined && !/^\d{16}$/.test(String(changes.nik))) {
      return NextResponse.json({ error: 'NIK wajib terdiri dari tepat 16 angka' }, { status: 400 });
    }
    if (changes.nominal_iuran !== undefined) {
      const nominalIuran = Number(changes.nominal_iuran);
      if (!Number.isFinite(nominalIuran) || nominalIuran < 0) {
        return NextResponse.json({ error: 'Nominal iuran harus berupa angka 0 atau lebih' }, { status: 400 });
      }
      changes.nominal_iuran = nominalIuran;
    }
    const doc = await WargaModel.findByIdAndUpdate(
      id,
      { $set: changes },
      { new: true, runValidators: true, strict: false },
    );
    if (!doc) return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    return NextResponse.json(toPlain(doc));
  } catch (err) {
    console.error('[API/warga PATCH]', err);
    return NextResponse.json({ error: 'Gagal mengubah data warga' }, { status: 500 });
  }
}

// DELETE /api/warga?id=xyz
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    const doc = await WargaModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/warga DELETE]', err);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
