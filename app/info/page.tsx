'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useSimStore } from '@/lib/store';
import {
  Building2, ShieldCheck, Wallet, ShoppingBag, Megaphone,
  Calendar, FileText, ArrowRight, CheckCircle2, Users, MapPin
} from 'lucide-react';

export default function InfoPage() {
  const { kegiatanList, pengumumanList, umkmList } = useSimStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Megaphone className="w-4 h-4" />
            <span>Pusat Informasi Resmi Warga</span>
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Informasi, Agenda & Layanan RW 012
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Dapatkan berita pengumuman resmi, jadwal kegiatan kerja bakti/posyandu, serta promosi produk UMKM warga Kelurahan Bahagia.
          </p>
        </div>

        {/* Section Pengumuman Warga */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Pengumuman Terbaru</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pengumumanList.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    item.kategori === 'Penting'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.kategori}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{item.tanggal}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{item.judul}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{item.isi}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section Agenda Kegiatan */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-teal-400" />
              <h2 className="text-2xl font-bold text-white">Jadwal Agenda Kegiatan Warga</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kegiatanList.map((g) => (
              <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-teal-500/40 transition-all">
                <span className="px-3 py-1 bg-teal-500/10 text-teal-300 text-xs font-bold rounded-lg border border-teal-500/20 inline-block">
                  {g.kategori}
                </span>
                <h3 className="text-lg font-bold text-white">{g.judul}</h3>
                <p className="text-slate-300 text-xs leading-relaxed">{g.deskripsi}</p>
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <p><strong className="text-slate-200">Tanggal:</strong> {g.tanggal}</p>
                  <p><strong className="text-slate-200">Waktu:</strong> {g.waktu}</p>
                  <p><strong className="text-slate-200">Lokasi:</strong> {g.lokasi}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
