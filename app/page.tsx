'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useSimStore } from '@/lib/store';
import {
  Building2, ShieldCheck, Wallet, ShoppingBag, Megaphone,
  Calendar, FileText, ArrowRight, CheckCircle2, Users, MapPin, Sparkles, MessageCircle
} from 'lucide-react';

export default function HomePage() {
  const { umkmList, kegiatanList, pengumumanList } = useSimStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 space-y-20 pb-20">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
          
          {/* Subtle Ambient Light Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Portal Resmi RW 012 Kelurahan Bahagia</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
                Digitalisasi Administrasi & <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">Transparansi Keuangan</span> RW 012
              </h1>

              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-normal">
                Sistem Terpadu Layanan Warga, Pencatatan Iuran Bulanan 5 Pos Keuangan (Satpam/Sampah, Kas RT, Dansos, 17-an, THR), & Direktori UMKM Lokal.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/dashboard/kas"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-extrabold rounded-2xl text-base shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Buka Panel RT / Kas & Iuran</span>
                </Link>

                <Link
                  href="/info"
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-base border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Megaphone className="w-5 h-5 text-emerald-400" />
                  <span>Pusat Informasi Warga</span>
                </Link>
              </div>

            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Transparansi 5 Pos Keuangan</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Pencatatan iuran terpisah per pos (Kas RT, Dansos, Satpam & Sampah, 17-an, THR) serta fleksibilitas pembayaran titipan & split cash/transfer.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Statistik & Kependudukan</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Pendataan warga terintegrasi NIK, status tinggal (Tetap / Kontrak), serta visualisasi grafik demografi kependudukan RT.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Pemberdayaan UMKM Lokal</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Direktori promosi produk usaha warga (Kuliner, Jasa, Kelontong) dengan tautan kontak WhatsApp langsung.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION UMKM SHOWCASE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Pemberdayaan Ekonomi Warga
              </span>
              <h2 className="text-3xl font-black text-white">UMKM Unggulan Warga RW 012</h2>
            </div>
            <Link
              href="/dashboard/umkm"
              className="text-sm font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
            >
              <span>Lihat Semua Usaha</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {umkmList.map((u) => (
              <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {u.kategori}
                    </span>
                    <span className="text-xs text-slate-400">{u.pemilik}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{u.nama_usaha}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">{u.deskripsi}</p>
                </div>

                <a
                  href={`https://wa.me/${u.whatsapp}?text=Halo%20${encodeURIComponent(u.nama_usaha)},%20saya%20warga%20RW%20012...`}
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
        </section>

      </main>

      <Footer />
    </div>
  );
}
