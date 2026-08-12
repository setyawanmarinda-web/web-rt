'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSimStore } from '@/lib/store';
import Link from 'next/link';
import { ArrowLeft, Bell, Search, Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedRt, setSelectedRt } = useSimStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        selectedRt={selectedRt}
        onRtChange={setSelectedRt}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top bar Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            
            {/* Mobile Hamburger Toggle for Dashboard Sidebar */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors bg-slate-800/80 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ke Halaman Publik RW</span>
              <span className="sm:hidden">Publik</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                RT {selectedRt}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-400 text-xs w-56">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Cari transaksi / warga..."
                className="bg-transparent text-white focus:outline-none w-full"
              />
            </div>
            
            <button className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
