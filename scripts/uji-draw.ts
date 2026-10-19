// Uji algoritma undian. Jalankan: node --experimental-strip-types scripts/uji-draw.ts
// @ts-nocheck — impor berekstensi .ts hanya untuk node --experimental-strip-types
import assert from 'node:assert/strict';
import { runDraw, listHash, commitmentOf, finalSeed } from '../lib/event/draw.ts';

const P = Array.from({ length: 50 }, (_, i) => ({ id: `w${String(i).padStart(3, '0')}`, nama: `Warga ${i}` }));
const prizes = [{ id: 'a', nama: 'Sepeda', jumlah: 3 }, { id: 'b', nama: 'Kipas', jumlah: 5 }];
const seed = await finalSeed('ab'.repeat(32), 'cd'.repeat(32), await listHash(P));

const r1 = await runDraw(seed, P, prizes, false);
const r2 = await runDraw(seed, [...P].reverse(), prizes, false);
assert.deepEqual(r1, r2, 'deterministik & tidak tergantung urutan input');
assert.equal(r1.length, 8);
assert.equal(new Set(r1.map((w) => w.participantId)).size, 8, 'tanpa menang ganda');
assert.notDeepEqual(r1, await runDraw(await finalSeed('00'.repeat(32), 'cd'.repeat(32), await listHash(P)), P, prizes, false));
// menang ganda boleh pada hadiah berbeda, tapi tidak pada hadiah yang sama
const multi = await runDraw(seed, [{ id: 'x', nama: 'x' }, { id: 'y', nama: 'y' }], prizes, true);
assert.equal(multi.filter((w) => w.prizeId === 'a').length, 2);
assert.equal(new Set(multi.filter((w) => w.prizeId === 'a').map((w) => w.participantId)).size, 2);
// jumlah hadiah > peserta dipotong
assert.equal((await runDraw(seed, P.slice(0, 2), prizes, false)).length, 2);
// uji kasar kemerataan: 3000 undian 1 pemenang dari 5 peserta
const five = P.slice(0, 5); const cnt: Record<string, number> = {};
for (let i = 0; i < 3000; i++) {
  const s = await finalSeed(i.toString(16).padStart(64, '0'), 'ee'.repeat(32), 'h');
  const [w] = await runDraw(s, five, [{ id: 'z', nama: 'z', jumlah: 1 }], false);
  cnt[w.participantId] = (cnt[w.participantId] ?? 0) + 1;
}
Object.values(cnt).forEach((c) => assert.ok(c > 480 && c < 720, `merata: ${c}`));
assert.equal((await commitmentOf('00'.repeat(32))).length, 64);
console.log('uji undian lolos', cnt);

// ── tidak hadir: undi ulang pengganti ──
import { applyAbsent, replayWinners } from '../lib/event/draw.ts';
{
  const ids = P.map((p) => p.id);
  const base = (await runDraw(seed, P, prizes, false)).map((w) => ({ ...w, revealed: true }));
  const idx = 1;
  const absentId = base[idx].participantId;
  const r1 = await applyAbsent(base, idx, ids, false, seed, 1);
  assert.ok(!('error' in r1));
  if ('error' in r1) throw new Error('x');
  assert.equal(r1.winners.length, base.length + 1, 'pengganti disisipkan tepat setelah yang absen');
  assert.equal(r1.winners[idx].absent, true);
  assert.equal(r1.winners[idx + 1].prizeId, base[idx].prizeId);
  assert.equal(r1.winners[idx + 1].revealed, false);
  const valid = r1.winners.filter((w) => !w.absent).map((w) => w.participantId);
  assert.equal(new Set(valid).size, valid.length, 'pengganti tidak boleh ganda dengan pemenang sah lain');
  assert.ok(!valid.includes(absentId) || r1.newId === absentId);
  // deterministik
  const r1b = await applyAbsent(base, idx, ids, false, seed, 1);
  assert.deepEqual(r1, r1b);
  // peserta yang absen tetap ada di kolam pengganti: 2 peserta, 1 hadiah -> pengganti bisa dia sendiri atau lawannya
  const two = P.slice(0, 2);
  const w2 = (await runDraw(seed, two, [{ id: 'z', nama: 'z', jumlah: 1 }], false)).map((w) => ({ ...w, revealed: true }));
  const seen = new Set<string>();
  for (let n = 1; n <= 40; n++) {
    const s2 = await finalSeed(n.toString(16).padStart(64, '0'), 'ee'.repeat(32), 'h');
    const w = (await runDraw(s2, two, [{ id: 'z', nama: 'z', jumlah: 1 }], false)).map((x) => ({ ...x, revealed: true }));
    const r = await applyAbsent(w, 0, two.map((p) => p.id), false, s2, 1);
    if (!('error' in r)) seen.add(r.newId === w[0].participantId ? 'sama' : 'lain');
  }
  assert.ok(seen.has('sama') && seen.has('lain'), 'yang tidak hadir masih bisa ikut kesempatan lagi');
  void w2;
  // tidak ada peserta tersisa: 1 peserta, dia absen -> pool berisi dirinya sendiri (boleh ikut lagi)
  const one = P.slice(0, 1);
  const w1 = (await runDraw(seed, one, [{ id: 'z', nama: 'z', jumlah: 1 }], false)).map((w) => ({ ...w, revealed: true }));
  const rr = await applyAbsent(w1, 0, one.map((p) => p.id), false, seed, 1);
  assert.ok(!('error' in rr) && rr.newId === one[0].id);
  // replay (verifikasi publik) menghasilkan daftar yang sama
  const redraws = [{ n: 1, prizeId: base[idx].prizeId, absentId, newId: r1.newId }];
  const next = r1.winners.findIndex((w, i) => i > idx && !w.absent && w.revealed);
  const r2 = await applyAbsent(r1.winners, next, ids, false, seed, 2);
  assert.ok(!('error' in r2));
  if ('error' in r2) throw new Error('x');
  redraws.push({ n: 2, prizeId: r1.winners[next].prizeId, absentId: r1.winners[next].participantId, newId: r2.newId });
  const rep = await replayWinners(seed, P, prizes, false, redraws);
  assert.ok(rep.ok);
  assert.deepEqual(rep.winners.map((w) => [w.prizeId, w.participantId, !!w.absent]), r2.winners.map((w) => [w.prizeId, w.participantId, !!w.absent]));
  // catatan palsu ditolak
  const bad = await replayWinners(seed, P, prizes, false, [{ ...redraws[0], newId: 'orang-lain' }]);
  assert.ok(!bad.ok);
  console.log('uji tidak-hadir lolos');
}
