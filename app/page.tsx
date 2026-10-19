'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import StatistikPanel from '@/components/StatistikPanel';
import {
  ShieldCheck, ShoppingBag, Megaphone, Calendar, FileText, ArrowRight,
  Users, Sparkles, MessageCircle, Trophy, FolderArchive, FileSpreadsheet, Package,
} from 'lucide-react';

type Icon = React.ComponentType<{ className?: string }>;

const HIGHLIGHTS: { href: string; title: string; desc: string; icon: Icon; iconBox: string }[] = [
  {
    href: '/umkm',
    title: 'Pemberdayaan UMKM Lokal',
    desc: 'Direktori promosi produk usaha warga (Kuliner, Jasa, Kelontong) dengan tautan kontak WhatsApp langsung.',
    icon: ShoppingBag,
    iconBox: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  },
  {
    href: '/dashboard/17an',
    title: 'Agenda 17an RW 012',
    desc: 'Jadwal lomba, bagan pertandingan, informasi penting, dan proposal kegiatan hingga malam puncak.',
    icon: Trophy,
    iconBox: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  },
];

const OTHER_FEATURES: { href: string; title: string; desc: string; icon: Icon }[] = [
  { href: '/dashboard/kegiatan', title: 'Agenda Kegiatan', desc: 'Jadwal kegiatan RT dan RW 012.', icon: Calendar },
  { href: '/dashboard/pengumuman', title: 'Pengumuman', desc: 'Informasi dan pengumuman resmi untuk warga.', icon: Megaphone },
  { href: '/dashboard/surat', title: 'Layanan Surat', desc: 'Layanan surat menyurat RT/RW untuk warga.', icon: FileText },
  { href: '/dashboard/arsip', title: 'Arsip Digital', desc: 'Simpan dan cari dokumen RT/RW secara digital.', icon: FolderArchive },
  { href: '/dashboard/laporan', title: 'Rekap & Export', desc: 'Rekap laporan dan export data ke spreadsheet.', icon: FileSpreadsheet },
  { href: '/dashboard/inventory', title: 'Inventory', desc: 'Data barang milik RT/RW, riwayat, dan peminjaman.', icon: Package },
];

type PublicUmkm = {
  id: string;
  nama_usaha: string;
  pemilik: string;
  deskripsi: string;
  kategori: string;
  whatsapp: string;
  rt?: string;
};

export default function HomePage() {
  const [umkmList, setUmkmList] = useState<PublicUmkm[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/api/umkm/public')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (alive && Array.isArray(d)) setUmkmList(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 space-y-12 sm:space-y-20 pb-16 sm:pb-20">

        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-10 sm:pt-16 pb-16 sm:pb-24 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">

          {/* Subtle Ambient Light Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] sm:h-[350px] bg-emerald-500/10 blur-[90px] sm:blur-[120px] rounded-full pointer-events-none" />

          <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Portal Resmi RW 012 Kelurahan Bahagia</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
                Digitalisasi Administrasi & <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">Transparansi Keuangan</span> RW 012
              </h1>

              <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed font-normal px-2">
                Sistem terpadu layanan warga RW 012: kas & iuran 5 pos keuangan, agenda dan pengumuman, layanan surat, arsip digital, inventory, hingga direktori UMKM lokal.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                <Link
                  href="/dashboard/kas"
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-extrabold rounded-xl sm:rounded-2xl text-sm sm:text-base shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Buka Panel RT / Kas & Iuran</span>
                </Link>

                <Link
                  href="/info"
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl sm:rounded-2xl text-sm sm:text-base border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Megaphone className="w-5 h-5 text-emerald-400" />
                  <span>Pusat Informasi Warga</span>
                </Link>
              </div>

            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16">
              <StatistikPanel className="sm:col-span-2" />
              {HIGHLIGHTS.map((h) => {
                const IconComp = h.icon;
                return (
                  <Link
                    key={h.href}
                    href={h.href}
                    className="group flex flex-col justify-between bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-2xl hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="space-y-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center ${h.iconBox}`}>
                        <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">{h.title}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{h.desc}</p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:gap-2 transition-all">
                      Buka <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>

          </div>
        </section>

        {/* SECTION FITUR LAINNYA */}
        <section className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-6 space-y-6 sm:space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Layanan Digital RW 012
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Fitur Lainnya</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {OTHER_FEATURES.map((f) => {
              const IconComp = f.icon;
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className="group flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/40 transition-all"
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {f.title}
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* SECTION UMKM SHOWCASE */}
        <section className="w-full max-w-[1800px] mx-auto px-3 sm:px-5 lg:px-6 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Pemberdayaan Ekonomi Warga
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">UMKM Unggulan Warga RW 012</h2>
            </div>
            <Link
              href="/umkm"
              className="text-xs sm:text-sm font-bold text-emerald-400 hover:underline flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Lihat Semua Usaha</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {umkmList.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada data UMKM.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {umkmList.map((u) => (
              <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {u.kategori}
                    </span>
                    <span className="text-xs text-slate-400">{u.pemilik}{u.rt ? ' · RT ' + u.rt : ''}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{u.nama_usaha}</h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">{u.deskripsi}</p>
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
