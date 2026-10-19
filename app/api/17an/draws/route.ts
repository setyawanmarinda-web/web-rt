// app/api/17an/draws/route.ts
// Undian doorprize. Hasil ditentukan di sini (backend); GET untuk semua akun login, tulis hanya master.
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { DrawModel } from '@/lib/event/models';
import { WargaModel } from '@/lib/mongoose';
import { requireLogin, requireMaster, fail, toJson } from '@/lib/event/guard';
import { listHash, commitmentOf, finalSeed, runDraw, applyAbsent } from '@/lib/event/draw';

/* eslint-disable @typescript-eslint/no-explicit-any */
const DRAND = 'https://api.drand.sh/public/latest';
const newId = (p: string) => p + randomBytes(5).toString('hex');
const log = (doc: any, by: string, action: string, detail = '') => doc.audit.push({ at: new Date().toISOString(), by, action, detail });

async function fetchDrand(): Promise<{ round: number; randomness: string; signature: string } | null> {
  try {
    const r = await fetch(DRAND, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (typeof j.round !== 'number' || !/^[0-9a-f]{64}$/.test(j.randomness)) return null;
    return { round: j.round, randomness: j.randomness, signature: String(j.signature ?? '') };
  } catch { return null; }
}

const publicView = (d: any) => {
  const o = toJson(d.toObject ? d.toObject() : d) as any;
  delete o.server_seed; // tidak pernah dikirim; hasil.server_seed hanya terisi setelah disahkan
  return o;
};

export async function GET(req: NextRequest) {
  const g = await requireLogin();
  if ('res' in g) return g.res;
  try {
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (id) {
      const doc = await DrawModel.findById(id).lean();
      if (!doc) return fail(404, 'Undian tidak ditemukan');
      return NextResponse.json(publicView(doc));
    }
    const docs: any[] = await DrawModel.find({}, 'nama status prizes participants created_at putaran seri_id').sort({ created_at: -1 }).lean();
    return NextResponse.json(docs.map((d) => ({ id: String(d._id), nama: d.nama, status: d.status, putaran: d.putaran ?? 1, jumlah_hadiah: d.prizes?.length ?? 0, jumlah_peserta: d.participants?.length ?? 0 })));
  } catch (e) {
    console.error('[API/17an/draws GET]', e);
    return fail(500, 'Gagal mengambil undian');
  }
}

export async function POST(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const b = await req.json();
    await dbConnect();

    // Putaran berikutnya: undian baru dari undian yang sudah disahkan (peserta tersisa; pemenang sebelumnya keluar bila tidak boleh menang ganda).
    if (typeof b.from_id === 'string' && b.from_id) {
      const parent: any = await DrawModel.findById(b.from_id).lean();
      if (!parent) return fail(404, 'Undian asal tidak ditemukan');
      if (parent.status !== 'disahkan') return fail(409, 'Sahkan hasil putaran ini dulu sebelum membuat putaran berikutnya');
      const won = new Set<string>((parent.result?.winners ?? []).map((w: any) => w.participantId));
      const rest = parent.allow_multi_win ? parent.participants : parent.participants.filter((p: any) => !won.has(p.id));
      if (!rest.length) return fail(400, 'Semua peserta sudah menang; tidak ada peserta tersisa untuk putaran berikutnya');
      const putaran = (parent.putaran ?? 1) + 1;
      const base = String(parent.nama).replace(/\s+—\s+Putaran\s+\d+$/i, '');
      const nama = (typeof b.nama === 'string' && b.nama.trim() ? b.nama.trim() : `${base} — Putaran ${putaran}`).slice(0, 100);
      const doc = await DrawModel.create({
        nama, putaran, parent_id: String(parent._id), seri_id: parent.seri_id ?? String(parent._id), allow_multi_win: parent.allow_multi_win,
        participants: rest.map((p: any) => ({ id: p.id, nama: p.nama, alamat: p.alamat, warga_id: p.warga_id })),
        audit: [{ at: new Date().toISOString(), by: g.actor.username, action: 'buat-putaran', detail: `putaran ${putaran} dari "${parent.nama}" · peserta tersisa ${rest.length}` }],
      });
      return NextResponse.json(publicView(doc), { status: 201 });
    }

    const nama = typeof b.nama === 'string' ? b.nama.trim() : '';
    if (!nama || nama.length > 100) return fail(400, 'Nama undian wajib diisi (maks 100 karakter)');
    const doc = await DrawModel.create({ nama, audit: [{ at: new Date().toISOString(), by: g.actor.username, action: 'buat', detail: nama }] });
    return NextResponse.json(publicView(doc), { status: 201 });
  } catch (e) {
    console.error('[API/17an/draws POST]', e);
    return fail(500, 'Gagal membuat undian');
  }
}

