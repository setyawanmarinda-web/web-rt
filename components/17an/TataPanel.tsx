'use client';

import React from 'react';
import { X } from 'lucide-react';
import { NEON, PRESET_KLASIK, PRESET_NEON, type Tata } from '@/lib/event/tata';
import { btn2Cls, btnCls, inputCls } from './types';

const Swatch = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="text-xs text-slate-400 space-y-1">
    <div>{label}</div>
    <div className="flex flex-wrap items-center gap-1.5">
      {NEON.map((c) => (
        <button key={c} type="button" aria-label={c} onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 ${value === c ? 'border-white' : 'border-slate-700'}`} style={{ background: c, boxShadow: `0 0 8px ${c}aa` }} />
      ))}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-7 bg-transparent cursor-pointer" aria-label="Warna lain" />
    </div>
  </div>
);

// Pengaturan tampilan bagan (warna & garis) + bilah simpan untuk posisi kartu hasil seret.
// Draft lokal; tersimpan hanya lewat tombol Simpan.
export default function TataPanel({ tata, arrange, dirty, busy, onChange, onSave, onCancel, onReset }: {
  tata: Tata; arrange: boolean; dirty: boolean; busy: boolean; onChange: (t: Tata) => void; onSave: () => void; onCancel: () => void; onReset: () => void;
}) {
  const set = (p: Partial<Tata>) => onChange({ ...tata, ...p });
  return (
    <div className="relative bg-slate-900 border border-rose-500/40 rounded-xl p-4 pr-12 space-y-4">
      <button type="button" aria-label="Tutup" title="Tutup" disabled={busy}
        onClick={() => { if (!dirty || window.confirm('Buang perubahan yang belum disimpan?')) onCancel(); }}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50"><X className="w-5 h-5" /></button>
      <p className="text-xs text-slate-300">
        {arrange ? 'Mode atur posisi: seret kartu sesuai keinginan; garis panah mengikuti pusat kartu. Klik sebuah garis untuk menyembunyikan / menampilkannya.' : 'Warna & garis bagan.'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn2Cls} onClick={() => set({ ...PRESET_NEON, colors: { ...PRESET_NEON.colors } })}>🌈 Neon stabilo</button>
        <button className={btn2Cls} onClick={() => set({ ...PRESET_KLASIK, colors: { ...PRESET_KLASIK.colors } })}>Klasik (redup)</button>
        <label className="flex items-center gap-2 text-sm ml-2"><input type="checkbox" checked={tata.glow} onChange={(e) => set({ glow: e.target.checked })} /> Efek menyala</label>
        <label className="flex items-center gap-2 text-sm ml-2"><input type="checkbox" checked={tata.showLines} onChange={(e) => set({ showLines: e.target.checked })} /> Tampilkan garis alur</label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-slate-400">Garis tepi kartu
          <select className={inputCls} value={tata.borderMode} onChange={(e) => set({ borderMode: e.target.value as Tata['borderMode'] })}>
            <option value="babak">Warna berbeda tiap babak (neon)</option>
            <option value="satu">Satu warna untuk semua</option>
            <option value="mati">Tanpa warna khusus</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">Gaya garis
          <select className={inputCls} value={tata.lineStyle} onChange={(e) => set({ lineStyle: e.target.value as Tata['lineStyle'] })}>
            <option value="siku">Siku (kotak)</option><option value="lurus">Lurus</option><option value="lengkung">Lengkung</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">Garis yang ditampilkan
          <select className={inputCls} value={tata.lineMode} onChange={(e) => set({ lineMode: e.target.value as Tata['lineMode'] })}>
            <option value="semua">Semua jalur</option><option value="hanya-menang">Hanya jalur pemenang</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Swatch label="Garis alur: pemenang sudah maju" value={tata.colors.done} onChange={(v) => set({ colors: { ...tata.colors, done: v } })} />
        <Swatch label="Garis alur: menunggu hasil" value={tata.colors.idle} onChange={(v) => set({ colors: { ...tata.colors, idle: v } })} />
        <Swatch label="Garis alur: yang kalah (juara 2 / 3)" value={tata.colors.loser} onChange={(v) => set({ colors: { ...tata.colors, loser: v } })} />
        {tata.borderMode === 'satu' && <Swatch label="Warna tepi kartu" value={tata.colors.border} onChange={(v) => set({ colors: { ...tata.colors, border: v } })} />}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={btnCls} disabled={busy || !dirty} onClick={onSave}>Simpan</button>
        <button className={btn2Cls} disabled={busy} onClick={() => onChange({ ...tata, pos: {}, hidden: [] })}>Kembalikan posisi kartu</button>
        <button className={btn2Cls} disabled={busy} onClick={() => { if (window.confirm('Kembalikan semua pengaturan tampilan ke otomatis?')) onReset(); }}>Reset ke otomatis</button>
      </div>
    </div>
  );
}
