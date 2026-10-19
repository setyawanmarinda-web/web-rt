// lib/event/bracket.ts
// Logika turnamen murni (tanpa database): single elimination dengan BYE, sistem grup, klasemen.
export const BYE = '__BYE__';

export type Slot = string | null; // id peserta | BYE | null (belum ditentukan)
export type Match = {
  id: string;
  stage: 'group' | 'ko';
  group?: number;
  round: number; // mulai 1
  index: number; // urutan dalam round
  fa?: string; // id pertandingan yang pemenangnya mengisi sisi a (kosong = peserta langsung / babak 1)
  fb?: string; // idem untuk sisi b
  laLoser?: boolean; // sisi a diisi oleh PIHAK YANG KALAH dari fa (perebutan juara 3)
  lbLoser?: boolean;
  half?: 0 | 1; // bagan 2 kelompok: 0 = Kelompok A (atas), 1 = Kelompok B (bawah)
  third?: boolean; // pertandingan perebutan juara 3
  a: Slot;
  b: Slot;
  status: 'pending' | 'done' | 'bye';
  scoreA?: number;
  scoreB?: number;
  winner: string | null; // id peserta; BYE tidak pernah jadi pemenang
  decidedBy?: 'skor' | 'manual'; // manual = penentuan pemenang saat seri (adu penalti dll.)
  jadwal?: string;
  lokasi?: string;
};
export type Group = { name: string; members: string[] };
export type Standing = { id: string; main: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number };

export type Rng = () => number;
export const defaultRng: Rng = () => {
  const b = new Uint32Array(1);
  globalThis.crypto.getRandomValues(b);
  return b[0] / 4294967296;
};

