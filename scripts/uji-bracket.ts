// Uji logika bracket. Jalankan: node --experimental-strip-types scripts/uji-bracket.ts
// @ts-nocheck — impor berekstensi .ts hanya untuk node --experimental-strip-types
import assert from 'node:assert/strict';
import { swapEntrants, BYE, buildSlots, validateSlots, buildKnockout, setResult, clearResult, downstreamPlayed, buildGroups, buildGroupMatches, standings, knockoutSlotsFromGroups, nextPow2, deriveStatus, findDuplicates } from '../lib/event/bracket.ts';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

for (const n of [2, 3, 5, 7, 10, 13, 16, 21]) {
  for (const pos of ['spread', 'top', 'bottom'] as const) {
    const size = nextPow2(n);
    const slots = buildSlots(ids(n), size, pos);
    assert.equal(validateSlots(slots, ids(n)), null, `${n}/${pos}`);
    assert.equal(slots.filter((s) => s === BYE).length, size - n);
    const ms = buildKnockout(slots);
    assert.equal(findDuplicates(ms), null);
    // semua pertandingan BYE otomatis maju; tidak ada match normal dengan BYE
    ms.filter((m) => m.round === 1).forEach((m) => {
      const hasBye = m.a === BYE || m.b === BYE;
      assert.equal(m.status === 'bye', hasBye);
      if (hasBye) assert.ok(m.winner && m.winner !== BYE);
    });
    // mainkan seluruh turnamen: a selalu menang
    for (let r = 1; r <= Math.max(...ms.map((x) => x.round)); r++) {
      for (const m of ms.filter((x) => x.round === r && x.status !== 'bye')) {
        assert.ok(m.a && m.b && m.a !== BYE && m.b !== BYE, `match ${r}/${m.index} siap`);
        assert.equal(setResult(ms, m.id, 2, 1), null);
      }
    }
    assert.equal(deriveStatus(ms), 'selesai');
  }
}

// bracket tidak simetris: variasi jumlah BYE (mis. 10 peserta, 2 BYE => 8 tim main di babak 1)
for (const [n, byes] of [[10, 2], [10, 0], [10, 4], [9, 1], [9, 3], [5, 1], [13, 1], [13, 3], [7, 1], [6, 2], [3, 1]] as const) {
  for (const pos of ['spread', 'top', 'bottom'] as const) {
    const slots = buildSlots(ids(n), n + byes, pos);
    assert.equal(validateSlots(slots, ids(n)), null, `${n}/${byes}/${pos}`);
    assert.equal(slots.filter((s) => s === BYE).length, byes);
    const ms = buildKnockout(slots);
    assert.equal(findDuplicates(ms), null);
    assert.equal(ms.filter((m) => m.round === 1 && m.status !== 'bye').length, (n - byes) / 2);
    for (let r = 1; r <= Math.max(...ms.map((x) => x.round)); r++) {
      for (const m of ms.filter((x) => x.round === r && x.status !== 'bye')) {
        assert.ok(m.a && m.b && m.a !== BYE && m.b !== BYE, `${n}/${byes}/${pos} r${r} siap`);
        assert.equal(setResult(ms, m.id, 2, 1), null);
      }
    }
    assert.equal(deriveStatus(ms), 'selesai', `${n}/${byes}/${pos}`);
    const final = ms.reduce((a, b) => (b.round > a.round ? b : a));
    assert.ok(final.winner && final.winner !== BYE);
  }
}

// 10 peserta + 2 BYE: babak 1 = 4 pertandingan (8 tim); perempat final = 2 (BYE vs pemenang babak 1);
// 2 pemenang babak 1 lainnya langsung ke semifinal; lalu final.
{
  const ms = buildKnockout(buildSlots(ids(10), 12, 'spread'));
  const R = (r: number) => ms.filter((m) => m.round === r);
  assert.equal(R(1).filter((m) => m.status !== 'bye').length, 4);
  assert.equal(R(1).filter((m) => m.status === 'bye').length, 2);
  assert.deepEqual([R(2).length, R(3).length, R(4).length], [2, 2, 1]);
  assert.equal(ms.length, 6 + 2 + 2 + 1);
  const byeTeams = R(1).filter((m) => m.status === 'bye').map((m) => m.winner);
  R(2).forEach((m) => assert.ok(byeTeams.includes(m.a) !== byeTeams.includes(m.b), 'tiap perempat final: 1 tim BYE vs 1 pemenang babak 1'));
  R(1).filter((m) => m.status !== 'bye').forEach((m) => setResult(ms, m.id, 1, 0));
  R(2).forEach((m) => assert.ok(m.a && m.b));
  R(3).forEach((m) => assert.ok((m.a === null) !== (m.b === null), 'tiap semifinal sudah berisi 1 pemenang babak 1 yang langsung maju'));
  assert.equal(findDuplicates(ms), null);
}

