// app/api/17an/beranda/route.ts
// Data untuk beranda: bagan turnamen (hanya baca) + pengingat pertandingan yang mulai < 7 hari lagi.
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { TournamentModel } from '@/lib/event/models';
import { requireLogin, fail, toJson } from '@/lib/event/guard';
import { BYE, type Match } from '@/lib/event/bracket';
import { inWindow, parseJadwal } from '@/lib/event/jadwal';
import { roundName } from '@/lib/event/labels';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Upcoming = {
  key: string; tournamentId: string; tournamentNama: string; cabang: string; babak: string;
  a: string; b: string; jadwal: string; lokasi: string; startsAt: number; allDay: boolean;
};

export async function GET() {
  const g = await requireLogin();
  if ('res' in g) return g.res;
  try {
    await dbConnect();
    const docs: any[] = await TournamentModel.find({ 'matches.0': { $exists: true } }).sort({ created_at: -1 }).limit(30).lean();
    const now = Date.now();
    const upcoming: Upcoming[] = [];
    for (const t of docs) {
      const name = (id: string | null) => (id === BYE ? 'BYE' : id ? t.participants.find((p: any) => p.id === id)?.nama ?? '?' : 'Menunggu pemenang');
      const ko: Match[] = (t.matches as Match[]).filter((m) => m.stage === 'ko' && !m.third);
      const total = Math.max(0, ...ko.map((m) => m.round));
      for (const m of t.matches as Match[]) {
        if (m.status !== 'pending' || m.a === BYE || m.b === BYE) continue; // sudah selesai / BYE tidak perlu pengingat
        const p = parseJadwal(m.jadwal);
        if (!p || !inWindow(p, now)) continue;
        const babak = m.third ? 'Perebutan Juara 3'
          : m.stage === 'group' ? `Fase grup · ${t.groups?.[m.group ?? 0]?.name ?? ''}`.trim()
          : m.round === total ? 'Final' : roundName(m.round, total, t.layout ?? 'standard');
        upcoming.push({
          key: `${t._id}:${m.id}`, tournamentId: String(t._id), tournamentNama: t.nama, cabang: t.cabang ?? '', babak,
          a: name(m.a), b: name(m.b), jadwal: m.jadwal as string, lokasi: m.lokasi ?? '', startsAt: p.start, allDay: p.allDay,
        });
      }
    }
    upcoming.sort((x, y) => x.startsAt - y.startsAt);
    const order = { berjalan: 0, draft: 1, selesai: 2 } as Record<string, number>;
    const tournaments = docs.map(toJson).sort((a: any, b: any) => (order[a.status] ?? 1) - (order[b.status] ?? 1));
    return NextResponse.json({ now, upcoming, tournaments });
  } catch (e) {
    console.error('[API/17an/beranda GET]', e);
    return fail(500, 'Gagal mengambil data 17an');
  }
}
