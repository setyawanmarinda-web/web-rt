'use client';

import Link from 'next/link';
import { LayoutDashboard, Building2 } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-slate-900/95 backdrop-blur-md text-white shadow-lg">
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-5">
        <div className="flex items-center justify-between h-[4.5rem] sm:h-20">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950" />
            </div>
            <div>
              <div className="font-extrabold text-xl sm:text-3xl tracking-wide leading-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                SIM RW 012
              </div>
              <div className="text-[10px] sm:text-xs text-emerald-400 font-semibold tracking-wider uppercase">
                Kelurahan Bahagia
              </div>
            </div>
          </Link>

          {/* Action Buttons & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/kas"
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm sm:text-base shadow-md hover:shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
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