export async function DELETE(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return fail(400, 'ID tidak diberikan');
    await dbConnect();
    const doc: any = await DrawModel.findById(id, 'status');
    if (!doc) return fail(404, 'Undian tidak ditemukan');
    if (doc.status !== 'draft') return fail(409, 'Hanya undian berstatus draft yang bisa dihapus (bukti undian harus tetap tersimpan)');
    await doc.deleteOne();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[API/17an/draws DELETE]', e);
    return fail(500, 'Gagal menghapus undian');
  }
}

export async function PATCH(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  const by = g.actor.username;
  try {
    const body = await req.json();
    const { id, action } = body;
    if (typeof id !== 'string' || typeof action !== 'string') return fail(400, 'id dan action wajib');
    await dbConnect();
    const doc: any = await DrawModel.findById(id).select('+server_seed');
    if (!doc) return fail(404, 'Undian tidak ditemukan');
    const done = async () => { await doc.save(); return NextResponse.json(publicView(doc)); };
    const editable = doc.status === 'draft';
    const needDraft = () => (editable ? null : fail(409, 'Daftar sudah dikunci; hanya bisa diubah dengan membatalkan kunci/hasil'));

    switch (action) {
      case 'rename': { // judul boleh diganti kapan saja (tercatat di riwayat); aturan & daftar tetap terkunci sesuai status
        const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
        if (!nama || nama.length > 100) return fail(400, 'Judul wajib diisi (maks 100 karakter)');
        const old = doc.nama;
        doc.nama = nama;
        log(doc, by, 'ganti-judul', `"${old}" → "${nama}"`);
        return done();
      }

      case 'rules': {
        const e = needDraft(); if (e) return e;
        if (typeof body.nama === 'string' && body.nama.trim()) doc.nama = body.nama.trim().slice(0, 100);
        if (typeof body.allow_multi_win === 'boolean') doc.allow_multi_win = body.allow_multi_win;
        if (body.prizes !== undefined) {
          if (!Array.isArray(body.prizes) || body.prizes.length > 100) return fail(400, 'Daftar hadiah tidak valid (maks 100)');
          const ids = new Set<string>();
          doc.prizes = body.prizes.map((p: any, i: number) => {
            const nama = (typeof p?.nama === 'string' ? p.nama.trim() : '') || `Hadiah ${i + 1}`; // nama hadiah opsional
            const jumlah = Number(p?.jumlah);
            if (nama.length > 100 || !Number.isInteger(jumlah) || jumlah < 1 || jumlah > 1000) throw new Error('HADIAH');
            const pid = typeof p.id === 'string' && p.id && !ids.has(p.id) ? p.id : newId('h');
            ids.add(pid);
            return { id: pid, nama, jumlah };
          });
        }
        log(doc, by, 'atur-aturan');
        return done();
      }

      case 'import-warga': { // ambil dari data warga; hanya id|nama|alamat yang disimpan (tanpa NIK)
        const e = needDraft(); if (e) return e;
        const q: Record<string, unknown> = {};
        if (typeof body.rt === 'string' && body.rt && body.rt !== 'ALL') q.rt = body.rt;
        if (body.status_tinggal === 'Tetap' || body.status_tinggal === 'Kontrak') q.status_tinggal = body.status_tinggal;
        const warga: any[] = await WargaModel.find(q, 'nama_lengkap alamat').lean();
        const have = new Set(doc.participants.map((p: any) => p.warga_id).filter(Boolean));
        let added = 0;
        for (const w of warga) {
          const wid = String(w._id);
          if (have.has(wid)) continue;
          doc.participants.push({ id: 'w' + wid, nama: w.nama_lengkap, alamat: w.alamat ?? '', warga_id: wid });
          added++;
        }
        if (doc.participants.length > 20000) return fail(400, 'Terlalu banyak peserta');
        log(doc, by, 'impor-warga', `+${added} (rt=${q.rt ?? 'semua'})`);
        return done();
      }

      case 'add-bulk': { // tempel banyak peserta: satu per baris, "Nama | Alamat"
        const e = needDraft(); if (e) return e;
        if (typeof body.text !== 'string' || body.text.length > 500000) return fail(400, 'Teks tidak valid');
        const rows = body.text.split('\n').map((l: string) => l.trim()).filter(Boolean);
        if (!rows.length) return fail(400, 'Tidak ada baris untuk ditambahkan');
        if (doc.participants.length + rows.length > 20000) return fail(400, 'Terlalu banyak peserta');
        for (const row of rows) {
          const [nama, alamat] = row.split('|').map((x: string) => x.trim());
          if (!nama || nama.length > 80) return fail(400, `Nama tidak valid (maks 80 karakter): "${row.slice(0, 40)}"`);
          doc.participants.push({ id: newId('m'), nama, alamat: (alamat ?? '').slice(0, 150) });
        }
        log(doc, by, 'tempel-peserta', `+${rows.length}`);
        return done();
      }

      case 'add-manual': {
        const e = needDraft(); if (e) return e;
        const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
        if (!nama || nama.length > 80) return fail(400, 'Nama wajib diisi (maks 80 karakter)');
        doc.participants.push({ id: newId('m'), nama, alamat: typeof body.alamat === 'string' ? body.alamat.trim().slice(0, 150) : '' });
        log(doc, by, 'tambah-peserta', nama);
        return done();
      }

      case 'remove-participant': {
        const e = needDraft(); if (e) return e;
        const before = doc.participants.length;
        doc.participants = doc.participants.filter((p: any) => p.id !== body.participantId);
        if (doc.participants.length === before) return fail(404, 'Peserta tidak ditemukan');
        log(doc, by, 'hapus-peserta', String(body.participantId));
        return done();
      }

      case 'clear-participants': {
        const e = needDraft(); if (e) return e;
        doc.participants = [];
        log(doc, by, 'kosongkan-peserta');
        return done();
      }

      case 'lock': { // kunci daftar + commitment
        const e = needDraft(); if (e) return e;
        if (!doc.participants.length) return fail(400, 'Isi daftar peserta terlebih dahulu');
        if (!doc.prizes.length) { // hadiah tidak wajib: tanpa hadiah = satu undian "Pemenang" dengan jumlah yang dipilih
          const jml = Number.isInteger(body.jumlah_pemenang) && body.jumlah_pemenang >= 1 && body.jumlah_pemenang <= 1000 ? body.jumlah_pemenang : 1;
          doc.prizes = [{ id: newId('h'), nama: 'Pemenang', jumlah: jml }];
        }
        const parts = doc.participants.map((p: any) => ({ id: p.id, nama: p.nama, alamat: p.alamat }));
        const seed = randomBytes(32).toString('hex');
        const d = await fetchDrand();
        doc.server_seed = seed;
        doc.lock = {
          list_hash: await listHash(parts), commitment: await commitmentOf(seed),
          drand_round: d?.round, locked_at: new Date().toISOString(), locked_by: by,
        };
        doc.status = 'terkunci';
        log(doc, by, 'kunci-daftar', `peserta=${parts.length} hash=${doc.lock.list_hash.slice(0, 12)}…`);
        return done();
      }

      case 'unlock': { // batal kunci sebelum undian dijalankan
        if (doc.status !== 'terkunci') return fail(409, 'Hanya daftar terkunci (belum diundi) yang bisa dibuka');
        doc.status = 'draft'; doc.lock = undefined; doc.server_seed = undefined;
        log(doc, by, 'buka-kunci');
        return done();
      }

      case 'run': {
        // Klaim atomik agar tidak bisa dijalankan dua kali (klik ganda / dua admin).
        const claimed = await DrawModel.findOneAndUpdate({ _id: id, status: 'terkunci' }, { status: 'menjalankan' });
        if (!claimed) return fail(409, 'Undian hanya bisa dijalankan sekali dari status terkunci');
        try {
          const fresh: any = await DrawModel.findById(id).select('+server_seed');
          const parts = fresh.participants.map((p: any) => ({ id: p.id, nama: p.nama, alamat: p.alamat }));
          if ((await listHash(parts)) !== fresh.lock.list_hash) throw new Error('Daftar peserta tidak cocok dengan hash terkunci');
          const d = await fetchDrand();
          const usable = d && fresh.lock.drand_round && d.round > fresh.lock.drand_round;
          const randomness = usable ? d.randomness : '';
          const seed = await finalSeed(fresh.server_seed, randomness, fresh.lock.list_hash);
          const winners = await runDraw(seed, parts, fresh.prizes.map((p: any) => ({ id: p.id, nama: p.nama, jumlah: p.jumlah })), fresh.allow_multi_win);
          fresh.result = {
            seed, source: usable ? 'drand' : 'server-only', drand_round: usable ? d.round : undefined,
            drand_randomness: randomness || undefined, drand_signature: usable ? d.signature : undefined,
            winners, ran_at: new Date().toISOString(), ran_by: by,
          };
          fresh.status = 'selesai';
          log(fresh, by, 'jalankan-undian', `sumber=${fresh.result.source} pemenang=${winners.length}`);
          await fresh.save();
          return NextResponse.json(publicView(fresh));
        } catch (err) {
          await DrawModel.updateOne({ _id: id, status: 'menjalankan' }, { status: 'terkunci' });
          throw err;
        }
      }

      case 'reveal': { // satu putaran roda selesai: pemenang tersimpan otomatis (aman bila halaman tertutup)
        if (doc.status !== 'selesai') return fail(409, 'Undian tidak sedang berjalan');
        const ws = doc.result.winners;
        const idx = Number(body.index);
        const first = ws.findIndex((w: any) => !w.revealed);
        if (!Number.isInteger(idx) || idx !== first) return fail(409, 'Urutan putaran tidak sesuai; muat ulang halaman');
        ws[idx].revealed = true;
        ws[idx].revealed_at = new Date().toISOString();
        const nama = doc.participants.find((p: any) => p.id === ws[idx].participantId)?.nama ?? '?';
        const hadiah = doc.prizes.find((p: any) => p.id === ws[idx].prizeId)?.nama ?? '';
        log(doc, by, 'putar', `#${ws.filter((w: any) => w.revealed).length} ${nama} — ${hadiah}`);
        doc.markModified('result.winners');
        return done();
      }

      case 'absent': { // pemenang dipanggil tetapi tidak hadir: undi ulang pengganti; yang bersangkutan tetap boleh ikut undian berikutnya
        if (doc.status !== 'selesai') return fail(409, 'Hanya bisa sebelum hasil disahkan');
        const idx = Number(body.index);
        const cur = doc.result.winners[idx];
        if (!cur || !cur.revealed) return fail(400, 'Pemenang belum diumumkan');
        const plain = doc.result.winners.map((w: any) => ({ prizeId: w.prizeId, participantId: w.participantId, revealed: !!w.revealed, absent: !!w.absent, revealed_at: w.revealed_at }));
        const n = (doc.result.redraws?.length ?? 0) + 1;
        const res = await applyAbsent(plain, idx, doc.participants.map((p: any) => p.id), doc.allow_multi_win, doc.result.seed, n);
        if ('error' in res) return fail(409, res.error);
        const nama = (id: string) => doc.participants.find((p: any) => p.id === id)?.nama ?? '?';
        doc.result.winners = res.winners;
        doc.result.redraws.push({ n, prizeId: cur.prizeId, absentId: cur.participantId, newId: res.newId, at: new Date().toISOString(), by });
        log(doc, by, 'tidak-hadir', `${nama(cur.participantId)} → pengganti ${nama(res.newId)} (undi ulang #${n})`);
        doc.markModified('result');
        return done();
      }

      case 'certify': {
        if (doc.status !== 'selesai') return fail(409, 'Hanya hasil yang sudah diundi yang bisa disahkan');
        if (doc.result.winners.some((w: any) => !w.revealed)) return fail(409, 'Masih ada pemenang yang belum diputar');
        doc.result.server_seed = doc.server_seed; // dibuka agar bisa diverifikasi publik
        doc.status = 'disahkan';
        log(doc, by, 'sahkan-hasil');
        return done();
      }

      case 'void': { // batalkan hasil SEBELUM disahkan; jejaknya tetap tampil di bukti
        if (doc.status !== 'selesai') return fail(409, 'Hanya hasil yang belum disahkan yang bisa dibatalkan (hasil sah tidak bisa diganti)');
        const reason = typeof body.alasan === 'string' ? body.alasan.trim().slice(0, 300) : '';
        if (!reason) return fail(400, 'Alasan pembatalan wajib diisi');
        doc.voided.push({ at: new Date().toISOString(), by, reason, lock: doc.lock, result: { ...doc.result.toObject(), server_seed: doc.server_seed } });
        doc.result = undefined; doc.lock = undefined; doc.server_seed = undefined; doc.status = 'draft';
        log(doc, by, 'batalkan-hasil', reason);
        return done();
      }

      default:
        return fail(400, 'action tidak dikenal');
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'HADIAH') return fail(400, 'Hadiah: jumlah pemenang 1–1000, nama maks 100 karakter');
    console.error('[API/17an/draws PATCH]', e);
    return fail(500, 'Gagal memproses undian');
  }
}
