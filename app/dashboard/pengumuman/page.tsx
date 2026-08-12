'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import { Megaphone, Plus, BellRing } from 'lucide-react';

export default function PengumumanPage() {
  const { pengumumanList, selectedRt, addPengumuman } = useSimStore();

  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [kategori, setKategori] = useState<'Penting' | 'Informasi' | 'Himbauan'>('Penting');

  const filtered = selectedRt === 'ALL' ? pengumumanList : pengumumanList.filter(p => p.rt === selectedRt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul || !isi) return alert('Judul dan isi wajib diisi');

    addPengumuman({
      judul,
      isi,
      kategori,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'Aktif',
      rt: selectedRt === 'ALL' ? '002' : selectedRt
    });

    setJudul('');
    setIsi('');
    alert('Pengumuman berhasil dipublish!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Publikasi Pengumuman Warga</h1>
          <p className="text-slate-400 text-sm">Pengumuman penting dengan indikator status Aktif / Ditarsipkan untuk RT {selectedRt}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* List Pengumuman (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">Pengumuman Aktif</h2>
          {filtered.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  item.kategori === 'Penting'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {item.kategori}
                </span>
                <span className="text-xs text-slate-400 font-mono">{item.tanggal}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.judul}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{item.isi}</p>
            </div>
          ))}
        </div>

        {/* Form Tambah (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Buat Pengumuman Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Pengumuman *</label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Judul pengumuman..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Penting">Penting / Urgent</option>
                <option value="Informasi">Informasi Umum</option>
                <option value="Himbauan">Himbauan Warga</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Isi Pengumuman *</label>
              <textarea
                rows={4}
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Tuliskan isi pengumuman lengkap..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              + Broadcast Pengumuman
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
