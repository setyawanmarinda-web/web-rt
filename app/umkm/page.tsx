'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, MessageCircle, Search, ShoppingBag } from 'lucide-react';

type Umkm = {
  id: string;
  nama_usaha: string;
  pemilik: string;
  deskripsi: string;
  kategori: string;
  whatsapp: string;
  foto_url?: string;
  rt?: string;
};

const KATEGORI = ['Semua', 'Kuliner', 'Jasa', 'Kelontong', 'Fashion', 'Lainnya'];

function waNumber(raw: string) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('0')) return `62${d.slice(1)}`;
  if (d.startsWith('8')) return `62${d}`;
  return d;
}

export default function DirektoriUmkmPage() {
  const [list, setList] = useState<Umkm[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [rt, setRt] = useState('Semua');

  useEffect(() => {
    let alive = true;
    fetch('/api/umkm/public')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (alive && Array.isArray(d)) setList(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const rtOptions = useMemo(
    () => ['Semua', ...Array.from(new Set(list.map((u) => u.rt).filter(Boolean) as string[])).sort()],
    [list],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((u) => {
      if (kategori !== 'Semua' && u.kategori !== kategori) return false;
      if (rt !== 'Semua' && u.rt !== rt) return false;
      if (!needle) return true;
      return [u.nama_usaha, u.pemilik, u.deskripsi].some((v) => (v || '').toLowerCase().includes(needle));
    });
  }, [list, q, kategori, rt]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 shrink-0 rounded-xl border bg-purple-500/10 border-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Direktori UMKM Warga RW 012</h1>
              <p className="text-sm text-slate-400">
                Usaha warga dari semua RT. Hubungi penjual langsung lewat WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 text-sm flex-1">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama usaha, pemilik, atau produk..."
              className="bg-transparent text-white focus:outline-none w-full"
            />
          </div>
          <select
            value={rt}
            onChange={(e) => setRt(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {rtOptions.map((r) => (
              <option key={r} value={r}>
                {r === 'Semua' ? 'Semua RT' : `RT ${r}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {KATEGORI.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKategori(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                kategori === k
                  ? 'bg-emerald-500 text-slate-950 border-transparent'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-slate-500">Memuat data UMKM...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada UMKM yang cocok.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all"
            >
              <div>
                {u.foto_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.foto_url} alt={u.nama_usaha} className="h-36 w-full object-cover rounded-xl mb-4" />
                )}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {u.kategori}
                  </span>
                  <span className="text-xs text-slate-400">
                    {u.pemilik}
                    {u.rt ? ' · RT ' + u.rt : ''}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{u.nama_usaha}</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">{u.deskripsi}</p>
              </div>

              <a
                href={`https://wa.me/${waNumber(u.whatsapp)}?text=${encodeURIComponent(
                  `Halo ${u.nama_usaha}, saya warga RW 012...`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold border border-emerald-500/30 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi Penjual via WhatsApp</span>
              </a>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
