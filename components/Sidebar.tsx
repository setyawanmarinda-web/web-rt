'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wallet, Users, Calendar, Megaphone, ShoppingBag,
  BarChart3, FolderArchive, FileText, FileSpreadsheet, Settings,
  Building2, ChevronRight, Shield
} from 'lucide-react';

interface SidebarProps {
  selectedRt: string;
  onRtChange: (rt: string) => void;
}

export default function Sidebar({ selectedRt, onRtChange }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard/kas', label: 'Kas & Iuran Warga', icon: Wallet, badge: 'Pos Split' },
    { href: '/dashboard/kegiatan', label: 'Agenda Kegiatan', icon: Calendar },
    { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: Megaphone },
    { href: '/dashboard/umkm', label: 'Direktori UMKM', icon: ShoppingBag },
    { href: '/dashboard/statistik', label: 'Statistik Warga', icon: BarChart3 },
    { href: '/dashboard/surat', label: 'Layanan Surat', icon: FileText },
    { href: '/dashboard/arsip', label: 'Arsip Digital', icon: FolderArchive },
    { href: '/dashboard/laporan', label: 'Rekap & Export', icon: FileSpreadsheet },
    { href: '/dashboard/pengaturan', label: 'Pengaturan System', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm tracking-wide">Panel RT & RW 012</h2>
          <p className="text-xs text-emerald-400 font-medium">Kelurahan Bahagia</p>
        </div>
      </div>

      {/* Selector RT active scope */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Scope RT Aktif:
        </label>
        <select
          value={selectedRt}
          onChange={(e) => onRtChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer transition-colors"
        >
          <option value="002">RT 002 (Default Focus)</option>
          <option value="001">RT 001</option>
          <option value="003">RT 003</option>
          <option value="004">RT 004</option>
          <option value="005">RT 005</option>
          <option value="ALL">Gabungan Semua RT (Admin RW)</option>
        </select>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Profile Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
            RT
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Pengurus RT {selectedRt}</p>
            <p className="text-[11px] text-slate-400 truncate">Hak Akses: Pengurus RT</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
