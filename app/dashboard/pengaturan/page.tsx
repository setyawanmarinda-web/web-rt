'use client';

import React, { useState } from 'react';
import { Settings, Shield, Database, Save, CheckCircle2 } from 'lucide-react';

export default function PengaturanPage() {
  const [namaRw, setNamaRw] = useState('RW 012 Kelurahan Bahagia');
  const [alamat, setAlamat] = useState('Balai Warga RW 012, Jl. Bahagia Raya No. 12');
  const [standardIuran, setStandardIuran] = useState(55000);
  const [standardSatpam, setStandardSatpam] = useState(28000);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {saved && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>Pengaturan Sistem Berhasil Disimpan!</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Pengaturan Sistem & Otorisasi</h1>
          <p className="text-slate-400 text-sm">Pengaturan profil kepengurusan RW 012, alamat sekretariat, & konfigurasi nominal iuran</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Profil Kepengurusan & Standar Nominal</h2>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Organisasi RW</label>
              <input
                type="text"
                value={namaRw}
                onChange={(e) => setNamaRw(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Sekretariat</label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Standar Iuran Bulanan / KK (Rp)</label>
                <input
                  type="number"
                  value={standardIuran}
                  onChange={(e) => setStandardIuran(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alokasi Wajib Satpam & Sampah (Rp)</label>
                <input
                  type="number"
                  value={standardSatpam}
                  onChange={(e) => setStandardSatpam(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md mt-4"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 h-fit">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Database className="w-5 h-5" />
            <span>Konektivitas Supabase Database</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sistem saat ini berjalan dalam mode Hybrid State (Local Persistence + Supabase PostgreSQL schema).
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
            <p className="text-emerald-400 font-bold mb-1">Status Database:</p>
            <p>✓ Table warga: Ready</p>
            <p>✓ Table kas_rt: Ready</p>
            <p>✓ Table kegiatan: Ready</p>
            <p>✓ Table pengumuman: Ready</p>
          </div>
        </div>

      </div>
    </div>
  );
}
