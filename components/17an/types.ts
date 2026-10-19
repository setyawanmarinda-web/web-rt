import type { Match, Group } from '@/lib/event/bracket';

export type TParticipant = { id: string; nama: string; tim?: string };
export type Tournament = {
  id: string; nama: string; cabang: string; mode: 'single' | 'group'; status: 'draft' | 'berjalan' | 'selesai';
  group_count: number; advance_per_group: number; layout?: 'standard' | 'dua-kelompok'; third_place?: boolean; tata_letak?: Partial<import('@/lib/event/tata').Tata> | null;
  participants: TParticipant[]; groups: Group[]; matches: Match[];
};
export type TournamentSummary = { id: string; nama: string; cabang: string; mode: 'single' | 'group'; status: string; jumlah_peserta: number };

export const inputCls = 'w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-400';
export const btnCls = 'px-3 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white text-sm font-medium';
export const btn2Cls = 'px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm text-slate-200 disabled:opacity-50';

// Panggil API; pada 409 minta konfirmasi lalu ulangi dengan konfirmasi=true.
export async function callApi<T>(url: string, method: string, body?: unknown): Promise<T> {
  const go = (b?: unknown) => fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  let res = await go(body);
  if (res.status === 409 && body && typeof body === 'object') {
    const msg = (await res.clone().json().catch(() => ({}))).error as string | undefined;
    if (msg && /konfirmasi/i.test(msg) && window.confirm(msg.replace(/;? ?kirim konfirmasi=true.*$/i, '') + '\n\nLanjutkan?')) {
      res = await go({ ...body, konfirmasi: true });
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Gagal (${res.status})`);
  return data as T;
}

export type TemplateSummary = { id: string; nama: string; mode: 'single' | 'group'; jumlah_peserta: number };
