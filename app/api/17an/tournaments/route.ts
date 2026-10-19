// app/api/17an/tournaments/route.ts
// GET: semua akun login. POST/PATCH/DELETE: hanya master (divalidasi di backend).
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { TemplateModel, TournamentModel } from '@/lib/event/models';
import { koOnly, mergeIdx, slotsFromIdx, tataFromIndexed } from '@/lib/event/template';
import { sanitizeTata } from '@/lib/event/tata';
import { applyOps, parseOp, type Op, type OpState } from '@/lib/event/ops';
import { requireLogin, requireMaster, fail, toJson } from '@/lib/event/guard';
import {
  BYE, Match, Slot, buildSlots, validateSlots, buildKnockout,
  buildGroups, buildGroupMatches, standings, knockoutSlotsFromGroups, nextPow2, deriveStatus, findDuplicates,
  shuffle, ByePosition,
} from '@/lib/event/bracket';

/* eslint-disable @typescript-eslint/no-explicit-any */
const newId = () => 'p' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const hasPlayed = (ms: Match[]) => ms.some((m) => m.status === 'done');
const CONFIRM = 'Turnamen sudah berjalan. Perubahan ini akan memengaruhi hasil; kirim konfirmasi=true untuk melanjutkan.';

export async function GET(req: NextRequest) {
  const g = await requireLogin();
  if ('res' in g) return g.res;
  try {
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (id) {
      const doc = await TournamentModel.findById(id).lean();
      if (!doc) return fail(404, 'Turnamen tidak ditemukan');
      return NextResponse.json(toJson(doc));
    }
    const docs = await TournamentModel.find({}, 'nama cabang mode status participants created_at').sort({ created_at: -1 }).lean();
    return NextResponse.json(docs.map((d: any) => ({ id: String(d._id), nama: d.nama, cabang: d.cabang, mode: d.mode, status: d.status, jumlah_peserta: d.participants?.length ?? 0 })));
  } catch (e) {
    console.error('[API/17an/tournaments GET]', e);
    return fail(500, 'Gagal mengambil turnamen');
  }
}

export async function POST(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const b = await req.json();
    const nama = typeof b.nama === 'string' ? b.nama.trim() : '';
    if (!nama || nama.length > 100) return fail(400, 'Nama turnamen wajib diisi (maks 100 karakter)');
    const cabang = typeof b.cabang === 'string' ? b.cabang.trim().slice(0, 60) : '';
    await dbConnect();

    if (typeof b.template_id === 'string' && b.template_id) { // buat dari template: struktur & tata letak sama, isi peserta tinggal diedit
      const tpl: any = await TemplateModel.findById(b.template_id).lean();
      if (!tpl) return fail(404, 'Template tidak ditemukan');
      const n: number = tpl.jumlah_peserta;
      const lines = typeof b.peserta === 'string' ? b.peserta.split('\n').map((l: string) => l.trim()).filter(Boolean) : [];
      if (lines.length > n) return fail(400, `Template ini untuk ${n} peserta; daftar yang ditempel ${lines.length}`);
      const participants = Array.from({ length: n }, (_, i) => {
        const [pn, tim] = (lines[i] ?? '').split('|').map((x: string) => x.trim());
        if (pn && pn.length > 80) throw new Error('NAMA');
        return { id: newId(), nama: pn || `Peserta ${i + 1}`, tim: (tim ?? '').slice(0, 80) };
      });
      const ids = participants.map((p) => p.id);
      let matches: Match[];
      let groups: { name: string; members: string[] }[] = [];
      if (tpl.mode === 'single') {
        const slots = slotsFromIdx(tpl.slots, ids);
        matches = buildKnockout(slots, { halves: tpl.layout === 'dua-kelompok', third: !!tpl.third_place });
      } else {
        groups = (tpl.groups ?? []).map((x: any) => ({ name: x.name, members: x.members.map((i: number) => ids[i]).filter(Boolean) }));
        matches = buildGroupMatches(groups);
      }
      const doc: any = new TournamentModel({
        nama, cabang, mode: tpl.mode, layout: tpl.layout, third_place: tpl.third_place, group_count: tpl.group_count, advance_per_group: tpl.advance_per_group,
        participants, groups, matches, status: deriveStatus(matches), dibuat_oleh: g.actor.username,
      });
      if (tpl.mode === 'single') {
        doc.tata_letak = sanitizeTata(tataFromIndexed(mergeIdx(tpl.tata), koOnly(matches)), matches.map((m) => m.id));
      } else if (tpl.tata) {
        doc.tata_pending = tpl.tata; // dipasang saat babak gugur dibuat
        doc.tata_letak = sanitizeTata({ ...tpl.tata, pos: {}, order: {}, hidden: [] }, []); // warna & gaya garis langsung berlaku
      }
      await doc.save();
      return NextResponse.json(toJson(doc.toObject()), { status: 201 });
    }

    if (!['single', 'group'].includes(b.mode)) return fail(400, 'Mode harus single atau group');
    const doc = await TournamentModel.create({ nama, cabang, mode: b.mode, dibuat_oleh: g.actor.username });
    return NextResponse.json(toJson(doc.toObject()), { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'NAMA') return fail(400, 'Nama peserta terlalu panjang (maks 80 karakter)');
    console.error('[API/17an/tournaments POST]', e);
    return fail(500, 'Gagal membuat turnamen');
  }
}

