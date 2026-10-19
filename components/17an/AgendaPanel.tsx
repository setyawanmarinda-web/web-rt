'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DatePickerField from '@/components/DatePickerField';
import { Plus, Pencil, Trash2, X, CalendarDays, MapPin, Clock, Swords } from 'lucide-react';
import { BYE, type Match } from '@/lib/event/bracket';
import { roundName } from '@/lib/event/labels';
import { parseJadwal } from '@/lib/event/jadwal';

export type EventItem = {
  id: string; judul: string; kategori: 'Jadwal' | 'Lomba' | 'Informasi'; deskripsi: string;
  tanggal: string; waktu: string; lokasi: string;
  status: 'Akan Datang' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';
};

const KATEGORI = ['Jadwal', 'Lomba', 'Informasi'] as const;
const STATUS = ['Akan Datang', 'Berlangsung', 'Selesai', 'Dibatalkan'] as const;
const EMPTY = { judul: '', kategori: 'Jadwal', deskripsi: '', tanggal: '', waktu: '', lokasi: '', status: 'Akan Datang' };
const BADGE: Record<string, string> = {
  Jadwal: 'bg-sky-500/20 text-sky-300', Lomba: 'bg-rose-500/20 text-rose-300', Informasi: 'bg-amber-500/20 text-amber-300',
};
const input = 'w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-400';

// Jadwal pertandingan bagan yang tampil otomatis di daftar Jadwal (hanya baca; diubah lewat tab Bracket Pertandingan).
type Row = EventItem & { match?: { tournament: string; skor?: string } };
type TournamentLite = { nama: string; cabang?: string; layout?: 'standard' | 'dua-kelompok'; participants: { id: string; nama: string }[]; groups: { name: string }[]; matches: Match[] };

function matchRows(ts: TournamentLite[]): Row[] {
  const rows: Row[] = [];
  for (const t of ts) {
    const nm = (id: string | null) => (id === BYE ? 'BYE' : id ? t.participants.find((p) => p.id === id)?.nama ?? '?' : 'Menunggu pemenang');
    const ko = t.matches.filter((m) => m.stage === 'ko' && !m.third);
    const total = Math.max(0, ...ko.map((m) => m.round));
    for (const m of t.matches) {
      if (m.status === 'bye' || !parseJadwal(m.jadwal)) continue;
      const [tanggal, jam] = (m.jadwal as string).split('T');
      const babak = m.third ? 'Perebutan Juara 3' : m.stage === 'group' ? `Fase grup · ${t.groups[m.group ?? 0]?.name ?? ''}` : roundName(m.round, total, t.layout ?? 'standard');
      const skor = m.status === 'done' ? `${m.scoreA} – ${m.scoreB}` : undefined;
      rows.push({
        id: `match:${m.id}`, judul: `${nm(m.a)} vs ${nm(m.b)}`, kategori: 'Jadwal',
        deskripsi: `${t.nama}${t.cabang ? ` (${t.cabang})` : ''} · ${babak}${skor ? `\nHasil: ${skor}` : ''}`,
        tanggal, waktu: jam ? jam.replace(':', '.') : '', lokasi: m.lokasi ?? '', status: m.status === 'done' ? 'Selesai' : 'Akan Datang',
        match: { tournament: t.nama, skor },
      });
    }
  }
  return rows;
}

const HOUR = 3600e3;
// Mulai & selesai sebuah baris. Waktu bebas ("19.30", "08.00 WIB") dibaca dari angka jam di awal; tanpa jam = sehari penuh.
function span(r: { tanggal: string; waktu: string }): { start: number; end: number } | null {
  const hm = /^\s*(\d{1,2})[.:](\d{2})/.exec(r.waktu ?? '');
  const p = parseJadwal(hm ? `${r.tanggal}T${hm[1].padStart(2, '0')}:${hm[2]}` : r.tanggal);
  return p ? { start: p.start, end: p.allDay ? p.start + 24 * HOUR : p.start + 2 * HOUR } : null; // pertandingan/acara dianggap ±2 jam
}

