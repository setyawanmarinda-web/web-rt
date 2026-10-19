// lib/event/draw.ts
// Algoritma undian doorprize yang dapat dihitung ulang siapa pun (server dan browser memakai kode yang sama).
//
// Alur commit-reveal:
//  1. Saat daftar peserta DIKUNCI: server membuat serverSeed acak (rahasia), lalu menyimpan
//     listHash = SHA-256(daftar peserta kanonik) dan commitment = SHA-256(serverSeed),
//     serta nomor ronde drand yang sedang berjalan (lockRound).
//  2. Saat undian DIJALANKAN: server mengambil randomness drand dari ronde > lockRound
//     (tidak bisa diketahui saat commitment dibuat).
//  3. seed = SHA-256("17an-draw-v1" | serverSeed | drandRandomness | listHash)
//  4. Tiap hadiah p: urutan peserta diacak dengan Fisher-Yates, aliran acak = SHA-256(seed | p | counter),
//     rejection sampling agar tanpa bias; pemenang = `jumlah` pertama dari urutan itu.
//  5. Setelah disahkan, serverSeed dibuka sehingga semua pihak dapat memverifikasi commitment dan hasilnya.

export type DrawParticipant = { id: string; nama: string; alamat?: string };
export type DrawPrize = { id: string; nama: string; jumlah: number };
export type DrawWinner = { prizeId: string; participantId: string };

const enc = new TextEncoder();
const toHex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
export const fromHex = (h: string) => new Uint8Array(h.match(/../g)?.map((x) => parseInt(x, 16)) ?? []);

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? enc.encode(data) : data;
  return toHex(await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource));
}

// Bentuk kanonik daftar peserta: urut berdasarkan id, hanya id|nama|alamat.
export function canonicalList(list: DrawParticipant[]): string {
  return [...list].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((p) => `${p.id}|${p.nama}|${p.alamat ?? ''}`).join('\n');
}
export const listHash = (list: DrawParticipant[]) => sha256Hex(canonicalList(list));
export const commitmentOf = (serverSeedHex: string) => sha256Hex(fromHex(serverSeedHex));
export const finalSeed = (serverSeedHex: string, drandRandomness: string, lHash: string) =>
  sha256Hex(`17an-draw-v1|${serverSeedHex}|${drandRandomness}|${lHash}`);

// Bilangan acak seragam [0, n) dari aliran SHA-256(seed|label|counter).
async function* stream(seed: string, label: string) {
  for (let c = 0; ; c++) {
    const h = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', enc.encode(`${seed}|${label}|${c}`)));
    for (let i = 0; i + 4 <= h.length; i += 4) yield ((h[i] << 24) | (h[i + 1] << 16) | (h[i + 2] << 8) | h[i + 3]) >>> 0;
  }
}
async function uniform(it: AsyncGenerator<number>, n: number): Promise<number> {
  const limit = 4294967296 - (4294967296 % n);
  for (;;) {
    const v = (await it.next()).value as number;
    if (v < limit) return v % n;
  }
}

// Peserta diurutkan berdasarkan id agar hasil tidak bergantung urutan penyimpanan.
export async function runDraw(
  seed: string, participants: DrawParticipant[], prizes: DrawPrize[], allowMultiWin: boolean,
): Promise<DrawWinner[]> {
  const base = participants.map((p) => p.id).sort();
  const won = new Set<string>();
  const out: DrawWinner[] = [];
  for (const prize of prizes) {
    const pool = base.filter((id) => allowMultiWin || !won.has(id));
    const count = Math.min(prize.jumlah, pool.length);
    const it = stream(seed, `prize:${prize.id}`);
    // Fisher-Yates dari belakang; `count` posisi terakhir sudah final.
    for (let i = pool.length - 1; i > pool.length - 1 - count; i--) {
      const j = await uniform(it, i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (const id of pool.slice(pool.length - count).reverse()) { out.push({ prizeId: prize.id, participantId: id }); won.add(id); }
  }
  return out;
}

// ─── Peserta yang dipanggil tidak hadir: undi ulang pengganti ───────────────────
// Pengganti ditentukan deterministik dari seed akhir yang sama: aliran SHA-256(seed | prize:<id>:redo:<n>), n = urutan
// kejadian "tidak hadir" (1, 2, ...). Peserta yang tidak hadir tetap boleh ikut undian berikutnya (termasuk pengganti ini).
export type WinnerEntry = { prizeId: string; participantId: string; revealed?: boolean; absent?: boolean; revealed_at?: string };

export async function applyAbsent(
  winners: WinnerEntry[], idx: number, participantIds: string[], allowMultiWin: boolean, seed: string, n: number,
): Promise<{ winners: WinnerEntry[]; newId: string } | { error: string }> {
  const w = winners[idx];
  if (!w) return { error: 'Pemenang tidak ditemukan' };
  if (w.absent) return { error: 'Pemenang ini sudah ditandai tidak hadir' };
  const others = winners.filter((x, i) => i !== idx && !x.absent);
  const taken = new Set((allowMultiWin ? others.filter((x) => x.prizeId === w.prizeId) : others).map((x) => x.participantId));
  const pool = [...participantIds].sort().filter((id) => !taken.has(id));
  if (!pool.length) return { error: 'Tidak ada peserta tersisa untuk menggantikan' };
  const newId = pool[await uniform(stream(seed, `prize:${w.prizeId}:redo:${n}`), pool.length)];
  const out = winners.map((x) => ({ ...x }));
  out[idx].absent = true;
  out.splice(idx + 1, 0, { prizeId: w.prizeId, participantId: newId, revealed: false });
  return { winners: out, newId };
}

export type Redraw = { n: number; prizeId: string; absentId: string; newId: string };

// Hitung ulang daftar pemenang akhir dari undian awal + catatan tidak-hadir (dipakai halaman bukti).
export async function replayWinners(
  seed: string, participants: DrawParticipant[], prizes: DrawPrize[], allowMultiWin: boolean, redraws: Redraw[],
): Promise<{ winners: WinnerEntry[]; ok: boolean }> {
  let ws: WinnerEntry[] = (await runDraw(seed, participants, prizes, allowMultiWin)).map((w) => ({ ...w }));
  const ids = participants.map((p) => p.id);
  for (const r of [...redraws].sort((a, b) => a.n - b.n)) {
    const idx = ws.findIndex((x) => x.prizeId === r.prizeId && x.participantId === r.absentId && !x.absent);
    if (idx < 0) return { winners: ws, ok: false };
    const res = await applyAbsent(ws, idx, ids, allowMultiWin, seed, r.n);
    if ('error' in res || res.newId !== r.newId) return { winners: ws, ok: false };
    ws = res.winners;
  }
  return { winners: ws, ok: true };
}
