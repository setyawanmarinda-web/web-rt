'use client';

import React, { useState } from 'react';
import { useSimStore } from '@/lib/store';
import { ShoppingBag, MessageCircle, Store, Plus } from 'lucide-react';

export default function UmkmPage() {
  const { umkmList, addUmkm } = useSimStore();

  const [namaUsaha, setNamaUsaha] = useState('');
  const [pemilik, setPemilik] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState<'Kuliner' | 'Jasa' | 'Kelontong' | 'Fashion' | 'Lainnya'>('Kuliner');
  const [whatsapp, setWhatsapp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaUsaha || !whatsapp) return alert('Nama Usaha dan No WhatsApp wajib diisi');

    addUmkm({
      nama_usaha: namaUsaha,
      pemilik: pemilik || 'Warga RT 002',
      deskripsi,
      kategori,
      whatsapp: whatsapp.startsWith('62') ? whatsapp : '62' + whatsapp.replace(/^0/, ''),
      rt: '002'
    });

    setNamaUsaha('');
    setPemilik('');
    setDeskripsi('');
    setWhatsapp('');
    alert('Usaha UMKM berhasil ditambahkan ke direktori!');
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Direktori UMKM Warga RW 012</h1>
          <p className="text-slate-400 text-sm">Promosi usaha warga lokal (Agen Cemilan, Jasa Perbaikan, Kuliner) dengan kontak WhatsApp langsung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Grid UMKM List (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {umkmList.map((u) => (
            <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                    {u.kategori}
                  </span>
                  <span className="text-xs text-slate-400">Pemilik: {u.pemilik}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{u.nama_usaha}</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">{u.deskripsi}</p>
              </div>

              <a
                href={`https://wa.me/${u.whatsapp}?text=Halo%20${encodeURIComponent(u.nama_usaha)},%20saya%20warga%20RW%20012%20ingin%20bertanya...`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold border border-emerald-500/30 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi via WhatsApp ({u.whatsapp})</span>
              </a>
            </div>
          ))}
        </div>

        {/* Form Tambah UMKM (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Daftarkan UMKM Anda</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Usaha *</label>
              <input
                type="text"
                value={namaUsaha}
                onChange={(e) => setNamaUsaha(e.target.value)}
                placeholder="Contoh: Agen Cemilan Bu Virna"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Pemilik</label>
              <input
                type="text"
                value={pemilik}
                onChange={(e) => setPemilik(e.target.value)}
                placeholder="Ibu Virna"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Usaha</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Kuliner">Kuliner / Makanan</option>
                <option value="Jasa">Jasa / Perbaikan</option>
                <option value="Kelontong">Toko Kelontong / Sembako</option>
                <option value="Fashion">Fashion / Pakaian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">No WhatsApp (Diawali 62/08) *</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="628123456789"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Produk / Layanan</label>
              <textarea
                rows={3}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Menyediakan aneka cemilan pedas..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              + Simpan UMKM
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
