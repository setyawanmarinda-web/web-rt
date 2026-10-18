// app/api/warga/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { WargaModel } from '@/lib/mongoose';
import { getScope, denied, rtQuery, canAccessRt, type Scope } from '@/lib/scope.server';
import { alamatKey, alamatSama } from '@/lib/alamat';

// Helper: convert Mongoose doc ke plain object dengan id string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlain(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj._id?.toString(), _id: undefined, __v: undefined };
}

// ─── Akun warga: hanya boleh menyentuh data rumahnya sendiri ─────────────────
// Username akun warga = alamat rumahnya. Pencocokan memakai alamatKey (bukan teks mentah).
const WARGA_EDITABLE = ['nama_lengkap', 'nik', 'tanggal_lahir', 'hubungan', 'no_hp'] as const;

type RumahOk = { ok: true; members: Record<string, unknown>[] };
type RumahGagal = { ok: false; res: NextResponse };

// Sesi lama (login sebelum username dibawa di sesi) -> minta login ulang, bukan "ditolak".
function sesiPerluDiperbarui() {
  return NextResponse.json(
    { error: 'Sesi Anda perlu diperbarui. Silakan keluar lalu login ulang.' },
    { status: 401 },
  );
}

async function anggotaRumah(scope: Scope): Promise<RumahOk | RumahGagal> {
  if (!scope.username) return { ok: false, res: sesiPerluDiperbarui() };
  if (!alamatKey(scope.username)) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: 'Akun ini belum terhubung ke alamat rumah yang terbaca. Hubungi pengurus RT.' },
        { status: 422 },
      ),
    };
  }
  const docs = (await WargaModel.find({ rt: scope.rt }).lean()) as unknown as Record<string, unknown>[];
  return { ok: true, members: docs.filter((d) => alamatSama(d.alamat, scope.username)) };
}

const kosongkan = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function validasiBagianWarga(src: Record<string, unknown>, lengkap: boolean): { error?: string; data: Record<string, string> } {
  const data: Record<string, string> = {};
  if (lengkap || src.nama_lengkap !== undefined) {
    const nama = kosongkan(src.nama_lengkap);
    if (!nama) return { error: 'Nama wajib diisi', data };
    data.nama_lengkap = nama.slice(0, 120);
  }
  if (lengkap || src.nik !== undefined) {
    const nik = kosongkan(src.nik);
    if (!/^\d{16}$/.test(nik)) return { error: 'NIK wajib terdiri dari tepat 16 angka', data };
    data.nik = nik;
  }
  if (src.tanggal_lahir !== undefined) {
    const tgl = kosongkan(src.tanggal_lahir);
    if (tgl && !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) return { error: 'Format tanggal lahir tidak valid', data };
    data.tanggal_lahir = tgl;
  }
  if (src.hubungan !== undefined) data.hubungan = kosongkan(src.hubungan).slice(0, 40);
  if (src.no_hp !== undefined) {
    const hp = kosongkan(src.no_hp);
    if (hp && !/^[0-9+\-\s]{5,20}$/.test(hp)) return { error: 'Nomor HP tidak valid', data };
    data.no_hp = hp;
  }
  return { data };
}

async function wargaGet(scope: Scope) {
  const r = await anggotaRumah(scope);
  if (!r.ok) return r.res;
  const data = r.members
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
    .map((d) => {
      const obj = { ...d };
      obj.id = String(obj._id);
      obj.nominal_iuran = Number(obj.nominal_iuran ?? 0);
      delete obj._id;
      delete obj.__v;
      return obj;
    });
  return NextResponse.json(data);
}

