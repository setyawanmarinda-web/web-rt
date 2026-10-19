// Uji operasi edit bracket (batch). Jalankan: node --experimental-strip-types scripts/uji-ops.ts
// @ts-nocheck — impor berekstensi .ts hanya untuk node --experimental-strip-types
import assert from 'node:assert/strict';
import { buildKnockout, buildSlots, deriveStatus } from '../lib/event/bracket.ts';
import { applyOps, parseOp } from '../lib/event/ops.ts';

const parts = Array.from({ length: 4 }, (_, i) => ({ id: `p${i + 1}`, nama: `Tim ${i + 1}` }));
const mk = () => ({ matches: buildKnockout(buildSlots(parts.map((p) => p.id), 4, 'spread'), { third: true }), participants: structuredClone(parts) });

{
  const st = mk();
  const [m1, m2] = st.matches.filter((m) => m.round === 1);
  const fin = st.matches.find((m) => m.round === 2 && !m.third);
  const ops = [
    { type: 'score', matchId: m1.id, scoreA: 2, scoreB: 0 },
    { type: 'score', matchId: m2.id, scoreA: 0, scoreB: 1 },
    { type: 'schedule', matchId: fin.id, jadwal: '2026-08-23T21:30', lokasi: 'Lapangan RW' },
    { type: 'rename', participantId: 'p1', nama: 'Tim Merah' },
  ].map(parseOp);
  ops.forEach((o) => assert.equal(typeof o, 'object'));
  assert.deepEqual(applyOps(st, ops, false), {});
  assert.equal(fin.jadwal, '2026-08-23T21:30');
  assert.equal(st.participants[0].nama, 'Tim Merah');
  assert.ok(fin.a && fin.b);
  // juara 3 terisi dari yang kalah
  const third = st.matches.find((m) => m.third);
  assert.deepEqual([third.a, third.b].sort(), [m1.b, m2.a].sort());
  // main final & juara 3, lalu koreksi skor semifinal -> minta konfirmasi
  applyOps(st, [{ type: 'score', matchId: fin.id, scoreA: 1, scoreB: 0 }], false);
  const r = applyOps(st, [{ type: 'score', matchId: m1.id, scoreA: 0, scoreB: 3 }], false);
  assert.ok(r.confirm, 'koreksi skor babak awal setelah final dimainkan wajib konfirmasi');
  assert.deepEqual(applyOps(st, [{ type: 'score', matchId: m1.id, scoreA: 0, scoreB: 3 }], true), {});
  assert.equal(deriveStatus(st.matches), 'berjalan');
}
// validasi input
assert.equal(typeof parseOp({ type: 'rename', participantId: 'x', nama: '' }), 'string');
assert.equal(typeof parseOp({ type: 'schedule', matchId: 'x', jadwal: '1 Agustus', lokasi: '' }), 'string');
assert.equal(typeof parseOp({ type: 'hapus-semua' }), 'string');
assert.equal(typeof parseOp(null), 'string');
// batch atomik di sisi pemanggil: op gagal mengembalikan error (server tidak menyimpan apa pun)
{
  const st = mk();
  const r = applyOps(st, [{ type: 'score', matchId: 'tidak-ada', scoreA: 1, scoreB: 0 }], false);
  assert.ok(r.error);
}
console.log('uji ops lolos');