export function shuffle<T>(arr: T[], rng: Rng = defaultRng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const nextPow2 = (n: number) => { let p = 1; while (p < n) p *= 2; return p; };
const isPow2 = (n: number) => n >= 2 && (n & (n - 1)) === 0;

// Urutan seed standar per slot: size 8 -> [1,8,4,5,2,7,3,6]
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

export type ByePosition = 'spread' | 'top' | 'bottom';

// Susun slot babak pertama. `ids` berurutan = urutan seed.
export function buildSlots(ids: string[], size: number, byePosition: ByePosition): Slot[] {
  const n = ids.length;
  const byes = size - n;
  if (byePosition === 'spread' && isPow2(size)) return seedOrder(size).map((s) => (s <= n ? ids[s - 1] : BYE));
  const slots: Slot[] = [];
  let k = 0;
  const pairs = size / 2;
  // 'spread' pada ukuran bebas: pasangan BYE dibagi rata dari atas ke bawah.
  const spreadSet = new Set(Array.from({ length: byes }, (_, i) => Math.floor(((i + 0.5) * pairs) / byes)));
  for (let p = 0; p < pairs; p++) {
    const hasBye = byePosition === 'top' ? p < byes : byePosition === 'bottom' ? p >= pairs - byes : spreadSet.has(p);
    if (hasBye) slots.push(ids[k++], BYE);
    else slots.push(ids[k++], ids[k++]);
  }
  return slots;
}

// Validasi slot babak pertama. Mengembalikan pesan error atau null.
export function validateSlots(slots: Slot[], ids: string[]): string | null {
  const size = slots.length;
  if (size < 2 || size % 2) return 'Jumlah slot harus genap (pasangan pertandingan)';
  if (ids.length < 2) return 'Minimal 2 peserta';
  const seen = new Set<string>();
  for (const s of slots) {
    if (s === BYE || s === null) continue;
    if (!ids.includes(s)) return 'Slot berisi peserta yang tidak dikenal';
    if (seen.has(s)) return 'Satu peserta tidak boleh muncul di dua slot';
    seen.add(s);
  }
  if (seen.size !== ids.length) return 'Semua peserta harus ditempatkan di bracket';
  if (slots.some((s) => s === null)) return 'Masih ada slot kosong; isi dengan peserta atau BYE';
  for (let i = 0; i < size; i += 2) {
    if (slots[i] === BYE && slots[i + 1] === BYE) return `Pertandingan ${i / 2 + 1} berisi dua BYE`;
  }
  return null;
}

let seq = 0;
const mid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}${Math.floor(defaultRng() * 1e6).toString(36)}`;

const isBye = (m: Match) => m.a === BYE || m.b === BYE;

type Mk = (round: number, a: Slot, b: Slot, fa?: string, fb?: string) => Match;
export type KnockoutOpts = { halves?: boolean; third?: boolean };

// Tumbuhkan pohon dari daftar `entrants` (pertandingan yang pemenangnya ikut babak berikutnya) sampai satu pemenang.
// Bila jumlah entrants bukan pangkat dua ada satu babak penyaring: tim BYE melawan pemenang babak 1,
// sedangkan pemenang babak 1 lainnya langsung maju.
function grow(entrants: Match[], mk: Mk): Match {
  let round = 1;
  let cur = entrants;
  if (cur.length > 1 && !isPow2(cur.length)) {
    let T = 1;
    while (T * 2 < cur.length) T *= 2;
    const e = cur.length - T;
    const poolB = cur.filter(isBye), poolW = cur.filter((m) => !isBye(m));
    round++;
    const played: Match[] = [];
    for (let i = 0; i < e; i++) {
      const first = (poolB.shift() ?? poolW.shift()) as Match;
      const second = (poolW.shift() ?? poolB.shift()) as Match;
      played.push(mk(round, null, null, first.id, second.id));
    }
    const skip = [...poolW, ...poolB];
    cur = [];
    for (let i = 0; i < Math.max(skip.length, played.length); i++) {
      if (skip[i]) cur.push(skip[i]);
      if (played[i]) cur.push(played[i]);
    }
  }
  while (cur.length > 1) {
    round++;
    const next: Match[] = [];
    for (let i = 0; i < cur.length; i += 2) next.push(mk(round, null, null, cur[i].id, cur[i + 1].id));
    cur = next;
  }
  return cur[0];
}

// Susun pohon babak gugur dari slot babak 1 (panjang genap, boleh bukan pangkat dua).
// opts.halves: bagan 2 kelompok (separuh atas = A, bawah = B); juara kelompok bertemu di final.
// opts.third: tambah perebutan juara 3 (dua pihak yang kalah di babak sebelum final).
export function buildKnockout(slots: Slot[], opts: KnockoutOpts = {}): Match[] {
  const all: Match[] = [];
  const factory = (list: Match[], half?: 0 | 1): Mk => (round, a, b, fa, fb) => {
    const m: Match = { id: mid('k'), stage: 'ko', round, index: 0, a, b, status: 'pending', winner: null };
    if (fa) m.fa = fa;
    if (fb) m.fb = fb;
    if (half !== undefined) m.half = half;
    list.push(m);
    return m;
  };
  const firstRound = (mk: Mk, from: number, to: number) => {
    const out: Match[] = [];
    for (let i = from; i < to; i++) out.push(mk(1, slots[2 * i], slots[2 * i + 1]));
    return out;
  };
  const pairs = slots.length / 2;

  if (opts.halves && pairs >= 2) {
    const aN = Math.ceil(pairs / 2);
    const la: Match[] = [], lb: Match[] = [];
    const mkA = factory(la, 0), mkB = factory(lb, 1);
    const ra = grow(firstRound(mkA, 0, aN), mkA);
    const rb = grow(firstRound(mkB, aN, pairs), mkB);
    const da = Math.max(...la.map((m) => m.round)), db = Math.max(...lb.map((m) => m.round));
    const H = Math.max(da, db);
    la.forEach((m) => (m.round += H - da)); // juara kedua kelompok bertemu di babak yang sama
    lb.forEach((m) => (m.round += H - db));
    all.push(...la, ...lb);
    const mk = factory(all);
    mk(H + 1, null, null, ra.id, rb.id);
    if (opts.third && !isBye(ra) && !isBye(rb)) {
      const t = mk(H + 1, null, null, ra.id, rb.id);
      t.third = true; t.laLoser = true; t.lbLoser = true;
    }
  } else {
    const mk = factory(all);
    const root = grow(firstRound(mk, 0, pairs), mk);
    if (opts.third && root.fa && root.fb) {
      const ma = all.find((m) => m.id === root.fa), mb = all.find((m) => m.id === root.fb);
      if (ma && mb && !isBye(ma) && !isBye(mb)) {
        const t = mk(root.round, null, null, ma.id, mb.id);
        t.third = true; t.laLoser = true; t.lbLoser = true;
      }
    }
  }

  const cnt = new Map<number, number>();
  for (const m of all) { const i = cnt.get(m.round) ?? 0; m.index = i; cnt.set(m.round, i + 1); }
  return recompute(all);
}

const koOf = (ms: Match[], round: number, index: number) => ms.find((m) => m.stage === 'ko' && m.round === round && m.index === index);

// Hitung ulang BYE dan kemajuan pemenang. Idempoten. Hanya menyentuh match stage 'ko'.
export function recompute(matches: Match[]): Match[] {
  const ko = matches.filter((m) => m.stage === 'ko');
  const legacy = !ko.some((m) => m.fa);
  const maxRound = Math.max(0, ...ko.map((m) => m.round));
  for (let r = 1; r <= maxRound; r++) {
    for (const m of ko.filter((x) => x.round === r)) {
      if (m.fa) {
        const src = (id: string, loser?: boolean): Slot => {
          const f = matches.find((x) => x.id === id);
          if (!f) return null;
          if (!loser) return f.winner;
          if (f.status !== 'done' || !f.winner) return null;
          return f.winner === f.a ? f.b : f.a;
        };
        m.a = src(m.fa, m.laLoser);
        m.b = m.fb ? src(m.fb, m.lbLoser) : BYE;
      } else if (legacy && r > 1) { // data lama tanpa feeder eksplisit: pasangan berurutan
        m.a = koOf(matches, r - 1, 2 * m.index)?.winner ?? null;
        const f2 = koOf(matches, r - 1, 2 * m.index + 1);
        m.b = f2 ? f2.winner : BYE;
      }
      const byeA = m.a === BYE, byeB = m.b === BYE;
      if (byeA !== byeB) {
        m.status = 'bye';
        m.winner = byeA ? m.b : m.a; // bisa null bila lawan belum jelas
        delete m.scoreA; delete m.scoreB; delete m.decidedBy;
      } else {
        if (m.status === 'bye') { m.status = 'pending'; m.winner = null; }
        if (m.winner && m.winner !== m.a && m.winner !== m.b) {
          m.winner = null; m.status = 'pending';
          delete m.scoreA; delete m.scoreB; delete m.decidedBy;
        }
        if (!m.winner) m.status = 'pending';
      }
    }
  }
  return matches;
}

// Ada pertandingan setelah match ini (yang bergantung pada pemenangnya) yang sudah dimainkan?
export function downstreamPlayed(matches: Match[], m: Match): boolean {
  if (m.stage !== 'ko') return false;
  const deps = matches.filter((x) => x.fa === m.id || x.fb === m.id);
  if (!deps.length && !matches.some((x) => x.fa)) {
    const next = koOf(matches, m.round + 1, Math.floor(m.index / 2));
    if (next) deps.push(next);
  }
  return deps.some((n) => n.status === 'done' || downstreamPlayed(matches, n));
}

export function setResult(
  matches: Match[], matchId: string, scoreA: number, scoreB: number, winnerPick?: string,
): string | null {
  const m = matches.find((x) => x.id === matchId);
  if (!m) return 'Pertandingan tidak ditemukan';
  if (!m.a || !m.b || m.a === BYE || m.b === BYE) return 'Pertandingan belum memiliki dua peserta';
  if (![scoreA, scoreB].every((v) => Number.isFinite(v) && v >= 0 && v <= 9999)) return 'Skor tidak valid';
  if (m.status === 'bye') return 'Pertandingan BYE tidak memakai skor';
  if (scoreA !== scoreB) {
    m.winner = scoreA > scoreB ? m.a : m.b;
    m.decidedBy = 'skor';
  } else if (m.stage === 'group') {
    m.winner = null; // seri sah di fase grup
    m.decidedBy = 'skor';
  } else {
    if (winnerPick !== m.a && winnerPick !== m.b) return 'Skor seri: pilih pemenang (mis. hasil adu penalti)';
    m.winner = winnerPick;
    m.decidedBy = 'manual';
  }
  m.scoreA = scoreA; m.scoreB = scoreB; m.status = 'done';
  recompute(matches);
  return null;
}

// Tukar dua peserta di babak awal (belum dimainkan). BYE tidak ikut dipindah agar struktur bagan tetap.
export function swapEntrants(matches: Match[], matchId: string, side: 'a' | 'b', newId: string): string | null {
  const m = matches.find((x) => x.id === matchId);
  if (!m || m.stage !== 'ko' || m.fa) return 'Hanya peserta babak awal yang bisa ditukar';
  const cur = side === 'a' ? m.a : m.b;
  if (!cur || cur === BYE || !newId || newId === BYE) return 'Hanya bisa menukar antar peserta (posisi BYE diatur lewat Susun slot manual)';
  if (cur === newId) return null;
  const other = matches.find((x) => x.stage === 'ko' && !x.fa && (x.a === newId || x.b === newId));
  if (!other) return 'Peserta pengganti tidak ada di babak awal';
  if (m.status === 'done' || other.status === 'done') return 'Hapus hasil pertandingan yang terkait terlebih dahulu';
  if (other.a === newId) other.a = cur; else other.b = cur;
  if (side === 'a') m.a = newId; else m.b = newId;
  recompute(matches);
  return null;
}

export function clearResult(matches: Match[], matchId: string): string | null {
  const m = matches.find((x) => x.id === matchId);
  if (!m) return 'Pertandingan tidak ditemukan';
  if (m.status === 'bye') return 'Pertandingan BYE tidak bisa dihapus hasilnya';
  m.winner = null; m.status = 'pending';
  delete m.scoreA; delete m.scoreB; delete m.decidedBy;
  recompute(matches);
  return null;
}

// Validasi: satu peserta tidak boleh muncul di dua pertandingan pada babak yang sama.
export function findDuplicates(matches: Match[]): string | null {
  const key = new Set<string>();
  for (const m of matches) {
    for (const s of [m.a, m.b]) {
      if (!s || s === BYE) continue;
      const k = `${m.stage}:${m.group ?? ''}:${m.stage === 'ko' ? m.round : ''}:${s}`;
      if (m.stage === 'ko') {
        if (key.has(k)) return 'Ada peserta yang muncul di dua pertandingan pada babak yang sama';
        key.add(k);
      }
    }
  }
  return null;
}

// ─── Sistem grup ─────────────────────────────────────────────────────────────

// Bagi peserta ke `count` grup (ular: seed terbaik tersebar). Urutan `ids` = urutan seed.
export function buildGroups(ids: string[], count: number): Group[] {
  const groups: Group[] = Array.from({ length: count }, (_, i) => ({ name: `Grup ${String.fromCharCode(65 + i)}`, members: [] }));
  ids.forEach((id, i) => {
    const row = Math.floor(i / count);
    const col = i % count;
    groups[row % 2 === 0 ? col : count - 1 - col].members.push(id);
  });
  return groups;
}

// Round robin (metode lingkaran); jumlah ganjil otomatis ada yang libur tiap ronde.
export function buildGroupMatches(groups: Group[]): Match[] {
  const out: Match[] = [];
  groups.forEach((g, gi) => {
    const list: (string | null)[] = [...g.members];
    if (list.length % 2) list.push(null);
    const n = list.length;
    let idx = 0;
    for (let r = 0; r < n - 1; r++) {
      for (let i = 0; i < n / 2; i++) {
        const a = list[i], b = list[n - 1 - i];
        if (a && b) out.push({ id: mid('g'), stage: 'group', group: gi, round: r + 1, index: idx++, a, b, status: 'pending', winner: null });
      }
      list.splice(1, 0, list.pop() as string | null);
    }
  });
  return out;
}

export function standings(matches: Match[], group: Group, gi: number): Standing[] {
  const t = new Map<string, Standing>(group.members.map((id) => [id, { id, main: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }]));
  for (const m of matches) {
    if (m.stage !== 'group' || m.group !== gi || m.status !== 'done') continue;
    const A = t.get(m.a as string), B = t.get(m.b as string);
    if (!A || !B) continue;
    const sa = m.scoreA ?? 0, sb = m.scoreB ?? 0;
    A.main++; B.main++; A.gf += sa; A.ga += sb; B.gf += sb; B.ga += sa;
    if (sa > sb) { A.w++; B.l++; A.pts += 3; } else if (sb > sa) { B.w++; A.l++; B.pts += 3; } else { A.d++; B.d++; A.pts++; B.pts++; }
  }
  const rows = [...t.values()];
  rows.forEach((r) => (r.gd = r.gf - r.ga));
  return rows.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf);
}

// Slot babak gugur dari hasil grup. Kasus umum 2 lolos/grup & jumlah grup genap: A1-B2, C1-D2, ..., B1-A2, D1-C2.
export function knockoutSlotsFromGroups(groups: Group[], tables: Standing[][], perGroup: number): Slot[] {
  const G = groups.length;
  const q = tables.map((t) => t.slice(0, perGroup).map((r) => r.id));
  const total = q.reduce((s, x) => s + x.length, 0);
  const size = nextPow2(Math.max(2, total));
  if (perGroup === 2 && G % 2 === 0 && total === size) {
    const top: Slot[] = [], bottom: Slot[] = [];
    for (let g = 0; g < G; g += 2) {
      top.push(q[g][0], q[g + 1][1]);
      bottom.push(q[g + 1][0], q[g][1]);
    }
    return [...top, ...bottom];
  }
  // Umum: seed rank-major (juara semua grup dulu), BYE ke seed teratas.
  const order: string[] = [];
  for (let rank = 0; rank < perGroup; rank++) {
    const gs = q.map((x) => x[rank]).filter(Boolean);
    order.push(...(rank % 2 ? gs.reverse() : gs));
  }
  return buildSlots(order, size, 'spread');
}

// Status turnamen dari isi match.
export function deriveStatus(matches: Match[]): 'draft' | 'berjalan' | 'selesai' {
  if (!matches.length) return 'draft';
  const real = matches.filter((m) => m.status !== 'bye');
  if (real.length && real.every((m) => m.status === 'done')) {
    const ko = matches.filter((m) => m.stage === 'ko' && !m.third);
    if (!ko.length) return 'selesai';
    const final = ko.reduce((a, b) => (b.round > a.round ? b : a));
    return final.winner ? 'selesai' : 'berjalan';
  }
  return real.some((m) => m.status === 'done') ? 'berjalan' : 'draft';
}