export default function AgendaPanel({ isMaster, onOpenBracket }: { isMaster: boolean; onOpenBracket?: () => void }) {
  const [tournaments, setTournaments] = useState<TournamentLite[]>([]);
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'Semua' | (typeof KATEGORI)[number]>('Semua');
  const [showPast, setShowPast] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000); // yang sudah lewat hilang otomatis tanpa refresh
    return () => window.clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/17an/events');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal memuat');
      setItems(await res.json());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat');
    } finally {
      setLoading(false);
    }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    let alive = true;
    fetch('/api/17an/beranda').then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d?.tournaments) setTournaments(d.tournaments); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.tanggal) return alert('Tanggal wajib diisi');
    const res = await fetch('/api/17an/events', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });
    if (!res.ok) return alert((await res.json().catch(() => ({}))).error || 'Gagal menyimpan');
    setForm(null); setEditingId(null); load();
  };

  const remove = async (it: EventItem) => {
    if (!window.confirm(`Hapus "${it.judul}"?`)) return;
    const res = await fetch(`/api/17an/events?id=${it.id}`, { method: 'DELETE' });
    if (!res.ok) return alert((await res.json().catch(() => ({}))).error || 'Gagal menghapus');
    load();
  };

  const edit = (it: EventItem) => {
    setEditingId(it.id);
    setForm({ judul: it.judul, kategori: it.kategori, deskripsi: it.deskripsi, tanggal: it.tanggal, waktu: it.waktu, lokasi: it.lokasi, status: it.status });
  };

  // Yang paling dekat waktunya di atas. Jadwal yang sudah lewat hilang otomatis (bisa ditampilkan lewat pilihan di bawah);
  // lomba/informasi tidak disembunyikan, hanya dipindah ke bawah bila tanggalnya sudah lewat.
  const all: (Row & { t: { start: number; end: number } | null; past: boolean })[] = [...items, ...matchRows(tournaments)].map((r) => {
    const t = span(r);
    return { ...r, t, past: !!t && t.end <= now };
  });
  const byKategori = all.filter((i) => filter === 'Semua' || i.kategori === filter);
  const pastJadwal = byKategori.filter((i) => i.past && i.kategori === 'Jadwal');
  const upcoming = byKategori.filter((i) => !i.past).sort((a, b) => (a.t?.start ?? Infinity) - (b.t?.start ?? Infinity));
  const pastShown = byKategori.filter((i) => i.past && (i.kategori !== 'Jadwal' || showPast)).sort((a, b) => (b.t?.start ?? 0) - (a.t?.start ?? 0));
  const shown = [...upcoming, ...pastShown];
  const nextId = upcoming.find((i) => i.kategori === 'Jadwal')?.id;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {(['Semua', ...KATEGORI] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${filter === k ? 'bg-rose-500/20 border-rose-400 text-rose-200' : 'border-slate-700 text-slate-400'}`}>
              {k}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
          Tampilkan jadwal yang sudah lewat{pastJadwal.length > 0 ? ` (${pastJadwal.length})` : ''}
        </label>
        {isMaster && (
          <button onClick={() => { setEditingId(null); setForm({ ...EMPTY }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      {form && isMaster && (
        <form onSubmit={submit} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm">{editingId ? 'Ubah agenda' : 'Agenda baru'}</h3>
            <button type="button" onClick={() => { setForm(null); setEditingId(null); }}><X className="w-4 h-4" /></button>
          </div>
          <input className={input} placeholder="Judul" required maxLength={150} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <select className={input} value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
              {KATEGORI.map((k) => <option key={k}>{k}</option>)}
            </select>
            <DatePickerField label="Tanggal" required value={form.tanggal} onChange={(v) => setForm({ ...form, tanggal: v })} colorTheme="emerald" />
            <input className={input} placeholder="Waktu (mis. 08.00)" maxLength={20} value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} />
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <input className={input} placeholder="Lokasi" maxLength={150} value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
          <textarea className={input} rows={3} placeholder="Deskripsi" maxLength={2000} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
          <button className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-sm font-medium">Simpan</button>
        </form>
      )}

      {loading ? <p className="text-sm text-slate-400">Memuat…</p>
        : error ? <p className="text-sm text-red-400">{error}</p>
        : shown.length === 0 ? <p className="text-sm text-slate-500">Belum ada agenda.</p>
        : (
          <ul className="space-y-3">
            {shown.map((it) => (
              <li key={it.id} className={`bg-slate-900/90 border rounded-xl p-4 ${it.id === nextId ? 'border-amber-400/60 shadow-[0_0_16px_#fbbf2433]' : 'border-slate-800'} ${it.past ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${BADGE[it.kategori]}`}>{it.kategori}</span>
                      {it.match && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 flex items-center gap-1"><Swords className="w-3 h-3" />Pertandingan</span>}
                      {it.id === nextId && <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-300 text-slate-950">BERIKUTNYA</span>}
                      {it.past && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">Sudah lewat</span>}
                      <span className="text-[10px] text-slate-400">{it.status}</span>
                    </div>
                    <h3 className={`font-semibold break-words ${it.status === 'Selesai' && it.match ? 'text-slate-400' : 'text-slate-100'}`}>{it.judul}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{new Date(it.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {it.waktu && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{it.waktu}</span>}
                      {it.lokasi && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{it.lokasi}</span>}
                    </div>
                    {it.deskripsi && <p className="mt-2 text-sm text-slate-300 whitespace-pre-line break-words">{it.deskripsi}</p>}
                  </div>
                  {it.match && onOpenBracket && (
                    <button onClick={onOpenBracket} className="shrink-0 text-[11px] font-semibold text-fuchsia-300 hover:underline">Lihat bagan</button>
                  )}
                  {isMaster && !it.match && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => edit(it)} aria-label="Ubah" className="p-2 rounded-lg hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(it)} aria-label="Hapus" className="p-2 rounded-lg hover:bg-slate-800 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
