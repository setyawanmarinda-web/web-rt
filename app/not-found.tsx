'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Building2, SearchX, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Decorative Card Container */}
      <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 relative z-10 backdrop-blur-md">
        
        {/* Animated Icon Badge */}
        <div className="relative inline-block">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-slate-800 to-slate-850 border border-slate-700/80 flex items-center justify-center mx-auto text-emerald-400 shadow-xl group">
            <SearchX className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-md">
            404
          </span>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Halaman Tidak Ditemukan</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Waduh! Halaman Ini Tidak Ada
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed px-2">
            Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau alamat URL yang Anda masukkan kurang tepat.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          
          {/* Tombol Kembali ke Halaman Sebelumnya */}
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs sm:text-sm border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>

          {/* Tombol ke Beranda RW 012 */}
          <Link
            href="/"
            className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Beranda RW 012</span>
          </Link>

        </div>

        {/* Footer Brand note */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-500 text-[11px]">
          <Building2 className="w-3.5 h-3.5 text-emerald-500/60" />
          <span>Sistem Informasi & Manajemen RW 012 Kel. Bahagia</span>
        </div>

      </div>
    </div>
  );
}