// Skenario RT: 10 RT, bagan 2 kelompok, BYE untuk RT 006 (A) dan RT 010 (B), + perebutan juara 3
{
  const rt = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, `RT${String(i + 1).padStart(3, '0')}`]));
  const all = Object.values(rt) as string[];
  const slots = [rt[2], rt[7], rt[5], rt[3], rt[6], BYE, rt[8], rt[4], rt[9], rt[1], rt[10], BYE];
  assert.equal(validateSlots(slots, all), null);
  const ms = buildKnockout(slots, { halves: true, third: true });
  const R = (r: number) => ms.filter((m) => m.round === r);
  assert.deepEqual([1, 2, 3, 4].map((r) => R(r).length), [6, 2, 2, 2]);
  const r1 = R(1).filter((m) => m.status !== 'bye');
  assert.equal(r1.length, 4);
  assert.deepEqual(r1.map((m) => m.half), [0, 0, 1, 1]);
  r1.forEach((m) => setResult(ms, m.id, 3, 0)); // a menang: 002, 005, 008, 009
  const [a2, b2] = R(2);
  assert.deepEqual([a2.half, a2.a, a2.b].sort(), [0, rt[2], rt[6]].sort(), 'A: RT006 vs pemenang 002/007');
  assert.deepEqual([b2.half, b2.a, b2.b].sort(), [1, rt[10], rt[8]].sort(), 'B: RT010 vs pemenang 008/004');
  const sf = R(3);
  assert.ok(sf[0].a === rt[5] || sf[0].b === rt[5], 'pemenang 005/003 langsung ke semifinal A');
  setResult(ms, a2.id, 1, 0); setResult(ms, b2.id, 0, 1);
  sf.forEach((m) => { assert.ok(m.a && m.b); });
  const third = ms.find((m) => m.third)!, fin = ms.find((m) => m.round === 4 && !m.third)!;
  assert.equal(third.a, null);
  setResult(ms, sf[0].id, 2, 1); setResult(ms, sf[1].id, 0, 2);
  const losers = [sf[0], sf[1]].map((m) => (m.winner === m.a ? m.b : m.a));
  assert.deepEqual([third.a, third.b].sort(), losers.sort(), 'juara 3 = dua pihak yang kalah di semifinal');
  assert.deepEqual([fin.a, fin.b].sort(), [sf[0].winner, sf[1].winner].sort());
  assert.equal(deriveStatus(ms), 'berjalan');
  setResult(ms, fin.id, 1, 0);
  assert.equal(deriveStatus(ms), 'berjalan', 'belum selesai sebelum juara 3 main');
  setResult(ms, third.id, 1, 0);
  assert.equal(deriveStatus(ms), 'selesai');
  assert.equal(findDuplicates(ms), null);
  assert.ok(downstreamPlayed(ms, sf[0]));
}
// juara 3 pada bagan standar 8 tim; tidak dibuat bila semifinal berisi BYE
{
  const ms = buildKnockout(buildSlots(ids(8), 8, 'spread'), { third: true });
  assert.equal(ms.filter((m) => m.third).length, 1);
  assert.equal(ms.filter((m) => m.round === 3).length, 2);
  assert.equal(buildKnockout(buildSlots(ids(3), 4, 'spread'), { third: true }).filter((m) => m.third).length, 0);
  // bagan 2 kelompok untuk jumlah lain tetap bisa dimainkan sampai selesai
  for (const [n, byes] of [[10, 6], [10, 2], [9, 1], [7, 1], [12, 4], [6, 2], [4, 0], [5, 3]] as const) {
    const m2 = buildKnockout(buildSlots(ids(n), n + byes, 'spread'), { halves: true, third: true });
    for (let r = 1; r <= Math.max(...m2.map((x) => x.round)); r++)
      for (const m of m2.filter((x) => x.round === r && x.status !== 'bye')) {
        assert.ok(m.a && m.b && m.a !== BYE && m.b !== BYE, `${n}/${byes} r${r}`);
        assert.equal(setResult(m2, m.id, 2, 1), null);
      }
    assert.equal(deriveStatus(m2), 'selesai', `${n}/${byes}`);
    assert.equal(findDuplicates(m2), null);
  }
}

