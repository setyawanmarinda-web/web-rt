'use client';

import React from 'react';
import { useSimStore } from '@/lib/store';
import Link from 'next/link';
import { Wallet, Users, Calendar, Megaphone, FileText, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';

export default function DashboardOverviewPage() {
  const { selectedRt, wargaList, kasList, kegiatanList, pengumumanList, getKasSummaryByRt } = useSimStore();

  const summary = getKasSummaryByRt(selectedRt);
  const filteredWarga = selectedRt === 'ALL' ? wargaList : wargaList.filter(w => w.rt === selectedRt);
  const filteredKegiatan = selectedRt === 'ALL' ? kegiatanList : kegiatanList.filter(k => k.rt === selectedRt || k.rt === '012');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Selamat Datang Pengurus RT {selectedRt} / Admin RW 012</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            Ringkasan Administrasi & Financial Panel RT
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            Pantau arus kas 5 pos keuangan secara transparan, pendataan warga, serta agenda kerja bakti & posyandu lingkungan.
          </p>
          
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/kas"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Kelola Kas & Iuran Warga</span>
            </Link>
            <Link
              href="/dashboard/statistik"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Pendataan Warga</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Saldo Kas RT</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mb-1">
            Rp {summary.saldoAkhir.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400">Total Akumulasi 5 Pos Keuangan</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Warga Terdata</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {filteredWarga.length} KK / Jiwa
          </div>
          <p className="text-xs text-slate-400">RT {selectedRt} Kelurahan Bahagia</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Agenda Kegiatan</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {filteredKegiatan.length} Acara
          </div>
          <p className="text-xs text-slate-400">Kerja bakti & Rapat RT</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pos Satpam & Sampah</span>
            <ShieldCheck className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white mb-1">
            Rp {(summary['Satpam & Sampah'] || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-400">Terhitung dari Iuran Wajib</p>
        </div>

      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Mutasi Terakhir Kas RT {selectedRt}</h2>
            <Link href="/dashboard/kas" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {kasList.slice(0, 4).map((k) => (
              <div key={k.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block">{k.pos}</span>
                  <span className="text-slate-400 truncate block max-w-xs">{k.keterangan}</span>
                </div>
                <span className={`font-mono font-bold whitespace-nowrap ${k.jenis === 'Masuk' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {k.jenis === 'Masuk' ? '+' : '-'} Rp {Number(k.jumlah).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Pengumuman & Agenda Terdekat</h2>
            <Link href="/dashboard/kegiatan" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
              <span>Lihat Agenda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {filteredKegiatan.slice(0, 3).map((g) => (
              <div key={g.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{g.judul}</span>
                  <span className="text-emerald-400 font-mono">{g.tanggal}</span>
                </div>
                <p className="text-xs text-slate-400">{g.deskripsi}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
