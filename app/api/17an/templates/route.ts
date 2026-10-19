// app/api/17an/templates/route.ts — template bagan. GET: semua akun login. POST/DELETE: hanya master.
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { TemplateModel, TournamentModel } from '@/lib/event/models';
import { requireLogin, requireMaster, fail, toJson } from '@/lib/event/guard';
import { koOnly, mergeIdx, slotsToIdx, tataToIndexed } from '@/lib/event/template';
import { mergeTata } from '@/lib/event/tata';
import type { Match } from '@/lib/event/bracket';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const g = await requireLogin();
  if ('res' in g) return g.res;
  try {
    await dbConnect();
    const docs: any[] = await TemplateModel.find({}, 'nama mode layout third_place jumlah_peserta group_count advance_per_group created_at').sort({ created_at: -1 }).lean();
    return NextResponse.json(docs.map(toJson));
  } catch (e) {
    console.error('[API/17an/templates GET]', e);
    return fail(500, 'Gagal mengambil template');
  }
}

// Simpan bagan sebuah turnamen sebagai template (tanpa nama peserta & hasil).
export async function POST(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const b = await req.json();
    const nama = typeof b.nama === 'string' ? b.nama.trim() : '';
    if (!nama || nama.length > 100) return fail(400, 'Nama template wajib diisi (maks 100 karakter)');
    if (typeof b.tournamentId !== 'string') return fail(400, 'tournamentId wajib');
    await dbConnect();
    const t: any = await TournamentModel.findById(b.tournamentId).lean();
    if (!t) return fail(404, 'Turnamen tidak ditemukan');
    const matches: Match[] = t.matches ?? [];
    if (!matches.length) return fail(400, 'Buat bagan terlebih dahulu sebelum dijadikan template');
    const pids: string[] = t.participants.map((p: any) => p.id);
    const tata = t.tata_letak ? tataToIndexed(mergeTata(t.tata_letak), koOnly(matches)) : mergeIdx(t.tata_pending);
    const base: any = {
      nama, mode: t.mode, layout: t.layout ?? 'standard', third_place: !!t.third_place, group_count: t.group_count, advance_per_group: t.advance_per_group,
      jumlah_peserta: pids.length, tata, dibuat_oleh: g.actor.username,
    };
    if (t.mode === 'single') {
      const r1 = koOnly(matches).filter((m) => !m.fa);
      base.slots = slotsToIdx(r1.flatMap((m) => [m.a, m.b]), pids);
    } else {
      base.groups = (t.groups ?? []).map((x: any) => ({ name: x.name, members: x.members.map((id: string) => pids.indexOf(id)) }));
    }
    const doc = await TemplateModel.create(base);
    return NextResponse.json(toJson(doc.toObject()), { status: 201 });
  } catch (e) {
    console.error('[API/17an/templates POST]', e);
    return fail(500, 'Gagal menyimpan template');
  }
}

export async function DELETE(req: NextRequest) {
  const g = await requireMaster();
  if ('res' in g) return g.res;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return fail(400, 'ID tidak diberikan');
    await dbConnect();
    const doc = await TemplateModel.findByIdAndDelete(id);
    if (!doc) return fail(404, 'Template tidak ditemukan');
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[API/17an/templates DELETE]', e);
    return fail(500, 'Gagal menghapus template');
  }
}