async function wargaPost(scope: Scope, body: Record<string, unknown>) {
  const r = await anggotaRumah(scope);
  if (!r.ok) return r.res;
  if (r.members.length === 0) {
    return NextResponse.json({ error: 'Rumah Anda belum terdaftar. Hubungi pengurus RT.' }, { status: 422 });
  }
  const v = validasiBagianWarga(body, true);
  if (v.error) return NextResponse.json({ error: v.error }, { status: 400 });

  const daftarKk = [...new Set(r.members.map((m) => kosongkan(m.no_kk)).filter(Boolean))];
  const kkDipilih = kosongkan(body.no_kk);
  let noKk = '';
  if (kkDipilih) {
    if (!daftarKk.includes(kkDipilih)) {
      return NextResponse.json({ error: 'No KK harus KK yang sudah ada di rumah ini' }, { status: 400 });
    }
    noKk = kkDipilih;
  } else if (daftarKk.length === 1) {
    noKk = daftarKk[0];
  } else if (daftarKk.length > 1) {
    return NextResponse.json({ error: 'Pilih KK untuk anggota baru ini' }, { status: 400 });
  }

  if (await WargaModel.exists({ nik: v.data.nik })) {
    return NextResponse.json({ error: 'NIK sudah terdaftar. Hubungi pengurus RT bila ada kesalahan.' }, { status: 409 });
  }

  const rumah = r.members[0];
  const doc = await WargaModel.create({
    ...v.data,
    no_kk: noKk,
    rt: scope.rt,
    rw: rumah.rw ?? '012',
    alamat: rumah.alamat,
    status_tinggal: rumah.status_tinggal,
    nominal_iuran: 0,
    ikut_iuran_kk: false,
    anggota_simpin: false,
  });
  return NextResponse.json(toPlain(doc), { status: 201 });
}

async function wargaPatch(scope: Scope, id: unknown, changes: Record<string, unknown>) {
  const r = await anggotaRumah(scope);
  if (!r.ok) return r.res;
  if (!r.members.some((m) => String(m._id) === String(id))) return denied();

  // hanya field yang boleh diubah warga; field lain diabaikan
  const src: Record<string, unknown> = {};
  for (const k of WARGA_EDITABLE) if (changes[k] !== undefined) src[k] = changes[k];
  const v = validasiBagianWarga(src, false);
  if (v.error) return NextResponse.json({ error: v.error }, { status: 400 });
  if (Object.keys(v.data).length === 0) {
    return NextResponse.json({ error: 'Tidak ada data yang diubah' }, { status: 400 });
  }
  if (v.data.nik && (await WargaModel.exists({ nik: v.data.nik, _id: { $ne: id } }))) {
    return NextResponse.json({ error: 'NIK sudah terdaftar pada warga lain' }, { status: 409 });
  }
  const doc = await WargaModel.findByIdAndUpdate(id, { $set: v.data }, { new: true, runValidators: true });
  if (!doc) return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
  return NextResponse.json(toPlain(doc));
}

// GET /api/warga?rt=002   (master/admin_rw: tanpa rt = semua; akun RT: selalu RT sendiri)
export async function GET(req: NextRequest) {
  try {
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();
    if (scope.role === 'warga') return await wargaGet(scope);
    const query = rtQuery(scope, req.nextUrl.searchParams.get('rt'));
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
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();
    const body = await req.json();
    if (scope.role === 'warga') return await wargaPost(scope, body);
    if (!scope.canWrite) return denied();
    if (!scope.all) body.rt = scope.rt;
    if (!canAccessRt(scope, body.rt)) return denied();
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
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    await dbConnect();
    const { id, ...changes } = await req.json();
    if (scope.role === 'warga') return await wargaPatch(scope, id, changes);
    if (!scope.canWrite) return denied();
    const existing = (await WargaModel.findById(id).lean()) as { rt?: string } | null;
    if (!existing) return NextResponse.json({ error: 'Warga tidak ditemukan' }, { status: 404 });
    if (!canAccessRt(scope, existing.rt)) return denied();
    if (!scope.all) delete changes.rt;
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
    const scope = await getScope();
    if (!scope) return denied(401, 'Belum login');
    if (!scope.canWrite) return denied();
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    const existing = (await WargaModel.findById(id).lean()) as { rt?: string } | null;
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    if (!canAccessRt(scope, existing.rt)) return denied();
    await WargaModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/warga DELETE]', err);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