export async function DELETE(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return fail(400, 'ID tidak diberikan');
    await dbConnect();
    const doc = await TournamentModel.findById(id);
    if (!doc) return fail(404, 'Turnamen tidak ditemukan');
    if (hasPlayed(doc.matches) && req.nextUrl.searchParams.get('konfirmasi') !== 'true') return fail(409, CONFIRM);
    await doc.deleteOne();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[API/17an/tournaments DELETE]', e);
    return fail(500, 'Gagal menghapus turnamen');
  }
}

export async function PATCH(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const body = await req.json();
    const { id, action } = body;
    if (typeof id !== 'string' || typeof action !== 'string') return fail(400, 'id dan action wajib');
    await dbConnect();
    const doc: any = await TournamentModel.findById(id);
    if (!doc) return fail(404, 'Turnamen tidak ditemukan');
    const matches: Match[] = doc.matches.map((m: any) => m.toObject());
    const started = hasPlayed(matches);
    const confirmed = body.konfirmasi === true;
    const save = async (next: Match[]) => {
      if (doc.tata_letak && (action === 'generate' || action === 'advance' || action === 'ko-slots' || action === 'reset')) doc.tata_letak = undefined; // id pertandingan berubah
      if (doc.tata_pending && (action === 'advance' || action === 'ko-slots')) { // pasang tata letak dari template pada babak gugur yang baru
        doc.tata_letak = sanitizeTata(tataFromIndexed(mergeIdx(doc.tata_pending), koOnly(next)), next.map((m) => m.id));
        doc.tata_pending = undefined;
      }
      doc.matches = next;
      doc.status = deriveStatus(next);
      doc.updated_at = new Date().toISOString();
      await doc.save();
      return NextResponse.json(toJson(doc.toObject()));
    };

    switch (action) {
      case 'meta': {
        if (typeof body.nama === 'string') {
          if (!body.nama.trim() || body.nama.trim().length > 100) return fail(400, 'Judul wajib diisi (maks 100 karakter)');
          doc.nama = body.nama.trim();
        }
        if (typeof body.cabang === 'string') doc.cabang = body.cabang.trim().slice(0, 60);
        const structural = ['mode', 'group_count', 'advance_per_group'].some((k) => body[k] !== undefined && body[k] !== doc[k]);
        if (started && structural) return fail(409, 'Mode dan pengaturan grup tidak bisa diubah setelah ada pertandingan selesai (judul & cabang tetap bisa)');
        if ((body.mode === 'single' || body.mode === 'group') && body.mode !== doc.mode) { doc.mode = body.mode; doc.matches = []; doc.groups = []; doc.status = 'draft'; }
        if (Number.isInteger(body.group_count) && body.group_count >= 1 && body.group_count <= 32) doc.group_count = body.group_count;
        if (Number.isInteger(body.advance_per_group) && body.advance_per_group >= 0 && body.advance_per_group <= 8) doc.advance_per_group = body.advance_per_group;
        doc.updated_at = new Date().toISOString();
        await doc.save();
        return NextResponse.json(toJson(doc.toObject()));
      }

      case 'participants': {
        if (started) return fail(409, 'Peserta tidak bisa diubah setelah turnamen dimulai. Reset turnamen terlebih dahulu.');
        if (!Array.isArray(body.participants) || body.participants.length > 512) return fail(400, 'Daftar peserta tidak valid (maks 512)');
        const seen = new Set<string>();
        const list = [];
        for (const p of body.participants) {
          const nama = typeof p?.nama === 'string' ? p.nama.trim() : '';
          if (!nama || nama.length > 80) return fail(400, 'Nama peserta wajib diisi (maks 80 karakter)');
          const pid = typeof p.id === 'string' && p.id && !seen.has(p.id) && p.id !== BYE ? p.id : newId();
          seen.add(pid);
          list.push({ id: pid, nama, tim: typeof p.tim === 'string' ? p.tim.trim().slice(0, 80) : '' });
        }
        doc.participants = list;
        doc.groups = [];
        doc.updated_at = new Date().toISOString();
        doc.matches = [];
        doc.status = 'draft';
        await doc.save();
        return NextResponse.json(toJson(doc.toObject()));
      }

      case 'generate': {
        const ids: string[] = doc.participants.map((p: any) => p.id);
        if (ids.length < 2) return fail(400, 'Minimal 2 peserta');
        if (started && !confirmed) return fail(409, CONFIRM);
        const order = body.acak ? shuffle(ids) : ids;

        if (doc.mode === 'single') {
          let slots: Slot[];
          if (Array.isArray(body.slots)) {
            slots = body.slots.map((s: unknown) => (s === BYE ? BYE : typeof s === 'string' && s ? s : null));
          } else {
            // byes = jumlah BYE di babak 1. Bebas selama (peserta + BYE) genap dan tiap BYE punya pasangan peserta.
            const byes = Number.isInteger(body.byes) ? body.byes : nextPow2(ids.length) - ids.length;
            const size = ids.length + byes;
            const pos: ByePosition = ['spread', 'top', 'bottom'].includes(body.bye) ? body.bye : 'spread';
            if (byes < 0 || size % 2 || byes > ids.length || size > 2048) return fail(400, 'Jumlah BYE tidak valid: peserta + BYE harus genap dan BYE tidak boleh lebih banyak dari peserta');
            slots = buildSlots(order, size, pos);
          }
          const err = validateSlots(slots, ids);
          if (err) return fail(400, err);
          doc.groups = [];
          if (body.layout === 'standard' || body.layout === 'dua-kelompok') doc.layout = body.layout;
          if (typeof body.third === 'boolean') doc.third_place = body.third;
          const ms = buildKnockout(slots, { halves: doc.layout === 'dua-kelompok', third: !!doc.third_place });
          const dup = findDuplicates(ms);
          if (dup) return fail(400, dup);
          return save(ms);
        }

        // mode group
        const gc = Math.min(doc.group_count, Math.floor(ids.length / 2));
        if (gc < 1) return fail(400, 'Peserta terlalu sedikit untuk dibagi ke grup');
        let groups;
        if (Array.isArray(body.groups)) {
          groups = body.groups.map((x: any, i: number) => ({ name: String(x?.name ?? `Grup ${String.fromCharCode(65 + i)}`).slice(0, 30), members: Array.isArray(x?.members) ? x.members : [] }));
          const all: string[] = groups.flatMap((x: any) => x.members);
          if (new Set(all).size !== all.length || all.length !== ids.length || !all.every((m) => ids.includes(m))) return fail(400, 'Setiap peserta harus berada di tepat satu grup');
          if (groups.some((x: any) => x.members.length < 2)) return fail(400, 'Setiap grup minimal 2 peserta');
        } else {
          groups = buildGroups(order, gc);
        }
        doc.groups = groups;
        return save(buildGroupMatches(groups));
      }

      case 'advance': {
        if (doc.mode !== 'group') return fail(400, 'Hanya untuk mode grup');
        if (doc.advance_per_group < 1) return fail(400, 'Jumlah lolos per grup = 0 (tanpa babak gugur)');
        const groupMs = matches.filter((m) => m.stage === 'group');
        if (!groupMs.length) return fail(400, 'Buat jadwal grup terlebih dahulu');
        if (groupMs.some((m) => m.status !== 'done') && !confirmed) return fail(409, 'Masih ada pertandingan grup yang belum selesai; kirim konfirmasi=true untuk tetap melanjutkan.');
        if (matches.some((m) => m.stage === 'ko' && m.status === 'done') && !confirmed) return fail(409, CONFIRM);
        const groups = doc.groups.map((x: any) => ({ name: x.name, members: [...x.members] }));
        const tables = groups.map((gr: any, i: number) => standings(matches, gr, i));
        const slots = knockoutSlotsFromGroups(groups, tables, doc.advance_per_group);
        const real = slots.filter((s) => s && s !== BYE) as string[];
        const err = validateSlots(slots, real);
        if (err) return fail(400, err);
        if (typeof body.third === 'boolean') doc.third_place = body.third;
        return save([...groupMs, ...buildKnockout(slots, { third: !!doc.third_place })]);
      }

      case 'ko-slots': { // susun ulang babak gugur (grup) secara manual selama belum ada hasil gugur
        if (matches.some((m) => m.stage === 'ko' && m.status === 'done')) return fail(409, 'Babak gugur sudah berjalan');
        const ko = matches.filter((m) => m.stage === 'ko');
        if (!ko.length || !Array.isArray(body.slots)) return fail(400, 'Babak gugur belum dibuat / slots tidak ada');
        const slots: Slot[] = body.slots.map((s: unknown) => (s === BYE ? BYE : typeof s === 'string' && s ? s : null));
        const cur = new Set(ko.filter((m) => m.round === 1).flatMap((m) => [m.a, m.b]).filter((s) => s && s !== BYE) as string[]);
        const err = validateSlots(slots, [...cur]);
        if (err) return fail(400, err);
        return save([...matches.filter((m) => m.stage === 'group'), ...buildKnockout(slots, { halves: doc.layout === 'dua-kelompok', third: !!doc.third_place })]);
      }

      case 'batch': { // simpan sekumpulan perubahan edit sekaligus (atomik: gagal satu = tidak ada yang tersimpan)
        if (!Array.isArray(body.ops) || !body.ops.length || body.ops.length > 300) return fail(400, 'Tidak ada perubahan / terlalu banyak (maks 300)');
        const ops: Op[] = [];
        for (const x of body.ops) {
          const o = parseOp(x);
          if (typeof o === 'string') return fail(400, o);
          ops.push(o);
        }
        const st: OpState = { matches, participants: doc.participants.map((p: any) => ({ id: p.id, nama: p.nama, tim: p.tim })) };
        const r = applyOps(st, ops, confirmed);
        if (r.error) return fail(400, r.error);
        if (r.confirm) return fail(409, `${r.confirm}; kirim konfirmasi=true.`);
        doc.participants = st.participants;
        return save(st.matches);
      }

      case 'layout': { // tata letak bagan (tidak mengubah pertandingan)
        if (body.tata === null) doc.tata_letak = undefined;
        else doc.tata_letak = sanitizeTata(body.tata, matches.map((m) => m.id));
        doc.markModified('tata_letak');
        doc.updated_at = new Date().toISOString();
        await doc.save();
        return NextResponse.json(toJson(doc.toObject()));
      }

      case 'reset': {
        if (started && !confirmed) return fail(409, CONFIRM);
        doc.groups = [];
        return save([]);
      }

      default:
        return fail(400, 'action tidak dikenal');
    }
  } catch (e) {
    console.error('[API/17an/tournaments PATCH]', e);
    return fail(500, 'Gagal memproses turnamen');
  }
}
