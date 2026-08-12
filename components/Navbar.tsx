'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Info, ShoppingBag, LayoutDashboard, ShieldCheck, Building2 } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Beranda RW 012', icon: Home },
    { href: '/info', label: 'Pusat Informasi', icon: Info },
    { href: '/dashboard/umkm', label: 'UMKM Warga', icon: ShoppingBag },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-slate-900/90 backdrop-blur-md text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-wide bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                SIM RW 012
              </div>
              <div className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">
                Kelurahan Bahagia
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Dashboard Quick Access CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/kas"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-sm shadow-md hover:shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Panel RT / Dashboard</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
