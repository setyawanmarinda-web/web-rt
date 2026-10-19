// lib/event/ops.ts
// Operasi edit bracket yang dipakai SAMA oleh browser (pratinjau sebelum disimpan) dan server (penyimpanan).
import { BYE, clearResult, downstreamPlayed, setResult, swapEntrants, type Match } from './bracket';

export type Op =
  | { type: 'score'; matchId: string; scoreA: number; scoreB: number; winner?: string }
  | { type: 'clear-score'; matchId: string }
  | { type: 'schedule'; matchId: string; jadwal: string; lokasi: string }
  | { type: 'swap-teams'; matchId: string; side: 'a' | 'b'; participantId: string }
  | { type: 'rename'; participantId: string; nama: string; tim?: string };

export type OpState = { matches: Match[]; participants: { id: string; nama: string; tim?: string }[] };
export type OpResult = { error?: string; confirm?: string };

const JADWAL = /^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?)?$/;

// Validasi bentuk op dari klien (tidak dipercaya).
export function parseOp(x: unknown): Op | string {
  const o = x as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return 'Operasi tidak valid';
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max ? v : null);
  const id = str(o.matchId, 64);
  switch (o.type) {
    case 'score':
      if (!id || !Number.isFinite(Number(o.scoreA)) || !Number.isFinite(Number(o.scoreB))) return 'Skor tidak valid';
      return { type: 'score', matchId: id, scoreA: Number(o.scoreA), scoreB: Number(o.scoreB), winner: typeof o.winner === 'string' ? o.winner : undefined };
    case 'clear-score':
      return id ? { type: 'clear-score', matchId: id } : 'Operasi tidak valid';
    case 'schedule': {
      const j = str(o.jadwal ?? '', 40), l = str(o.lokasi ?? '', 100);
      if (!id || j === null || l === null || !JADWAL.test(j)) return 'Jadwal tidak valid';
      return { type: 'schedule', matchId: id, jadwal: j, lokasi: l };
    }
    case 'swap-teams': {
      const p = str(o.participantId, 64);
      if (!id || !p || (o.side !== 'a' && o.side !== 'b')) return 'Penukaran tidak valid';
      return { type: 'swap-teams', matchId: id, side: o.side, participantId: p };
    }
    case 'rename': {
      const p = str(o.participantId, 64), n = typeof o.nama === 'string' ? o.nama.trim() : '';
      if (!p || !n || n.length > 80) return 'Nama wajib diisi (maks 80 karakter)';
      return { type: 'rename', participantId: p, nama: n, tim: typeof o.tim === 'string' ? o.tim.trim().slice(0, 80) : undefined };
    }
    default:
      return 'Jenis operasi tidak dikenal';
  }
}

const NEED = 'Babak berikutnya sudah dimainkan; perubahan ini dapat menghapus hasil di babak itu';

// Terapkan satu op ke `st` (dimutasi). `confirmed` = lewati peringatan babak berikutnya.
export function applyOp(st: OpState, op: Op, confirmed: boolean): OpResult {
  if (op.type === 'rename') {
    const p = st.participants.find((x) => x.id === op.participantId);
    if (!p) return { error: 'Peserta tidak ditemukan' };
    p.nama = op.nama;
    if (op.tim !== undefined) p.tim = op.tim;
    return {};
  }
  const m = st.matches.find((x) => x.id === op.matchId);
  if (!m) return { error: 'Pertandingan tidak ditemukan' };
  switch (op.type) {
    case 'schedule':
      if (op.jadwal) m.jadwal = op.jadwal; else delete m.jadwal;
      if (op.lokasi) m.lokasi = op.lokasi; else delete m.lokasi;
      return {};
    case 'score': {
      if (m.status === 'done' && downstreamPlayed(st.matches, m) && !confirmed) return { confirm: NEED };
      const err = setResult(st.matches, m.id, op.scoreA, op.scoreB, op.winner);
      return err ? { error: err } : {};
    }
    case 'clear-score': {
      if (downstreamPlayed(st.matches, m) && !confirmed) return { confirm: NEED };
      const err = clearResult(st.matches, m.id);
      return err ? { error: err } : {};
    }
    case 'swap-teams': {
      const other = st.matches.find((x) => x.stage === 'ko' && !x.fa && (x.a === op.participantId || x.b === op.participantId));
      if (!confirmed && ((m.status !== 'done' && downstreamPlayed(st.matches, m)) || (other && other.status !== 'done' && downstreamPlayed(st.matches, other)))) return { confirm: NEED };
      const err = swapEntrants(st.matches, m.id, op.side, op.participantId);
      return err ? { error: err } : {};
    }
  }
}

// Terapkan urutan op; berhenti di op pertama yang gagal/butuh konfirmasi.
export function applyOps(st: OpState, ops: Op[], confirmed: boolean): OpResult {
  for (const op of ops) {
    const r = applyOp(st, op, confirmed);
    if (r.error || r.confirm) return r;
  }
  return {};
}

export const isRealSlot = (s: string | null) => !!s && s !== BYE;
