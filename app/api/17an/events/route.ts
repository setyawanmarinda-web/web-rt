// app/api/17an/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { EventModel, EVENT_KATEGORI, EVENT_STATUS } from '@/lib/event/models';
import { requireLogin, requireMaster, fail, toJson } from '@/lib/event/guard';

type Body = Record<string, unknown>;

// Whitelist field + validasi; mengembalikan string error atau data bersih.
function clean(body: Body, partial: boolean): { error: string } | { data: Body } {
  const data: Body = {};
  const str = (k: string, max: number, required = false) => {
    const v = body[k];
    if (v === undefined) return required && !partial ? `${k} wajib diisi` : null;
    if (typeof v !== 'string' || (required && !v.trim())) return `${k} tidak valid`;
    if (v.length > max) return `${k} terlalu panjang`;
    data[k] = v.trim();
    return null;
  };
  const errs = [
    str('judul', 150, true), str('deskripsi', 2000), str('waktu', 20), str('lokasi', 150), str('tanggal', 10, true),
  ].filter(Boolean);
  if (errs.length) return { error: errs[0]! };
  if (data.tanggal !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.tanggal as string)) return { error: 'tanggal harus YYYY-MM-DD' };
  if (body.kategori !== undefined) {
    if (!EVENT_KATEGORI.includes(body.kategori as never)) return { error: 'kategori tidak valid' };
    data.kategori = body.kategori;
  } else if (!partial) return { error: 'kategori wajib diisi' };
  if (body.status !== undefined) {
    if (!EVENT_STATUS.includes(body.status as never)) return { error: 'status tidak valid' };
    data.status = body.status;
  }
  return { data };
}

export async function GET() {
  const g = await requireLogin();
  if ('res' in g) return g.res;
  try {
    await dbConnect();
    const docs = await EventModel.find().sort({ tanggal: 1, waktu: 1 }).lean();
    return NextResponse.json(docs.map(toJson));
  } catch (e) {
    console.error('[API/17an/events GET]', e);
    return fail(500, 'Gagal mengambil agenda');
  }
}

export async function POST(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const c = clean(await req.json(), false);
    if ('error' in c) return fail(400, c.error);
    await dbConnect();
    const doc = await EventModel.create({ ...c.data, dibuat_oleh: g.actor.username });
    return NextResponse.json(toJson(doc.toObject()), { status: 201 });
  } catch (e) {
    console.error('[API/17an/events POST]', e);
    return fail(500, 'Gagal menyimpan agenda');
  }
}

export async function PATCH(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const { id, ...rest } = await req.json();
    if (!id || typeof id !== 'string') return fail(400, 'ID tidak diberikan');
    const c = clean(rest, true);
    if ('error' in c) return fail(400, c.error);
    await dbConnect();
    const doc = await EventModel.findByIdAndUpdate(id, { ...c.data, updated_at: new Date().toISOString() }, { new: true, runValidators: true }).lean();
    if (!doc) return fail(404, 'Agenda tidak ditemukan');
    return NextResponse.json(toJson(doc));
  } catch (e) {
    console.error('[API/17an/events PATCH]', e);
    return fail(500, 'Gagal mengubah agenda');
  }
}

export async function DELETE(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return fail(400, 'ID tidak diberikan');
    await dbConnect();
    const doc = await EventModel.findByIdAndDelete(id);
    if (!doc) return fail(404, 'Agenda tidak ditemukan');
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[API/17an/events DELETE]', e);
    return fail(500, 'Gagal menghapus agenda');
  }
}
