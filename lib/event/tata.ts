// lib/event/tata.ts — pengaturan tata letak bagan (posisi kartu, jarak, garis alur). Dipakai browser & server.
export type Tata = {
  gapX: number; // jarak antar kolom (px)
  cardW: number; // lebar kartu (px)
  gapY: number; // jarak minimum antar kartu dalam kolom (px)
  lineStyle: 'siku' | 'lurus' | 'lengkung';
  lineW: number; // tebal garis
  showLines: boolean;
  lineMode: 'semua' | 'hanya-menang'; // tampilkan semua garis atau hanya yang pemenangnya sudah maju
  pos: Record<string, { x: number; y: number }>; // id pertandingan -> pergeseran bebas (px) hasil seret kartu
  order: Record<string, string[]>; // nomor babak -> urutan id pertandingan dari atas ke bawah
  hidden: string[]; // garis yang disembunyikan: "idAsal>idTujuan"
  colors: { idle: string; done: string; loser: string; border: string }; // warna garis alur & garis tepi kartu (hex)
  borderMode: 'babak' | 'satu' | 'mati'; // tepi kartu: warna beda tiap babak / satu warna / tanpa warna khusus
  glow: boolean; // efek menyala (neon)
};

// Warna stabilo/neon yang tampak jelas di latar gelap.
export const NEON = ['#ff2bd6', '#00e5ff', '#39ff14', '#ffea00', '#ff9100', '#b388ff', '#ff4081', '#76ff03'];
// Warna medali — dipakai bersama oleh bagan dan klasemen akhir agar seragam.
export const MEDAL_COLOR = { 1: '#ffea00', 2: '#00e5ff', 3: '#ff9100' } as const;
export const NEON_TEXT = { jadwal: '#ffea00' } as const; // tanggal kuning neon; lokasi mengikuti warna tepi babak
export const PRESET_NEON = { colors: { idle: '#00e5ff', done: '#39ff14', loser: '#ffea00', border: '#ff2bd6' }, borderMode: 'babak' as const, glow: true };
export const PRESET_KLASIK = { colors: { idle: '#475569', done: '#10b981', loser: '#fbbf24', border: '#475569' }, borderMode: 'mati' as const, glow: false };

export const TATA_DEFAULT: Tata = {
  gapX: 40, cardW: 240, gapY: 12, lineStyle: 'siku', lineW: 2, showLines: true, lineMode: 'semua', pos: {}, order: {}, hidden: [], ...PRESET_NEON,
};

const clamp = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d;
};

// Data lama menyimpan `offsets` (angka = geser vertikal); ubah menjadi `pos`.
function legacyPos(x?: Record<string, any> | null): Record<string, { x: number; y: number }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const out: Record<string, { x: number; y: number }> = {};
  for (const [k, v] of Object.entries(x?.offsets ?? {})) if (typeof v === 'number') out[k] = { x: 0, y: v };
  for (const [k, v] of Object.entries(x?.pos ?? {})) out[k] = v as { x: number; y: number };
  return out;
}

export const JUARA_IDS = ['__j1', '__j2', '__j3'] as const;

const hex = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : d);

export function mergeTata(x?: Partial<Tata> | null): Tata {
  return { ...TATA_DEFAULT, ...(x ?? {}), colors: { ...TATA_DEFAULT.colors, ...(x?.colors ?? {}) }, pos: legacyPos(x), order: { ...(x?.order ?? {}) }, hidden: [...(x?.hidden ?? [])] };
}

// Bersihkan masukan dari klien: batasi angka, buang id yang tidak dikenal. `matchIds` = id pertandingan sah.
export function sanitizeTata(x: unknown, matchIds: string[]): Tata {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const ids = new Set([...matchIds, ...JUARA_IDS]); // kotak Juara 1/2/3 juga bisa diatur posisinya
  const pos: Record<string, { x: number; y: number }> = {};
  for (const [k, v] of Object.entries(legacyPos(o))) {
    if (!ids.has(k)) continue;
    const x = clamp(v?.x, -1200, 1200, 0), y = clamp(v?.y, -1200, 1200, 0);
    if (x || y) pos[k] = { x, y };
  }
  const order: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(o.order ?? {})) {
    if (!/^\d{1,2}$/.test(k) || !Array.isArray(v)) continue;
    const list = v.filter((id): id is string => typeof id === 'string' && ids.has(id));
    order[k] = [...new Set(list)];
  }
  const hidden = (Array.isArray(o.hidden) ? o.hidden : []).filter((k: unknown): k is string => {
    if (typeof k !== 'string') return false;
    const [a, b] = k.split('>');
    return ids.has(a) && (ids.has(b) || b === '__j1' || b === '__j2');
  });
  return {
    gapX: clamp(o.gapX, 16, 160, TATA_DEFAULT.gapX),
    cardW: clamp(o.cardW, 160, 360, TATA_DEFAULT.cardW),
    gapY: clamp(o.gapY, 0, 80, TATA_DEFAULT.gapY),
    lineStyle: ['siku', 'lurus', 'lengkung'].includes(o.lineStyle) ? o.lineStyle : 'siku',
    lineW: clamp(o.lineW, 1, 5, TATA_DEFAULT.lineW),
    showLines: o.showLines !== false,
    lineMode: o.lineMode === 'hanya-menang' ? 'hanya-menang' : 'semua',
    pos, order, hidden: [...new Set<string>(hidden)],
    colors: {
      idle: hex(o.colors?.idle, TATA_DEFAULT.colors.idle), done: hex(o.colors?.done, TATA_DEFAULT.colors.done),
      loser: hex(o.colors?.loser, TATA_DEFAULT.colors.loser), border: hex(o.colors?.border, TATA_DEFAULT.colors.border),
    },
    borderMode: ['babak', 'satu', 'mati'].includes(o.borderMode) ? o.borderMode : 'babak',
    glow: o.glow !== false,
  };
}
