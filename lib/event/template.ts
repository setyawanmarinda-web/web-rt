// lib/event/template.ts — template bagan: struktur + tata letak disimpan tanpa id/nama peserta, lalu dipakai ulang.
// Struktur bagan dibangun deterministik dari (slots, opsi), jadi posisi kartu cukup disimpan menurut URUTAN pertandingan.
import { BYE, type Match, type Slot } from './bracket';
import { JUARA_IDS, mergeTata, type Tata } from './tata';

export type TataIdx = Omit<Tata, 'pos' | 'order' | 'hidden'> & {
  pos: Record<string, { x: number; y: number }>; // kunci = indeks pertandingan babak gugur
  order: Record<string, number[]>;
  hidden: string[]; // "indeksAsal>indeksTujuan" atau "indeksAsal>__j1"
};

export const koOnly = (matches: Match[]) => matches.filter((m) => m.stage === 'ko');

export function tataToIndexed(tata: Tata, ko: Match[]): TataIdx {
  const idx = new Map(ko.map((m, i) => [m.id, i]));
  const pos: TataIdx['pos'] = {};
  for (const [id, v] of Object.entries(tata.pos)) {
    if (idx.has(id)) pos[String(idx.get(id))] = v;
    else if ((JUARA_IDS as readonly string[]).includes(id)) pos[id] = v; // kotak juara tidak bergantung id pertandingan
  }
  const order: TataIdx['order'] = {};
  for (const [r, ids] of Object.entries(tata.order)) order[r] = ids.filter((id) => idx.has(id)).map((id) => idx.get(id) as number);
  const hidden: string[] = [];
  for (const k of tata.hidden) {
    const [a, b] = k.split('>');
    if (!idx.has(a)) continue;
    if (b.startsWith('__j')) hidden.push(`${idx.get(a)}>${b}`);
    else if (idx.has(b)) hidden.push(`${idx.get(a)}>${idx.get(b)}`);
  }
  return { ...tata, pos, order, hidden };
}

export function tataFromIndexed(t: TataIdx, ko: Match[]): Tata {
  const at = (i: unknown) => (typeof i === 'number' || /^\d+$/.test(String(i)) ? ko[Number(i)] : undefined);
  const pos: Tata['pos'] = {};
  for (const [i, v] of Object.entries(t.pos ?? {})) {
    if ((JUARA_IDS as readonly string[]).includes(i)) { pos[i] = v; continue; }
    const m = at(i);
    if (m) pos[m.id] = v;
  }
  const order: Tata['order'] = {};
  for (const [r, list] of Object.entries(t.order ?? {})) order[r] = (list ?? []).map(at).filter((m): m is Match => !!m).map((m) => m.id);
  const hidden: string[] = [];
  for (const k of t.hidden ?? []) {
    const [a, b] = k.split('>');
    const ma = at(a);
    if (!ma) continue;
    if (b?.startsWith('__j')) hidden.push(`${ma.id}>${b}`);
    else { const mb = at(b); if (mb) hidden.push(`${ma.id}>${mb.id}`); }
  }
  return { ...t, pos, order, hidden };
}

// Slot babak 1 (id peserta/BYE) -> indeks peserta (-1 = BYE), dan sebaliknya.
export const slotsToIdx = (slots: Slot[], participantIds: string[]) => slots.map((s) => (s === BYE ? -1 : participantIds.indexOf(s as string)));
export const slotsFromIdx = (idx: number[], participantIds: string[]): Slot[] => idx.map((i) => (i < 0 ? BYE : participantIds[i] ?? null));

// Lengkapi tata letak berindeks (dari template) dengan nilai bawaan.
export function mergeIdx(x: unknown): TataIdx {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<TataIdx>;
  const d = mergeTata(null);
  return { ...d, ...o, colors: { ...d.colors, ...(o.colors ?? {}) }, pos: o.pos ?? {}, order: o.order ?? {}, hidden: o.hidden ?? [] };
}