// tukar peserta di babak awal
{
  const ms = buildKnockout(buildSlots(ids(8), 8, 'spread'));
  const r1 = ms.filter((m) => !m.fa);
  const [m0, m1] = r1;
  const [x, y] = [m0.a!, m1.b!];
  assert.equal(swapEntrants(ms, m0.id, 'a', y), null);
  assert.equal(m0.a, y); assert.equal(m1.b, x);
  assert.ok(swapEntrants(ms, m0.id, 'a', BYE));
  setResult(ms, m0.id, 1, 0);
  assert.ok(swapEntrants(ms, m0.id, 'b', m1.a!), 'tidak boleh menukar pertandingan yang sudah selesai');
  const byeMs = buildKnockout(buildSlots(ids(5), 8, 'top'));
  const bm = byeMs.find((m) => m.status === 'bye')!;
  const real = byeMs.find((m) => !m.fa && m.status !== 'bye')!;
  assert.equal(swapEntrants(byeMs, bm.id, bm.a === BYE ? 'b' : 'a', real.a!), null);
  assert.equal(bm.winner, bm.a === BYE ? bm.b : bm.a);
  assert.equal(findDuplicates(byeMs), null);
}

// 10 peserta pada 16 slot = 6 BYE; seri di KO ditolak tanpa pemenang manual
{
  const ms = buildKnockout(buildSlots(ids(10), 16, 'spread'));
  assert.equal(ms.filter((m) => m.round === 1 && m.status === 'bye').length, 6);
  const m = ms.find((x) => x.round === 1 && x.status === 'pending')!;
  assert.ok(setResult(ms, m.id, 1, 1));
  assert.equal(setResult(ms, m.id, 1, 1, m.a!), null);
  assert.equal(m.decidedBy, 'manual');
  assert.equal(clearResult(ms, m.id), null);
  assert.equal(m.winner, null);
}
// validasi manual
assert.ok(validateSlots([BYE, BYE, 'p1', 'p2'], ['p1', 'p2']));
assert.ok(validateSlots(['p1', 'p1', 'p2', BYE], ['p1', 'p2']));
assert.ok(validateSlots(['p1', 'p2', 'p3'], ['p1', 'p2', 'p3']));
assert.equal(validateSlots(['p1', 'p2', 'p3', BYE, 'p4', 'p5'], ['p1', 'p2', 'p3', 'p4', 'p5']), null);
// edit hasil babak awal setelah babak berikutnya dimainkan terdeteksi
{
  const ms = buildKnockout(buildSlots(ids(4), 4, 'spread'));
  const r1 = ms.filter((m) => m.round === 1);
  r1.forEach((m) => setResult(ms, m.id, 1, 0));
  const fin = ms.find((m) => m.round === 2)!;
  setResult(ms, fin.id, 3, 0);
  assert.ok(downstreamPlayed(ms, r1[0]));
  assert.ok(!downstreamPlayed(ms, fin));
}
// grup: 10 peserta / 3 grup, round robin & klasemen
{
  const g = buildGroups(ids(10), 3);
  assert.deepEqual(g.map((x) => x.members.length).sort(), [3, 3, 4]);
  const ms = buildGroupMatches(g);
  assert.equal(ms.length, 3 + 3 + 6);
  ms.forEach((m) => setResult(ms, m.id, 2, 0));
  const t = g.map((x, i) => standings(ms, x, i));
  const slots = knockoutSlotsFromGroups(g, t, 2);
  assert.equal(validateSlots(slots, slots.filter((s) => s !== BYE) as string[]), null);
}
// 4 grup x 2 lolos: A1-B2 dst, tidak ada satu grup bertemu di babak pertama
{
  const g = buildGroups(ids(16), 4);
  const ms = buildGroupMatches(g);
  ms.forEach((m) => setResult(ms, m.id, 1, 0));
  const t = g.map((x, i) => standings(ms, x, i));
  const s = knockoutSlotsFromGroups(g, t, 2) as string[];
  const grpOf = (id: string) => g.findIndex((x) => x.members.includes(id));
  for (let i = 0; i < s.length; i += 2) assert.notEqual(grpOf(s[i]), grpOf(s[i + 1]));
}
console.log('semua uji lolos');
