import Link from 'next/link';
import { Building2, Heart, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Building2 className="w-5 h-5 text-slate-950" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-wide">
                SIM RW 012 Kel. Bahagia
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Sistem Informasi & Manajemen RW 012 terpadu untuk digitalisasi layanan kependudukan, transparansi pencatatan iuran keuangan per pos, serta pemberdayaan UMKM lokal secara akuntabel.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Navigasi Utama</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-emerald-400 transition-colors">Beranda Utama</Link></li>
              <li><Link href="/info" className="hover:text-emerald-400 transition-colors">Pusat Informasi Warga</Link></li>
              <li><Link href="/dashboard/kas" className="hover:text-emerald-400 transition-colors">Panel RT / Kas & Iuran</Link></li>
              <li><Link href="/dashboard/statistik" className="hover:text-emerald-400 transition-colors">Statistik Kependudukan</Link></li>
              <li><Link href="/dashboard/umkm" className="hover:text-emerald-400 transition-colors">Direktori UMKM</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Sekretariat RW 012</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                <span>Balai Warga RW 012, Jl. Bahagia Raya No. 12, Kel. Bahagia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>+62 812-3456-7890 (Pengurus RW)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>sekretariat@rw012bahagia.id</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SIM RW 012 Kelurahan Bahagia. All Rights Reserved.</p>
          <div className="flex items-center gap-1">
            <span>Dikelola secara transparan oleh Pengurus RW 012 & RT 001 - 006</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
