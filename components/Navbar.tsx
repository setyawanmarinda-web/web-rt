'use client';

import Link from 'next/link';
import { LayoutDashboard, Building2 } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-slate-900/95 backdrop-blur-md text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg tracking-wide bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                SIM RW 012
              </div>
              <div className="text-[9px] sm:text-[10px] text-emerald-400 font-medium tracking-wider uppercase">
                Kelurahan Bahagia
              </div>
            </div>
          </Link>

          {/* Action Buttons & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/kas"
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden xs:inline">Panel RT</span>
              <span className="xs:hidden">Panel</span>
            </Link>
          </div>

        </div>
      </div>

    </header>
  );
}
