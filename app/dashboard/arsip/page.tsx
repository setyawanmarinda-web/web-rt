'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import { FolderArchive, Download, FileText, Upload } from 'lucide-react';

export default function ArsipPage() {
  const { arsipList, addArsip } = useSimStore();

  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<'Notulen Rapat' | 'SK Kepengurusan' | 'Peraturan RW' | 'Laporan Keuangan'>('Notulen Rapat');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul) return alert('Judul arsip wajib diisi');

    addArsip({
      judul,
      kategori,
      file_url: '#',
      ukuran: '1.5 MB'
    });

    setJudul('');
    alert('Dokumen arsip digital berhasil ditambahkan!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Arsip Digital & Dokumen RW 012</h1>
          <p className="text-slate-400 text-sm">Penyimpanan PDF notulen rapat, SK kepengurusan, & Peraturan RW 012 Kelurahan Bahagia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* List Arsip (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <h2 className="text-lg font-bold text-white mb-4">Arsip Dokumen Resmi</h2>
          {arsipList.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  PDF
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{item.judul}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-emerald-400">{item.kategori}</span>
                    <span>•</span>
                    <span>Upload: {item.tanggal_upload}</span>
                    <span>•</span>
                    <span>{item.ukuran}</span>
                  </div>
                </div>
              </div>

              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert(`Mengunduh berkas "${item.judul}"...`); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </a>
            </div>
          ))}
        </div>

        {/* Form Upload (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Unggah Arsip PDF Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Dokumen *</label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Peraturan Ronda Malam 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Dokumen</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Notulen Rapat">Notulen Rapat</option>
                <option value="SK Kepengurusan">SK Kepengurusan</option>
                <option value="Peraturan RW">Peraturan RW 012</option>
                <option value="Laporan Keuangan">Laporan Keuangan</option>
              </select>
            </div>

            <div className="p-6 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl text-center bg-slate-950/50 cursor-pointer">
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">Klik atau tarik file PDF ke area ini</p>
              <p className="text-[10px] text-slate-500 mt-1">Maksimal ukuran file 10 MB</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              + Simpan Berkas Arsip
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
